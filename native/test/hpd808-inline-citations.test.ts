import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import type { ChatArtifactReference } from "../core/index";
import type { SharedHomechatJsonValue } from "@hodlfinance/hermes-homechat-shared/core";
import {
  messageRepeatsAnswer,
  mobileCitationSegments,
  mobileFinanceArtifactCard,
  mobileFinanceArtifactTimestamp,
  mobileFinanceCitationDate,
  mobileFinanceCitationAction,
  mobileFinanceCitationDocumentResult,
  mobileFinanceCitationForUrl,
  mobileFinanceCitations,
  mobileFinanceMessageCarriesAnswer,
  mobileFinanceSourceDocument,
  type MobileFinanceCitation,
} from "../src/mobile-finance-artifacts";

// HPD-808: the [n] markers CapChat writes into its answer open that one source.
// The v3 source bundle can carry headline-length full_text/body fields. A
// signed artifact and a confirmed server reader are required for full text.

const ANSWER = "NVIDIA beat estimates [1] and raised guidance [2, 3].\n\nSee [Reuters](https://www.reuters.com/x) and [10].";
const ARTIFACT_ID = "12345678-1234-4123-8123-123456789abc";
const SECOND_ARTIFACT_ID = "87654321-4321-4321-8321-cba987654321";
const SIGNATURE = "A".repeat(43);

function capChatReference(
  references: JsonObject[],
  answer = ANSWER,
  id = ARTIFACT_ID,
): ChatArtifactReference {
  return {
    id,
    kind: "source_bundle",
    source: "finhermes",
    version: 3,
    sensitivity: "finance_context",
    label: "CapChat context",
    safeSummary: "A complete CapChat answer is available.",
    locator: { type: "finhermes_artifact", version: 1, value: `fa1.${id}.${SIGNATURE}` },
    context: { type: "finhermes_artifact_context", version: 1, value: `fac1.${id}.${SIGNATURE}` },
    artifactPresentation: {
      type: "finhermes_artifact_payload",
      version: 1,
      kind: "source_bundle",
      payloadVersion: 3,
      payload: {
        presentation: "capchat_context_card",
        title: "CapChat",
        status: "ok",
        answer: { format: "markdown", text: answer },
        references,
        contextCard: {
          schema: "capchat.context_card.v1",
          tabs: [
            { key: "research", label: "Research", count: references.length, available: true, content: { sources: references } },
            { key: "data", label: "Data", count: 0, available: false, content: {} },
            { key: "web", label: "Web Results", count: 0, available: false, content: { sources: [] } },
          ],
        },
        provenance: { answer_author: "capchat", mode: "delegated_answer", upstream: "capchat_chat_brain" },
        capturedAt: "2026-09-22T20:57:24.000Z",
      },
    },
  };
}

// A reference as it travels in an artifact payload: plain JSON.
type JsonObject = { [key: string]: SharedHomechatJsonValue };

function research(number: number, overrides: JsonObject = {}): JsonObject {
  return {
    source_number: number,
    source_type: "research",
    evidence_type: "research",
    title: `Research note ${number}`,
    preview_title: `Preview ${number}`,
    publisher: "Morningstar",
    source_firm: "Morningstar Research",
    source_name: "Morningstar",
    published_at: "2026-09-18T08:00:00.000Z",
    full_text: `NVIDIA data center revenue rose again in the quarter, note ${number}.`,
    body: `NVIDIA data center revenue rose again in the quarter, note ${number}.`,
    summary: `Short ${number}.`,
    url: `https://research.example/notes/${number}?token=hidden#top`,
    thumbnail_url: "https://research.example/thumb.png",
    is_premium: true,
    ...overrides,
  };
}

const webResult = {
  source_number: 10,
  source_type: "web",
  evidence_type: "web",
  title: "NVIDIA investor relations",
  source_name: "nvidia.com",
  url: "https://investor.nvidia.com/news?utm_source=capchat",
  web_query: "nvidia guidance",
};

const REFERENCES = [research(1), research(2), research(3), webResult];

function citation(number: number): MobileFinanceCitation {
  const found = mobileFinanceCitations([capChatReference(REFERENCES)]).find((item) => item.number === number);
  assert.ok(found, `citation ${number}`);
  return found;
}

