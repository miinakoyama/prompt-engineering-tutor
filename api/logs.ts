import {
  handleOptions,
  isBadRequestError,
  parseJsonBody,
  sendMethodNotAllowed,
  type ApiRequest,
  type ApiResponse,
} from "./_lib/http.js";
import { supabaseAdmin } from "./_lib/supabase.js";
import { getAppEnv } from "./_lib/appEnv.js";

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
    if (isBadRequestError(error)) {
      res.status(400).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: String(error) });
  }
}
