import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import type { ChatArtifactReference, ChatMessage } from "../core/index";
import type { NativeR8ArtifactRenderContext, NativeR8MessageRenderContext } from "../host";
import {
  DEFAULT_APPROVAL_CARD_LABELS,
  approvalCardLabels,
  hostArtifactSlots,
  hostMessageFooter,
} from "../src/host-message-hooks";
import { uniqueMobileFinanceArtifactReferences } from "../src/mobile-finance-artifacts";

/**
 * HPD-2263 (HODL Bots engine branch): three optional host options. With none
 * of them passed the surface draws exactly what it drew before.
 */
const surface = readFileSync(new URL("../src/surface.tsx", import.meta.url), "utf8");
const card = readFileSync(new URL("../src/mobile-finance-action-approval.tsx", import.meta.url), "utf8");
const host = readFileSync(new URL("../host.ts", import.meta.url), "utf8");

const ref = (source: string, id: string, extra: Record<string, string> = {}) =>
  ({ id, kind: source === "bots-engine" ? "price" : "portfolio_snapshot", source, version: 1, sensitivity: "private", ...extra }) as unknown as ChatArtifactReference;
const fin = ref("finhermes", "fin-1");
const bots = ref("bots-engine", "price-1", { symbol: "AAPL", market: "US", name: "Apple", assetType: "stock" });
const upload = ref("upload", "up-1");
const message: ChatMessage = {
  id: "m1", runId: "r1", conversationSessionId: "c1", role: "assistant", content: "Done.", createdAt: "2026-11-20T10:00:00.000Z",
  artifactReferences: [fin, bots, upload, fin],
};
const context: NativeR8MessageRenderContext = { locale: "en", conversationId: "c1" };
const artifactContext: NativeR8ArtifactRenderContext = { ...context, message };

test("the three options are optional and typed on NativeR8Host", () => {
  assert.match(host, /^  renderArtifact\?: \(artifact: ChatArtifactReference, context: NativeR8ArtifactRenderContext\) => ReactNode \| null;$/m);
  assert.match(host, /^  renderMessageFooter\?: \(message: ChatMessage, context: NativeR8MessageRenderContext\) => ReactNode \| null;$/m);
  assert.match(host, /^  approvalCardLabels\?: NativeR8ApprovalCardLabels;$/m);
  assert.match(host, /export type NativeR8ApprovalCardLabels = \{ eyebrow\?: string; confirm\?: string; cancel\?: string \};/);
});

test("renderArtifact absent: only Fin Hermes references, one Fin card each, as before", () => {
  const slots = hostArtifactSlots(message.artifactReferences, undefined, artifactContext);
  assert.deepEqual(slots, uniqueMobileFinanceArtifactReferences(message.artifactReferences).map((reference) => ({
    key: `${reference.id}:${reference.version}`, kind: "finance", reference,
  })));
  assert.equal(slots.length, 1);
  // The surface keeps the old list and the old Fin card props when the host passes nothing.
  assert.match(surface, /const hostRenderArtifact = host\.renderArtifact;/);
  assert.match(surface, /: hostRenderArtifact\s*\? hostArtifactSlots\(message\.artifactReferences, hostRenderArtifact, \{ \.\.\.hookContext, message \}\)\s*: financeReferences\.map\(\(reference\) => \(\{ key: `\$\{reference\.id\}:\$\{reference\.version\}`, kind: "finance" as const, reference \}\)\);/);
  assert.match(surface, /<FinanceArtifactCard\s+key=\{slot\.key\}\s+reference=\{slot\.reference\}\s+locale=\{locale\}\s+messageText=\{assistantText\}\s+messageArtifactReferences=\{financeReferences\}/);
});

