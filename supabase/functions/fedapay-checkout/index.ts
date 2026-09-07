import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

const PLAN_CONFIG: Record<string, { name: string; amount: number }> = {
  essentiel: { name: "Essentiel", amount: 1000 },
  intensif: { name: "Intensif", amount: 3000 },
  premium: { name: "Premium", amount: 5000 }
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const authHeader = req.headers.get("Authorization");

    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "unauthorized", message: "Authentification requise." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Valider l'utilisateur
    const supabaseUser = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
      global: { headers: { Authorization: authHeader } }
    });
    const { data: { user }, error: userErr } = await supabaseUser.auth.getUser();

    if (userErr || !user) {
      return new Response(
        JSON.stringify({ error: "unauthorized", message: "Token utilisateur invalide." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json().catch(() => ({}));
    const plan = (body.plan || "").toLowerCase().trim();
    const planConfig = PLAN_CONFIG[plan];

    if (!planConfig) {
      return new Response(
        JSON.stringify({ error: "invalid_plan", message: "Plan d'abonnement invalide (essentiel, intensif, premium requis)." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const returnUrl = body.return_url || "https://revizo-nine.vercel.app";
    const fedapaySecretKey = Deno.env.get("FEDAPAY_SECRET_KEY") || "";
    const isLive = fedapaySecretKey.startsWith("sk_live");
    const baseUrl = isLive ? "https://api.fedapay.com/v1" : "https://sandbox-api.fedapay.com/v1";

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRole);

    // Si aucune clé FedaPay réelle n'est encore configurée, mode bac à sable simulé
    if (!fedapaySecretKey || fedapaySecretKey === "mock_key") {
      const mockTxId = `feda_sim_${Date.now()}`;
      const mockCheckoutUrl = `${returnUrl}?payment=success&tx_id=${mockTxId}&plan=${plan}&mode=simulated`;

      await supabaseAdmin.from("payment_transactions").insert({
        user_id: user.id,
        plan,
        amount_fcfa: planConfig.amount,
        currency: "XOF",
        fedapay_transaction_id: mockTxId,
        status: "pending",
        checkout_url: mockCheckoutUrl,
        metadata: { simulated: true, environment: "sandbox_simulated" }
      });

      return new Response(
        JSON.stringify({
          success: true,
          simulated: true,
          checkout_url: mockCheckoutUrl,
          transaction_id: mockTxId,
          message: "Mode simulation FedaPay : clé secrète en attente de configuration."
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Appel API FedaPay pour créer la transaction
    const customer = body.customer || {};
    const fullName = user.user_metadata?.full_name || "Élève REVIZO";
    const nameParts = fullName.trim().split(" ");
    const firstname = customer.firstname || nameParts[0] || "Élève";
    const lastname = customer.lastname || nameParts.slice(1).join(" ") || "REVIZO";
    const email = user.email || customer.email || "eleve@revizo.app";

    const txPayload: any = {
      description: `Abonnement REVIZO ${planConfig.name} (1 mois)`,
      amount: planConfig.amount,
      currency: { iso: "XOF" },
      callback_url: `${returnUrl}?payment=callback&plan=${plan}`,
      customer: {
        firstname,
        lastname,
        email
      },
      custom_metadata: {
        user_id: user.id,
        plan,
        app: "REVIZO"
      }
    };

    if (customer.phone_number) {
      txPayload.customer.phone_number = customer.phone_number;
    }

    const txResp = await fetch(`${baseUrl}/transactions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${fedapaySecretKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(txPayload)
    });

    if (!txResp.ok) {
      const errBody = await txResp.text();
      console.error("FedaPay Transaction Create Error:", errBody);
      return new Response(
        JSON.stringify({
          error: "fedapay_error",
          message: "Erreur lors de l'initialisation du paiement FedaPay.",
          details: errBody
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const txData = await txResp.json();
    const transaction = txData["v1/transaction"] || txData.transaction || txData;
    const txId = transaction.id;

    // 3. Générer le token de paiement / URL Checkout FedaPay
    const tokenResp = await fetch(`${baseUrl}/transactions/${txId}/token`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${fedapaySecretKey}`,
        "Content-Type": "application/json"
      }
    });

    if (!tokenResp.ok) {
      const tokenErr = await tokenResp.text();
      console.error("FedaPay Token Error:", tokenErr);
      return new Response(
        JSON.stringify({
          error: "fedapay_token_error",
          message: "Erreur lors de la génération du lien de paiement sécurisé.",
          details: tokenErr
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const tokenData = await tokenResp.json();
    const checkoutUrl = tokenData.url;
    const token = tokenData.token;

    // 4. Enregistrer la transaction en attente dans Supabase
    await supabaseAdmin.from("payment_transactions").insert({
      user_id: user.id,
      plan,
      amount_fcfa: planConfig.amount,
      currency: "XOF",
      fedapay_transaction_id: String(txId),
      status: "pending",
      checkout_url: checkoutUrl,
      metadata: {
        token,
        environment: isLive ? "live" : "sandbox",
        customer_email: email
      }
    });

    return new Response(
      JSON.stringify({
        success: true,
        checkout_url: checkoutUrl,
        token,
        transaction_id: String(txId),
        plan,
        amount: planConfig.amount
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Unexpected checkout error:", error);
    return new Response(
      JSON.stringify({ error: "internal_error", message: error.message || "Erreur serveur inattendue." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
