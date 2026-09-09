import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

// Schéma JSON strict pour Structured Output Gemini (Pipeline Pédagogique Enrichi V2)
const GEMINI_PEDAGOGICAL_SCHEMA = {
  type: "OBJECT",
  properties: {
    identity: {
      type: "OBJECT",
      properties: {
        title: { type: "STRING" },
        subject: { type: "STRING" },
        schoolLevel: { type: "STRING" },
        language: { type: "STRING" }
      },
      required: ["title", "subject", "schoolLevel", "language"]
    },
    understanding: {
      type: "OBJECT",
      properties: {
        coursePurpose: { type: "STRING" },
        centralIdea: { type: "STRING" },
        learningObjectives: { type: "ARRAY", items: { type: "STRING" } },
        prerequisites: { type: "ARRAY", items: { type: "STRING" } }
      },
      required: ["coursePurpose", "centralIdea", "learningObjectives", "prerequisites"]
    },
    concepts: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          id: { type: "STRING" },
          name: { type: "STRING" },
          definition: { type: "STRING" },
          explanation: { type: "STRING" },
          importance: { type: "STRING", enum: ["essential", "important", "useful", "contextual"] },
          difficulty: { type: "INTEGER" },
          keyPoints: { type: "ARRAY", items: { type: "STRING" } },
          rulesFormulas: { type: "STRING" },
          semanticAliases: { type: "ARRAY", items: { type: "STRING" } },
          sourceReferences: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                page: { type: "INTEGER" },
                section: { type: "STRING" }
              }
            }
          }
        },
        required: ["id", "name", "definition", "explanation", "importance", "difficulty", "keyPoints", "sourceReferences"]
      }
    },
    mustMemorize: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          conceptId: { type: "STRING" },
          item: { type: "STRING" },
          reason: { type: "STRING" },
          priority: { type: "STRING", enum: ["essential", "important", "useful", "contextual"] },
          sourceReferences: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                page: { type: "INTEGER" },
                section: { type: "STRING" }
              }
            }
          }
        },
        required: ["conceptId", "item", "reason", "priority", "sourceReferences"]
      }
    },
    revision: {
      type: "OBJECT",
      properties: {
        title: { type: "STRING" },
        essentialSummary: { type: "STRING" },
        fundamentalNotions: { type: "ARRAY", items: { type: "STRING" } },
        keyPoints: { type: "ARRAY", items: { type: "STRING" } },
        sections: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              id: { type: "STRING" },
              conceptId: { type: "STRING" },
              title: { type: "STRING" },
              subtitle: { type: "STRING" },
              presentationFormat: {
                type: "STRING",
                enum: ["definition_directe", "question_reponse", "mise_en_situation", "comparaison_avant_apres"]
              },
              simpleExplanation: { type: "STRING" },
              technicalFormulation: { type: "STRING" },
              analogyOrExample: { type: "STRING" },
              mnemonicTip: { type: "STRING" },
              commonMistake: { type: "STRING" },
              keyTakeaways: { type: "ARRAY", items: { type: "STRING" } },
              sourceReferences: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    page: { type: "INTEGER" },
                    section: { type: "STRING" }
                  }
                }
              }
            },
            required: ["id", "conceptId", "title", "subtitle", "presentationFormat", "simpleExplanation", "keyTakeaways", "sourceReferences"]
          }
        },
        methods: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              name: { type: "STRING" },
              steps: { type: "ARRAY", items: { type: "STRING" } }
            },
            required: ["name", "steps"]
          }
        },
        formulas: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              expression: { type: "STRING" },
              meaning: { type: "STRING" }
            },
            required: ["expression", "meaning"]
          }
        },
        examples: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              statement: { type: "STRING" },
              explanation: { type: "STRING" }
            },
            required: ["statement", "explanation"]
          }
        },
        commonPitfalls: { type: "ARRAY", items: { type: "STRING" } },
        memorizationChecklist: { type: "ARRAY", items: { type: "STRING" } }
      },
      required: ["title", "essentialSummary", "fundamentalNotions", "keyPoints", "sections", "methods", "formulas", "examples", "commonPitfalls", "memorizationChecklist"]
    },
    comprehensionQuestions: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          id: { type: "STRING" },
          conceptId: { type: "STRING" },
          questionCategory: {
            type: "STRING",
            enum: ["rappel_direct", "application_concrete", "piege_confusion", "mise_en_situation"]
          },
          question: { type: "STRING" },
          expectedAnswer: { type: "STRING" },
          explanation: { type: "STRING" },
          sourceReferences: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                page: { type: "INTEGER" },
                section: { type: "STRING" }
              }
            }
          }
        },
        required: ["id", "conceptId", "question", "expectedAnswer", "explanation", "sourceReferences"]
      }
    },
    quizPlan: {
      type: "OBJECT",
      properties: {
        title: { type: "STRING" },
        quizzes: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              id: { type: "STRING" },
              title: { type: "STRING" },
              session: { type: "STRING" },
              difficulty: { type: "STRING", enum: ["Facile", "Moyen", "Difficile"] },
              purpose: { type: "STRING" },
              conceptIds: { type: "ARRAY", items: { type: "STRING" } },
              questions: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    id: { type: "STRING" },
                    conceptId: { type: "STRING" },
                    questionCategory: {
                      type: "STRING",
                      enum: ["rappel_direct", "application_concrete", "piege_confusion", "mise_en_situation"]
                    },
                    type: { type: "STRING", enum: ["qcm", "true_false"] },
                    question: { type: "STRING" },
                    options: { type: "ARRAY", items: { type: "STRING" } },
                    correctAnswer: { type: "STRING" },
                    explanation: { type: "STRING" },
                    difficulty: { type: "INTEGER" },
                    sourceReferences: {
                      type: "ARRAY",
                      items: {
                        type: "OBJECT",
                        properties: {
                          page: { type: "INTEGER" },
                          section: { type: "STRING" }
                        }
                      }
                    }
                  },
                  required: ["id", "conceptId", "type", "question", "options", "correctAnswer", "explanation", "difficulty", "sourceReferences"]
                }
              }
            },
            required: ["id", "title", "session", "difficulty", "purpose", "conceptIds", "questions"]
          }
        }
      },
      required: ["title", "quizzes"]
    },
    exercises: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          id: { type: "STRING" },
          conceptId: { type: "STRING" },
          exerciseType: {
            type: "STRING",
            enum: ["application_directe", "cas_pratique", "analyse_piege", "resolution_probleme"]
          },
          statement: { type: "STRING" },
          instructions: { type: "STRING" },
          expectedMethod: { type: "STRING" },
          correction: { type: "STRING" },
          difficulty: { type: "INTEGER" },
          sourceReferences: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                page: { type: "INTEGER" },
                section: { type: "STRING" }
              }
            }
          }
        },
        required: ["id", "conceptId", "statement", "instructions", "correction", "difficulty", "sourceReferences"]
      }
    }
  },
  required: ["identity", "understanding", "concepts", "mustMemorize", "revision", "comprehensionQuestions", "quizPlan", "exercises"]
};

