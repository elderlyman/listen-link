import { detectService, validateUrl } from "./privacy.js";

const APPLE_ID = /^\d+$/;
const SPOTIFY_ID = /^[A-Za-z0-9]+$/;

export function parseMusicIdentity(input) {
  const validatedUrl = validateUrl(input);
  const url = new URL(validatedUrl);
  const service = detectService(validatedUrl);

  if (service === "apple") {
    return parseAppleIdentity(url);
  }

  if (service === "spotify") {
    return parseSpotifyIdentity(url);
  }

  throw new Error("Unsupported music service");
}

export function musicIdentityKey(identity) {
  return `${identity.service}:${identity.itemType}:${identity.itemId}`;
}

function parseAppleIdentity(url) {
  const segments = pathSegments(url);
  const itemTypeIndex = segments.findIndex((segment) => segment === "song" || segment === "album");
  if (itemTypeIndex === -1) {
    throw new Error("Unsupported Apple Music URL");
  }

  const trackId = url.searchParams.get("i");
  if (trackId !== null) {
    if (!APPLE_ID.test(trackId)) {
      throw new Error("Invalid Apple Music track ID");
    }

    return {
      service: "apple",
      itemType: "track",
      itemId: trackId,
      storefront: storefrontBefore(segments, itemTypeIndex)
    };
  }

  const itemId = segments.at(-1);
  if (!itemId || !APPLE_ID.test(itemId)) {
    throw new Error("Invalid Apple Music item ID");
  }

  return {
    service: "apple",
    itemType: segments[itemTypeIndex] === "song" ? "track" : "album",
    itemId,
    storefront: storefrontBefore(segments, itemTypeIndex)
  };
}

function parseSpotifyIdentity(url) {
  const segments = pathSegments(url);
  const itemTypeIndex = segments.findIndex((segment) => segment === "track" || segment === "album");
  if (itemTypeIndex === -1) {
    throw new Error("Unsupported Spotify URL");
  }

  const itemId = segments[itemTypeIndex + 1];
  if (!itemId || !SPOTIFY_ID.test(itemId)) {
    throw new Error("Invalid Spotify item ID");
  }

  return {
    service: "spotify",
    itemType: segments[itemTypeIndex],
    itemId
  };
}

function pathSegments(url) {
  return url.pathname.split("/").filter(Boolean);
}

function storefrontBefore(segments, itemTypeIndex) {
  const storefront = segments[itemTypeIndex - 1];
  return storefront && /^[A-Za-z]{2}$/.test(storefront) ? storefront.toLowerCase() : null;
}
