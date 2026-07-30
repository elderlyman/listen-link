import assert from "node:assert/strict";
import test from "node:test";
import resolveHandler from "../api/resolve.js";
import { GET as healthHandler } from "../api/health.js";

test("Vercel resolve function returns plain text for Shortcuts", async () => {
  const request = new Request("https://listen-link.example/resolve", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      input_url: "https://music.apple.com/us/song/1488408568",
      target_service: "opposite",
      response_format: "text"
    })
  });

  const response = await resolveHandler.fetch(request);

  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type"), /^text\/plain/);
  assert.equal(await response.text(), "https://open.spotify.com/track/0VjIjW4GlUZAMYd2vXMi3b");
});

test("Vercel resolve function returns the Shortcut share contract", async () => {
  const request = new Request("https://listen-link.example/resolve", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      input_url: "https://music.apple.com/us/album/blinding-lights/1488408555?i=1488408568",
      target_service: "spotify",
      shortcut_version: "1"
    })
  });

  const response = await resolveHandler.fetch(request);

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    outcome: "share",
    url: "https://open.spotify.com/track/0VjIjW4GlUZAMYd2vXMi3b"
  });
});

test("Vercel resolve function returns a user-facing alert without internal error codes", async () => {
  const request = new Request("https://listen-link.example/resolve", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      input_url: "https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT",
      target_service: "apple",
      shortcut_version: "1"
    })
  });

  const response = await resolveHandler.fetch(request);
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.outcome, "alert");
  assert.match(payload.message, /isn.t available/i);
  assert.equal("reason" in payload, false);
  assert.equal(JSON.stringify(payload).includes("4cOdK2wGLETKBW3PvgPWqT"), false);
});

test("Vercel resolve function rejects non-POST requests", async () => {
  const response = await resolveHandler.fetch(new Request("https://listen-link.example/resolve"));

  assert.equal(response.status, 405);
  assert.equal(response.headers.get("allow"), "POST");
});

test("Vercel resolve function rejects oversized bodies", async () => {
  const response = await resolveHandler.fetch(new Request("https://listen-link.example/resolve", {
    method: "POST",
    body: "x".repeat(4097)
  }));

  assert.equal(response.status, 413);
});

test("Vercel health function reports healthy", async () => {
  const response = healthHandler();

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true });
});
