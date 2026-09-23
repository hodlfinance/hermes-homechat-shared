import assert from "node:assert/strict";
import test from "node:test";
import { mobileFinanceArtifactCard } from "../src/mobile-finance-artifacts";

// HPD-808 (Build 45): React Native's URL throws on `protocol`, so a URL-class
// check made every card source link null in HODL. Run the mapping with that
// exact URL behaviour and require working https links.

class ReactNativeUrl {
  constructor(readonly href: string) {}
  get protocol(): string { throw new Error("URL.protocol is not implemented"); }
  get search(): string { throw new Error("URL.search is not implemented"); }
}

function reference(sources: unknown[]) {
  const tab = (key: string, label: string, content: Record<string, unknown>) => ({ key, label, available: true, count: 1, content });
  return {
    id: "11111111-1111-4111-8111-111111111111", kind: "source_bundle", source: "finhermes", version: 3, sensitivity: "finance_context",
    artifactPresentation: {
      type: "finhermes_artifact_payload", version: 1, kind: "source_bundle", payloadVersion: 3,
      retainedUntil: "2026-12-01T00:00:00Z", createdAt: "2026-09-23T10:00:00Z", updatedAt: "2026-09-23T10:00:00Z",
      payload: {
        presentation: "capchat_context_card", title: "CapChat", status: "ok",
        answer: { format: "markdown", text: "Danone was upgraded [1]." },
        references: sources,
        contextCard: { schema: "capchat.context_card.v1", tabs: [
          tab("research", "Research", { sources }), tab("data", "Data", {}), tab("web", "Web Results", { sources }),
        ] },
        provenance: { answer_author: "capchat", mode: "delegated_answer", upstream: "capchat_chat_brain" },
        capturedAt: "2026-09-23T10:00:00Z",
      },
    },
  };
}

test("card source links survive React Native's URL class and keep their query", () => {
  const original = globalThis.URL;
  (globalThis as { URL: unknown }).URL = ReactNativeUrl;
  try {
    const card = mobileFinanceArtifactCard(reference([
      { source_number: 1, title: "Danone upgraded", url: "https://www.marketscreener.com/news/danone-upgraded-123?utm=x&id=5&token=hidden#top" },
      { source_number: 2, title: "Plain host", url: "https://finimize.com" },
      { source_number: 3, title: "Not https", url: "http://example.com/a" },
      { source_number: 4, title: "Userinfo", url: "https://user:pass@evil.example/a" },
      { source_number: 5, title: "Broken", url: "https://../x" },
    ]) as never);
    assert.ok(card);
    const urls = card.contextTabs?.find((tab) => tab.key === "research")?.sources.map((source) => source.url);
    assert.deepEqual(urls, [
      "https://www.marketscreener.com/news/danone-upgraded-123?utm=x&id=5",
      "https://finimize.com/",
      null,
      "https://evil.example/a",
      null,
    ]);
    assert.equal(card.contextTabs?.find((tab) => tab.key === "web")?.sources[0]?.url,
      "https://www.marketscreener.com/news/danone-upgraded-123?utm=x&id=5");
  } finally {
    (globalThis as { URL: unknown }).URL = original;
  }
});

test("a source without a link is drawn as plain text, not in link colour", async () => {
  const { readFileSync } = await import("node:fs");
  const card = readFileSync(new URL("../src/FinanceArtifactCard.tsx", import.meta.url), "utf8");
  // Inside a link: link colour. Without a link: plain colour. Both source lists.
  const linked = card.match(/onPress=\{\(\) => onOpenUrl\(source\.url!\)\}[\s\S]{0,160}?<Text style=\{styles\.sourceLabel\}>\{source\.label\}<\/Text>/g) ?? [];
  const plain = card.match(/<Text style=\{\[styles\.sourceLabel, styles\.sourceLabelPlain\]\}>\{source\.label\}<\/Text>/g) ?? [];
  assert.equal(linked.length, 2);
  assert.equal(plain.length, 2);
});
