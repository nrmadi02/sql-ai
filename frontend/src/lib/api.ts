import type {
  AIMetadata,
  GeneratorMessage,
  SendMessageInput,
  StreamDeltaEvent,
  StreamErrorEvent,
  TestConnectionResult,
} from "@/lib/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

async function parseErrorMessage(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as {
      error?: string;
      message?: string;
    };
    return data.error ?? data.message ?? response.statusText;
  } catch {
    return response.statusText || "Permintaan gagal";
  }
}

async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { body, headers, ...init } = options;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  if (!response.ok) {
    const message = await parseErrorMessage(response);
    throw new ApiError(message, response.status);
  }

  return (await response.json()) as T;
}

export const api = {
  get: <T>(path: string, init?: RequestOptions) =>
    request<T>(path, { ...init, method: "GET" }),

  post: <T>(path: string, body?: unknown, init?: RequestOptions) =>
    request<T>(path, { ...init, method: "POST", body }),

  put: <T>(path: string, body?: unknown, init?: RequestOptions) =>
    request<T>(path, { ...init, method: "PUT", body }),

  delete: (path: string, init?: RequestOptions) =>
    request<void>(path, { ...init, method: "DELETE" }),
};

export async function testConnection(
  payload: unknown,
  datasourceId?: string,
): Promise<TestConnectionResult> {
  const path = datasourceId
    ? `/api/v1/datasources/${datasourceId}/test`
    : "/api/v1/datasources/test";

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: datasourceId ? undefined : JSON.stringify(payload),
  });

  const result = (await response.json()) as TestConnectionResult;

  if (!response.ok && response.status !== 502) {
    throw new ApiError(
      result.message || (await parseErrorMessage(response)),
      response.status,
      result,
    );
  }

  return result;
}

export type GeneratorStreamCallbacks = {
  onUserMessage: (message: GeneratorMessage) => void;
  onMeta: (metadata: AIMetadata) => void;
  onDelta: (delta: string) => void;
  onDone: (message: GeneratorMessage) => void;
  onError: (message: string) => void;
};

type SSEChunk = {
  event: string;
  data: string;
};

function parseSSEBuffer(buffer: string): {
  events: SSEChunk[];
  remainder: string;
} {
  const parts = buffer.split("\n\n");
  const remainder = parts.pop() ?? "";
  const events: SSEChunk[] = [];

  for (const part of parts) {
    if (!part.trim()) continue;

    let event = "message";
    const dataLines: string[] = [];

    for (const line of part.split("\n")) {
      if (line.startsWith("event:")) {
        event = line.slice(6).trim();
      } else if (line.startsWith("data:")) {
        dataLines.push(line.slice(5).trim());
      }
    }

    if (dataLines.length) {
      events.push({ event, data: dataLines.join("\n") });
    }
  }

  return { events, remainder };
}

export async function streamGeneratorMessage(
  sessionId: string,
  input: SendMessageInput,
  callbacks: GeneratorStreamCallbacks,
  signal?: AbortSignal,
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/generator/sessions/${sessionId}/messages`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      signal,
    },
  );

  if (!response.ok) {
    const message = await parseErrorMessage(response);
    throw new ApiError(message, response.status);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new ApiError("Respons streaming tidak tersedia", 500);
  }

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const { events, remainder } = parseSSEBuffer(buffer);
    buffer = remainder;

    for (const chunk of events) {
      switch (chunk.event) {
        case "user_message":
        case "done": {
          const message = JSON.parse(chunk.data) as GeneratorMessage;
          if (chunk.event === "user_message") {
            callbacks.onUserMessage(message);
          } else {
            callbacks.onDone(message);
          }
          break;
        }
        case "meta": {
          const metadata = JSON.parse(chunk.data) as AIMetadata;
          callbacks.onMeta(metadata);
          break;
        }
        case "delta": {
          const payload = JSON.parse(chunk.data) as StreamDeltaEvent;
          if (payload.content) {
            callbacks.onDelta(payload.content);
          }
          break;
        }
        case "error": {
          const payload = JSON.parse(chunk.data) as StreamErrorEvent;
          callbacks.onError(payload.message);
          break;
        }
        default:
          break;
      }
    }
  }
}

export async function testAiProviderConnection(
  payload: unknown,
  providerId?: string,
): Promise<TestConnectionResult> {
  const path = providerId
    ? `/api/v1/ai-providers/${providerId}/test`
    : "/api/v1/ai-providers/test";

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: providerId ? undefined : JSON.stringify(payload),
  });

  const result = (await response.json()) as TestConnectionResult;

  if (!response.ok && response.status !== 502) {
    throw new ApiError(
      result.message || (await parseErrorMessage(response)),
      response.status,
      result,
    );
  }

  return result;
}
