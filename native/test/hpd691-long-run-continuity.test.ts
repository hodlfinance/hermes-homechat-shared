import assert from "node:assert/strict";
import test from "node:test";

import { createHermesApiClient, HermesApiClientError } from "../core/hermes-api-client";

test("native Hermes API errors preserve permanent HTTP status for observation classification", async () => {
  const client = createHermesApiClient({
    baseUrl: "https://example.invalid",
    fetchImpl: async () => new Response(JSON.stringify({ error: "Run not found" }), { status: 404 }),
  });

  await assert.rejects(
    client.run("missing-run"),
    (error) => error instanceof HermesApiClientError &&
      error.status === 404 &&
      error.retryable === false &&
      error.message === "Run not found",
  );
});

test("native Hermes API errors classify temporary HTTP and network failures as retryable", async () => {
  const unavailable = createHermesApiClient({
    baseUrl: "https://example.invalid",
    fetchImpl: async () => new Response("unavailable", { status: 503 }),
  });
  await assert.rejects(
    unavailable.run("active-run"),
    (error) => error instanceof HermesApiClientError && error.status === 503 && error.retryable === true,
  );

  const offline = createHermesApiClient({
    baseUrl: "https://example.invalid",
    fetchImpl: async () => { throw new TypeError("Network request failed"); },
  });
  await assert.rejects(
    offline.run("active-run"),
    (error) => error instanceof HermesApiClientError &&
      error.status === undefined &&
      error.retryable === true &&
      error.cause instanceof TypeError,
  );
});
