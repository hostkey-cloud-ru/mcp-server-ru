# Changelog

## [Unreleased]

## [1.0.3] — 2026-10-13

- Fix `list_iso_images`: required InvAPI param `id` (was optional misnamed `server_id`).
- Fix `download_invoice`: accept binary PDF (`%PDF`) as base64 MCP payload instead of "HTTP 200, non-JSON".
- Fix `search_servers_by_tag`: call `tags/search_user` (was wrong action `user_search`).
- HTTP: `express-rate-limit` on `/mcp` (`HOSTKEY_RATE_LIMIT_WINDOW_MS`, `HOSTKEY_RATE_LIMIT_MAX`); `/health` excluded.
- HTTP: `GET /.well-known/mcp/server-card.json` (+ `/mcp/server-card.json`); `/health` → `{ ok, version, name }`.
- HTTP: structured JSON logs to stderr (Bearer fingerprint only, no full keys).
- `check_task`: best-effort MCP `notifications/progress` when client sends `progressToken`.
- Align `server.json` / package version to 1.0.3; remotes URL for hosted RU.
- CORS/OPTIONS and `HOSTKEY_CORS_ORIGINS` (mirrored from COM).

## [1.0.2]

- Hosted HTTP Streamable mode aligned with COM.
