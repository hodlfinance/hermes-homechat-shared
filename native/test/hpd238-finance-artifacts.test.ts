import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import type { ChatArtifactReference } from "../core/index";
import type { SharedHomechatJsonValue } from "@hodlfinance/hermes-homechat-shared/core";
import {
  messageRepeatsAnswer,
  mobileFinanceMessageCarriesAnswer,
  mobileCitationSegments,
  mobileFinanceArtifactCard,
  mobileFinanceArtifactTimestamp,
  uniqueMobileFinanceArtifactReferences,
} from "../src/mobile-finance-artifacts";

function reference(overrides: Partial<ChatArtifactReference> = {}): ChatArtifactReference {
  return {
    id: "artifact-1",
    kind: "source_bundle",
    source: "finhermes",
    version: 2,
    sensitivity: "general",
    label: "Finance result",
    safeSummary: "Finance result available.",
    artifactPresentation: {
      type: "finhermes_artifact_payload",
      version: 1,
      kind: "source_bundle",
      payloadVersion: 2,
      retainedUntil: "2026-09-27T12:00:00.000Z",
      payload: {
        presentation: "metrics_comparison",
        title: "Metrics comparison",
        status: "ok",
        message: "One requested metric was unavailable.",
        data: {
          result: {
            rows: [
              {
                symbol: "NVDA",
                revenue: 130000000000,
                peRatio: 42.3,
                access_token: "must-not-render",
                internalAccountId: "must-not-render",
                renamedProviderHandle: "must-not-render",
                summary: "Authorization: must-not-render",
              },
              { symbol: "AAPL", revenue: 390000000000, peRatio: 31.2 },
            ],
          },
          coverage: { returnedAssetCount: 2, trace: "must-not-render" },
        },
        sources: [{
          id: "source-1",
          label: "FinData Warehouse metrics",
          detail: "Latest reported fundamentals",
          url: "https://warehouse.example/metrics?token=secret#row",
          warnings: ["One metric was unavailable."],
        }],
        capturedAt: "2026-09-13T12:00:00.000Z",
      },
    },
    ...overrides,
  };
}

function capChatReference(overrides: Partial<ChatArtifactReference> = {}): ChatArtifactReference {
  const researchSources = Array.from({ length: 13 }, (_, index) => ({
    source_number: index + 1,
    source_type: "research",
    title: `Research source ${index + 1}`,
    summary: `Research detail ${index + 1}`,
    url: `https://research.example/source-${index + 1}?token=hidden#section`,
  }));
  return reference({
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
        answer: {
          format: "markdown",
          text: "## View\n\n| Asset | Score |\n| --- | ---: |\n| NVDA | 9 |\n\nSee [1] and [13].",
        },
        references: researchSources,
        contextCard: {
          schema: "capchat.context_card.v1",
          tabs: [
            { key: "research", label: "Research", count: 13, available: true, content: { sources: researchSources } },
            {
              key: "data", label: "Data", count: 1, available: true,
              content: {
                fundamentals: {
                  symbol: "NVDA", company_name: "NVIDIA", revenue: 130000000000,
                  access_token: "must-not-render", internalAccountId: "must-not-render",
                },
              },
            },
            { key: "web", label: "Web Results", count: 0, available: false, content: { sources: [] } },
          ],
        },
        provenance: {
          answer_author: "capchat",
          mode: "delegated_answer",
          response_mode: "full_answer",
          upstream: "capchat_chat_brain",
        },
        capturedAt: "2026-09-15T12:00:00.000Z",
      },
    },
    ...overrides,
  });
}

test("a Finance comparison becomes a bounded native card without internal fields", () => {
  const card = mobileFinanceArtifactCard(reference());
  assert.ok(card);
  assert.equal(card.title, "Metrics comparison");
  assert.equal(card.presentation, "metrics_comparison");
  assert.equal(card.status, "ok");
  assert.equal(card.sections.some((section) => section.title === "NVDA"), true);
  assert.equal(card.sections.some((section) => section.title === "AAPL"), true);
  const visible = JSON.stringify(card);
  assert.match(visible, /130000000000/);
  assert.match(visible, /42\.3/);
  assert.doesNotMatch(visible, /must-not-render/);
  assert.equal(card.sources[0]?.url, "https://warehouse.example/metrics");
});

test("unavailable results still explain the honest source state", () => {
  const source = reference();
  const artifactPresentation = source.artifactPresentation as Record<string, unknown>;
  const payload = artifactPresentation.payload as Record<string, unknown>;
  const card = mobileFinanceArtifactCard(reference({
    artifactPresentation: {
      ...artifactPresentation,
      payload: {
        ...payload,
        status: "unavailable",
        message: "The requested transcript is unavailable.",
        data: {},
        sources: [],
      },
    },
  }));
  assert.ok(card);
  assert.equal(card.status, "unavailable");
  assert.equal(card.message, "The requested transcript is unavailable.");
});

