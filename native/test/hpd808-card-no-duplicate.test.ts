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
  mobileFinanceMessageCarriesAnswer,
} from "../src/mobile-finance-artifacts";

// HPD-808, device finding 2026-09-23 13:39: a background CapChat research
// arrived as a Home Chat message the main agent wrote itself, with working [n]
// references, and the CapChat card below printed the same answer again in
// small: summary, table and sources. The message wording is not CapChat's
// word for word, so the verbatim check never matched.

const CAPCHAT_ANSWER = [
  "## SAP: Kurzfazit",
  "",
  "Analysten bleiben positiv [1], das Cloud-Wachstum trägt [2].",
  "",
  "| Haus | Ziel |",
  "| --- | --- |",
  "| Bank A | 290 EUR [1] |",
].join("\n");

// What the main agent wrote into the Home Chat: the same content, its own words.
const MESSAGE = [
  "**SAP im Überblick**",
  "",
  "Die Analysten sind weiter positiv gestimmt [1]. Getragen wird das vom Cloud-Geschäft [2].",
  "",
  "- Bank A: Kursziel 290 EUR [1]",
].join("\n");

function source(number: number, url: string | null): Record<string, unknown> {
  return {
    source_number: number,
    title: `Research note ${number}`,
    publisher: "Morningstar",
    published_at: "2026-09-18T08:00:00.000Z",
    full_text: `Headline-length text of note ${number}.`,
    summary: `Summary ${number} that the compact list must not print.`,
    url,
  };
}

const REFERENCES = [source(1, "https://research.example/1"), source(2, "https://research.example/2"), source(3, null)];

function capChatReference(): ChatArtifactReference {
  return {
    id: "artifact-808-dup",
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
        answer: { format: "markdown", text: CAPCHAT_ANSWER },
        references: REFERENCES,
        contextCard: {
          schema: "capchat.context_card.v1",
          tabs: [
            { key: "research", label: "Research", count: 2, available: true, content: { sources: REFERENCES.slice(0, 2) } },
            { key: "data", label: "Data", count: 1, available: true, content: { metrics: { revenue: 1 } } },
            { key: "web", label: "Web Results", count: 1, available: true, content: { sources: REFERENCES.slice(2) } },
          ],
        },
        provenance: { answer_author: "capchat", mode: "delegated_answer", upstream: "capchat_chat_brain" },
        capturedAt: "2026-09-23T11:39:00.000Z",
      },
    },
  };
}

test("a message that carries the card's references already carries the answer", () => {
  const card = mobileFinanceArtifactCard(capChatReference());
  assert.ok(card);
  // The wording differs, so the verbatim check alone misses it: the 13:39 bug.
  assert.equal(messageRepeatsAnswer(MESSAGE, card.answerMarkdown), false);
  assert.equal(mobileFinanceMessageCarriesAnswer(MESSAGE, card), true);
  // Word for word still counts.
  assert.equal(mobileFinanceMessageCarriesAnswer(CAPCHAT_ANSWER, card), true);
  // No message, or one without a single resolvable reference: the card still has to show the answer.
  assert.equal(mobileFinanceMessageCarriesAnswer(undefined, card), false);
  assert.equal(mobileFinanceMessageCarriesAnswer("Ich habe CapChat gefragt, hier die Antwort.", card), false);
  assert.equal(mobileFinanceMessageCarriesAnswer("Siehe Quelle [9].", card), false);
  assert.equal(mobileFinanceMessageCarriesAnswer("[Reuters](https://www.reuters.com/x)", card), false);
});

type Node = { type: unknown; props: Record<string, unknown> };

