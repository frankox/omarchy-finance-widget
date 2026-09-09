// @deno-types="../vendor/decimal.js/decimal.d.ts"
import { Decimal } from "decimal.js";
import { DatabaseSync } from "node:sqlite";

export const PROTOCOL_VERSION = 1;

export interface ProtocolRequest {
  v: number;
  id: string;
  method: string;
  params?: Record<string, unknown>;
}

export interface ProtocolError {
  code: string;
  message: string;
}

export type ProtocolResponse =
  | {
    v: typeof PROTOCOL_VERSION;
    id: string;
    ok: true;
    result: unknown;
  }
  | {
    v: typeof PROTOCOL_VERSION;
    id: string;
    ok: false;
    error: ProtocolError;
  };

export interface ProcessedLine {
  response: ProtocolResponse;
  shouldStop: boolean;
}

export type Fetcher = (
  input: string | URL | Request,
  init?: RequestInit,
) => Promise<Response>;

export interface ProtocolDependencies {
  fetcher?: Fetcher;
}

interface YahooSearchQuote {
  symbol?: unknown;
  quoteType?: unknown;
}

interface YahooSearchPayload {
  quotes?: YahooSearchQuote[];
}

function responseId(value: unknown): string {
  if (typeof value !== "object" || value === null || !("id" in value)) {
    return "invalid";
  }

  return typeof value.id === "string" && value.id.length > 0
    ? value.id
    : "invalid";
}

function success(id: string, result: unknown): ProtocolResponse {
  return { v: PROTOCOL_VERSION, id, ok: true, result };
}

function failure(id: string, code: string, message: string): ProtocolResponse {
  return {
    v: PROTOCOL_VERSION,
    id,
    ok: false,
    error: { code, message },
  };
}

function isRequest(value: unknown): value is ProtocolRequest {
  if (typeof value !== "object" || value === null) return false;

  const candidate = value as Partial<ProtocolRequest>;
  return candidate.v === PROTOCOL_VERSION &&
    typeof candidate.id === "string" && candidate.id.length > 0 &&
    typeof candidate.method === "string" && candidate.method.length > 0 &&
    (candidate.params === undefined ||
      (typeof candidate.params === "object" && candidate.params !== null));
}

function sqliteAvailable(): boolean {
  const database = new DatabaseSync(":memory:");

  try {
    database.exec("CREATE TABLE runtime_probe (value TEXT NOT NULL)");
    database.prepare("INSERT INTO runtime_probe (value) VALUES (?)").run("ok");
    const row = database.prepare("SELECT value FROM runtime_probe").get() as
      | { value?: unknown }
      | undefined;
    return row?.value === "ok";
  } finally {
    database.close();
  }
}

export async function probeYahoo(
  fetcher: Fetcher = fetch,
): Promise<{ reachable: true; sample: { symbol: string; quoteType: string } }> {
  const url = new URL("https://query2.finance.yahoo.com/v1/finance/search");
  url.searchParams.set("q", "MSFT");
  url.searchParams.set("quotesCount", "1");
  url.searchParams.set("newsCount", "0");
  url.searchParams.set("enableFuzzyQuery", "false");

  const response = await fetcher(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "Mozilla/5.0 OmarchyFinanceWidget/0.1",
    },
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    throw new Error(`Yahoo probe returned HTTP ${response.status}`);
  }

  const payload = await response.json() as YahooSearchPayload;
  const quote = Array.isArray(payload.quotes) ? payload.quotes[0] : undefined;
  if (
    typeof quote?.symbol !== "string" ||
    typeof quote.quoteType !== "string"
  ) {
    throw new Error("Yahoo probe returned an unexpected response");
  }

  return {
    reachable: true,
    sample: { symbol: quote.symbol, quoteType: quote.quoteType },
  };
}

async function healthCheck(
  request: ProtocolRequest,
  dependencies: ProtocolDependencies,
): Promise<unknown> {
  const result: Record<string, unknown> = {
    status: "ok",
    protocolVersion: PROTOCOL_VERSION,
    processId: Deno.pid,
    runtime: {
      deno: Deno.version.deno,
      sqlite: sqliteAvailable(),
      decimal: new Decimal("0.1").plus("0.2").toString(),
    },
  };

  if (request.params?.probeProvider === true) {
    result.provider = await probeYahoo(dependencies.fetcher);
  }

  return result;
}

export async function processProtocolLine(
  line: string,
  dependencies: ProtocolDependencies = {},
): Promise<ProcessedLine> {
  let parsed: unknown;

  try {
    parsed = JSON.parse(line);
  } catch {
    return {
      response: failure("invalid", "INVALID_JSON", "Request is not valid JSON"),
      shouldStop: false,
    };
  }

  const id = responseId(parsed);
  if (!isRequest(parsed)) {
    return {
      response: failure(
        id,
        "INVALID_REQUEST",
        "Request does not match protocol v1",
      ),
      shouldStop: false,
    };
  }

  try {
    switch (parsed.method) {
      case "health.check":
        return {
          response: success(
            parsed.id,
            await healthCheck(parsed, dependencies),
          ),
          shouldStop: false,
        };
      case "shutdown":
        return {
          response: success(parsed.id, { status: "stopping" }),
          shouldStop: true,
        };
      default:
        return {
          response: failure(
            parsed.id,
            "METHOD_NOT_FOUND",
            "Requested method is not available",
          ),
          shouldStop: false,
        };
    }
  } catch {
    return {
      response: failure(
        parsed.id,
        "RUNTIME_PROBE_FAILED",
        "Runtime capability check failed",
      ),
      shouldStop: false,
    };
  }
}