test("market point series are summarized instead of flooding the transcript", () => {
  const source = reference();
  const artifactPresentation = source.artifactPresentation as Record<string, unknown>;
  const payload = artifactPresentation.payload as Record<string, unknown>;
  const card = mobileFinanceArtifactCard(reference({
    artifactPresentation: {
      ...artifactPresentation,
      payload: {
        ...payload,
        presentation: "market",
        title: "Market data",
        data: {
          charts: [{
            asset: { symbol: "NVDA", currency: "USD" },
            chart: { points: Array.from({ length: 40 }, (_, index) => ({ timestamp: index, close: 100 + index })) },
          }],
        },
      },
    },
  }));
  assert.ok(card);
  assert.match(JSON.stringify(card), /40 points, latest 139/);
  assert.ok(card.sections.reduce((sum, section) => sum + section.rows.length, 0) <= 80);
});

test("a complete CapChat answer keeps Markdown, all references, and the three native context tabs", () => {
  const card = mobileFinanceArtifactCard(capChatReference());
  assert.ok(card);
  assert.equal(card.presentation, "capchat_context_card");
  assert.match(card.answerMarkdown ?? "", /\| NVDA \| 9 \|/);
  assert.deepEqual(card.contextTabs?.map((tab) => tab.label), ["Research", "Data", "Web Results"]);
  assert.equal(card.contextTabs?.[0]?.sources.length, 13);
  assert.equal(card.contextTabs?.[0]?.sources[12]?.label, "[13] Research source 13");
  assert.equal(card.contextTabs?.[0]?.sources[0]?.url, "https://research.example/source-1");
  assert.match(JSON.stringify(card.contextTabs?.[1]?.sections), /130000000000/);
  assert.doesNotMatch(JSON.stringify(card), /must-not-render|hidden/);
  assert.equal(card.contextTabs?.[2]?.available, false);
});

test("malformed CapChat context cards fail closed", () => {
  const reference = capChatReference();
  const presentation = reference.artifactPresentation as Record<string, unknown>;
  const payload = presentation.payload as Record<string, unknown>;
  const contextCard = payload.contextCard as Record<string, unknown>;
  const [research, data, web] = contextCard.tabs as SharedHomechatJsonValue[];
  assert.ok(research && data && web);
  assert.equal(mobileFinanceArtifactCard(capChatReference({
    artifactPresentation: {
      ...presentation,
      payload: {
        ...payload,
        contextCard: { ...contextCard, tabs: [data, research, web] },
      },
    },
  })), null);
});

test("mismatched, broker-owned, or unsupported artifact payloads fail closed", () => {
  assert.equal(mobileFinanceArtifactCard(reference({ sensitivity: "broker_context" })), null);
  assert.equal(mobileFinanceArtifactCard(reference({ source: "upload" })), null);
  assert.equal(mobileFinanceArtifactCard(reference({
    artifactPresentation: {
      ...(reference().artifactPresentation as Record<string, unknown>),
      payloadVersion: 1,
    },
  })), null);
  const source = reference();
  const artifactPresentation = source.artifactPresentation as Record<string, unknown>;
  const payload = artifactPresentation.payload as Record<string, unknown>;
  assert.equal(mobileFinanceArtifactCard(reference({
    artifactPresentation: {
      ...artifactPresentation,
      payload: { ...payload, presentation: "broker_status" },
    },
  })), null);
});

test("portfolio snapshots expose only the product fields in the versioned contract", () => {
  const card = mobileFinanceArtifactCard(reference({
    kind: "portfolio_snapshot",
    version: 1,
    sensitivity: "finance_context",
    artifactPresentation: {
      type: "finhermes_artifact_payload",
      version: 1,
      kind: "portfolio_snapshot",
      payloadVersion: 1,
      payload: {
        portfolio: {
          id: "hidden-portfolio-id",
          name: "Long term",
          baseCurrency: "CHF",
          source: "hodl",
          positionMode: "positions",
          positions: [{
            id: "hidden-position-id",
            symbol: "NESN",
            displaySymbol: "NESN",
            assetType: "stock",
            amount: "4",
            currency: "CHF",
            exchange: "SIX",
            unrelatedBackendValue: "must-not-render",
          }],
          transactions: [],
          unexpectedDocumentField: "must-not-render",
        },
        capturedAt: "2026-09-13T12:00:00.000Z",
      },
    },
  }));
  assert.ok(card);
  assert.equal(card.title, "Long term");
  assert.match(JSON.stringify(card), /NESN/);
  assert.doesNotMatch(JSON.stringify(card), /hidden-|must-not-render/);
});

