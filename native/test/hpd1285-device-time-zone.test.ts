import assert from "node:assert/strict";
import test from "node:test";
import { createNativeR8Transport } from "../transport";
import { DEVICE_TIME_ZONE_HEADER, deviceTimeZone } from "../core/device-time-zone";

// HPD-1285: the Hey app reports the device's IANA time zone with every request;
// the Hey Control Plane keeps it per workspace, so the customer's Hermes runs in
// his zone. Justus, 2026-10-17: the same for Fin, so a Finance host (HODL,
// LiveQuote) reports it too; the Fin BFF forwards it to the Plane.

function transport(surface: "hey_hermes" | "finhermes") {
  const seen: Headers[] = [];
  const t = createNativeR8Transport({
    baseUrl: "https://synthetic.invalid",
    identity: surface === "hey_hermes"
      ? { surface, channel: "hey_hermes_mobile", allowedSurfaces: ["hey_hermes"] }
      : { surface, channel: "hodl_mobile", allowedSurfaces: ["finhermes"] },
    fetch: (async (_url: RequestInfo | URL, init?: RequestInit) => {
      seen.push(new Headers(init?.headers));
      return new Response(JSON.stringify({ runs: [] }), { status: 200, headers: { "content-type": "application/json" } });
    }) as typeof fetch,
  });
  return { t, seen };
}

test("the device zone is the runtime's IANA zone", () => {
  assert.equal(deviceTimeZone(), Intl.DateTimeFormat().resolvedOptions().timeZone);
  assert.equal(DEVICE_TIME_ZONE_HEADER, "X-Hey-Time-Zone");
});

test("every Hey request carries it, beside the session and the caller's own headers", async () => {
  const { t, seen } = transport("hey_hermes");
  await t.createApiClient({ baseUrl: "https://synthetic.invalid", token: "tok" }).snapshot();
  await t.fetchStream("https://synthetic.invalid/hermes/runs/r/events", { headers: { Accept: "text/event-stream" } });
  await t.fetchStream("https://synthetic.invalid/x", { headers: new Headers({ Accept: "a" }) });
  await t.fetchStream("https://synthetic.invalid/y");
  for (const headers of seen) assert.equal(headers.get(DEVICE_TIME_ZONE_HEADER), deviceTimeZone());
  assert.equal(seen[0]?.get("authorization"), "Bearer tok");
  assert.equal(seen[1]?.get("accept"), "text/event-stream");
  assert.equal(seen[2]?.get("accept"), "a");
});

test("a Finance host (HODL, LiveQuote) reports it too", async () => {
  const { t, seen } = transport("finhermes");
  await t.createApiClient({ baseUrl: "https://synthetic.invalid", token: "tok" }).snapshot();
  await t.fetchStream("https://synthetic.invalid/y", { headers: { Accept: "x" } });
  for (const headers of seen) assert.equal(headers.get(DEVICE_TIME_ZONE_HEADER), deviceTimeZone());
  assert.equal(seen[1]?.get("accept"), "x");
});

test("a device that cannot name its zone sends no header", async () => {
  const original = Intl.DateTimeFormat;
  try {
    (Intl as { DateTimeFormat: unknown }).DateTimeFormat = function () {
      return { resolvedOptions: () => ({ timeZone: "" }) };
    };
    assert.equal(deviceTimeZone(), undefined);
    const { t, seen } = transport("hey_hermes");
    await t.fetchStream("https://synthetic.invalid/y");
    assert.equal(seen[0]?.get(DEVICE_TIME_ZONE_HEADER), null);
  } finally {
    (Intl as { DateTimeFormat: unknown }).DateTimeFormat = original;
  }
});
