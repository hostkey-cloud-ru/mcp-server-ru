# Hostkey MCP Server (RU)

MCP-сервер для [Hostkey](https://hostkey.ru/) (портал **.ru**, InvAPI `invapi.hostkey.ru`).
Клиент запускает сервер локально по stdio — из Cursor, VS Code и других MCP-клиентов.
Удалённый endpoint: `https://mcp.hostkey.ru/mcp` (для облачных агентов).

| | |
|---|---|
| **Endpoint** | `https://invapi.hostkey.ru` (зашит в код) |
| **Авторизация** | `HOSTKEY_API_KEY` |
| **Инструменты** | 132 типизированных + `call_api_raw` |

Сервер даёт модели доступ к аккаунту Hostkey: серверы, каталог и заказ, питание, переустановка ОС,
сеть, DNS, снапшоты, IPMI/консоль, ISO, S3, Remote Hands, биллинг и API-ключи.

Для портала **.com** — отдельный пакет `hostkey-mcp-server`.

## 1. Получите API-ключ

[InvAPI](https://invapi.hostkey.ru) → управление API-ключами → выпустите ключ.

Лучше отдельный ключ для MCP. Ключ на один сервер ограничивает доступ этим сервером.
Для записи DNS нужны права `pdns/edit`.

## 2. Установка

### Cursor

[![Install in Cursor](https://cursor.com/deeplink/mcp-install-dark.svg)](https://cursor.com/install-mcp?name=hostkey-mcp-server-ru&config=eyJjb21tYW5kIjoibnB4IiwiYXJncyI6WyIteSIsImhvc3RrZXktbWNwLXNlcnZlci1ydSJdLCJlbnYiOnsiSE9TVEtFWV9BUElfS0VZIjoiWU9VUl9BUElfS0VZIn19)

Нажми кнопку, подставь свой InvAPI-ключ вместо `YOUR_API_KEY`, подтверди.

Или вручную в `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "hostkey-mcp-server-ru": {
      "command": "npx",
      "args": ["-y", "hostkey-mcp-server-ru"],
      "env": {
        "HOSTKEY_API_KEY": "your-api-key"
      }
    }
  }
}
```

### Remote (облачные агенты)

Без локального Node/`npx`. URL сервиса + InvAPI-ключ:

```json
{
  "mcpServers": {
    "hostkey": {
      "url": "https://mcp.hostkey.ru/mcp",
      "headers": {
        "Authorization": "Bearer your-api-key"
      }
    }
  }
}
```

### VS Code

`.vscode/mcp.json`:

```json
{
  "mcp.servers": {
    "hostkey-mcp-server-ru": {
      "command": "npx",
      "args": ["-y", "hostkey-mcp-server-ru"],
      "env": {
        "HOSTKEY_API_KEY": "your-api-key"
      }
    }
  }
}
```

Опционально: `HOSTKEY_TOKEN_TTL`, `HOSTKEY_HTTP_TIMEOUT`, `HOSTKEY_ALLOW_DESTRUCTIVE`
(см. `.env.example`).

Из исходников (Node.js ≥ 20): `npm install && npm run build`.

## 3. Подтверждение опасных операций

Все write-вызовы требуют `confirm=true`. Без него сервер ничего не меняет.

Дополнительно:

- заказ сервера по умолчанию в `dry_run` — реальный заказ только после явного согласия;
- переустановка ОС, PXE и отмена услуг — только при `HOSTKEY_ALLOW_DESTRUCTIVE=1`;
- пароли и токены в ответах маскируются.

Долгие операции (деплой, переустановка) возвращают callback-ключ — статус через `check_task`.

## 4. Инструменты

Группы (полный список виден клиенту в `tools/list`):

| Группа | Примеры |
|---|---|
| Серверы | `get_servers`, `get_server`, `get_power_status` |
| Каталог | `list_presets`, `list_os`, `list_traffic_plans` |
| Питание и заказ | `power_on`, `power_off`, `order_server`, `reinstall_server` |
| PXE | `create_reinstall_task` → … → `clear_pxe_config` |
| Сеть / DNS | порты, PTR, зоны и записи |
| Снапшоты, ISO, S3 | ВМ-снапшоты, образы, бакеты |
| Remote Hands | тикеты дежурной смене (`request_rh_*`, `rhr_*`) |
| Биллинг | счета, платежи, контакты |
| Прочее | `check_task`, `call_api_raw` |

## Промпты

| Промпт | Зачем |
|---|---|
| `order_server_prompt` | заказ сервера по шагам |
| `reinstall_server_prompt` | переустановка ОС |
| `troubleshoot_server_prompt` | диагностика |

Или просто напишите: «покажи мои серверы» / «закажи VPS в NL» — модель выберет нужные инструменты.
