export const DEFAULT_CLOSEROUTER_BASE_URL =
  process.env.CLOSEROUTER_BASE_URL?.trim() || "https://api.closerouter.dev/v1";

export interface CloseRouterModel {
  id: string;
  object?: string;
  owned_by?: string;
  created?: number;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatCompletionResponse {
  id?: string;
  choices: Array<{
    index: number;
    message: { role: string; content: string };
    finish_reason?: string;
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

function normalizeBaseUrl(url: string | undefined | null): string {
  const raw = (url || "").trim() || DEFAULT_CLOSEROUTER_BASE_URL;
  return raw.replace(/\/$/, "");
}

export async function listModels(opts: {
  apiKey: string;
  baseUrl?: string;
}): Promise<CloseRouterModel[]> {
  const base = normalizeBaseUrl(opts.baseUrl);
  const res = await fetch(`${base}/models`, {
    headers: {
      Authorization: `Bearer ${opts.apiKey}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Failed to list CloseRouter models: ${res.status} ${res.statusText} ${text}`,
    );
  }
  const data = await res.json();
  const list: unknown = data?.data ?? data?.models ?? data;
  if (!Array.isArray(list)) {
    throw new Error("Unexpected CloseRouter /models response shape");
  }
  return list
    .map((item: unknown): CloseRouterModel | null => {
      if (!item || typeof item !== "object") return null;
      const obj = item as Record<string, unknown>;
      const id =
        typeof obj.id === "string"
          ? obj.id
          : typeof obj.name === "string"
            ? obj.name
            : null;
      if (!id) return null;
      return {
        id,
        object: typeof obj.object === "string" ? obj.object : undefined,
        owned_by:
          typeof obj.owned_by === "string" ? obj.owned_by : undefined,
        created: typeof obj.created === "number" ? obj.created : undefined,
      };
    })
    .filter((m): m is CloseRouterModel => m !== null);
}

export async function chatCompletion(opts: {
  apiKey: string;
  baseUrl?: string;
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
}): Promise<ChatCompletionResponse> {
  const base = normalizeBaseUrl(opts.baseUrl);
  const body: Record<string, unknown> = {
    model: opts.model,
    messages: opts.messages,
    stream: false,
  };
  if (typeof opts.temperature === "number") {
    body.temperature = opts.temperature;
  }
  if (typeof opts.maxTokens === "number") {
    body.max_tokens = opts.maxTokens;
  }
  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${opts.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `CloseRouter chat/completions failed: ${res.status} ${res.statusText} ${text}`,
    );
  }
  return (await res.json()) as ChatCompletionResponse;
}
