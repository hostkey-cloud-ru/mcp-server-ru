# Публикация (RU)

Портал `.ru`. COM — отдельный репозиторий `hostkey-cloud/mcp-server`.

## Перед релизом

1. Собрать и проверить на боевом ключе: `get_account_info` → `get_servers` → `list_presets` → `get_power_status`.
2. Проверить iso/s3/rhr на API.
3. `npm view hostkey-mcp-server-ru` → 404.

## GitHub

Приватный `hostkey-cloud-ru/mcp-server-ru` → push → зелёный CI → сделать публичным.

## npm

Первый раз вручную: `npm login` → `npm version 1.0.0` → `npm publish --access public`.
Дальше — Trusted Publisher + GitHub Release → `publish.yml`.

Не забыть синхронизировать версию в `server.json`.

## MCP Registry

`mcp-publisher login github` → `mcp-publisher publish`
(`io.github.hostkey-cloud-ru/mcp-server-ru`).

## После публикации

Проверить `npx -y hostkey-mcp-server-ru`, обновить README на npx и кнопку Install in Cursor.
