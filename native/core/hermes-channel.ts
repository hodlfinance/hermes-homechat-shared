import {
  isUserVisibleHomechatEvent,
  legacyHomechatRunEvent,
  normalizeHomechatRunEvent,
  parseHomechatEventStream,
  type SharedHomechatCanonicalEvent,
  type SharedHomechatCanonicalEventType,
} from "@hodlfinance/hermes-homechat-shared/core";
import type { ChatRunEvent } from "./types";
import type { ConnectionSetupIntent } from "./connection-setup";

export type HermesJsonValue =
  | string
  | number
  | boolean
  | null
  | HermesJsonValue[]
  | { [key: string]: HermesJsonValue };

export type HermesSurface = "hey_hermes" | "finhermes";

export type HermesChannelId =
  | "hey_hermes_web"
  | "hey_hermes_mobile"
  | "finhermes_web"
  | "finhermes_mobile"
  | "capchat_app"
  | "telegram"
  | "whatsapp"
  | (string & {});

export type HermesProviderState = "connected" | "missing" | "expired" | "suspended";

export type HermesRuntimeState = "ready" | "provisioning" | "missing" | "unhealthy" | "disabled";

export type HermesFinanceContextState = "available" | "unlinked" | "denied";

export type HermesFinanceActivationState = "not_enabled" | "enabled" | "suspended";

export type HermesConversationSensitivity = "general" | "finance_context" | "broker_context";

export type SharedHermesHistoryKind = "conversation" | "job";

export type HermesPrincipal = {
  localUserId: string;
  hermesAccountId: string;
  hermesInstanceId: string;
  runtimeId: string | null;
  surface: HermesSurface;
  providerState: HermesProviderState;
  runtimeState: HermesRuntimeState;
  financeActivationState?: HermesFinanceActivationState;
  financeContextState?: HermesFinanceContextState;
};

export type HermesFinanceChannelActivation = {
  accountId: string;
  workspaceId: string;
  financeActivationState: HermesFinanceActivationState;
  financeContextState: HermesFinanceContextState;
  activationGeneration: number;
  activatedAt: string | null;
  updatedAt: string;
};

export type SharedHermesPrincipalResponse = {
  source: "hey_hermes";
  principal: HermesPrincipal;
  finance: HermesFinanceChannelActivation;
  workspace: {
    id: string;
    isolation: "container_per_user" | "private_server_runtime";
    runtimeApiUrl: string | null;
    runtimeAccess: "enabled" | "suspended";
  };
};

export type SharedHermesHistoryEntry = {
  conversationId: string;
  kind: SharedHermesHistoryKind;
  title: string;
  surfaceOrigin: HermesSurface;
  channel: HermesChannelId;
  allowedSurfaces: HermesSurface[];
  sensitivity: HermesConversationSensitivity;
  visibleSummary: string;
  updatedAt: string;
};

export type SharedHermesHistoryVisibility = {
  mode: "full" | "summary" | "hidden";
  reason: string;
  visible: boolean;
};

export type HermesToolFamily = "hodl" | "capchat" | "hermes";

export type HermesToolScopeGrant = {
  toolFamilies: HermesToolFamily[];
  dataScopes: string[];
  actionScopes: string[];
};

export type CreateHermesRunRequest = {
  message: string;
  conversationId?: string | null;
  surface?: HermesSurface;
  channel?: HermesChannelId;
  sensitivity?: HermesConversationSensitivity;
  allowedSurfaces?: HermesSurface[];
  contextReferences?: Array<{
    id: string;
    kind: string;
    source?: string | null;
    label?: string | null;
  }>;
  requestedCapabilityFamilies?: string[];
  artifactReferences?: Array<{
    id: string;
    kind: string;
    source: string;
    version: number;
    sensitivity?: HermesConversationSensitivity;
    label?: string | null;
    safeSummary?: string | null;
    href?: string | null;
  }>;
  visibleContext?: HermesJsonValue;
  contextChips?: Array<{
    id: string;
    label: string;
    kind: "asset" | "watchlist" | "portfolio" | "story" | "research" | "manual";
    removable: boolean;
  }>;
  toolScopes?: HermesToolScopeGrant[];
  connectionSetupIntent?: ConnectionSetupIntent;
};

