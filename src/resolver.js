import { fakeCatalog, SUPPORTED_SERVICES } from "./catalog.js";
import { detectService, sanitizeUrl } from "./privacy.js";

export function resolveLink({ input_url: inputUrl, target_service: targetService }) {
  if (!SUPPORTED_SERVICES.includes(targetService)) {
    return failure("unsupported_target_service", "unknown", targetService);
  }

  let sanitizedUrl;
  try {
    sanitizedUrl = sanitizeUrl(inputUrl);
  } catch {
    return failure("invalid_input_url", "unknown", targetService);
  }

  const sourceService = detectService(sanitizedUrl);
  if (sourceService === "unknown") {
    return failure("unsupported_source_service", sourceService, targetService);
  }

  const item = fakeCatalog.find((entry) =>
    Object.values(entry.links).some((link) => sameNormalizedUrl(link, sanitizedUrl))
  );

  if (!item) {
    return failure("not_found_in_fake_catalog", sourceService, targetService);
  }

  const targetUrl = item.links[targetService];
  if (!targetUrl) {
    return failure("target_link_unavailable", sourceService, targetService);
  }

  return {
    ok: true,
    url: targetUrl,
    share_text: targetUrl,
    item_type: item.itemType,
    confidence: sourceService === targetService ? "exact" : "high",
    source_service: sourceService,
    target_service: targetService
  };
}

function sameNormalizedUrl(left, right) {
  return sanitizeUrl(left) === sanitizeUrl(right);
}

function failure(reason, sourceService, targetService) {
  return {
    ok: false,
    reason,
    confidence: "none",
    source_service: sourceService,
    target_service: targetService
  };
}
