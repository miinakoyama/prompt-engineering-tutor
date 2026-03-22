export type ApiResponse = {
  status: (code: number) => ApiResponse;
  json: (payload: unknown) => void;
  setHeader: (name: string, value: string) => void;
  send?: (body: string) => void;
};

export type ApiRequest = {
  method?: string;
  body?: unknown;
  query?: Record<string, string | string[]>;
  headers?: Record<string, string | string[] | undefined>;
};

export function applyCors(res: ApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,OPTIONS");
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

export class BadRequestError extends Error {
  status = 400;
}

export function isBadRequestError(error: unknown): error is BadRequestError {
  return error instanceof BadRequestError;
}

export function getQueryValue(
  query: Record<string, string | string[]> | undefined,
  key: string,
) {
  const value = query?.[key];
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

export function parseJsonBody<T>(body: unknown): T {
  if (body === undefined || body === null || body === "") {
    throw new BadRequestError("Request body is required");
  }
  if (typeof body === "string") {
    try {
      return JSON.parse(body) as T;
    } catch {
      throw new BadRequestError("Invalid JSON body");
    }
  }
  if (typeof body !== "object") {
    throw new BadRequestError("Invalid JSON body");
  }
  return body as T;
}
