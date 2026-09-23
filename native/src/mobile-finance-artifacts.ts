import type { ChatArtifactReference } from "../core/index";

export type MobileFinanceArtifactStatus = "ok" | "not_configured" | "unavailable";

export type MobileFinanceArtifactRow = {
  label: string;
  value: string;
};

export type MobileFinanceArtifactSection = {
  title: string;
  rows: MobileFinanceArtifactRow[];
};

export type MobileFinanceArtifactSource = {
  label: string;
  detail: string | null;
  url: string | null;
  warnings: string[];
};

export type MobileFinanceArtifactContextTab = {
  available: boolean;
  count: number;
  key: "research" | "data" | "web";
  label: "Research" | "Data" | "Web Results";
  sections: MobileFinanceArtifactSection[];
  sources: MobileFinanceArtifactSource[];
};

// HPD-808: one numbered reference of a delegated CapChat answer, as the reader
// meets it when tapping [n] in the answer text.
export type MobileFinanceCitation = {
  number: number;
  title: string;
  publisher: string | null;
  publishedAt: string | null;
  text: string | null;
  url: string | null;
};

export type MobileFinanceArtifactCard = {
  answerMarkdown?: string | null;
  capturedAt: string | null;
  citations?: MobileFinanceCitation[];
  contextTabs?: MobileFinanceArtifactContextTab[];
  message: string | null;
  presentation: string;
  sections: MobileFinanceArtifactSection[];
  sources: MobileFinanceArtifactSource[];
  status: MobileFinanceArtifactStatus;
  title: string;
};

const ALLOWED_PRESENTATIONS = new Set([
  "asset_list",
  "market",
  "warehouse_topics",
  "metrics_comparison",
  "stock_screener",
  "etf_screener",
  "etf_topics",
  "web_research",
  "attachment_context",
  "context_items",
  "media_transcript",
]);

const BLOCKED_KEY_PARTS = [
  "account",
  "authorization",
  "cookie",
  "credential",
  "debug",
  "email",
  "header",
  "internal",
  "owner",
  "password",
  "private",
  "raw",
  "secret",
  "session",
  "signature",
  "sql",
  "token",
  "trace",
  "userid",
] as const;

const MAX_SECTIONS = 12;
const MAX_ROWS_PER_SECTION = 16;
const MAX_TOTAL_ROWS = 80;
const MAX_TEXT = 500;

type PresentationPolicy = {
  containers: ReadonlySet<string>;
  metrics: boolean;
  scalars: ReadonlySet<string>;
};

function keys(values: readonly string[]): ReadonlySet<string> {
  return new Set(values.map((value) => normalizedKey(value)));
}

const COMMON_CONTAINERS = [
  "artifact", "asset", "assets", "annotations", "chart", "charts", "content",
  "coverage", "data", "episode", "freshness", "items", "metrics", "output",
  "points", "result", "results", "rows", "segments", "topics", "values",
] as const;

const COMMON_SCALARS = [
  "answer", "asOf", "assetType", "authorHandle", "authorName", "category", "change",
  "changePercent", "close", "content", "currency", "date", "description", "detail",
  "disabled", "displaySymbol", "exchange", "fetchedAt", "fullText", "full_text", "high",
  "href", "label", "low", "message", "mimeType", "name", "note", "observedAt",
  "percentChange", "period", "premium", "price", "provider", "publishedAt", "publisher",
  "quantity", "range", "score", "source", "status", "summary", "symbol", "text", "ticker",
  "timeframe", "timestamp", "timestampedText", "timestamped_text", "title", "type", "unit",
  "updatedAt", "url", "value", "volume",
] as const;

const TOPIC_CONTAINERS = [
  "allocation", "balanceSheet", "capitalReturns", "cashFlow", "consensus", "costs",
  "dividends", "estimates", "exposure", "growth", "holdings", "income", "margins",
  "overview", "performance", "priceContext", "profile", "profitability", "ratings", "risk",
  "targets", "valuation",
] as const;