function mountCard(openState: string | null) {
  const code = ts.transpileModule(
    readFileSync(new URL("../src/FinanceArtifactCard.tsx", import.meta.url), "utf8"),
    { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } },
  ).outputText;
  const exports: Record<string, unknown> = {};
  const jsx = (type: unknown, props: Record<string, unknown>) => ({ type, props });
  vm.runInNewContext(code, {
    exports,
    require(name: string) {
      if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
      // Every piece of card state is a closed-or-open key; the test opens it by
      // handing the first state hook a value.
      if (name === "react") return { useState: (initial: unknown) => [openState ?? initial, () => {}] };
      if (name === "react-native") {
        return {
          Platform: { select: (value: Record<string, unknown>) => value.ios },
          Pressable: "Pressable",
          StyleSheet: { create: (value: unknown) => value },
          Text: "Text",
          View: "View",
        };
      }
      if (name === "lucide-react-native") {
        return { AlertTriangle: "AlertTriangle", ChevronDown: "ChevronDown", ExternalLink: "ExternalLink", FileText: "FileText" };
      }
      if (name.includes("mobile-palette-context")) {
        return { useMobilePalette: () => ({
          coral: "coral", coralSoft: "coralSoft", ink: "ink", line: "line",
          lineStrong: "lineStrong", muted: "muted", surface: "surface", teal: "teal",
          tealSoft: "tealSoft", text: "text",
        }) };
      }
      if (name.includes("mobile-finance-artifacts")) {
        return {
          messageRepeatsAnswer,
          mobileCitationSegments,
          mobileFinanceArtifactCard,
          mobileFinanceArtifactTimestamp,
          mobileFinanceMessageCarriesAnswer,
        };
      }
      if (name.includes("mobile-markdown")) return { mobileMarkdownBlocks: () => [] };
      if (name.includes("mobile-message-links")) {
        return { mobileAssistantLinkSegments: (value: string) => [{ kind: "plain", text: value }] };
      }
      throw new Error(`Unexpected dependency: ${name}`);
    },
  });
  return exports.FinanceArtifactCard as (props: Record<string, unknown>) => unknown;
}

function nodes(value: unknown): Node[] {
  if (!value || typeof value !== "object") return [];
  if (Array.isArray(value)) return value.flatMap(nodes);
  const node = value as Node;
  return [node, ...nodes(node.props?.children)];
}

function texts(tree: unknown): string[] {
  return nodes(tree).flatMap((node) => {
    const children = node.props?.children;
    const values = Array.isArray(children) ? children : [children];
    return values.filter((child): child is string | number => typeof child === "string" || typeof child === "number").map(String);
  });
}

test("under a message that already is the answer, the card is one closed 'Quellen (n)' row", () => {
  const component = mountCard(null);
  const tree = component({ reference: capChatReference(), locale: "de", messageText: MESSAGE, onOpenUrl: () => {} });
  const all = nodes(tree);
  const words = texts(tree).join(" ");
  // No second answer, no tabs, no summary table, no source list.
  assert.equal(all.some((node) => node.props.text === CAPCHAT_ANSWER), false);
  assert.doesNotMatch(words, /CapChat answer|Research|Web Results|Data|Summary 1|Research note 1/);
  const toggles = all.filter((node) => node.type === "Pressable");
  assert.equal(toggles.length, 1);
  assert.equal(toggles[0]!.props.accessibilityLabel, "Quellen (3)");
  assert.equal((toggles[0]!.props.accessibilityState as { expanded: boolean }).expanded, false);
});

test("opening the row lists titles and links only, and a title opens its page", () => {
  const opened: string[] = [];
  const component = mountCard("sources");
  const tree = component({ reference: capChatReference(), locale: "en", messageText: MESSAGE, onOpenUrl: (url: string) => opened.push(url) });
  const all = nodes(tree);
  const toggle = all.find((node) => node.props.accessibilityLabel === "Sources (3)");
  assert.ok(toggle);
  assert.equal((toggle.props.accessibilityState as { expanded: boolean }).expanded, true);
  const links = all.filter((node) => node.type === "Pressable" && node.props.accessibilityRole === "link");
  assert.equal(links.length, 2);
  const words = texts(tree).join(" ");
  assert.match(words, /\[1\] Research note 1/);
  assert.match(words, /\[3\] Research note 3/);
  // Titles and links, not the summaries, and never the answer a second time.
  assert.doesNotMatch(words, /Summary 1|CapChat answer/);
  (links[1]!.props.onPress as () => void)();
  assert.deepEqual(opened, ["https://research.example/2"]);
});

test("a message that does not carry the answer still gets the full card", () => {
  const component = mountCard(null);
  const tree = component({
    reference: capChatReference(),
    locale: "de",
    messageText: "Ich habe CapChat gefragt, hier die Antwort.",
    onOpenUrl: () => {},
  });
  const words = texts(tree).join(" ");
  assert.match(words, /CapChat answer/);
  assert.equal(nodes(tree).some((node) => node.props.text === CAPCHAT_ANSWER), true);
});
