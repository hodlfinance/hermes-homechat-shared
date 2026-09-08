export { statusPanelCopy } from "./status-panel-copy";
import type {
  AdminHandoverStatus,
  AiProviderId,
  AiProviderState,
  AlphaAccountRole,
  AlphaAccountStatus,
  BillingProvider,
  ChatRoutePreference,
  CloudInfrastructureEventSeverity,
  EntitlementStatus,
  ModelOptionItem,
  ModelRoutingMode,
  ModelSlotId,
  PlanTier,
  RuntimeReadinessState,
  StandingAccessStatus,
  WorkspaceCapabilityDefaultState,
  WorkspaceHostingMode,
  WorkspaceRuntimeAccess,
} from "./types";
import { modelSlotIds } from "./types";
import type { HermesRuntimeState } from "./hermes-channel";

export const workspaceStatusTruthSchemaVersion = "heyhermes.workspace-status-truth/v1" as const;

export type StatusTruthAvailability = "available" | "unavailable" | "unknown";

export interface WorkspaceStatusTruthView {
  schemaVersion: typeof workspaceStatusTruthSchemaVersion;
  generatedAt: string;
  account: {
    availability: StatusTruthAvailability;
    observedAt: string;
    id: string | null;
    name: string | null;
    email: string | null;
    role: AlphaAccountRole | null;
    status: AlphaAccountStatus | null;
    createdAt: string | null;
    lastLoginAt: string | null;
  };
  plan: {
    availability: StatusTruthAvailability;
    observedAt: string | null;
    status: EntitlementStatus | null;
    plan: PlanTier | null;
    usagePoolPlan: Exclude<PlanTier, "trial"> | null;
    comped: boolean | null;
    provider: BillingProvider | null;
    trialEndsAt: string | null;
    renewsAt: string | null;
    gracePeriodEndsAt: string | null;
    cancelledAt: string | null;
    expiresAt: string | null;
  };
  aiAccess: {
    availability: StatusTruthAvailability;
    /** Independent Included-AI contract truth; absent only on an older server. */
    includedAvailability?: StatusTruthAvailability;
    observedAt: string;
    selectedRoute: ChatRoutePreference | null;
    activeProviderId: AiProviderId | null;
    routingMode: ModelRoutingMode | null;
    selectedModelId: ModelSlotId | null;
    selectedModelName: string | null;
    managedModelName: string | null;
    modelChoices: ModelOptionItem[];
    remainingIncludedPercent: number | null;
    cycleResetAt: string | null;
    providers: Array<{
      id: AiProviderId;
      state: AiProviderState;
      configured: boolean;
      live: boolean;
      status: string;
    }>;
  };
  server: {
    availability: StatusTruthAvailability;
    observedAt: string | null;
    id: string | null;
    kind: "dedicated_vps" | "workspace_runtime" | "workspace_container" | "unresolved";
    provider: string | null;
    state: HermesRuntimeState;
    readiness: RuntimeReadinessState;
    ready: boolean;
    statusLabel: string;
    message: string;
    region: string | null;
    serverType: string | null;
    backupsEnabled: boolean | null;
  };
  security: {
    availability: StatusTruthAvailability;
    observedAt: string | null;
    runtimeAccess: WorkspaceRuntimeAccess | null;
    adminHandoverStatus: AdminHandoverStatus | null;
    standingAccessStatus: StandingAccessStatus | null;
    activeSupportGrantCount: number | null;
    infrastructureStatus: CloudInfrastructureEventSeverity | null;
    latestAuditSealedAt: string | null;
  };
  capabilities: {
    availability: StatusTruthAvailability;
    observedAt: string;
    hostingMode: WorkspaceHostingMode | null;
    runtimeAccess: WorkspaceRuntimeAccess | null;
    items: Array<{
      id: string;
      label: string;
      state: WorkspaceCapabilityDefaultState;
      requiresApproval: boolean;
      limitSummary: string;
    }>;
  };
}

export interface WorkspaceStatusTruthClient {
  baseUrl: string;
  token: string;
  fetchImpl?: typeof fetch;
}