const SAFE_METRICS = keys([
  "aum", "beta", "cash", "cashAndEquivalents", "currentRatio", "debt", "debtToEquity",
  "dividend", "dividendPerShare", "dividendYield", "ebit", "ebitMargin", "ebitda",
  "ebitdaMargin", "enterpriseValue", "eps", "epsEstimate", "epsGrowth", "expenseRatio",
  "fiveYearReturn", "forwardPe", "freeCashFlow", "freeCashFlowMargin", "freeCashFlowYield",
  "grossMargin", "holdingsCount", "leverageRatio", "liquidityScore", "marketCap",
  "marketCapitalization", "nav", "netDebt", "netIncome", "netMargin", "oneYearReturn",
  "operatingCashFlow", "operatingIncome", "operatingMargin", "pbRatio", "peRatio", "pegRatio",
  "priceToBook", "priceToEarnings", "priceToSales", "profitMargin", "quickRatio", "rating",
  "returnOnAssets", "returnOnEquity", "revenue", "revenueEstimate", "revenueGrowth",
  "riskScore", "sectorWeight", "targetPrice", "threeYearReturn", "totalAssets", "totalDebt",
  "totalReturn", "turnover", "weight", "ytdReturn",
]);

function policy(options: { containers?: readonly string[]; metrics?: boolean; scalars?: readonly string[] } = {}): PresentationPolicy {
  return {
    containers: keys([...COMMON_CONTAINERS, ...(options.containers ?? [])]),
    metrics: options.metrics === true,
    scalars: keys([...COMMON_SCALARS, ...(options.scalars ?? [])]),
  };
}

const PRESENTATION_POLICIES: Record<string, PresentationPolicy> = {
  asset_list: policy({ containers: ["assets"] }),
  market: policy({ containers: ["asset", "chart", "charts", "points"] }),
  warehouse_topics: policy({ containers: TOPIC_CONTAINERS, metrics: true, scalars: ["requestedTopics"] }),
  metrics_comparison: policy({ metrics: true }),
  stock_screener: policy({ containers: ["securities", "stocks"], metrics: true, scalars: ["industry", "sector"] }),
  etf_screener: policy({ containers: ["etfs", "funds"], metrics: true, scalars: ["expenseRatio", "industry", "sector"] }),
  etf_topics: policy({ containers: TOPIC_CONTAINERS, metrics: true, scalars: ["requestedTopics"] }),
  web_research: policy({ containers: ["annotations", "content", "output"], scalars: ["outputText", "snippet"] }),
  attachment_context: policy({ containers: ["attachments", "missingIds"], scalars: ["createdAt", "extractionKind", "fileName", "mimeType", "size", "truncated"] }),
  context_items: policy({ containers: ["contextItems", "missingIds"], scalars: ["artifactId", "createdAt", "historyComplete", "kind", "messageId", "runId", "sourceCount", "summary"] }),
  media_transcript: policy({ containers: ["artifact", "episode", "segments"], scalars: ["end", "mediaType", "showName", "sourceFirm", "start", "wordCount"] }),
  capchat_context_data: policy({
    containers: [
      ...TOPIC_CONTAINERS,
      "assetMetrics", "asset_metrics", "etfScreener", "etf_screener", "etfTopics", "etf_topics",
      "fundamentals", "fundamentalsList", "fundamentals_list", "marketSnapshot", "market_snapshot",
      "portfolioContext", "portfolio_context", "positions", "primaryAsset", "primary_asset", "screener",
      "semanticUiState", "semantic_ui_state", "warehouseTopics", "warehouse_topics",
    ],
    metrics: true,
    scalars: [
      "amount", "companyName", "company_name", "country", "description", "displayName", "display_name",
      "employees", "exchange", "industry", "market", "mode", "name", "sector", "source", "symbol",
    ],
  }),
};

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function text(value: unknown, max = MAX_TEXT): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized && !sensitiveText(normalized) ? normalized.slice(0, max) : null;
}

function markdownText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.replace(/\r\n?/g, "\n").trim();
  return normalized && normalized.length <= 256 * 1024 && !sensitiveText(normalized)
    ? normalized
    : null;
}

function sensitiveText(value: string): boolean {
  return (
    /\bBearer\s+[A-Za-z0-9._~+/=-]{8,}/i.test(value) ||
    /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/i.test(value) ||
    /\b(?:sk-(?:proj-)?|gh[pousr]_|github_pat_|xox[baprs]-)[A-Za-z0-9_-]{10,}/i.test(value) ||
    /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/.test(value) ||
    /\b(?:api[_ -]?key|access[_ -]?token|refresh[_ -]?token|client[_ -]?secret|password|authorization)\s*[:=]\s*\S{4,}/i.test(value)
  );
}

