import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { InvApiClient } from "../client.js";
import { registerRead, registerAction } from "./helpers.js";

/** DNS (pdns.php). Read needs pdns/view, write needs pdns/edit. */
export function registerDnsTools(
  server: McpServer,
  client: InvApiClient,
): void {
  registerRead(
    server,
    client,
    "list_dns_zones",
    "РЎРїРёСЃРѕРє РІСЃРµС… DNS-Р·РѕРЅ Р°РєРєР°СѓРЅС‚Р° РЅР° СЃРµСЂРІРµСЂР°С… PowerDNS Hostkey (pdns/list_zones).",
    "pdns",
    "list_zones",
  );

  registerRead(
    server,
    client,
    "get_dns_zone",
    "РЎРѕРґРµСЂР¶РёРјРѕРµ DNS-Р·РѕРЅС‹: РІСЃРµ Р·Р°РїРёСЃРё (A, AAAA, CNAME, MX, TXT Рё С‚.Рґ.) СЃ Р°РІС‚РѕСЂРёС‚РµС‚РЅРѕРіРѕ СЃРµСЂРІРµСЂР° (pdns/view_zone).",
    "pdns",
    "view_zone",
    { zone: z.string().describe("РРјСЏ Р·РѕРЅС‹, РЅР°РїСЂРёРјРµСЂ example.com") },
  );

  registerRead(
    server,
    client,
    "list_dns_domains",
    "РЎРїРёСЃРѕРє РІСЃРµС… РґРѕРјРµРЅРѕРІ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ РёР· С‚Р°Р±Р»РёС†С‹ РґРѕРјРµРЅРѕРІ (pdns/list_domains).",
    "pdns",
    "list_domains",
  );

  registerRead(
    server,
    client,
    "list_dns_subdomains",
    "РЎРїРёСЃРѕРє СЃР°Р±РґРѕРјРµРЅРѕРІ РїРѕ ID СЃРµСЂРІРµСЂР° (pdns/list_subdomains).",
    "pdns",
    "list_subdomains",
    { server_id: z.number().int().describe("ID СЃРµСЂРІРµСЂР°") },
  );

  registerAction(
    server,
    client,
    "add_dns_domain",
    "РЎРѕР·РґР°С‚СЊ DNS-Р·РѕРЅСѓ Рё РґРѕР±Р°РІРёС‚СЊ РґРѕРјРµРЅ РІ С‚Р°Р±Р»РёС†Сѓ РґРѕРјРµРЅРѕРІ (pdns/add_domain). РўСЂРµР±СѓРµС‚ РїСЂР°РІР° pdns/edit.",
    "pdns",
    "add_domain",
    { name: z.string().describe("РРјСЏ РґРѕРјРµРЅР°, РЅР°РїСЂРёРјРµСЂ example.com") },
  );

  registerAction(
    server,
    client,
    "delete_dns_domain",
    "РЈРґР°Р»РёС‚СЊ РґРѕРјРµРЅ РїРѕ ID: DNS-Р·РѕРЅСѓ, СЃР°Рј РґРѕРјРµРЅ Рё РІСЃРµ РµРіРѕ СЃР°Р±РґРѕРјРµРЅС‹ (pdns/delete_domain). Р”Р•РЎРўР РЈРљРўРР’РќРћ. РўСЂРµР±СѓРµС‚ РїСЂР°РІР° pdns/edit.",
    "pdns",
    "delete_domain",
    {
      server_id: z.number().int().describe("ID СЃРµСЂРІРµСЂР°"),
      domain_id: z.number().int().describe("ID РґРѕРјРµРЅР° РёР· list_dns_domains"),
    },
    { destructive: true },
  );

  registerAction(
    server,
    client,
    "add_dns_subdomain",
    "Р”РѕР±Р°РІРёС‚СЊ СЃР°Р±РґРѕРјРµРЅ РІ С‚Р°Р±Р»РёС†Сѓ СЃР°Р±РґРѕРјРµРЅРѕРІ (pdns/add_subdomain). РўСЂРµР±СѓРµС‚ РїСЂР°РІР° pdns/edit.",
    "pdns",
    "add_subdomain",
    {
      server_id: z.number().int().describe("ID СЃРµСЂРІРµСЂР°"),
      domain_id: z.number().int().describe("ID РґРѕРјРµРЅР° РёР· list_dns_domains"),
      name: z.string().describe("РРјСЏ СЃР°Р±РґРѕРјРµРЅР°"),
    },
  );

  registerAction(
    server,
    client,
    "edit_dns_subdomain",
    "РћР±РЅРѕРІРёС‚СЊ СЃР°Р±РґРѕРјРµРЅ (pdns/edit_subdomain). РўСЂРµР±СѓРµС‚ РїСЂР°РІР° pdns/edit.",
    "pdns",
    "edit_subdomain",
    {
      id: z.number().int().describe("ID СЃР°Р±РґРѕРјРµРЅР°"),
      server_id: z.number().int().optional().describe("ID СЃРµСЂРІРµСЂР°"),
    },
  );

  registerAction(
    server,
    client,
    "delete_dns_subdomain",
    "РЈРґР°Р»РёС‚СЊ СЃР°Р±РґРѕРјРµРЅ РёР· С‚Р°Р±Р»РёС†С‹ СЃР°Р±РґРѕРјРµРЅРѕРІ (pdns/delete_subdomain). Р”Р•РЎРўР РЈРљРўРР’РќРћ. РўСЂРµР±СѓРµС‚ РїСЂР°РІР° pdns/edit.",
    "pdns",
    "delete_subdomain",
    {
      server_id: z.number().int().describe("ID СЃРµСЂРІРµСЂР°"),
      id: z.number().int().describe("ID СЃР°Р±РґРѕРјРµРЅР°"),
    },
    { destructive: true },
  );

  registerAction(
    server,
    client,
    "add_dns_zone",
    "РЎРѕР·РґР°С‚СЊ DNS-Р·РѕРЅСѓ РЅР° Р°РІС‚РѕСЂРёС‚РµС‚РЅРѕРј СЃРµСЂРІРµСЂРµ PowerDNS (pdns/add_zone). РўСЂРµР±СѓРµС‚ РїСЂР°РІР° pdns/edit.",
    "pdns",
    "add_zone",
    {
      name: z.string().describe("РРјСЏ Р·РѕРЅС‹, РЅР°РїСЂРёРјРµСЂ example.com"),
      kind: z
        .enum(["Master", "Slave"])
        .optional()
        .describe("РўРёРї Р·РѕРЅС‹, РїРѕ СѓРјРѕР»С‡Р°РЅРёСЋ Master"),
      rrsets: z
        .boolean()
        .optional()
        .describe("РСЃРїРѕР»СЊР·РѕРІР°С‚СЊ RRset РІРјРµСЃС‚Рѕ records (РїРѕ СѓРјРѕР»С‡Р°РЅРёСЋ true)"),
      dnssec: z
        .boolean()
        .optional()
        .describe("Р’РєР»СЋС‡РёС‚СЊ DNSSEC (РїРѕ СѓРјРѕР»С‡Р°РЅРёСЋ false)"),
      masters: z
        .array(z.string())
        .optional()
        .describe("РЎРїРёСЃРѕРє master-СЃРµСЂРІРµСЂРѕРІ (РґР»СЏ Slave)"),
      dns: z
        .object({
          ttl: z.number().int().optional(),
          mname: z
            .string()
            .optional()
            .describe("Primary NS, РЅР°РїСЂРёРјРµСЂ ns1.hostkey.ru"),
          rname: z
            .string()
            .optional()
            .describe("Email Р°РґРјРёРЅРёСЃС‚СЂР°С‚РѕСЂР°, РЅР°РїСЂРёРјРµСЂ admin.example.com"),
          serial: z
            .number()
            .int()
            .optional()
            .describe("РЎРµСЂРёР°Р» Р·РѕРЅС‹, СЂРµРєРѕРјРµРЅРґСѓРµС‚СЃСЏ YYYYMMDD00"),
          refresh: z.number().int().optional(),
          retry: z.number().int().optional(),
          expire: z.number().int().optional(),
          minimum: z.number().int().optional(),
        })
        .optional()
        .describe(
          "SOA-РїР°СЂР°РјРµС‚СЂС‹ Р·РѕРЅС‹; РїСЂРё РїСЂРѕРїСѓСЃРєРµ РїСЂРёРјРµРЅСЏСЋС‚СЃСЏ РґРµС„РѕР»С‚С‹ Hostkey",
        ),
      nameservers: z
        .array(z.string())
        .optional()
        .describe(
          "NS-СЃРµСЂРІРµСЂС‹ Р·РѕРЅС‹, РїРѕ СѓРјРѕР»С‡Р°РЅРёСЋ ns1.hostkey.ru/ns2.hostkey.ru",
        ),
    },
  );

  registerAction(
    server,
    client,
    "delete_dns_zone",
    "РЈРґР°Р»РёС‚СЊ DNS-Р·РѕРЅСѓ РїРѕ РёРјРµРЅРё РІРјРµСЃС‚Рµ СЃРѕ РІСЃРµРјРё Р·Р°РїРёСЃСЏРјРё Рё РјРµС‚Р°РґР°РЅРЅС‹РјРё (pdns/delete_zone). Р”Р•РЎРўР РЈРљРўРР’РќРћ. РўСЂРµР±СѓРµС‚ РїСЂР°РІР° pdns/edit.",
    "pdns",
    "delete_zone",
    { zone: z.string().describe("РРјСЏ Р·РѕРЅС‹") },
    { destructive: true },
  );

  registerAction(
    server,
    client,
    "add_dns_record",
    "Р”РѕР±Р°РІРёС‚СЊ РёР»Рё РёР·РјРµРЅРёС‚СЊ DNS-Р·Р°РїРёСЃСЊ РІ Р·РѕРЅРµ (pdns/add_dns). РўСЂРµР±СѓРµС‚ РїСЂР°РІР° pdns/edit. " +
      "Р”Р»СЏ SRV-Р·Р°РїРёСЃРµР№ Р·Р°РїРѕР»РЅРёС‚Рµ proto/priority/weight/port/target. РџРѕР»СЏ mname/rname РІ РґРѕРєСѓРјРµРЅС‚Р°С†РёРё РѕС‚РјРµС‡РµРЅС‹ РєР°Рє РѕР±СЏР·Р°С‚РµР»СЊРЅС‹Рµ РґР»СЏ SOA-РїСЂРѕРІРµСЂРѕРє вЂ” РїСЂРё РѕС€РёР±РєРµ Р·Р°РїРѕР»РЅРёС‚Рµ РёС….",
    "pdns",
    "add_dns",
    {
      zone: z.string().describe("РРјСЏ Р·РѕРЅС‹"),
      name: z.string().optional().describe("РРјСЏ Р·Р°РїРёСЃРё, РЅР°РїСЂРёРјРµСЂ www"),
      type: z.string().describe("РўРёРї Р·Р°РїРёСЃРё: A, AAAA, CNAME, MX, TXT, SRVвЂ¦"),
      content: z.string().describe("Р—РЅР°С‡РµРЅРёРµ Р·Р°РїРёСЃРё, РЅР°РїСЂРёРјРµСЂ 10.56.121.5"),
      ttl: z
        .number()
        .int()
        .optional()
        .describe("TTL РІ СЃРµРєСѓРЅРґР°С…, РїРѕ СѓРјРѕР»С‡Р°РЅРёСЋ 3600"),
      old_name: z
        .string()
        .optional()
        .describe("РџСЂРµР¶РЅРµРµ РёРјСЏ Р·Р°РїРёСЃРё вЂ” РґР»СЏ РїРµСЂРµРёРјРµРЅРѕРІР°РЅРёСЏ"),
      increase_soa_serial: z
        .boolean()
        .optional()
        .describe("РђРІС‚РѕРёРЅРєСЂРµРјРµРЅС‚ SOA-СЃРµСЂРёР°Р»Р° (РїРѕ СѓРјРѕР»С‡Р°РЅРёСЋ true)"),
      mname: z.string().optional().describe("Primary NS РІ SOA-Р·Р°РїРёСЃРё"),
      rname: z
        .string()
        .optional()
        .describe("Email Р°РґРјРёРЅРёСЃС‚СЂР°С‚РѕСЂР° РІ SOA-Р·Р°РїРёСЃРё"),
      proto: z.string().optional().describe("РџСЂРѕС‚РѕРєРѕР» РґР»СЏ SRV, РЅР°РїСЂРёРјРµСЂ tcp"),
      priority: z.number().int().optional().describe("РџСЂРёРѕСЂРёС‚РµС‚ РґР»СЏ SRV/MX"),
      weight: z.number().int().optional().describe("Р’РµСЃ РґР»СЏ SRV"),
      port: z.number().int().optional().describe("РџРѕСЂС‚ РґР»СЏ SRV"),
      target: z.string().optional().describe("Р¦РµР»РµРІРѕР№ РґРѕРјРµРЅ РґР»СЏ SRV"),
    },
    {
      map: ({ increase_soa_serial, ...rest }) => ({
        ...rest,
        ...(increase_soa_serial === undefined
          ? {}
          : { increase_soa_serial: increase_soa_serial ? 1 : 0 }),
      }),
    },
  );

  registerAction(
    server,
    client,
    "delete_dns_record",
    "РЈРґР°Р»РёС‚СЊ DNS-Р·Р°РїРёСЃСЊ РёР· Р·РѕРЅС‹ (pdns/delete_dns). Р”Р•РЎРўР РЈРљРўРР’РќРћ. РўСЂРµР±СѓРµС‚ РїСЂР°РІР° pdns/edit.",
    "pdns",
    "delete_dns",
    {
      zone: z.string().describe("РРјСЏ Р·РѕРЅС‹"),
      name: z.string().describe("РРјСЏ Р·Р°РїРёСЃРё"),
      type: z.string().describe("РўРёРї Р·Р°РїРёСЃРё"),
    },
    { destructive: true },
  );
}
