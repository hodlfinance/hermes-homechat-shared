import type {
  AgentMailbox,
  AgentMailboxInboxSyncResponse,
  AgentMailboxMessage,
  ApiKeySettings,
  AppLocale,
  AlphaAccount,
  AccountInvite,
  AccountInvitePrepareResponse,
  CreateAccountInviteRequest,
  CreateAccountInviteResponse,
  AdminAccountResponse,
  AppSnapshot,
  AuditLogEntry,
  ApprovalCard,
  ApprovalDecisionRequest,
  ApprovalListQuery,
  BrowserResultCard,
  BrowserSessionHandoffRequest,
  BrowserSessionHandoffResponse,
  ChatGptConnectionCompleteResponse,
  ChatGptConnectionStartResponse,
  ChatRoutePreferenceRequest,
  ChatRoutePreferenceResponse,
  ClaudeConnectionCompleteResponse,
  ClaudeConnectionStartResponse,
  ClaudeConnectionStatus,
  ConnectionReachView,
  ConnectionSetupRequest,
  ConnectionToolCatalog,
  CreateApprovalCardRequest,
  CreateBrowserResultCardRequest,
  CreateConnectionSetupRequest,
  AuthSession,
  BackupJob,
  BillingCheckoutRequest,
  BillingCheckoutResponse,
  BillingPlanChangePreview,
  BillingPlanChangePreviewRequest,
  ChatSuggestion,
  EmailDelivery,
  Entitlement,
  HeyHermesAdapterManifest,
  HeyHermesAdapterMaterialization,
  HeyHermesPublicRouteRequest,
  HeyHermesPublicRouteResponse,
  HeyHermesPreviewRouteRequest,
  HeyHermesPreviewRouteResponse,
  HonchoMemoryView,
  HermesAutomationsView,
  GoogleConnectionCredentials,
  GoogleConnectionResult,
  GmailConnectionCompleteRequest,
  GmailConnectionStatus,
  GmailMobileOAuthCompleteRequest,
  GmailMobileOAuthStart,
  GmailMobileOAuthStartRequest,
  GmailDisconnectResult,
  GmailOAuthBrowserConfig,
  IntegrationKind,
  IntegrationStatus,
  KanbanTask,
  NotificationPreferences,
  NotificationRecord,
  MobilePushStatus,
  MobilePushTestResponse,
  RegisterMobilePushSubscriptionRequest,
  DismissPillRequest,
  PillInstance,
  PillVariant,
  ProvisioningJob,
  ProvisioningRequestResponse,
  ProvisionPlan,
  ProvisionRequest,
  SecurityAuditReceipt,
  SecurityAccessOverview,
  SupportGrant,
  SupportGrantCreateResponse,
  RealtimeVoiceSessionRequest,
  RealtimeVoiceSessionResponse,
  RedeemAccountInviteRequest,
  RedeemAccountInviteResponse,
  PasswordResetCodeResponse,
  RecommendPillsRequest,
  VoiceSpeechRequest,
  VoiceSpeechResponse,
  VoiceTranscriptionRequest,
  VoiceTranscriptionResponse,
  RevenueCatWebhookEvent,
  RestoreJob,
  RestoreMode,
  SaveIntegrationSettingsRequest,
  TelegramPairingApproveRequest,
  TelegramPairingApproveResult,
  UsageSummary,
  UsageLedgerEntry,
  UsageLimitStatus,
  UsePillRequest,
  UserProfile,
  WarmWorkspace,
  WarmWorkspaceClaimResponse,
  WarmWorkspacePrepareResponse,
  WarmWorkspaceRefillResponse,
  WorkspaceAgentsStyle,
  WorkspaceAccessState,
  ModelOptionsView,
  ModelPreferenceResponse,
  NativeCapabilitiesView,
  WorkspaceAccessSummary,
  WorkspaceBookmark,
  WorkspaceBookmarkStatus,
  WorkspaceCapabilityInventory,
  WorkspaceCapabilityPreflightRequest,
  WorkspaceCapabilityPreflightResponse,
  HermesRuntimeInventory,
  HeyNativeAuthConfig,
  HeyNativeAuthProvider,
  HeyNativeAuthSession,
  HeyNativeAuthSurface,
  HermesDashboardRoute,
  HermesRuntimeParityReport,
  WorkspaceCapabilitySummary,
  WorkspaceManagementAgentStatus,
  WorkspaceRuntimeSettings,
  WorkspaceServerIdentity,
  ProviderStatusView,
  SubscriptionStateView,
  TopUpSummary,
  VaultNote,
  VaultNoteApplyRequest,
  VaultNotePreviewRequest,
  VaultNotePreviewResponse,
  VaultNotesResponse,
  WorkspaceTextFile,
  WorkspaceRuntime,
  WorkspaceSoulStyle,
  WorkspaceStyleSettings,
  WorkspaceTriagePolicy,
  WorkspaceTriagePolicyUpdate,
  WorkspaceSummary,
  WorkspaceServer,
} from "./types";
import type { HermesJobResponse } from "./hermes-api";
import type { SharedHermesHistoryEntry, SharedHermesHistoryVisibility } from "./hermes-channel";
import type { ConnectionSetupIntent } from "./connection-setup";
import type { HermesConversationListResponse } from "./hermes-api";
import type { PluginCatalogOperationResult, PluginCatalogView } from "./plugin-catalog";
import type { RankedTaskCollection } from "./ranked-tasks";
import {
  secureSecretEntryMetadataFrom,
  secureSecretEntryPendingRequestFrom,
  secureSecretEntryRequestFrom,
  type SecureSecretEntryMetadata,
  type SecureSecretEntryPendingRequest,
  type SecureSecretEntryRequest,
} from "./secure-secret-entry";
import type {
  RankedTaskAutomationRole,
  RankedTaskAutomationsView,
  RankedTaskAutomationUpdate,
  RankedTaskAutomationView,
} from "./ranked-task-automations";
import type { RankedTaskRefreshReceipt } from "./ranked-task-refresh";
import type { RankedTaskRankingHistory } from "./ranked-task-history";
import type {
  HeySuggestionHomeNudgeResponse,
  HeySuggestionsListResponse,
  HeySuggestionTransitionResponse,
  HeySuggestionTransitionType,
} from "./suggestions-client";