test("timestamp formatting never emits Invalid Date", () => {
  assert.equal(mobileFinanceArtifactTimestamp("not-a-date", "en"), null);
  assert.notEqual(mobileFinanceArtifactTimestamp("2026-09-13T12:00:00.000Z", "en"), null);
});

test("Fin Hermes references are deduplicated without admitting upload artifacts", () => {
  const first = reference();
  const replacement = reference({ label: "Newer projection" });
  const upload = reference({ id: "upload-1", source: "upload" });
  assert.deepEqual(uniqueMobileFinanceArtifactReferences([first, upload, replacement]), [replacement]);
});

test("the actual native card mounts and its source link calls the host", () => {
  const opened: string[] = [];
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
      if (name === "react") return { useState: (initial: unknown) => [typeof initial === "function" ? (initial as () => unknown)() : initial, () => {}] };
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
        return { messageRepeatsAnswer, mobileCitationSegments, mobileFinanceArtifactCard, mobileFinanceArtifactTimestamp, mobileFinanceMessageCarriesAnswer };
      }
      if (name.includes("mobile-markdown")) {
        return { mobileMarkdownBlocks: () => [] };
      }
      if (name.includes("mobile-message-links")) {
        return { mobileAssistantLinkSegments: (value: string) => [{ kind: "plain", text: value }] };
      }
      throw new Error(`Unexpected dependency: ${name}`);
    },
  });
  const component = exports.FinanceArtifactCard as (props: Record<string, unknown>) => unknown;
  const tree = component({ reference: reference(), locale: "en", onOpenUrl: (url: string) => opened.push(url) });
  const nodes = (value: unknown): Array<{ type: unknown; props: Record<string, unknown> }> => {
    if (!value || typeof value !== "object") return [];
    if (Array.isArray(value)) return value.flatMap(nodes);
    const node = value as { type: unknown; props: Record<string, unknown> };
    return [node, ...nodes(node.props?.children)];
  };
  const link = nodes(tree).find((node) => node.type === "Pressable" && node.props.accessibilityRole === "link");
  assert.ok(link);
  assert.equal(nodes(tree).some((node) => node.props.accessibilityLabel === "Metrics comparison"), true);
  (link.props.onPress as () => void)();
  assert.deepEqual(opened, ["https://warehouse.example/metrics"]);
  assert.equal(component({ reference: reference({ sensitivity: "broker_context" }), locale: "en", onOpenUrl: () => {} }), null);

  const globalOnlyReference = capChatReference();
  const globalOnlyPresentation = globalOnlyReference.artifactPresentation as Record<string, unknown>;
  const globalOnlyPayload = globalOnlyPresentation.payload as Record<string, unknown>;
  const globalOnlyContext = globalOnlyPayload.contextCard as Record<string, unknown>;
  const globalOnlyTabs = globalOnlyContext.tabs as Array<Record<string, unknown>>;
  const researchTab = globalOnlyTabs[0];
  assert.ok(researchTab);
  researchTab.content = { sources: [] };
  const globalOnlyTree = component({ reference: globalOnlyReference, locale: "en", onOpenUrl: () => {} });
  const globalOnlyLinks = nodes(globalOnlyTree).filter(
    (node) => node.type === "Pressable" && node.props.accessibilityRole === "link",
  );
  assert.equal(globalOnlyLinks.length, 13);
});

test("the native CapChat card renders its answer and expandable tab controls", () => {
  const source = readFileSync(new URL("../src/FinanceArtifactCard.tsx", import.meta.url), "utf8");
  assert.match(source, /<MarkdownContent[^>]+text=\{card\.answerMarkdown\}/);
  assert.match(source, /contextTabs\.map/);
  assert.match(source, /accessibilityState=\{\{ disabled: !tab\.available, expanded: selected, selected \}\}/);
  assert.match(source, /setActiveContextTab\(selected \? null : tab\.key\)/);
  assert.match(source, /selectedContextTab\.sources\.map/);
});

test("the assistant transcript mounts cards for Fin Hermes artifacts only", () => {
  const surface = readFileSync(new URL("../src/surface.tsx", import.meta.url), "utf8");
  const bubble = surface.slice(surface.indexOf("function MessageBubble("), surface.indexOf("const reduceMotionStore"));
  assert.match(bubble, /uniqueMobileFinanceArtifactReferences\(message\.artifactReferences\)/);
  assert.match(bubble, /<FinanceArtifactCard/);
  assert.match(bubble, /onOpenUrl=\{\(url\) => void Linking\.openURL\(url\)\}/);
});
