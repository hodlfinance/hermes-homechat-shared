import type { SharedHomechatJsonValue } from "@hodlfinance/hermes-homechat-shared/core";

export const serverStates = [
  "trial_pool",
  "provisioning",
  "migrating",
  "active",
  "degraded",
  "suspended",
  "export_pending",
  "deleted",
] as const;

export type ServerState = (typeof serverStates)[number];
export type PlanTier = "trial" | "personal" | "plus" | "business";
export const workspaceHostingProfileIds = [
  "shared_pool_basic",
  "dedicated_personal",
  "dedicated_plus",
  "dedicated_business",
] as const;
export type WorkspaceHostingProfileId = (typeof workspaceHostingProfileIds)[number];
export const defaultWorkspaceHostingProfileId: WorkspaceHostingProfileId = "shared_pool_basic";
export type WorkspaceHostingMode = "shared_pool" | "dedicated_vps";
export type Region = "eu" | "us";
export type BillingProvider = "app_store" | "google_play" | "revenuecat" | "manual";
export type EntitlementStatus = "none" | "trialing" | "active" | "grace_period" | "cancelled" | "expired";
export const appLocales = ["en", "de", "fr", "es", "it", "pt-BR", "ja", "ko"] as const;
export type AppLocale = (typeof appLocales)[number];
export const defaultAppLocale: AppLocale = "en";

/**
 * The customer's language, named so a model can be told it.
 *
 * In a conversation the model follows the customer's own message. A scheduled
 * run has no message to follow, so it followed whatever it had just read:
 * measured on 2026-08-22, the email scanner reported in English and the ranker
 * two minutes later in German, one under the other in the same chat.
 */
export const appLocaleLanguageNames: Readonly<Record<AppLocale, string>> = Object.freeze({
  en: "English",
  de: "German",
  fr: "French",
  es: "Spanish",
  it: "Italian",
  "pt-BR": "Brazilian Portuguese",
  ja: "Japanese",
  ko: "Korean",
});

export function appLocaleLanguageName(locale: string | null | undefined): string {
  const known = appLocales.find((candidate) => candidate === locale);
  return known ? appLocaleLanguageNames[known] : appLocaleLanguageNames[defaultAppLocale];
}
export type AccountInviteLevel = "personal" | "pro" | "business";
export type AccountInviteBillingMode = "byok" | "included";
export type AccountInviteStatus = "created" | "preparing" | "ready" | "redeemed" | "expired" | "revoked" | "failed";
export type RuntimeReadinessState = "ready" | "setting_up" | "paused" | "needs_attention";
export type RevenueCatWebhookEventStatus = "applied" | "ignored" | "invalid";
export type SubscriptionProviderMode = "fake" | "revenuecat";
export type AgentMailboxProvider = "fake" | "custom_domain";
export type AgentMailboxStatus = "reserved" | "active" | "disabled";
export type AgentMailboxProvisionStatus = "test_reserved" | "ready" | "inactive" | "missing_configuration";
export type AgentMailboxAbilityStatus = "ready" | "record_only" | "disabled" | "missing_configuration";
export type AgentMailboxMessageDirection = "inbound" | "outbound";
export type AgentMailboxMessageStatus = "draft" | "queued" | "skipped" | "sent" | "received" | "failed";
export const integrationKinds = ["telegram", "whatsapp", "email"] as const;
export type IntegrationKind = (typeof integrationKinds)[number];
export type IntegrationState = "not_connected" | "setup_required" | "configured" | "connected" | "attention";
export const connectionProviderIds = [
  "model",
  "byok",
  "chatgpt",
  "agent_mailbox",
  "email",
  "gmail",
  "google_calendar",
  "google_drive",
  "google_workspace",
  "telegram",
  "whatsapp",
  "slack",
  "stripe",
  "discord",
  "webhook",
] as const;
export type ConnectionProviderId = (typeof connectionProviderIds)[number];
export type ConnectionToolState = IntegrationState | "available" | "requestable";
export type ConnectionSetupRequestStatus = "requested" | "reviewed" | "completed" | "cancelled";
export type ConnectionPromptChoice = "declined" | "connected";

// Authorization codes, PKCE verifiers, client secrets (Web only), and resulting tokens travel
// through the control server without being stored there. Only the customer's machine persists the
// resulting grant; the public iOS flow never invents or carries a client secret.
type GoogleConnectionCredentialBase = {
  clientId: string;
  authorizationCode: string;
  redirectUri: string;
};
export type GoogleConnectionCredentials = GoogleConnectionCredentialBase & (
  | { clientKind?: "confidential_web"; clientSecret: string; codeVerifier?: never }
  | { clientKind: "public_ios"; clientSecret?: never; codeVerifier: string }
);
// What the machine reports back once the exchange succeeded. The connected account is the address
// the customer consented with, which is not a secret; the scopes are the ones Google granted.
export type GoogleConnectionResult = {
  connectedAccount: string;
  scopes: string[];
};
export type GoogleConnectionStatus = {
  connected: boolean;
  connectedAccount: string | null;
  scopes: string[];
  updatedAt: string | null;
};
export const gmailConnectionStates = [
  "not_configured",
  "runtime_unreachable",
  "not_connected",
  "connected",
  "needs_attention",
  "provider_unreachable",
] as const;
export type GmailConnectionState = (typeof gmailConnectionStates)[number];
export type GmailOAuthBrowserConfig = {
  available: boolean;
  clientId: string | null;
  origin: string | null;
  scopes: string[];
};
export type GmailConnectionCompleteRequest = {
  authorizationCode: string;
};
export type GmailMobileOAuthStartRequest = {
  codeChallenge: string;
};
export type GmailMobileOAuthStart = {
  authorizationUrl: string;
  redirectUri: string;
  state: string;
  expiresAt: string;
};
export type GmailMobileOAuthCompleteRequest = {
  authorizationCode: string;
  codeVerifier: string;
  state: string;
};
export type GmailWorkspaceConnectionStatus = {
  state: Exclude<GmailConnectionState, "not_configured" | "runtime_unreachable">;
  localCredentialPresent: boolean;
  providerReachable: boolean | null;
  permissionComplete: boolean;
  composeCapable: boolean;
  sendRequiresConfirmation: boolean;
  scopes: string[];
  updatedAt: string | null;
  checkedAt: string;
  detail: string;
};
export type GmailConnectionStatus = Omit<
  GmailWorkspaceConnectionStatus,
  "state" | "localCredentialPresent" | "permissionComplete" | "composeCapable" | "sendRequiresConfirmation"
> & {
  state: GmailConnectionState;
  oauthConfigured: boolean;
  runtimeReachable: boolean;
  localCredentialPresent: boolean | null;
  permissionComplete: boolean | null;
  composeCapable: boolean | null;
  sendRequiresConfirmation: boolean | null;
};
export type GmailDisconnectResult = {
  disconnected: true;
  localCredentialRemoved: boolean;
  providerGrantRevoked: false;
  status: GmailConnectionStatus;
};
export type GmailWorkspaceDisconnectResult = Omit<GmailDisconnectResult, "status"> & {
  status: GmailWorkspaceConnectionStatus;
};
export type ConnectionReachId = "gmail" | "google_calendar" | "google_drive" | "telegram";
export interface ConnectionReachItem {
  id: ConnectionReachId;
  reached: boolean;
  reachedAt: string | null;
  evidenceRef: string | null;
  lastRead: string | null;
  reason: string | null;
}
export interface ConnectionReachView {
  workspaceId: string;
  checkedAt: string;
  items: ConnectionReachItem[];
}
export type IntegrationSecretKey =
  | "telegram_bot_token"
  | "whatsapp_access_token"
  | "whatsapp_phone_number_id"
  | "whatsapp_pairing_placeholder"
  | "email_smtp_url"
  | "email_imap_url"
  | "email_from_address";
export type WhatsAppPairingStatus = "not_started" | "pairing_requested" | "paired_placeholder";
export type AiMode = "managed" | "byok";
export type ChatRoutePreference = "included_ai" | "chatgpt_account" | "claude_account";

/**
 * The routes the product offers today.
 *
 * The plane still accepts all three and the OAuth sign-in flow still works; this
 * is what a customer is shown. Both OAuth routes are held back for the mobile
 * MVP, and holding them back closes two defects rather than papering over them:
 * a scheduled automation can only be stranded by a provider change, and the
 * "reconnect ChatGPT" prompt can only appear where ChatGPT can be connected.
 * The runtime has no tool that changes the route, so nothing reaches around this
 * through the chat -- `connections/request-setup` only asks the customer to do
 * it on a screen that no longer offers it.
 *
 * A workspace already standing on a withheld route keeps seeing it, so nobody is
 * left looking at a screen with nothing selected. It disappears once they move
 * to the included route, and there is no way back to it.
 */
export const heyOfferedChatRoutes: readonly ChatRoutePreference[] = Object.freeze(["included_ai"]);

export function heyChatRouteChoices(selected: ChatRoutePreference): readonly ChatRoutePreference[] {
  return heyOfferedChatRoutes.includes(selected)
    ? heyOfferedChatRoutes
    : [...heyOfferedChatRoutes, selected];
}

// Model slots are user-facing choices backed by configurable concrete OpenRouter models.
// Users pick the slot, so a later slot config update moves them to the new concrete model.
export const modelSlotIds = ["value", "fast", "cheap", "gpt", "claude", "gemini", "grok", "qwen", "glm", "minimax", "grok_included", "sonnet", "kimi", "opus", "astra"] as const;
export type ModelClass = (typeof modelSlotIds)[number];
export type ModelSlotId = ModelClass;
export type ModelRoutingMode = "managed" | "byok" | "chatgpt_account" | "claude_account";
export type ReasoningEffort = "low" | "medium" | "high";

export interface ModelDescriptor {
  id: ModelSlotId; // slot id, e.g. "fast"; stable even when providerModel changes
  class: ModelClass;
  slot: ModelSlotId;
  providerModel: string; // concrete OpenRouter slug (internal only)
  inputCentsPerMTok: number;
  outputCentsPerMTok: number;
  label: string; // friendly slot label
  modelName: string; // concrete model name shown in the picker
  defaultReasoningEffort: ReasoningEffort;
  contextWindowTokens?: number;
  maxCompletionTokens?: number | null;
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
}

export interface ModelCallResult {
  answer: string;
  usage: TokenUsage;
  costCents: number; // 0 for BYOK
  model: string; // gateway-internal id used
}

export interface ModelAccessPolicy {
  allowedClasses: ModelClass[];
  premiumMetered: boolean; // legacy name: true means all paid slots draw from the one usage pool
  routingMode: ModelRoutingMode;
}

export const modelFactUnknown = "UNKNOWN" as const;
export type ModelFactUnknown = typeof modelFactUnknown;
export type ModelFactValue = number | ModelFactUnknown;
export type CuratedModelTechnicalStatus = "available" | "evidence_incomplete" | "unavailable";