test("each numbered CapChat reference becomes a citation with what the reader needs", () => {
  const card = mobileFinanceArtifactCard(capChatReference(REFERENCES));
  assert.ok(card);
  assert.deepEqual(card.citations?.map((item) => item.number), [1, 2, 3, 10]);
  assert.deepEqual(card.citations?.[0], {
    number: 1,
    title: "Research note 1",
    publisher: "Morningstar",
    publishedAt: "2026-09-18T08:00:00.000Z",
    url: "https://research.example/notes/1",
    documentReference: null,
  });
  // A web result has no text: its tap goes straight to the page.
  assert.deepEqual(card.citations?.[3], {
    number: 10,
    title: "NVIDIA investor relations",
    publisher: "nvidia.com",
    publishedAt: null,
    // Justus, 2026-09-23: keep the query; article pages often need it.
    url: "https://investor.nvidia.com/news?utm_source=capchat",
    documentReference: null,
  });
  // Credential-like parameters are dropped; ordinary ones such as utm_source stay.
  assert.doesNotMatch(JSON.stringify(card.citations), /hidden/);
});

test("artifact snippets never become a full document; only explicitly marked stored sources retain signed reader keys", () => {
  const [ordinary, stored, unmarked] = mobileFinanceCitations([capChatReference([
    research(1, { full_text: "Headline only.", body: "Headline only.", summary: "A longer summary." }),
    research(2, { source_type: "in_house_article", article_id: "42", document_kind: "stored_research_body", full_text: "Truncated to 600 chars." }),
    research(3, { source_type: "in_house_article", article_id: "43", full_text: "Still only a snippet." }),
  ])]);
  assert.equal(ordinary?.documentReference, null);
  assert.equal(mobileFinanceCitationAction(ordinary!, true), "original");
  assert.deepEqual(stored?.documentReference, {
    artifactId: ARTIFACT_ID,
    locator: `fa1.${ARTIFACT_ID}.${SIGNATURE}`,
    context: `fac1.${ARTIFACT_ID}.${SIGNATURE}`,
  });
  assert.equal(mobileFinanceCitationAction(stored!, true), "document");
  assert.equal(mobileFinanceCitationAction(stored!, false), "original");
  assert.equal(mobileFinanceCitationAction(unmarked!, true), "original");
  assert.doesNotMatch(JSON.stringify([ordinary, stored, unmarked]), /Headline only|Truncated to 600|A longer summary|Still only a snippet/);
});

test("podcast references use the same signed document reader only with a valid episode ID", () => {
  const citations = mobileFinanceCitations([capChatReference([
    research(1, { source_type: "podcast_transcript_segment", research_metadata: { episode_id: 51 }, document_kind: "approved_podcast_transcript" }),
    research(2, { source_type: "podcast_episode_summary", article_id: "52", document_kind: "approved_podcast_transcript" }),
    research(3, { source_type: "podcast_episode_transcript", article_id: "podcast_episode:53", document_kind: "approved_podcast_transcript" }),
    research(4, { source_type: "podcast_episode_transcript", article_id: "podcast_episode:0", document_kind: "approved_podcast_transcript" }),
  ])]);
  assert.deepEqual(citations.map((source) => Boolean(source.documentReference)), [true, true, true, false]);
});

test("only a reader-confirmed complete body is accepted for the sheet", () => {
  const source = {
    status: "ok",
    document: {
      documentKind: "stored_research_body", title: "Complete research", publisher: "HODL",
      publishedAt: "2026-09-22T08:00:00.000Z", body: "Full stored body.\nSecond paragraph.",
      originalUrl: "https://research.example/full?token=hidden&view=article#part",
    },
  };
  assert.deepEqual(mobileFinanceSourceDocument(source), {
    documentKind: "stored_research_body", title: "Complete research", publisher: "HODL",
    publishedAt: "2026-09-22T08:00:00.000Z", body: "Full stored body.\nSecond paragraph.",
    originalUrl: "https://research.example/full?view=article",
  });
  assert.equal(mobileFinanceSourceDocument({ ...source, document: { ...source.document, documentKind: "snippet" } }), null);
  assert.equal(mobileFinanceSourceDocument({ ...source, document: { ...source.document, body: "  " } }), null);
  assert.equal(mobileFinanceSourceDocument({ ...source, status: "partial" }), null);
  assert.equal(mobileFinanceSourceDocument({ ...source, document: { ...source.document, documentKind: "approved_podcast_transcript" } })?.documentKind, "approved_podcast_transcript");
});

