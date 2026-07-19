import assert from "node:assert/strict";
import test from "node:test";
import { resolveLink } from "../src/resolver.js";
import { sanitizeUrl } from "../src/privacy.js";

test("resolves a fake Apple Music track to Spotify", () => {
  const result = resolveLink({
    input_url: "https://music.apple.com/us/song/1499378607?utm_source=messages",
    target_service: "spotify"
  });

  assert.equal(result.ok, true);
  assert.equal(result.item_type, "track");
  assert.equal(result.url, "https://open.spotify.com/track/0VjIjW4GlUZAMYd2vXMi3b");
  assert.equal(result.share_text, result.url);
  assert.equal(result.source_service, "apple");
  assert.equal(result.target_service, "spotify");
});

test("resolves a fake Spotify album to Apple Music", () => {
  const result = resolveLink({
    input_url: "https://open.spotify.com/album/6s84u2TUpR3wdUv4NgKA2j",
    target_service: "apple"
  });

  assert.equal(result.ok, true);
  assert.equal(result.item_type, "album");
  assert.equal(result.url, "https://music.apple.com/us/album/sour/1560735414");
  assert.equal(result.share_text, result.url);
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
    input_url: "Try this: https://music.apple.com/us/song/1538003843",
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
    input_url: "https://music.apple.com/us/song/1499378607",
    target_service: "youtube"
  });

  assert.equal(result.ok, false);
  assert.equal(result.reason, "unsupported_target_service");
});

test("strips common tracking parameters", () => {
  const sanitized = sanitizeUrl("https://open.spotify.com/track/abc?si=tracking-id&utm_source=messages");

  assert.equal(sanitized, "https://open.spotify.com/track/abc");
});
