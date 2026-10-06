import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  ASSISTANT_IMAGE_MAX_BYTES,
  assistantImageDataUri,
  assistantImagePath,
  assistantMessageImages,
  createHermesApiClient,
} from "../core/index";
import { permitsHodlNativeR8Request } from "../policy";

// HPD-1062. Fin in the HODL app, 06.10.2026: the agent drew a Bitcoin chart and
// the chat had no way to show it. The plane now stores such an image as an
// artifact reference on the assistant message (source "hermes", kind "image",
// version 1, href to /hermes/runs/<run>/images/<img_...>). This client shows
// exactly that reference and ignores everything else.

const RUN = "run_zNxkwUyWd_N60v";
const IMAGE = "img_0123456789abcdef0123456789abcdef";
const href = `/hermes/runs/${RUN}/images/${IMAGE}`;
const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3]);

function reference(overrides: Record<string, unknown> = {}) {
  return { id: IMAGE, kind: "image", source: "hermes", version: 1, sensitivity: "finance_context", label: "btc_1m.png", safeSummary: null, href, ...overrides };
}

test("HPD-1062: an agent image reference becomes one image of the message", () => {
  assert.deepEqual(assistantMessageImages([reference()]), [
    { key: `${RUN}:${IMAGE}`, runId: RUN, imageId: IMAGE, label: "btc_1m.png" },
  ]);
  // The same image twice is drawn once.
  assert.equal(assistantMessageImages([reference(), reference()]).length, 1);
});

test("HPD-1062: every other reference is ignored, so old and unknown kinds never break a message", () => {
  const ignored = [
    reference({ source: "upload" }),
    reference({ source: "finhermes" }),
    reference({ kind: "file" }),
    reference({ version: 2 }),
    reference({ href: null }),
    reference({ href: `https://evil.example${href}` }),
    reference({ href: `/hermes/runs/${RUN}/images/img_short` }),
    reference({ href: `/hermes/runs/../images/${IMAGE}` }),
    reference({ id: "img_ffffffffffffffffffffffffffffffff" }),
    { id: "x", kind: "source_bundle", source: "finhermes", version: 3 },
  ];
  assert.deepEqual(assistantMessageImages(ignored), []);
  assert.deepEqual(assistantMessageImages(undefined), []);
});

test("HPD-1062: only the exact image in png, jpeg or webp within the size limit is drawn", () => {
  const ok = { image: { id: IMAGE, runId: RUN, mimeType: "image/png", size: png.length, data: png.toString("base64") } };
  assert.equal(assistantImageDataUri(ok, { runId: RUN, imageId: IMAGE }), `data:image/png;base64,${png.toString("base64")}`);
  for (const mimeType of ["image/jpeg", "image/webp"]) {
    assert.ok(assistantImageDataUri({ image: { ...ok.image, mimeType } }, { runId: RUN, imageId: IMAGE }));
  }
  const refused = [
    { image: { ...ok.image, mimeType: "image/svg+xml" } },
    { image: { ...ok.image, mimeType: "image/gif" } },
    { image: { ...ok.image, id: "img_ffffffffffffffffffffffffffffffff" } },
    { image: { ...ok.image, runId: "run_other" } },
    { image: { ...ok.image, size: png.length + 1 } },
    { image: { ...ok.image, size: ASSISTANT_IMAGE_MAX_BYTES + 1 } },
    { image: { ...ok.image, data: "not base64!" } },
    { image: { ...ok.image, data: "" } },
    { image: null },
    null,
  ];
  for (const response of refused) {
    assert.equal(assistantImageDataUri(response, { runId: RUN, imageId: IMAGE }), null, JSON.stringify(response));
  }
});

test("HPD-1062: the client reads the image from the plane's run route", async () => {
  const calls: string[] = [];
  const client = createHermesApiClient({
    baseUrl: "https://api.example/api",
    token: "t",
    fetchImpl: (async (url: string) => {
      calls.push(url);
      return new Response(JSON.stringify({ image: { id: IMAGE, runId: RUN, mimeType: "image/png", size: 1, data: "AA==" } }), { status: 200, headers: { "content-type": "application/json" } });
    }) as unknown as typeof fetch,
  });
  const response = await client.runImage(RUN, IMAGE);
  assert.equal(calls[0], `https://api.example/api${href}`);
  assert.equal(assistantImageDataUri(response, { runId: RUN, imageId: IMAGE }), "data:image/png;base64,AA==");
  assert.equal(assistantImagePath(RUN, IMAGE), href);
});

test("HPD-1062: the HODL host may read exactly this route, and nothing around it", () => {
  assert.equal(permitsHodlNativeR8Request("GET", href), true);
  assert.equal(permitsHodlNativeR8Request("POST", href), false);
  assert.equal(permitsHodlNativeR8Request("GET", `/hermes/runs/${RUN}/images`), false);
  assert.equal(permitsHodlNativeR8Request("GET", `/hermes/runs/${RUN}/images/img_short`), false);
  assert.equal(permitsHodlNativeR8Request("GET", `/hermes/runs/${RUN}/images/${IMAGE}/raw`), false);
  assert.equal(permitsHodlNativeR8Request("GET", `/hermes/runs/../images/${IMAGE}`), false);
});

test("HPD-1062: the chat draws agent images under the answer, read through the canonical client", () => {
  const surface = readFileSync(new URL("../src/surface.tsx", import.meta.url), "utf8");
  assert.match(surface, /assistantMessageImages\(message\.artifactReferences\)/);
  assert.match(surface, /<AssistantMessageImages images=\{agentImages\} locale=\{locale\} readImage=\{readImage\} \/>/);
  assert.match(surface, /hermesApi\.runImage\(runId, imageId, \{ signal \}\)/);
  const canonical = readFileSync(new URL("../src/hermes-canonical.ts", import.meta.url), "utf8");
  assert.match(canonical, /assistantImageDataUri\(await client\.runImage\(runId, imageId, context\), \{ runId, imageId \}\)/);
});