test("document tap distinguishes a complete body, absent body, and authorization failure", async () => {
  const [stored] = mobileFinanceCitations([capChatReference([
    research(1, { source_type: "in_house_article", article_id: "42", document_kind: "stored_research_body" }),
  ])]);
  assert.ok(stored);
  const payload = {
    status: "ok",
    document: { documentKind: "stored_research_body", title: "Full note", publisher: null,
      publishedAt: null, body: "Complete stored note.", originalUrl: "https://research.example/notes/1" },
  };
  const reader = async (input: { sourceNumber: number }) => {
    assert.equal(input.sourceNumber, 1);
    return payload;
  };
  assert.deepEqual(await mobileFinanceCitationDocumentResult(stored, reader), {
    kind: "document", document: mobileFinanceSourceDocument(payload),
  });
  assert.deepEqual(await mobileFinanceCitationDocumentResult(stored, async () => null), {
    kind: "original", url: "https://research.example/notes/1",
  });
  await assert.rejects(mobileFinanceCitationDocumentResult(stored, async () => {
    throw new Error("401");
  }), /401/);
  await assert.rejects(mobileFinanceCitationDocumentResult(stored, async () => ({
    status: "ok", document: { ...payload.document, documentKind: "snippet" },
  })), /invalid/);
});

test("a named Markdown source link targets only one matching safe source", () => {
  const citations = mobileFinanceCitations([capChatReference([
    research(1, { source_type: "in_house_article", article_id: "42", document_kind: "stored_research_body" }),
    research(2),
  ])]);
  assert.equal(mobileFinanceCitationForUrl("https://research.example/notes/1?token=hidden#top", citations)?.number, 1);
  assert.equal(mobileFinanceCitationForUrl("https://research.example/notes/2", citations)?.number, 2);
  assert.equal(mobileFinanceCitationForUrl("https://elsewhere.example/story", citations), null);
  assert.equal(mobileFinanceCitationForUrl("http://research.example/notes/1", citations), null);
  assert.equal(mobileFinanceCitationForUrl("https://research.example/notes/1", [...citations, citations[0]!]), null);
});

test("a reference with nothing to show, an invalid number, or a duplicate number is no citation", () => {
  const citations = mobileFinanceCitations([capChatReference([
    research(1, { full_text: null, body: null, summary: null, url: "http://insecure.example/x" }),
    research(2, { title: null, preview_title: null, source_name: null }),
    research(0),
    research(1.5),
    { ...research(4), source_number: "4" },
    research(5),
    research(5, { title: "Second copy of five" }),
  ])]);
  assert.deepEqual(citations.map((item) => [item.number, item.title]), []);
});

test("markers split into tappable pieces that join back to exactly the answer", () => {
  const citations = mobileFinanceCitations([capChatReference(REFERENCES)]);
  const segments = mobileCitationSegments(ANSWER, citations);
  assert.equal(segments.map((segment) => segment.text).join(""), ANSWER);
  assert.deepEqual(
    segments.filter((segment) => segment.kind === "citation").map((segment) => [segment.text, segment.citation.number]),
    [["[1]", 1], ["2", 2], ["3", 3], ["[10]", 10]],
  );
  // [2, 3] keeps its brackets and comma as plain text around the two numbers.
  const multi = segments.findIndex((segment) => segment.kind === "citation" && segment.citation.number === 2);
  assert.equal(segments[multi - 1]?.text.endsWith("["), true);
  assert.equal(segments[multi + 1]?.text, ", ");
  assert.equal(segments[multi + 3]?.text.startsWith("]"), true);
});

test("a marker without a known reference and a markdown link both stay as they are", () => {
  const citations = [citation(1)];
  for (const value of ["See [7].", "See [1, 7].", "See [1](https://example.com).", "No markers here.", "[x] and [ 1 ]"]) {
    assert.deepEqual(mobileCitationSegments(value, citations), [{ kind: "text", text: value }], value);
  }
  assert.deepEqual(mobileCitationSegments("See [1].", []), [{ kind: "text", text: "See [1]." }]);
});

