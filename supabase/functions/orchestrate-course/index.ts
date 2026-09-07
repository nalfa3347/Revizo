import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

// Schéma JSON strict pour Structured Output Gemini
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
      required: ["title", "essentialSummary", "fundamentalNotions", "keyPoints", "methods", "formulas", "examples", "commonPitfalls", "memorizationChecklist"]
    },
    comprehensionQuestions: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          id: { type: "STRING" },
          conceptId: { type: "STRING" },
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

// Retry helper avec exponential backoff
async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 3): Promise<Response> {
  let delay = 1000;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, options);
      if (res.status === 429 || (res.status >= 500 && res.status < 600)) {
        if (attempt === maxRetries) return res;
        await new Promise(r => setTimeout(r, delay));
        delay *= 2;
        continue;
      }
      return res;
    } catch (err) {
      if (attempt === maxRetries) throw err;
      await new Promise(r => setTimeout(r, delay));
      delay *= 2;
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
      rawText
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

    // CONTRÔLE SERVEUR STRICT DU QUOTA QUOTIDIEN DE RÉVISIONS
    const { data: usageCheck, error: usageErr } = await userClient.rpc("record_revision_usage", {
      p_user_id: userId
    });

    if (usageErr) {
      console.error("Avertissement quota révision:", usageErr);
    } else if (usageCheck && !usageCheck.allowed) {
      return new Response(JSON.stringify({
        error: usageCheck.message || "Tu as atteint ta limite de révisions du jour. Ton compteur sera réinitialisé demain.",
        quotaReached: true,
        limit: usageCheck.limit,
        used: usageCheck.used
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

MISSION PÉDAGOGIQUE REVIZO :
1. COMPRENDRE le cours en profondeur (identité, finalité, concepts clés).
2. DÉTERMINER les éléments indispensables que l'élève doit absolument mémoriser (mustMemorize[]).
3. CRÉER une fiche de révision courte, claire, fidèle et sans bavardage, nettement plus courte que le document source.
4. PRÉPARER entre 3 et 5 questions de compréhension courtes pour valider la compréhension immédiate.
5. PLANIFIER plusieurs quiz de révision espacés (J+1, J+7, J+14) avec distracteurs plausibles et formateurs.
6. PRÉPARER des exercices d'application adaptés aux notions fondamentales et aux pièges fréquents.
7. TOUS les concepts, règles, formules, questions et exercices DOIVENT comporter des sourceReferences précises pointant vers la section ou la page du document.
8. INTERDICTION FORMELLE d'inventer des faits, formules ou notions absents du cours.`;

    parts.push({ text: instructionsPrompt });

    const systemInstruction = `Tu es le moteur pédagogique central de REVIZO.
Ta mission est d'effectuer l'analyse intellectuelle complète du cours fourni par l'élève, de déterminer ce qu'il doit retenir, de synthétiser une révision fidèle et concise, puis de générer des questions de vérification, des quiz espacés et des exercices pratiques.
RÈGLE CARDINALE : Zéro invention d'information absente du document. Toute affirmation doit être supportée par le cours.
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
        responseSchema: GEMINI_PEDAGOGICAL_SCHEMA,
        thinkingConfig: {
          thinkingBudget: 2048
        }
      }
    };

    // Appeler l'API Gemini 2.5 Flash avec gestion de version et retries
    const candidateModels = ["gemini-2.5-flash", "gemini-3.6-flash", "gemini-flash-latest"];
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
    const revisionSections = [
      {
        id: `sec-${courseId}-1`,
        title: "Résumé Essentiel",
        content: parsed.revision.essentialSummary,
        orderIndex: 0
      },
      {
        id: `sec-${courseId}-2`,
        title: "Points Clés à Mémoriser",
        content: parsed.revision.keyPoints.join("\n\n• "),
        orderIndex: 1
      }
    ];

    if (parsed.revision.methods && parsed.revision.methods.length > 0) {
      revisionSections.push({
        id: `sec-${courseId}-3`,
        title: "Méthodes & Procédures",
        content: parsed.revision.methods.map((m: any) => `${m.name} :\n` + m.steps.map((s: string, i: number) => `  ${i + 1}. ${s}`).join("\n")).join("\n\n"),
        orderIndex: 2
      });
    }

    if (parsed.revision.formulas && parsed.revision.formulas.length > 0) {
      revisionSections.push({
        id: `sec-${courseId}-4`,
        title: "Formules & Règles",
        content: parsed.revision.formulas.map((f: any) => `• ${f.expression} : ${f.meaning}`).join("\n"),
        orderIndex: 3
      });
    }

    if (parsed.revision.commonPitfalls && parsed.revision.commonPitfalls.length > 0) {
      revisionSections.push({
        id: `sec-${courseId}-5`,
        title: "Pièges Fréquents à Éviter",
        content: parsed.revision.commonPitfalls.map((p: string) => `⚠️ ${p}`).join("\n"),
        orderIndex: 4
      });
    }

    if (parsed.revision.memorizationChecklist && parsed.revision.memorizationChecklist.length > 0) {
      revisionSections.push({
        id: `sec-${courseId}-6`,
        title: "Checklist de Mémorisation",
        content: parsed.revision.memorizationChecklist.map((c: string) => `[ ] ${c}`).join("\n"),
        orderIndex: 5
      });
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

    // Retourner le résultat structuré complet au frontend
    return new Response(JSON.stringify({
      success: true,
      modelUsed: selectedModel,
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
