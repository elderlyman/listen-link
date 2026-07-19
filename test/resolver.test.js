import assert from "node:assert/strict";
import test from "node:test";
import { resolveLink } from "../src/resolver.js";
import { sanitizeUrl } from "../src/privacy.js";

test("resolves a fake Apple Music song to Spotify", () => {
  const result = resolveLink({
    input_url: "https://music.apple.com/us/song/blinding-lights/1499378108?utm_source=messages",
    target_service: "spotify"
  });

  assert.equal(result.ok, true);
  assert.equal(result.url, "https://open.spotify.com/track/0VjIjW4GlUZAMYd2vXMi3b");
  assert.equal(result.source_service, "apple");
  assert.equal(result.target_service, "spotify");
});

test("returns exact confidence when source and target are the same service", () => {
  const result = resolveLink({
    input_url: "https://open.spotify.com/track/2Fxmhks0bxGSBdJ92vM42m",
    target_service: "spotify"
  });

  assert.equal(result.ok, true);
  assert.equal(result.confidence, "exact");
});

test("extracts links from surrounding message text", () => {
  const result = resolveLink({
    input_url: "Try this: https://music.apple.com/us/song/levitating/1495799403",
    target_service: "spotify"
  });

  assert.equal(result.ok, true);
  assert.equal(result.target_service, "spotify");
});

test("rejects unsupported source services", () => {
  const result = resolveLink({
    input_url: "https://example.com/song/123",
    target_service: "spotify"
  });

  assert.equal(result.ok, false);
  assert.equal(result.reason, "unsupported_source_service");
});

test("rejects unsupported target services", () => {
  const result = resolveLink({
    input_url: "https://music.apple.com/us/song/blinding-lights/1499378108",
    target_service: "youtube"
  });

  assert.equal(result.ok, false);
  assert.equal(result.reason, "unsupported_target_service");
});

test("strips common tracking parameters", () => {
  const sanitized = sanitizeUrl("https://open.spotify.com/track/abc?si=secret&utm_source=messages");

  assert.equal(sanitized, "https://open.spotify.com/track/abc");
});