test("the card knows when the message above already is its answer", () => {
  assert.equal(messageRepeatsAnswer(ANSWER, ANSWER), true);
  assert.equal(messageRepeatsAnswer(`${ANSWER.replace(/\n\n/g, "\n")}  \n`, ANSWER), true);
  assert.equal(messageRepeatsAnswer(`Here is CapChat's answer:\n\n${ANSWER}`, ANSWER), true);
  assert.equal(messageRepeatsAnswer("NVIDIA beat estimates.", ANSWER), false);
  assert.equal(messageRepeatsAnswer("", ANSWER), false);
  assert.equal(messageRepeatsAnswer(ANSWER, null), false);
});

test("duplicate [1] across signed cards stays plain unless the visible answer exactly identifies one card", () => {
  const first = capChatReference([
    research(1, { source_type: "in_house_article", article_id: "41", document_kind: "stored_research_body" }),
  ], "One [1].", ARTIFACT_ID);
  const second = capChatReference([
    research(1, { title: "Other one", source_type: "in_house_article", article_id: "42", document_kind: "stored_research_body" }),
    research(2),
  ], "Two [1] and [2].", SECOND_ARTIFACT_ID);
  const unbound = mobileFinanceCitations([first, second], "Summary [1] and [2].");
  assert.deepEqual(unbound.map((item) => [item.number, item.title]), [[2, "Research note 2"]]);
  assert.deepEqual(mobileCitationSegments("Summary [1] and [2].", unbound).map((segment) =>
    segment.kind === "citation" ? [segment.text, segment.citation.number] : [segment.text, null]), [
      ["Summary [1] and ", null], ["[2]", 2], [".", null],
    ]);
  const bound = mobileFinanceCitations([first, second], "Two [1] and [2].");
  assert.deepEqual(bound.map((item) => [item.number, item.title]), [[1, "Other one"], [2, "Research note 2"]]);
  assert.equal(bound[0]?.documentReference?.artifactId, SECOND_ARTIFACT_ID);
  const sameAnswer = capChatReference([
    research(1, { source_type: "in_house_article", article_id: "43", document_kind: "stored_research_body" }),
  ], "Two [1] and [2].", "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb");
  assert.deepEqual(mobileFinanceCitations([second, sameAnswer], "Two [1] and [2].").map((item) => item.number), [2]);
  assert.equal(mobileFinanceArtifactCard(first)?.citations?.[0]?.documentReference?.artifactId, ARTIFACT_ID);
  assert.equal(mobileFinanceArtifactCard(second)?.citations?.[0]?.documentReference?.artifactId, SECOND_ARTIFACT_ID);
  // A numbered but unusable source in another card still prevents a global guess.
  const unusable = capChatReference([
    research(1, { title: null, preview_title: null, source_name: null, url: null }),
  ], "Unavailable [1].", "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb");
  assert.deepEqual(mobileFinanceCitations([first, unusable], "Summary [1]."), []);
  assert.deepEqual(mobileFinanceCitations(undefined), []);
});

test("the source date shows as a day, never as Invalid Date", () => {
  assert.match(mobileFinanceCitationDate("2026-09-18T08:00:00.000Z", "en") ?? "", /Sep 18, 2026/);
  assert.equal(mobileFinanceCitationDate("not a date", "en"), null);
  assert.equal(mobileFinanceCitationDate(null, "en"), null);
});

type Node = { type: unknown; props: Record<string, unknown> };

function nodes(value: unknown): Node[] {
  if (!value || typeof value !== "object") return [];
  if (Array.isArray(value)) return value.flatMap(nodes);
  const node = value as Node;
  const rendered = typeof node.type === "function" ? (node.type as (props: unknown) => unknown)(node.props) : null;
  return [node, ...nodes(node.props?.children), ...nodes(rendered)];
}

function textOf(node: Node): string {
  const children = node.props.children;
  return (Array.isArray(children) ? children : [children])
    .map((child) => (typeof child === "string" || typeof child === "number" ? String(child) : ""))
    .join("");
}

