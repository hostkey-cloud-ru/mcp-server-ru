/** HTTP-клиент Hostkey InvAPI. */

export interface InvApiClientOptions {
  /** API-ключ InvAPI. */
  apiKey: string;
  /** TTL сессии в секундах (по умолчанию 3600). */
  tokenTtlSeconds?: number;
  /** HTTP-таймаут в секундах (по умолчанию 60). */
  httpTimeoutSeconds?: number;
}

export class InvApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly raw?: unknown,
  ) {
    super(message);
    this.name = "InvApiError";
  }
}

/** Endpoint .ru зашит. Для .com — пакет hostkey-mcp-server. */
const INVAPI_BASE_URL = "https://invapi.hostkey.ru";
const DEFAULT_TOKEN_TTL = 3600;
const DEFAULT_HTTP_TIMEOUT = 60;

const SECRET_KEYS = new Set([
  "token",
  "key",
  "root_pass",
  "password",
  "api_key",
]);

/** Прячем секреты в ответах/логах. */
export function maskSecrets(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(maskSecrets);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [
        k,
        SECRET_KEYS.has(k.toLowerCase()) ? "***" : maskSecrets(v),
      ]),
    );
  }
  return value;
}

/** Разворачиваем вложенные объекты в form-поля InvAPI. */
function flattenFields(
  fields: Record<string, unknown>,
): Array<[string, string]> {
  const pairs: Array<[string, string]> = [];
  const walk = (key: string, value: unknown): void => {
    if (value === undefined || value === null) return;
    if (Array.isArray(value)) {
      for (const item of value) walk(`${key}[]`, item);
      return;
    }
    if (typeof value === "object") {
      for (const [k, v] of Object.entries(value as Record<string, unknown>))
        walk(`${key}[${k}]`, v);
      return;
    }
    pairs.push([key, String(value)]);
  };
  for (const [k, v] of Object.entries(fields)) walk(k, v);
  return pairs;
}

interface CallOptions {
  /** Подставлять сессионный токен (по умолчанию да). */
  auth?: boolean;
  /** Внутреннее: не зацикливать relogin. */
  retried?: boolean;
}

export class InvApiClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly tokenTtl: number;
  private readonly httpTimeout: number;

  private token: string | null = null;
  private tokenExpiresAtMs = 0;
  private serversRefreshed = false;

  constructor(options: InvApiClientOptions) {
    if (!options.apiKey) {
      throw new InvApiError(
        "Не задан HOSTKEY_API_KEY. Создайте ключ в InvAPI и передайте через окружение.",
      );
    }
    this.apiKey = options.apiKey;
    this.baseUrl = INVAPI_BASE_URL;
    this.tokenTtl = options.tokenTtlSeconds ?? DEFAULT_TOKEN_TTL;
    this.httpTimeout = options.httpTimeoutSeconds ?? DEFAULT_HTTP_TIMEOUT;
  }

  private async ensureToken(): Promise<string> {
    // Обновляем за минуту до истечения.
    if (this.token && Date.now() < this.tokenExpiresAtMs - 60_000)
      return this.token;

    const res = (await this.rawPost("auth", {
      action: "login",
      key: this.apiKey,
      ttl: this.tokenTtl,
      fix_ip: 0, // не привязывать токен к IP
    })) as Record<string, unknown>;

    // Токен в result.token; плоские token/scope — запасной вариант.
    const nested =
      res.result && typeof res.result === "object"
        ? (res.result as Record<string, unknown>)
        : null;
    const token = nested?.token ?? nested?.scope ?? res.token ?? res.scope;
    if (typeof token !== "string" || token.length === 0) {
      throw new InvApiError(
        "auth/login не вернул сессионный токен",
        undefined,
        maskSecrets(res),
      );
    }

    this.token = token;
    this.tokenExpiresAtMs = Date.now() + this.tokenTtl * 1000;
    this.serversRefreshed = false;
    return token;
  }

  private resetToken(): void {
    this.token = null;
    this.tokenExpiresAtMs = 0;
  }

  private async rawPost(
    resource: string,
    fields: Record<string, unknown>,
  ): Promise<unknown> {
    const url = `${this.baseUrl}/${resource}.php`;
    const body = new URLSearchParams();
    for (const [k, v] of flattenFields(fields)) body.append(k, v);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.httpTimeout * 1000);
    let res: Response;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
        signal: controller.signal,
      });
    } catch (e) {
      const reason =
        e instanceof Error && e.name === "AbortError"
          ? `таймаут ${this.httpTimeout}s`
          : String(e);
      throw new InvApiError(`InvAPI ${resource}: сетевая ошибка (${reason})`);
    } finally {
      clearTimeout(timer);
    }

    const text = await res.text();
    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      throw new InvApiError(
        `InvAPI ${resource}: HTTP ${res.status}, не JSON: ${text.slice(0, 300)}`,
        res.status,
      );
    }
    if (!res.ok) {
      const message =
        json && typeof json === "object" && "error" in json
          ? String((json as Record<string, unknown>).error)
          : text.slice(0, 300);
      throw new InvApiError(
        `InvAPI ${resource}: HTTP ${res.status}: ${message}`,
        res.status,
        maskSecrets(json),
      );
    }
    return json;
  }

  /** Вызов InvAPI. При 401 один раз перелогинивается. */
  async call(
    resource: string,
    action: string,
    params: Record<string, unknown> = {},
    opts: CallOptions = {},
  ): Promise<unknown> {
    const auth = opts.auth ?? true;
    const fields: Record<string, unknown> = { action, ...params };
    if (auth) fields.token = await this.ensureToken();

    try {
      const res = await this.rawPost(resource, fields);
      if (
        res &&
        typeof res === "object" &&
        (res as Record<string, unknown>).result === -1
      ) {
        throw new InvApiError(
          `InvAPI ${resource}/${action}: ${String((res as Record<string, unknown>).error ?? "unknown error")}`,
          undefined,
          maskSecrets(res),
        );
      }
      return res;
    } catch (e) {
      const isAuthFailure =
        e instanceof InvApiError &&
        (e.status === 401 ||
          /invalid token|token.*(invalid|expired)/i.test(e.message));
      if (auth && !opts.retried && isAuthFailure) {
        this.resetToken();
        return this.call(resource, action, params, { ...opts, retried: true });
      }
      throw e;
    }
  }

  /** Один раз за токен обновляем список серверов перед eq/list|show. */
  async ensureServersRefreshed(): Promise<void> {
    if (this.serversRefreshed) return;
    await this.call("eq", "update_servers");
    this.serversRefreshed = true;
  }

  /** Статус async-задачи по callback (без авторизации). */
  async checkTask(callbackKey: string): Promise<unknown> {
    return this.call(
      "eq_callback",
      "check",
      { key: callbackKey },
      { auth: false },
    );
  }
}
