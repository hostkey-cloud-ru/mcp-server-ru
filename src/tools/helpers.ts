import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { maskSecrets, type InvApiClient } from "../client.js";

export type ToolResult = {
  content: Array<{ type: "text"; text: string }>;
  isError?: boolean;
};

export function ok(data: unknown): ToolResult {
  return {
    content: [
      {
        type: "text",
        text: typeof data === "string" ? data : JSON.stringify(data, null, 2),
      },
    ],
  };
}

export function fail(e: unknown): ToolResult {
  const message = e instanceof Error ? e.message : String(e);
  return {
    isError: true,
    content: [{ type: "text", text: `Ошибка: ${message}` }],
  };
}

export function note(message: string): ToolResult {
  return { content: [{ type: "text", text: message }] };
}

export const confirmField = {
  confirm: z
    .boolean()
    .describe("Нужно true, чтобы выполнить операцию."),
};

type Schema = Record<string, z.ZodTypeAny>;
type Params = Record<string, unknown>;
type MapFn = (args: Params) => Params;

const READ_ANNOTATIONS = { readOnlyHint: true, openWorldHint: true } as const;

function withAsyncHint(res: unknown): string {
  const callback = (res as Record<string, unknown> | null)?.callback;
  const base = JSON.stringify(maskSecrets(res), null, 2);
  return typeof callback === "string"
    ? `${base}\n\nАсинхронная задача. Callback: ${callback}. Смотри статус через check_task.`
    : base;
}

/** Read-only инструмент поверх InvAPI. */
export function registerRead(
  server: McpServer,
  client: InvApiClient,
  name: string,
  description: string,
  resource: string,
  action: string,
  inputSchema: Schema = {},
  opts: { auth?: boolean; map?: MapFn } = {},
): void {
  server.registerTool(
    name,
    { description, inputSchema, annotations: READ_ANNOTATIONS },
    async (args) => {
      try {
        const params = opts.map ? opts.map(args as Params) : (args as Params);
        return ok(
          await client.call(resource, action, params, { auth: opts.auth }),
        );
      } catch (e) {
        return fail(e);
      }
    },
  );
}

/** Write-инструмент. Нужен confirm=true; envGuard — ещё HOSTKEY_ALLOW_DESTRUCTIVE. */
export function registerAction(
  server: McpServer,
  client: InvApiClient,
  name: string,
  description: string,
  resource: string,
  action: string,
  inputSchema: Schema = {},
  opts: { destructive?: boolean; envGuard?: boolean; map?: MapFn } = {},
): void {
  server.registerTool(
    name,
    {
      description,
      inputSchema: { ...inputSchema, ...confirmField },
      annotations: {
        readOnlyHint: false,
        destructiveHint: opts.destructive ?? false,
        openWorldHint: true,
      },
    },
    async (rawArgs) => {
      if (opts.envGuard && process.env.HOSTKEY_ALLOW_DESTRUCTIVE !== "1") {
        return note(
          `${name} отключён. Поставьте HOSTKEY_ALLOW_DESTRUCTIVE=1, чтобы разрешить.`,
        );
      }
      const { confirm, ...rest } = rawArgs as Params & { confirm: boolean };
      if (confirm !== true) {
        return note(
          `${name} не выполнен. Повторите с confirm=true, если пользователь согласен.`,
        );
      }
      try {
        const params = opts.map ? opts.map(rest) : rest;
        return ok(withAsyncHint(await client.call(resource, action, params)));
      } catch (e) {
        return fail(e);
      }
    },
  );
}
