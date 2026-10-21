import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { InvApiClient } from "../client.js";
import { registerRead, registerAction } from "./helpers.js";

/** ISO images (iso.php). */
export function registerIsoTools(
  server: McpServer,
  client: InvApiClient,
): void {
  registerRead(
    server,
    client,
    "list_iso_images",
    "Список доступных ISO-образов (iso/list_iso). InvAPI требует id сервера (для клиентских ключей); образы подбираются под конфигурацию сервера.",
    "iso",
    "list_iso",
    {
      id: z.number().int().describe("ID сервера в InvAPI (обязателен)"),
    },
  );

  registerRead(
    server,
    client,
    "get_uploaded_isos",
    "Список ISO-образов, загруженных клиентом (iso/uploaded).",
    "iso",
    "uploaded",
  );

  registerAction(
    server,
    client,
    "upload_iso",
    "Загрузить новый ISO-образ по URL (iso/upload). Доступно клиентам.",
    "iso",
    "upload",
    {
      url: z.string().describe("Прямой URL ISO-образа"),
      name: z.string().optional().describe("Имя образа в библиотеке"),
    },
  );

  registerAction(
    server,
    client,
    "add_iso_image",
    "Добавить новый ISO-образ или обновить существующий по имени (iso/add). Требует специального права 'add'.",
    "iso",
    "add",
    {
      name: z.string().describe("Имя образа"),
      url: z.string().optional().describe("URL образа, если требуется"),
    },
  );

  registerAction(
    server,
    client,
    "mount_iso",
    "Смонтировать ISO-образ на сервер (iso/mount_iso). Асинхронная операция — вернётся callback-ключ для check_task. " +
      "InvAPI ждёт поле `iso` (имя или id). Можно передать iso, либо алиасы name / iso_id.",
    "iso",
    "mount_iso",
    {
      id: z.number().int().describe("ID сервера"),
      iso: z
        .union([z.string(), z.number()])
        .optional()
        .describe("Имя или id ISO (поле InvAPI `iso`)"),
      iso_id: z
        .number()
        .int()
        .optional()
        .describe("Алиас: ID из list_iso_images → iso"),
      name: z
        .string()
        .optional()
        .describe("Алиас: имя / iso_name → iso"),
    },
    {
      map: (args) => {
        const out: Record<string, unknown> = { ...args };
        const iso = out.iso ?? out.name ?? out.iso_id;
        delete out.name;
        delete out.iso_id;
        if (iso == null || String(iso).trim() === "") {
          throw new Error(
            "Укажите iso (InvAPI) или name / iso_id из list_iso_images",
          );
        }
        out.iso = String(iso);
        return out;
      },
    },
  );

  registerAction(
    server,
    client,
    "unmount_iso",
    "Размонтировать ISO-образ с сервера (iso/unmount_iso). Асинхронная операция — вернётся callback-ключ для check_task.",
    "iso",
    "unmount_iso",
    { id: z.number().int().describe("ID сервера") },
  );

  registerAction(
    server,
    client,
    "delete_iso_image",
    "Удалить ISO-образ по ID (iso/delete). ДЕСТРУКТИВНО. По документации доступно только сотрудникам Hostkey — у клиентов, скорее всего, вернёт ошибку прав.",
    "iso",
    "delete",
    { id: z.number().int().describe("ID ISO-образа") },
    { destructive: true },
  );
}