export interface ApiClientOptions {
  baseUrl: string;
  token?: string;
  fetchImpl?: typeof fetch;
}

export interface CreateChatRunRequest {
  message: string;
  conversationSessionId?: string;
  attachments?: ChatRunAttachmentInput[];
  idempotencyKey?: string;
  connectionSetupIntent?: ConnectionSetupIntent;
}

export interface ChatRunAttachmentInput {
  name: string;
  mimeType: string;
  size: number;
  kind: "image" | "file";
  dataBase64: string;
}

export interface UseChatSuggestionRequest {
  pillInstanceId?: string | null;
  conversationSessionId?: string | null;
  runId?: string | null;
}

export interface SharedHermesHistoryListItem {
  entry: SharedHermesHistoryEntry;
  visibility: SharedHermesHistoryVisibility;
  externalRunId: string | null;
  sourceUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  status?: KanbanTask["status"];
}

/**
 * Exactly one of these per call. `completed` belongs to a finding with no Kanban
 * card; a card is completed in the Kanban with `updateTask`, which owns what a
 * card's status says.
 */
export type RankedTaskRowUpdateRequest =
  | { urgency: number }
  | { importance: number }
  | { completed: boolean }
  | { dismissed: boolean };

export interface CreateWorkspaceBookmarkRequest {
  title: string;
  href: string;
  sortOrder?: number;
  runId?: string | null;
}

export interface UpdateWorkspaceBookmarkRequest {
  title?: string;
  href?: string;
  sortOrder?: number;
  status?: WorkspaceBookmarkStatus;
}

export interface UpdateApiKeysRequest {
  aiMode: ApiKeySettings["aiMode"];
  openAiKey?: string;
  openRouterKey?: string;
  anthropicKey?: string;
}

export interface LoginRequest {
  email: string;
  password?: string;
  accessCode?: string;
  oauthRequest?: string;
}

export const heyAccountDeletionProductRealm = "heyhermes.v1" as const;
export const heyAccountDeletionConfirmationPhrase = "DELETE MY HEY HERMES ACCOUNT" as const;

/**
 * Whether what the customer typed counts as the confirmation.
 *
 * The field autocapitalizes on a phone and people paste with stray spaces;
 * neither is a failed confirmation. Shared so the app and the web agree on
 * exactly one rule for the most destructive control either of them has.
 */
export function heyAccountDeletionPhraseMatches(typed: string) {
  return typed.trim().toUpperCase() === heyAccountDeletionConfirmationPhrase;
}

export interface HeyAccountDeletionAuthorityRequest {
  accountId: string;
  productRealm: typeof heyAccountDeletionProductRealm;
}

export interface HeyAccountDeletionIntent {
  accountId: string;
  confirmationPhrase: typeof heyAccountDeletionConfirmationPhrase;
  expiresAt: string;
  id: string;
  productRealm: typeof heyAccountDeletionProductRealm;
  status: "pending";
  workspaceId: string;
}

export interface HeyAccountDeletionPurgeReceipt {
  accountId: string;
  completedAt: string;
  dueAt: string;
  privateRuntimeTeardownPending: boolean;
  productRealm: typeof heyAccountDeletionProductRealm;
  purgedRowsByTable: Record<string, number>;
  purgedRowsTotal: number;
  receiptId: string;
  retainedUnderSeparateRetentionRules: string[];
  withinDeadline: boolean;
  workspaceId: string;
}

export interface HeyAccountDeletionReceipt {
  accountId: string;
  activeDataPurgeDueAt: string;
  activeDataPurgeStatus: "scheduled";
  confirmedAt: string;
  productRealm: typeof heyAccountDeletionProductRealm;
  /**
   * The purge that ran immediately after confirmation. Null only when that first attempt
   * failed; the deletion is still recorded and the operator sweep retries it before
   * `activeDataPurgeDueAt`.
   */
  purge: HeyAccountDeletionPurgeReceipt | null;
  receiptId: string;
  revocations: {
    authChallenges: number;
    financeCapabilityGrants: number;
    nativeIdentities: number;
    oauthSessions: number;
    passwordResetCodes: number;
    productGrants: number;
    pushSubscriptions: number;
    sessions: number;
    supportGrants: number;
  };
  workspaceId: string;
}

export interface HeyNativeAuthSessionRequest {
  challengeId: string;
  idToken: string;
  mode?: "link" | "login";
  nonce: string;
  provider: HeyNativeAuthProvider;
  surface: HeyNativeAuthSurface;
}

export interface HeyNativeAuthChallengeRequest {
  mode?: "link" | "login";
  provider: HeyNativeAuthProvider;
  surface: HeyNativeAuthSurface;
}

export interface CreateAccountRequest {
  name: string;
  email: string;
  role?: AlphaAccount["role"];
  accessCode?: string;
}

export interface UpdateAccountRequest {
  name?: string;
  status?: AlphaAccount["status"];
  resetAccessCode?: boolean;
  accessCode?: string;
}

export interface UpdateMePreferencesRequest {
  preferredLocale?: AppLocale;
  name?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  password: string;
  passwordConfirmation: string;
}

export interface CompletePasswordResetRequest {
  email: string;
  resetCode: string;
  password: string;
  passwordConfirmation: string;
}

export interface CreateSupportGrantRequest {
  reason: string;
  scopes?: string[];
  expiresInMinutes?: number;
}

export interface RegisterAdminPublicKeyRequest {
  publicKey: string;
  label?: string;
}

export interface UpdateWorkspaceAccessRequest {
  state: WorkspaceAccessState;
  gracePeriodEndsAt?: string;
  reason?: string;
}

export interface ResetWorkspaceRequest {
  confirmWorkspaceId: string;
}

export interface CreateBackupJobRequest {
  reason?: string;
}

