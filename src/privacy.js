export function validateUrl(input) {
  return new URL(extractPreferredUrl(input)).toString();
}

export function extractFirstUrl(input) {
  return extractUrls(input)[0];
}

export function extractPreferredUrl(input) {
  const urls = extractUrls(input);
  return urls.reduce((preferred, candidate) =>
    musicUrlPriority(candidate) > musicUrlPriority(preferred) ? candidate : preferred
  );
}

function extractUrls(input) {
  if (typeof input !== "string") {
    throw new TypeError("input_url must be a string");
  }

  const matches = input.match(/https?:\/\/[^\s<>"'\[\]()]+/gi);
  if (!matches) {
    throw new Error("No URL found in input");
  }

  return matches;
}

function musicUrlPriority(inputUrl) {
  try {
    const url = new URL(inputUrl);
    const service = detectService(url);

    if (service === "apple" && url.searchParams.has("i")) return 40;
    if (service === "spotify" && url.pathname.includes("/track/")) return 30;
    if (service === "apple" && url.pathname.includes("/song/")) return 30;
    if (service !== "unknown") return 20;
    return 10;
  } catch {
    return 0;
  }
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
