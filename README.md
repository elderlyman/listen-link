# Listen Link

Listen Link is a recipient-first music link resolver.

The v1 concept is intentionally narrow:

1. A sender shares a music link from Apple Music or Spotify.
2. The sender chooses the recipient's preferred service.
3. Listen Link resolves the track or album to that service.
4. The sender shares a link the recipient can actually open.

This repo starts with fake catalog data for tracks and albums so the product flow can be tested before using real music-service APIs or credentials.

## Privacy Posture

Be extremely vigilant about data leaks.

- Do not log raw music URLs.
- Do not log song titles, artist names, sender names, recipient names, phone numbers, or IP-linked history.
- Do not require user login for the prototype.
- Preserve incoming URL parameters; tracking sanitization is deferred because
  some parameters, such as Apple Music's `i`, identify the track.
- Cache only neutral identifiers in future real implementations, such as `ISRC -> platform track ID`.

Apple Music URLs are matched by their service, item type, and numeric catalog
identifier. Album-form track links such as `/album/.../ALBUM_ID?i=TRACK_ID` use
the `i` value as the track identifier, so storefronts, slugs, and unrelated
parameters do not affect matching.

## Run Locally

```sh
npm test
npm start
```

The server listens on `http://localhost:3000` by default.

## Deploy to Vercel

Connect this repository to a Vercel project and deploy it. The included Vercel
Functions expose the same public routes used by the local server:

- `POST /resolve`
- `GET /health`

Point the distributed Shortcut at `https://YOUR_DOMAIN/resolve`. The current
fake-catalog prototype does not require environment variables. Never commit
provider credentials; add them through Vercel Environment Variables when live
catalog lookup is implemented.

## API

### `POST /resolve`

Request:

```json
{
  "input_url": "https://music.apple.com/us/album/blinding-lights/1488408555?i=1488408568",
  "target_service": "spotify",
  "shortcut_version": "1"
}
```

Response:

```json
{
  "outcome": "share",
  "url": "https://open.spotify.com/track/0VjIjW4GlUZAMYd2vXMi3b"
}
```

Handled failures also return HTTP 200 so Shortcuts can display them like an
ordinary app alert:

```json
{
  "outcome": "alert",
  "message": "This song isn’t available in Listen Link yet. You can share the original link instead."
}
```

The public response contains only fields the Shortcut needs. Internal reason
codes and privacy-safe operational metrics remain server-side.

### `GET /examples`

Returns fake track and album examples for local testing. This endpoint is for development only and does not log requests.

### `GET /health`

Returns service health without checking external dependencies.

## Shortcut Prototype

The iOS Shortcut:

1. Receives a URL from the Share Sheet.
2. Asks which service the recipient uses.
3. Sends `input_url`, `target_service`, and `shortcut_version` to `/resolve`.
4. Shares `url` when `outcome` is `share`.
5. Shows `message` in an alert when `outcome` is `alert`.

No Spotify or Apple credentials are needed until the fake-data flow proves useful.