function loadNative(file: string, markdown: boolean) {
  const code = ts.transpileModule(
    readFileSync(new URL(`../src/${file}`, import.meta.url), "utf8"),
    { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } },
  ).outputText;
  const exports: Record<string, unknown> = {};
  const jsx = (type: unknown, props: Record<string, unknown>) => ({ type, props });
  vm.runInNewContext(code, {
    exports,
    require(name: string) {
      if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
      if (name === "react") return { useState: (initial: unknown) => [typeof initial === "function" ? (initial as () => unknown)() : initial, () => {}] };
      if (name === "react-native") {
        return {
          ActivityIndicator: "ActivityIndicator",
          Modal: "Modal",
          Platform: { select: (value: Record<string, unknown>) => value.ios },
          Pressable: "Pressable",
          ScrollView: "ScrollView",
          StyleSheet: { create: (value: unknown) => value },
          Text: "Text",
          View: "View",
        };
      }
      if (name === "lucide-react-native") {
        return { AlertTriangle: "AlertTriangle", ChevronDown: "ChevronDown", ExternalLink: "ExternalLink", FileText: "FileText", X: "X" };
      }
      if (name.includes("mobile-palette-context")) {
        return { useMobilePalette: () => new Proxy({}, { get: (_target, key) => String(key) }) };
      }
      if (name.includes("mobile-finance-artifacts")) {
        return {
          messageRepeatsAnswer,
          mobileCitationSegments,
          mobileFinanceCitationForUrl,
          mobileFinanceArtifactCard,
          mobileFinanceArtifactTimestamp,
          mobileFinanceCitationDate,
          mobileFinanceMessageCarriesAnswer,
        };
      }
      if (name.includes("mobile-markdown")) {
        return {
          mobileMarkdownBlocks: (value: string) => markdown
            ? value.split(/\n\n/).map((paragraph) => ({ kind: "paragraph", segments: [{ kind: "plain", text: paragraph }] }))
            : [],
        };
      }
      if (name.includes("mobile-message-links")) {
        return { mobileAssistantLinkSegments: (value: string) => [{ kind: "plain", text: value }] };
      }
      throw new Error(`Unexpected dependency: ${name}`);
    },
  });
  return exports;
}

test("the card does not repeat an answer the message already shows, and starts closed", () => {
  const FinanceArtifactCard = loadNative("FinanceArtifactCard.tsx", true).FinanceArtifactCard as (props: Record<string, unknown>) => unknown;
  const reference = capChatReference(REFERENCES);

  const repeated = nodes(FinanceArtifactCard({ reference, locale: "en", messageText: ANSWER, onOpenUrl: () => {} }));
  assert.equal(repeated.some((node) => node.type === "Text" && textOf(node) === "CapChat answer"), false);
  // Closed: since the 2026-09-23 device finding the card under such a message
  // is one sources row, no tabs and no tab details (hpd808-card-no-duplicate).
  const buttons = repeated.filter((node) => node.type === "Pressable" && node.props.accessibilityRole === "button");
  assert.deepEqual(buttons.map((node) => node.props.accessibilityLabel), [`Sources (${REFERENCES.length})`]);
  assert.equal(repeated.some((node) => String(node.props.accessibilityLabel ?? "").endsWith(" details")), false);
  assert.equal(
    repeated.some((node) => node.type === "Pressable" && (node.props.accessibilityState as { expanded?: boolean })?.expanded),
    false,
  );

  // A message that says something else still gets the answer in the card,
  // and its markers there open the same source.
  const pressed: number[] = [];
  const different = nodes(FinanceArtifactCard({
    reference,
    locale: "en",
    messageText: "I asked CapChat for you.",
    onCitationPress: (item: MobileFinanceCitation) => pressed.push(item.number),
    onOpenUrl: () => {},
  }));
  assert.equal(different.some((node) => node.type === "Text" && textOf(node) === "CapChat answer"), true);
  const markers = different.filter((node) => node.type === "Text" && String(node.props.accessibilityLabel ?? "").startsWith("Source "));
  assert.deepEqual(markers.map(textOf), ["[1]", "2", "3", "[10]"]);
  (markers[0]!.props.onPress as () => void)();
  assert.deepEqual(pressed, [1]);
});