export interface ModelRelativeRankTruth {
  rank: ModelFactValue;
  comparedModels: number;
}

export interface ModelMetricTruth {
  value: ModelFactValue;
  sourceName: "Artificial Analysis";
  sourceUrl: string;
  retrievedAt: string;
  relative: ModelRelativeRankTruth;
}

export interface ModelCostTruth {
  inputUsdPerMillionTokens: ModelFactValue;
  outputUsdPerMillionTokens: ModelFactValue;
  cachedInputUsdPerMillionTokens: ModelFactValue;
  sourceName: "OpenRouter";
  sourceUrl: string;
  retrievedAt: string;
  inputRelative: ModelRelativeRankTruth;
  outputRelative: ModelRelativeRankTruth;
}

export interface ModelDefaultComparison {
  intelligencePercent: ModelFactValue;
  speedPercent: ModelFactValue;
  estimatedPriceFactor: ModelFactValue;
  intelligenceEstimated: boolean;
  referenceModelId: string;
  retrievedAt: string;
}

export interface CuratedModelTruthItem {
  defaultComparison?: ModelDefaultComparison;
  id: ModelSlotId;
  slot: ModelSlotId;
  modelName: string;
  providerModelId: string;
  /**
   * The version behind the route, never a route. Nobody sends this to a
   * provider — the route is `providerModelId`. On 2026-08-15 commit `15844635`
   * put it in `model-gateway.ts` as `providerModel` and left it there for
   * eleven days; Hermes looks a model's vision capability up under exactly the
   * slug it is handed, found nothing under the version name, and held GPT-5.6
   * Luna and Gemini 3.7 Flash for blind. Read it to know which version the
   * curated evidence was taken against; never to address a provider.
   */
  canonicalProviderModelId: string;
  technicalStatus: CuratedModelTechnicalStatus;
  offered: boolean;
  selectable: boolean;
  recommended: boolean;
  default: boolean;
  blocker: string | null;
  /** HPD-447: seconds to a typical answer, latency_p50 + 500 / throughput_p50. */
  answerSeconds?: number | "UNKNOWN";
  speed: ModelMetricTruth;
  quality: ModelMetricTruth;
  cost: ModelCostTruth;
}

// What GET /workspace/model-options returns: the models a workspace may pick + its live budget.
// Selection rows keep their established presentation shape for typed fixture and
// client compatibility. Current API/status-truth responses enrich every row with
// the curated facts, which the runtime status validator verifies fail-closed.
export interface ModelOptionItem extends Partial<CuratedModelTruthItem> {
  class: ModelClass;
  id: ModelSlotId;
  slot: ModelSlotId;
  publicClass: string; // Value / Frontier
  label: string;
  modelName: string;
  description: string;
  usageLabel: string;
  usesUsageFaster: boolean;
}
export interface ModelSpendStatus {
  cycleUsedCents: number;
  cycleCapCents: number;
  dayUsedCents: number;
  dayCeilingCents: number;
  reservedCents: number;
  /** Exact aggregate provider spend. Decimal strings avoid lossy JSON/JS money arithmetic. */
  cycleUsedNanoUsd?: string;
  dayUsedNanoUsd?: string;
  reservedNanoUsd?: string;
  cycleStartedAt?: string | null;
  cycleResetAt?: string | null;
  dayStartedAt?: string | null;
  dayResetAt?: string | null;
}
export interface ModelOptionsView {
  plan: PlanTier;
  aiMode: AiMode;
  routingMode: ModelRoutingMode;
  chatRoutePreference: ChatRoutePreference;
  managedModelName: string;
  allowedClasses: ModelClass[];
  publicClassNames: string[];
  premiumMetered: boolean;
  models: ModelOptionItem[];
  curatedModels: CuratedModelTruthItem[];
  legacySelectedModel?: CuratedModelTruthItem;
  selectedModelId: ModelSlotId;
  selectedSlotId: ModelSlotId;
  defaultSlotId: ModelSlotId;
  managedRoutingLive: boolean;
  daySoftLimitReached: boolean;
  spend: ModelSpendStatus;
}
export interface ModelPreferenceResponse {
  ok: boolean;
  selectedModelId: ModelSlotId;
  selectedSlotId: ModelSlotId;
}

export interface ChatRoutePreferenceRequest {
  preference: ChatRoutePreference;
  reason?: string;
  runId?: string;
}

export interface ChatRoutePreferenceResponse {
  ok: boolean;
  preference: ChatRoutePreference;
  routingMode: ModelRoutingMode;
  activeProviderId: AiProviderId;
  message: string;
  automationsFollowedRoute?: boolean;
}

export interface ClaudeConnectionStatus {
  provider: "claude";
  connected: boolean;
  state: "connected" | "not_connected" | "unavailable";
  message: string;
}

export interface ClaudeConnectionStartResponse {
  provider: "claude";
  sessionId: string;
  authorizationUrl: string;
  expiresInSeconds: number;
  message: string;
}

export interface ClaudeConnectionCompleteResponse extends ClaudeConnectionStatus {
  ok: boolean;
}

export type AiProviderId = "chatgpt_account" | "claude_account" | "openrouter_managed" | "openrouter_byok" | "direct_provider";
export type AiProviderState = "active" | "ready" | "setup_required" | "blocked" | "coming_soon";
export type ProviderCredentialScope = "none" | "server" | "workspace_provider";
export type ProviderCredentialState = "not_required" | "server_configured" | "saved_encrypted" | "missing";

export interface ProviderStatusItem {
  id: AiProviderId;
  label: string;
  description: string;
  state: AiProviderState;
  routingMode: ModelRoutingMode;
  configured: boolean;
  live: boolean;
  credentialScope: ProviderCredentialScope;
  credentialState: ProviderCredentialState;
  supportedModelClasses: ModelClass[];
  secretStorage: string;
  rotationSupported: boolean;
  revocationSupported: boolean;
  plainLanguageStatus: string;
  notes: string[];
}

export interface ProviderCredentialRule {
  id: string;
  label: string;
  description: string;
}

export interface ProviderStatusView {
  workspaceId: string;
  activeProviderId: AiProviderId;
  providers: ProviderStatusItem[];
  credentialRules: ProviderCredentialRule[];
}

export type SpendReserveReason = "monthly_cap" | "daily_ceiling";

export interface SpendCounters {
  cycleUsedCents: number;
  cycleCapCents: number;
  dayUsedCents: number;
  dayCeilingCents: number;
  reservedCents: number;
  cycleUsedNanoUsd?: string;
  dayUsedNanoUsd?: string;
  reservedNanoUsd?: string;
  cycleStartedAt?: string | null;
  cycleResetAt?: string | null;
  dayStartedAt?: string | null;
  dayResetAt?: string | null;
}

export type SpendReserveDecision =
  | { ok: true; reservationCents: number }
  | { ok: false; reason: SpendReserveReason; counters: SpendCounters };

/**
 * Geld, das entstanden ist und auf keinem Kundenbudget steht. Drei Sorten, nie addiert:
 * getragen und genau bekannt, geliefert aber nicht abgeschlossen, und unbekannt.
 */
export interface OpenSpendItems {
  companyAbsorbedCents: number;
  unsettledCents: number;
  unsettledCount: number;
  /** Posten ohne einen einzigen Beleg. Ihr Betrag ist unbekannt, nicht null. */
  unsettledWithoutReceipt: number;
  /** Mindestens ein Posten hat ein unvollständiges Manifest: `unsettledCents` ist ein unterer Rand. */
  boundedBelow: boolean;
}
export type AlphaAccountRole = "owner" | "member";
export type AlphaAccountStatus = "active" | "disabled";
export type WorkspaceIsolation = "container_per_user" | "private_server_runtime";
export type AuditActorType = "account" | "system" | "repair" | "support";
export type ProvisioningProvider = "hetzner";
export type WorkspaceRuntimeStatus = "not_requested" | "planned" | "provisioning" | "active" | "failed";
export type ProvisioningJobStatus = "queued" | "running" | "completed" | "failed";
export type WorkspaceAccessState = "active" | "grace_period" | "cancelled";
export type WorkspaceRuntimeAccess = "enabled" | "suspended";
export interface WorkspaceResourceBudgets {
  memoryMb: number;
  diskMb: number;
  runtimeSeconds: number;
  backgroundServices: number;
  internalPreviewPorts: number;
  publicPorts: number;
}

export interface WorkspaceHostingProfile {
  id: WorkspaceHostingProfileId;
  mode: WorkspaceHostingMode;
  label: string;
  description: string;
  limitSummary: string;
  plan: PlanTier;
  serverType: string;
  resourceBudgets: WorkspaceResourceBudgets;
  notes: string[];
}

export interface WorkspaceHostingStatus extends WorkspaceHostingProfile {
  runtimeAccess: WorkspaceRuntimeAccess;
}

export interface WorkspaceHostingProfileAssignment {
  workspaceId: string;
  hostingProfileId: WorkspaceHostingProfileId;
  updatedByAccountId: string | null;
  updatedAt: string;
}

export type WorkspaceHostingMigrationDecision = "ready" | "needs_changes" | "blocked";
export type WorkspaceHostingMigrationCheckStatus = "ok" | "warn" | "block";
export type WorkspaceResourceBudgetKey = keyof WorkspaceResourceBudgets;

export interface WorkspaceHostingMigrationCheck {
  id: string;
  status: WorkspaceHostingMigrationCheckStatus;
  message: string;
}

export interface WorkspaceHostingBudgetChange {
  key: WorkspaceResourceBudgetKey;
  label: string;
  from: number;
  to: number;
  direction: "increase" | "decrease" | "same";
}

export interface WorkspaceHostingCapabilityChange {
  id: string;
  label: string;
  from: WorkspaceCapabilityDefaultState;
  to: WorkspaceCapabilityDefaultState;
}

export type WorkspaceHostingMigrationStageId =
  | "stop_source_runtime"
  | "export_source"
  | "verify_export"
  | "create_target_vps"
  | "restore_on_target"
  | "health_check"
  | "switch_profile"
  | "rollback_plan";

export interface WorkspaceHostingMigrationStage {
  id: WorkspaceHostingMigrationStageId;
  order: number;
  label: string;
  description: string;
  mutating: boolean;
  rollback: string;
}

export interface WorkspaceHostingMigrationSafety {
  isolationChecks: string[];
  backupRestoreChecks: string[];
  destructiveDeletePolicy: string;
}

export interface WorkspaceHostingMigrationEndpoint {
  profileId: WorkspaceHostingProfileId;
  mode: WorkspaceHostingMode;
  label: string;
  plan: PlanTier;
  serverType: string;
  resourceBudgets: WorkspaceResourceBudgets;
}

export interface WorkspaceHostingMigrationRequest {
  targetHostingProfileId: WorkspaceHostingProfileId;
  region?: Region;
  includeGStack?: boolean;
}

