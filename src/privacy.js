const TRACKING_PARAMS = new Set([
  "app",
  "at",
  "context",
  "ct",
  "go",
  "i",
  "ls",
  "mt",
  "pt",
  "si",
  "uo",
  "utm_campaign",
  "utm_content",
  "utm_medium",
  "utm_source",
  "utm_term"
]);

export function sanitizeUrl(input) {
  const url = new URL(extractFirstUrl(input));

  for (const param of [...url.searchParams.keys()]) {
    if (TRACKING_PARAMS.has(param.toLowerCase())) {
      url.searchParams.delete(param);
    }
  }

  url.hash = "";
  return url.toString();
}

export function extractFirstUrl(input) {
  if (typeof input !== "string") {
    throw new TypeError("input_url must be a string");
  }

  const match = input.match(/https?:\/\/[^\s<>"']+/i);
  if (!match) {
    throw new Error("No URL found in input");
  }

  return match[0];
}

export function detectService(inputUrl) {
  const hostname = new URL(inputUrl).hostname.toLowerCase();

  if (hostname === "music.apple.com" || hostname.endsWith(".music.apple.com")) {
    return "apple";
  }

  if (hostname === "open.spotify.com" || hostname.endsWith(".spotify.com")) {
    return "spotify";
  }
  return "unknown";
}

export function privacySafeMetric({ sourceService, targetService, result, confidence, durationMs }) {
  return {
    event: "resolve_completed",
    source_service: sourceService,
    target_service: targetService,
    result,
    confidence,
    duration_ms: durationMs
  };
}
