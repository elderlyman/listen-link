import assert from "node:assert/strict";
import test from "node:test";
import { parseMusicIdentity } from "../src/music-url.js";
import { resolveLink } from "../src/resolver.js";
import { validateUrl } from "../src/privacy.js";

test("resolves a fake Apple Music track to Spotify", () => {
  const result = resolveLink({
    input_url: "https://music.apple.com/us/song/1488408568",
    target_service: "spotify"
  });

  assert.equal(result.ok, true);
  assert.equal(result.item_type, "track");
  assert.equal(result.url, "https://open.spotify.com/track/0VjIjW4GlUZAMYd2vXMi3b");
  assert.equal(result.share_text, result.url);
  assert.equal(result.source_service, "apple");
  assert.equal(result.target_service, "spotify");
});

test("resolves an Apple Music album-form track URL to Spotify", () => {
  const result = resolveLink({
    input_url: "https://music.apple.com/us/album/blinding-lights/1488408555?i=1488408568",
    target_service: "spotify"
  });

  assert.equal(result.ok, true);
  assert.equal(result.item_type, "track");
  assert.equal(result.url, "https://open.spotify.com/track/0VjIjW4GlUZAMYd2vXMi3b");
});

test("matches Apple Music tracks across storefronts and slugs", () => {
  const result = resolveLink({
    input_url: "https://music.apple.com/gb/album/a-different-slug/999999999?i=1488408568",
    target_service: "spotify"
  });

  assert.equal(result.ok, true);
  assert.equal(result.url, "https://open.spotify.com/track/0VjIjW4GlUZAMYd2vXMi3b");
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

test("resolves an Apple Music source to the opposite service", () => {
  const result = resolveLink({
    input_url: "https://music.apple.com/us/song/1488408568",
    target_service: "opposite"
  });

  assert.equal(result.ok, true);
  assert.equal(result.source_service, "apple");
  assert.equal(result.target_service, "spotify");
  assert.equal(result.url, "https://open.spotify.com/track/0VjIjW4GlUZAMYd2vXMi3b");
});

test("resolves a Spotify source to the opposite service", () => {
  const result = resolveLink({
    input_url: "https://open.spotify.com/track/2Fxmhks0bxGSBdJ92vM42m",
    target_service: "opposite"
  });

  assert.equal(result.ok, true);
  assert.equal(result.source_service, "spotify");
  assert.equal(result.target_service, "apple");
  assert.equal(result.url, "https://music.apple.com/us/song/1450695739");
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

test("prefers Apple's explicit track selection when shared input contains multiple links", () => {
  const result = resolveLink({
    input_url: [
      "https://music.apple.com/us/song/1499378607",
      "https://music.apple.com/us/song/1499378607",
      "https://music.apple.com/us/album/blinding-lights/1488408555?i=1488408568",
      "https://music.apple.com/us/album/blinding-lights-single/1488408555"
    ].join("\n"),
    target_service: "spotify"
  });

  assert.equal(result.ok, true);
  assert.equal(result.url, "https://open.spotify.com/track/0VjIjW4GlUZAMYd2vXMi3b");
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
    input_url: "https://music.apple.com/us/song/1488408568",
    target_service: "youtube"
  });

  assert.equal(result.ok, false);
  assert.equal(result.reason, "unsupported_target_service");
});

test("preserves URL parameters during validation", () => {
  const validated = validateUrl("https://music.apple.com/us/album/example/123?i=456&utm_source=messages");

  assert.equal(validated, "https://music.apple.com/us/album/example/123?i=456&utm_source=messages");
});

test("parses Apple Music album URLs without a track parameter as albums", () => {
  assert.deepEqual(
    parseMusicIdentity("https://music.apple.com/us/album/after-hours/1499378108"),
    {
      service: "apple",
      itemType: "album",
      itemId: "1499378108",
      storefront: "us"
    }
  );
});

test("rejects non-numeric Apple Music track identifiers", () => {
  assert.throws(() =>
    parseMusicIdentity("https://music.apple.com/us/album/example/123?i=not-a-track")
  );
});