export function sharedHermesHistoryVisibility(input: {
  entry: SharedHermesHistoryEntry;
  targetSurface: HermesSurface;
}): SharedHermesHistoryVisibility {
  const { entry, targetSurface } = input;
  if (!entry.allowedSurfaces.includes(targetSurface)) {
    return {
      mode: "hidden",
      reason: "surface_not_allowed",
      visible: false,
    };
  }
  if (entry.sensitivity === "general" || entry.surfaceOrigin === targetSurface) {
    return {
      mode: "full",
      reason: "surface_allowed_full",
      visible: true,
    };
  }
  return {
    mode: "summary",
    reason: "sensitive_cross_surface",
    visible: true,
  };
}

export type HermesRunState = "queued" | "running" | "waiting" | "completed" | "cancelled" | "failed";

export type ChatLatencySummary = {
  action: "chat.latency.summary";
  schema: "hey.chat.latency.v1";
  clockDomain: "mobile_client" | "api" | "gateway";
  channel: "hey_hermes_mobile";
  outcome?: "success" | "error" | "cancelled";
  route?: "chatgpt_account" | "claude_account" | "included_ai";
  provider?: string; model?: string; reasoningEffort?: "low" | "medium" | "high";
  apiAcceptanceMs?: number; streamOpenMs?: number; firstByteMs?: number;
  firstDeltaMs?: number; firstVisiblePaintMs?: number; completionMs?: number;
  requestPreparationMs?: number; queueWaitMs?: number; runtimePrepareMs?: number;
  runtimeAdapterPrepareMs?: number; runtimeAdapterRestarted?: boolean; runtimeAdapterRestartMs?: number;
  runtimeToFirstCallbackMs?: number; eventPersistPublishMs?: number;
  deltaCount?: number; interDeltaP50Ms?: number; interDeltaP95Ms?: number; maxGapMs?: number;
  gateway_request_to_first_visible_ms?: number; gateway_callback_ms?: number; gateway_completion_ms?: number;
  gateway_delta_count?: number; gateway_inter_delta_p50_ms?: number; gateway_inter_delta_p95_ms?: number; gateway_max_gap_ms?: number;
  provider_first_token?: "UNKNOWN"; provider_first_token_reason?: "upstream_hook_not_exposed";
  editIntervalMs?: 800; bufferThresholdChars?: 24; streamMode?: "edit";
  runtimeRevision?: "3ef6bbd201263d354fd83ec55b3c306ded2eb72a";
};

const latencyKeys = new Set<keyof ChatLatencySummary>([
  "action", "schema", "clockDomain", "channel", "outcome", "route", "provider", "model", "reasoningEffort", "apiAcceptanceMs",
  "streamOpenMs", "firstByteMs", "firstDeltaMs", "firstVisiblePaintMs", "completionMs",
  "requestPreparationMs", "queueWaitMs", "runtimePrepareMs", "runtimeAdapterPrepareMs", "runtimeAdapterRestarted",
  "runtimeAdapterRestartMs", "runtimeToFirstCallbackMs", "eventPersistPublishMs", "deltaCount",
  "interDeltaP50Ms", "interDeltaP95Ms", "maxGapMs", "provider_first_token", "provider_first_token_reason",
  "gateway_request_to_first_visible_ms", "gateway_callback_ms", "gateway_completion_ms", "gateway_delta_count",
  "gateway_inter_delta_p50_ms", "gateway_inter_delta_p95_ms", "gateway_max_gap_ms",
  "editIntervalMs", "bufferThresholdChars", "streamMode", "runtimeRevision",
]);

const latencyIdentifierPattern = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,79}(?:\/[a-zA-Z0-9][a-zA-Z0-9._-]{0,79})?$/;

