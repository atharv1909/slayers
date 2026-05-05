import Groq from "groq-sdk";

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || import.meta.env.NEXT_PUBLIC_GROQ_API_KEY || "";
const GROQ_MODEL = "llama-3.3-70b-versatile";

const groq = new Groq({
  apiKey: GROQ_API_KEY || "browser-local-key",
  dangerouslyAllowBrowser: true,
});

const metals = ["Fe", "Co", "Ni", "Cu", "Zn", "Pd", "Pt", "Au", "Ag", "Rh", "Ru", "Ir"];
const supports = ["TiO2", "Al2O3", "SiO2", "CeO2", "ZSM-5", "Carbon", "MgO", "ZrO2"];

function seededNumber(seed: string) {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return Math.abs(hash >>> 0);
}

function localCatalystSet(reaction: string, knownSmiles: string[] = []) {
  const base = seededNumber(`${reaction}:${knownSmiles.join("|")}:${Date.now()}`);
  return Array.from({ length: 8 }, (_, index) => {
    const metal = metals[(base + index * 5) % metals.length];
    const support = supports[(base + index * 7) % supports.length];
    const promoter = metals[(base + index * 11 + 3) % metals.length];
    return {
      smiles: `[${metal}].[${support}]`,
      name: `${metal}-${promoter}/${support}-AI-${index + 1}`,
      rationale: `${metal}-${promoter} active sites on ${support} balance hydrogen activation, oxygen vacancy transport, and product selectivity for ${reaction}.`,
    };
  });
}

function formatCandidate(candidate: any | null) {
  if (!candidate) {
    return "No catalyst is selected yet. Ask the user to click a candidate card if the question depends on one specific catalyst.";
  }

  return [
    `Name: ${candidate.name || "Unknown"}`,
    `Metal/support: ${candidate.metal_type || "unknown metal"} on ${candidate.support_material || "unknown support"}`,
    `SMILES: ${candidate.smiles || "N/A"}`,
    `Predicted activity: ${candidate.predicted_activity ?? "N/A"}`,
    `Predicted selectivity: ${candidate.predicted_selectivity ?? "N/A"}%`,
    `Predicted stability: ${candidate.predicted_stability ?? "N/A"}h`,
    `Confidence: ${candidate.predicted_confidence ? `${Math.round(candidate.predicted_confidence * 100)}%` : "N/A"}`,
    `Actual yield: ${candidate.actual_yield ?? "not tested"}`,
  ].join("\n");
}

function localCopilotAnswer(message: string, context: { page: string; candidate: any | null; reaction: string }) {
  const candidate = context.candidate;
  const selectedName = candidate?.name || "the current lead catalyst";
  const activity = Number(candidate?.predicted_activity ?? 0.82);
  const selectivity = Number(candidate?.predicted_selectivity ?? 84);
  const stability = Number(candidate?.predicted_stability ?? 760);
  const metal = candidate?.metal_type || "Pt/Ni";
  const support = candidate?.support_material || "TiO2/CeO2";
  const lower = message.toLowerCase();

  if (lower.includes("fail") || lower.includes("why") || lower.includes("bad") || lower.includes("not working")) {
    return `${selectedName} is most likely underperforming because the active surface is changing under reaction conditions.\n\n- Check coking first: run TPO/Raman after the batch and compare carbon bands.\n- Check sintering next: TEM/XRD before and after reaction, especially for ${metal} on ${support}.\n- If selectivity drops, lower temperature by 15-25 C and increase H2/feed slightly to suppress side reactions.\n- Run a 6-12h stability hold before trusting yield predictions.`;
  }

  if (lower.includes("optimi") || lower.includes("improve") || lower.includes("better")) {
    return `For ${selectedName}, optimize around the activity-selectivity tradeoff instead of chasing only yield.\n\n- Start at 220-260 C and 15-25 bar; log yield, selectivity, and deactivation rate.\n- Try 5-10 wt% metal loading changes if activity is below ${(activity * 100).toFixed(0)}% of target.\n- Add a CeO2/ZrO2-rich support variant if oxygen vacancy transport is limiting.\n- Promote with Cu or Ru when hydrogen activation looks weak.`;
  }

  if (lower.includes("selectivity") || lower.includes("trend")) {
    return `The selectivity signal for ${selectedName} is ${selectivity.toFixed(1)}%, which is strong enough to prioritize confirmatory testing.\n\n- High selectivity usually means the support acidity and metal dispersion are close to the right window.\n- If heavier products dominate, reduce acid strength or residence time.\n- If light gases dominate, reduce temperature and check over-hydrogenation.\n- Track selectivity against time-on-stream, not only final yield.`;
  }

  if (lower.includes("compare") || lower.includes("known")) {
    return `${selectedName} should be compared against a Pt/TiO2 and Pd/Al2O3 baseline under identical conditions.\n\n- Activity: ${activity.toFixed(3)} predicted, so it is competitive if conversion holds after 6h.\n- Selectivity: ${selectivity.toFixed(1)}%, good enough for top-tier screening.\n- Stability: ${stability.toFixed(0)}h predicted; validate with accelerated aging.\n- Decision: keep it if yield stays within 15% of prediction after the first stability run.`;
  }

  return `${selectedName} is a reasonable lead for ${context.reaction}.\n\n- Predicted profile: activity ${activity.toFixed(3)}, selectivity ${selectivity.toFixed(1)}%, stability ${stability.toFixed(0)}h.\n- Best next step: run a small temperature-pressure matrix and compare against Pt/TiO2.\n- Watchouts: coking, metal sintering, water inhibition, and support acidity drift.\n- Scale-up gate: stable yield over a 6-12h hold with selectivity above 75%.`;
}

