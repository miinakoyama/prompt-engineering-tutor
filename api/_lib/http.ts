type ApiResponse = {
  status: (code: number) => ApiResponse;
  json: (payload: unknown) => void;
  setHeader: (name: string, value: string) => void;
};

type ApiRequest = {
  method?: string;
  body?: unknown;
  query?: Record<string, string | string[]>;
};

export function applyCors(res: ApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

export function handleOptions(req: ApiRequest, res: ApiResponse): boolean {
  applyCors(res);
  if (req.method === "OPTIONS") {
    res.status(200).json({ ok: true });
    return true;
  }
  return false;
}

export function sendMethodNotAllowed(res: ApiResponse) {
  res.status(405).json({ error: "Method not allowed" });
}

export function parseJsonBody<T>(body: unknown): T {
  if (!body) {
    throw new Error("Request body is required");
  }
  if (typeof body === "string") {
    return JSON.parse(body) as T;
  }
  return body as T;
}
