import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-fedapay-signature",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const fedapaySecretKey = Deno.env.get("FEDAPAY_SECRET_KEY") || "";
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRole);

    const body = await req.json().catch(() => ({}));
    console.log("FedaPay Webhook Event Received:", JSON.stringify(body));

    // FedaPay transmet l'entité transaction soit dans body.entity, soit dans body["v1/transaction"]
    const entity = body.entity || body["v1/transaction"] || body.transaction || body;
    const eventName = body.name || body.event || "";
    const txId = String(entity.id || body.id || "");
    const status = (entity.status || body.status || "").toLowerCase();

    if (!txId) {
      return new Response(
        JSON.stringify({ error: "missing_transaction_id", message: "Transaction ID manquant." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Si une clé secrète FedaPay est configurée, double-vérification directe auprès de l'API FedaPay
    let confirmedStatus = status;
    let paymentMode = entity.mode || "mobile_money";

    if (fedapaySecretKey && !fedapaySecretKey.startsWith("mock")) {
      const isLive = fedapaySecretKey.startsWith("sk_live");
      const baseUrl = isLive ? "https://api.fedapay.com/v1" : "https://sandbox-api.fedapay.com/v1";

      try {
        const verifyResp = await fetch(`${baseUrl}/transactions/${txId}`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${fedapaySecretKey}`,
            "Content-Type": "application/json"
          }
        });

        if (verifyResp.ok) {
          const verifyData = await verifyResp.json();
          const verifiedEntity = verifyData["v1/transaction"] || verifyData.transaction || verifyData;
          confirmedStatus = (verifiedEntity.status || "").toLowerCase();
          paymentMode = verifiedEntity.mode || paymentMode;
        }
      } catch (verifyErr) {
        console.warn("Could not re-verify with FedaPay API, relying on webhook payload:", verifyErr);
      }
    }

    // Retrouver la transaction locale
    const { data: existingTx } = await supabaseAdmin
      .from("payment_transactions")
      .select("*")
      .eq("fedapay_transaction_id", txId)
      .maybeSingle();

    const userId = entity.custom_metadata?.user_id || existingTx?.user_id;
    const plan = entity.custom_metadata?.plan || existingTx?.plan;

    if (!userId || !plan) {
      console.warn("Could not determine user_id or plan for transaction:", txId);
      return new Response(
        JSON.stringify({ received: true, warning: "missing_user_context" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Traitement selon le statut FedaPay
    if (confirmedStatus === "approved" || eventName === "transaction.approved") {
      console.log(`Paiement FedaPay approuvé pour l'utilisateur ${userId}, plan ${plan}`);

      // 1. Activer l'abonnement dans Supabase (30 jours, énergie, diamants)
      const { data: actRes, error: actErr } = await supabaseAdmin.rpc("activate_subscription", {
        p_user_id: userId,
        p_plan: plan,
        p_payment_provider: "fedapay",
        p_external_id: `feda_${txId}`
      });

      if (actErr) {
        console.error("Erreur lors de l'activation de l'abonnement via RPC:", actErr);
      }

      // 2. Déclencher la récompense de parrainage si applicable (+10 💎 au parrain)
      const { error: refErr } = await supabaseAdmin.rpc("process_referral_reward_on_payment", {
        p_referee_id: userId
      });

      if (refErr) {
        console.error("Erreur lors de l'octroi de la récompense parrainage:", refErr);
      }

      // 3. Mettre à jour l'enregistrement dans payment_transactions
      await supabaseAdmin
        .from("payment_transactions")
        .update({
          status: "approved",
          payment_method: paymentMode,
          updated_at: new Date().toISOString()
        })
        .eq("fedapay_transaction_id", txId);

      return new Response(
        JSON.stringify({
          received: true,
          status: "approved",
          user_id: userId,
          plan,
          economy_state: actRes
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else if (confirmedStatus === "declined" || confirmedStatus === "canceled") {
      await supabaseAdmin
        .from("payment_transactions")
        .update({
          status: confirmedStatus,
          payment_method: paymentMode,
          updated_at: new Date().toISOString()
        })
        .eq("fedapay_transaction_id", txId);

      return new Response(
        JSON.stringify({ received: true, status: confirmedStatus }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ received: true, status: confirmedStatus }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Webhook processing error:", error);
    return new Response(
      JSON.stringify({ error: "internal_error", message: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