test("the sheet shows only fetched full text and hands the original to the host", () => {
  const FinanceCitationSheet = loadNative("FinanceCitationSheet.tsx", false).FinanceCitationSheet as (props: Record<string, unknown>) => unknown;
  const opened: string[] = [];
  let closed = 0;
  const tree = nodes(FinanceCitationSheet({
    citation: citation(1),
    document: {
      documentKind: "stored_research_body", title: "Complete research", publisher: "Morningstar",
      publishedAt: "2026-09-18T08:00:00.000Z", body: "The whole stored research body.",
      originalUrl: "https://research.example/notes/1",
    },
    phase: "ready",
    locale: "en",
    onClose: () => { closed += 1; },
    onOpenUrl: (url: string) => opened.push(url),
    onRetry: () => {},
  }));
  const modal = tree.find((node) => node.type === "Modal");
  assert.equal(modal?.props.presentationStyle, "pageSheet");
  const texts = tree.filter((node) => node.type === "Text").map(textOf);
  assert.ok(texts.includes("Complete research"));
  assert.ok(texts.some((value) => /^Morningstar · Sep 18, 2026$/.test(value)));
  assert.ok(texts.includes("The whole stored research body."));
  assert.equal(texts.includes("NVIDIA data center revenue rose again in the quarter, note 1."), false);

  const original = tree.find((node) => node.type === "Pressable" && node.props.accessibilityRole === "link");
  (original!.props.onPress as () => void)();
  assert.deepEqual(opened, ["https://research.example/notes/1"]);
  const close = tree.find((node) => node.type === "Pressable" && node.props.accessibilityLabel === "Close");
  (close!.props.onPress as () => void)();
  (modal!.props.onRequestClose as () => void)();
  assert.equal(closed, 2);
});

test("loading and denied-document states never show an artifact snippet, and error offers retry", () => {
  const FinanceCitationSheet = loadNative("FinanceCitationSheet.tsx", false).FinanceCitationSheet as (props: Record<string, unknown>) => unknown;
  const source = citation(1);
  let retried = 0;
  const props = {
    citation: source, document: null, locale: "en",
    onClose: () => {}, onOpenUrl: () => {}, onRetry: () => { retried += 1; },
  };
  const loading = nodes(FinanceCitationSheet({ ...props, phase: "loading" }));
  const loadingText = loading.filter((node) => node.type === "Text").map(textOf);
  assert.ok(loadingText.includes("Loading full document…"));
  assert.equal(loadingText.some((value) => value.includes("NVIDIA data center revenue")), false);
  const error = nodes(FinanceCitationSheet({ ...props, phase: "error" }));
  const retry = error.find((node) => node.type === "Pressable" && node.props.accessibilityLabel === "Retry full document");
  assert.ok(retry);
  (retry.props.onPress as () => void)();
  assert.equal(retried, 1);
  assert.ok(error.filter((node) => node.type === "Text").map(textOf).includes("The full document could not be loaded."));
});

test("the chat message keeps inline references and routes confirmed documents through the host", () => {
  const surface = readFileSync(new URL("../src/surface.tsx", import.meta.url), "utf8");
  const bubble = surface.slice(surface.indexOf("function MessageBubble("), surface.indexOf("function MobileChatApprovalCard("));
  assert.match(bubble, /mobileFinanceCitationAction\(citation, Boolean\(readFinanceSourceDocument\)\)/);
  assert.match(bubble, /mobileFinanceCitationDocumentResult\(/);
  assert.match(bubble, /if \(result\.kind !== "document"\)/);
  assert.match(bubble, /setOpenCitation\(\{ citation, document: null, phase: "error" \}\)/);
  assert.match(bubble, /<LinkedMessageText citations=\{citations\} onCitationPress=\{pressCitation\} text=\{assistantText\} \/>/);
  assert.match(bubble, /messageText=\{message\.content\}/);
  assert.match(bubble, /<FinanceCitationSheet[\s\S]+onClose=\{closeCitation\}/);

  const inline = surface.slice(surface.indexOf("function MobileMarkdownInlineText("), surface.indexOf("function LinkedMessageText("));
  assert.match(inline, /mobileCitationSegments\(segment\.text, citations\)/);
  assert.match(inline, /mobileFinanceCitationForUrl\(href, citations\)/);
  assert.match(inline, /onPress=\{\(\) => onCitationPress\(piece\.citation\)\}/);
  const linked = surface.slice(surface.indexOf("function LinkedMessageText("), surface.indexOf("function PendingAssistantMessage("));
  assert.equal(linked.match(/citations=\{citations\}/g)?.length, 4); // table cell, list item, heading, paragraph
});