// Retry helper avec backoff adapté au RPM réel de 5 (1 requête / 12s) et support du header Retry-After
async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 3): Promise<Response> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, options);

      // Gestion spécifique du code HTTP 429 (Rate limit RPM ou quota dépassé)
      if (res.status === 429) {
        if (attempt === maxRetries) return res;

        // Vérifier si Google fournit un header Retry-After
        const retryAfterHeader = res.headers.get("retry-after");
        let delayMs = 12000 * attempt; // Avec 5 RPM, il faut au moins 12s pour libérer 1 slot de la fenêtre glissante
        if (retryAfterHeader) {
          const parsed = parseInt(retryAfterHeader, 10);
          if (!isNaN(parsed) && parsed > 0) {
            delayMs = Math.max(parsed * 1000, 12000);
          }
        }
        // Jitter aléatoire (+ 500ms à 1500ms) pour éviter les collisions simultanées
        const jitter = Math.floor(Math.random() * 1000) + 500;
        const totalDelay = delayMs + jitter;

        console.warn(`[Retry 429 ${attempt}/${maxRetries}] Débit saturé (limite 5 RPM). Pause de ${(totalDelay / 1000).toFixed(1)}s avant réessai...`);
        await new Promise(r => setTimeout(r, totalDelay));
        continue;
      }

      // Gestion des erreurs serveur transitoires 5xx (500, 502, 503, 504)
      if (res.status >= 500 && res.status < 600) {
        if (attempt === maxRetries) return res;
        const delayMs = 2000 * Math.pow(2, attempt - 1); // 2s, 4s
        console.warn(`[Retry 5xx ${attempt}/${maxRetries}] Erreur serveur ${res.status}. Pause de ${delayMs}ms...`);
        await new Promise(r => setTimeout(r, delayMs));
        continue;
      }

      return res;
    } catch (err: any) {
      if (attempt === maxRetries) throw err;
      const delayMs = 2000 * Math.pow(2, attempt - 1);
      console.warn(`[Retry Réseau ${attempt}/${maxRetries}] Erreur réseau : ${err?.message}. Pause de ${delayMs}ms...`);
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
  throw new Error("Maximum retries reached");
}