function timestamp(value: unknown): string | null {
  const candidate = text(value, 128);
  return candidate && Number.isFinite(Date.parse(candidate)) ? candidate : null;
}

// HPD-808 (Build 45, Justus 2026-09-23): source headlines in the CapChat card
// looked like links and did nothing. React Native's URL class (HODL host,
// RN 0.77, no URL polyfill) throws "URL.protocol is not implemented", so the
// old `new URL()` check returned null for every source and the card drew plain
// text without a press target. This parses without URL: https only, userinfo
// and fragment dropped, path and query kept (article pages often need them).
const SAFE_HTTPS_URL = /^https:\/\/(?:[^\s/?#@]*@)?([A-Za-z0-9.-]+(?::\d{1,5})?)([/?][^\s#]*)?(?:#[^\s]*)?$/i;

// A query parameter whose name suggests a credential never leaves the card.
const SENSITIVE_QUERY_NAME = /token|key|secret|sig|auth|pass|session|sid|code|credential/i;

function safeUrl(value: unknown): string | null {
  const candidate = text(value, 2_048)?.trim();
  if (!candidate) return null;
  const match = SAFE_HTTPS_URL.exec(candidate);
  const host = match?.[1];
  if (!match || !host || host.startsWith(".") || host.includes("..")) return null;
  const rest = match[2] ?? "/";
  const queryAt = rest.indexOf("?");
  const path = queryAt < 0 ? rest : rest.slice(0, queryAt);
  const kept = queryAt < 0 ? [] : rest.slice(queryAt + 1).split("&").filter((pair) => {
    const name = pair.split("=")[0] ?? "";
    return name.length > 0 && !SENSITIVE_QUERY_NAME.test(name);
  });
  return `https://${host.toLowerCase()}${path || "/"}${kept.length ? `?${kept.join("&")}` : ""}`;
}

function normalizedKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function blockedKey(value: string): boolean {
  const normalized = normalizedKey(value);
  return normalized === "id" || normalized.endsWith("id") || normalized.endsWith("ids") ||
    BLOCKED_KEY_PARTS.some((part) => normalized.includes(part));
}

function allowedKey(key: string, value: unknown, policy: PresentationPolicy): boolean {
  if (blockedKey(key) || key === "sources") return false;
  const normalized = normalizedKey(key);
  if (Array.isArray(value) || record(value)) return policy.containers.has(normalized);
  return policy.scalars.has(normalized) || (policy.metrics && SAFE_METRICS.has(normalized));
}

export function mobileFinanceFieldLabel(value: string): string {
  const words = value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim();
  return words ? `${words.charAt(0).toUpperCase()}${words.slice(1)}` : "Detail";
}

function scalarText(value: unknown): string | null {
  if (value === null) return "Not provided";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return text(value);
}

function objectTitle(value: Record<string, unknown>, fallback: string): string {
  for (const key of ["displaySymbol", "symbol", "ticker", "name", "title", "label"]) {
    const candidate = text(value[key], 120);
    if (candidate) return candidate;
  }
  return fallback;
}

function primitiveArray(value: unknown[]): string | null {
  const items = value.flatMap((item) => {
    const scalar = scalarText(item);
    return scalar ? [scalar] : [];
  });
  if (!items.length) return null;
  const visible = items.slice(0, 8);
  return `${visible.join(", ")}${items.length > visible.length ? ` +${items.length - visible.length} more` : ""}`;
}

function collectRows(
  value: unknown,
  rows: MobileFinanceArtifactRow[],
  policy: PresentationPolicy,
  prefix = "",
  depth = 0,
): void {
  if (rows.length >= MAX_ROWS_PER_SECTION || depth > 4) return;
  const scalar = scalarText(value);
  if (scalar) {
    rows.push({ label: prefix || "Value", value: scalar });
    return;
  }
  if (Array.isArray(value)) {
    if (!value.length) {
      rows.push({ label: prefix || "Items", value: "No items" });
      return;
    }
    const compact = primitiveArray(value);
    if (compact) {
      rows.push({ label: prefix || "Items", value: compact });
      return;
    }
    if (normalizedKey(prefix).endsWith("points")) {
      const latest = record(value.at(-1));
      const latestValue = latest
        ? scalarText(latest.close) ?? scalarText(latest.price) ?? scalarText(latest.value)
        : null;
      rows.push({
        label: prefix || "Points",
        value: latestValue ? `${value.length} points, latest ${latestValue}` : `${value.length} points`,
      });
      return;
    }
    value.slice(0, 8).forEach((item, index) => {
      collectRows(item, rows, policy, `${prefix || "Item"} ${index + 1}`, depth + 1);
    });
    if (value.length > 8 && rows.length < MAX_ROWS_PER_SECTION) {
      rows.push({ label: prefix || "Items", value: `${value.length - 8} more items` });
    }
    return;
  }
  const nested = record(value);
  if (!nested) return;
  Object.entries(nested).forEach(([key, item]) => {
    if (rows.length >= MAX_ROWS_PER_SECTION || !allowedKey(key, item, policy)) return;
    const label = prefix
      ? `${prefix} - ${mobileFinanceFieldLabel(key)}`
      : mobileFinanceFieldLabel(key);
    collectRows(item, rows, policy, label, depth + 1);
  });
}

function sectionsFromData(value: unknown, presentation: string): MobileFinanceArtifactSection[] {
  const projectionPolicy = PRESENTATION_POLICIES[presentation];
  if (!projectionPolicy) return [];
  const result: MobileFinanceArtifactSection[] = [];
  let totalRows = 0;
  const addSection = (title: string, candidate: unknown) => {
    if (result.length >= MAX_SECTIONS || totalRows >= MAX_TOTAL_ROWS) return;
    const rows: MobileFinanceArtifactRow[] = [];
    collectRows(candidate, rows, projectionPolicy);
    const bounded = rows.slice(0, Math.min(MAX_ROWS_PER_SECTION, MAX_TOTAL_ROWS - totalRows));
    if (!bounded.length) return;
    result.push({ title, rows: bounded });
    totalRows += bounded.length;
  };

  if (Array.isArray(value)) {
    value.slice(0, MAX_SECTIONS).forEach((item, index) => {
      const itemRecord = record(item);
      addSection(itemRecord ? objectTitle(itemRecord, `Result ${index + 1}`) : `Result ${index + 1}`, item);
    });
    return result;
  }

  const top = record(value);
  if (!top) return result;
  const overview: Record<string, unknown> = {};
  Object.entries(top).forEach(([key, item]) => {
    if (!allowedKey(key, item, projectionPolicy)) return;
    if (scalarText(item) || (Array.isArray(item) && primitiveArray(item))) overview[key] = item;
  });
  addSection("Overview", overview);

  Object.entries(top).forEach(([key, item]) => {
    if (!allowedKey(key, item, projectionPolicy) || key in overview || result.length >= MAX_SECTIONS) return;
    const collection = firstObjectCollection(item, projectionPolicy);
    if (collection) {
      collection.slice(0, MAX_SECTIONS - result.length).forEach((entry, index) => {
        const itemRecord = record(entry)!;
        addSection(objectTitle(itemRecord, `${mobileFinanceFieldLabel(key)} ${index + 1}`), itemRecord);
      });
      return;
    }
    addSection(mobileFinanceFieldLabel(key), item);
  });
  return result;
}

function firstObjectCollection(value: unknown, policy: PresentationPolicy, depth = 0): unknown[] | null {
  if (depth > 3) return null;
  if (Array.isArray(value)) {
    return value.length && value.every((item) => record(item)) ? value : null;
  }
  const nested = record(value);
  if (!nested) return null;
  for (const [key, item] of Object.entries(nested)) {
    if (!allowedKey(key, item, policy)) continue;
    const found = firstObjectCollection(item, policy, depth + 1);
    if (found) return found;
  }
  return null;
}

function sourcesFrom(value: unknown, limit = 12): MobileFinanceArtifactSource[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, limit).flatMap((item, index) => {
    const source = record(item);
    const plainLabel = text(source?.label, 160) ?? text(source?.title, 160) ??
      text(source?.name, 160) ?? text(source?.publisher, 160);
    const sourceNumber = typeof source?.source_number === "number" && Number.isSafeInteger(source.source_number) && source.source_number > 0
      ? source.source_number
      : index + 1;
    const label = plainLabel ? `[${sourceNumber}] ${plainLabel}` : null;
    if (!source || !label) return [];
    return [{
      label,
      detail: text(source.detail, 300) ?? text(source.summary, 300) ??
        text(source.snippet, 300) ?? text(source.excerpt, 300),
      url: safeUrl(source.url),
      warnings: Array.isArray(source.warnings)
        ? source.warnings.flatMap((warning) => text(warning, 240) ? [text(warning, 240)!] : []).slice(0, 4)
        : [],
    }];
  });
}

const CAPCHAT_CONTEXT_TAB_ORDER = ["research", "data", "web"] as const;
const CAPCHAT_CONTEXT_TAB_LABELS = {
  research: "Research",
  data: "Data",
  web: "Web Results",
} as const;

function capChatContextTabs(value: unknown): MobileFinanceArtifactContextTab[] | null {
  const contextCard = record(value);
  if (contextCard?.schema !== "capchat.context_card.v1" || !Array.isArray(contextCard.tabs)) return null;
  const tabs = contextCard.tabs.flatMap((candidate, index) => {
    const tab = record(candidate);
    const key = CAPCHAT_CONTEXT_TAB_ORDER[index];
    const content = record(tab?.content);
    if (
      !key || !tab || !content || tab.key !== key || tab.label !== CAPCHAT_CONTEXT_TAB_LABELS[key] ||
      typeof tab.available !== "boolean" || typeof tab.count !== "number" ||
      !Number.isSafeInteger(tab.count) || tab.count < 0
    ) return [];
    return [{
      available: tab.available,
      count: tab.count,
      key,
      label: CAPCHAT_CONTEXT_TAB_LABELS[key],
      sections: key === "data" ? sectionsFromData(content, "capchat_context_data") : [],
      sources: key === "data" ? [] : sourcesFrom(content.sources, 1_000),
    }];
  });
  return tabs.length === CAPCHAT_CONTEXT_TAB_ORDER.length ? tabs : null;
}

const CITATION_TEXT_MAX = 8_000;

// CapChat names the same thing under several keys depending on the source. The
// reader gets the first one present, and the longest available text, because
// CapChat's full_text is often only the headline.
function firstText(source: Record<string, unknown>, keys: readonly string[], max: number): string | null {
  for (const key of keys) {
    const value = text(source[key], max);
    if (value) return value;
  }
  return null;
}

function longestText(source: Record<string, unknown>, keys: readonly string[], max: number): string | null {
  let best: string | null = null;
  for (const key of keys) {
    const value = text(source[key], max);
    if (value && (!best || value.length > best.length)) best = value;
  }
  return best;
}

function capChatCitations(value: unknown): MobileFinanceCitation[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<number>();
  return value.slice(0, 200).flatMap((item) => {
    const source = record(item);
    const number = source?.source_number;
    if (!source || typeof number !== "number" || !Number.isSafeInteger(number) || number < 1 || seen.has(number)) {
      return [];
    }
    const title = firstText(source, ["title", "preview_title", "source_name", "name"], 300);
    const url = safeUrl(source.url) ?? safeUrl(source.article_url) ?? safeUrl(source.link) ??
      safeUrl(source.source_url) ?? safeUrl(source.web_url);
    const body = longestText(
      source,
      ["full_text", "body", "content", "summary", "excerpt", "snippet", "preview_text"],
      CITATION_TEXT_MAX,
    );
    // A reference needs something to show or somewhere to go; otherwise its
    // marker stays plain text instead of becoming a dead button.
    if (!title || (!body && !url)) return [];
    seen.add(number);
    return [{
      number,
      title,
      publisher: firstText(source, ["publisher", "source_firm", "publication", "publication_name", "source_name", "outlet"], 160),
      publishedAt: timestamp(source.published_at) ?? timestamp(source.timestamp),
      text: body && body !== title ? body : null,
      url,
    }];
  });
}

export type MobileCitationSegment =
  | { kind: "text"; text: string }
  | { kind: "citation"; citation: MobileFinanceCitation; text: string };

// Splits answer text at CapChat's markers — [3] or [2, 3] — into plain text and
// tappable references. The pieces join back to exactly the text that came in:
// nothing is rewritten, added or dropped. A marker with a number no reference
// carries stays plain text, and a markdown link [label](url) is never a marker.
export function mobileCitationSegments(
  value: string,
  citations: readonly MobileFinanceCitation[],
): MobileCitationSegment[] {
  if (!citations.length || !value.includes("[")) return [{ kind: "text", text: value }];
  const byNumber = new Map(citations.map((citation) => [citation.number, citation]));
  const segments: MobileCitationSegment[] = [];
  const pushText = (text: string) => {
    if (!text) return;
    const last = segments[segments.length - 1];
    if (last?.kind === "text") last.text += text;
    else segments.push({ kind: "text", text });
  };
  const marker = /\[(\d{1,3}(?:\s*,\s*\d{1,3})*)\](?!\()/g;
  let cursor = 0;
  for (const match of value.matchAll(marker)) {
    const inner = match[1] ?? "";
    const numbers = inner.split(",").map((part) => Number(part.trim()));
    if (numbers.some((number) => !byNumber.has(number))) continue;
    const start = match.index ?? 0;
    pushText(value.slice(cursor, start));
    if (numbers.length === 1) {
      // One number: the whole [n] is the tap target, as in CapChat.
      segments.push({ kind: "citation", citation: byNumber.get(numbers[0]!)!, text: match[0] });
    } else {
      pushText("[");
      let innerCursor = 0;
      for (const digits of inner.matchAll(/\d{1,3}/g)) {
        const digitsStart = digits.index ?? 0;
        pushText(inner.slice(innerCursor, digitsStart));
        segments.push({ kind: "citation", citation: byNumber.get(Number(digits[0]))!, text: digits[0] });
        innerCursor = digitsStart + digits[0].length;
      }
      pushText(`${inner.slice(innerCursor)}]`);
    }
    cursor = start + match[0].length;
  }
  pushText(value.slice(cursor));
  return segments;
}

// True when the chat message already carries this answer — since HPD-809 the
// message is CapChat's text word for word — so the card below must not print
// it a second time.
export function messageRepeatsAnswer(message: string | null | undefined, answer: string | null | undefined): boolean {
  if (!message || !answer) return false;
  const normalize = (value: string) => value.replace(/\s+/g, " ").trim();
  const normalizedAnswer = normalize(answer);
  return normalizedAnswer.length > 0 && normalize(message).includes(normalizedAnswer);
}

// True when the chat message above a CapChat card already is the answer: either
// CapChat's text word for word (HPD-809), or a message that carries at least one
// [n] reference this card can resolve. The second case is a background research
// the main agent wrote up in its own words (HPD-808, 2026-09-23 13:39): the
// reader already has the answer and its tappable references, so the card only
// offers the source list and never prints the answer a second time.
export function mobileFinanceMessageCarriesAnswer(
  message: string | null | undefined,
  card: MobileFinanceArtifactCard | null | undefined,
): boolean {
  if (!message || !card?.answerMarkdown) return false;
  if (messageRepeatsAnswer(message, card.answerMarkdown)) return true;
  const citations = card.citations ?? [];
  return citations.length > 0 &&
    mobileCitationSegments(message, citations).some((segment) => segment.kind === "citation");
}

function capChatContextCard(
  reference: ChatArtifactReference,
  payload: Record<string, unknown>,
): MobileFinanceArtifactCard | null {
  const answer = record(payload.answer);
  const provenance = record(payload.provenance);
  const tabs = capChatContextTabs(payload.contextCard);
  const answerMarkdown = answer?.format === "markdown" ? markdownText(answer.text) : null;
  if (
    payload.presentation !== "capchat_context_card" || payload.status !== "ok" ||
    !answerMarkdown || !tabs || provenance?.answer_author !== "capchat" ||
    provenance.mode !== "delegated_answer" || provenance.upstream !== "capchat_chat_brain"
  ) return null;
  return {
    answerMarkdown,
    capturedAt: timestamp(payload.capturedAt),
    citations: capChatCitations(payload.references),
    contextTabs: tabs,
    message: null,
    presentation: "capchat_context_card",
    sections: [],
    sources: sourcesFrom(payload.references, 1_000),
    status: "ok",
    title: text(payload.title, 160) ?? text(reference.label, 160) ?? "CapChat",
  };
}

function sourceBundleCard(reference: ChatArtifactReference, payload: Record<string, unknown>): MobileFinanceArtifactCard | null {
  const presentation = text(payload.presentation, 64);
  const title = text(payload.title, 160) ?? text(reference.label, 160) ?? "Finance result";
  const status = payload.status;
  if (
    !presentation ||
    !ALLOWED_PRESENTATIONS.has(presentation) ||
    (status !== "ok" && status !== "not_configured" && status !== "unavailable")
  ) return null;
  const sections = sectionsFromData(payload.data, presentation);
  const sources = sourcesFrom(payload.sources);
  const message = text(payload.message, 500);
  if (!sections.length && !sources.length && !message) return null;
  return {
    capturedAt: timestamp(payload.capturedAt),
    message,
    presentation,
    sections,
    sources,
    status,
    title,
  };
}

function researchCard(reference: ChatArtifactReference, payload: Record<string, unknown>): MobileFinanceArtifactCard | null {
  const items = Array.isArray(payload.items) ? payload.items : [];
  const sections: MobileFinanceArtifactSection[] = items.slice(0, 8).flatMap((item, index) => {
    const result = record(item);
    const title = text(result?.title, 180);
    if (!result || !title) return [];
    const rows: MobileFinanceArtifactRow[] = [];
    const summary = text(result.text, 500);
    if (summary) rows.push({ label: "Summary", value: summary });
    const source = text(result.source, 160);
    if (source) rows.push({ label: "Source", value: source });
    const publishedAt = timestamp(result.publishedAt);
    if (publishedAt) rows.push({ label: "Published", value: publishedAt });
    return rows.length ? [{ title: title || `Research ${index + 1}`, rows }] : [];
  });
  const selectedAssetResearch = Array.isArray(payload.selectedAssetResearch)
    ? payload.selectedAssetResearch
    : [];
  selectedAssetResearch.slice(0, MAX_SECTIONS - sections.length).forEach((item, index) => {
    const selection = record(item);
    const asset = record(selection?.asset);
    if (!selection || !asset) return;
    const rows: MobileFinanceArtifactRow[] = [];
    const source = text(selection.source, 160);
    if (source) rows.push({ label: "Source", value: source });
    const fetchedAt = timestamp(selection.fetchedAt);
    if (fetchedAt) rows.push({ label: "Fetched", value: fetchedAt });
    const resultItems = Array.isArray(selection.items) ? selection.items : [];
    resultItems.slice(0, 3).forEach((resultItem, resultIndex) => {
      const result = record(resultItem);
      const title = text(result?.title, 180);
      const summary = text(result?.text, 500);
      if (title || summary) rows.push({
        label: title || `Result ${resultIndex + 1}`,
        value: summary || "Available",
      });
    });
    if (rows.length) {
      sections.push({
        title: text(asset.displaySymbol, 120) ?? text(asset.symbol, 120) ?? `Asset ${index + 1}`,
        rows,
      });
    }
  });
  const sources = sourcesFrom(payload.sources);
  if (!sections.length && !sources.length) return null;
  return {
    capturedAt: timestamp(payload.capturedAt),
    message: text(payload.query, 500),
    presentation: "research",
    sections,
    sources,
    status: "ok",
    title: text(reference.label, 160) ?? "Research",
  };
}

function sourceBundleV1Card(reference: ChatArtifactReference, payload: Record<string, unknown>): MobileFinanceArtifactCard | null {
  const sources = sourcesFrom(payload.sources);
  if (!sources.length) return null;
  return {
    capturedAt: timestamp(payload.capturedAt),
    message: null,
    presentation: "sources",
    sections: [],
    sources,
    status: "ok",
    title: text(reference.label, 160) ?? "Sources",
  };
}

function portfolioCard(reference: ChatArtifactReference, payload: Record<string, unknown>): MobileFinanceArtifactCard | null {
  const portfolio = record(payload.portfolio);
  if (!portfolio) return null;
  const overviewRows: MobileFinanceArtifactRow[] = [];
  for (const [key, value] of [
    ["Base currency", portfolio.baseCurrency],
    ["Source", portfolio.source],
    ["Position mode", portfolio.positionMode],
  ] as const) {
    const visible = scalarText(value);
    if (visible) overviewRows.push({ label: key, value: visible });
  }
  const sections: MobileFinanceArtifactSection[] = overviewRows.length
    ? [{ title: "Overview", rows: overviewRows }]
    : [];
  const positionFields = ["assetType", "symbol", "displaySymbol", "amount", "currency", "exchange", "comment", "source", "derivedFromTransactions"] as const;
  const transactionFields = ["type", "assetType", "symbol", "displaySymbol", "quantity", "price", "currency", "fees", "occurredAt", "comment"] as const;
  const appendItems = (value: unknown, fallback: string, fields: readonly string[]) => {
    if (!Array.isArray(value)) return;
    value.slice(0, MAX_SECTIONS - sections.length).forEach((item, index) => {
      const entry = record(item);
      if (!entry) return;
      const rows = fields.flatMap((field) => {
        const visible = scalarText(entry[field]);
        return visible ? [{ label: mobileFinanceFieldLabel(field), value: visible }] : [];
      }).slice(0, MAX_ROWS_PER_SECTION);
      if (rows.length) sections.push({ title: objectTitle(entry, `${fallback} ${index + 1}`), rows });
    });
  };
  appendItems(portfolio.positions, "Position", positionFields);
  appendItems(portfolio.transactions, "Transaction", transactionFields);
  if (!sections.length) return null;
  return {
    capturedAt: timestamp(payload.capturedAt),
    message: null,
    presentation: "portfolio",
    sections,
    sources: [],
    status: "ok",
    title: text(portfolio.name, 160) ?? text(reference.label, 160) ?? "Portfolio",
  };
}

export function mobileFinanceArtifactTimestamp(value: string | null, locale: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toLocaleString(locale) : null;
}

export function mobileFinanceCitationDate(value: string | null, locale: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime())
    ? date.toLocaleDateString(locale, { year: "numeric", month: "short", day: "numeric" })
    : null;
}

// Every numbered reference the message's Fin Hermes cards carry. A number is
// taken once, from the first card that has it.
export function mobileFinanceCitations(
  references: readonly ChatArtifactReference[] | null | undefined,
): MobileFinanceCitation[] {
  const byNumber = new Map<number, MobileFinanceCitation>();
  for (const reference of references ?? []) {
    for (const citation of mobileFinanceArtifactCard(reference)?.citations ?? []) {
      if (!byNumber.has(citation.number)) byNumber.set(citation.number, citation);
    }
  }
  return [...byNumber.values()];
}

export function mobileFinanceArtifactCard(reference: ChatArtifactReference): MobileFinanceArtifactCard | null {
  if (reference.source !== "finhermes" || reference.sensitivity === "broker_context") return null;
  const presentation = record(reference.artifactPresentation);
  if (
    !presentation ||
    presentation.type !== "finhermes_artifact_payload" ||
    presentation.version !== 1 ||
    presentation.kind !== reference.kind ||
    presentation.payloadVersion !== reference.version
  ) return null;
  const payload = record(presentation.payload);
  if (!payload) return null;
  if (reference.kind === "source_bundle" && reference.version === 3) {
    return capChatContextCard(reference, payload);
  }
  if (reference.kind === "source_bundle" && reference.version === 2) {
    return sourceBundleCard(reference, payload);
  }
  if (reference.kind === "source_bundle" && reference.version === 1) {
    return sourceBundleV1Card(reference, payload);
  }
  if (reference.kind === "research_result" && reference.version === 1) {
    return researchCard(reference, payload);
  }
  if (reference.kind === "portfolio_snapshot" && reference.version === 1) {
    return portfolioCard(reference, payload);
  }
  return null;
}

export function hasMobileFinanceArtifact(reference: ChatArtifactReference): boolean {
  return mobileFinanceArtifactCard(reference) !== null;
}

export function uniqueMobileFinanceArtifactReferences(
  references: readonly ChatArtifactReference[] | undefined,
): ChatArtifactReference[] {
  const unique = new Map<string, ChatArtifactReference>();
  for (const reference of references ?? []) {
    if (reference.source === "finhermes") {
      unique.set(`${reference.id}:${reference.version}`, reference);
    }
  }
  return [...unique.values()];
}