export interface CreateRestoreJobRequest {
  backupJobId: string;
  mode?: RestoreMode;
  reason?: string;
}

export interface PrepareWarmWorkspaceRequest {
  region?: WarmWorkspace["region"];
  plan?: WarmWorkspace["plan"];
  idempotencyKey?: string;
  note?: string;
}

export interface ClaimWarmWorkspaceRequest {
  accountId?: string;
  workspaceId?: string;
  reason?: string;
}

export interface RefillWarmWorkspaceRequest {
  targetReady?: number;
  maxCreate?: number;
  region?: WarmWorkspace["region"];
  plan?: WarmWorkspace["plan"];
}

export interface CompleteChatGptConnectionRequest {
  sessionId: string;
}

export interface UpdateWorkspaceStyleRequest {
  soulStyle?: WorkspaceSoulStyle;
  agentsStyle?: WorkspaceAgentsStyle;
  onboardingConfirmed?: boolean;
}

export function createApiClient({ baseUrl, token = "", fetchImpl = fetch }: ApiClientOptions) {
  const root = baseUrl.replace(/\/$/, "");

  async function request<T>(
    path: string,
    init: RequestInit = {},
    recoverError?: (status: number, body: string) => T | undefined,
  ): Promise<T> {
    const res = await fetchImpl(`${root}${path}`, {
      ...init,
      credentials: init.credentials ?? "same-origin",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init.headers ?? {}),
      },
    });

    if (!res.ok) {
      const body = await res.text();
      const recovered = recoverError?.(res.status, body);
      if (recovered !== undefined) return recovered;
      throw new Error(errorMessageFromResponseBody(body, res.status, res.statusText));
    }

    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  }

  function errorMessageFromResponseBody(body: string, status: number, statusText: string) {
    const fallback = `Request failed with ${status}${statusText ? ` ${statusText}` : ""}`;
    const text = body.trim();
    if (!text) return fallback;
    try {
      const data = JSON.parse(text) as Record<string, unknown>;
      if (typeof data.error === "string") return data.error;
      if (typeof data.message === "string") return data.message;
      if (typeof data.error === "object" && data.error && "message" in data.error && typeof data.error.message === "string") {
        return data.error.message;
      }
    } catch {
      // Non-JSON gateway responses are handled below.
    }
    if (/<(?:!doctype|html|head|body|script|div)\b/i.test(text)) return fallback;
    return text.length > 500 ? `${text.slice(0, 497)}...` : text;
  }

  function terminalChatGptCompletion(status: number, body: string): ChatGptConnectionCompleteResponse | undefined {
    if (status !== 404 && status !== 409 && status !== 502) return undefined;
    let payload: Partial<ChatGptConnectionCompleteResponse> = {};
    try {
      payload = JSON.parse(body) as Partial<ChatGptConnectionCompleteResponse>;
    } catch {
      // Terminal reconnect responses use fixed consumer-safe copy below.
    }
    const responseStatus =
      status === 502
        ? "blocked"
        : status === 409 && payload.status === "expired"
          ? "expired"
          : "error";
    return {
      status: responseStatus,
      provider: "chatgpt",
      aiConnection: null,
      message:
        status === 404
          ? "That sign-in session ended. Reconnect ChatGPT to try again."
          : status === 409
            ? "ChatGPT sign-in ended. Reconnect ChatGPT to try again."
            : "ChatGPT needs attention. Reconnect ChatGPT to try again.",
      providerReadiness: "reconnect_required",
      retryable: false,
    };
  }

  return {
    baseUrl: root,
    token,
    fetchImpl,
    login: (body: LoginRequest) =>
      request<AuthSession>("/auth/login", { method: "POST", body: JSON.stringify(body) }),
    nativeAuthConfig: (surface: HeyNativeAuthSurface) =>
      request<HeyNativeAuthConfig>(`/auth/native/config?surface=${encodeURIComponent(surface)}`),
    nativeAuthChallenge: (body: HeyNativeAuthChallengeRequest) =>
      request<{ expiresAt: string; id: string; nonce: string }>("/auth/native/challenge", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    nativeAuthSession: (body: HeyNativeAuthSessionRequest) =>
      request<HeyNativeAuthSession>("/auth/native/session", { method: "POST", body: JSON.stringify(body) }),
    redeemInvite: (body: RedeemAccountInviteRequest) =>
      request<RedeemAccountInviteResponse>("/invites/redeem", { method: "POST", body: JSON.stringify(body) }),
    completePasswordReset: (body: CompletePasswordResetRequest) =>
      request<AuthSession>("/auth/password-reset", { method: "POST", body: JSON.stringify(body) }),
    logout: () => request<{ ok: boolean }>("/auth/logout", { method: "POST" }),
    prepareHeyAccountDeletion: (body: HeyAccountDeletionAuthorityRequest) =>
      request<HeyAccountDeletionIntent>("/account/deletion/requests", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    cancelHeyAccountDeletion: (id: string, body: HeyAccountDeletionAuthorityRequest) =>
      request<{ cancelledAt: string; id: string; status: "cancelled" }>(
        `/account/deletion/requests/${encodeURIComponent(id)}`,
        { method: "DELETE", body: JSON.stringify(body) },
      ),
    reauthenticateHeyAccountDeletion: (body: HeyAccountDeletionAuthorityRequest & { credential?: string }) =>
      request<{ expiresAt: string; reauthenticationToken: string }>("/account/deletion/reauthenticate", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    confirmHeyAccountDeletion: (
      id: string,
      body: HeyAccountDeletionAuthorityRequest & {
        confirmationPhrase: string;
        reauthenticationToken: string;
      },
    ) => request<HeyAccountDeletionReceipt>(`/account/deletion/requests/${encodeURIComponent(id)}/confirm`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
    startupSnapshot: () => request<AppSnapshot>("/snapshot/startup"),
    snapshot: () => request<AppSnapshot>("/snapshot"),
    me: () => request<UserProfile>("/me"),
    updateMePreferences: (body: UpdateMePreferencesRequest) =>
      request<UserProfile>("/me/preferences", { method: "PATCH", body: JSON.stringify(body) }),
    hermesConversations: (query: { surface?: string; limit?: number } = {}) => {
      const params = new URLSearchParams();
      if (query.surface) params.set("surface", query.surface);
      if (query.limit) params.set("limit", String(query.limit));
      const suffix = params.toString() ? `?${params.toString()}` : "";
      return request<HermesConversationListResponse>(`/hermes/conversations${suffix}`);
    },
    changePassword: (body: ChangePasswordRequest) =>
      request<{ ok: boolean }>("/settings/password", { method: "POST", body: JSON.stringify(body) }),
    accounts: () => request<AlphaAccount[]>("/admin/accounts"),
    accountInvites: () => request<AccountInvite[]>("/admin/invites"),
    createAccountInvite: (body: CreateAccountInviteRequest) =>
      request<CreateAccountInviteResponse>("/admin/invites", { method: "POST", body: JSON.stringify(body) }),
    prepareAccountInviteServer: (id: string, body: { dryRun?: boolean; includeGStack?: boolean } = {}) =>
      request<AccountInvitePrepareResponse>(`/admin/invites/${id}/prepare-server`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    revokeAccountInvite: (id: string) =>
      request<AccountInvite>(`/admin/invites/${id}/revoke`, { method: "POST" }),
    createAccount: (body: CreateAccountRequest) =>
      request<AdminAccountResponse>("/admin/accounts", { method: "POST", body: JSON.stringify(body) }),
    updateAccount: (id: string, body: UpdateAccountRequest) =>
      request<AdminAccountResponse>(`/admin/accounts/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    createAccountPasswordReset: (id: string) =>
      request<PasswordResetCodeResponse>(`/admin/accounts/${id}/password-reset`, { method: "POST" }),
    deleteAccount: (id: string) => request<{ ok: boolean }>(`/admin/accounts/${id}`, { method: "DELETE" }),
    warmWorkspaces: () => request<WarmWorkspace[]>("/admin/warm-workspaces"),
    prepareWarmWorkspace: (body: PrepareWarmWorkspaceRequest = {}) =>
      request<WarmWorkspacePrepareResponse>("/admin/warm-workspaces", { method: "POST", body: JSON.stringify(body) }),
    refillWarmWorkspaces: (body: RefillWarmWorkspaceRequest = {}) =>
      request<WarmWorkspaceRefillResponse>("/admin/warm-workspaces/refill", { method: "POST", body: JSON.stringify(body) }),
    claimWarmWorkspace: (id: string, body: ClaimWarmWorkspaceRequest) =>
      request<WarmWorkspaceClaimResponse>(`/admin/warm-workspaces/${id}/claim`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    workspaceRuntime: (workspaceId: string) =>
      request<WorkspaceRuntime>(`/admin/workspaces/${workspaceId}/runtime`),
    workspaceProvisioningJobs: (workspaceId: string) =>
      request<ProvisioningJob[]>(`/admin/workspaces/${workspaceId}/provisioning-jobs`),
    requestWorkspaceRuntimeProvisioning: (workspaceId: string, body: ProvisionRequest) =>
      request<ProvisioningRequestResponse>(`/admin/workspaces/${workspaceId}/runtime/provision`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    provisioningJob: (id: string) => request<ProvisioningJob>(`/admin/provisioning-jobs/${id}`),
    updateWorkspaceAccess: (id: string, body: UpdateWorkspaceAccessRequest) =>
      request<WorkspaceAccessSummary>(`/admin/workspaces/${id}/access`, { method: "PATCH", body: JSON.stringify(body) }),
    resetWorkspace: (id: string, body: ResetWorkspaceRequest) =>
      request<WorkspaceSummary>(`/admin/workspaces/${id}/reset`, { method: "POST", body: JSON.stringify(body) }),
    entitlement: () => request<Entitlement>("/entitlement"),
    subscriptionState: () => request<SubscriptionStateView>("/billing/subscription-state"),
    revenueCatCheckout: (body: BillingCheckoutRequest) =>
      request<BillingCheckoutResponse>("/billing/revenuecat/checkout", { method: "POST", body: JSON.stringify(body) }),
    planChangePreview: (body: BillingPlanChangePreviewRequest) =>
      request<BillingPlanChangePreview>("/billing/plan-preview", { method: "POST", body: JSON.stringify(body) }),
    revenueCatEvents: () => request<RevenueCatWebhookEvent[]>("/billing/revenuecat/events"),
    topUps: () => request<TopUpSummary>("/billing/top-ups"),
    usage: () => request<UsageSummary>("/usage"),
    usageLimits: () => request<UsageLimitStatus>("/usage/limits"),
    usageLedger: (query: { limit?: number } = {}) => {
      const params = new URLSearchParams();
      if (query.limit) params.set("limit", String(query.limit));
      const suffix = params.toString() ? `?${params.toString()}` : "";
      return request<UsageLedgerEntry[]>(`/usage/ledger${suffix}`);
    },
    currentWorkspace: () => request<WorkspaceSummary>("/workspace/current"),
    providerStatus: () => request<ProviderStatusView>("/workspace/provider-status"),
    workspaceRuntimeSettings: () => request<WorkspaceRuntimeSettings>("/workspace/runtime-settings"),
    /** The name of the customer's own server, and the few facts that identify it. */
    workspaceServerIdentity: () => request<WorkspaceServerIdentity>("/workspace/server-identity"),
    heyHermesAdapter: () => request<HeyHermesAdapterManifest>("/workspace/hey-hermes-adapter"),
    materializeHeyHermesAdapter: () =>
      request<HeyHermesAdapterMaterialization | null>("/workspace/hey-hermes-adapter/materialize", { method: "POST" }),
    hermesRuntimeInventory: () => request<HermesRuntimeInventory>("/workspace/hermes-inventory"),
    previewRoute: (body: HeyHermesPreviewRouteRequest) =>
      request<HeyHermesPreviewRouteResponse>("/workspace/preview-routes", { method: "POST", body: JSON.stringify(body) }),
    publicRoute: (body: HeyHermesPublicRouteRequest) =>
      request<HeyHermesPublicRouteResponse>("/workspace/public-routes", { method: "POST", body: JSON.stringify(body) }),
    workspaceCapabilityInventory: () => request<WorkspaceCapabilityInventory>("/workspace/capability-inventory"),
    nativeCapabilities: () => request<NativeCapabilitiesView>("/workspace/native-capabilities"),
    honchoMemory: () => request<HonchoMemoryView>("/workspace/honcho-memory"),
    workspaceCapabilities: () => request<WorkspaceCapabilitySummary>("/workspace/capabilities"),
    preflightWorkspaceCapability: (body: WorkspaceCapabilityPreflightRequest) =>
      request<WorkspaceCapabilityPreflightResponse>("/workspace/capabilities/preflight", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    auditLogs: () => request<AuditLogEntry[]>("/workspace/audit"),
    notifications: () => request<NotificationRecord[]>("/notifications"),
    updateNotification: (id: string, body: { read?: boolean; dismissed?: boolean }) =>
      request<NotificationRecord>(`/notifications/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    notificationPreferences: () => request<NotificationPreferences>("/notification-preferences"),
    updateNotificationPreferences: (body: Partial<Omit<NotificationPreferences, "accountId" | "workspaceId" | "updatedAt">>) =>
      request<NotificationPreferences>("/notification-preferences", { method: "PATCH", body: JSON.stringify(body) }),
    mobilePushStatus: () => request<MobilePushStatus>("/mobile-push/status"),
    registerMobilePushSubscription: (body: RegisterMobilePushSubscriptionRequest) =>
      request<MobilePushStatus>("/mobile-push/subscriptions", { method: "POST", body: JSON.stringify(body) }),
    unregisterMobilePushSubscription: (body: { token: string }) =>
      request<MobilePushStatus>("/mobile-push/subscriptions", { method: "DELETE", body: JSON.stringify(body) }),
    sendMobilePushTest: () => request<MobilePushTestResponse>("/mobile-push/test", { method: "POST" }),
    automations: () => request<HermesAutomationsView>("/workspace/automations"),
    emailDeliveries: () => request<EmailDelivery[]>("/email-deliveries"),
    connectionTools: () => request<ConnectionToolCatalog>("/connections/tools"),
    connectionSetupRequests: () => request<ConnectionSetupRequest[]>("/connections/setup-requests"),
    createConnectionSetupRequest: (body: CreateConnectionSetupRequest) =>
      request<ConnectionSetupRequest>("/connections/request-setup", { method: "POST", body: JSON.stringify(body) }),
    updateConnectionSetupRequest: (id: string, body: { status: ConnectionSetupRequest["status"] }) =>
      request<ConnectionSetupRequest>(`/connections/setup-requests/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    approvals: (query: ApprovalListQuery = {}) => {
      const params = new URLSearchParams();
      if (query.status) params.set("status", query.status);
      if (query.kind) params.set("kind", query.kind);
      if (query.limit) params.set("limit", String(query.limit));
      const suffix = params.toString() ? `?${params.toString()}` : "";
      return request<ApprovalCard[]>(`/approvals${suffix}`);
    },
    createApproval: (body: CreateApprovalCardRequest) =>
      request<ApprovalCard>("/approvals", { method: "POST", body: JSON.stringify(body) }),
    decideApproval: (id: string, body: ApprovalDecisionRequest) =>
      request<ApprovalCard>(`/approvals/${id}/decision`, { method: "PATCH", body: JSON.stringify(body) }),
    agentMailbox: () => request<AgentMailbox>("/agent-mailbox"),
    agentMailboxMessages: () => request<AgentMailboxMessage[]>("/agent-mailbox/messages"),
    syncAgentMailboxMessages: (body: { maxMessages?: number; sinceDays?: number } = {}) =>
      request<AgentMailboxInboxSyncResponse>("/agent-mailbox/messages/sync", { method: "POST", body: JSON.stringify(body) }),
    createAgentMailboxMessage: (body: {
      toEmail: string;
      subject: string;
      body: string;
      purpose?: string;
      sendRequested?: boolean;
      approvalId?: string;
      runId?: string | null;
    }) => request<AgentMailboxMessage>("/agent-mailbox/messages", { method: "POST", body: JSON.stringify(body) }),
    recordAgentMailboxInboundMessage: (body: {
      fromEmail: string;
      toEmail?: string;
      subject: string;
      body?: string;
      bodyPreview?: string;
      providerMessageId?: string;
      receivedVia?: string;
    }) => request<AgentMailboxMessage>("/agent-mailbox/messages/inbound", { method: "POST", body: JSON.stringify(body) }),
    vaultNotes: (query: { query?: string; limit?: number } = {}) => {
      const params = new URLSearchParams();
      if (query.query) params.set("query", query.query);
      if (query.limit) params.set("limit", String(query.limit));
      const suffix = params.toString() ? `?${params.toString()}` : "";
      return request<VaultNotesResponse>(`/workspace/vault/notes${suffix}`);
    },
    vaultNote: (path: string) => request<VaultNote>(`/workspace/vault/notes/read?path=${encodeURIComponent(path)}`),
    vaultNotePreview: (body: VaultNotePreviewRequest) =>
      request<VaultNotePreviewResponse>("/workspace/vault/notes/preview", { method: "POST", body: JSON.stringify(body) }),
    vaultNoteApply: (body: VaultNoteApplyRequest) =>
      request<VaultNote>("/workspace/vault/notes/apply", { method: "POST", body: JSON.stringify(body) }),
    secureSecretEntryRequest: (requestId: string): Promise<SecureSecretEntryRequest> =>
      request<unknown>(`/secure-secrets/requests/${encodeURIComponent(requestId)}`)
        .then(secureSecretEntryRequestFrom),
    pendingSecureSecretEntryRequests: (conversationSessionId: string): Promise<SecureSecretEntryPendingRequest[]> => {
      const params = new URLSearchParams({ conversationSessionId });
      return request<unknown>(`/secure-secrets/requests/pending?${params.toString()}`).then((value) => {
        if (!Array.isArray(value) || value.length > 16) {
          throw new Error("Pending secure secret entry request list is invalid.");
        }
        const pending = value.map(secureSecretEntryPendingRequestFrom);
        if (pending.some((entry) => entry.conversationSessionId !== conversationSessionId)) {
          throw new Error("Pending secure secret entry request conversation binding is invalid.");
        }
        return pending;
      });
    },
    completeSecureSecretEntry: (requestId: string, body: { value: string }) =>
      request<unknown>(`/secure-secrets/requests/${encodeURIComponent(requestId)}/complete`, {
        method: "POST",
        body: JSON.stringify(body),
      }).then(secureSecretEntryMetadataFrom),
    cancelSecureSecretEntry: (requestId: string): Promise<SecureSecretEntryRequest> =>
      request<unknown>(`/secure-secrets/requests/${encodeURIComponent(requestId)}/cancel`, {
        method: "POST",
      }).then(secureSecretEntryRequestFrom),
    listSecureSecretEntries: (): Promise<SecureSecretEntryMetadata[]> =>
      request<unknown>("/secure-secrets").then((value) => {
        if (!Array.isArray(value)) throw new Error("Secure secret entry list is invalid.");
        return value.map(secureSecretEntryMetadataFrom);
      }),
    replaceSecureSecretEntry: (referenceId: string, body: { value: string }) =>
      request<unknown>(`/secure-secrets/${encodeURIComponent(referenceId)}/replace`, {
        method: "POST",
        body: JSON.stringify(body),
      }).then(secureSecretEntryMetadataFrom),
    deleteSecureSecretEntry: (referenceId: string) =>
      request<unknown>(`/secure-secrets/${encodeURIComponent(referenceId)}`, {
        method: "DELETE",
      }).then(secureSecretEntryMetadataFrom),
    workspaceFiles: () => request<WorkspaceTextFile[]>("/workspace/files"),
    managementAgentStatus: () => request<WorkspaceManagementAgentStatus>("/workspace/management-agent/status"),
    hermesDashboardRoute: () => request<HermesDashboardRoute>("/workspace/hermes-dashboard-route"),
    browserSessionHandoff: (body: BrowserSessionHandoffRequest) =>
      request<BrowserSessionHandoffResponse>("/auth/browser-session-handoff", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    runtimeParityReport: () => request<HermesRuntimeParityReport>("/workspace/runtime-parity"),
    modelOptions: () => request<ModelOptionsView>("/workspace/model-options"),
    setChatRoutePreference: (body: ChatRoutePreferenceRequest) =>
      request<ChatRoutePreferenceResponse>("/workspace/chat-route-preference", { method: "POST", body: JSON.stringify(body) }),
    setModelPreference: (modelId: string | null) =>
      request<ModelPreferenceResponse>("/workspace/model-preference", {
        method: "POST",
        body: JSON.stringify({ modelId }),
      }),
    workspaceStyle: () => request<WorkspaceStyleSettings>("/workspace/style"),
    updateWorkspaceStyle: (body: UpdateWorkspaceStyleRequest) =>
      request<WorkspaceStyleSettings>("/workspace/style", { method: "PATCH", body: JSON.stringify(body) }),
    workspaceTriagePolicy: () => request<WorkspaceTriagePolicy>("/workspace/triage-policy"),
    updateWorkspaceTriagePolicy: (body: WorkspaceTriagePolicyUpdate) =>
      request<WorkspaceTriagePolicy>("/workspace/triage-policy", { method: "PATCH", body: JSON.stringify(body) }),
    securityAccess: () => request<SecurityAccessOverview>("/workspace/security-access"),
    securityAuditReceipt: () => request<SecurityAuditReceipt>("/workspace/security-access/audit-receipt"),
    registerAdminPublicKey: (body: RegisterAdminPublicKeyRequest) =>
      request<SecurityAccessOverview>("/workspace/security-access/admin-key", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    runAdminHandover: () =>
      request<SecurityAccessOverview>("/workspace/security-access/handover/run", { method: "POST" }),
    adminHandoverStatus: () => request<SecurityAccessOverview["adminAccess"]>("/workspace/security-access/handover/status"),
    supportGrants: () => request<SupportGrant[]>("/support/grants"),
    createSupportGrant: (body: CreateSupportGrantRequest) =>
      request<SupportGrantCreateResponse>("/support/grants", { method: "POST", body: JSON.stringify(body) }),
    revokeSupportGrant: (id: string) => request<{ ok: boolean }>(`/support/grants/${id}`, { method: "DELETE" }),
    runSupportDiagnostics: (id: string, token: string) =>
      request<unknown>(`/support/grants/${id}/diagnostics`, {
        method: "POST",
        body: JSON.stringify({ token }),
      }),
    startTrial: () => request<Entitlement>("/trial/start", { method: "POST" }),
    provisionServer: (body: ProvisionRequest) =>
      request<{ server: WorkspaceServer; plan: ProvisionPlan }>("/servers/provision", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    currentServer: () => request<WorkspaceServer>("/servers/current"),
    recommendPills: (body: RecommendPillsRequest = {}) =>
      request<PillInstance[]>("/pills/recommend", { method: "POST", body: JSON.stringify(body) }),
    pill: (id: string) => request<PillVariant>(`/pills/${encodeURIComponent(id)}`),
    usePill: (id: string, body: UsePillRequest = {}) =>
      request<PillInstance>(`/pills/${encodeURIComponent(id)}/use`, { method: "POST", body: JSON.stringify(body) }),
    dismissPill: (id: string, body: DismissPillRequest = {}) =>
      request<PillInstance>(`/pills/${encodeURIComponent(id)}/dismiss`, { method: "POST", body: JSON.stringify(body) }),
    suggestions: (locale?: string) =>
      request<HeySuggestionsListResponse>(`/suggestions${locale ? `?locale=${encodeURIComponent(locale)}` : ""}`),
    suggestionHomeNudge: (body: { sessionId: string; locale?: string }) =>
      request<HeySuggestionHomeNudgeResponse>("/suggestions/home-nudge", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    transitionSuggestion: (id: string, type: HeySuggestionTransitionType) =>
      request<HeySuggestionTransitionResponse>(`/suggestions/${encodeURIComponent(id)}/state`, {
        method: "POST",
        body: JSON.stringify({ type }),
      }),
    chatSuggestions: () => request<ChatSuggestion[]>("/chat/suggestions"),
    useChatSuggestion: (id: string, body: UseChatSuggestionRequest = {}) =>
      request<ChatSuggestion>(`/chat/suggestions/${encodeURIComponent(id)}/use`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    bookmarks: () => request<WorkspaceBookmark[]>("/bookmarks"),
    createBookmark: (body: CreateWorkspaceBookmarkRequest) =>
      request<WorkspaceBookmark>("/bookmarks", { method: "POST", body: JSON.stringify(body) }),
    updateBookmark: (id: string, body: UpdateWorkspaceBookmarkRequest) =>
      request<WorkspaceBookmark>(`/bookmarks/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    archiveBookmark: (id: string) =>
      request<WorkspaceBookmark>(`/bookmarks/${id}`, { method: "DELETE" }),
    createBrowserResultCard: (body: CreateBrowserResultCardRequest) =>
      request<BrowserResultCard>("/runtime-adapter/browser-results", { method: "POST", body: JSON.stringify(body) }),
    saveBrowserResultBookmark: (id: string) =>
      request<BrowserResultCard>(`/browser-results/${encodeURIComponent(id)}/save-bookmark`, { method: "POST" }),
    rankedTasks: () => request<RankedTaskCollection>("/tasks/ranked"),
    /**
     * One customer decision about one ranked row: he finished it, or he took it
     * off his list. Nothing here deletes: a Kanban card keeps its card, and a
     * finding keeps its row, so either can be seen and put back.
     */
    updateRankedTask: (rankedItemId: string, body: RankedTaskRowUpdateRequest) =>
      request<unknown>(`/tasks/${encodeURIComponent(rankedItemId)}/ranking`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    /**
     * Undo a merge: every finding folded into this one comes back on the list.
     * Nothing was deleted to make the merge, so this puts rows back rather than
     * recreating them.
     */
    restoreRankedTaskMerge: (rankedItemId: string) => request<RankedTaskCollection>(
      `/tasks/ranked/merges/${encodeURIComponent(rankedItemId)}/restore`,
      { method: "POST", body: JSON.stringify({ confirmed: true }) },
    ),
    /**
     * The controls an automation the customer wrote themselves carries
     * (HPD-463). A shipped automation is paused through its own route below,
     * which keeps its installation record in step; only what the customer wrote
     * is addressed by native job id.
     *
     * Pause and resume take no Idempotency-Key: the route sets a state rather
     * than appending anything, so repeating it lands on the same state.
     * Deletion does take one, because it is not repeatable.
     */
    pauseHermesJob: (jobId: string) => request<HermesJobResponse>(
      `/hermes/jobs/${encodeURIComponent(jobId)}/pause`,
      { method: "POST" },
    ),
    resumeHermesJob: (jobId: string) => request<HermesJobResponse>(
      `/hermes/jobs/${encodeURIComponent(jobId)}/resume`,
      { method: "POST" },
    ),
    deleteHermesJob: (jobId: string, operationKey: string) => request<void>(
      `/hermes/jobs/${encodeURIComponent(jobId)}`,
      { method: "DELETE", headers: { "Idempotency-Key": operationKey } },
    ),
    rankedTaskAutomations: () => request<RankedTaskAutomationsView>("/ranked-tasks/automations"),
    updateRankedTaskAutomation: (
      role: RankedTaskAutomationRole,
      body: RankedTaskAutomationUpdate,
      operationKey: string,
    ) => request<RankedTaskAutomationView>(`/ranked-tasks/automations/${encodeURIComponent(role)}`, {
      method: "PATCH",
      headers: { "Idempotency-Key": operationKey },
      body: JSON.stringify(body),
    }),
    resetRankedTaskAutomation: (
      role: RankedTaskAutomationRole,
      operationKey: string,
    ) => request<RankedTaskAutomationView>(`/ranked-tasks/automations/${encodeURIComponent(role)}/reset`, {
      method: "POST",
      headers: { "Idempotency-Key": operationKey },
      body: JSON.stringify({ confirmed: true }),
    }),
    reinstallRankedTaskAutomation: (
      role: RankedTaskAutomationRole,
      operationKey: string,
    ) => request<RankedTaskAutomationView>(`/ranked-tasks/automations/${encodeURIComponent(role)}/reinstall`, {
      method: "POST",
      headers: { "Idempotency-Key": operationKey },
      body: JSON.stringify({ confirmed: true }),
    }),
    restoreRankedTaskAutomationVersion: (
      role: RankedTaskAutomationRole,
      version: number,
      operationKey: string,
    ) => request<RankedTaskAutomationView>(
      `/ranked-tasks/automations/${encodeURIComponent(role)}/versions/${encodeURIComponent(String(version))}/restore`,
      {
        method: "POST",
        headers: { "Idempotency-Key": operationKey },
        body: JSON.stringify({ confirmed: true }),
      },
    ),
    /** Every stored ranking, newest run first, and which one is being shown. */
    rankedTaskRankings: () => request<RankedTaskRankingHistory>("/ranked-tasks/rankings"),
    /**
     * Show an earlier stored ranking again. The customer's own ratings and
     * everything he marked done or deleted are left exactly as he set them, and
     * the ranking being replaced stays in the list, so this can be undone by
     * restoring that one.
     */
    restoreRankedTaskRanking: (runId: string, operationKey: string) => request<RankedTaskRankingHistory>(
      `/ranked-tasks/rankings/${encodeURIComponent(runId)}/restore`,
      {
        method: "POST",
        headers: { "Idempotency-Key": operationKey },
        body: JSON.stringify({ confirmed: true }),
      },
    ),
    refreshRankedTasks: (operationKey: string) => request<RankedTaskRefreshReceipt>("/ranked-tasks/refresh", {
      method: "POST",
      headers: { "Idempotency-Key": operationKey },
      body: JSON.stringify({}),
    }),
    tasks: () => request<KanbanTask[]>("/kanban/tasks"),
    taskSource: () =>
      request<{ source: string; label: string; hermesDefaultConnected: boolean; message: string }>("/tasks/source"),
    createTask: (body: CreateTaskRequest) =>
      request<KanbanTask>("/kanban/tasks", { method: "POST", body: JSON.stringify(body) }),
    updateTask: (id: string, body: UpdateTaskRequest) =>
      request<KanbanTask>(`/kanban/tasks/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    startIntegration: (kind: IntegrationKind) =>
      request<IntegrationStatus>(`/integrations/${kind}/start`, { method: "POST" }),
    saveIntegration: (kind: IntegrationKind, body: SaveIntegrationSettingsRequest) =>
      request<IntegrationStatus>(`/integrations/${kind}/settings`, { method: "PUT", body: JSON.stringify(body) }),
    resetIntegration: (kind: IntegrationKind) =>
      request<IntegrationStatus>(`/integrations/${kind}/settings`, { method: "DELETE" }),
    checkIntegration: (kind: IntegrationKind) =>
      request<IntegrationStatus>(`/integrations/${kind}/check`, { method: "POST" }),
    // HPD-499. Hands Hermes' own pairing code to Hermes' own approve endpoint.
    // Telegram is the only messaging platform this product sets up, so the
    // platform is fixed here rather than accepted from the client.
    approveTelegramPairing: (body: TelegramPairingApproveRequest) =>
      request<TelegramPairingApproveResult>("/integrations/telegram/pairing/approve", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    connectionReach: () => request<ConnectionReachView>("/workspace/connection-reach"),
    pluginCatalog: () => request<PluginCatalogView>("/plugins"),
    runPluginCatalogOperation: (itemId: string, operationId: string) =>
      request<PluginCatalogOperationResult>(
        `/plugins/${encodeURIComponent(itemId)}/operations/${encodeURIComponent(operationId)}`,
        { method: "POST", body: JSON.stringify({}) },
      ),
    authorizeGoogleConnection: (body: GoogleConnectionCredentials) =>
      request<GoogleConnectionResult>("/connections/google/authorize", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    gmailConnectionConfig: () => request<GmailOAuthBrowserConfig>("/connections/gmail/config"),
    gmailConnectionStatus: () => request<GmailConnectionStatus>("/connections/gmail/status"),
    completeGmailConnection: (body: GmailConnectionCompleteRequest) =>
      request<GmailConnectionStatus>("/connections/gmail/complete", {
        method: "POST",
        headers: { "X-Requested-With": "XmlHttpRequest" },
        body: JSON.stringify(body),
      }),
    startMobileGmailConnection: (body: GmailMobileOAuthStartRequest) =>
      request<GmailMobileOAuthStart>("/connections/gmail/mobile/start", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    completeMobileGmailConnection: (body: GmailMobileOAuthCompleteRequest) =>
      request<GmailConnectionStatus>("/connections/gmail/mobile/complete", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    disconnectGmail: () =>
      request<GmailDisconnectResult>("/connections/gmail", { method: "DELETE" }),
    createRealtimeVoiceSession: (body: RealtimeVoiceSessionRequest = {}) =>
      request<RealtimeVoiceSessionResponse>("/voice/realtime/session", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    transcribeVoiceNote: (body: VoiceTranscriptionRequest) =>
      request<VoiceTranscriptionResponse>("/voice/transcriptions", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    createVoiceSpeech: (body: VoiceSpeechRequest, init: RequestInit = {}) =>
      request<VoiceSpeechResponse>("/voice/speech", {
        ...init,
        method: "POST",
        body: JSON.stringify(body),
      }),
    startChatGptConnection: () =>
      request<ChatGptConnectionStartResponse>("/ai-connection/chatgpt/start", { method: "POST" }),
    completeChatGptConnection: (body: CompleteChatGptConnectionRequest) =>
      request<ChatGptConnectionCompleteResponse>("/ai-connection/chatgpt/complete", {
        method: "POST",
        body: JSON.stringify(body),
      }, terminalChatGptCompletion),
    claudeConnectionStatus: () => request<ClaudeConnectionStatus>("/ai-connection/claude"),
    startClaudeConnection: () =>
      request<ClaudeConnectionStartResponse>("/ai-connection/claude/start", { method: "POST" }),
    completeClaudeConnection: (body: { sessionId: string; code: string }) =>
      request<ClaudeConnectionCompleteResponse>("/ai-connection/claude/complete", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    updateApiKeys: (body: UpdateApiKeysRequest) =>
      request<ApiKeySettings>("/settings/api-keys", { method: "PUT", body: JSON.stringify(body) }),
    backupJobs: () => request<BackupJob[]>("/backup-jobs"),
    backupJob: (id: string) => request<BackupJob>(`/backup-jobs/${id}`),
    createExportJob: (body: CreateBackupJobRequest = {}) =>
      request<BackupJob>("/backup-jobs/export", { method: "POST", body: JSON.stringify(body) }),
    createArchiveJob: (body: CreateBackupJobRequest = {}) =>
      request<BackupJob>("/backup-jobs/archive", { method: "POST", body: JSON.stringify(body) }),
    restoreJobs: () => request<RestoreJob[]>("/restore-jobs"),
    restoreJob: (id: string) => request<RestoreJob>(`/restore-jobs/${id}`),
    createRestoreJob: (body: CreateRestoreJobRequest) =>
      request<RestoreJob>("/restore-jobs", { method: "POST", body: JSON.stringify(body) }),
    exportSettings: () => request<BackupJob>("/settings/export", { method: "POST" }),
  };
}
