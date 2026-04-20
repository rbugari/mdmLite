import { env } from "@/lib/env";

export type CandidateType = "mapping" | "group" | "parameter" | "unknown";

export type ExtractedCandidate = {
  candidateType: CandidateType;
  evidence: string;
  confidence: number;
  needsHumanReview: boolean;
  payload: Record<string, unknown>;
};

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

const SYSTEM_PROMPT = `You are an MDM (Master Data Management) rule extraction assistant.
Given a text document, extract candidate master data rules as a JSON array.
Each candidate must follow this structure:
{
  "candidateType": "mapping" | "group" | "parameter" | "unknown",
  "evidence": "exact quote or paraphrase from the document that supports this candidate",
  "confidence": 0.0 to 1.0,
  "needsHumanReview": true | false,
  "payload": { ...type-specific fields }
}

Payload fields by type:
- mapping: { entityTypeCode, ruleSetCode, sourceKey, sourceValue, targetValue, targetLabel, priority, validFrom }
- group: { entityTypeCode, ruleSetCode, memberValue, groupValue, groupLabel, validFrom }
- parameter: { parameterKey, parameterValue, dataType, domain, parameterScopeType, parameterScopeValue, validFrom }
- unknown: { description }

Rules:
- Only extract rules explicitly stated in the document. Do not invent.
- Use entityTypeCode from: CLIENT, PRODUCT, COMPANY, COMMERCIAL, SOCIETY. Infer from context.
- dataType must be: string, numeric, boolean, or json.
- validFrom defaults to today if not stated.
- Set needsHumanReview=true whenever you are uncertain about any field.
- confidence should reflect how clearly the document states this rule.
- Return ONLY a valid JSON array. No markdown, no explanation, no wrapper object.`;

export function isLlmConfigured(): boolean {
  return env.LLM_PROVIDER !== "none" && !!env.LLM_API_KEY;
}

async function callLlm(messages: ChatMessage[]): Promise<string> {
  const provider = env.LLM_PROVIDER;
  const apiKey = env.LLM_API_KEY ?? "";
  const model = env.LLM_MODEL;

  let url: string;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const body = {
    model,
    messages,
    response_format: { type: "json_object" },
    temperature: 0.1,
    max_tokens: 4096,
  };

  if (provider === "azure-openai") {
    const base = env.LLM_AZURE_ENDPOINT?.replace(/\/$/, "") ?? "";
    url = `${base}/openai/deployments/${model}/chat/completions?api-version=2024-02-15-preview`;
    headers["api-key"] = apiKey;
  } else {
    url = "https://api.openai.com/v1/chat/completions";
    headers["Authorization"] = `Bearer ${apiKey}`;
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`LLM API error ${response.status}: ${text.slice(0, 300)}`);
  }

  const data = (await response.json()) as {
    choices: Array<{ message: { content: string } }>;
  };

  return data.choices[0]?.message?.content ?? "[]";
}

export async function extractCandidatesFromText(
  text: string,
  documentName: string,
): Promise<ExtractedCandidate[]> {
  if (!isLlmConfigured()) {
    throw new Error("LLM not configured. Set LLM_PROVIDER and LLM_API_KEY in .env.");
  }

  const messages: ChatMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "user",
      content: `Document: "${documentName}"\n\n---\n\n${text.slice(0, 12000)}`,
    },
  ];

  const raw = await callLlm(messages);

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`LLM returned invalid JSON. Raw: ${raw.slice(0, 200)}`);
  }

  // The response_format json_object wraps in an object sometimes — unwrap if needed
  const arr = Array.isArray(parsed)
    ? parsed
    : Array.isArray((parsed as Record<string, unknown>).candidates)
      ? (parsed as Record<string, unknown>).candidates
      : Array.isArray((parsed as Record<string, unknown>).rules)
        ? (parsed as Record<string, unknown>).rules
        : [];

  return (arr as ExtractedCandidate[]).filter(
    (c) =>
      c &&
      typeof c === "object" &&
      typeof c.candidateType === "string" &&
      typeof c.payload === "object",
  );
}
