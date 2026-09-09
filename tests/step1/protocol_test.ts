import assert from "node:assert/strict";
import {
  probeYahoo,
  processProtocolLine,
  PROTOCOL_VERSION,
} from "../../backend/protocol.ts";

Deno.test("health.check proves decimal and SQLite capabilities", async () => {
  const processed = await processProtocolLine(JSON.stringify({
    v: PROTOCOL_VERSION,
    id: "health-1",
    method: "health.check",
    params: {},
  }));

  assert.equal(processed.shouldStop, false);
  assert.equal(processed.response.ok, true);
  if (!processed.response.ok) return;

  const result = processed.response.result as {
    status: string;
    protocolVersion: number;
    runtime: { sqlite: boolean; decimal: string };
  };
  assert.equal(result.status, "ok");
  assert.equal(result.protocolVersion, PROTOCOL_VERSION);
  assert.equal(result.runtime.sqlite, true);
  assert.equal(result.runtime.decimal, "0.3");
});

Deno.test("Yahoo probe validates a representative search response", async () => {
  const fetcher = async (): Promise<Response> =>
    await Promise.resolve(
      new Response(
        JSON.stringify({
          quotes: [{ symbol: "MSFT", quoteType: "EQUITY" }],
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        },
      ),
    );

  assert.deepEqual(await probeYahoo(fetcher), {
    reachable: true,
    sample: { symbol: "MSFT", quoteType: "EQUITY" },
  });
});

Deno.test("invalid JSON receives a stable error envelope", async () => {
  const processed = await processProtocolLine("not-json");

  assert.equal(processed.response.ok, false);
  if (processed.response.ok) return;
  assert.equal(processed.response.id, "invalid");
  assert.equal(processed.response.error.code, "INVALID_JSON");
});

Deno.test("unknown methods do not stop the worker", async () => {
  const processed = await processProtocolLine(JSON.stringify({
    v: PROTOCOL_VERSION,
    id: "missing-1",
    method: "missing.method",
  }));

  assert.equal(processed.shouldStop, false);
  assert.equal(processed.response.ok, false);
  if (processed.response.ok) return;
  assert.equal(processed.response.error.code, "METHOD_NOT_FOUND");
});

Deno.test("shutdown acknowledges before stopping", async () => {
  const processed = await processProtocolLine(JSON.stringify({
    v: PROTOCOL_VERSION,
    id: "shutdown-1",
    method: "shutdown",
  }));

  assert.equal(processed.shouldStop, true);
  assert.equal(processed.response.ok, true);
});