export interface WorkspaceHostingMigrationPreview {
  workspaceId: string;
  dryRun: true;
  mutated: false;
  from: WorkspaceHostingMigrationEndpoint;
  to: WorkspaceHostingMigrationEndpoint;
  budgetChanges: WorkspaceHostingBudgetChange[];
  capabilityChanges: WorkspaceHostingCapabilityChange[];
  migrationStages: WorkspaceHostingMigrationStage[];
  safety: WorkspaceHostingMigrationSafety;
  validation: {
    decision: WorkspaceHostingMigrationDecision;
    checks: WorkspaceHostingMigrationCheck[];
  };
  provisionPlan: ProvisionPlan;
  notes: string[];
}

export interface WorkspacePreviewInternalPolicy {
  maxPorts: number;
  available: boolean;
  authenticated: true;
  proxyPathTemplate: string;
  note: string;
}

export interface WorkspacePreviewPublicPolicy {
  maxPublicPorts: number;
  decision: WorkspaceCapabilityDefaultState;
  available: boolean;
  note: string;
}

export interface WorkspacePreviewRoutePlan {
  workspaceId: string;
  live: boolean;
  mutated: false;
  hostingProfileId: WorkspaceHostingProfileId;
  hostingMode: WorkspaceHostingMode;
  internalPreview: WorkspacePreviewInternalPolicy;
  publicPreview: WorkspacePreviewPublicPolicy;
  boundaries: string[];
  notes: string[];
}

export const dedicatedLifecycleStages = ["create", "assign", "health", "suspend", "archive", "destroy"] as const;
export type DedicatedLifecycleStageId = (typeof dedicatedLifecycleStages)[number];

export interface DedicatedLifecycleStage {
  id: DedicatedLifecycleStageId;
  order: number;
  label: string;
  description: string;
  serverStateAfter: ServerState;
  mutating: boolean;
  effects: string[];
}

export interface DedicatedLifecyclePreview {
  workspaceId: string;
  dryRun: true;
  mutated: false;
  canMutate: boolean;
  targetProfile: WorkspaceHostingMigrationEndpoint;
  provisionPlan: ProvisionPlan;
  stages: DedicatedLifecycleStage[];
  validation: {
    decision: WorkspaceHostingMigrationDecision;
    checks: WorkspaceHostingMigrationCheck[];
  };
  notes: string[];
}

export type BackupJobKind = "export" | "archive";
export type BackupJobStatus = "queued" | "running" | "completed" | "failed" | "cancelled";
export type BackupStorageProvider = "local";
export type RestoreJobStatus = BackupJobStatus;
export type RestoreMode = "verify_only" | "restore_to_workspace";
export type WorkspaceBookmarkStatus = "active" | "archived";
export type WorkspaceFileSourceKind = "built_in" | "preset" | "user_override" | "generated" | "empty" | "fallback";
export type WorkspaceFileDisplayContentSource = "workspace_file" | "generated_fallback" | "empty_default";
export type WarmWorkspaceStatus = "prepared" | "claimed";
export type WorkspaceSoulStyle = "hermes_default" | "openclaw_inspired";
export type WorkspaceAgentsStyle = "hermes_default";
export type WorkspaceCapabilityRisk = "low" | "medium" | "high" | "critical";
export type WorkspaceCapabilityDefaultState = "enabled" | "approval_required" | "disabled";
export interface WorkspaceCapabilityProfilePolicy {
  state: WorkspaceCapabilityDefaultState;
  limitSummary: string;
  blockedMessage: string;
}

export type WorkspaceCapabilityPreflightDecision =
  | "allow"
  | "ask_approval"
  | "limit_hit"
  | "unsupported"
  | "blocked";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  preferredLocale: AppLocale;
  aiMode: AiMode;
  createdAt: string;
}