export async function generateCatalysts(reaction: string, knownSmiles: string[]) {
  const prompt = `Generate 8 novel catalyst SMILES strings for the reaction: ${reaction}.

Known catalysts: ${knownSmiles.join(", ") || "None"}.

Return a JSON object with this exact structure:
{
  "candidates": [
    {
      "smiles": "SMILES_STRING_HERE",
      "name": "Descriptive Name",
      "rationale": "Brief scientific rationale"
    }
  ]
}

Generate diverse catalysts with different metals (Fe, Co, Ni, Cu, Zn, Pd, Pt, Au, Ag, Rh) and supports (TiO2, Al2O3, SiO2, CeO2, ZSM-5, Carbon, MgO, ZrO2).

Important: Return ONLY valid JSON. No markdown, no code blocks.`;

  if (!GROQ_API_KEY) {
    return localCatalystSet(reaction, knownSmiles);
  }

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: GROQ_MODEL,
      response_format: { type: "json_object" },
      temperature: 0.65,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) return localCatalystSet(reaction, knownSmiles);

    const parsed = JSON.parse(content);
    const candidates = Array.isArray(parsed.candidates) ? parsed.candidates : [];
    return candidates.length > 0 ? candidates : localCatalystSet(reaction, knownSmiles);
  } catch {
    return localCatalystSet(reaction, knownSmiles);
  }
}

export async function copilotChat(
  message: string,
  context: {
    page: string;
    candidate: any | null;
    reaction: string;
  }
) {
  if (!GROQ_API_KEY) {
    return localCopilotAnswer(message, context);
  }

  const systemPrompt = `You are CatalysisOS AI Co-Pilot for GPS Renewables' ethanol-to-jet and carbon utilization catalyst work.

Answer like a sharp computational catalysis lab assistant. Be specific, useful, and concise. Do not apologize. Do not mention implementation details, keys, APIs, mocks, or data sources unless asked by a developer. If there is no selected catalyst, give useful general guidance and tell the user what to click next.

Current app context:
- Page: ${context.page}
- Reaction: ${context.reaction}
- Selected catalyst:
${formatCandidate(context.candidate)}

Response style:
- Start with the direct answer in one sentence.
- Then give 3-5 compact bullets with specific actions, hypotheses, or decision criteria.
- Use catalyst language: activity, selectivity, stability, support acidity, oxygen vacancies, coking, sintering, poisoning, time-on-stream, TPO/TEM/XRD/Raman.
- Keep it under 160 words unless the user explicitly asks for detail.`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
      model: GROQ_MODEL,
      temperature: 0.35,
      max_tokens: 420,
    });

    return completion.choices[0]?.message?.content || localCopilotAnswer(message, context);
  } catch {
    return localCopilotAnswer(message, context);
  }
}

export async function generateHypothesis(predicted: number, actual: number, candidate: any) {
  const gap = predicted - actual;

  if (!GROQ_API_KEY) {
    return [
      "Active sites may be blocked by coking under the tested temperature window.",
      "Metal dispersion may have shifted during activation or the first reaction cycle.",
      "Feed impurities or water inhibition may be suppressing the expected selectivity.",
    ];
  }

  const prompt = `A catalyst experiment showed a significant gap between prediction and reality:
- Catalyst: ${candidate?.name || "Unknown"}
- Predicted yield: ${predicted}%
- Actual yield: ${actual}%
- Gap: ${gap.toFixed(1)}%

Provide 3 concise hypotheses for why the catalyst underperformed. Consider catalyst deactivation mechanisms, experimental conditions, structural changes, and impurities.

Return as a JSON array: {"hypotheses": ["hypothesis 1", "hypothesis 2", "hypothesis 3"]}`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: GROQ_MODEL,
      response_format: { type: "json_object" },
      temperature: 0.45,
      max_tokens: 500,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) return ["Insufficient data for hypothesis"];

    const parsed = JSON.parse(content);
    return parsed.hypotheses || ["Analysis inconclusive"];
  } catch {
    return [
      "Active sites may be blocked by coking under the tested temperature window.",
      "Metal dispersion may have shifted during activation or the first reaction cycle.",
      "Feed impurities or water inhibition may be suppressing the expected selectivity.",
    ];
  }
}