// The server spends up to 25 seconds proving the provider routes on a cold
// cache, and a real dedicated-host probe takes about twelve. A ten-second
// client budget aborted every cold refresh, so AI Access kept spinning on
// stale state. Stay clear of the server's own budget instead.
export const workspaceStatusTruthRequestTimeoutMs = 35_000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNullableString(value: unknown): value is string | null {
  return typeof value === "string" || value === null;
}

function isNullableBoolean(value: unknown): value is boolean | null {
  return typeof value === "boolean" || value === null;
}

function isOneOf<T extends string>(value: unknown, choices: readonly T[]): value is T {
  return typeof value === "string" && choices.includes(value as T);
}

const availabilities = ["available", "unavailable", "unknown"] as const;
const accountRoles = ["owner", "member"] as const;
const accountStatuses = ["active", "disabled"] as const;
const entitlementStatuses = ["none", "trialing", "active", "grace_period", "cancelled", "expired"] as const;
const planTiers = ["trial", "personal", "plus", "business"] as const;
const billingProviders = ["app_store", "google_play", "revenuecat", "manual"] as const;
const chatRoutePreferences = ["included_ai", "chatgpt_account", "claude_account"] as const;
const aiProviderIds = ["chatgpt_account", "claude_account", "openrouter_managed", "openrouter_byok", "direct_provider"] as const;
const aiProviderStates = ["active", "ready", "setup_required", "blocked", "coming_soon"] as const;
const modelRoutingModes = ["managed", "byok", "chatgpt_account", "claude_account"] as const;
const runtimeStates = ["ready", "provisioning", "missing", "unhealthy", "disabled"] as const;
const readinessStates = ["ready", "setting_up", "paused", "needs_attention"] as const;
const runtimeAccessStates = ["enabled", "suspended"] as const;
const adminHandoverStatuses = ["not_started", "pending", "passed", "failed", "waived"] as const;
const standingAccessStatuses = ["unknown", "none_detected", "detected", "not_checked"] as const;
const infrastructureSeverities = ["green", "yellow", "red"] as const;
const hostingModes = ["shared_pool", "dedicated_vps"] as const;
const capabilityStates = ["enabled", "approval_required", "disabled"] as const;
const serverKinds = ["dedicated_vps", "workspace_runtime", "workspace_container", "unresolved"] as const;
const curatedModelTechnicalStatuses = ["available", "evidence_incomplete", "unavailable"] as const;

function isModelFactValue(value: unknown): value is number | "UNKNOWN" {
  return value === "UNKNOWN" || (typeof value === "number" && Number.isFinite(value) && value >= 0);
}

function isRelativeRank(value: unknown): boolean {
  if (!isRecord(value) || !isModelFactValue(value.rank)) return false;
  const comparedModels = value.comparedModels;
  if (typeof comparedModels !== "number" || !Number.isInteger(comparedModels) || comparedModels < 0) return false;
  return value.rank === "UNKNOWN" || (Number.isInteger(value.rank) && value.rank > 0 && value.rank <= comparedModels);
}

function isModelMetric(value: unknown): boolean {
  return isRecord(value)
    && isModelFactValue(value.value)
    && value.sourceName === "Artificial Analysis"
    && typeof value.sourceUrl === "string"
    && typeof value.retrievedAt === "string"
    && isRelativeRank(value.relative);
}

function isModelCost(value: unknown): boolean {
  return isRecord(value)
    && isModelFactValue(value.inputUsdPerMillionTokens)
    && isModelFactValue(value.outputUsdPerMillionTokens)
    && isModelFactValue(value.cachedInputUsdPerMillionTokens)
    && value.sourceName === "OpenRouter"
    && typeof value.sourceUrl === "string"
    && typeof value.retrievedAt === "string"
    && isRelativeRank(value.inputRelative)
    && isRelativeRank(value.outputRelative);
}