export interface AlphaAccount {
  id: string;
  name: string;
  email: string;
  role: AlphaAccountRole;
  status: AlphaAccountStatus;
  workspaceId: string;
  preferredLocale: AppLocale;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface AuthSession {
  token: string;
  account: AlphaAccount;
  oauth?: {
    resumeUrl: string;
    requestExpiresAt: string;
  };
}

export type HeyNativeAuthProvider = "apple" | "google";
export type HeyNativeAuthSurface = "ios" | "web";

export interface HeyNativeAuthConfig {
  productRealm: "heyhermes.v1";
  providers: Partial<Record<HeyNativeAuthProvider, {
    clientId: string;
    redirectUri?: string;
  }>>;
  surface: HeyNativeAuthSurface;
}

export interface HeyNativeAuthSession extends AuthSession {
  authority: {
    appUserId: string;
    linkedProviders: HeyNativeAuthProvider[];
    productRealm: "heyhermes.v1";
    provider: HeyNativeAuthProvider;
  };
}

export interface AccountInvite {
  id: string;
  status: AccountInviteStatus;
  level: AccountInviteLevel;
  billingMode: AccountInviteBillingMode;
  hostingProfileId: WorkspaceHostingProfileId;
  plan: Exclude<PlanTier, "trial">;
  serverType: string;
  region: Region;
  emailHint: string | null;
  workspaceId: string | null;
  vpsServerId: number | null;
  createdByAccountId: string;
  redeemedByAccountId: string | null;
  initialCapacityBatchKey: string | null;
  initialCapacitySlotIndex: number | null;
  expiresAt: string;
  redeemedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAccountInviteRequest {
  level: AccountInviteLevel;
  billingMode: AccountInviteBillingMode;
  emailHint?: string;
  region?: Region;
  prepareServerNow?: boolean;
  dryRun?: boolean;
}

export interface AccountInvitePrepareJob {
  id: string;
  status: string;
  dryRun: boolean;
  detail: string | null;
  error: string | null;
}

export interface CreateAccountInviteResponse {
  invite: AccountInvite;
  inviteCode: string;
  prepareJob?: AccountInvitePrepareJob;
  canMutate?: boolean;
}

export interface AccountInvitePrepareResponse {
  invite: AccountInvite;
  job: AccountInvitePrepareJob;
  canMutate?: boolean;
}

export interface RedeemAccountInviteRequest {
  inviteCode: string;
  email: string;
  name: string;
  password: string;
  passwordConfirmation: string;
  oauthRequest?: string;
}

export type RedeemedAccountInvite = Pick<
  AccountInvite,
  | "id"
  | "status"
  | "level"
  | "billingMode"
  | "hostingProfileId"
  | "plan"
  | "region"
  | "emailHint"
  | "expiresAt"
  | "redeemedAt"
  | "createdAt"
  | "updatedAt"
>;

export interface RedeemAccountInviteResponse extends AuthSession {
  invite: RedeemedAccountInvite;
}

export interface PasswordResetCodeResponse {
  account: AlphaAccount;
  resetCode: string;
  expiresAt: string;
}

export interface AdminAccountResponse {
  account: AlphaAccount;
  generatedAccessCode?: string;
  assignedWarmWorkspaceId?: string;
  runtimePrepared?: boolean;
  runtimeError?: string;
}

export interface RuntimeSummary {
  mode: "managed_control_plane";
  label: string;
  serverHost: string;
  accountCapacity: number;
  activeAccounts: number;
  loginRequired: boolean;
  notes: string[];
}

export interface WorkspaceAccessSummary {
  state: WorkspaceAccessState;
  runtimeAccess: WorkspaceRuntimeAccess;
  exportAvailable: boolean;
  cancellationRequestedAt: string | null;
  gracePeriodEndsAt: string | null;
  reason: string | null;
  updatedAt: string;
}

export interface WorkspaceSummary {
  id: string;
  accountId: string;
  state: ServerState;
  isolation: WorkspaceIsolation;
  containerName: string;
  networkName: string;
  dataPath: string;
  runtimeApiUrl: string | null;
  createdAt: string;
  lastHealthCheckAt: string | null;
  healthMessage: string;
  access: WorkspaceAccessSummary;
}

export interface AiConnectionSummary {
  mode: "operator_account" | "chatgpt_account";
  label: string;
  description: string;
  configured: boolean;
  state: "ready" | "needs_attention" | "blocked";
}

export type ChatGptConnectionStatus = "pending" | "approved" | "expired" | "error" | "blocked";

export interface ChatGptConnectionStartResponse {
  status: "pending";
  provider: "chatgpt";
  sessionId: string;
  userCode: string;
  verificationUrl: string;
  expiresAt: string;
  pollIntervalSeconds: number;
  message: string;
}

export interface ChatGptConnectionCompleteResponse {
  status: ChatGptConnectionStatus;
  provider: "chatgpt";
  aiConnection: AiConnectionSummary | null;
  message: string;
  error?: string;
  providerReadiness?: "reconnect_required";
  retryable?: boolean;
}

export interface Entitlement {
  accountId: string;
  workspaceId: string;
  status: EntitlementStatus;
  plan: PlanTier;
  usagePoolPlan?: Exclude<PlanTier, "trial"> | null;
  comped?: boolean;
  provider: BillingProvider | null;
  revenueCatCustomerId: string | null;
  revenueCatEntitlementId: string | null;
  trialEndsAt: string | null;
  renewsAt: string | null;
  gracePeriodEndsAt: string | null;
  cancelledAt: string | null;
  expiresAt: string | null;
  storeProductId: string | null;
  updatedAt: string;
}

export interface RevenueCatWebhookEvent {
  id: string;
  revenueCatEventId: string;
  appUserId: string | null;
  accountId: string | null;
  workspaceId: string | null;
  type: string;
  status: RevenueCatWebhookEventStatus;
  environment: string | null;
  store: string | null;
  productId: string | null;
  entitlementId: string | null;
  periodType: string | null;
  purchasedAt: string | null;
  expirationAt: string | null;
  cancellationAt: string | null;
  gracePeriodExpiresAt: string | null;
  receivedAt: string;
  appliedAt: string | null;
  error: string | null;
  payload: Record<string, unknown>;
}

export interface RevenueCatWebhookResponse {
  ok: boolean;
  event: RevenueCatWebhookEvent;
  entitlement: Entitlement | null;
}

export interface PromotionalGrantAccess {
  productId: string;
  expiresAt: string;
}

export interface AccountLifecycleState {
  stage: "active" | "grace_period" | "cancelled" | "expired" | "disabled" | "invited";
  canLogin: boolean;
  runtimeAccess: WorkspaceRuntimeAccess;
  exportAvailable: boolean;
  destructiveDeletionAllowed: false;
  message: string;
  nextAction: string | null;
}

export interface SubscriptionStateView {
  accountId: string;
  workspaceId: string;
  providerMode: SubscriptionProviderMode;
  livePaymentsEnabled: boolean;
  revenueCatWebhookSigningConfigured: boolean;
  fakeAdapterActive: boolean;
  entitlement: Entitlement;
  workspaceAccess: WorkspaceAccessSummary;
  lifecycle: AccountLifecycleState;
  promotionalGrant: PromotionalGrantAccess | null;
  lastWebhookEvent: RevenueCatWebhookEvent | null;
}

export type BillingCheckoutPlan = "personal" | "pro" | "business";

export interface BillingCheckoutRequest {
  plan: BillingCheckoutPlan;
}

export interface BillingCheckoutResponse {
  provider: "revenuecat";
  plan: BillingCheckoutPlan;
  appUserId: string;
  packageId: string | null;
  href: string;
  sandbox: boolean;
  note: string;
}

export interface BillingPlanChangePreviewRequest {
  plan: BillingCheckoutPlan;
  region?: Region;
}

export interface BillingPlanChangePreview {
  currentPlan: BillingCheckoutPlan;
  targetPlan: BillingCheckoutPlan;
  livePurchaseEnabled: boolean;
  checkoutPlan: BillingCheckoutPlan;
  currentMonthlyPriceCents: number;
  targetMonthlyPriceCents: number;
  currentIncludedAiCents: number;
  targetIncludedAiCents: number;
  currentHostingProfileId: WorkspaceHostingProfileId;
  targetHostingProfileId: WorkspaceHostingProfileId;
  targetServerType: string;
  migrationPreview: WorkspaceHostingMigrationPreview;
  notes: string[];
}

export interface UsageSummary {
  includedAiCreditsCents: number;
  usedAiCreditsCents: number;
  chatRunsToday: number;
  chatRunsLimit: number;
  /**
   * Measured workspace disk, or `null` when nothing has measured it yet.
   *
   * HPD-412: this was a number that was always 0, on 81 workspaces, because
   * `storage_mb` was seeded at 0 and raised nowhere. A display that always
   * shows the same thing is worse than none, because it looks like a
   * measurement. `null` is the honest answer when there is no measurement, and
   * clients must show the limit as text rather than a bar at zero.
   */
  storageMb: number | null;
  storageLimitMb: number;
  /** When the workspace's own server last reported its disk use. */
  storageMeasuredAt: string | null;
  status: "healthy" | "approaching_limit" | "paused";
}

export type UsageLedgerStatus = "reserved" | "reconciled" | "released" | "recorded";
export type UsageLedgerSource = "model_gateway" | "chat_run" | "manual_adjustment";

export type TopUpProductId = "extra_usage_10" | "extra_usage_25" | "voice_pack_20";

export interface TopUpProduct {
  id: TopUpProductId;
  label: string;
  priceCents: number;
  includedUsageCents: number;
  description: string;
  livePurchaseEnabled: boolean;
}

export interface TopUpGrant {
  id: string;
  workspaceId: string;
  accountId: string;
  productId: TopUpProductId;
  source: "manual" | "revenuecat" | "stripe";
  status: "active" | "consumed" | "expired" | "revoked";
  originalUsageCents: number;
  remainingUsageCents: number;
  createdAt: string;
  expiresAt: string | null;
  consumedAt: string | null;
  metadata: Record<string, unknown>;
}

export interface TopUpSummary {
  products: TopUpProduct[];
  activeBalanceCents: number;
  grants: TopUpGrant[];
  livePurchaseEnabled: boolean;
  note: string;
}

export interface UsageLedgerEntry {
  id: string;
  workspaceId: string;
  accountId: string | null;
  source: UsageLedgerSource;
  providerId: AiProviderId | null;
  modelId: string | null;
  modelClass: ModelClass | null;
  requestId: string | null;
  runId: string | null;
  reservationId: string | null;
  estimatedInputTokens: number | null;
  estimatedOutputTokens: number | null;
  actualInputTokens: number | null;
  actualOutputTokens: number | null;
  estimatedCostCents: number | null;
  actualCostCents: number | null;
  estimatedCostNanoUsd?: string | null;
  providerActualNanoUsd?: string | null;
  customerDebitNanoUsd?: string | null;
  providerReceiptId?: string | null;
  status: UsageLedgerStatus;
  createdAt: string;
  updatedAt: string;
}

export type UsageLimitDecision = "ok" | "soft_warning" | "hard_stop" | "paused";

export interface UsageLimitStatus {
  workspaceId: string;
  decision: UsageLimitDecision;
  message: string;
  reason: string | null;
  softWarning: boolean;
  hardStop: boolean;
  byokBypass: boolean;
  adminOverride: boolean;
  generatedAt: string;
  chat: {
    usedToday: number;
    limitToday: number;
    remainingToday: number;
  };
  spend: ModelSpendStatus;
}

export interface WorkspaceServer {
  id: string;
  state: ServerState;
  region: Region;
  displayRegion: string;
  serverType: string;
  monthlyInfraEstimateCents: number;
  backupsEnabled: boolean;
  createdAt: string | null;
  lastHealthCheckAt: string | null;
  healthMessage: string;
  appApiUrl: string | null;
}

/**
 * Consumer-safe runtime availability derived by the Control Plane from the
 * canonical workspace assignment. Web and Mobile must use this snapshot field
 * instead of inferring readiness from provider setup or local UI state.
 */
export interface RuntimeReadiness {
  state: RuntimeReadinessState;
  ready: boolean;
  retryable: boolean;
  canChat: boolean;
  canUseVoice: boolean;
  canUseJobs: boolean;
  statusLabel: "Ready" | "Setting up" | "Paused" | "Needs attention";
  message: string;
}

export type ChatRole = "user" | "assistant" | "system";
export type ConversationSessionStatus = "active" | "archived";
export type ConversationSessionRole = "home" | "chat";

export interface ConversationSession {
  id: string;
  workspaceId: string;
  title: string;
  role: ConversationSessionRole;
  status: ConversationSessionStatus;
  surfaceOrigin?: import("./hermes-channel").HermesSurface;
  channelOrigin?: import("./hermes-channel").HermesChannelId;
  sensitivity?: import("./hermes-channel").HermesConversationSensitivity;
  allowedSurfaces?: import("./hermes-channel").HermesSurface[];
  messageCount: number;
  lastMessageAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type ChatArtifactReference = Record<string, SharedHomechatJsonValue> &
  import("./hermes-api").HermesArtifactReference;

export interface ChatMessage {
  artifactReferences?: readonly ChatArtifactReference[];
  id: string;
  runId: string;
  conversationSessionId?: string | null;
  /**
   * Set by a client on the copy of a message it drew before the server had
   * answered, and never sent or stored. A message shown this way does not know
   * yet which conversation it will belong to, so a client that filters by
   * conversation has to let it through until the stored message replaces it.
   */
  optimistic?: boolean;
  role: ChatRole;
  content: string;
  createdAt: string;
}

/**
 * What the customer's own server is called, and how to recognise it.
 *
 * HPD-443, asked for by Justus on 2026-08-24: the sentence "your data sits on
 * your own server" says nothing he can check. The hostname is the machine's own
 * name and it is derived from his workspace — measured on 2026-08-24, the host
 * answers `hostname` with exactly this string.
 *
 * Only facts the control plane already holds appear here. The operating system,
 * the kernel and the interface addresses live on the machine itself and would
 * need the management agent; they are not guessed at here.
 */
/**
 * The machine's own name, derived from the workspace it serves.
 *
 * Measured on 2026-08-24: `hostname` on the workspace host answers
 * "hey-hermes-ws-nr-n6swugl8v" for workspace "ws_NR_n6sWuGl8V". The derivation
 * is the whole binding — there is no stored hostname to read.
 */
export function workspaceServerHostname(workspaceId: string): string {
  return `hey-hermes-${workspaceId.replace(/_/g, "-").toLowerCase()}`;
}

export interface WorkspaceServerIdentity {
  provider?: string | null;
  serverId?: string | null;
  hostname: string;
  workspaceId: string;
  publicIpv4: string | null;
  serverType: string | null;
  location: string | null;
  inServiceSince: string | null;
}

export type BrowserResultCardStatus = "started" | "viewed" | "blocked_for_approval" | "completed" | "failed";

export interface BrowserResultLink {
  label: string;
  href: string;
}

export interface BrowserResultHistoryItem {
  at: string;
  label: string;
  url?: string;
  note?: string;
}

export interface BrowserResultCard {
  id: string;
  workspaceId: string;
  runId: string;
  conversationSessionId?: string | null;
  status: BrowserResultCardStatus;
  title: string;
  summary: string;
  currentUrl?: string | null;
  sourceLinks: BrowserResultLink[];
  history: BrowserResultHistoryItem[];
  screenshotUrl?: string | null;
  approvalId?: string | null;
  savedBookmarkId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBrowserResultCardRequest {
  runId: string;
  status?: BrowserResultCardStatus;
  title: string;
  summary: string;
  currentUrl?: string | null;
  sourceLinks?: BrowserResultLink[];
  history?: BrowserResultHistoryItem[];
  approvalId?: string | null;
}

export interface ChatMessagesPage {
  messages: ChatMessage[];
  eventsByRunId: Record<string, ChatRunEvent[]>;
  runStatusesById: Record<string, ChatRunStatus>;
  browserResultCardsByRunId: Record<string, BrowserResultCard[]>;
  nextBefore: string | null;
  limit: number;
}

export type ChatRunStatus = "queued" | "running" | "waiting_for_approval" | "completed" | "cancelled" | "failed";

export interface ChatRun {
  id: string;
  conversationSessionId?: string | null;
  status: ChatRunStatus;
  accountId?: string | null;
  workspaceId?: string;
  runtimeRunId?: string | null;
  surface?: import("./hermes-channel").HermesSurface;
  channel?: import("./hermes-channel").HermesChannelId;
  sensitivity?: import("./hermes-channel").HermesConversationSensitivity;
  contextReferences?: import("./hermes-api").HermesContextReference[];
  requestedCapabilityFamilies?: string[];
  sourceJobId?: string | null;
  sourceExecutionId?: string | null;
  messages: ChatMessage[];
  events?: ChatRunEvent[];
  browserResultCards?: BrowserResultCard[];
  createdAt: string;
  startedAt?: string | null;
  completedAt: string | null;
}

export interface ChatRunEvent {
  id: string;
  runId: string;
  type: "status" | "message_delta" | "message_completed" | "artifact_update" | "usage" | "error";
  payload: Record<string, unknown>;
  createdAt: string;
}

export type PillSurface = "home" | "empty_chat" | "post_workflow";
export type PillStatus = "draft" | "test" | "active" | "retired";
export type PillRiskLevel = "low" | "medium" | "high" | "critical";
export type PillEventType =
  | "shown"
  | "clicked"
  | "dismissed"
  | "workflow_started"
  | "workflow_completed"
  | "workflow_failed"
  | "connection_suggested"
  | "connection_started"
  | "connection_completed"
  | "automation_suggested"
  | "automation_enabled";
export type PillLocale = string;
export type PillLevel = "beginner" | "advanced" | "expert";
export type PillActivationTier = "core_starter" | "beginner_expansion" | "advanced" | "expert" | "followup";
export type PillLifecycleStage = "cold_start" | "exploring" | "first_success" | "connected" | "repeat_user" | "power_user";
export type ChatSuggestionCategory =
  | "onboarding"
  | "build"
  | "memory"
  | "sources"
  | "files"
  | "planning"
  | "admin"
  | "documents"
  | "projects"
  | "developer";

export interface PillVariant {
  id: string;
  useCaseId: string;
  status: PillStatus;
  locale: PillLocale;
  label: string;
  detail: string;
  prompt: string;
  category: ChatSuggestionCategory;
  topic: string;
  level: PillLevel;
  activationTier: PillActivationTier;
  baseQuality: number;
  surfaces: PillSurface[];
  tags: string[];
  followups: string[];
  requiredCapabilities: string[];
  helpfulCapabilities: string[];
  setupHints: Record<string, string>;
  riskLevel: PillRiskLevel;
  version: number;
}

export interface PillInstance {
  id: string;
  pillId: string;
  label: string;
  detail: string;
  prompt: string;
  category: ChatSuggestionCategory;
  topic: string;
  level: PillLevel;
  activationTier: PillActivationTier;
  baseQuality: number;
  tags: string[];
  followups: string[];
  locale: PillLocale;
  surface: PillSurface;
  riskLevel: PillRiskLevel;
  helpfulCapabilities: string[];
  usedAt: string | null;
  dismissedAt: string | null;
  createdAt: string;
  expiresAt: string | null;
}

export interface PillUserProfile {
  lifecycleStage: PillLifecycleStage;
  topicScores: Record<string, number>;
  levelAffinity: Record<PillLevel, number>;
  successfulUseCases: string[];
  declinedTopics: string[];
  lastDecayAt: string | null;
}

export interface UsePillRequest {
  conversationSessionId?: string | null;
  runId?: string | null;
}

export interface DismissPillRequest {
  reason?: string;
}

export interface RecommendPillsRequest {
  surface?: PillSurface;
  maxPills?: number;
  locale?: PillLocale;
  language?: string;
}

export interface ChatSuggestion {
  id: string;
  pillInstanceId?: string;
  pillId?: string;
  label: string;
  detail: string;
  prompt: string;
  category: ChatSuggestionCategory;
  usedAt: string | null;
  dismissedAt?: string | null;
}

export interface WorkspaceBookmark {
  id: string;
  workspaceId: string;
  title: string;
  href: string;
  sortOrder: number;
  status: WorkspaceBookmarkStatus;
  createdAt: string;
  updatedAt: string;
}

export type WorkspaceFileKey = "soul" | "agents" | "memory" | "user" | "notes" | "honcho" | "config";

export interface WorkspaceTextFileWarning {
  code: "possible_profile_contamination" | "secret_redacted";
  label: string;
  detail: string;
  severity: "info" | "warning";
}

export interface WorkspaceTextFile {
  key: WorkspaceFileKey;
  label: string;
  description: string;
  path: string;
  content: string;
  defaultContent: string;
  defaultSource: string | null;
  defaultDescription: string;
  defaultOrigin: string;
  emptyStateReason: string;
  editGuidance: string;
  sourceKind: WorkspaceFileSourceKind;
  sourceLabel: string;
  sourceDetail: string;
  displayContentSource: WorkspaceFileDisplayContentSource;
  builtinActiveWhenMissing: boolean;
  warnings: WorkspaceTextFileWarning[];
  exists: boolean;
  existsInWorkspace: boolean;
  editable: boolean;
  restartRequired: boolean;
  maxBytes: number;
  updatedAt: string | null;
}

export interface VaultNoteSummary {
  path: string;
  title: string;
  excerpt: string;
  bytes: number;
  updatedAt: string;
  sourceLabel: string;
  sourceDetail: string;
}

export interface VaultNote extends VaultNoteSummary {
  content: string;
}

export interface VaultNotesResponse {
  notes: VaultNoteSummary[];
  query: string | null;
  total: number;
  truncated: boolean;
}

export interface VaultNotePreviewRequest {
  path: string;
  content: string;
}

export interface VaultNotePreviewResponse {
  path: string;
  proposedContent: string;
  currentContent: string;
  beforeExists: boolean;
  beforeSha256: string;
  byteLength: number;
  maxBytes: number;
  fits: boolean;
  sourceDetail: string;
}

export interface VaultNoteApplyRequest {
  path: string;
  content: string;
  approvalId: string;
  runId?: string | null;
}

export interface WorkspaceCapability {
  id: string;
  label: string;
  description: string;
  category: "files" | "code" | "apps" | "data" | "connectors" | "memory" | "security" | "system";
  risk: WorkspaceCapabilityRisk;
  defaultState: WorkspaceCapabilityDefaultState;
  currentState: WorkspaceCapabilityDefaultState;
  hostingProfileId: WorkspaceHostingProfileId;
  hostingMode: WorkspaceHostingMode;
  allowedInSharedPool: boolean;
  allowedOnDedicatedVps: boolean;
  allowedHostingProfileIds: WorkspaceHostingProfileId[];
  hostingProfileStates: Record<WorkspaceHostingProfileId, WorkspaceCapabilityDefaultState>;
  requiresApproval: boolean;
  auditRequired: boolean;
  resourceMeter: string | null;
  limitSummary: string;
  blockedMessage: string;
}

export interface WorkspaceCapabilitySummary {
  workspaceId: string;
  isolation: WorkspaceIsolation;
  runtimeAccess: WorkspaceRuntimeAccess;
  plan: PlanTier;
  hostingProfileId: WorkspaceHostingProfileId;
  hostingProfile: WorkspaceHostingStatus;
  capabilities: WorkspaceCapability[];
}

export interface WorkspaceCapabilityPreflightRequest {
  capabilityId: string;
  action?: string;
  estimatedMemoryMb?: number;
  estimatedDiskMb?: number;
  estimatedRuntimeSeconds?: number;
  wantsPublicExposure?: boolean;
}

export interface WorkspaceCapabilityPreflightResponse {
  capabilityId: string;
  decision: WorkspaceCapabilityPreflightDecision;
  requiresApproval: boolean;
  auditRequired: boolean;
  message: string;
  limitSummary: string;
}

export interface WorkspaceRuntimeIsolation {
  mode: string;
  summary: string;
  guarantees: string[];
}

export interface WorkspaceRuntimeSettings {
  modelProvider: string;
  effectiveModel: string;
  modelSource: string;
  configPath: string;
  chatTimeoutSeconds: number;
  runtimeDriver: "local" | "docker" | "node-agent";
  isolation: WorkspaceRuntimeIsolation;
  managementAgent: WorkspaceManagementAgentSummary;
  notes: string[];
}

export interface WorkspaceManagementAgentSummary {
  name: "Hey Hermes Management Agent";
  configured: boolean;
  privateOnly: boolean;
  role: string;
  responsibilities: string[];
}

export interface WorkspaceManagementAgentStatus {
  workspaceId: string;
  configured: boolean;
  reachable: boolean;
  privateOnly: boolean;
  serviceName: "Hey Hermes Management Agent";
  checkedAt: string;
  status: "healthy" | "unreachable" | "not_configured";
  detail: string;
  runtimeStatus: string | null;
  error: string | null;
}

export interface HermesDashboardRoute {
  workspaceId: string;
  available: boolean;
  privateOnly: boolean;
  label: string;
  href: string | null;
  openMode: "advanced_private_route";
  dashboardPort: number | null;
  note: string;
}

export interface BrowserSessionHandoffRequest {
  href: string;
}

export interface BrowserSessionHandoffResponse {
  href: string;
  expiresAt: string;
}

export type HermesRuntimeParityCheckStatus = "ok" | "warn" | "missing" | "unknown";

export interface HermesRuntimeParityCheck {
  id: string;
  label: string;
  status: HermesRuntimeParityCheckStatus;
  evidence: string;
}

export interface HermesRuntimeParityReport {
  workspaceId: string;
  generatedAt: string;
  source: "runtime_inventory";
  summary: {
    status: "ready" | "needs_review" | "unavailable";
    checkedSurfaces: number;
    warnings: number;
  };
  checks: HermesRuntimeParityCheck[];
  rollout: {
    canary: string;
    pilot: string;
    rollback: string;
  };
}

export interface HermesRuntimeInventorySection {
  key: string;
  label: string;
  command: string;
  status: "ok" | "error";
  output: string;
  error: string | null;
  exitCode: number | null;
}

export interface HermesRuntimeInventory {
  workspaceId: string;
  capturedAt: string;
  runtime: {
    driver: WorkspaceRuntimeSettings["runtimeDriver"];
    dashboardPrivateByDefault: boolean;
    dashboardNote: string;
  };
  sections: HermesRuntimeInventorySection[];
}

export interface WorkspaceStyleSettings {
  workspaceId: string;
  soulStyle: WorkspaceSoulStyle;
  agentsStyle: WorkspaceAgentsStyle;
  onboardingConfirmedAt: string | null;
  updatedAt: string;
}

/**
 * What the two managed automations must not carry in their own wording.
 *
 * The pilot triage prompt named the customer and listed his own companies, so
 * every workspace that got the prompt got his life with it. The prompt keeps
 * the rule and this setting keeps the workspace's answer to it: an empty list
 * and one stream until the customer says otherwise. Nothing here is a default
 * anybody else has to live with.
 */
export interface WorkspaceTriagePolicy {
  /**
   * Topics somebody else already handles: names, projects, senders, subjects.
   * A mail on one of them is not reported, gets no card, and is not marked as
   * read, unless it is clearly private and unrelated.
   */
  readonly handledElsewhere: readonly string[];
  /** true keeps business and private apart; false treats them as one stream. */
  readonly separateBusinessAndPrivate: boolean;
  readonly updatedAt: string;
}

export interface WorkspaceTriagePolicyUpdate {
  readonly handledElsewhere?: readonly string[];
  readonly separateBusinessAndPrivate?: boolean;
}

export const workspaceTriagePolicyLimits = Object.freeze({
  maxEntries: 25,
  maxEntryLength: 120,
} as const);

/**
 * The one place a policy is checked. The list is short on purpose: it is read
 * into a prompt on every run, and an unbounded list would push the actual
 * triage rules out of the model's attention long before the database noticed.
 */
export function normalizeWorkspaceTriagePolicyUpdate(
  input: unknown,
  current: Pick<WorkspaceTriagePolicy, "handledElsewhere" | "separateBusinessAndPrivate">,
): Pick<WorkspaceTriagePolicy, "handledElsewhere" | "separateBusinessAndPrivate"> {
  const body = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const unknownField = Object.keys(body).find(
    (field) => field !== "handledElsewhere" && field !== "separateBusinessAndPrivate",
  );
  if (unknownField) throw new Error(`Unsupported triage policy field: ${unknownField}.`);

  let separateBusinessAndPrivate = current.separateBusinessAndPrivate;
  if (body.separateBusinessAndPrivate !== undefined) {
    if (typeof body.separateBusinessAndPrivate !== "boolean") {
      throw new Error("Business and private separation must be true or false.");
    }
    separateBusinessAndPrivate = body.separateBusinessAndPrivate;
  }

  let handledElsewhere = current.handledElsewhere;
  if (body.handledElsewhere !== undefined) {
    if (!Array.isArray(body.handledElsewhere)) {
      throw new Error("Topics handled by someone else must be a list.");
    }
    if (body.handledElsewhere.length > workspaceTriagePolicyLimits.maxEntries) {
      throw new Error(`Keep at most ${workspaceTriagePolicyLimits.maxEntries} topics handled by someone else.`);
    }
    const seen = new Set<string>();
    const entries: string[] = [];
    for (const raw of body.handledElsewhere) {
      if (typeof raw !== "string") throw new Error("Every topic handled by someone else must be text.");
      const entry = raw.trim();
      if (!entry || entry.length > workspaceTriagePolicyLimits.maxEntryLength) {
        throw new Error(`Every topic must be between 1 and ${workspaceTriagePolicyLimits.maxEntryLength} characters.`);
      }
      if (/[\u0000-\u001f\u007f]/u.test(entry)) throw new Error("A topic must not contain control characters.");
      const key = entry.toLocaleLowerCase();
      if (seen.has(key)) throw new Error("A topic must not be listed twice.");
      seen.add(key);
      entries.push(entry);
    }
    handledElsewhere = Object.freeze(entries);
  }

  return Object.freeze({
    handledElsewhere: Object.freeze([...handledElsewhere]),
    separateBusinessAndPrivate,
  });
}

export type KanbanStatus = "todo" | "doing" | "waiting" | "done";

export interface KanbanTask {
  id: string;
  title: string;
  description: string;
  status: KanbanStatus;
  sourceStatus?: string;
  assignee: "Hermes" | "You";
  createdAt: string;
  updatedAt: string;
}

export type HermesAutomationStatus = "active" | "paused" | "unknown";

export interface HermesAutomationJob {
  id: string;
  title: string;
  status: HermesAutomationStatus;
  schedule: string;
  nextRunAt: string | null;
  lastRunAt: string | null;
  delivery: string | null;
  summary: string | null;
}

export interface HermesAutomationsView {
  source: "hermes_cron" | "unavailable";
  label: string;
  message: string;
  updatedAt: string | null;
  jobs: HermesAutomationJob[];
}

export interface IntegrationStatus {
  kind: IntegrationKind;
  state: IntegrationState;
  label: string;
  description: string;
  nextStep: string;
  connectedAccount: string | null;
  secrets: IntegrationSecretStatus[];
  updatedAt: string;
}

export interface IntegrationSecretStatus {
  key: IntegrationSecretKey;
  label: string;
  optional?: boolean;
  saved: boolean;
  hint: string | null;
  updatedAt: string | null;
}

export interface SaveIntegrationSettingsRequest {
  telegramBotToken?: string;
  whatsappAccessToken?: string;
  whatsappPhoneNumberId?: string;
  whatsappPairingPlaceholder?: string;
  whatsappPairingStatus?: WhatsAppPairingStatus;
  emailSmtpUrl?: string;
  emailImapUrl?: string;
  emailFromAddress?: string;
}

/**
 * HPD-499. The code Hermes sends an unknown Telegram sender, handed back on the
 * page that took the bot token.
 *
 * Hermes refuses a sender it does not know and answers with a pairing code plus
 * `hermes pairing approve telegram <code>` (gateway/run.py:10053-10080). The
 * customer owns the bot and has no command line. Hermes already answers that:
 * its own dashboard carries `POST /api/pairing/approve`, described in
 * hermes_cli/web_server.py:12633-12637 as "how a remote admin onboards
 * messaging users (Telegram, Discord, …) without shell access", wrapping the
 * same `PairingStore.approve_code` the CLI calls. Hey Hermes calls that door;
 * it keeps no list of approved users of its own.
 *
 * The result carries the approved user's display name and not the Telegram
 * user id: the name is what a customer needs to recognise the approval, and the
 * id is an identity the control plane deliberately does not keep.
 */
export interface TelegramPairingApproveRequest {
  code: string;
}

export interface TelegramPairingApproveResult {
  approved: true;
  userName: string | null;
}

export interface ConnectionToolSummary {
  provider: ConnectionProviderId;
  label: string;
  state: ConnectionToolState;
  connectedAccount: string | null;
  setupRequestSupported: boolean;
  secretEntrySurface: "connections" | "settings" | "chat_request";
  approvalRequiredFor: string[];
  secrets: IntegrationSecretStatus[];
  notes: string[];
  updatedAt: string | null;
}

export interface ConnectionToolCatalog {
  tools: ConnectionToolSummary[];
  notes: string[];
}

export interface CreateConnectionSetupRequest {
  provider: ConnectionProviderId;
  workflow: string;
  proposedPermissions?: string[];
  userBenefit?: string;
  source?: "hermes_runtime" | "chat" | "connections_ui" | "api";
  runId?: string | null;
}

export interface ConnectionSetupRequest {
  id: string;
  workspaceId: string;
  accountId: string;
  provider: ConnectionProviderId;
  status: ConnectionSetupRequestStatus;
  workflow: string;
  proposedPermissions: string[];
  userBenefit: string;
  source: "hermes_runtime" | "chat" | "connections_ui" | "api";
  createdAt: string;
  updatedAt: string;
  notes: string[];
}

export type ApprovalStatus = "pending" | "approved" | "denied" | "expired" | "executed" | "failed";
export type ApprovalStatusFilter = ApprovalStatus | "history";
export type ApprovalRisk = "low" | "medium" | "high" | "critical";
export type ApprovalKind =
  | "browser_action"
  | "connector_send"
  | "stripe_action"
  | "public_publish"
  | "file_upload"
  | "memory_write"
  | "vault_write"
  | "secret_use"
  | "connection_change";

export interface ApprovalTarget {
  type: "website" | "person" | "service" | "file" | "memory" | "connection" | "billing";
  label: string;
  url?: string;
}

export interface ApprovalExecutionBinding {
  key: string;
  payloadHash: string;
  idempotencyKey?: string | null;
}

export interface ApprovalAction {
  label: string;
  capabilityId: string;
  toolName?: string;
  method?: string;
  execution?: ApprovalExecutionBinding;
}

export interface ApprovalPreviewField {
  label: string;
  value: string;
  sensitive?: boolean;
}

export interface ApprovalPreview {
  markdown?: string;
  fields?: ApprovalPreviewField[];
  diff?: string;
  recipients?: string[];
  amount?: { value: number; currency: string };
  sourceLinks?: Array<{ label: string; href: string }>;
}

export interface ApprovalSecretUse {
  kind: string;
  hint: string;
}

export interface ApprovalCard {
  id: string;
  workspaceId: string;
  accountId: string;
  runId: string | null;
  conversationSessionId: string | null;
  kind: ApprovalKind;
  status: ApprovalStatus;
  risk: ApprovalRisk;
  title: string;
  summary: string;
  target: ApprovalTarget;
  action: ApprovalAction;
  preview: ApprovalPreview;
  permissions: string[];
  dataLeavingWorkspace: string[];
  secretsUsed: ApprovalSecretUse[];
  approveLabel: string;
  denyLabel: string;
  requiresTypedConfirmation: string | null;
  expiresAt: string;
  createdAt: string;
  decidedAt: string | null;
  executedAt: string | null;
  notes: string[];
}

export interface CreateApprovalCardRequest {
  runId?: string | null;
  conversationSessionId?: string | null;
  kind: ApprovalKind;
  risk: ApprovalRisk;
  title: string;
  summary: string;
  target: ApprovalTarget;
  action: ApprovalAction;
  preview?: ApprovalPreview;
  permissions?: string[];
  dataLeavingWorkspace?: string[];
  secretsUsed?: ApprovalSecretUse[];
  approveLabel?: string;
  denyLabel?: string;
  requiresTypedConfirmation?: string | null;
  expiresAt?: string;
}

export interface ApprovalDecisionRequest {
  decision: "approved" | "denied";
  typedConfirmation?: string;
}

export interface ApprovalListQuery {
  status?: ApprovalStatusFilter;
  kind?: ApprovalKind;
  limit?: number;
}

export type CapabilityActivityKind = "skill" | "plugin" | "tool" | "capability" | "memory";
export type CapabilityActivityAction = "installed" | "enabled" | "disabled" | "used" | "updated" | "rolled_back" | "removed";

export interface CreateCapabilityActivityReceiptRequest {
  runId: string;
  kind: CapabilityActivityKind;
  action: CapabilityActivityAction;
  name: string;
  capabilityId?: string | null;
  source?: string | null;
  detail?: string | null;
}

export interface CapabilityActivityReceipt {
  runId: string;
  kind: CapabilityActivityKind;
  action: CapabilityActivityAction;
  name: string;
  capabilityId: string | null;
  source: string | null;
  label: string;
  detail: string;
  statusEventId: string;
  createdAt: string;
}

export type WorkspaceCapabilityInventoryKind = Extract<CapabilityActivityKind, "memory" | "skill" | "plugin" | "tool">;

export interface WorkspaceCapabilityInventoryItem {
  key: string;
  kind: WorkspaceCapabilityInventoryKind;
  name: string;
  relativePath: string;
  exists: boolean;
  updatedAt: string | null;
  size: number;
  sha256: string | null;
}

export interface WorkspaceCapabilityInventory {
  capturedAt: string;
  items: WorkspaceCapabilityInventoryItem[];
}

export type NativeCapabilityCategory = "ai" | "messaging" | "email" | "workspace" | "memory" | "tasks" | "custom";
export type NativeCapabilityStatus = "suggested" | "active" | "needs_attention" | "unavailable" | "unknown";
export type NativeCapabilitySource = "curated" | "hermes_runtime" | "hey_hermes" | "custom";
export type NativeCapabilityUseState = "current" | "available";
export type NativeCapabilityPromptTone = "primary" | "secondary" | "danger";

export interface NativeCapabilityPromptAction {
  id: string;
  label: string;
  prompt: string;
  tone?: NativeCapabilityPromptTone;
}

export interface NativeCapabilityItem {
  id: string;
  label: string;
  category: NativeCapabilityCategory;
  status: NativeCapabilityStatus;
  activeUse?: NativeCapabilityUseState;
  source: NativeCapabilitySource;
  detectedBy: "hermes" | "hey_hermes" | "mixed" | "unknown";
  detail: string;
  prompt: string;
  promptActions?: NativeCapabilityPromptAction[];
  updatedAt: string | null;
}

export interface NativeCapabilitiesView {
  workspaceId: string;
  checkedAt: string;
  source: "hermes_runtime" | "mixed" | "control_plane" | "unknown";
  items: NativeCapabilityItem[];
  notes: string[];
}

export interface HonchoMemoryConclusion {
  id: string;
  content: string;
  observer: string | null;
  observed: string | null;
  sessionId: string | null;
  createdAt: string | null;
}

export interface HonchoMemorySession {
  id: string;
  name: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface HonchoMemoryMessageSnippet {
  id: string;
  sessionId: string | null;
  role: string | null;
  content: string;
  createdAt: string | null;
}

export interface HonchoMemoryView {
  status: "active" | "disabled" | "missing_config" | "unreachable";
  checkedAt: string;
  workspaceId: string;
  providerWorkspaceId: string | null;
  baseUrlHost: string | null;
  contextTokens: number | null;
  summary: {
    conclusions: number;
    sessions: number;
    messages: number;
    truncated: boolean;
  };
  conclusions: HonchoMemoryConclusion[];
  sessions: HonchoMemorySession[];
  recentMessages: HonchoMemoryMessageSnippet[];
  context: string[];
  notes: string[];
  error: string | null;
}

export type HeyHermesAdapterActionId =
  | "account.context"
  | "connections.list"
  | "secure_secrets.request_entry"
  | "secure_secrets.list"
  | "channel_messages.create"
  | "model_route.set_preference"
  | "connections.request_setup"
  | "approvals.create"
  | "heartbeat_soul.wake_event"
  | "agent_mailbox.send"
  | "agent_mailbox.list"
  | "agent_mailbox.sync"
  | "capability_activity.record"
  | "delegated_tasks.record"
  | "tasks.create"
  | "ranked_tasks.refresh"
  | "bookmarks.create"
  | "browser_results.create"
  | "preview.private_route"
  | "publish.public_route";

export type HeyHermesAdapterActionStatus = "available" | "contract_only";
export type HeyHermesAdapterActionKind = "read" | "request" | "create" | "execute" | "route" | "contract";

export interface HeyHermesAdapterAction {
  id: HeyHermesAdapterActionId;
  label: string;
  status: HeyHermesAdapterActionStatus;
  kind: HeyHermesAdapterActionKind;
  mutatesWorkspace: boolean;
  requiresApproval: boolean;
  capabilityId: string | null;
  endpoint: string;
  method: "GET" | "POST";
  requestType: string | null;
  responseType: string;
  notes: string[];
}

export interface HeyHermesAdapterManifest {
  schemaVersion: "2026-06-03.1" | "2026-06-05.1";
  workspaceId: string;
  generatedAt: string;
  generatedBy: "hey-hermes-control-plane";
  runtimeDiscovery: {
    jsonPath: "$HERMES_HOME/hey-hermes-adapter.json";
    tokenPath: "$HERMES_HOME/hey-hermes-adapter-token";
    markdownPath: "$OBSIDIAN_VAULT_PATH/.hey-hermes/adapter.md";
    commandPath: "$OBSIDIAN_VAULT_PATH/.hey-hermes/hey-hermes-tool.py";
    note: string;
  };
  adapterApi: {
    baseUrl: string;
    auth: "workspace_runtime_adapter_token";
    tokenPath: "$HERMES_HOME/hey-hermes-adapter-token";
  };
  context: {
    account: Pick<UserProfile, "id" | "name" | "email" | "preferredLocale">;
    workspace: Pick<WorkspaceSummary, "id" | "state" | "isolation" | "access">;
    plan: {
      status: EntitlementStatus;
      plan: PlanTier;
      usagePoolPlan: Exclude<PlanTier, "trial"> | null;
    };
    modelRoute: Pick<
      ModelOptionsView,
      | "plan"
      | "aiMode"
      | "routingMode"
      | "allowedClasses"
      | "publicClassNames"
      | "premiumMetered"
      | "selectedModelId"
      | "selectedSlotId"
      | "defaultSlotId"
      | "managedRoutingLive"
      | "daySoftLimitReached"
      | "spend"
    >;
    providerStatus: ProviderStatusView;
    connections: ConnectionToolCatalog;
    previewRoutePlan: WorkspacePreviewRoutePlan;
  };
  actions: HeyHermesAdapterAction[];
  safety: {
    normalChatPromptUnchanged: true;
    noFrontendPhraseMatching: true;
    noSecretsIncluded: true;
    managementAgentTokenIncluded: false;
    notes: string[];
  };
}

export interface HeyHermesAdapterMaterialization {
  ok: boolean;
  workspaceId: string;
  writtenAt: string;
  files: {
    json: string;
    token: string;
    markdown: string;
    command: string;
    agentEmailSkill?: string;
    agentEmailSkillDescription?: string;
    agentEmailGuide?: string;
    pagesAppsSkill?: string;
    pagesAppsSkillDescription?: string;
    pagesAppsGuide?: string;
    tasksSkill?: string;
    tasksSkillDescription?: string;
    tasksGuide?: string;
    deliverySkill?: string;
    deliverySkillDescription?: string;
    deliveryGuide?: string;
  };
}

export interface HeyHermesPreviewRouteRequest {
  port: number;
  path?: string;
  title?: string;
}

export interface HeyHermesPreviewRouteResponse {
  workspaceId: string;
  port: number;
  path: string;
  title: string | null;
  /** Workspace-relative path. Bookmarks store this, and the clients resolve it. */
  href: string;
  /**
   * The same route as an absolute address, so it can be named to a person and opened.
   * It is behind the sign-in: opened without a session it answers 401, measured
   * 2026-08-25 on /api/workspace/preview/8100/index.html.
   */
  url: string;
  privateOnly: true;
  authenticated: true;
  mutated: false;
  routePlan: WorkspacePreviewRoutePlan;
}

export type WorkspacePublicRouteStatus = "active" | "archived";

export interface WorkspacePublicRoute {
  id: string;
  workspaceId: string;
  port: number;
  path: string;
  title: string | null;
  status: WorkspacePublicRouteStatus;
  createdAt: string;
  updatedAt: string;
}

export interface HeyHermesPublicRouteRequest {
  port: number;
  path?: string;
  title?: string;
  runId?: string | null;
}

export interface HeyHermesPublicRouteResponse {
  workspaceId: string;
  routeId: string;
  port: number;
  path: string;
  title: string | null;
  /** Workspace-relative path. Bookmarks store this, and the clients resolve it. */
  href: string;
  /** The same route as an absolute address. Public: it opens without a session. */
  url: string;
  privateOnly: false;
  authenticated: false;
  mutated: true;
  bookmarkId: string;
  routePlan: WorkspacePreviewRoutePlan;
}

export type EmailMessageKind = "invite_access" | "workspace_ready" | "usage_warning" | "account_security";
export type EmailDeliveryStatus = "queued" | "skipped" | "sent" | "failed";

export interface EmailDelivery {
  id: string;
  workspaceId: string;
  accountId: string;
  kind: EmailMessageKind;
  toEmail: string;
  subject: string;
  bodyPreview: string;
  provider: "fake" | "test" | "migadu" | "smtp";
  status: EmailDeliveryStatus;
  providerMessageId: string | null;
  error: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  sentAt: string | null;
}

export type NotificationChannel = "in_app" | "email";
export type MobilePushProvider = "expo";
export type MobilePushPlatform = "ios" | "android" | "web" | "unknown";
export type NotificationKind =
  | "invite_access"
  | "workspace_ready"
  | "usage_warning"
  | "account_security"
  | "subscription_status"
  | "account_lifecycle"
  | "chat_run";
export type NotificationSeverity = "info" | "warning" | "critical";
export type NotificationStatus = "unread" | "read" | "dismissed" | "queued" | "skipped" | "failed";

export interface NotificationRecord {
  id: string;
  workspaceId: string;
  accountId: string;
  channel: NotificationChannel;
  kind: NotificationKind;
  severity: NotificationSeverity;
  status: NotificationStatus;
  title: string;
  body: string;
  actionUrl: string | null;
  emailDeliveryId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  readAt: string | null;
  dismissedAt: string | null;
}

export interface NotificationPreferences {
  accountId: string;
  workspaceId: string;
  inAppEnabled: boolean;
  emailEnabled: boolean;
  mobilePushEnabled: boolean;
  usageWarningsEmail: boolean;
  accountSecurityEmail: boolean;
  updatedAt: string;
}

export interface MobilePushSubscription {
  id: string;
  workspaceId: string;
  accountId: string;
  provider: MobilePushProvider;
  token: string;
  platform: MobilePushPlatform;
  deviceId: string | null;
  deviceName: string | null;
  appVersion: string | null;
  buildNumber: string | null;
  enabled: boolean;
  lastRegisteredAt: string;
  lastSuccessAt: string | null;
  lastFailureAt: string | null;
  failureCount: number;
  error: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MobilePushStatus {
  enabledByPreference: boolean;
  subscriptions: MobilePushSubscription[];
}

export interface RegisterMobilePushSubscriptionRequest {
  provider: MobilePushProvider;
  token: string;
  platform?: MobilePushPlatform;
  deviceId?: string | null;
  deviceName?: string | null;
  appVersion?: string | null;
  buildNumber?: string | null;
}

export interface MobilePushTestResponse {
  notificationId: string;
  attempted: number;
  sent: number;
  failed: number;
  skipped: number;
  errors: string[];
}

export interface AgentMailbox {
  id: string;
  workspaceId: string;
  accountId: string;
  address: string;
  displayName: string;
  provider: AgentMailboxProvider;
  status: AgentMailboxStatus;
  provisionStatus: AgentMailboxProvisionStatus;
  sendAbility: AgentMailboxAbilityStatus;
  inboxSyncStatus: AgentMailboxAbilityStatus;
  lastCheckAt: string | null;
  missingConfiguration: string[];
  inboundEnabled: boolean;
  outboundEnabled: boolean;
  userVisible: boolean;
  approvalRequiredForSend: boolean;
  purpose: string;
  createdAt: string;
  updatedAt: string;
  notes: string[];
}

export interface AgentMailboxMessage {
  id: string;
  mailboxId: string;
  workspaceId: string;
  accountId: string;
  direction: AgentMailboxMessageDirection;
  status: AgentMailboxMessageStatus;
  fromEmail: string;
  toEmail: string | null;
  subject: string;
  bodyPreview: string;
  providerMessageId: string | null;
  approvedByAccountId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  sentAt: string | null;
  receivedAt: string | null;
}

export interface AgentMailboxInboxSyncResponse {
  mailbox?: AgentMailbox;
  fetched: number;
  imported: number;
  skipped: number;
  status: "synced" | "skipped";
  reason?: string;
  messages: AgentMailboxMessage[];
  metadata?: Record<string, unknown>;
}

export interface AgentMailboxRuntimeListResponse {
  mailbox: AgentMailbox;
  messages: AgentMailboxMessage[];
}

export type RealtimeVoiceMode = "voice_agent" | "transcription";

export interface RealtimeVoiceSessionRequest {
  mode?: RealtimeVoiceMode;
}

export interface RealtimeVoiceClientSecret {
  value: string;
  expiresAt: number | null;
}

export interface RealtimeVoiceSessionResponse {
  provider: "openai";
  mode: RealtimeVoiceMode;
  model: string;
  endpoint: string;
  clientSecret: RealtimeVoiceClientSecret;
  session: Record<string, unknown>;
}

export interface VoiceTranscriptionRequest {
  audioBase64: string;
  mimeType?: string;
}

export interface VoiceTranscriptionResponse {
  provider: "openai" | "openrouter";
  model: string;
  text: string;
  mimeType: string;
  bytes: number;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
    seconds?: number;
    costCents?: number;
    /** Provider-reported actual cost retained at nano-USD precision. */
    costNanoUsd?: string;
    /** Provider response identity when the provider supplies one. */
    providerReceiptId?: string;
  };
}

export interface VoiceSpeechRequest {
  text: string;
  format?: "mp3" | "opus" | "aac" | "flac" | "wav" | "pcm";
}

export interface VoiceSpeechResponse {
  provider: "openrouter";
  model: string;
  voice: string;
  mimeType: string;
  audioBase64: string;
  bytes: number;
  usage: {
    inputCharacters: number;
    costCents: number;
    billable: boolean;
  };
}

export interface ApiKeySettings {
  aiMode: AiMode;
  hasOpenAiKey: boolean;
  hasOpenRouterKey: boolean;
  hasAnthropicKey: boolean;
  redactedKeys: Record<string, string>;
}

export type AdminHandoverStatus = "not_started" | "pending" | "passed" | "failed" | "waived";
export type StandingAccessStatus = "unknown" | "none_detected" | "detected" | "not_checked";
export type SupportGrantStatus = "active" | "expired" | "revoked";
/**
 * HPD-415: one kind of support access. `workspace:diagnose` was the app-only
 * repair-token scope and is withdrawn — nothing mints it any more, and a stored
 * row that still carries it reads as no scope at all and is refused.
 */
export type SupportGrantScope =
  | "diagnostics.read"
  | "logs.redacted.read"
  | "config.read"
  | "service.status.read"
  | "jobs.metadata.read";
export type CloudInfrastructureEventSeverity = "green" | "yellow" | "red";
export type CloudInfrastructureEventStatus = "planned" | "requested" | "started" | "succeeded" | "failed" | "unmatched";
export type CloudInfrastructureEventSource = "cloud_gateway" | "hcloud_api" | "hcloud_console" | "manual" | "system";

export interface WorkspaceSecurityState {
  workspaceId: string;
  adminHandoverStatus: AdminHandoverStatus;
  customerAdminUsername: string | null;
  customerPublicKeyFingerprint: string | null;
  customerPublicKeyLabel: string | null;
  handoverCompletedAt: string | null;
  lastBaselineAttestedAt: string | null;
  standingAccessStatus: StandingAccessStatus;
  lastHandoverCheck: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface SupportGrant {
  id: string;
  workspaceId: string;
  accountId: string;
  createdByAccountId: string;
  supportLevel: 1 | 2 | 3;
  reason: string;
  scopes: SupportGrantScope[];
  status: SupportGrantStatus;
  tokenHint: string;
  expiresAt: string;
  createdAt: string;
  revokedAt: string | null;
  lastUsedAt: string | null;
}

export interface SupportGrantCreateResponse {
  grant: SupportGrant;
  token: string;
}

export interface CloudInfrastructureEvent {
  id: string;
  workspaceId: string | null;
  provider: "hetzner" | string;
  serverId: string | null;
  projectId: string | null;
  eventType: string;
  severity: CloudInfrastructureEventSeverity;
  status: CloudInfrastructureEventStatus;
  actorType: string;
  actorId: string | null;
  ticketId: string | null;
  source: CloudInfrastructureEventSource;
  providerActionId: string | null;
  metadataRedacted: Record<string, unknown>;
  startedAt: string;
  completedAt: string | null;
  createdAt: string;
}

export interface SecurityAccessOverview {
  adminAccess: {
    handoverStatus: AdminHandoverStatus;
    customerControlledSince: string | null;
    standingAccessStatus: StandingAccessStatus;
    customerPublicKeyFingerprint: string | null;
    customerPublicKeyLabel: string | null;
    lastBaselineAttestedAt: string | null;
  };
  support: {
    activeGrants: SupportGrant[];
    pastGrants: SupportGrant[];
  };
  infrastructure: {
    status: CloudInfrastructureEventSeverity;
    exceptionalEvents: CloudInfrastructureEvent[];
    unmatchedEvents: CloudInfrastructureEvent[];
  };
  auditProof: {
    latestEventId: string | null;
    latestEventHash: string | null;
    latestBatchId: string | null;
    latestBatchStatus: AuditProofBatch["status"] | null;
    latestBatchRoot: string | null;
    latestBatchSealedAt: string | null;
    latestBatchRetentionUntil: string | null;
    latestAnchor: string | null;
    latestAnchorProvider: string | null;
    latestAnchorUrl: string | null;
  };
}

export interface SecurityAuditReceiptEntry {
  id: string;
  kind: "audit_log" | "cloud_infrastructure_event";
  action: string;
  targetType: string;
  targetId: string | null;
  severity?: CloudInfrastructureEventSeverity;
  status?: CloudInfrastructureEventStatus;
  createdAt: string;
  hash: string;
}

export interface SecurityAuditReceipt {
  workspaceId: string;
  generatedAt: string;
  evidenceOnly: true;
  enforcement: false;
  explanation: string;
  entries: SecurityAuditReceiptEntry[];
  receiptHash: string;
  latestEventHash: string | null;
  latestBatchRoot: string | null;
  latestAnchor: string | null;
}

export interface AuditProofBatch {
  id: string;
  workspaceId: string;
  status: "planned" | "sealed" | "anchored";
  objectKey: string;
  objectSha256: string;
  merkleRoot: string;
  entryCount: number;
  retentionUntil: string | null;
  externalAnchor: Record<string, unknown> | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  sealedAt: string | null;
  anchoredAt: string | null;
}

export interface BackupJob {
  id: string;
  workspaceId: string;
  requestedByAccountId: string;
  kind: BackupJobKind;
  status: BackupJobStatus;
  storageProvider: BackupStorageProvider;
  storageUri: string | null;
  archivePath: string | null;
  sizeBytes: number | null;
  checksumSha256: string | null;
  errorMessage: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  expiresAt: string | null;
}

export interface RestoreJob {
  id: string;
  workspaceId: string;
  requestedByAccountId: string;
  backupJobId: string;
  mode: RestoreMode;
  status: RestoreJobStatus;
  storageProvider: BackupStorageProvider;
  storageUri: string | null;
  errorMessage: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
}

export interface WarmWorkspace {
  id: string;
  status: WarmWorkspaceStatus;
  reservedWorkspaceId: string;
  region: Region;
  plan: Exclude<PlanTier, "trial">;
  provider: ProvisioningProvider;
  dryRun: boolean;
  mutationAttempted: boolean;
  containerName: string;
  networkName: string;
  dataPath: string;
  runtimeApiUrl: string | null;
  idempotencyKey: string | null;
  createdByAccountId: string | null;
  claimedByAccountId: string | null;
  claimedWorkspaceId: string | null;
  claimReason: string | null;
  healthMessage: string;
  createdAt: string;
  updatedAt: string;
  claimedAt: string | null;
}

export interface WarmWorkspacePrepareResponse {
  warmWorkspace: WarmWorkspace;
  created: boolean;
}

export interface WarmWorkspaceRefillResponse {
  targetReady: number;
  readyBefore: number;
  readyAfter: number;
  created: number;
  warmWorkspaces: WarmWorkspace[];
}

export interface WarmWorkspaceClaimResponse {
  warmWorkspace: WarmWorkspace;
  claimed: boolean;
}

export interface AuditLogEntry {
  id: string;
  workspaceId: string | null;
  accountId: string | null;
  actorType: AuditActorType;
  action: string;
  targetType: string;
  targetId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface ProvisionRequest {
  target: "paid_user" | "trial_pool";
  region?: Region;
  plan?: Exclude<PlanTier, "trial">;
  includeGStack?: boolean;
  idempotencyKey?: string;
}

export interface ProvisionPlan {
  dryRun: boolean;
  provider: ProvisioningProvider;
  target: ProvisionRequest["target"];
  region: Region;
  plan: Exclude<PlanTier, "trial">;
  canMutate: boolean;
  location: string;
  serverType: string;
  serverName: string;
  backupsEnabled: boolean;
  estimatedMonthlyCents: number;
  cloudInitPreview: string;
  notes: string[];
}

export interface WorkspaceRuntime {
  workspaceId: string;
  provider: ProvisioningProvider;
  status: WorkspaceRuntimeStatus;
  target: ProvisionRequest["target"];
  region: Region;
  plan: Exclude<PlanTier, "trial">;
  dryRun: boolean;
  serverName: string | null;
  serverId: string | null;
  publicIpv4: string | null;
  runtimeApiUrl: string | null;
  lastProvisioningJobId: string | null;
  lastPlan: ProvisionPlan | null;
  createdAt: string;
  updatedAt: string;
  provisionedAt: string | null;
}

export interface ProvisioningJob {
  id: string;
  workspaceId: string;
  requestedByAccountId: string;
  idempotencyKey: string;
  status: ProvisioningJobStatus;
  target: ProvisionRequest["target"];
  region: Region;
  planTier: Exclude<PlanTier, "trial">;
  includeGStack: boolean;
  dryRun: boolean;
  provider: ProvisioningProvider;
  provisionPlan: ProvisionPlan;
  result: Record<string, unknown>;
  errorMessage: string | null;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  updatedAt: string;
}

export interface ProvisioningRequestResponse {
  runtime: WorkspaceRuntime;
  job: ProvisioningJob;
}

export interface ProductPrice {
  plan: Exclude<PlanTier, "trial">;
  monthlyPriceCents: number;
  currency: "USD";
  includedAiCreditsCents: number;
  description: string;
}

export interface AppSnapshot {
  me: UserProfile;
  accounts: AlphaAccount[];
  runtime: RuntimeSummary;
  workspace: WorkspaceSummary;
  workspaceRuntime: WorkspaceRuntime;
  workspaceStyle: WorkspaceStyleSettings;
  aiConnection: AiConnectionSummary;
  entitlement: Entitlement;
  usage: UsageSummary;
  usageLimits: UsageLimitStatus;
  subscription: SubscriptionStateView;
  providerStatus: ProviderStatusView;
  chatRoutePreference: ChatRoutePreference;
  server: WorkspaceServer;
  runtimeReadiness: RuntimeReadiness;
  tasks: KanbanTask[];
  integrations: IntegrationStatus[];
  bookmarks: WorkspaceBookmark[];
  apiKeys: ApiKeySettings;
  securityAccess: SecurityAccessOverview;
  notifications: NotificationRecord[];
  notificationPreferences: NotificationPreferences;
  emailDeliveries: EmailDelivery[];
  agentMailbox: AgentMailbox;
  agentMailboxMessages: AgentMailboxMessage[];
  backupJobs: BackupJob[];
  restoreJobs: RestoreJob[];
  auditLogs: AuditLogEntry[];
  recentMessages: ChatMessage[];
}
