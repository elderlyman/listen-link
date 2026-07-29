import { privacySafeMetric } from "../src/privacy.js";
import { resolveLink } from "../src/resolver.js";

export default {
  async fetch(request) {
    const startedAt = Date.now();

    if (request.method !== "POST") {
      return jsonResponse(405, { ok: false, reason: "method_not_allowed" }, {
        allow: "POST"
      });
    }

    let body;
    try {
      const raw = await request.text();
      if (raw.length > 4096) {
        return jsonResponse(413, { ok: false, reason: "request_body_too_large" });
      }
      body = raw ? JSON.parse(raw) : {};
    } catch {
      return jsonResponse(400, { ok: false, reason: "invalid_json" });
    }

    const result = resolveLink(body);

    console.info(JSON.stringify(privacySafeMetric({
      sourceService: result.source_service,
      targetService: result.target_service,
      result: result.ok ? "success" : result.reason,
      confidence: result.confidence,
      durationMs: Date.now() - startedAt
    })));

    if (body.response_format === "text") {
      return textResponse(result.ok ? 200 : 422, result.ok ? result.share_text : result.reason);
    }

    return jsonResponse(result.ok ? 200 : 422, result);
  }
};

function jsonResponse(status, payload, extraHeaders = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "cache-control": "no-store",
      "content-type": "application/json; charset=utf-8",
      ...extraHeaders
    }
  });
}

function textResponse(status, payload) {
  return new Response(payload, {
    status,
    headers: {
      "cache-control": "no-store",
      "content-type": "text/plain; charset=utf-8"
    }
  });
}