function isModelOption(value: unknown): value is ModelOptionItem {
  if (!isRecord(value)) return false;
  return isOneOf(value.id, modelSlotIds)
    && isOneOf(value.slot, modelSlotIds)
    && isOneOf(value.class, modelSlotIds)
    && ["publicClass", "label", "modelName", "description", "usageLabel"].every((key) => typeof value[key] === "string")
    && typeof value.usesUsageFaster === "boolean"
    && typeof value.providerModelId === "string"
    && typeof value.canonicalProviderModelId === "string"
    && isOneOf(value.technicalStatus, curatedModelTechnicalStatuses)
    && ["offered", "selectable", "recommended", "default"].every((key) => typeof value[key] === "boolean")
    && (value.blocker === null || typeof value.blocker === "string")
    && value.technicalStatus === "available"
    && value.offered === true
    && value.selectable === true
    && (value.defaultComparison === undefined || (isRecord(value.defaultComparison)
      && isModelFactValue(value.defaultComparison.intelligencePercent)
      && isModelFactValue(value.defaultComparison.speedPercent)
      && isModelFactValue(value.defaultComparison.estimatedPriceFactor)
      && typeof value.defaultComparison.intelligenceEstimated === "boolean"
      && typeof value.defaultComparison.referenceModelId === "string"
      && typeof value.defaultComparison.retrievedAt === "string"))
    && isModelMetric(value.speed)
    && isModelMetric(value.quality)
    && isModelCost(value.cost);
}

function isModelChoices(value: unknown): value is ModelOptionItem[] {
  if (!Array.isArray(value) || !value.every(isModelOption)) return false;
  if (value.length === 0) return true;
  const recommended = value.filter((model) => model.recommended);
  const defaults = value.filter((model) => model.default);
  return recommended.length === 1
    && defaults.length === 1
    && recommended[0]!.id === defaults[0]!.id;
}

function isWorkspaceStatusTruthView(value: unknown): value is WorkspaceStatusTruthView {
  if (!isRecord(value) || value.schemaVersion !== workspaceStatusTruthSchemaVersion || typeof value.generatedAt !== "string") return false;
  const { account, plan, aiAccess, server, security, capabilities } = value;
  if (!isRecord(account) || !isRecord(plan) || !isRecord(aiAccess) || !isRecord(server) || !isRecord(security) || !isRecord(capabilities)) return false;

  const accountValid = isOneOf(account.availability, availabilities)
    && typeof account.observedAt === "string"
    && ["id", "name", "email", "createdAt", "lastLoginAt"].every((key) => isNullableString(account[key]))
    && (account.role === null || isOneOf(account.role, accountRoles))
    && (account.status === null || isOneOf(account.status, accountStatuses));
  const planValid = isOneOf(plan.availability, availabilities)
    && ["observedAt", "trialEndsAt", "renewsAt", "gracePeriodEndsAt", "cancelledAt", "expiresAt"].every((key) => isNullableString(plan[key]))
    && (plan.status === null || isOneOf(plan.status, entitlementStatuses))
    && (plan.plan === null || isOneOf(plan.plan, planTiers))
    && (plan.usagePoolPlan === null || isOneOf(plan.usagePoolPlan, ["personal", "plus", "business"] as const))
    && isNullableBoolean(plan.comped)
    && (plan.provider === null || isOneOf(plan.provider, billingProviders));
  const aiAccessValid = isOneOf(aiAccess.availability, availabilities)
    && (aiAccess.includedAvailability === undefined || isOneOf(aiAccess.includedAvailability, availabilities))
    && typeof aiAccess.observedAt === "string"
    && (aiAccess.selectedRoute === null || isOneOf(aiAccess.selectedRoute, chatRoutePreferences))
    && (aiAccess.activeProviderId === null || isOneOf(aiAccess.activeProviderId, aiProviderIds))
    && (aiAccess.routingMode === null || isOneOf(aiAccess.routingMode, modelRoutingModes))
    && (aiAccess.selectedModelId === null || isOneOf(aiAccess.selectedModelId, modelSlotIds))
    && ["selectedModelName", "managedModelName", "cycleResetAt"].every((key) => isNullableString(aiAccess[key]))
    && (aiAccess.remainingIncludedPercent === null || typeof aiAccess.remainingIncludedPercent === "number")
    && isModelChoices(aiAccess.modelChoices)
    && Array.isArray(aiAccess.providers) && aiAccess.providers.every((provider) => isRecord(provider)
      && isOneOf(provider.id, aiProviderIds)
      && isOneOf(provider.state, aiProviderStates)
      && typeof provider.configured === "boolean"
      && typeof provider.live === "boolean"
      && typeof provider.status === "string");
  const serverValid = isOneOf(server.availability, availabilities)
    && isNullableString(server.observedAt)
    && isNullableString(server.id)
    && isOneOf(server.kind, serverKinds)
    && isNullableString(server.provider)
    && isOneOf(server.state, runtimeStates)
    && isOneOf(server.readiness, readinessStates)
    && typeof server.ready === "boolean"
    && typeof server.statusLabel === "string"
    && typeof server.message === "string"
    && ["region", "serverType"].every((key) => isNullableString(server[key]))
    && isNullableBoolean(server.backupsEnabled);
  const securityValid = isOneOf(security.availability, availabilities)
    && isNullableString(security.observedAt)
    && (security.runtimeAccess === null || isOneOf(security.runtimeAccess, runtimeAccessStates))
    && (security.adminHandoverStatus === null || isOneOf(security.adminHandoverStatus, adminHandoverStatuses))
    && (security.standingAccessStatus === null || isOneOf(security.standingAccessStatus, standingAccessStatuses))
    && (security.activeSupportGrantCount === null || typeof security.activeSupportGrantCount === "number")
    && (security.infrastructureStatus === null || isOneOf(security.infrastructureStatus, infrastructureSeverities))
    && isNullableString(security.latestAuditSealedAt);
  const capabilitiesValid = isOneOf(capabilities.availability, availabilities)
    && typeof capabilities.observedAt === "string"
    && (capabilities.hostingMode === null || isOneOf(capabilities.hostingMode, hostingModes))
    && (capabilities.runtimeAccess === null || isOneOf(capabilities.runtimeAccess, runtimeAccessStates))
    && Array.isArray(capabilities.items) && capabilities.items.every((item) => isRecord(item)
      && typeof item.id === "string"
      && typeof item.label === "string"
      && isOneOf(item.state, capabilityStates)
      && typeof item.requiresApproval === "boolean"
      && typeof item.limitSummary === "string");

  return accountValid && planValid && aiAccessValid && serverValid && securityValid && capabilitiesValid;
}