test("renderArtifact present: bots-engine references reach the hook; non-null replaces the card, null keeps Fin", () => {
  const seen: Array<{ source: string; context: NativeR8ArtifactRenderContext }> = [];
  const node = { drawn: "price card" };
  const slots = hostArtifactSlots(message.artifactReferences, (artifact, ctx) => {
    seen.push({ source: String(artifact.source), context: ctx });
    return artifact.source === "bots-engine" ? (node as never) : null;
  }, artifactContext);
  assert.deepEqual(seen.map((entry) => entry.source), ["finhermes", "bots-engine"], "uploads never reach it, duplicates once");
  assert.equal(seen[1]!.context.conversationId, "c1");
  assert.equal(seen[1]!.context.message, message);
  assert.deepEqual(slots.map((slot) => [slot.kind, slot.reference.source]), [["finance", "finhermes"], ["host", "bots-engine"]]);
  assert.equal(slots[1]!.kind === "host" ? slots[1]!.node : null, node);
  // A Fin reference the host draws itself is not drawn twice.
  const own = hostArtifactSlots([fin], () => "own" as never, artifactContext);
  assert.deepEqual(own.map((slot) => slot.kind), ["host"]);
  // An unknown source the host declines is dropped, as before.
  assert.deepEqual(hostArtifactSlots([bots], () => null, artifactContext), []);
  assert.match(surface, /slot\.kind === "host" \? \(\s*<View key=\{slot\.key\} testID="host-artifact">\{slot\.node\}<\/View>/);
});

test("renderMessageFooter absent: nothing is drawn under a reply", () => {
  assert.equal(hostMessageFooter(message, null, undefined, context), null);
  assert.match(surface, /\{messageFooter !== null \? <View testID="host-message-footer">\{messageFooter\}<\/View> : null\}/);
});

test("renderMessageFooter present: called for finished assistant replies only", () => {
  const calls: Array<{ id: string; ctx: NativeR8MessageRenderContext }> = [];
  const footer = (m: ChatMessage, ctx: NativeR8MessageRenderContext) => { calls.push({ id: m.id, ctx }); return "footer" as never; };
  assert.equal(hostMessageFooter(message, null, footer, context), "footer");
  assert.equal(hostMessageFooter(message, "stopped", footer, context), "footer");
  assert.equal(hostMessageFooter(message, "working", footer, context), null);
  assert.equal(hostMessageFooter({ ...message, role: "user" }, null, footer, context), null);
  assert.equal(hostMessageFooter({ ...message, optimistic: true }, null, footer, context), null);
  assert.deepEqual(calls.map((call) => call.id), ["m1", "m1"]);
  assert.deepEqual(calls[0]!.ctx, context);
  assert.equal(hostMessageFooter(message, null, () => null, context), null);
  assert.match(surface, /const messageFooter = hostMessageFooter\(message, interimMark, hostRenderMessageFooter, hookContext\);/);
});

test("approval card labels: defaults are today's words, host words override", () => {
  assert.deepEqual(approvalCardLabels(undefined), { eyebrow: "FIN HERMES", confirm: "Confirm", cancel: "Cancel" });
  assert.deepEqual(approvalCardLabels({}), DEFAULT_APPROVAL_CARD_LABELS);
  assert.deepEqual(approvalCardLabels({ eyebrow: "HODL BOTS", confirm: "Bestätigen", cancel: "Abbrechen" }),
    { eyebrow: "HODL BOTS", confirm: "Bestätigen", cancel: "Abbrechen" });
  assert.deepEqual(approvalCardLabels({ confirm: "Ja", eyebrow: "  " }), { eyebrow: "FIN HERMES", confirm: "Ja", cancel: "Cancel" });
  assert.match(card, /<Text style=\{styles\.eyebrow\}>\{words\.eyebrow\}<\/Text>/);
  assert.match(card, /accessibilityLabel=\{words\.cancel\}[^>]*><Text style=\{styles\.cancelText\}>\{words\.cancel\}<\/Text>/);
  assert.match(card, /accessibilityLabel=\{words\.confirm\}[^>]*><Text style=\{styles\.confirmText\}>\{words\.confirm\}<\/Text>/);
  assert.doesNotMatch(card, />FIN HERMES</);
  assert.match(surface, /labels=\{host\.approvalCardLabels\}/);
});
