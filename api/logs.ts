import { handleOptions, parseJsonBody, sendMethodNotAllowed } from "./_lib/http";
import { supabaseAdmin } from "./_lib/supabase";
import { getAppEnv } from "./_lib/appEnv";

type ApiRequest = { method?: string; body?: unknown };
type ApiResponse = {
  status: (code: number) => ApiResponse;
  json: (payload: unknown) => void;
  setHeader: (name: string, value: string) => void;
};

type EventLogBody = {
  sessionId?: string;
  eventType: string;
  technique?: string;
  level?: number;
  payload?: Record<string, unknown>;
  timestamp?: number;
};

export default async function handler(req: ApiRequest, res: ApiResponse) {
  const appEnv = getAppEnv();
  if (handleOptions(req, res)) {
    return;
  }

  if (req.method !== "POST") {
    sendMethodNotAllowed(res);
    return;
  }

  try {
    const body = parseJsonBody<EventLogBody>(req.body);
    if (!body.eventType) {
      res.status(400).json({ error: "eventType is required" });
      return;
    }

    const { error } = await supabaseAdmin.from("events").insert({
      session_id: body.sessionId || null,
      app_env: appEnv,
      event_type: body.eventType,
      technique: body.technique || null,
      level: body.level || null,
      payload_json: body.payload || {},
      created_at: body.timestamp
        ? new Date(body.timestamp).toISOString()
        : new Date().toISOString(),
    });

    if (error) {
      throw error;
    }

    res.status(200).json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
}
