import { fakeCatalog, SUPPORTED_SERVICES } from "./catalog.js";
import { detectService, validateUrl } from "./privacy.js";

export function resolveLink({ input_url: inputUrl, target_service: requestedTargetService }) {
  let validatedUrl;
  try {
    validatedUrl = validateUrl(inputUrl);
  } catch {
    return failure("invalid_input_url", "unknown", requestedTargetService);
  }

  const sourceService = detectService(validatedUrl);
  if (sourceService === "unknown") {
    return failure("unsupported_source_service", sourceService, requestedTargetService);
  }

  const targetService = resolveTargetService(requestedTargetService, sourceService);
  if (!targetService) {
    return failure("unsupported_target_service", sourceService, requestedTargetService);
  }

  const item = fakeCatalog.find((entry) =>
    Object.values(entry.links).some((link) => sameUrl(link, validatedUrl))
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

function resolveTargetService(requestedTargetService, sourceService) {
  if (requestedTargetService === "opposite") {
    return sourceService === "apple" ? "spotify" : "apple";
  }

  return SUPPORTED_SERVICES.includes(requestedTargetService) ? requestedTargetService : null;
}

function sameUrl(left, right) {
  return validateUrl(left) === validateUrl(right);
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