function importanceToSmallint(imp: string): number {
  switch (imp) {
    case "essential": return 1;
    case "important": return 2;
    case "useful": return 3;
    case "contextual": return 4;
    default: return 2;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Session expirée ou non autorisée." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY") ?? "";

    if (!geminiApiKey) {
      return new Response(JSON.stringify({ error: "Configuration serveur IA manquante." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Valider le token utilisateur et récupérer userId
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Utilisateur non authentifié." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const userId = user.id;
    const body = await req.json();
    const {
      courseId,
      title: inputTitle,
      subjectName: inputSubject,
      fileBase64,
      mimeType,
      rawText,
      pageCount
    } = body;

    if (!courseId) {
      return new Response(JSON.stringify({ error: "Paramètre courseId obligatoire." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    if (!fileBase64 && !rawText) {
      return new Response(JSON.stringify({ error: "Aucun contenu de cours fourni." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // GARDE-FOU VOLUME : Limite stricte de 20 pages par révision pour garantir une qualité optimale à 100%
    if (pageCount && pageCount > 20) {
      return new Response(JSON.stringify({
        error: `Ce cours fait ${pageCount} pages et dépasse la limite de 20 pages par révision. Découpe-le en chapitres pour garantir une révision complète, ultra-précise et sans omission.`,
        tooManyPages: true,
        pageCount,
        maxPages: 20
      }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // CONTRÔLE SERVEUR STRICT DU QUOTA ET DE L'ESSAI GRATUIT (1 SEUL IMPORT À VIE POUR LES NON-ABONNÉS)
    const { data: usageCheck, error: usageErr } = await userClient.rpc("record_revision_usage", {
      p_user_id: userId
    });

    if (usageErr) {
      console.error("Avertissement quota révision:", usageErr);
    } else if (usageCheck && !usageCheck.allowed) {
      const isTrialExhausted = usageCheck.trialExhausted || usageCheck.error === "free_trial_exhausted";
      return new Response(JSON.stringify({
        error: usageCheck.message || "Tu as atteint ta limite de révisions du jour. Ton compteur sera réinitialisé demain.",
        quotaReached: true,
        trialExhausted: isTrialExhausted,
        plan: usageCheck.plan || null,
        limit: usageCheck.limit,
        used: usageCheck.used,
        canUpgrade: usageCheck.canUpgrade ?? (usageCheck.plan !== 'premium'),
        upgradeTarget: usageCheck.upgradeTarget ?? (usageCheck.plan === 'essentiel' ? 'pro_or_premium' : usageCheck.plan === 'intensif' ? 'premium' : null)
      }), {
        status: isTrialExhausted ? 403 : 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // GARDE-FOU CÔTÉ APPLICATION : Limite globale Free Tier Gemini (bloque à 90% de 20 requêtes/jour = 18)
    const { data: globalUsage, error: globalErr } = await userClient.rpc("check_global_ai_daily_limit", {
      p_safe_limit: 18
    });

    if (globalErr) {
      console.warn("Avertissement vérification quota global AI:", globalErr);
    } else if (globalUsage && !globalUsage.allowed) {
      return new Response(JSON.stringify({
        error: "Le quota d'analyses quotidien pour la phase de test a été atteint (18/20 cours). Les analyses reprendront demain dès minuit.",
        globalQuotaReached: true,
        limit: globalUsage.limit,
        used: globalUsage.used
      }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Préparer les parts multimodales pour Gemini
    const parts: any[] = [];

    if (fileBase64 && mimeType) {
      parts.push({
        inlineData: {
          mimeType: mimeType,
          data: fileBase64
        }
      });
    }

    const courseContextPrompt = rawText
      ? `Voici le texte complet du cours à analyser :\n"""\n${rawText}\n"""`
      : `Analyse le document ci-joint (PDF / Photo de cours) dans sa globalité.`;

    const instructionsPrompt = `${courseContextPrompt}

${inputTitle ? `Titre suggéré : "${inputTitle}". ` : ""}${inputSubject ? `Matière suggérée : "${inputSubject}". ` : ""}

PIPELINE PÉDAGOGIQUE REVIZO 2.0 (DIRECTIVES OBLIGATOIRES) :

1. DÉDUPLICATION SÉMANTIQUE STRICTE :
   - Extrais et fusionne les concepts : si une même notion apparaît plusieurs fois dans le cours source (rappel au début, exemple au milieu, résumé à la fin), produis UNE SEULE entrée dans concepts[].
   - La déduplication est sémantique (même sens sous des formulations différentes), pas seulement textuelle.
   - Conserve et agrège TOUTES les sourceReferences (toutes les pages/sections où la notion apparaît).
   - Renseigne les variantes ou synonymes dans semanticAliases[].

2. RICHESSE ET SIMPLICITÉ DE LA FICHE DE RÉVISION (sections[]) :
   - Chaque notion "essential" et "important" du cours source DOIT avoir sa section dédiée, sans aucune omission.
   - Sous-titre court et clair (subtitle) : pas de jargon académique intimidant (ex: "Pourquoi ça marche", "La règle d'or").
   - Explication en langage simple (simpleExplanation) : explique la notion avec des mots courants, limpides, comme si tu l'expliquais à un ami, avant toute formalisation technique.
   - Formulation technique (technicalFormulation) : définition ou formulation scientifique/académique rigoureuse.
   - Analogie concrète (analogyOrExample) : comparaison imagée de la vie courante pour ancrer la notion dans le réel.
   - Astuce mémo (mnemonicTip) : moyen mnémotechnique, phrase d'accroche ou astuce de mémorisation dès que pertinent.
   - ⚠️ Piège fréquent (commonMistake) : encart signalant l'erreur classique ou la confusion fréquente à éviter.
   - Points clés (keyTakeaways[]) : 2 à 3 points synthétiques et percutants.

3. LUTTER CONTRE L'ENNUI (presentationFormat) :
   - Alterne impérativement la structure d'une section à l'autre selon 4 formats tournants :
     * "definition_directe" : approche frontale limpide, définition suivie d'exemples.
     * "question_reponse" : question rhétorique intrigante que l'élève se pose, suivie de la réponse lumineuse.
     * "mise_en_situation" : mini-scénario ou cas pratique concret introduisant le besoin de la règle.
     * "comparaison_avant_apres" : contraste entre "Ce qu'on croit souvent" vs "Ce qui est vrai".
   - Ne jamais enchaîner deux sections consécutives avec le même presentationFormat.

4. DÉRIVATION EN CASCADE (ANTI-DOUBLON GLOBAL) :
   - Les questions de compréhension (comprehensionQuestions), les QCM (quizPlan.quizzes[].questions) et les exercices (exercises) DOIVENT découler STRICTEMENT des concepts déjà dédupliqués (renseigne impérativement conceptId).
   - Aucune notion ne doit être testée deux fois sous le même angle ou avec la même formulation dans des formats différents.

5. VARIÉTÉ DES QUESTIONS :
   - Alterne les types de questions (questionCategory) :
     * "rappel_direct" : vérification de la mémoire d'un terme clé ou d'une règle.
     * "application_concrete" : calcul, phrase à compléter ou cas pratique chiffré.
     * "piege_confusion" : question ciblée sur l'erreur classique ou la confusion fréquente.
     * "mise_en_situation" : scénario réaliste demandant de choisir la bonne interprétation.

6. RÈGLE CARDINALE DE SÉCURITÉ & FIDÉLITÉ :
   - Zéro invention ou hallucination d'information absente du document source.
   - Tous les éléments doivent comporter des sourceReferences précises.`;

    parts.push({ text: instructionsPrompt });

    const systemInstruction = `Tu es le moteur pédagogique central de REVIZO.
Ta mission est d'effectuer l'analyse intellectuelle complète du cours fourni par l'élève, de déterminer ce qu'il doit retenir, de synthétiser une fiche de révision captivante, riche, claire et sans aucun doublon, puis de générer des questions de vérification, des quiz espacés et des exercices pratiques.
RÈGLES MAÎTRESSES :
1. Déduplication sémantique stricte de tous les concepts (conservation de toutes les sourceReferences).
2. Fiche de révision riche, engageante et accessible : sous-titre sans jargon, explication amicale d'abord, analogie concrète, astuce mémo, piège fréquent, exhaustivité sur notions essentielles et importantes.
3. Rotation des 4 formats de présentation (définition directe, question-réponse, mise en situation, comparaison avant-après).
4. Dérivation en cascade : questions, quiz et exercices reliés directement aux conceptId dédupliqués sans aucune redondance.
5. Variété des types de questions (rappel direct, application concrète, piège/confusion, mise en situation).
6. Zéro invention d'information absente du document.
Tu réponds exclusivement en JSON structuré strict conforme au schéma demandé.`;

    const payload = {
      systemInstruction: {
        parts: [{ text: systemInstruction }]
      },
      contents: [
        {
          role: "user",
          parts: parts
        }
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: GEMINI_PEDAGOGICAL_SCHEMA
      }
    };

    // Appeler l'API Gemini Flash avec gestion de version et retries (priorité Flash-Lite économique)
    const candidateModels = ["gemini-3.5-flash-lite", "gemini-flash-lite-latest", "gemini-3.6-flash"];
    let geminiResponse: Response | null = null;
    let selectedModel = "";

    for (const model of candidateModels) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`;
      try {
        const res = await fetchWithRetry(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (res.status === 404) {
          // Modèle déprécié ou indisponible, tester le candidat suivant
          continue;
        }

        geminiResponse = res;
        selectedModel = model;
        break;
      } catch (err) {
        // Erreur réseau ou timeout
      }
    }

    if (!geminiResponse || !geminiResponse.ok) {
      const errText = geminiResponse ? await geminiResponse.text() : "Timeout";
      // Détecter si la photo est floue / illisible
      if (mimeType?.startsWith("image/") && (errText.includes("unreadable") || errText.includes("clarity"))) {
        return new Response(JSON.stringify({
          error: "La photo n'est pas assez claire pour être analysée. Essaie avec une photo plus nette."
        }), {
          status: 422,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // En cas de saturation du service ou quota Gemini dépassé (429) après tous les retries
      if (geminiResponse?.status === 429 || errText.includes("429") || errText.includes("RESOURCE_EXHAUSTED") || errText.includes("quota")) {
        return new Response(JSON.stringify({
          error: "Le service est très demandé, réessaie dans quelques instants."
        }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      return new Response(JSON.stringify({
        error: "Nous n'avons pas réussi à analyser ton cours. Réessaie dans quelques instants."
      }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const geminiData = await geminiResponse.json();
    const candidateParts = geminiData.candidates?.[0]?.content?.parts || [];
    
    // Filtrer le raisonnement interne de Gemini (ne jamais l'exposer à l'élève)
    const textPart = candidateParts.find((p: any) => !p.thought);

    if (!textPart || !textPart.text) {
      return new Response(JSON.stringify({
        error: "Nous n'avons pas réussi à analyser ton cours. Réessaie dans quelques instants."
      }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Validation structurelle du JSON
    let parsed: any;
    try {
      parsed = JSON.parse(textPart.text);
    } catch {
      return new Response(JSON.stringify({
        error: "Nous n'avons pas réussi à analyser ton cours. Réessaie dans quelques instants."
      }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Validation référentielle et anti-hallucination
    const conceptMap = new Map<string, any>();
    if (!Array.isArray(parsed.concepts) || parsed.concepts.length === 0) {
      return new Response(JSON.stringify({
        error: "Le document ne contient pas assez d'éléments pédagogiques structurés."
      }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    parsed.concepts.forEach((c: any) => conceptMap.set(c.id, c));

    // Filtrer ou vérifier la cohérence des conceptId dans les questions, quiz et exercices
    const validQuestions = (parsed.comprehensionQuestions || []).filter((q: any) => {
      return (!q.conceptId || conceptMap.has(q.conceptId)) && q.sourceReferences?.length > 0;
    });

    const validExercises = (parsed.exercises || []).filter((ex: any) => {
      return (!ex.conceptId || conceptMap.has(ex.conceptId)) && ex.sourceReferences?.length > 0;
    });

    const validQuizzes = (parsed.quizPlan?.quizzes || []).map((qz: any) => ({
      ...qz,
      questions: (qz.questions || []).filter((q: any) => {
        return (!q.conceptId || conceptMap.has(q.conceptId)) && q.sourceReferences?.length > 0;
      })
    })).filter((qz: any) => qz.questions.length > 0);

    // PERSISTANCE DIRECTE DANS SUPABASE AVEC L'UTILISATEUR AUTHENTIFIÉ
    const finalTitle = parsed.identity?.title || inputTitle || "Cours sans titre";
    const finalSubject = parsed.identity?.subject || inputSubject || "Général";
    const subjectId = `subj-${finalSubject.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;
    const summary = parsed.revision?.essentialSummary || parsed.understanding?.coursePurpose || "";
    const nowIso = new Date().toISOString();

    // 1. Mise à jour / Création du Cours
    const coursePayload = {
      id: courseId,
      user_id: userId,
      subject_id: subjectId,
      subject_name: finalSubject,
      title: finalTitle,
      summary: summary,
      difficulty: 2,
      status: "ready",
      concepts_count: parsed.concepts.length,
      progress_pct: 0,
      is_downloaded: false,
      created_at: nowIso,
      updated_at: nowIso
    };

    const { error: courseErr } = await userClient
      .from("courses")
      .upsert(coursePayload);

    if (courseErr) {
      console.error("Course save error:", courseErr);
      return new Response(JSON.stringify({ error: `Erreur enregistrement cours: ${courseErr.message}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // 2. Persistance Analyses
    const analysisId = `analysis-${courseId}`;
    await userClient.from("analyses").upsert({
      id: analysisId,
      course_id: courseId,
      user_id: userId,
      structured_result: parsed,
      model_version: selectedModel,
      status: "completed",
      created_at: nowIso
    });

    // 3. Persistance Concepts
    const conceptIdMapping = new Map<string, string>();
    const conceptsPayload = parsed.concepts.map((c: any, idx: number) => {
      const dbId = `cpt-${courseId}-${idx + 1}`;
      conceptIdMapping.set(c.id, dbId);
      return {
        id: dbId,
        course_id: courseId,
        analysis_id: analysisId,
        user_id: userId,
        name: c.name,
        summary: c.definition || c.explanation,
        importance: importanceToSmallint(c.importance),
        difficulty: c.difficulty || 2,
        mastery_score: 0,
        order_index: idx,
        key_points: c.keyPoints || [],
        rules_formulas: c.rulesFormulas ? [c.rulesFormulas] : null,
        created_at: nowIso
      };
    });

    if (conceptsPayload.length > 0) {
      const { error: cptErr } = await userClient.from("concepts").insert(conceptsPayload);
      if (cptErr) console.error("Concepts insert error:", cptErr);
    }

    // 4. Persistance Révision
    const revisionId = `rev-${courseId}`;
    let revisionSections: any[] = [];

    if (Array.isArray(parsed.revision.sections) && parsed.revision.sections.length > 0) {
      revisionSections = parsed.revision.sections.map((s: any, idx: number) => {
        const parts: string[] = [];
        if (s.subtitle) parts.push(`📌 ${s.subtitle}`);
        if (s.simpleExplanation) parts.push(`💡 En clair :\n${s.simpleExplanation}`);
        if (s.technicalFormulation) parts.push(`📐 Règle & Formulation :\n${s.technicalFormulation}`);
        if (s.analogyOrExample) parts.push(`🌍 Analogie concrète :\n${s.analogyOrExample}`);
        if (s.mnemonicTip) parts.push(`🧠 Astuce Mémo :\n${s.mnemonicTip}`);
        if (s.commonMistake) parts.push(`⚠️ Piège fréquent :\n${s.commonMistake}`);

        const assembledContent = parts.join('\n\n') || s.simpleExplanation || s.content || "Contenu pédagogique";

        return {
          id: s.id || `sec-${courseId}-${idx + 1}`,
          conceptId: (s.conceptId && conceptIdMapping.get(s.conceptId)) || conceptsPayload[idx]?.id || null,
          title: s.title,
          subtitle: s.subtitle || null,
          presentationFormat: s.presentationFormat || 'definition_directe',
          simpleExplanation: s.simpleExplanation || null,
          technicalFormulation: s.technicalFormulation || null,
          analogyOrExample: s.analogyOrExample || null,
          mnemonicTip: s.mnemonicTip || null,
          commonMistake: s.commonMistake || null,
          content: assembledContent,
          keyTakeaways: Array.isArray(s.keyTakeaways) ? s.keyTakeaways : [],
          sourceReferences: Array.isArray(s.sourceReferences) ? s.sourceReferences : [],
          orderIndex: idx,
          order: idx + 1
        };
      });
    } else {
      // Fallback si sections non spécifiées
      revisionSections = [
        {
          id: `sec-${courseId}-1`,
          title: "Résumé Essentiel",
          content: parsed.revision.essentialSummary,
          orderIndex: 0,
          order: 1
        },
        {
          id: `sec-${courseId}-2`,
          title: "Points Clés à Mémoriser",
          content: parsed.revision.keyPoints.join("\n\n• "),
          orderIndex: 1,
          order: 2
        }
      ];

      if (parsed.revision.methods && parsed.revision.methods.length > 0) {
        revisionSections.push({
          id: `sec-${courseId}-3`,
          title: "Méthodes & Procédures",
          content: parsed.revision.methods.map((m: any) => `${m.name} :\n` + m.steps.map((s: string, i: number) => `  ${i + 1}. ${s}`).join("\n")).join("\n\n"),
          orderIndex: 2,
          order: 3
        });
      }

      if (parsed.revision.formulas && parsed.revision.formulas.length > 0) {
        revisionSections.push({
          id: `sec-${courseId}-4`,
          title: "Formules & Règles",
          content: parsed.revision.formulas.map((f: any) => `• ${f.expression} : ${f.meaning}`).join("\n"),
          orderIndex: 3,
          order: 4
        });
      }

      if (parsed.revision.commonPitfalls && parsed.revision.commonPitfalls.length > 0) {
        revisionSections.push({
          id: `sec-${courseId}-5`,
          title: "Pièges Fréquents à Éviter",
          content: parsed.revision.commonPitfalls.map((p: string) => `⚠️ ${p}`).join("\n"),
          orderIndex: 4,
          order: 5
        });
      }

      if (parsed.revision.memorizationChecklist && parsed.revision.memorizationChecklist.length > 0) {
        revisionSections.push({
          id: `sec-${courseId}-6`,
          title: "Checklist de Mémorisation",
          content: parsed.revision.memorizationChecklist.map((c: string) => `[ ] ${c}`).join("\n"),
          orderIndex: 5,
          order: 6
        });
      }
    }

    const { error: revErr } = await userClient.from("revisions").upsert({
      id: revisionId,
      course_id: courseId,
      analysis_id: analysisId,
      user_id: userId,
      title: parsed.revision.title || `Révision : ${finalTitle}`,
      summary: parsed.revision.essentialSummary,
      key_concepts: parsed.concepts.map((c: any) => c.name),
      rules_formulas: parsed.revision.formulas || null,
      sections: revisionSections,
      total_sections: revisionSections.length,
      reading_time_minutes: 5,
      is_downloaded: false,
      created_at: nowIso,
      updated_at: nowIso
    });
    if (revErr) console.error("Revision upsert error:", revErr);

    // 5. Persistance Comprehension Questions
    if (validQuestions.length > 0) {
      const qPayload = validQuestions.map((q: any, idx: number) => ({
        id: `cq-${courseId}-${idx + 1}`,
        course_id: courseId,
        concept_id: (q.conceptId && conceptIdMapping.get(q.conceptId)) || conceptsPayload[0]?.id || null,
        user_id: userId,
        question: q.question,
        expected_answer: q.expectedAnswer,
        explanation: q.explanation,
        source_references: q.sourceReferences || [],
        created_at: nowIso
      }));
      const { error: qErr } = await userClient.from("comprehension_questions").insert(qPayload);
      if (qErr) console.error("Comprehension questions insert error:", qErr);
    }

    // 6. Persistance Quiz Plan & Premier Quiz
    const quizPlanId = `qp-${courseId}`;
    if (validQuizzes.length > 0) {
      const { error: qpErr } = await userClient.from("quiz_plans").upsert({
        id: quizPlanId,
        course_id: courseId,
        user_id: userId,
        title: parsed.quizPlan?.title || `Plan de Quiz : ${finalTitle}`,
        planned_quizzes: validQuizzes,
        created_at: nowIso,
        updated_at: nowIso
      });
      if (qpErr) console.error("Quiz plan upsert error:", qpErr);

      // Créer au moins le premier quiz interactif dans `quizzes`
      const primaryQuiz = validQuizzes[0];
      const primaryQuizId = `quiz-${courseId}`;
      const mappedQuestions = primaryQuiz.questions.map((q: any, idx: number) => ({
        id: `qq-${primaryQuizId}-${idx + 1}`,
        conceptId: (q.conceptId && conceptIdMapping.get(q.conceptId)) || conceptsPayload[0]?.id || 'concept-1',
        questionCategory: q.questionCategory || 'rappel_direct',
        question: q.question,
        choices: q.options || [],
        correctChoiceIndex: (q.options || []).indexOf(q.correctAnswer) >= 0 ? (q.options || []).indexOf(q.correctAnswer) : 0,
        explanation: q.explanation,
        sourceReferences: q.sourceReferences || []
      }));

      const { error: quizErr } = await userClient.from("quizzes").upsert({
        id: primaryQuizId,
        course_id: courseId,
        revision_id: revisionId,
        user_id: userId,
        title: primaryQuiz.title || `Quiz de compréhension : ${finalTitle}`,
        course_title: finalTitle,
        difficulty: 2,
        total_questions: mappedQuestions.length,
        questions: mappedQuestions,
        created_at: nowIso
      });
      if (quizErr) console.error("Quiz upsert error:", quizErr);
    }

    // 7. Persistance Exercices
    if (validExercises.length > 0) {
      const exPayload = validExercises.map((ex: any, idx: number) => ({
        id: `ex-${courseId}-${idx + 1}`,
        course_id: courseId,
        concept_id: (ex.conceptId && conceptIdMapping.get(ex.conceptId)) || conceptsPayload[0]?.id || null,
        user_id: userId,
        statement: ex.statement,
        instructions: ex.instructions,
        expected_method: ex.expectedMethod || null,
        correction: ex.correction,
        difficulty: ex.difficulty || 2,
        source_references: ex.sourceReferences || [],
        status: "pending",
        created_at: nowIso,
        updated_at: nowIso
      }));
      const { error: exErr } = await userClient.from("exercises").insert(exPayload);
      if (exErr) console.error("Exercises insert error:", exErr);
    }

    console.log("Gemini Usage Metadata:", JSON.stringify(geminiData.usageMetadata));

    // Retourner le résultat structuré complet au frontend
    return new Response(JSON.stringify({
      success: true,
      modelUsed: selectedModel,
      usage: geminiData.usageMetadata || null,
      course: {
        id: courseId,
        title: finalTitle,
        subjectName: finalSubject,
        summary: summary,
        conceptsCount: parsed.concepts.length,
        durationMinutes: 15
      },
      concepts: conceptsPayload,
      revision: {
        id: revisionId,
        courseId: courseId,
        title: parsed.revision.title || `Révision : ${finalTitle}`,
        summary: parsed.revision.essentialSummary,
        keyConcepts: parsed.concepts.map((c: any) => c.name),
        sections: revisionSections,
        totalSections: revisionSections.length,
        isDownloaded: false
      },
      comprehensionQuestions: validQuestions,
      quizPlan: {
        id: quizPlanId,
        courseId: courseId,
        title: parsed.quizPlan?.title || `Plan de Quiz : ${finalTitle}`,
        quizzes: validQuizzes
      },
      exercises: validExercises
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error: any) {
    console.error("Orchestrator unhandled error:", error);
    return new Response(JSON.stringify({
      error: "Nous n'avons pas réussi à analyser ton cours. Réessaie dans quelques instants."
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
