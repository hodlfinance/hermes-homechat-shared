import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import type { ChatArtifactReference } from "../core/index";
import {
  messageRepeatsAnswer,
  mobileCitationSegments,
  mobileFinanceArtifactCard,
  mobileFinanceArtifactTimestamp,
  mobileFinanceCitationDate,
  mobileFinanceCitations,
  type MobileFinanceCitation,
} from "../src/mobile-finance-artifacts";

// HPD-808: the [n] markers CapChat writes into its answer open that one source.
// The references below carry the keys a stored v3 source bundle carried on
// 2026-09-22: research sources with a headline-length full_text, and a web
// result with nothing but its address.

const ANSWER = "NVIDIA beat estimates [1] and raised guidance [2, 3].\n\nSee [Reuters](https://www.reuters.com/x) and [10].";

function capChatReference(
  references: Array<Record<string, unknown>>,
  answer = ANSWER,
  id = "artifact-808",
): ChatArtifactReference {
  return {
    id,
    kind: "source_bundle",
    source: "finhermes",
    version: 3,
    sensitivity: "finance_context",
    label: "CapChat context",
    safeSummary: "A complete CapChat answer is available.",
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

function research(number: number, overrides: Record<string, unknown> = {}): Record<string, unknown> {
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
    text: "NVIDIA data center revenue rose again in the quarter, note 1.",
    url: "https://research.example/notes/1",
  });
  // A web result has no text: its tap goes straight to the page.
  assert.deepEqual(card.citations?.[3], {
    number: 10,
    title: "NVIDIA investor relations",
    publisher: "nvidia.com",
    publishedAt: null,
    text: null,
    // Justus, 2026-09-23: keep the query; article pages often need it.
    url: "https://investor.nvidia.com/news?utm_source=capchat",
  });
  // Credential-like parameters are dropped; ordinary ones such as utm_source stay.
  assert.doesNotMatch(JSON.stringify(card.citations), /hidden/);
});

test("the longest text a reference carries is the one shown", () => {
  const [longer] = mobileFinanceCitations([capChatReference([
    research(1, { full_text: "Headline only.", body: "Headline only.", summary: "A longer summary that says more than the headline does." }),
  ])]);
  assert.equal(longer?.text, "A longer summary that says more than the headline does.");
});

test("a reference with nothing to show and nowhere to go, or without a usable number, is no citation", () => {
  const citations = mobileFinanceCitations([capChatReference([
    research(1, { full_text: null, body: null, summary: null, url: "http://insecure.example/x" }),
    research(2, { title: null, preview_title: null, source_name: null }),
    research(0),
    research(1.5),
    { ...research(4), source_number: "4" },
    research(5),
    research(5, { title: "Second copy of five" }),
  ])]);
  assert.deepEqual(citations.map((item) => [item.number, item.title]), [[5, "Research note 5"]]);
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

test("citations from several cards are merged, first number wins", () => {
  const first = capChatReference([research(1)], "One [1].", "artifact-a");
  const second = capChatReference([research(1, { title: "Other one" }), research(2)], "Two [2].", "artifact-b");
  assert.deepEqual(mobileFinanceCitations([first, second]).map((item) => [item.number, item.title]), [
    [1, "Research note 1"],
    [2, "Research note 2"],
  ]);
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
          mobileFinanceArtifactCard,
          mobileFinanceArtifactTimestamp,
          mobileFinanceCitationDate,
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
  // Closed: the tab buttons are there, no tab's details are.
  assert.equal(repeated.filter((node) => node.type === "Pressable" && node.props.accessibilityRole === "button").length, 3);
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

test("the sheet shows title, publisher, date and text, and hands the original to the host", () => {
  const FinanceCitationSheet = loadNative("FinanceCitationSheet.tsx", false).FinanceCitationSheet as (props: Record<string, unknown>) => unknown;
  const opened: string[] = [];
  let closed = 0;
  const tree = nodes(FinanceCitationSheet({
    citation: citation(1),
    locale: "en",
    onClose: () => { closed += 1; },
    onOpenUrl: (url: string) => opened.push(url),
  }));
  const modal = tree.find((node) => node.type === "Modal");
  assert.equal(modal?.props.presentationStyle, "pageSheet");
  const texts = tree.filter((node) => node.type === "Text").map(textOf);
  assert.ok(texts.includes("Research note 1"));
  assert.ok(texts.some((value) => /^Morningstar · Sep 18, 2026$/.test(value)));
  assert.ok(texts.includes("NVIDIA data center revenue rose again in the quarter, note 1."));

  const original = tree.find((node) => node.type === "Pressable" && node.props.accessibilityRole === "link");
  (original!.props.onPress as () => void)();
  assert.deepEqual(opened, ["https://research.example/notes/1"]);
  const close = tree.find((node) => node.type === "Pressable" && node.props.accessibilityLabel === "Close");
  (close!.props.onPress as () => void)();
  (modal!.props.onRequestClose as () => void)();
  assert.equal(closed, 2);
});

test("the chat message marks its references and opens text in the sheet, a bare page directly", () => {
  const surface = readFileSync(new URL("../src/surface.tsx", import.meta.url), "utf8");
  const bubble = surface.slice(surface.indexOf("function MessageBubble("), surface.indexOf("function MobileChatApprovalCard("));
  assert.match(bubble, /const citations = financeReferences\.length \? mobileFinanceCitations\(financeReferences\) : \[\];/);
  assert.match(bubble, /if \(citation\.text\) setOpenCitation\(citation\);\s+else if \(citation\.url\) void Linking\.openURL\(citation\.url\);/);
  assert.match(bubble, /<LinkedMessageText citations=\{citations\} onCitationPress=\{pressCitation\} text=\{assistantText\} \/>/);
  assert.match(bubble, /messageText=\{message\.content\}/);
  assert.match(bubble, /<FinanceCitationSheet[\s\S]+onClose=\{\(\) => setOpenCitation\(null\)\}/);

  const inline = surface.slice(surface.indexOf("function MobileMarkdownInlineText("), surface.indexOf("function LinkedMessageText("));
  assert.match(inline, /mobileCitationSegments\(segment\.text, citations\)/);
  assert.match(inline, /onPress=\{\(\) => onCitationPress\(piece\.citation\)\}/);
  const linked = surface.slice(surface.indexOf("function LinkedMessageText("), surface.indexOf("function PendingAssistantMessage("));
  assert.equal(linked.match(/citations=\{citations\}/g)?.length, 4); // table cell, list item, heading, paragraph
});