function isSafeLatencyIdentifier(value: unknown) {
  return typeof value === "string" &&
    latencyIdentifierPattern.test(value) &&
    !value.includes("://") &&
    !/[\s?#&=:]/.test(value);
}

export function normalizeChatLatencySummary(input: unknown): ChatLatencySummary | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const source = input as Record<string, unknown>;
  if (Object.keys(source).some((key) => !latencyKeys.has(key as keyof ChatLatencySummary))) return null;
  if (source.action !== "chat.latency.summary" || source.schema !== "hey.chat.latency.v1" ||
      !["mobile_client", "api", "gateway"].includes(String(source.clockDomain)) || source.channel !== "hey_hermes_mobile") return null;
  if (source.outcome !== undefined && !["success", "error", "cancelled"].includes(String(source.outcome))) return null;
  if (source.route !== undefined && !["chatgpt_account", "claude_account", "included_ai"].includes(String(source.route))) return null;
  if (source.provider !== undefined && !isSafeLatencyIdentifier(source.provider)) return null;
  if (source.model !== undefined && !isSafeLatencyIdentifier(source.model)) return null;
  if (source.reasoningEffort !== undefined && !["low", "medium", "high"].includes(String(source.reasoningEffort))) return null;
  const fixedStrings = {
    provider_first_token: "UNKNOWN", provider_first_token_reason: "upstream_hook_not_exposed", streamMode: "edit",
    runtimeRevision: "3ef6bbd201263d354fd83ec55b3c306ded2eb72a",
  } as const;
  for (const [key, value] of Object.entries(fixedStrings)) if (source[key] !== undefined && source[key] !== value) return null;
  for (const [key, value] of Object.entries(source)) {
    if ((key.endsWith("Ms") || key.endsWith("_ms")) && (typeof value !== "number" || !Number.isFinite(value) || value < 0)) return null;
  }
  for (const key of ["deltaCount", "gateway_delta_count"] as const) {
    if (source[key] !== undefined && (!Number.isSafeInteger(source[key]) || (source[key] as number) < 0)) return null;
  }
  const adapterTimingFields = [
    source.runtimeAdapterPrepareMs,
    source.runtimeAdapterRestarted,
    source.runtimeAdapterRestartMs,
  ];
  if (adapterTimingFields.some((value) => value !== undefined)) {
    if (source.clockDomain !== "api") return null;
    if (adapterTimingFields.some((value) => value === undefined)) return null;
    if (typeof source.runtimeAdapterRestarted !== "boolean") return null;
    if (source.runtimeAdapterRestarted === false && source.runtimeAdapterRestartMs !== 0) return null;
    if ((source.runtimeAdapterRestartMs as number) > (source.runtimeAdapterPrepareMs as number)) return null;
  }
  if (source.editIntervalMs !== undefined && source.editIntervalMs !== 800) return null;
  if (source.bufferThresholdChars !== undefined && source.bufferThresholdChars !== 24) return null;
  return { ...source } as ChatLatencySummary;
}

export function isCompleteMobileChatLatencySummary(summary: ChatLatencySummary) {
  if (summary.clockDomain !== "mobile_client" || !summary.outcome) return false;
  const required = summary.outcome === "success"
    ? [summary.apiAcceptanceMs, summary.streamOpenMs, summary.firstVisiblePaintMs, summary.completionMs, summary.deltaCount,
        summary.interDeltaP50Ms, summary.interDeltaP95Ms, summary.maxGapMs]
    : [summary.completionMs];
  if (required.some((value) => typeof value !== "number" || !Number.isFinite(value) || value < 0)) return false;
  if ((summary.deltaCount ?? 0) > 0) {
    return [summary.firstByteMs, summary.firstDeltaMs, summary.firstVisiblePaintMs]
      .every((value) => typeof value === "number" && Number.isFinite(value) && value >= 0);
  }
  return true;
}

export type HermesRunEventType = SharedHomechatCanonicalEventType;
export type CanonicalHermesRunEvent = SharedHomechatCanonicalEvent;

export type HermesSseParseResult = {
  cursor: string | null;
  events: CanonicalHermesRunEvent[];
  ignored: number;
};

export function normalizeHermesSurface(value: unknown): HermesSurface {
  if (value === "hey_hermes" || value === "finhermes") return value;
  throw new Error("Invalid Hermes surface: expected hey_hermes or finhermes.");
}

export function normalizeHermesRunEvent(input: unknown): CanonicalHermesRunEvent | null {
  return normalizeHomechatRunEvent(input);
}

export function parseHermesEventStream(text: string): HermesSseParseResult {
  const parsed = parseHomechatEventStream(text);
  return {
    cursor: parsed.cursor,
    events: parsed.events.map((event) => normalizeHermesRunEvent(event)).filter((event): event is CanonicalHermesRunEvent => Boolean(event)),
    ignored: parsed.ignored,
  };
}

export function isUserVisibleHermesChannelEvent(event: Pick<CanonicalHermesRunEvent, "type">): boolean {
  return isUserVisibleHomechatEvent(event);
}

export function chatRunEventFromHermesEvent(input: unknown): ChatRunEvent | null {
  return legacyHomechatRunEvent(input) as ChatRunEvent | null;
}
