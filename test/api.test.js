import assert from "node:assert/strict";
import test from "node:test";
import resolveHandler from "../api/resolve.js";
import { GET as healthHandler } from "../api/health.js";

test("Vercel resolve function returns plain text for Shortcuts", async () => {
  const request = new Request("https://listen-link.example/resolve", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      input_url: "https://music.apple.com/us/song/1499378607",
      target_service: "opposite",
      response_format: "text"
    })
  });

  const response = await resolveHandler.fetch(request);

  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type"), /^text\/plain/);
  assert.equal(await response.text(), "https://open.spotify.com/track/0VjIjW4GlUZAMYd2vXMi3b");
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
