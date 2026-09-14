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

export type MobileFinanceArtifactCard = {
  capturedAt: string | null;
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

function safeUrl(value: unknown): string | null {
  const candidate = text(value, 2_048);
  if (!candidate) return null;
  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== "https:") return null;
    parsed.username = "";
    parsed.password = "";
    parsed.search = "";
    parsed.hash = "";
    return parsed.toString();
  } catch {
    return null;
  }
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

function sourcesFrom(value: unknown): MobileFinanceArtifactSource[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 12).flatMap((item) => {
    const source = record(item);
    const label = text(source?.label, 160);
    if (!source || !label) return [];
    return [{
      label,
      detail: text(source.detail, 300),
      url: safeUrl(source.url),
      warnings: Array.isArray(source.warnings)
        ? source.warnings.flatMap((warning) => text(warning, 240) ? [text(warning, 240)!] : []).slice(0, 4)
        : [],
    }];
  });
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
