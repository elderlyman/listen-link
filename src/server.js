import http from "node:http";
import { fakeCatalog } from "./catalog.js";
import { resolveLink } from "./resolver.js";
import { privacySafeMetric } from "./privacy.js";

const PORT = Number.parseInt(process.env.PORT || "3000", 10);
const HOST = process.env.HOST || "127.0.0.1";

const server = http.createServer(async (req, res) => {
  const startedAt = Date.now();

  if (req.method === "GET" && req.url === "/") {
    return sendHtml(res, 200, homePageHtml);
  }

  if (req.method === "GET" && req.url === "/health") {
    return sendJson(res, 200, { ok: true });
  }

  if (req.method === "GET" && req.url === "/examples") {
    return sendJson(res, 200, { ok: true, examples: publicExamples() });
  }

  if (req.method === "POST" && req.url === "/resolve") {
    let body;
    try {
      body = await readJson(req);
    } catch {
      return sendJson(res, 400, { ok: false, reason: "invalid_json" });
    }

    const result = resolveLink(body);
    const durationMs = Date.now() - startedAt;

    console.info(JSON.stringify(privacySafeMetric({
      sourceService: result.source_service,
      targetService: result.target_service,
      result: result.ok ? "success" : result.reason,
      confidence: result.confidence,
      durationMs
    })));

    return sendJson(res, result.ok ? 200 : 422, result);
  }

  return sendJson(res, 404, { ok: false, reason: "not_found" });
});

server.listen(PORT, HOST, () => {
  console.info(`Listen Link fake resolver listening on http://${HOST}:${PORT}`);
});

async function readJson(req) {
  let raw = "";
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 4096) {
      throw new Error("Request body too large");
    }
  }

  return raw ? JSON.parse(raw) : {};
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store"
  });
  res.end(JSON.stringify(payload));
}

function publicExamples() {
  return fakeCatalog.map((item) => ({
    item_type: item.itemType,
    title: item.title,
    artist: item.artist,
    apple: item.links.apple,
    spotify: item.links.spotify
  }));
}

function sendHtml(res, statusCode, html) {
  res.writeHead(statusCode, {
    "content-type": "text/html; charset=utf-8",
    "cache-control": "no-store"
  });
  res.end(html);
}

const homePageHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Listen Link Resolver Test</title>
  <style>
    :root {
      color-scheme: light dark;
      --bg: #f7f7f3;
      --panel: #ffffff;
      --text: #171717;
      --muted: #5f6468;
      --line: #d8d9d4;
      --accent: #176f5b;
      --accent-strong: #0f4f41;
      --danger: #a33a2b;
    }

    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #151717;
        --panel: #202322;
        --text: #f4f1ea;
        --muted: #b8b6ad;
        --line: #3a3d3a;
        --accent: #7fd4bd;
        --accent-strong: #a8ead8;
        --danger: #ff9b8d;
      }
    }

    * { box-sizing: border-box; }

    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      padding: 24px;
      background: var(--bg);
      color: var(--text);
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      line-height: 1.5;
    }

    main {
      width: min(100%, 640px);
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 24px;
      box-shadow: 0 18px 50px rgba(0, 0, 0, 0.08);
    }

    h1 {
      margin: 0 0 8px;
      font-size: 28px;
      line-height: 1.15;
      letter-spacing: 0;
    }

    p {
      margin: 0 0 20px;
      color: var(--muted);
    }

    label {
      display: block;
      margin: 18px 0 8px;
      font-weight: 650;
    }

    textarea,
    select,
    button {
      width: 100%;
      min-height: 44px;
      border-radius: 8px;
      font: inherit;
    }

    textarea,
    select {
      border: 1px solid var(--line);
      background: transparent;
      color: var(--text);
      padding: 10px 12px;
    }

    textarea {
      min-height: 104px;
      resize: vertical;
    }

    button {
      margin-top: 20px;
      border: 0;
      background: var(--accent);
      color: white;
      font-weight: 750;
      cursor: pointer;
    }

    button:disabled {
      cursor: wait;
      opacity: 0.72;
    }

    .result {
      margin-top: 18px;
      padding-top: 18px;
      border-top: 1px solid var(--line);
      word-break: break-word;
    }

    .result a {
      color: var(--accent-strong);
      font-weight: 700;
    }

    .error {
      color: var(--danger);
      font-weight: 700;
    }
  </style>
</head>
<body>
  <main>
    <h1>Listen Link</h1>
    <p>Test fake tracks and albums before wiring the iOS Shortcut.</p>

    <form id="resolve-form">
      <label for="sample-link">Sample</label>
      <select id="sample-link">
        <option value="">Custom link</option>
      </select>

      <label for="input-url">Shared music link</label>
      <textarea id="input-url" name="input_url" required>https://music.apple.com/us/song/1499378607</textarea>

      <label for="target-service">Recipient service</label>
      <select id="target-service" name="target_service">
        <option value="spotify">Spotify</option>
        <option value="apple">Apple Music</option>
      </select>

      <button type="submit">Resolve Link</button>
    </form>

    <div id="result" class="result" hidden></div>
  </main>

  <script>
    const form = document.querySelector("#resolve-form");
    const button = form.querySelector("button");
    const result = document.querySelector("#result");
    const inputUrl = document.querySelector("#input-url");
    const sampleLink = document.querySelector("#sample-link");

    loadExamples();

    sampleLink.addEventListener("change", () => {
      if (sampleLink.value) {
        inputUrl.value = sampleLink.value;
      }
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      button.disabled = true;
      button.textContent = "Resolving...";
      result.hidden = true;
      result.textContent = "";

      const formData = new FormData(form);
      const payload = {
        input_url: formData.get("input_url"),
        target_service: formData.get("target_service")
      };

      try {
        const response = await fetch("/resolve", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload)
        });
        const data = await response.json();

        if (!response.ok || !data.ok) {
          result.innerHTML = '<span class="error">Could not resolve: ' + escapeHtml(data.reason || "unknown_error") + '</span>';
        } else {
          result.innerHTML = '<div>Type: ' + escapeHtml(data.item_type) + '</div><div>Confidence: ' + escapeHtml(data.confidence) + '</div><a href="' + escapeAttribute(data.url) + '" target="_blank" rel="noreferrer">' + escapeHtml(data.url) + '</a>';
        }
      } catch {
        result.innerHTML = '<span class="error">Could not reach the resolver.</span>';
      } finally {
        result.hidden = false;
        button.disabled = false;
        button.textContent = "Resolve Link";
      }
    });

    async function loadExamples() {
      try {
        const response = await fetch("/examples");
        const data = await response.json();
        if (!data.ok) return;

        for (const example of data.examples) {
          sampleLink.appendChild(exampleOption(example, "apple"));
          sampleLink.appendChild(exampleOption(example, "spotify"));
        }
      } catch {
        // The form still works with manual URLs if examples cannot load.
      }
    }

    function exampleOption(example, service) {
      const option = document.createElement("option");
      option.value = example[service];
      option.textContent = example.item_type + " - " + example.title + " - " + service;
      return option;
    }

    function escapeHtml(value) {
      return String(value).replace(/[&<>"']/g, (char) => {
        if (char === "&") return "&amp;";
        if (char === "<") return "&lt;";
        if (char === ">") return "&gt;";
        if (char === '"') return "&quot;";
        return "&#39;";
      });
    }

    function escapeAttribute(value) {
      return escapeHtml(value);
    }
  </script>
</body>
</html>`;