export async function workspaceStatusTruthRequest(
  client: WorkspaceStatusTruthClient,
  // `verify` asks every provider whether it still answers, which is what an
  // explicit status check or a route change needs. Drawing the screen does not.
  options: { signal?: AbortSignal; timeoutMs?: number; verify?: boolean } = {},
): Promise<WorkspaceStatusTruthView> {
  const controller = new AbortController();
  const timeoutMs = options.timeoutMs ?? workspaceStatusTruthRequestTimeoutMs;
  let timedOut = false;
  const abortFromCaller = () => controller.abort(options.signal?.reason);
  if (options.signal?.aborted) abortFromCaller();
  else options.signal?.addEventListener("abort", abortFromCaller, { once: true });
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, Math.max(1, timeoutMs));
  try {
    const response = await (client.fetchImpl ?? fetch)(`${client.baseUrl.replace(/\/$/, "")}/workspace/status-truth${options.verify ? "?verify=1" : ""}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${client.token}`,
      },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error("Current server status could not be loaded.");
    const payload: unknown = await response.json();
    if (!isWorkspaceStatusTruthView(payload)) throw new Error("Current server status returned an unsupported response.");
    return payload;
  } catch (error) {
    if (timedOut) throw new Error("Current server status did not respond in time.");
    throw error;
  } finally {
    clearTimeout(timeout);
    options.signal?.removeEventListener("abort", abortFromCaller);
  }
}

export {
  statusTruthAiAccessChoices,
  workspaceStatusTruthServerIsCurrent,
  workspaceStatusTruthServerRefreshDelayMs,
  workspaceStatusTruthSummary,
} from "./status-truth-view";
export type { WorkspaceStatusTruthSummary } from "./status-truth-view";
