import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import type { HermesApiMessage } from "../core/hermes-api";
import type { ChatMessage } from "../core/index";
import type { NativeR8MessageRenderContext } from "../host";
import { mobileChatMessageFromCanonical } from "../src/hermes-canonical";
import { hostMessageHeader } from "../src/host-message-hooks";

/**
 * HPD-2297 (spec 2.13 Portfolio Report): the HODL Bots engine marks a report
 * as an assistant message with `kind: "portfolio_report"`. The surface keeps
 * the kind on the message and lets the host draw a mark above the reply
 * (renderMessageHeader). Hey's plane sends no kind and passes no option, so
 * nothing changes there.
 */
const surface = readFileSync(new URL("../src/surface.tsx", import.meta.url), "utf8");
const host = readFileSync(new URL("../host.ts", import.meta.url), "utf8");

const api = (extra: Partial<HermesApiMessage> = {}): HermesApiMessage => ({
  id: "m1", conversationId: "c1", runId: "r1", role: "assistant", content: "Your portfolio changed.",
  consumerSafety: null, artifactReferences: [], createdAt: "2026-11-22T10:00:00.000Z", ...extra,
});
const context: NativeR8MessageRenderContext = { locale: "en", conversationId: "c1" };

test("a kind on an assistant message is kept", () => {
  assert.equal(mobileChatMessageFromCanonical(api({ kind: "portfolio_report" })).kind, "portfolio_report");
});

test("no kind, a user message, or an odd value: no kind, the message as before", () => {
  for (const message of [api(), api({ kind: null }), api({ kind: "" }), api({ kind: "Portfolio Report!" }), api({ role: "user", kind: "portfolio_report" })]) {
    assert.equal("kind" in mobileChatMessageFromCanonical(message), false);
  }
});

test("the option is optional and typed like the footer", () => {
  assert.match(host, /^  renderMessageHeader\?: \(message: ChatMessage, context: NativeR8MessageRenderContext\) => ReactNode \| null;$/m);
});

test("header: only finished assistant replies, only with the option", () => {
  const message: ChatMessage = { id: "m1", runId: "r1", role: "assistant", content: "x", createdAt: "2026-11-22T10:00:00.000Z", kind: "portfolio_report" };
  const node = { drawn: "Report" } as never;
  const render = (m: ChatMessage) => (m.kind === "portfolio_report" ? node : null);
  assert.equal(hostMessageHeader(message, null, undefined, context), null);
  assert.equal(hostMessageHeader(message, null, render, context), node);
  assert.equal(hostMessageHeader({ ...message, kind: undefined }, null, render, context), null);
  assert.equal(hostMessageHeader({ ...message, role: "user" }, null, render, context), null);
  assert.equal(hostMessageHeader({ ...message, optimistic: true }, null, render, context), null);
  assert.equal(hostMessageHeader(message, "working", render, context), null);
});

test("the surface draws the header above the reply's text, after the bot's name", () => {
  assert.match(surface, /const hostRenderMessageHeader = host\.renderMessageHeader;/);
  assert.match(surface, /const messageHeader = hostMessageHeader\(message, interimMark, hostRenderMessageHeader, hookContext\);/);
  assert.match(surface, /<Text style=\{styles\.assistantIdentityLabel\}>\{appCopy\.productName\}<\/Text>\s*<\/View>\s*\) : null\}\s*\{messageHeader !== null \? <View testID="host-message-header">\{messageHeader\}<\/View> : null\}/);
});
