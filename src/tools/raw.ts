import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { InvApiClient } from "../client.js";
import { ok, fail, note } from "./helpers.js";
import { maskSecrets } from "../client.js";

/** Actions that also need HOSTKEY_ALLOW_DESTRUCTIVE=1. */
const DANGEROUS_ACTIONS =
  /^(delete|remove|off|reboot|reinstall|create_pxe|clear_pxe|boot_dev|order_instance|request_cancellation|apply_credit|mass_pay|create_addfunds|restore_snapshot|remove_snapshot|port_off|block_ip|request_poff|request_reboot)/i;

/** Raw InvAPI call for endpoints without a typed tool. */
export function registerRawTool(server: McpServer, client: InvApiClient): void {
  server.registerTool(
    "call_api_raw",
    {
      description:
        "РЈРЅРёРІРµСЂСЃР°Р»СЊРЅС‹Р№ РїСЂСЏРјРѕР№ РІС‹Р·РѕРІ InvAPI РїРѕ СЂРµСЃСѓСЂСЃСѓ Рё action, РґР»СЏ СЂРµСЃСѓСЂСЃРѕРІ Р±РµР· С‚РёРїРёР·РёСЂРѕРІР°РЅРЅС‹С… РёРЅСЃС‚СЂСѓРјРµРЅС‚РѕРІ " +
        "(РЅР°РїСЂРёРјРµСЂ: iso вЂ” Р±РёР±Р»РёРѕС‚РµРєР° ISO-РѕР±СЂР°Р·РѕРІ, s3 вЂ” S3 Object Storage, rhr вЂ” Remote Hands РЅРѕРІРѕР№ РІРµСЂСЃРёРё; " +
        "СЃРїРёСЃРѕРє РґРµР№СЃС‚РІРёР№ СЃРјРѕС‚СЂРёС‚Рµ РІ РґРѕРєСѓРјРµРЅС‚Р°С†РёРё: https://hostkey.ru/documentation/apidocs/). " +
        "Р’РЎР•Р“Р”Рђ С‚СЂРµР±СѓРµС‚ confirm=true; РґРµСЃС‚СЂСѓРєС‚РёРІРЅС‹Рµ/РїР»Р°С‚РЅС‹Рµ РґРµР№СЃС‚РІРёСЏ РґРѕРїРѕР»РЅРёС‚РµР»СЊРЅРѕ С‚СЂРµР±СѓСЋС‚ HOSTKEY_ALLOW_DESTRUCTIVE=1. " +
        "РџСЂРµРґРїРѕС‡РёС‚Р°Р№С‚Рµ С‚РёРїРёР·РёСЂРѕРІР°РЅРЅС‹Рµ РёРЅСЃС‚СЂСѓРјРµРЅС‚С‹, РµСЃР»Рё РѕРЅРё РµСЃС‚СЊ РґР»СЏ РЅСѓР¶РЅРѕР№ РѕРїРµСЂР°С†РёРё.",
      inputSchema: {
        resource: z
          .string()
          .describe(
            "Р РµСЃСѓСЂСЃ InvAPI Р±РµР· .php, РЅР°РїСЂРёРјРµСЂ: iso, s3, rhr, eq, net, whmcs",
          ),
        action: z.string().describe("Р”РµР№СЃС‚РІРёРµ СЂРµСЃСѓСЂСЃР°, РЅР°РїСЂРёРјРµСЂ: list"),
        params: z
          .record(z.any())
          .optional()
          .describe(
            "РџР°СЂР°РјРµС‚СЂС‹ РІС‹Р·РѕРІР° РѕР±СЉРµРєС‚РѕРј; РІР»РѕР¶РµРЅРЅС‹Рµ РѕР±СЉРµРєС‚С‹ РїСЂРµРІСЂР°С‰Р°СЋС‚СЃСЏ РІ params[...]",
          ),
        auth: z
          .boolean()
          .optional()
          .describe("РџРѕРґСЃС‚Р°РІР»СЏС‚СЊ СЃРµСЃСЃРёРѕРЅРЅС‹Р№ С‚РѕРєРµРЅ (РїРѕ СѓРјРѕР»С‡Р°РЅРёСЋ true)"),
        confirm: z
          .boolean()
          .describe(
            "РћР±СЏР·Р°С‚РµР»СЊРЅРѕРµ РїРѕРґС‚РІРµСЂР¶РґРµРЅРёРµ. Р‘РµР· confirm=true РІС‹Р·РѕРІ РѕС‚РєР»РѕРЅСЏРµС‚СЃСЏ.",
          ),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        openWorldHint: true,
      },
    },
    async ({ resource, action, params = {}, auth, confirm }) => {
      if (confirm !== true) {
        return note(
          "Р’С‹Р·РѕРІ РЅРµ РІС‹РїРѕР»РЅРµРЅ: call_api_raw РІСЃРµРіРґР° С‚СЂРµР±СѓРµС‚ confirm=true.",
        );
      }
      if (
        DANGEROUS_ACTIONS.test(action) &&
        process.env.HOSTKEY_ALLOW_DESTRUCTIVE !== "1"
      ) {
        return note(
          `Р”РµР№СЃС‚РІРёРµ В«${action}В» РІС‹РіР»СЏРґРёС‚ РґРµСЃС‚СЂСѓРєС‚РёРІРЅС‹Рј РёР»Рё РїР»Р°С‚РЅС‹Рј Рё РѕС‚РєР»РѕРЅРµРЅРѕ: ` +
            "СѓСЃС‚Р°РЅРѕРІРёС‚Рµ HOSTKEY_ALLOW_DESTRUCTIVE=1 РІ РѕРєСЂСѓР¶РµРЅРёРё MCP-СЃРµСЂРІРµСЂР°, С‡С‚РѕР±С‹ СЂР°Р·СЂРµС€РёС‚СЊ С‚Р°РєРёРµ РІС‹Р·РѕРІС‹.",
        );
      }
      try {
        const res = await client.call(resource, action, params, { auth });
        const callback = (res as Record<string, unknown> | null)?.callback;
        const suffix =
          typeof callback === "string"
            ? `\n\nРћРїРµСЂР°С†РёСЏ Р°СЃРёРЅС…СЂРѕРЅРЅР°СЏ. Callback-РєР»СЋС‡: ${callback}. РћС‚СЃР»РµР¶РёРІР°Р№С‚Рµ СЃС‚Р°С‚СѓСЃ РёРЅСЃС‚СЂСѓРјРµРЅС‚РѕРј check_task.`
            : "";
        return ok(JSON.stringify(maskSecrets(res), null, 2) + suffix);
      } catch (e) {
        return fail(e);
      }
    },
  );
}
