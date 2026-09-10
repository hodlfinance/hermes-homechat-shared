import { isPreinstalledR8Suggestion } from "../policy";
import { modelComparisonPresentation, modelComparisonCopy } from "../core/index";
import { adminUiCopy, notificationDeliveryNotice } from "../core/admin-ui-copy";
import { connectionUiMessage, connectionPermissionLines as localizedConnectionPermissionLines } from "../core/connection-ui-copy";
import { staticUiCopy, staticUiMessage } from "./static-ui-copy";
import { supportAccessCopy, supportAccessOpenCount } from "../core/support-request";
import { capabilityCopy, capabilityStatusCopy } from "../core/capability-copy";
import { MobilePrivacySheet } from "./MobilePrivacySheet";
import { workspacePrivacyCopy } from "../ui/workspace-privacy-copy";
import { openPageStarter, consumePageStarter, pageStarterTranscript, pageStarterPayload, pageStarterAfterNavigation, type PageStarterState } from "../ui/page-starter-state";
import { pageStarterCopy } from "../ui/page-starter-copy";
import { MobilePageMenuRow } from "./mobile-page-menu-row";
import { pageMenuRemovalCopy } from "../ui/page-menu-copy";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  AccessibilityInfo,
  ActivityIndicator,
  Alert,
  AppState,
  Appearance,
  Clipboard,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  useColorScheme,
  type ImageStyle,
  type NativeScrollEvent,
} from "react-native";
import Svg, { Circle, Path, Rect } from "react-native-svg";
import {
  Activity,
  AlertTriangle,
  Bot,
  CalendarClock,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock3,
  Copy,
  ExternalLink,
  FileText,
  HardDrive,
  History,
  KeyRound,
  Download,
  LogOut,
  Lock,
  LockKeyhole,
  Mail,
  Menu,
  MessageSquare,
  Mic,
  Plus,
  PlugZap,
  RefreshCcw,
  Server,
  Send,
  ArrowUp,
  ShieldCheck,
  Square,
  Trash2,
  X,
  UserPlus,
} from "lucide-react-native";
import { accountPageCopy, chatRouteAutomationFollowState, heyChatRouteChoices, heyOfferedChatRoutes, personalAccessPresentation } from "../core/index";
import type {
  AlphaAccount,
  AppLocale,
  AppSnapshot,
  AssistantMessageSegmentKind,
  ChatGptConnectionStartResponse,
  ChatRoutePreference,
  ClaudeConnectionStartResponse,
  ClaudeConnectionStatus,
  ChatMessage,
  ChatLatencySummary,
  ChatRun,
  ChatRunEvent,
  ChatRunStatus,
  ChatSuggestion,
  HeySuggestionFilter,
  HeySuggestionView,
  CreateChatRunRequest,
  ConnectionSetupOrigin,
  WorkspaceServerIdentity,
  ConnectionSetupIntent,
  ConversationSession,
  ConnectionReachView,
  CuratedModelTruthItem,
  FirstConversationSnapshot,
  HermesAutomationsView,
  HermesDelegatedTask,
  HeyNativeAuthConfig,
  IntegrationKind,
  MobilePushStatus,
  ModelOptionsView,
  NativeCapabilityItem,
  NativeCapabilitiesView,
  RankedTaskCollection,
  SecurityAccessOverview,
  SharedHomechatVoiceState,
  WhatsAppPairingStatus,
} from "../core/index";
import {
  connectionSetupRunRequest,
  chatGptAccountConnectionView,
  heyChatRunStatusLabels,
  chatGptConnectionCompletionOutcome,
  chatRunEventFromHermesEvent,
  type createApiClient as CoreApiClientFactory,
  createHomechatClientController,
  createHomechatComposerController,
  createHomechatConversationController,
  createHomechatPagedState,
  createHomechatVoiceController,
  homechatTranscriptMessages,
  HEY_LEGAL_LINKS,
  HEY_SUGGESTION_FILTERS,
  heySuggestionAction,
  heySuggestionMatchesFilter,
  homechatVoiceTranscriptError,
  isSharedHomechatRunControllerError,
  isAllowedHeyLegalHref,
  runtimeBoundAccessView,
  shouldPollChatGptConnection,
} from "../core/index";
import {
  mobileAiAccessRouteLogoKey,
  mobileCuratedModelLogoKey,
  type MobileAiAccessLogoKey,
} from "./mobile-ai-access-logo";
import { MobileAiAccessBrandMark } from "./mobile-ai-access-brand-marks";
import {
  workspaceStatusTruthRequest,
  workspaceStatusTruthServerIsCurrent,
  workspaceStatusTruthServerRefreshDelayMs,
  workspaceStatusTruthSummary,
  statusPanelCopy,
  type WorkspaceStatusTruthView,
} from "../core/status-truth";
import type { createAnonymousSupportRequestClient as AnonymousSupportFactory, createSupportRequestClient as SupportFactory } from "../core/support-request";
import type { PluginCatalogAction, PluginCatalogItem, PluginCatalogView } from "../core/plugin-catalog";
import type {
  GuidedSetupConnectionChoice,
  GuidedSetupConnectionId,
  GuidedSetupPluginConnectionId,
  GuidedSetupState,
} from "../core/guided-setup";
import {
  createPluginChatFallbackController,
  type PluginChatFallbackProvider,
} from "../core/plugin-chat-fallback";
import { chatTranscriptScrollDecision } from "../ui/index";
import { palette as defaultPalette } from "./mobile-palette";
import { connectionRows } from "../core/connections-view";
import { googleConsentUrl } from "../core/google-consent";
import {
  HEY_TASKS_PAGE_HREF,
  heyAccountMenuNavigation,
} from "../ui/navigation-structure";
import { AccountDeletionSection } from "./AccountDeletionSection";
import { PluginCatalogScreen } from "./PluginCatalogScreen";
import {
  SecureConnectionCredentialForm,
  secureConnectionAskHermesPrefill,
  type SecureConnectionCredentialKind,
  type SecureConnectionPairing,
} from "./SecureConnectionCredentialForm";
import {
  mobileConnectionSecureEntryAfterClose,
  mobileConnectionSecureEntryAfterEvent,
  mobileConnectionSecureEntryContinuation,
  type MobileConnectionSecureEntryRequest,
} from "./mobile-connection-secure-entry";
import { SecureSecretEntryForm } from "./SecureSecretEntryForm";
import {
  createSecureSecretEntryResolutionGate,
  secureSecretEntryAfterClose,
  secureSecretEntryAfterDiscovery,
  secureSecretEntryAfterEvent,
  secureSecretEntryAfterResolution,
  secureSecretEntryAfterSnapshot,
  sameSecureSecretEntryRequest,
  secureSecretEntryCopy,
  type SecureSecretEntryRequest,
} from "../core/secure-secret-entry-view";
import { RankedTaskList } from "./RankedTaskList";
import { buildRankedTaskChatPrompt } from "../core/ranked-task-chat";
import type { RankedTaskListRow } from "../core/ranked-task-list-view";
import { AutomationCard, type AutomationCardCopy } from "./AutomationCard";
import {
  automationCardFromJob,
  automationCardFromManaged,
  type AutomationCardModel,
} from "./mobile-automation-card";
import type {
  RankedTaskAutomationRole,
  RankedTaskAutomationsView,
} from "../core/ranked-task-automations";
import {
  mobileAiAccessOauthCopy,
  mobileAiModelCopy,
  mobileDangerZoneText,
  mobileLocaleOptions,
  mobilePendingAccessCopy,
  mobileRankedTaskWords,
  mobileRouteAutomationFailureCopy,
  mobileSecurityStateWords,
  mobileStatusSummaryLanguage,
  mobileText,
  normalizeMobileLocale,
  type MobileAiModelCopy,
  type MobileChatCopy,
  type MobileSecurityStateWords,
  type MobileSystemPagesCopy,
} from "./appI18n";
import { isMobileAccountFullyReady } from "./mobile-product-access";
import {
  startMobileAiAccessOauth,
  type MobileAiAccessOauthStartOutcome,
} from "./mobile-ai-access-oauth-start";
import {
  initialMobileAiAccessState,
  mobileAiAccessActionResult as mobileAiAccessResultFromOutcome,
  mobileAiAccessBegin,
  mobileAiAccessCanPersistPreference,
  mobileAiAccessRowState,
  mobileAiAccessSettled,
  type MobileAiAccessActionOutcome,
  type MobileAiAccessProviderRoute,
  type MobileAiAccessState,
  type MobileAiAccessTruth,
} from "./mobile-ai-access-state";
import { clearStoredAudioResidue, speechAudioFilePrefix, speechAudioRoots } from "./audio-residue";

import { appendMobileChatLatencyTiming, createMobileHomechatEventStream } from "./homechat-stream";
import {
  createMobileQueuedFollowUpCollectionOwner,
  createMobileRunPresentationOwner,
  createMobileMessageIdempotencyKey,
  createMobileMessageSendGate,
  createMobileTerminalUpdateContinuation,
  mobileAttachmentVoiceComposerState,
  mobileBusySendIntent,
  mobileComposerActionState,
  mobileMessagesWithoutRun,
  reconcileMobileQueuedFollowUpTerminalState,
  mobileQueuedFollowUpHasStarted,
  mobileQueuedFollowUpBlocksComposer,
  mobileQueuedFollowUpNoticeActionState,
  mobileQueuedFollowUpNoticeVisible,
  mobileQueuedFollowUpShouldEnterTranscript,
  mobileQueuedFollowUpTerminalStatus,
  mobileFailedMessageHasCompleted,
  mobileFailedMessageRetryKey,
  mobileFailedMessageStage,
  mobileRunAttemptOutcome,
  mobileVoiceButtonDisabled,
  mobileVoiceNoteBlockedByPendingRun,
  type MobileFailedMessage,
  type MobileFailedMessageStage,
  type MobileMessageSource,
  type MobileQueuedFollowUpStatus,
  type MobileSendResult,
} from "./mobile-message-send";
import {
  mobileAttachmentBytes,
  mobileAttachmentPayload,
  validateMobileAttachmentSelection,
  type MobileAttachment,
} from "./mobile-attachments";
import {
  createMobileConfirmationDecisionGate,
  mobileNativeConfirmationView,
  type MobileConfirmationAction,
} from "./mobile-native-confirmation";
import { mobileAssistantLinkSegments } from "./mobile-message-links";
import { mobileMarkdownBlocks, type MobileMarkdownInlineSegment } from "./mobile-markdown";
import {
  mobileMessagesForFailedRunNotice,
  mobileRunOwnsEvent,
  reconcileMobileRunBoundMessages,
  mobileRunOwnsVisibleConversation,
} from "./mobile-run-binding";
import { persistNativeSessionToken, readNativeSessionToken } from "./mobile-session-storage";
import {
  initialMobileScrollIntent,
  mobileScrollIntentAfterContent,
  mobileScrollIntentAfterJump,
  mobileScrollIntentAfterScroll,
} from "./mobile-scroll-intent";
import {
  createMobileHomeChatSingleFlight,
  mobileHomeChatActiveRunRecovery,
  mobileHomeChatHydrationSelection,
  mobileHomeChatSnapshotSessionId,
} from "./mobile-home-chat-startup";
import {
  mobileActivitySymbol,
  mobileChatEmptyStateVisible,
  mobileAssistantContentView,
  mobileChatRunStatusAfter,
  mobileRunFailureIsExplained,
  mobileRunStatusFromTerminalEvent,
  type MobileRunActivityView,
} from "./mobile-chat-activity";
import { mobileLiveRunActivityView } from "./mobile-live-run-status";
import { delegatedTasksView, mobileDelegatedTaskIsTerminal } from "../core/delegated-tasks-view";
import {
  subthreadAfterConversationChange,
  subthreadHeader,
  type SubthreadOrigin,
} from "../core/subthread-view";
import {
  mobileChatSessionLoadAllowed,
  mobileDelegatedTaskCloseIntent,
  mobileDelegatedTaskForConversation,
  mobileSubthreadOriginAfterOpen,
} from "./mobile-subthread-view";
import {
  isPrivateMobileBrowserHref,
  mobileBrowserUrl,
  openMobileBrowserHref,
} from "./mobile-browser-session";
import {
  backupJobDownloadHref,
  prepareWorkspaceExportDownload,
  WorkspaceExportError,
} from "./mobile-workspace-export";
import {
  defaultMobileSecurityAccessOverview,
  mobileActiveGrantsRow,
  mobileAdminAccessRows,
  mobileBackupJobRows,
  mobileInfrastructureRows,
  mobileSecurityRowOutcome,
  mobileServerAccessDetail,
  mobileServerAccessEntries,
  mobileSecurityStatus,
  mobileSupportGrantDetail,
  mobileSupportGrants,
  type MobileSecurityOutcome,
} from "./mobile-security-access-view";
import { shareSecurityAuditReceiptFile } from "./mobile-security-receipt";
import { gmailOAuthDiagnostic, runMobileGmailOAuth } from "./mobile-gmail-oauth";
import {
  assertProductLocalSubscriptionState,
  mobilePersonalPurchaseCanStart,
  mobileSubscriptionAuthorityConfirmed,
  type MobilePurchasePlan,
  type MobileRevenueCatPackageId,
} from "./revenuecat-purchases";
import {
  iosPaywallCopy,
  iosPaywallView,
  openIosSubscriptionManagement,
  type IosPaywallStoreState,
} from "./ios-paywall";
import {
  isProductSessionAuthError,
  mobileChatGptConnectionCardView,
  mobileNoticeAfterDismiss,
  mobileNoticeKey,
  mobileRouteErrorAfterRaise,
  mobileRouteReadiness,
  mobileSelectedChatRoutePreference,
  mobileSessionNoticeAfterRaise,
  mobileSessionNoticeAfterSnapshot,
  mobileVisibleNotice,
  mobileVisibleRouteError,
  type MobileKeyedNotice,
  type MobileNoticeKind,
  type MobileNoticeOrigin,
  type MobileRouteError,
} from "./mobile-route-gate";
import {
  mobileHandledNotificationIdsAfter,
  mobileNotificationAction,
  mobileNotificationTargetFromData,
} from "./mobile-notification-target";
import { assistantSegmentStyleName } from "./mobile-message-style";
import { MobileSupportRequestForm } from "./SupportRequestForm";
import { createReduceMotionStore } from "./mobile-reduce-motion-store";
import { MobileWorkingDragon } from "./mobile-working-dragon";
import { MobileStatusShimmerText } from "./mobile-status-shimmer";
import {
  createMobileAccountActionState,
  mobileAccountActionFailed,
  mobileAccountActionRow,
  mobileAccountActionStarted,
  mobileAccountActionSucceeded,
  reconcileMobileAccountActionState,
  type MobileAccountActionIntent,
  type MobileAccountActionOperation,
  type MobileAccountActionState,
} from "./mobile-account-action";
import { MobileSystemRow, MobileSystemSection } from "./mobile-system-surface";
import {
  MobileSwipeRemoveRow,
  type MobileRemovableNavigationEntry,
} from "./mobile-swipe-remove-row";
import {
  initialMobileReadAloudState,
  mobileReadAloudAccountCleared,
  mobileReadAloudConversationChanged,
  mobileReadAloudFileExtension,
  mobileReadAloudMessageObserved,
  mobileReadAloudPlaybackStarted,
  mobileReadAloudPreferenceChanged,
  mobileReadAloudRequestFailed,
  mobileReadAloudRequestFinished,
  mobileReadAloudRequestIsCurrent,
  mobileReadAloudSpeechText,
  writeMobileReadAloudAudio,
  type MobileReadAloudState,
} from "./mobile-read-aloud";
import {
  initialMobileVoiceNoteState,
  mobileVoiceNoteDiscarded,
  mobileVoiceNoteRecordingStarted,
  mobileVoiceNoteTranscriptionAppended,
  mobileVoiceNoteTranscriptionFailed,
  mobileVoiceNoteTranscriptionRequested,
  mobileVoiceNoteTranscriptionStarted,
  type MobileVoiceNoteState,
} from "./mobile-voice-note";


import type { NativeR8Host, NativeAudioPlayer as AudioPlayer, NativeNotification } from "../host";

/**
 * R8 native implementation extracted from the accepted App89 source.
 * Instantiate once per product/session owner. Nothing here chooses an endpoint,
 * credential store or SDK; those are supplied by the host. Both products render
 * this same component. See r8-source.json for the extraction input.
 */
export function createNativeR8Surface(host: NativeR8Host) {
  const { StatusBar, SecureStore, Constants, Crypto, Notifications, DocumentPicker,
    ImagePicker, AppleAuthentication, Google, WebBrowser, createAudioPlayer,
    RecordingPresets, requestRecordingPermissionsAsync, setAudioModeAsync,
    useAudioRecorder, useAudioRecorderState, FileSystem } = host.platform;
  const brandIcon = host.identity.icon;
  const appCopy = host.identity.copy;
  const palette = { ...defaultPalette, ...host.theme };
  const createApiClient = host.transport.createApiClient;
  const createMobileHermesCanonicalClient = host.transport.createCanonicalClient;
  const createSupportRequestClient = host.transport.createSupportClient;
  const createAnonymousSupportRequestClient = host.transport.createAnonymousSupportClient;
  const expoFetch = host.transport.fetchStream;
  const { bindMobilePurchasesAccount, isMobilePurchaseCancelled,
    mobilePurchasesConfiguredForBuild, mobilePurchasesController } = host.purchases;
type Tab = "chat" | "suggestions" | "bookmarks" | "tasks" | "automations" | "ai_access" | "capabilities" | "connections_customer" | "account" | "support";
type AppearancePreference = "system" | "light" | "dark";
type StorageKind = "secure" | "local" | "memory";
type SettingsSection = "overview" | "account" | "support" | "privacy" | "connections" | "diagnostics";
type MobileForegroundNotificationContext = {
  tab: string;
  activeConversationSessionId: string | null;
};
type MobileForegroundNotificationNotice = {
  id: string;
  accountId: string | null;
  title: string;
  body: string;
  conversationSessionId: string | null;
  actionUrl: string | null;
};
type IntegrationPermissionLine = {
  title: string;
  detail: string;
};
type MobileLogEntry = {
  id: string;
  level: "info" | "error";
  message: string;
  detail?: string;
  createdAt: string;
};
type ChatRunEventMap = Record<string, ChatRunEvent[]>;
type RankedTaskLoadState =
  | { phase: "idle" }
  | { phase: "loading" }
  | { phase: "ready"; collection: RankedTaskCollection }
  | { phase: "error" };
type MobileQueuedFollowUpView = {
  createdAt: string | null;
  ownershipToken: number;
  conversationSessionId: string | null;
  content: string;
  runId: string | null;
  status: MobileQueuedFollowUpStatus;
};
type MobileQueuedFollowUpRef = {
  createdAt: string | null;
  abortController: AbortController;
  attachments?: CreateChatRunRequest["attachments"];
  content: string;
  conversationSessionId: string | null;
  connectionSetupIntent?: ConnectionSetupIntent;
  idempotencyKey: string;
  ownershipToken: number;
  runId: string | null;
  session: ReturnType<typeof createHomechatClientController<ChatMessage, ChatRun, CreateChatRunRequest>>;
  source: MobileMessageSource;
  status: MobileQueuedFollowUpStatus;
  terminalCleanupPending: boolean;
};

/**
 * HPD-415: one kind of support access, said the same way wherever it appears.
 * Minutes, and three named read-only rights.
 */
const mobileSupportAccessScopes = ["diagnostics.read", "logs.redacted.read", "service.status.read"] as const;

function mobileAccountActionIntents(snapshot: AppSnapshot | null): MobileAccountActionIntent[] {
  if (!snapshot) return [];
  const currentAccount = snapshot.accounts.find((account) => account.id === snapshot.me.id);
  const actions: MobileAccountActionIntent[] = [];
  if (currentAccount?.role === "owner") {
    actions.push({ kind: "invite_account" });
    for (const account of snapshot.accounts) {
      if (account.status !== "active") continue;
      actions.push({ accountId: account.id, kind: "reset_account_access" });
      if (account.role !== "owner") actions.push({ accountId: account.id, kind: "disable_account_access" });
    }
  }
  // HPD-415: the Support screen grants support access; the security panel under
  // Account is where it is shown and withdrawn, and that panel carries its own
  // per-row pending state. So only the grant belongs in this keyed set.
  actions.push({ kind: "create_support_pass" });
  return actions;
}

type MobilePurchasePhase = "idle" | "loading" | "ready" | "purchasing" | "restoring" | "error" | "unavailable";

let mobileForegroundNotificationContext: MobileForegroundNotificationContext = {
  tab: "chat",
  activeConversationSessionId: null,
};

function notificationStringDataValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function foregroundNotificationNoticeFromExpo(
  notification: NativeNotification,
  locale: AppLocale = "en",
): MobileForegroundNotificationNotice {
  const data = notification.request.content.data ?? {};
  const target = mobileNotificationTargetFromData(data);
  const title = notification.request.content.title || "Hey Hermes";
  const body = notification.request.content.body || adminUiCopy(locale)["New activity is ready."];
  return {
    id: target?.notificationId || notification.request.identifier || `${notification.date}`,
    accountId: target?.accountId ?? null,
    title,
    body,
    conversationSessionId:
      target?.conversationSessionId ?? notificationStringDataValue(data.conversationSessionId),
    actionUrl: notificationStringDataValue(data.actionUrl),
  };
}

function foregroundNotificationTargetsVisibleChat(
  notice: MobileForegroundNotificationNotice,
  context: MobileForegroundNotificationContext,
) {
  return Boolean(
    notice.conversationSessionId &&
      context.tab === "chat" &&
      context.activeConversationSessionId === notice.conversationSessionId,
  );
}

Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const notice = foregroundNotificationNoticeFromExpo(notification);
    const targetIsVisible = foregroundNotificationTargetsVisibleChat(notice, mobileForegroundNotificationContext);
    return {
      shouldPlaySound: !targetIsVisible,
      shouldSetBadge: !targetIsVisible,
      shouldShowBanner: false,
      shouldShowList: !targetIsVisible,
    };
  },
});

WebBrowser.maybeCompleteAuthSession();

function homeConversationSession(sessions: ConversationSession[]) {
  return sessions.find((session) => session.role === "home") ?? null;
}

function isChatRunCancelledError(error: unknown) {
  return isSharedHomechatRunControllerError(error, "cancelled");
}

function isChatRunStatus(value: string): value is ChatRunStatus {
  return value === "queued" || value === "running" || value === "waiting_for_approval" ||
    value === "completed" || value === "cancelled" || value === "failed";
}

const DEFAULT_API_BASE_URL = host.apiBaseUrl;
const GOOGLE_AUTH_CONFIG_PENDING_CLIENT_ID = "app.heyhermes.google-auth-config-pending";
const GOOGLE_SETUP_STEPS = [
  {
    title: "Create project",
    detail: "In Google Cloud, choose New project and give the private Hermes connection its own project.",
    check: "The new project name is visible in the project picker.",
  },
  {
    title: "Enable APIs",
    detail: "In APIs & Services, enable Gmail API, Google Calendar API, and Google Drive API.",
    check: "All three APIs show the Disable button, which means they are enabled.",
  },
  {
    title: "Configure the consent screen",
    detail: "Choose External as the user type and add your own Google account as the user.",
    check: "The Audience page shows External and your account is allowed.",
  },
  {
    title: "Publish the app",
    detail: "Choose Publish app and confirm In production; Testing access expires after seven days.",
    check: "Publishing status reads In production.",
  },
  {
    title: "Create credentials",
    detail: "Choose Create credentials, OAuth client ID, then Desktop app. Before consent, Google will warn about an ungeprüfte App.",
    check: "You have a client ID and client secret for the Desktop app.",
  },
  {
    title: "Consent (Zustimmen)",
    detail: "Open your OAuth authorization URL, continue through the announced warning, choose Allow, and copy the one-time code from the address bar.",
    check: "The address bar contains a code, and you have not pasted it into chat or a URL here.",
  },
];
const tokenStorageKey = "hey_hermes_alpha_token";
const legacyTokenStorageKey = "hermes_alpha_token";
const chatGptConnectionStorageKey = `${host.storageNamespace}_chatgpt_connection`;
const appearancePreferenceStorageKey = `${host.storageNamespace}_appearance`;
// Comfortably inside the server's native-auth challenge lifetime, so an open
// sign-in screen always holds a challenge the server will still accept.
const nativeAuthChallengeRefreshMs = 5 * 60_000;
const readRepliesAloudStorageKey = `${host.storageNamespace}_read_replies_aloud`;
const readAloudAutoplayWindowMs = 30_000;

type ApiBaseSource = "environment" | "appConfig" | "default";

type ApiBaseConfig = {
  url: string;
  source: ApiBaseSource;
  label: string;
  isLocal: boolean;
};

type MobileAppConfigExtra = {
  apiBaseUrl?: string;
};

function cleanApiBaseUrl(value?: string | null) {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  return trimmed.replace(/\/+$/, "");
}

function isLocalApiBase(url: string) {
  return url.includes("localhost") || url.includes("127.0.0.1") || url.includes("10.0.2.2");
}

function resolveApiBaseConfig(): ApiBaseConfig {
  const envUrl = null;
  const extra = Constants.expoConfig?.extra as MobileAppConfigExtra | undefined;
  const appConfigUrl = null;
  const url = envUrl || appConfigUrl || DEFAULT_API_BASE_URL;
  const source: ApiBaseSource = envUrl ? "environment" : appConfigUrl ? "appConfig" : "default";

  return {
    url,
    source,
    label:
      url === "https://heyhermes.app/api"
        ? "Hey Hermes"
        : source === "environment"
          ? "Hey Hermes from Expo settings"
          : source === "appConfig"
            ? "Hey Hermes"
            : "Hey Hermes",
    isLocal: isLocalApiBase(url),
  };
}

const apiBaseConfig = resolveApiBaseConfig();
const API_BASE = apiBaseConfig.url;
const AnonymousSupportRequestForm = MobileSupportRequestForm;

async function mobileFirstConversationRequest(
  api: { baseUrl: string; token: string },
): Promise<FirstConversationSnapshot> {
  return host.transport.firstConversation(api.token);
}

async function mobileGuidedSetupRequest(
  api: { baseUrl: string; token: string },
  mutation?: { kind: "skip" } | {
    kind: "choice";
    connectionId: GuidedSetupConnectionId;
    choice: Exclude<GuidedSetupConnectionChoice, "undecided">;
  } | {
    kind: "gmail_recommendation";
    action: "snooze" | "dismiss";
  },
): Promise<GuidedSetupState | null> {
  return host.transport.guidedSetup(api.token, mutation);
}

function mobilePushPlatform() {
  if (Platform.OS === "ios" || Platform.OS === "android" || Platform.OS === "web") return Platform.OS;
  return "unknown";
}

function easProjectId() {
  const constantsWithEas = Constants as typeof Constants & { easConfig?: { projectId?: string } };
  const extra = Constants.expoConfig?.extra as (MobileAppConfigExtra & { eas?: { projectId?: string } }) | undefined;
  return constantsWithEas.easConfig?.projectId || extra?.eas?.projectId || null;
}

function nativeBuildNumber() {
  const nativeVersion = Constants.nativeAppVersion || Constants.expoConfig?.version || null;
  const nativeBuild = Constants.nativeBuildVersion || null;
  return { nativeVersion, nativeBuild };
}

function firstConversationProviderName(provider: string) {
  const labels: Record<string, string> = {
    gmail: "Gmail",
    google_calendar: "Google Calendar",
    google_drive: "Google Drive",
    telegram: "Telegram",
  };
  return labels[provider] ?? provider;
}

const settingsSections: Array<{
  key: SettingsSection;
  label: string;
  hint: string;
  icon: typeof ShieldCheck;
  ownerOnly?: boolean;
}> = [
  { key: "overview", label: "Status & access", hint: "Chat status, refresh, sign out", icon: ShieldCheck },
  { key: "support", label: "Support & repair", hint: "Temporary, scoped support access", icon: KeyRound },
  { key: "privacy", label: "Privacy", hint: "How your private space is protected", icon: LockKeyhole },
  { key: "diagnostics", label: "Diagnostics", hint: "Build, API, and recent app errors", icon: Activity },
];

type MobileAccountMenuNavigationItem =
  | (typeof heyAccountMenuNavigation)[number]
  | Readonly<{ id: "connections"; label: "Connections" }>
  | Readonly<{ id: "support"; label: "Support" }>
  | Readonly<{ id: "privacy"; label: "Privacy" }>;

const mobileAccountMenuNavigation = heyAccountMenuNavigation.flatMap<MobileAccountMenuNavigationItem>((item) =>
  item.id === "ai_access"
    ? [item, { id: "connections", label: "Connections" } as const]
    : item.id === "dashboard"
      ? [{ id: "support", label: "Support" } as const, { id: "privacy", label: "Privacy" } as const, item]
      : [item],
);

function settingsSectionText(key: SettingsSection, copy: ReturnType<typeof mobileText>) {
  const sectionCopy = {
    overview: { label: copy.settings.overview, hint: copy.settings.overviewHint },
    account: { label: copy.settings.account, hint: copy.settings.accountHint },
    connections: { label: copy.settings.connections, hint: copy.settings.connectionsHint },
    support: { label: copy.settings.support, hint: copy.settings.supportHint },
    privacy: { label: copy.settings.privacy, hint: copy.settings.privacyHint },
    diagnostics: { label: copy.settings.diagnostics, hint: copy.settings.diagnosticsHint },
  };
  return sectionCopy[key];
}

async function canUseSecureStore() {
  try {
    return await SecureStore.isAvailableAsync();
  } catch {
    return false;
  }
}

function getLocalStorage() {
  try {
    return typeof window !== "undefined" && window.localStorage ? window.localStorage : null;
  } catch {
    return null;
  }
}

async function readStoredToken(): Promise<{ token: string | null; storage: StorageKind }> {
  return host.session.read();
}
async function persistToken(token: string): Promise<StorageKind> {
  return host.session.persist(token);
}
async function clearStoredToken() {
  return host.session.clear();
}

async function readStoredBoolean(key: string) {
  if (await canUseSecureStore()) {
    try {
      return (await SecureStore.getItemAsync(key)) === "1";
    } catch {
      return false;
    }
  }
  return getLocalStorage()?.getItem(key) === "1";
}

async function persistStoredBoolean(key: string, value: boolean) {
  if (await canUseSecureStore()) {
    try {
      await SecureStore.setItemAsync(key, value ? "1" : "0");
      return;
    } catch {
      // Fall through to web/local storage when available.
    }
  }
  getLocalStorage()?.setItem(key, value ? "1" : "0");
}

async function clearStoredBoolean(key: string) {
  if (await canUseSecureStore()) {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {
      // The in-memory preference is still cleared below and web storage is independent.
    }
  }
  getLocalStorage()?.removeItem(key);
}

async function readStoredString(key: string) {
  if (await canUseSecureStore()) {
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      // Fall through to web/local storage when available.
    }
  }
  return getLocalStorage()?.getItem(key) ?? null;
}

async function persistStoredString(key: string, value: string) {
  if (await canUseSecureStore()) {
    try {
      await SecureStore.setItemAsync(key, value);
      return;
    } catch {
      // Fall through to web/local storage when available.
    }
  }
  getLocalStorage()?.setItem(key, value);
}

async function persistChatGptConnection(connection: ChatGptConnectionStartResponse, workspaceId: string | null) {
  const value = JSON.stringify({ ...connection, workspaceId });
  if (await canUseSecureStore()) {
    try {
      await SecureStore.setItemAsync(chatGptConnectionStorageKey, value);
      return;
    } catch {
      // Fall through to web/local storage when available.
    }
  }
  getLocalStorage()?.setItem(chatGptConnectionStorageKey, value);
}

async function readStoredChatGptConnection(workspaceId: string) {
  let raw: string | null = null;
  if (await canUseSecureStore()) {
    try {
      raw = await SecureStore.getItemAsync(chatGptConnectionStorageKey);
    } catch {
      raw = null;
    }
  }
  raw = raw || getLocalStorage()?.getItem(chatGptConnectionStorageKey) || null;
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as ChatGptConnectionStartResponse & { workspaceId?: string | null };
    if (parsed.provider !== "chatgpt" || parsed.status !== "pending" || !parsed.sessionId || !parsed.userCode) {
      await clearStoredChatGptConnection();
      return null;
    }
    if (parsed.workspaceId && parsed.workspaceId !== workspaceId) {
      await clearStoredChatGptConnection();
      return null;
    }
    if (Date.parse(parsed.expiresAt) <= Date.now()) {
      await clearStoredChatGptConnection();
      return null;
    }
    return parsed;
  } catch {
    await clearStoredChatGptConnection();
    return null;
  }
}

async function clearStoredChatGptConnection() {
  if (await canUseSecureStore()) {
    try {
      await SecureStore.deleteItemAsync(chatGptConnectionStorageKey);
    } catch {
      // Local state is still cleared by the caller.
    }
  }
  getLocalStorage()?.removeItem(chatGptConnectionStorageKey);
}

function displayError(err: unknown, fallback: string) {
  if (!(err instanceof Error)) return fallback;
  let message = err.message;
  try {
    const parsed = JSON.parse(err.message) as { error?: string; message?: string };
    message = parsed.error || parsed.message || err.message;
  } catch {
    // Plain text errors are handled below.
  }
  const trimmed = message.replace(/\s+/g, " ").trim();
  if (!trimmed || /<(?:!doctype|html|head|body|script|div)\b/i.test(trimmed)) return fallback;
  return trimmed.length > 500 ? `${trimmed.slice(0, 497)}...` : trimmed;
}

function isConnectionError(message: string) {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("failed to fetch") ||
    normalized.includes("network request failed") ||
    normalized.includes("load failed") ||
    normalized.includes("networkerror")
  );
}

function connectionRetryText() {
  return apiBaseConfig.isLocal
    ? "Could not reach the local Hey Hermes test server. Start the local server, then try again."
    : "Could not reach Hey Hermes. Check your connection, then try again.";
}

function userFacingError(message: string) {
  if (isConnectionError(message)) return connectionRetryText();
  return message;
}

function sessionExpiredText() {
  return "Your saved sign-in has ended. Please sign in again.";
}

function chatGptCodeNoticeText(userCode: string, locale: AppLocale) {
  return connectionUiMessage(locale, 'Enter code {code} on ChatGPT, then come back here and tap "{button}".', {
    code: userCode,
    button: connectionUiMessage(locale, "I signed in", {}),
  });
}

function workspaceStateText(state: AppSnapshot["workspace"]["state"]) {
  switch (state) {
    case "active":
      return "Ready";
    case "degraded":
      return "Needs attention";
    case "provisioning":
      return "Getting ready";
    case "migrating":
      return "Moving safely";
    case "suspended":
      return "Paused";
    case "export_pending":
      return "Preparing export";
    case "deleted":
      return "Closed";
    case "trial_pool":
      return "Preparing";
    default:
      return "Checking";
  }
}

function serverStateText(state: AppSnapshot["server"]["state"]) {
  switch (state) {
    case "active":
      return "Online";
    case "degraded":
      return "Needs attention";
    case "provisioning":
      return "Getting ready";
    case "migrating":
      return "Moving";
    case "suspended":
      return "Paused";
    case "export_pending":
      return "Preparing export";
    case "deleted":
      return "Closed";
    case "trial_pool":
      return "Private pool";
    default:
      return "Checking";
  }
}

function accessStateText(snapshot: AppSnapshot) {
  if (snapshot.workspace.access.runtimeAccess === "suspended") return "Paused";
  if (snapshot.workspace.access.state === "grace_period") return "Still active";
  if (snapshot.workspace.access.state === "cancelled") return "Ending";
  return "Active";
}

function chatRunStatusText(status: ChatRunStatus) {
  // One list for both clients, so a customer who uses the app and the web
  // client is told the same thing about the same run.
  switch (status) {
    case "queued":
      return heyChatRunStatusLabels.queued;
    case "running":
      return heyChatRunStatusLabels.running;
    case "waiting_for_approval":
      return heyChatRunStatusLabels.waiting;
    case "completed":
      return heyChatRunStatusLabels.completed;
    case "cancelled":
      return heyChatRunStatusLabels.cancelled;
    case "failed":
      return heyChatRunStatusLabels.failed;
    default:
      return heyChatRunStatusLabels.unknown;
  }
}

function chatRunWaitText(startedAt: number, locale: AppLocale) {
  const unit = (value: number, name: "second" | "minute") => new Intl.NumberFormat(locale, { style: "unit", unit: name, unitDisplay: "narrow" }).format(value);
  const elapsedSeconds = Math.max(1, Math.round((Date.now() - startedAt) / 1000));
  if (elapsedSeconds < 60) return unit(elapsedSeconds, "second");
  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;
  return seconds ? `${unit(minutes, "minute")} ${unit(seconds, "second")}` : unit(minutes, "minute");
}

function chatRunProgressText(status: ChatRunStatus, startedAt: number, locale: AppLocale) {
  return `${staticUiMessage(locale, chatRunStatusText(status))}... ${chatRunWaitText(startedAt, locale)}`;
}

function sortChatRunEvents(events: ChatRunEvent[]) {
  return [...events].sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
}

function mergeChatRunEventMaps(current: ChatRunEventMap, incoming: ChatRunEventMap): ChatRunEventMap {
  const next = { ...current };
  for (const [runId, events] of Object.entries(incoming)) {
    if (!events.length) continue;
    const byId = new Map<string, ChatRunEvent>();
    for (const event of next[runId] ?? []) byId.set(event.id, event);
    for (const event of events) byId.set(event.id, event);
    next[runId] = compactMobileChatRunEventsForStorage(sortChatRunEvents([...byId.values()]));
  }
  return next;
}

function mergeChatRunEvents(current: ChatRunEventMap, runId: string, events?: ChatRunEvent[]): ChatRunEventMap {
  if (!events?.length) return current;
  return mergeChatRunEventMaps(current, { [runId]: events });
}

function chatEventPayloadString(event: ChatRunEvent, key: string) {
  const value = event.payload?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function compactMobileChatRunEventsForStorage(events: ChatRunEvent[]) {
  const compacted: ChatRunEvent[] = [];
  for (const event of events) {
    const eventKey = mobileLowValueGatewayEventKey(event) ?? mobileDuplicateChatEventKey(event);
    const previous = compacted.at(-1);
    if (eventKey && previous && (mobileLowValueGatewayEventKey(previous) ?? mobileDuplicateChatEventKey(previous)) === eventKey) continue;
    compacted.push(event);
  }
  return compacted;
}

function mobileLowValueGatewayEventKey(event: ChatRunEvent) {
  if (event.type !== "status") return null;
  const source = chatEventPayloadString(event, "source").toLowerCase();
  if (source !== "hermes_gateway") return null;
  const action = chatEventPayloadString(event, "action").toLowerCase();
  if (action && !action.includes("typing")) return null;
  const status = chatEventPayloadString(event, "status").toLowerCase();
  const label = chatEventPayloadString(event, "label").toLowerCase();
  const detail = chatEventPayloadString(event, "detail").toLowerCase();
  const text = `${label} ${detail}`.trim();
  const isTyping = status === "typing" || detail === "typing" || text.includes("gateway typing");
  const isEmptyGateway =
    label === "hermes gateway" &&
    (!detail || detail === "running" || detail === "typing" || detail === "hermes reported runtime activity.");
  if (!isTyping && !isEmptyGateway) return null;
  return [source, status || "status", label || "hermes gateway", detail || "activity"].join("|");
}

function mobileDuplicateChatEventKey(event: ChatRunEvent) {
  if (event.type === "message_delta") return null;
  return [
    event.type,
    chatEventPayloadString(event, "status").toLowerCase(),
    chatEventPayloadString(event, "label").toLowerCase(),
    chatEventPayloadString(event, "detail").toLowerCase(),
    chatEventPayloadString(event, "action").toLowerCase(),
    chatEventPayloadString(event, "error").toLowerCase(),
    chatEventPayloadString(event, "model").toLowerCase(),
    chatEventPayloadString(event, "provider").toLowerCase(),
    chatEventPayloadString(event, "content").toLowerCase(),
  ].join("|");
}


type WebClipboard = {
  writeText?: (text: string) => Promise<void>;
};

function getWebClipboard(): WebClipboard | null {
  if (typeof navigator === "undefined") return null;
  return "clipboard" in navigator ? (navigator.clipboard as WebClipboard) : null;
}

async function writeClipboardText(text: string) {
  const webClipboard = Platform.OS === "web" ? getWebClipboard() : null;
  if (webClipboard?.writeText) {
    await webClipboard.writeText(text);
    return true;
  }

  if (typeof Clipboard?.setString === "function") {
    Clipboard.setString(text);
    return true;
  }

  return false;
}

function integrationStateText(state: AppSnapshot["integrations"][number]["state"], locale: AppLocale = "en"): string {
  switch (state) {
    case "connected":
      return staticUiMessage(locale, "Connected");
    case "configured":
      return staticUiMessage(locale, "Saved");
    case "setup_required":
      return staticUiMessage(locale, "Connect");
    case "attention":
      return staticUiMessage(locale, "Check");
    case "not_connected":
      return staticUiMessage(locale, "Connect");
    default:
      return staticUiMessage(locale, "Checking");
  }
}

type IntegrationStatus = AppSnapshot["integrations"][number];

function integrationCanReset(integration: IntegrationStatus) {
  return (
    integration.secrets.some((secret) => secret.saved) ||
    integration.state === "attention" ||
    integration.state === "configured" ||
    integration.state === "connected"
  );
}

function integrationSecretText(secret: IntegrationStatus["secrets"][number], locale: AppLocale) {
  if (!secret.saved) return secret.optional ? staticUiCopy(locale)["Optional"] : staticUiCopy(locale)["Not saved yet"];
  return secret.hint ? staticUiCopy(locale)["Saved privately as {hint}"].replace("{hint}", () => secret.hint ?? "") : staticUiCopy(locale)["Saved privately"];
}

function integrationCanSave(
  integration: IntegrationStatus,
  drafts: {
    telegramBotToken: string;
    whatsappAccessToken: string;
    whatsappPhoneNumberId: string;
    whatsappPairingPlaceholder: string;
    emailSmtpUrl: string;
    emailImapUrl: string;
    emailFromAddress: string;
  },
) {
  if (integration.kind === "telegram") return Boolean(drafts.telegramBotToken.trim());
  if (integration.kind === "whatsapp") {
    return Boolean(
      drafts.whatsappAccessToken.trim() ||
        drafts.whatsappPhoneNumberId.trim() ||
        drafts.whatsappPairingPlaceholder.trim(),
    );
  }
  return Boolean(drafts.emailSmtpUrl.trim() || drafts.emailImapUrl.trim() || drafts.emailFromAddress.trim());
}

function integrationPermissionLines(kind: IntegrationKind, locale: AppLocale): IntegrationPermissionLine[] {
  return localizedConnectionPermissionLines(kind, locale);
}

function formatCheckTime(value: string | null) {
  if (!value) return "Not checked yet";
  return new Date(value).toLocaleString();
}

/**
 * HPD-411: the same short date the browser prints in Security & Access, said
 * in the interface language rather than in the device's.
 */
function formatSecurityDate(value: string, locale: AppLocale) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(locale, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * HPD-416: a ranked task said its time as the raw instant the server sent —
 * "Implied time: 2026-08-23 08:00:00 UTC" — on an account set to German. It
 * now reads in the interface language, like every other date the app prints.
 */
function formatRankedTaskDate(value: string, locale: AppLocale) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function alphaNeedsAttention(snapshot: AppSnapshot) {
  return (
    snapshot.workspace.state === "degraded" ||
    snapshot.server.state === "degraded" ||
    snapshot.workspace.access.runtimeAccess === "suspended"
  );
}

function bookmarkUrlForMobile(href: string) {
  return mobileBrowserUrl(API_BASE, href);
}

function mobileMessageUrl(href: string) {
  const value = href.trim();
  if (!value) return null;
  if (/^(https?:|mailto:|tel:)/i.test(value)) return value;
  if (value.startsWith("/")) return bookmarkUrlForMobile(value);
  if (value.startsWith("www.")) return `https://${value}`;
  if (/^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}(?:[/:?#]|$)/i.test(value)) return `https://${value}`;
  return null;
}

function isPublicPageHref(href: string) {
  return /^\/api\/public\/workspace-routes\/pub_/i.test(href);
}

function isPrivatePreviewHref(href: string) {
  return isPrivateMobileBrowserHref(href);
}

function privatePreviewRouteFromHref(href: string) {
  try {
    const url = new URL(href, API_BASE);
    const match = url.pathname.match(/^\/api\/workspace\/preview\/(\d+)(\/.*)?$/i);
    if (!match) return null;
    const port = Number(match[1]);
    if (!Number.isInteger(port) || port <= 0) return null;
    return { port, path: `${match[2] || "/"}${url.search || ""}` };
  } catch {
    return null;
  }
}

function bookmarkDisplayTitle(title: string) {
  const trimmed = title.trim();
  const withoutLeadingDecoration = trimmed
    .replace(/^[\p{Extended_Pictographic}\p{Emoji_Presentation}\p{Regional_Indicator}\uFE0F\u200D\s]+/u, "")
    .trim();
  return withoutLeadingDecoration || trimmed;
}

function voiceMimeTypeForPlatform() {
  if (Platform.OS === "web") return "audio/webm";
  return "audio/mp4";
}

function formatVoiceDuration(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function formatMessageTime(createdAt: string, locale: AppLocale) {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit" }).format(date);
}

function latestAssistantMessage(messages: ChatMessage[]) {
  return messages.reduce<ChatMessage | null>((latest, message) => {
    if (message.role !== "assistant") return latest;
    if (!latest) return message;
    return new Date(message.createdAt).getTime() > new Date(latest.createdAt).getTime() ? message : latest;
  }, null);
}

async function speakAssistantReply(
  api: ReturnType<typeof CoreApiClientFactory>,
  markdown: string,
  playerRef: { current: AudioPlayer | null },
  shouldPlay: () => boolean,
  callbacks: {
    maxAutoPlayDelayMs?: number;
    requestedAt?: number;
    signal?: AbortSignal;
    onPlaybackStart?: () => void;
    onPlaybackDone?: () => void;
    onSubscription?: (subscription: { remove: () => void }) => void;
  } = {},
) {
  const text = mobileReadAloudSpeechText(markdown);
  if (!text) return false;
  const speech = await api.createVoiceSpeech({ text, format: "mp3" }, { signal: callbacks.signal });
  const deadlineStartedAt =
    typeof callbacks.requestedAt === "number" && Number.isFinite(callbacks.requestedAt) ? callbacks.requestedAt : Date.now();
  const maxAutoPlayDelayMs = callbacks.maxAutoPlayDelayMs;
  const deadlineExpired = () =>
    typeof maxAutoPlayDelayMs === "number" &&
    Number.isFinite(maxAutoPlayDelayMs) &&
    Date.now() - deadlineStartedAt > maxAutoPlayDelayMs;
  const stillAllowedToContinue = () => !callbacks.signal?.aborted && shouldPlay();
  const stillAllowedToStart = () => stillAllowedToContinue() && !deadlineExpired();
  if (!stillAllowedToStart()) return false;
  const written = await speechAudioSource(
    speech.audioBase64,
    speech.mimeType,
    stillAllowedToStart,
  );
  if (written.cleanupFailed) {
    throw new Error("A cancelled spoken reply could not remove its temporary audio file.");
  }
  if (!written.source || !stillAllowedToStart()) return false;
  const source = written.source;
  if (!playerRef.current) {
    playerRef.current = createAudioPlayer(source);
  } else {
    playerRef.current.pause();
    playerRef.current.replace(source);
  }
  if (!stillAllowedToStart()) {
    playerRef.current.pause();
    return false;
  }
  let started = false;
  let doneCalled = false;
  const finish = () => {
    if (doneCalled) return;
    doneCalled = true;
    callbacks.onPlaybackDone?.();
  };
  const stopIfStale = () => {
    if (started ? stillAllowedToContinue() : stillAllowedToStart()) return false;
    playerRef.current?.pause();
    finish();
    return true;
  };
  callbacks.onSubscription?.(
    playerRef.current.addListener("playbackStatusUpdate", (status) => {
      if (status.playing) {
        if (stopIfStale()) return;
        if (!started) {
          started = true;
          callbacks.onPlaybackStart?.();
        }
      }
      if (status.didJustFinish || (!status.playing && !status.isBuffering && status.currentTime > 0)) {
        finish();
      }
    }),
  );
  playerRef.current.play();
  if (stopIfStale()) return false;
  return true;
}

async function speechAudioSource(
  audioBase64: string,
  mimeType: string,
  isCurrent: () => boolean,
) {
  if (Platform.OS === "web") {
    return {
      cleanupFailed: false,
      source: isCurrent() ? `data:${mimeType};base64,${audioBase64}` : null,
    };
  }
  const root = speechAudioRoots(FileSystem)[0];
  if (!root) {
    return {
      cleanupFailed: false,
      source: isCurrent() ? `data:${mimeType};base64,${audioBase64}` : null,
    };
  }
  const uri = `${root}${speechAudioFilePrefix}${Date.now()}.${mobileReadAloudFileExtension(mimeType)}`;
  return writeMobileReadAloudAudio({
    audioBase64,
    fileSystem: {
      deleteAsync: (fileUri, options) => FileSystem.deleteAsync(fileUri, options),
      writeAsStringAsync: (fileUri, audio) => FileSystem.writeAsStringAsync(
        fileUri,
        audio,
        { encoding: FileSystem.EncodingType.Base64 },
      ),
    },
    isCurrent,
    uri,
  });
}

function diagnosticsText(entries: MobileLogEntry[], snapshot: AppSnapshot | null) {
  const header = [
    `Hey Hermes mobile diagnostics`,
    `API: ${API_BASE}`,
    `API source: ${apiBaseConfig.source}`,
    `Workspace: ${snapshot?.workspace.id ?? "not loaded"}`,
    `Account: ${snapshot?.me.email ?? "not signed in"}`,
  ];
  const lines = entries.length
    ? entries.map((entry) => `[${entry.createdAt}] ${entry.level.toUpperCase()} ${entry.message}${entry.detail ? ` - ${entry.detail}` : ""}`)
    : ["No local app errors recorded in this session."];
  return [...header, "", ...lines].join("\n");
}

function NativeR8Surface({ initialDraft = "", navigationRequest }: { initialDraft?: string; navigationRequest?: { conversationId: string; requestId: string; onAccepted?: ((id: string) => void) | null } } = {}) {
  const systemColorScheme = useColorScheme();
  const reduceMotion = useReduceMotion();
  const [token, setToken] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<AppSnapshot | null>(null);
  const [productAccessRefreshing, setProductAccessRefreshing] = useState(false);
  const [tab, setTab] = useState<Tab>("chat");
  const [settingsSection, setSettingsSection] = useState<SettingsSection | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [appLocale, setAppLocale] = useState<AppLocale>("en");
  const t = mobileText(appLocale);
  const accountPage = accountPageCopy(appLocale);
  const systemPageCopy = t.systemPages;
  const [appearancePreference, setAppearancePreference] = useState<AppearancePreference>("system");
  const resolvedColorScheme = appearancePreference === "system" ? (systemColorScheme ?? "light") : appearancePreference;
  const [email, setEmail] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signedOutSupportOpen, setSignedOutSupportOpen] = useState(false);
  const [authEntryMode, setAuthEntryMode] = useState<"sign_in" | "create_account">("sign_in");
  const [nativeAuthConfig, setNativeAuthConfig] = useState<HeyNativeAuthConfig | null>(null);
  const [nativeAuthBusy, setNativeAuthBusy] = useState<"apple" | "google" | null>(null);
  const [appleSignInAvailable, setAppleSignInAvailable] = useState(false);
  const [googleChallenge, setGoogleChallenge] = useState<{ id: string; mode: "link" | "login"; nonce: string } | null>(null);
  const [googleChallengeVersion, setGoogleChallengeVersion] = useState(0);
  const nativeAuthModeRef = useRef<"link" | "login">("login");
  const [input, setInput] = useState(initialDraft);
  const inputRef = useRef(input);
  inputRef.current = input;
  const [accountName, setAccountName] = useState("");
  const [accountEmail, setAccountEmail] = useState("");
  const [adminNotice, setAdminNotice] = useState<string | null>(null);
  const [supportReason, setSupportReason] = useState<string | null>(null);
  const [supportMinutes, setSupportMinutes] = useState("30");
  const [supportToken, setSupportToken] = useState<string | null>(null);
  const [accountActionState, setAccountActionState] = useState<MobileAccountActionState>(() =>
    createMobileAccountActionState([]),
  );
  const accountActionStateRef = useRef(accountActionState);
  accountActionStateRef.current = accountActionState;
  const [telegramBotToken, setTelegramBotToken] = useState("");
  // HPD-499. The pairing code Hermes' bot sends an unrecognised sender, and the
  // one line the card shows back after Hermes answers.
  const [telegramPairingCode, setTelegramPairingCode] = useState("");
  const [telegramPairingNotice, setTelegramPairingNotice] = useState<string | null>(null);
  const [whatsappAccessToken, setWhatsappAccessToken] = useState("");
  const [whatsappPhoneNumberId, setWhatsappPhoneNumberId] = useState("");
  const [whatsappPairingPlaceholder, setWhatsappPairingPlaceholder] = useState("");
  const [whatsappPairingStatus, setWhatsappPairingStatus] = useState<WhatsAppPairingStatus>("pairing_requested");
  const [secureConnectionEntryRequest, setSecureConnectionEntryRequest] = useState<MobileConnectionSecureEntryRequest | null>(null);
  const secureConnectionEntryRequestRef = useRef<MobileConnectionSecureEntryRequest | null>(null);
  const secureConnectionEntrySaveRef = useRef<string | null>(null);
  const [secureSecretEntryRequest, setSecureSecretEntryRequest] = useState<SecureSecretEntryRequest | null>(null);
  const secureSecretEntryRequestRef = useRef<SecureSecretEntryRequest | null>(null);
  const [secureSecretEntryBusyId, setSecureSecretEntryBusyId] = useState<string | null>(null);
  const [secureSecretEntryReceipt, setSecureSecretEntryReceipt] = useState<{
    conversationSessionId: string;
    text: string;
  } | null>(null);
  const namedConnectionSetupBusyRef = useRef(false);
  const [emailSmtpUrl, setEmailSmtpUrl] = useState("");
  const [emailImapUrl, setEmailImapUrl] = useState("");
  const [emailFromAddress, setEmailFromAddress] = useState("");
  const [integrationNotice, setIntegrationNotice] = useState<string | null>(null);
  const [resettingIntegration, setResettingIntegration] = useState<IntegrationKind | null>(null);
  const [connectionReach, setConnectionReach] = useState<ConnectionReachView | null>(null);
  const [connectionReachBusy, setConnectionReachBusy] = useState(false);
  const [connectionReachError, setConnectionReachError] = useState<string | null>(null);
  const [firstConversationSnapshot, setFirstConversationSnapshot] = useState<FirstConversationSnapshot | null>(null);
  const [guidedSetupState, setGuidedSetupState] = useState<GuidedSetupState | null>(null);
  const [gmailRecommendationBusy, setGmailRecommendationBusy] = useState(false);
  const [gmailRecommendationError, setGmailRecommendationError] = useState<string | null>(null);
  const guidedSetupRequestRef = useRef(0);
  const [guidedSetupPluginTarget, setGuidedSetupPluginTarget] = useState<GuidedSetupPluginConnectionId | null>(null);
  const [pluginCatalog, setPluginCatalog] = useState<PluginCatalogView | null>(null);
  const [pluginCatalogBusy, setPluginCatalogBusy] = useState(false);
  const [pluginCatalogAttempted, setPluginCatalogAttempted] = useState(false);
  const [pluginCatalogError, setPluginCatalogError] = useState<string | null>(null);
  const [pluginCatalogNotice, setPluginCatalogNotice] = useState<string | null>(null);
  const [pluginCatalogBusyActionKey, setPluginCatalogBusyActionKey] = useState<string | null>(null);
  const [pluginCatalogManagementTarget, setPluginCatalogManagementTarget] = useState<string | null>(null);
  const connectionReachRequestRef = useRef(0);
  const pluginChatFallbackRef = useRef<ReturnType<typeof createPluginChatFallbackController> | null>(null);
  const [googleConnectionClientId, setGoogleConnectionClientId] = useState("");
  const [googleClientSecret, setGoogleClientSecret] = useState("");
  const [googleAuthorizationCode, setGoogleAuthorizationCode] = useState("");
  const [googleRedirectUri, setGoogleRedirectUri] = useState("http://127.0.0.1:1");
  const [appError, setAppErrorState] = useState<MobileRouteError | null>(null);
  const [dismissedAppErrorKey, setDismissedAppErrorKey] = useState<string | null>(null);
  const [dismissedSessionNoticeKey, setDismissedSessionNoticeKey] = useState<string | null>(null);
  const noticeSequenceRef = useRef(0);
  const [bookmarkNotice, setBookmarkNotice] = useState<string | null>(null);
  const [bookmarkActionId, setBookmarkActionId] = useState<string | null>(null);
  const [rankedTaskState, setRankedTaskState] = useState<RankedTaskLoadState>({ phase: "idle" });
  const [taskNotice, setTaskNotice] = useState<"load_error" | "change_error" | null>(null);
  const rankedTaskRequestRef = useRef(0);
  const [nativeCapabilities, setNativeCapabilities] = useState<NativeCapabilitiesView | null>(null);
  const [nativeCapabilitiesBusy, setNativeCapabilitiesBusy] = useState(false);
  const [nativeCapabilitiesError, setNativeCapabilitiesError] = useState<string | null>(null);
  const [automationsView, setAutomationsView] = useState<HermesAutomationsView | null>(null);
  const [automationsBusy, setAutomationsBusy] = useState(false);
  const [automationsError, setAutomationsError] = useState<string | null>(null);
  const [rankedTaskAutomationsView, setRankedTaskAutomationsView] = useState<RankedTaskAutomationsView | null>(null);
  const [rankedTaskAutomationsBusy, setRankedTaskAutomationsBusy] = useState(false);
  const [rankedTaskAutomationsError, setRankedTaskAutomationsError] = useState<string | null>(null);
  const automationsAutoLoadKeyRef = useRef<string | null>(null);
  const [dashboardOpenState, setDashboardOpenState] = useState<"idle" | "opening" | "error">("idle");
  const [exportDownloadState, setExportDownloadState] = useState<"idle" | "preparing">("idle");
  const [exportDownloadNotice, setExportDownloadNotice] = useState<string | null>(null);
  // HPD-411: the full archive, the past exports, and the security evidence the
  // browser has always shown. The notices stay separate from the export notice
  // so one failing action never overwrites the other one's answer.
  const [archiveState, setArchiveState] = useState<"idle" | "queueing">("idle");
  const [backupDownloadJobId, setBackupDownloadJobId] = useState<string | null>(null);
  const [securityOutcome, setSecurityOutcome] = useState<MobileSecurityOutcome | null>(null);
  const [securityBusy, setSecurityBusy] = useState<
    "admin_key" | "handover" | "receipt" | "anchor" | null
  >(null);
  const [revokingSupportGrantId, setRevokingSupportGrantId] = useState<string | null>(null);
  const [adminPublicKeyInput, setAdminPublicKeyInput] = useState("");
  const [adminPublicKeyLabel, setAdminPublicKeyLabel] = useState("");
  const [modelOptions, setModelOptions] = useState<ModelOptionsView | null>(null);
  const [modelSelectionBusyId, setModelSelectionBusyId] = useState<string | null>(null);
  const [modelSelectionError, setModelSelectionError] = useState<{ modelId: string; message: string } | null>(null);
  const modelSelectionRequestRef = useRef(0);
  const [workspaceStatusTruth, setWorkspaceStatusTruth] = useState<WorkspaceStatusTruthView | null>(null);
  const [claudeStatus, setClaudeStatus] = useState<ClaudeConnectionStatus | null>(null);
  const [claudeConnection, setClaudeConnection] = useState<ClaudeConnectionStartResponse | null>(null);
  const [claudeCode, setClaudeCode] = useState("");
  const [aiAccessNotice, setAiAccessNotice] = useState<string | null>(null);
  const [aiAccessAutomationFailure, setAiAccessAutomationFailure] = useState<ChatRoutePreference | null>(null);
  const [aiAccessRefreshing, setAiAccessRefreshing] = useState(false);
  const [aiAccessRefreshError, setAiAccessRefreshError] = useState<string | null>(null);
  const [aiAccessState, setAiAccessState] = useState<MobileAiAccessState>(initialMobileAiAccessState);
  const aiAccessStateRef = useRef(aiAccessState);
  aiAccessStateRef.current = aiAccessState;
  const pendingAiAccessRouteRef = useRef<MobileAiAccessProviderRoute | null>(null);
  const [mobilePushStatus, setMobilePushStatus] = useState<MobilePushStatus | null>(null);
  const [mobilePushNotice, setMobilePushNotice] = useState<string | null>(null);
  const [foregroundNotification, setForegroundNotification] = useState<MobileForegroundNotificationNotice | null>(null);
  const [handledNotificationIds, setHandledNotificationIds] = useState<string[]>([]);
  const [pendingNotificationNotice, setPendingNotificationNotice] = useState<MobileForegroundNotificationNotice | null>(null);
  const [mobilePushBusy, setMobilePushBusy] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatEventsByRunId, setChatEventsByRunId] = useState<ChatRunEventMap>({});
  /**
   * Runs whose failure the plane explained. The "That reply never arrived" card
   * with its Retry button is what we show when we do not know why a reply is
   * missing. When the plane does know -- the included AI is used up -- the
   * reason already stands in the transcript as the assistant message, and the
   * card beside it says something else about the same event while offering a
   * retry that cannot work. HPD-533.
   *
   * A ref, not state: the failure handler runs inside a closure that would read
   * a stale copy of `chatEventsByRunId`.
   */
  const explainedRunFailuresRef = useRef<Set<string>>(new Set());
  const [chatRunStatusesById, setChatRunStatusesById] = useState<Record<string, ChatRunStatus>>({});
  const [delegatedTasks, setDelegatedTasks] = useState<HermesDelegatedTask[]>([]);
  const [subthreadOrigin, setSubthreadOrigin] = useState<SubthreadOrigin | null>(null);
  const [messagesNextBefore, setMessagesNextBefore] = useState<string | null>(null);
  const [loadingOlderMessages, setLoadingOlderMessages] = useState(false);
  const [chatSessions, setChatSessions] = useState<ConversationSession[]>([]);
  const [activeConversationSessionId, setActiveConversationSessionId] = useState<string | null>(null);
  const [chatSessionsOpen, setChatSessionsOpen] = useState(false);
  const [chatSessionsBusy, setChatSessionsBusy] = useState(false);
  const [chatSessionNotice, setChatSessionNotice] = useState<string | null>(null);
  // Sub threads the customer has closed. They stay closed for this session; the
  // server list is unchanged, so nothing is destroyed by putting one away.
  const [dismissedDelegatedTaskIds, setDismissedDelegatedTaskIds] = useState<readonly string[]>([]);
  const [stoppingDelegatedTaskIds, setStoppingDelegatedTaskIds] = useState<readonly string[]>([]);
  const [busy, setBusy] = useState(false);
  // HPD-434: the list of past exports is a record, not the point of the screen.
  const [exportsOpen, setExportsOpen] = useState(false);
  // HPD-443: "your own server" needs a name the customer can recognise.
  const [pageStarter, setPageStarter] = useState<PageStarterState>(null);
  const pageStarterRef = useRef<PageStarterState>(null);
  const pageEntryBusy = useRef(false);
  const pageEntryGeneration = useRef(0);
  const pageTabRef = useRef(tab);
  pageTabRef.current = tab;
  const pageEntryTokenRef = useRef(token);
  pageEntryTokenRef.current = token;
  useEffect(() => { pageStarterRef.current = null; setPageStarter(null); }, [token]);
  const pageWorkspaceRef = useRef(snapshot?.workspace.id);
  pageWorkspaceRef.current = snapshot?.workspace.id;
  useEffect(() => {
    if (tab !== "chat") pageEntryGeneration.current += 1;
    const next = pageStarterAfterNavigation(pageStarterRef.current, { workspaceId: snapshot?.workspace.id ?? "", conversationId: activeConversationSessionId ?? "" }, tab === "chat");
    pageStarterRef.current = next;
    setPageStarter(next);
  }, [tab, activeConversationSessionId, snapshot?.workspace.id, token]);
  function consumePageEntry() { pageEntryGeneration.current += 1; const next = consumePageStarter(pageStarterRef.current); pageStarterRef.current = next; setPageStarter(next); }
  async function openPageEntry() {
    if (pageEntryBusy.current || !snapshot) return;
    pageEntryBusy.current = true;
    const workspaceId = snapshot.workspace.id;
    const entryToken = token;
    const entryGeneration = pageEntryGeneration.current;
    const hasDraft = Boolean(input.trim() || pendingAttachments.length);
    try {
      const opened = await openMobileHomeChat({ force: true, preserveDraft: true });
      const conversationId = activeConversationSessionIdRef.current;
      if (!opened || !conversationId || pageWorkspaceRef.current !== workspaceId || pageEntryTokenRef.current !== entryToken || pageEntryGeneration.current !== entryGeneration) return;
      const next = openPageStarter(pageStarterRef.current, { workspaceId, conversationId }, hasDraft, messagesStateRef.current.at(-1)?.id ?? null);
      jumpToLatestMobileMessage();
      pageStarterRef.current = next;
      setPageStarter(next);
    } finally { pageEntryBusy.current = false; }
  }
  const [privacyWorkspace, setPrivacyWorkspace] = useState<string | null>(null);
  useEffect(() => setPrivacyWorkspace(null), [token]);
  const [serverIdentity, setServerIdentity] = useState<WorkspaceServerIdentity | null>(null);
  const [busyLabel, setBusyLabel] = useState<string | null>(null);
  const [chatPendingText, setChatPendingText] = useState<string | null>(null);
  const [chatStreamingText, setChatStreamingText] = useState("");
  const [activeChatRunId, setActiveChatRunId] = useState<string | null>(null);
  const [chatSuggestions, setChatSuggestions] = useState<ChatSuggestion[]>([]);
  const [heySuggestions, setHeySuggestions] = useState<HeySuggestionView[]>([]);
  const [heySuggestionFilter, setHeySuggestionFilter] = useState<HeySuggestionFilter>("all");
  const [heySuggestionNudge, setHeySuggestionNudge] = useState<HeySuggestionView | null>(null);
  const [heySuggestionBusyId, setHeySuggestionBusyId] = useState<string | null>(null);
  const [heySuggestionNotice, setHeySuggestionNotice] = useState<string | null>(null);
  const [failedMessage, setFailedMessage] = useState<MobileFailedMessage | null>(null);
  const [pendingAttachments, setPendingAttachments] = useState<MobileAttachment[]>([]);
  const [attachmentNotice, setAttachmentNotice] = useState<string | null>(null);
  const [attachmentBusy, setAttachmentBusy] = useState(false);
  const [confirmationDecisionRuns, setConfirmationDecisionRuns] = useState<Record<string, boolean>>({});
  const [queuedFollowUps, setQueuedFollowUps] = useState<MobileQueuedFollowUpView[]>([]);
  const [copyNotice, setCopyNotice] = useState<string | null>(null);
  const [voiceNoteState, setVoiceNoteState] = useState<SharedHomechatVoiceState>({
    error: null,
    permission: "unknown",
    phase: "idle",
  });
  const [voiceNoteDraft, setVoiceNoteDraft] = useState<MobileVoiceNoteState>(initialMobileVoiceNoteState);
  const [readAloudState, setReadAloudState] = useState<MobileReadAloudState>(initialMobileReadAloudState);
  const [diagnosticLog, setDiagnosticLog] = useState<MobileLogEntry[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sessionRestored, setSessionRestored] = useState(false);
  const [sessionNotice, setSessionNoticeState] = useState<MobileKeyedNotice | null>(null);
  const [mobilePurchasePhase, setMobilePurchasePhase] = useState<MobilePurchasePhase>("idle");
  const [mobilePurchasePlans, setMobilePurchasePlans] = useState<MobilePurchasePlan[]>([]);
  const [mobilePurchaseAccountReady, setMobilePurchaseAccountReady] = useState(false);
  const [mobilePurchaseNotice, setMobilePurchaseNotice] = useState<string | null>(null);
  const [mobilePurchaseCompletion, setMobilePurchaseCompletion] = useState<{
    accountId: string;
    expirationAt: string | null;
  } | null>(null);
  const [chatGptConnection, setChatGptConnection] = useState<ChatGptConnectionStartResponse | null>(null);
  const [dismissedChatGptPanelKey, setDismissedChatGptPanelKey] = useState<string | null>(null);
  const [dismissedAiAccessChatGptSessionId, setDismissedAiAccessChatGptSessionId] = useState<string | null>(null);
  const [dismissedAiAccessClaudeSessionId, setDismissedAiAccessClaudeSessionId] = useState<string | null>(null);
  const selectedChatRoutePreference = snapshot
    ? mobileSelectedChatRoutePreference(snapshot.chatRoutePreference, modelOptions?.chatRoutePreference)
    : null;
  const error = mobileVisibleRouteError(appError, selectedChatRoutePreference, dismissedAppErrorKey)?.message ?? null;
  const visibleSessionNotice = mobileVisibleNotice(sessionNotice, dismissedSessionNoticeKey)?.message ?? null;
  const messagesScrollRef = useRef<ScrollView | null>(null);
  const messagesContentHeightRef = useRef(0);
  const messagesViewportHeightRef = useRef(0);
  const messagesScrollOffsetRef = useRef(0);
  const mobileScrollIntentRef = useRef(initialMobileScrollIntent);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const preserveMessagesScrollRef = useRef(false);
  // Anchoring the transcript to its first row belongs to one moment only: the
  // page of older messages that gets put above it. Left switched on the rest of
  // the time, every later growth of the transcript added its own height to the
  // scroll offset, and a freshly hydrated chat came to rest past its last
  // message — a white screen over a conversation that was fully loaded.
  const [preserveMessagesScroll, setPreserveMessagesScroll] = useState(false);
  const copyNoticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resumingChatRunRef = useRef<string | null>(null);
  const voiceNoteDraftRef = useRef<MobileVoiceNoteState>(initialMobileVoiceNoteState);
  const voiceRecordingUriRef = useRef<string | null>(null);
  const voiceOperationGenerationRef = useRef(0);
  const voiceCompletionInFlightRef = useRef(false);
  const readAloudStateRef = useRef<MobileReadAloudState>(initialMobileReadAloudState);
  const speechPlayerRef = useRef<AudioPlayer | null>(null);
  const speechPlayerSubscriptionRef = useRef<{ remove: () => void } | null>(null);
  const readAloudAbortRef = useRef<AbortController | null>(null);
  const readAloudRequestIdRef = useRef(0);
  const readAloudStorageGenerationRef = useRef(0);
  const readAloudStorageQueueRef = useRef<Promise<void>>(Promise.resolve());
  const messagesStateRef = useRef<ChatMessage[]>([]);
  const confirmationDecisionGate = useMemo(() => createMobileConfirmationDecisionGate(), []);
  const secureSecretEntryResolutionGate = useMemo(() => createSecureSecretEntryResolutionGate(), []);
  const chatLatencyRef = useRef<{
    startedAt: number;
    runId: string | null;
    route: ChatLatencySummary["route"];
    summary: ChatLatencySummary;
    reported: boolean;
    reporting: boolean;
    reportScheduled: boolean;
    terminalFlushTimer: ReturnType<typeof setTimeout> | null;
    sawFirstDelta: boolean;
    terminalObserved: boolean;
    firstVisibleRecorded: boolean;
    firstVisibleScheduled: boolean;
  } | null>(null);
  const activeChatAbortRef = useRef<AbortController | null>(null);
  const activeHomechatRunSessionRef = useRef<ReturnType<typeof createHomechatClientController<ChatMessage, ChatRun, CreateChatRunRequest>> | null>(null);
  const queuedFollowUpRef = useRef(new Map<number, MobileQueuedFollowUpRef>());
  const previousConversationSessionIdRef = useRef<string | null>(null);
  const hasHydratedReadAloudMessagesRef = useRef(false);
  const registeredMobilePushTokenRef = useRef<string | null>(null);
  const mobilePushRegistrationAttemptedRef = useRef(false);
  const handledNotificationIdsRef = useRef<string[]>([]);
  const signedInAccountIdRef = useRef<string | null>(null);
  const workspaceStatusTruthRequestRef = useRef(0);
  const workspaceStatusTruthPollRef = useRef(0);
  const workspaceStatusTruthRef = useRef<WorkspaceStatusTruthView | null>(null);
  const workspaceStatusTruthScheduleRef = useRef<((next: WorkspaceStatusTruthView | null) => void) | null>(null);
  const accountSessionGenerationRef = useRef(0);
  const accountSessionTokenRef = useRef<string | null>(token);
  const activeConversationSessionIdRef = useRef<string | null>(null);
  const conversationSelectionVersionRef = useRef(0);
  const chatSessionLoadVersionRef = useRef<number | null>(null);
  const refreshGenerationRef = useRef(0);
  const snapshotEnrichmentRequestRef = useRef(0);
  const snapshotStateRef = useRef<AppSnapshot | null>(null);
  const heySuggestionSessionIdRef = useRef(`ios-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const heySuggestionNudgeWorkspaceRef = useRef<string | null>(null);
  signedInAccountIdRef.current = snapshot?.me.id ?? null;
  activeConversationSessionIdRef.current = activeConversationSessionId;
  snapshotStateRef.current = snapshot;

  function latencyNow() {
    return typeof performance !== "undefined" && typeof performance.now === "function" ? performance.now() : Date.now();
  }

  async function flushMobileChatLatency(state = chatLatencyRef.current) {
    if (!state || state.reported || state.reporting || !state.terminalObserved || !state.runId || !token) return;
    if (state.summary.outcome === "success" && !state.firstVisibleRecorded) return;
    state.reporting = true;
    state.reportScheduled = false;
    if (state.terminalFlushTimer) clearTimeout(state.terminalFlushTimer);
    state.terminalFlushTimer = null;
    try {
      await host.transport.reportLatency(token, state.runId, state.summary);
      state.reported = true;
    } catch {
      // Diagnostics never alter chat delivery.
    } finally {
      state.reporting = false;
    }
  }

  function scheduleMobileChatLatencyFlush(state = chatLatencyRef.current) {
    if (!state || state.reported || state.reportScheduled) return;
    state.reportScheduled = true;
    if (state.summary.outcome === "success" && !state.firstVisibleRecorded) {
      state.terminalFlushTimer = setTimeout(() => flushMobileChatLatency(state), 500);
      return;
    }
    state.terminalFlushTimer = setTimeout(() => flushMobileChatLatency(state), 0);
  }

  function recordMobileChatLatency(timing: Partial<ChatLatencySummary>, state = chatLatencyRef.current) {
    if (!state || state.reported) return;
    try {
      const summaryTiming = timing.completionMs === undefined
        ? timing
        : {
            deltaCount: state.summary.deltaCount ?? 0,
            interDeltaP50Ms: state.summary.interDeltaP50Ms ?? 0,
            interDeltaP95Ms: state.summary.interDeltaP95Ms ?? 0,
            maxGapMs: state.summary.maxGapMs ?? 0,
            ...timing,
            completionMs: Math.max(0, latencyNow() - state.startedAt),
          };
      const ready = appendMobileChatLatencyTiming(state, summaryTiming);
      if (summaryTiming.completionMs !== undefined) scheduleMobileChatLatencyFlush(state);
      if (summaryTiming.firstVisiblePaintMs !== undefined && ready) flushMobileChatLatency(state);
    } catch {
      // Diagnostics never alter chat delivery.
    }
  }

  function beginMobileChatLatency(route: ChatRoutePreference) {
    const state = {
      startedAt: latencyNow(),
      runId: null,
      route,
      summary: {
        action: "chat.latency.summary" as const,
        schema: "hey.chat.latency.v1" as const,
        clockDomain: "mobile_client" as const,
        channel: "hey_hermes_mobile" as const,
        route,
      },
      reported: false,
      reporting: false,
      reportScheduled: false,
      terminalFlushTimer: null,
      sawFirstDelta: false,
      terminalObserved: false,
      firstVisibleRecorded: false,
      firstVisibleScheduled: false,
    };
    chatLatencyRef.current = state;
    return state;
  }

  function recordFirstVisibleMobileToken() {
    const state = chatLatencyRef.current;
    if (!state || state.firstVisibleRecorded || state.firstVisibleScheduled) return;
    state.firstVisibleScheduled = true;
    requestAnimationFrame(() => {
      state.firstVisibleScheduled = false;
      if (chatLatencyRef.current !== state || state.firstVisibleRecorded) return;
      state.firstVisibleRecorded = true;
      const durationMs = Math.max(0, latencyNow() - state.startedAt);
      recordMobileChatLatency({ firstVisiblePaintMs: durationMs });
    });
  }

  const commitVoiceNoteDraft = useCallback((next: MobileVoiceNoteState) => {
    voiceNoteDraftRef.current = next;
    setVoiceNoteDraft(next);
  }, []);

  const commitReadAloudState = useCallback((next: MobileReadAloudState) => {
    readAloudStateRef.current = next;
    setReadAloudState(next);
  }, []);

  function activateAccountSession(nextToken: string | null) {
    accountSessionGenerationRef.current += 1;
    accountSessionTokenRef.current = nextToken;
    workspaceStatusTruthRequestRef.current += 1;
    rankedTaskRequestRef.current += 1;
    modelSelectionRequestRef.current += 1;
    setModelSelectionBusyId(null);
    setModelSelectionError(null);
    setAiAccessRefreshing(false);
    setAiAccessRefreshError(null);
    setAiAccessAutomationFailure(null);
  }

  function accountSessionIsCurrent(generation: number, requestToken: string) {
    return accountSessionGenerationRef.current === generation && accountSessionTokenRef.current === requestToken;
  }

  function voiceOperationIsCurrent(operationGeneration: number, accountGeneration: number) {
    return voiceOperationGenerationRef.current === operationGeneration &&
      accountSessionGenerationRef.current === accountGeneration;
  }

  function enqueueReadAloudStorageOperation(operation: () => Promise<void>) {
    const queued = readAloudStorageQueueRef.current
      .catch(() => undefined)
      .then(operation);
    readAloudStorageQueueRef.current = queued.catch(() => undefined);
    return queued;
  }

  function commitWorkspaceStatusTruth(next: WorkspaceStatusTruthView | null) {
    workspaceStatusTruthRef.current = next;
    setWorkspaceStatusTruth(next);
    workspaceStatusTruthScheduleRef.current?.(next);
  }
  const messageSendGate = useMemo(() => createMobileMessageSendGate(), []);
  const queuedFollowUpOwner = useMemo(() => createMobileQueuedFollowUpCollectionOwner(), []);
  const mobileRunPresentationOwner = useMemo(() => createMobileRunPresentationOwner(), []);
  const homeChatRefreshSingleFlight = useMemo(() => createMobileHomeChatSingleFlight(), []);
  const mobileNotificationContextRef = useRef<MobileForegroundNotificationContext>({
    tab: "chat",
    activeConversationSessionId: null,
  });
  const setAppError = useCallback((
    message: string | null,
    owner: string | null = null,
    routePreference: ChatRoutePreference | null = null,
  ) => {
    const freshKey = mobileNoticeKey("appError", (noticeSequenceRef.current += 1));
    setAppErrorState((previous) => mobileRouteErrorAfterRaise(previous, { message, owner, routePreference }, freshKey));
  }, []);

  const setSessionNotice = useCallback((
    message: string | null,
    origin: MobileNoticeOrigin | null = null,
    kind: MobileNoticeKind | null = null,
  ) => {
    const freshKey = mobileNoticeKey("sessionNotice", (noticeSequenceRef.current += 1));
    setSessionNoticeState((previous) => mobileSessionNoticeAfterRaise(previous, message, freshKey, origin, kind));
  }, []);

  const selectActiveConversationSession = useCallback((
    sessionId: string | null,
    source: "explicit" | "preserve_version" | "run_created" = "explicit",
  ) => {
    if (source === "explicit") conversationSelectionVersionRef.current += 1;
    if (source !== "run_created" && activeConversationSessionIdRef.current !== sessionId) {
      // Navigation changes presentation, not the native run. The old observer
      // may finish later, but cannot clear the next conversation's activity.
      mobileRunPresentationOwner.invalidate();
      resumingChatRunRef.current = null;
      setActiveChatRunId(null);
      setChatPendingText(null);
      setChatStreamingText("");
      setBusy(false);
      setBusyLabel(null);
    }
    activeConversationSessionIdRef.current = sessionId;
    setActiveConversationSessionId(sessionId);
    setSubthreadOrigin((current) => subthreadAfterConversationChange(current, sessionId));
  }, []);

  function dismissAppError() {
    setDismissedAppErrorKey(mobileNoticeAfterDismiss(appError, dismissedAppErrorKey));
  }

  function dismissSessionNotice() {
    setDismissedSessionNoticeKey(mobileNoticeAfterDismiss(sessionNotice, dismissedSessionNoticeKey));
  }

  const api = useMemo(() => createApiClient({ baseUrl: API_BASE, token: token || "missing" }), [token]);
  const loadRankedTasks = useCallback(async () => {
    if (!host.policy.preinstalledRanker || !token) return;
    const requestToken = token;
    const sessionGeneration = accountSessionGenerationRef.current;
    const requestId = ++rankedTaskRequestRef.current;
    setRankedTaskState({ phase: "loading" });
    setTaskNotice(null);
    try {
      const collection = await api.rankedTasks();
      if (
        rankedTaskRequestRef.current !== requestId ||
        accountSessionGenerationRef.current !== sessionGeneration ||
        accountSessionTokenRef.current !== requestToken
      ) return;
      setRankedTaskState({ phase: "ready", collection });
    } catch {
      if (
        rankedTaskRequestRef.current !== requestId ||
        accountSessionGenerationRef.current !== sessionGeneration ||
        accountSessionTokenRef.current !== requestToken
      ) return;
      setRankedTaskState({ phase: "error" });
      setTaskNotice("load_error");
    }
  }, [api, token]);
  const pluginCatalogRequestRef = useRef(0);
  const loadPluginCatalog = useCallback(async () => {
    const requestId = ++pluginCatalogRequestRef.current;
    setPluginCatalogAttempted(true);
    setPluginCatalogBusy(true);
    setPluginCatalogError(null);
    try {
      const next = await api.pluginCatalog();
      if (pluginCatalogRequestRef.current !== requestId) return null;
      setPluginCatalog(next);
      setPluginCatalogError(null);
      return next;
    } catch (error) {
      if (pluginCatalogRequestRef.current !== requestId) return null;
      setPluginCatalog(null);
      setPluginCatalogError(systemPageCopy.plugins.loadError);
      throw error;
    } finally {
      if (pluginCatalogRequestRef.current === requestId) setPluginCatalogBusy(false);
    }
  }, [api, systemPageCopy.plugins.loadError]);
  const supportRequestClient = useMemo(
    () => createSupportRequestClient({
      appVersion: Constants.nativeAppVersion || Constants.expoConfig?.version || "unknown",
      baseUrl: API_BASE,
      createIdempotencyKey: () => `hhsr_${Crypto.randomUUID().replace(/-/g, "")}`,
      locale: appLocale,
      platform: Platform.OS === "android" ? "android" : Platform.OS === "web" ? "web" : "ios",
      token: token || "missing",
    }),
    [appLocale, token],
  );
  const anonymousSupportRequestClient = useMemo(
    () => createAnonymousSupportRequestClient({
      appVersion: Constants.nativeAppVersion || Constants.expoConfig?.version || "unknown",
      baseUrl: API_BASE,
      createIdempotencyKey: () => `hhsr_${Crypto.randomUUID().replace(/-/g, "")}`,
      locale: appLocale,
      platform: Platform.OS === "android" ? "android" : Platform.OS === "web" ? "web" : "ios",
    }),
    [appLocale],
  );
  const googleClientId = nativeAuthConfig?.providers.google?.clientId;
  const googleAuthHookClientId = googleClientId ?? GOOGLE_AUTH_CONFIG_PENDING_CLIENT_ID;
  const [googleAuthRequest, googleAuthResponse, promptGoogleAuth] = Google.useIdTokenAuthRequest({
    clientId: googleAuthHookClientId,
    extraParams: googleChallenge ? { nonce: googleChallenge.nonce } : undefined,
    iosClientId: googleAuthHookClientId,
    selectAccount: true,
  });
  const hermesApi = useMemo(
    () => createMobileHermesCanonicalClient({
      baseUrl: API_BASE,
      // The core client only calls this with string URLs and standard init
      // fields. Expo narrows that signature but supplies the native streaming
      // body reader that React Native's global fetch does not.
      fetchImpl: expoFetch as unknown as typeof fetch,
      token: token || "missing",
    }),
    [token],
  );
  const chatRunTransport = useMemo(
    () => ({
      createRun: async (request: CreateChatRunRequest, context: { signal?: AbortSignal }) => {
        const state = chatLatencyRef.current;
        const run = await hermesApi.createRun(request, context);
        if (state && chatLatencyRef.current === state && state.runId === null && !state.reported) {
          const durationMs = Math.max(0, latencyNow() - state.startedAt);
          state.runId = run.id;
          recordMobileChatLatency({ apiAcceptanceMs: durationMs });
        }
        return run;
      },
      getRun: (runId: string, context: { signal?: AbortSignal }) => hermesApi.run(runId, context),
      stopRun: (runId: string, context: { signal?: AbortSignal }) => hermesApi.stopRun(runId, context),
      streamRun: createMobileHomechatEventStream(
        (runId, cursor, signal) => hermesApi.runEventsResponse(runId, { lastEventId: cursor, signal }),
        {
          startedAt: (runId: string) => chatLatencyRef.current?.runId === runId ? chatLatencyRef.current.startedAt : null,
          onTiming: (timing: Partial<ChatLatencySummary>, runId: string) => {
            if (chatLatencyRef.current?.runId === runId) recordMobileChatLatency(timing);
          },
        },
      ),
    }),
    [hermesApi],
  );

  useEffect(() => {
    let disposed = false;
    let readPending = false;
    const reconcileTerminalState = async () => {
      if (disposed || readPending) return;
      readPending = true;
      try {
        for (const owned of queuedFollowUpRef.current.values()) {
          if (disposed) break;
          if (!owned.runId || !mobileQueuedFollowUpBlocksComposer(owned.status)) continue;
          try {
            const terminal = await reconcileMobileQueuedFollowUpTerminalState(
              owned.runId, (runId) => hermesApi.run(runId),
            );
            if (!disposed && queuedFollowUpRef.current.get(owned.ownershipToken) === owned && terminal) {
              commitChatRunStatus(terminal.runId, terminal.status);
            }
          } catch {
            // The existing follower remains authoritative during a failed readback.
          }
        }
      } finally { readPending = false; }
    };
    void reconcileTerminalState();
    const interval = setInterval(() => void reconcileTerminalState(), 1_600);
    return () => { disposed = true; clearInterval(interval); };
  }, [hermesApi, queuedFollowUps]);

  const chatConversationController = useMemo(
    () => createHomechatConversationController<ConversationSession, ChatMessage>({
      createConversation: (request, context) => hermesApi.createConversation(request, context),
      listConversations: async (request) => ({
        cursor: null,
        items: await hermesApi.conversationSessions(
          { search: request.search, limit: request.limit },
          { signal: request.signal },
        ),
      }),
      listMessages: async (request) => {
        const page = await hermesApi.messages(request.conversationId, {
          before: request.cursor ?? undefined,
          limit: request.limit,
        }, { signal: request.signal });
        return { cursor: page.nextBefore, items: page.messages };
      },
    }),
    [hermesApi],
  );
  const voiceRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const voiceRecorderState = useAudioRecorderState(voiceRecorder);
  const voiceNoteController = useMemo(
    () => createHomechatVoiceController({
      requestPermission: async () => (await requestRecordingPermissionsAsync()).granted,
      startRecording: async () => {
        voiceRecordingUriRef.current = null;
        await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
        await voiceRecorder.prepareToRecordAsync();
        voiceRecorder.record();
        return { recording: voiceRecorder, mimeType: voiceMimeTypeForPlatform() };
      },
      stopRecording: async (recording) => {
        await recording.stop();
        await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
        const status = recording.getStatus();
        const uri = recording.uri || status.url;
        if (!uri) throw new Error("No voice note audio was saved.");
        voiceRecordingUriRef.current = uri;
        return {
          audioBase64: await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 }),
          mimeType: voiceMimeTypeForPlatform(),
        };
      },
      discardRecording: async (recording) => {
        await recording.stop().catch(() => undefined);
        await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
        const status = recording.getStatus();
        const uri = recording.uri || status.url;
        if (uri) await FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => undefined);
      },
      isEmptyRecording: (audio) => !audio.audioBase64,
      transcribe: (audio) => api.transcribeVoiceNote(audio),
    }),
    [api, voiceRecorder],
  );
  const voiceRecordingActive = voiceNoteState.phase === "recording";
  const voiceControllerBusy = voiceNoteState.phase === "requesting_permission" ||
    voiceNoteState.phase === "stopping" ||
    voiceNoteState.phase === "transcribing";
  const voiceBusy = voiceControllerBusy || !["idle", "recording"].includes(voiceNoteDraft.phase);

  const showCopyNotice = useCallback((notice: string) => {
    if (copyNoticeTimerRef.current) clearTimeout(copyNoticeTimerRef.current);
    setCopyNotice(notice);
    copyNoticeTimerRef.current = setTimeout(() => {
      setCopyNotice(null);
      copyNoticeTimerRef.current = null;
    }, 3000);
  }, []);

  const recordDiagnostic = useCallback((level: MobileLogEntry["level"], message: string, detail?: string) => {
    setDiagnosticLog((current) => [
      {
        id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        level,
        message,
        detail,
        createdAt: new Date().toISOString(),
      },
      ...current,
    ].slice(0, 20));
  }, []);

  const stopReadAloudTransport = useCallback(() => {
    readAloudRequestIdRef.current += 1;
    readAloudAbortRef.current?.abort();
    readAloudAbortRef.current = null;
    speechPlayerSubscriptionRef.current?.remove();
    speechPlayerSubscriptionRef.current = null;
    speechPlayerRef.current?.pause();
  }, []);

  const stopReadAloud = useCallback(() => {
    stopReadAloudTransport();
    const current = readAloudStateRef.current;
    commitReadAloudState(mobileReadAloudRequestFinished(current, current.requestId));
  }, [commitReadAloudState, stopReadAloudTransport]);

  useEffect(() => {
    return () => {
      if (copyNoticeTimerRef.current) clearTimeout(copyNoticeTimerRef.current);
    };
  }, []);

  useEffect(() => voiceNoteController.subscribe(setVoiceNoteState), [voiceNoteController]);

  useEffect(() => {
    messagesStateRef.current = messages;
  }, [messages]);

  useEffect(() => () => {
    activeChatAbortRef.current?.abort();
    for (const queued of queuedFollowUpRef.current.values()) queued.abortController.abort();
    queuedFollowUpOwner.invalidate();
    stopReadAloudTransport();
    void voiceNoteController.cancel().catch(() => undefined);
  }, [queuedFollowUpOwner, stopReadAloudTransport, voiceNoteController]);

  useEffect(() => {
    const errorUtils = (globalThis as typeof globalThis & {
      ErrorUtils?: {
        getGlobalHandler?: () => ((error: unknown, isFatal?: boolean) => void) | undefined;
        setGlobalHandler?: (handler: (error: unknown, isFatal?: boolean) => void) => void;
      };
    }).ErrorUtils;
    if (host.session.mode === "external" || !errorUtils?.setGlobalHandler) return;
    const previousHandler = errorUtils.getGlobalHandler?.();
    errorUtils.setGlobalHandler((caughtError, isFatal) => {
      const detail = caughtError instanceof Error ? caughtError.message : String(caughtError);
      recordDiagnostic(isFatal ? "error" : "info", isFatal ? "App crash captured" : "App error captured", detail);
      previousHandler?.(caughtError, isFatal);
    });
    return () => {
      if (previousHandler) errorUtils.setGlobalHandler?.(previousHandler);
    };
  }, [recordDiagnostic]);

  const logout = useCallback(async (notice?: string) => {
    refreshGenerationRef.current += 1;
    voiceOperationGenerationRef.current += 1;
    readAloudStorageGenerationRef.current += 1;
    homeChatRefreshSingleFlight.clear();
    activateAccountSession(null);
    mobilePurchasesController.suspend();
    setMobilePurchasePlans([]);
    setMobilePurchaseAccountReady(false);
    setMobilePurchasePhase("idle");
    setMobilePurchaseNotice(null);
    activeChatAbortRef.current?.abort();
    activeChatAbortRef.current = null;
    activeHomechatRunSessionRef.current = null;
    for (const queued of queuedFollowUpRef.current.values()) queued.abortController.abort();
    queuedFollowUpRef.current.clear();
    queuedFollowUpOwner.invalidate();
    await voiceNoteController.cancel().catch(() => undefined);
    stopReadAloud();
    voiceRecordingUriRef.current = null;
    commitVoiceNoteDraft(mobileVoiceNoteDiscarded());
    commitReadAloudState(mobileReadAloudAccountCleared(readAloudStateRef.current));
    await enqueueReadAloudStorageOperation(() => clearStoredBoolean(readRepliesAloudStorageKey));
    if (token) {
      try {
        await createApiClient({ baseUrl: API_BASE, token }).logout();
      } catch {
        // Local sign-out should still work if the server session is already gone.
      }
    }
    await clearStoredToken();
    setToken(null);
    snapshotStateRef.current = null;
    setSnapshot(null);
    setAppLocale("en");
    setMenuOpen(false);
    setMessages([]);
    setChatEventsByRunId({});
    explainedRunFailuresRef.current.clear();
    setChatRunStatusesById({});
    setDelegatedTasks([]);
    setMessagesNextBefore(null);
    setLoadingOlderMessages(false);
    preserveMessagesScrollRef.current = false;
    setPreserveMessagesScroll(false);
    messagesScrollOffsetRef.current = 0;
    setChatSessions([]);
    selectActiveConversationSession(null);
    hasHydratedReadAloudMessagesRef.current = false;
    setChatSessionsOpen(false);
    setChatSessionNotice(null);
    setSupportToken(null);
    setRankedTaskState({ phase: "idle" });
    setTaskNotice(null);
    setNativeCapabilities(null);
    setNativeCapabilitiesBusy(false);
    setNativeCapabilitiesError(null);
    setModelOptions(null);
    commitWorkspaceStatusTruth(null);
    pendingAiAccessRouteRef.current = null;
    commitMobileAiAccessState(initialMobileAiAccessState);
    setAiAccessNotice(null);
    setAutomationsView(null);
    setAutomationsBusy(false);
    setAutomationsError(null);
    setRankedTaskAutomationsView(null);
    setRankedTaskAutomationsBusy(false);
    setRankedTaskAutomationsError(null);
    automationsAutoLoadKeyRef.current = null;
    setDashboardOpenState("idle");
    setMobilePushStatus(null);
    setMobilePushNotice(null);
    setMobilePushBusy(false);
    registeredMobilePushTokenRef.current = null;
    mobilePushRegistrationAttemptedRef.current = false;
    clearIntegrationFields("telegram");
    clearIntegrationFields("whatsapp", { resetStatus: true });
    clearIntegrationFields("email");
    setIntegrationNotice(null);
    setResettingIntegration(null);
    setConnectionReach(null);
    setConnectionReachBusy(false);
    setConnectionReachError(null);
    connectionReachRequestRef.current += 1;
    setGoogleConnectionClientId("");
    setGoogleClientSecret("");
    setGoogleAuthorizationCode("");
    setGoogleRedirectUri("http://127.0.0.1:1");
    setBusy(false);
    setBusyLabel(null);
    setChatPendingText(null);
    setChatStreamingText("");
    setChatSuggestions([]);
    setHeySuggestions([]);
    setHeySuggestionFilter("all");
    setHeySuggestionNudge(null);
    setHeySuggestionBusyId(null);
    setHeySuggestionNotice(null);
    heySuggestionNudgeWorkspaceRef.current = null;
    setQueuedFollowUps([]);
    setIsRefreshing(false);
    setSessionRestored(true);
    setSessionNotice(null);
    setChatGptConnection(null);
    setCopyNotice(null);
    await clearStoredChatGptConnection();
    const undeletedAudioFiles = await clearStoredAudioResidue(FileSystem, voiceRecorder.uri);
    if (undeletedAudioFiles > 0) {
      recordDiagnostic(
        "error",
        "Sign-out could not delete every audio file",
        `${undeletedAudioFiles} audio file(s) written for the previous account remain on this device.`,
      );
    }
    setDismissedAppErrorKey(null);
    setDismissedSessionNoticeKey(null);
    setAppError(notice || null);
  }, [commitReadAloudState, commitVoiceNoteDraft, homeChatRefreshSingleFlight, queuedFollowUpOwner, recordDiagnostic, selectActiveConversationSession, setAppError, setSessionNotice, stopReadAloud, token, voiceNoteController, voiceRecorder]);

  const refresh = useCallback((afterCurrent = false) => {
    if (!token) return Promise.resolve();
    const runRefresh = afterCurrent
      ? homeChatRefreshSingleFlight.runAfterCurrent
      : homeChatRefreshSingleFlight.run;
    return runRefresh(async () => {
      const requestToken = token;
      const sessionGeneration = accountSessionGenerationRef.current;
      const refreshGeneration = refreshGenerationRef.current;
      const refreshIsCurrent = () =>
        refreshGenerationRef.current === refreshGeneration &&
        accountSessionIsCurrent(sessionGeneration, requestToken);
      let criticalSnapshotPublished = false;
      setIsRefreshing(true);
      setRankedTaskState({ phase: "loading" });
      setTaskNotice(null);

      // HPD-127 owns this truth read. It deliberately remains independent from
      // both the critical Home Chat snapshot and the later conversation phase.
      const statusTruthRequestId = ++workspaceStatusTruthRequestRef.current;
      void workspaceStatusTruthRequest(api)
        .then((nextStatusTruth) => {
          if (refreshIsCurrent() && workspaceStatusTruthRequestRef.current === statusTruthRequestId) {
            commitWorkspaceStatusTruth(nextStatusTruth);
          }
        })
        .catch(() => {
          if (refreshIsCurrent() && workspaceStatusTruthRequestRef.current === statusTruthRequestId) {
            workspaceStatusTruthScheduleRef.current?.(workspaceStatusTruthRef.current);
          }
        });

      try {
        const nextSnapshot = await api.startupSnapshot();
        if (!refreshIsCurrent()) return;

        const wasInitialSnapshot = snapshotStateRef.current === null;
        const snapshotSessionId = mobileHomeChatSnapshotSessionId(nextSnapshot.recentMessages);
        const nextLocale = normalizeMobileLocale(nextSnapshot.me.preferredLocale);
        criticalSnapshotPublished = true;
        snapshotStateRef.current = nextSnapshot;
        setSnapshot(nextSnapshot);
        setAppLocale(nextLocale);

        // Selecting the conversation hung on the first snapshot of an app run.
        // When that had already happened, nothing selected, nothing hydrated,
        // and the chat stayed white with no conversation behind it at all.
        // Having no conversation is the condition worth acting on, not being
        // early in the app's life.
        if (!activeConversationSessionIdRef.current && snapshotSessionId) {
          selectActiveConversationSession(snapshotSessionId, "preserve_version");
        }
        if (wasInitialSnapshot) {
          const firstMessages = nextSnapshot.recentMessages;
          if (!hasHydratedReadAloudMessagesRef.current) {
            commitReadAloudState(mobileReadAloudConversationChanged(
              readAloudStateRef.current,
              latestAssistantMessage(firstMessages)?.id ?? null,
            ));
            hasHydratedReadAloudMessagesRef.current = true;
          }
          messagesStateRef.current = firstMessages;
          setMessages(firstMessages);
          setMessagesNextBefore(null);
        }

        const chatGptAccountReady = chatGptAccountConnectionView(nextSnapshot).ready;
        if (chatGptAccountReady) {
          setChatGptConnection(null);
          void clearStoredChatGptConnection().catch(() => undefined);
        }
        setSessionNoticeState((previous) => mobileSessionNoticeAfterSnapshot(previous, chatGptAccountReady));
        setAppError(null);

        const selectionVersionAtStart = conversationSelectionVersionRef.current;
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
        if (!refreshIsCurrent()) return;

        const snapshotEnrichmentRequestId = ++snapshotEnrichmentRequestRef.current;
        void api.snapshot()
          .then((enrichedSnapshot) => {
            if (
              !refreshIsCurrent() ||
              snapshotEnrichmentRequestRef.current !== snapshotEnrichmentRequestId
            ) return;
            snapshotStateRef.current = enrichedSnapshot;
            setSnapshot(enrichedSnapshot);
            setAppLocale(normalizeMobileLocale(enrichedSnapshot.me.preferredLocale));
            const enrichedChatGptAccountReady = chatGptAccountConnectionView(enrichedSnapshot).ready;
            if (enrichedChatGptAccountReady) {
              setChatGptConnection(null);
              void clearStoredChatGptConnection().catch(() => undefined);
            }
            setSessionNoticeState((previous) =>
              mobileSessionNoticeAfterSnapshot(previous, enrichedChatGptAccountReady));
          })
          .catch((error) => {
            if (
              refreshIsCurrent() &&
              snapshotEnrichmentRequestRef.current === snapshotEnrichmentRequestId
            ) {
              recordDiagnostic(
                "info",
                "Deferred snapshot enrichment failed",
                displayError(error, "Provider and task status will refresh later."),
              );
            }
          });

        const modelSelectionGenerationAtAuxiliaryStart = modelSelectionRequestRef.current;
        const auxiliaryPhase = Promise.all([
          (host.policy.preinstalledRanker ? api.rankedTasks() : Promise.resolve(null))
            .then((collection) => ({ phase: "ready", collection }) as const)
            .catch(() => ({ phase: "error" }) as const),
          api.modelOptions().catch(() => null),
          api.claudeConnectionStatus().catch(() => null),
        ]);
        const [activeRuns, sessionsPage] = await Promise.all([
          hermesApi.activeRuns().catch((): ChatRun[] => []),
          chatConversationController.refreshConversations(createHomechatPagedState<ConversationSession>(), { limit: 12 }),
        ]);
        if (!refreshIsCurrent()) return;

        const activeRunRecovery = mobileHomeChatActiveRunRecovery<ChatRun>(
          activeRuns,
          activeConversationSessionIdRef.current ?? snapshotSessionId,
        );
        const activeRun = activeRunRecovery.primaryRun;

        const nextSessions = sessionsPage.phase === "error" ? [] : sessionsPage.items;
        setChatSessions(nextSessions);
        const hydrationSelection = mobileHomeChatHydrationSelection({
          activeRunSessionId: activeRun?.conversationSessionId || null,
          currentSelectionId: activeConversationSessionIdRef.current,
          currentSelectionVersion: conversationSelectionVersionRef.current,
          firstSessionId: nextSessions[0]?.id ?? null,
          homeSessionId: homeConversationSession(nextSessions)?.id ?? null,
          selectionVersionAtStart,
        });

        let hydratedSessionId = activeConversationSessionIdRef.current;
        let hydratedMessages = messagesStateRef.current;
        if (hydrationSelection.applyHydration) {
          const selectedMessages = hydrationSelection.sessionId
            ? await chatConversationController.refreshMessages(createHomechatPagedState<ChatMessage>(), {
                conversationId: hydrationSelection.sessionId,
                limit: 50,
              })
            : null;
          if (!refreshIsCurrent()) return;
          const currentHydrationSelection = mobileHomeChatHydrationSelection({
            activeRunSessionId: activeRun?.conversationSessionId || null,
            currentSelectionId: activeConversationSessionIdRef.current,
            currentSelectionVersion: conversationSelectionVersionRef.current,
            firstSessionId: nextSessions[0]?.id ?? null,
            homeSessionId: homeConversationSession(nextSessions)?.id ?? null,
            selectionVersionAtStart,
          });
          if (currentHydrationSelection.applyHydration) {
            const previousSessionId = activeConversationSessionIdRef.current;
            hydratedSessionId = currentHydrationSelection.sessionId;
            selectActiveConversationSession(hydratedSessionId, "preserve_version");
            const mayUseSnapshotFallback =
              wasInitialSnapshot && hydratedSessionId !== null && hydratedSessionId === snapshotSessionId;
            if (selectedMessages?.phase === "ready" || mayUseSnapshotFallback) {
              const selectedHydratedMessages = selectedMessages?.phase === "ready"
                ? selectedMessages.items
                : nextSnapshot.recentMessages;
              hydratedMessages = activeRunRecovery.queuedFollowUps.reduce(
                (messages, run) => mobileMessagesWithoutRun(messages, run.id), selectedHydratedMessages,
              );
              messagesStateRef.current = hydratedMessages;
              setMessages(hydratedMessages);
              setMessagesNextBefore(selectedMessages?.phase === "ready" ? selectedMessages.cursor : null);
            }
            // A failed message load used to leave the screen blank and say
            // nothing: measured on a freshly signed-in device whose home chat
            // stayed empty while the same conversation held 131 messages on the
            // server. An empty chat is a claim about the conversation, and it
            // must not be made when the load did not succeed.
            if (selectedMessages?.phase === "error" && !hydratedMessages.length) {
              setChatSessionNotice(userFacingError(
                selectedMessages.error || "This chat could not be loaded. Pull down to try again.",
              ));
              recordDiagnostic(
                "error",
                "Home chat messages did not load",
                selectedMessages.error || "The message page returned an error.",
              );
            }
            if (!hydratedSessionId || hydratedSessionId !== previousSessionId) {
              setChatEventsByRunId({});
              explainedRunFailuresRef.current.clear();
              setChatRunStatusesById({});
            }
          }
        }

        // Messages were only ever painted behind two gates: the very first
        // snapshot of an app run, and a hydration step that stands down when the
        // customer navigated meanwhile. When neither held, the screen stayed
        // white and said nothing — measured on a freshly signed-in device whose
        // home chat was empty while the conversation held 131 messages and the
        // message endpoint returned fifty of them on request.
        //
        // A chat that has a conversation and no messages is wrong regardless of
        // which gate closed, so ask for them.
        const sessionForRecovery = hydratedSessionId
          || hydrationSelection.sessionId
          || snapshotSessionId
          || homeConversationSession(nextSessions)?.id
          || null;
        if (sessionForRecovery && !hydratedMessages.length) {
          if (!activeConversationSessionIdRef.current) {
            selectActiveConversationSession(sessionForRecovery, "preserve_version");
            hydratedSessionId = sessionForRecovery;
          }
          const recovered = await chatConversationController.refreshMessages(
            createHomechatPagedState<ChatMessage>(),
            { conversationId: sessionForRecovery, limit: 50 },
          );
          if (!refreshIsCurrent()) return;
          const recoveryStillVisible = conversationSelectionVersionRef.current === selectionVersionAtStart &&
            activeConversationSessionIdRef.current === sessionForRecovery;
          if (recoveryStillVisible && recovered.phase === "ready" && recovered.items.length) {
            hydratedMessages = recovered.items;
            messagesStateRef.current = hydratedMessages;
            setMessages(hydratedMessages);
            setMessagesNextBefore(recovered.cursor);
          } else if (recoveryStillVisible && recovered.phase === "error") {
            setChatSessionNotice(userFacingError(
              recovered.error || "This chat could not be loaded. Pull down to try again.",
            ));
          }
        }

        if (activeRun?.events?.length) {
          const activeRunEvents = activeRun.events;
          setChatEventsByRunId((current) => mergeChatRunEventMaps(current, { [activeRun.id]: activeRunEvents }));
        }
        if (activeRun) {
          commitChatRunStatus(activeRun.id, activeRun.status);
        }
        if (
          activeRun &&
          resumingChatRunRef.current !== activeRun.id &&
          activeConversationSessionIdRef.current === hydratedSessionId &&
          (!activeRun.conversationSessionId || activeRun.conversationSessionId === hydratedSessionId)
        ) {
          void resumeChatRun(activeRun.id, activeRun.conversationSessionId ?? hydratedSessionId, hydratedMessages);
        }
        for (const queuedRun of activeRunRecovery.queuedFollowUps) {
          if (queuedRun.conversationSessionId === hydratedSessionId) recoverQueuedFollowUp(queuedRun);
        }

        const [nextRankedTasks, nextModelOptions, nextClaudeStatus] = await auxiliaryPhase;
        if (!refreshIsCurrent()) return;
        if (nextRankedTasks.phase === "ready" && nextRankedTasks.collection) {
          setRankedTaskState({ phase: "ready", collection: nextRankedTasks.collection });
          setTaskNotice(null);
        } else {
          setRankedTaskState({ phase: "error" });
          setTaskNotice("load_error");
        }
        if (
          workspaceStatusTruthRequestRef.current === statusTruthRequestId &&
          modelSelectionRequestRef.current === modelSelectionGenerationAtAuxiliaryStart
        ) {
          setModelOptions(nextModelOptions);
        }
        setClaudeStatus(nextClaudeStatus);
      } catch (err) {
        if (!refreshIsCurrent()) return;
        setRankedTaskState({ phase: "error" });
        setTaskNotice("load_error");
        const message = displayError(err, "Could not load Hey Hermes.");
        recordDiagnostic("error", criticalSnapshotPublished ? "Deferred refresh failed" : "Refresh failed", message);
        if (isProductSessionAuthError(message)) {
          await logout(sessionExpiredText());
          return;
        }
        if (!criticalSnapshotPublished && !snapshotStateRef.current) {
          setAppError(userFacingError(message));
        }
      } finally {
        if (refreshIsCurrent()) setIsRefreshing(false);
      }
    });
  }, [api, chatConversationController, commitReadAloudState, hermesApi, homeChatRefreshSingleFlight, logout, recordDiagnostic, selectActiveConversationSession, setAppError, token]);

  const refreshProductAccess = useCallback(async () => {
    if (!token || !snapshotStateRef.current) return;
    const requestToken = token;
    const sessionGeneration = accountSessionGenerationRef.current;
    setProductAccessRefreshing(true);
    try {
      const [entitlement, nextStatusTruth] = await Promise.all([
        api.entitlement(),
        workspaceStatusTruthRequest(api),
      ]);
      if (!accountSessionIsCurrent(sessionGeneration, requestToken)) return;
      const current = snapshotStateRef.current;
      if (!current || current.me.id !== entitlement.accountId) return;
      const nextSnapshot = { ...current, entitlement };
      snapshotStateRef.current = nextSnapshot;
      setSnapshot(nextSnapshot);
      commitWorkspaceStatusTruth(nextStatusTruth);
    } catch (error) {
      if (accountSessionIsCurrent(sessionGeneration, requestToken)) {
        recordDiagnostic(
          "info",
          "Product access refresh failed",
          displayError(error, "The existing account access status could not be refreshed."),
        );
      }
    } finally {
      if (accountSessionIsCurrent(sessionGeneration, requestToken)) {
        setProductAccessRefreshing(false);
      }
    }
  }, [api, commitWorkspaceStatusTruth, recordDiagnostic, token]);

  // Opening the screen draws it from what the workspace already knows, which is
  // instant. Pressing Check status is the customer asking us to go and look, and
  // that is the only reason to wait for every provider to answer.
  const refreshMobileAiAccessTruth = useCallback(async (options: { verify?: boolean } = {}) => {
    if (!token) return;
    const requestToken = token;
    const sessionGeneration = accountSessionGenerationRef.current;
    const requestId = ++workspaceStatusTruthRequestRef.current;
    const modelSelectionGenerationAtRefreshStart = modelSelectionRequestRef.current;
    setAiAccessRefreshing(true);
    setAiAccessRefreshError(null);
    try {
      const [nextStatusTruth, nextModelOptions, nextClaudeStatus] = await Promise.all([
        workspaceStatusTruthRequest(api, { verify: options.verify === true }),
        api.modelOptions().catch(() => null),
        api.claudeConnectionStatus().catch(() => null),
      ]);
      if (!accountSessionIsCurrent(sessionGeneration, requestToken) || workspaceStatusTruthRequestRef.current !== requestId) return;
      commitWorkspaceStatusTruth(nextStatusTruth);
      if (
        nextModelOptions &&
        modelSelectionRequestRef.current === modelSelectionGenerationAtRefreshStart
      ) setModelOptions(nextModelOptions);
      if (nextClaudeStatus) setClaudeStatus(nextClaudeStatus);
    } catch {
      if (!accountSessionIsCurrent(sessionGeneration, requestToken) || workspaceStatusTruthRequestRef.current !== requestId) return;
      setAiAccessRefreshError(systemPageCopy.aiAccess.currentUnavailable);
      workspaceStatusTruthScheduleRef.current?.(workspaceStatusTruthRef.current);
    } finally {
      if (accountSessionIsCurrent(sessionGeneration, requestToken) && workspaceStatusTruthRequestRef.current === requestId) {
        setAiAccessRefreshing(false);
      }
    }
  }, [api, systemPageCopy.aiAccess.currentUnavailable, token]);

  useEffect(() => {
    if (!token) return;
    const requestToken = token;
    const sessionGeneration = accountSessionGenerationRef.current;
    const pollId = ++workspaceStatusTruthPollRef.current;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let requestController: AbortController | null = null;
    const isCurrent = () => !cancelled &&
      workspaceStatusTruthPollRef.current === pollId &&
      accountSessionIsCurrent(sessionGeneration, requestToken);
    const schedule = (delayMs: number) => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        if (!isCurrent()) return;
        const requestId = ++workspaceStatusTruthRequestRef.current;
        requestController = new AbortController();
        void workspaceStatusTruthRequest(api, { signal: requestController.signal })
          .then((nextStatusTruth) => {
            if (!isCurrent()) return;
            if (workspaceStatusTruthRequestRef.current === requestId) commitWorkspaceStatusTruth(nextStatusTruth);
          })
          .catch(() => {
            if (!isCurrent()) return;
            if (workspaceStatusTruthRequestRef.current === requestId) {
              workspaceStatusTruthScheduleRef.current?.(workspaceStatusTruthRef.current);
            }
          });
      }, delayMs);
    };
    const scheduleForTruth = (nextStatusTruth: WorkspaceStatusTruthView | null) => {
      schedule(workspaceStatusTruthServerRefreshDelayMs(nextStatusTruth));
    };
    workspaceStatusTruthScheduleRef.current = scheduleForTruth;
    if (workspaceStatusTruthRef.current) {
      schedule(workspaceStatusTruthServerRefreshDelayMs(workspaceStatusTruthRef.current));
    } else {
      schedule(workspaceStatusTruthServerRefreshDelayMs(null));
    }
    return () => {
      cancelled = true;
      workspaceStatusTruthPollRef.current += 1;
      if (workspaceStatusTruthScheduleRef.current === scheduleForTruth) workspaceStatusTruthScheduleRef.current = null;
      requestController?.abort();
      if (timer) clearTimeout(timer);
    };
  }, [api, token]);

  useEffect(() => {
    const accountId = snapshot?.me.id ?? null;
    setMobilePurchaseCompletion(null);
    if (host.session.mode === "external" || Platform.OS !== "ios" || !accountId) {
      mobilePurchasesController.suspend();
      setMobilePurchasePlans([]);
      setMobilePurchaseAccountReady(false);
      setMobilePurchasePhase("idle");
      setMobilePurchaseNotice(null);
      return;
    }
    if (!mobilePurchasesConfiguredForBuild()) {
      mobilePurchasesController.suspend();
      setMobilePurchasePlans([]);
      setMobilePurchaseAccountReady(false);
      setMobilePurchasePhase("unavailable");
      setMobilePurchaseNotice("App Store purchases are not configured in this build.");
      return;
    }

    let cancelled = false;
    setMobilePurchasePlans([]);
    setMobilePurchaseAccountReady(false);
    setMobilePurchasePhase("loading");
    setMobilePurchaseNotice(null);
    void bindMobilePurchasesAccount(accountId)
      .then((binding) => {
        if (!cancelled) {
          setMobilePurchaseAccountReady(true);
          setMobilePurchaseCompletion(binding.personalPurchaseExpirationAt
            ? { accountId, expirationAt: binding.personalPurchaseExpirationAt }
            : null);
        }
        return mobilePurchasesController.loadPlans(accountId);
      })
      .then((plans) => {
        if (cancelled) return;
        setMobilePurchasePlans(plans);
        setMobilePurchasePhase("ready");
      })
      .catch((caught) => {
        if (cancelled) return;
        setMobilePurchasePhase("error");
        setMobilePurchaseNotice(userFacingError(displayError(caught, "App Store plans are unavailable.")));
      });

    return () => {
      cancelled = true;
      mobilePurchasesController.suspend();
    };
  }, [snapshot?.me.id]);

  async function reconcileMobileSubscription(accountId: string) {
    const state = assertProductLocalSubscriptionState(accountId, await api.subscriptionState());
    if (signedInAccountIdRef.current !== accountId) {
      throw new Error("The signed-in Hey account changed before subscription confirmation.");
    }
    setSnapshot((current) => current?.me.id === accountId
      ? { ...current, subscription: state, entitlement: state.entitlement }
      : current);
    return state;
  }

  async function purchaseMobilePlan(packageId: MobileRevenueCatPackageId) {
    const accountId = snapshot?.me.id;
    if (
      !accountId ||
      !mobilePersonalPurchaseCanStart(accountId, snapshot.subscription, mobilePurchaseCompletion) ||
      mobilePurchasePhase === "purchasing" ||
      mobilePurchasePhase === "restoring"
    ) return;
    setMobilePurchasePhase("purchasing");
    setMobilePurchaseNotice(null);
    try {
      const purchase = await mobilePurchasesController.purchase(accountId, packageId, () => {
        setMobilePurchaseCompletion({ accountId, expirationAt: null });
      });
      setMobilePurchaseCompletion({ accountId, expirationAt: purchase.personalPurchaseExpirationAt });
      try {
        const state = await reconcileMobileSubscription(accountId);
        const confirmed = mobileSubscriptionAuthorityConfirmed(accountId, state);
        setMobilePurchaseNotice(
          confirmed
            ? "Personal is active for this Hey account."
            : "The App Store purchase finished. Access will appear after server confirmation.",
        );
      } catch {
        setMobilePurchaseNotice("The App Store purchase finished, but server confirmation is still pending. Do not purchase again.");
      }
      setMobilePurchasePhase("ready");
    } catch (caught) {
      if (isMobilePurchaseCancelled(caught)) {
        setMobilePurchasePhase("ready");
        return;
      }
      setMobilePurchasePhase("error");
      const detail = userFacingError(displayError(caught, "Purchase status could not be confirmed."));
      setMobilePurchaseNotice(`${staticUiMessage(appLocale, detail)} ${staticUiCopy(appLocale)["Check App Store subscriptions before trying again."]}`);
    }
  }

  async function restoreMobilePurchases() {
    const accountId = snapshot?.me.id;
    if (!accountId || mobilePurchasePhase === "purchasing" || mobilePurchasePhase === "restoring") return;
    setMobilePurchasePhase("restoring");
    setMobilePurchaseNotice(null);
    try {
      await mobilePurchasesController.restore(accountId);
      try {
        const state = await reconcileMobileSubscription(accountId);
        const confirmed = mobileSubscriptionAuthorityConfirmed(accountId, state);
        setMobilePurchaseNotice(
          confirmed
            ? "Your App Store purchase is restored for this Hey account."
            : "Restore finished. The server found no active App Store access for this Hey account.",
        );
      } catch {
        setMobilePurchaseNotice("Restore finished, but server confirmation is temporarily unavailable.");
      }
      setMobilePurchasePhase("ready");
    } catch (caught) {
      setMobilePurchasePhase("error");
      setMobilePurchaseNotice(userFacingError(displayError(caught, "App Store purchases could not be restored.")));
    }
  }

  async function manageMobileSubscription() {
    setMobilePurchaseNotice(null);
    try {
      await openIosSubscriptionManagement((url) => Linking.openURL(url));
    } catch {
      setMobilePurchaseNotice(
        iosPaywallView({
          locale: appLocale,
          plan: mobilePurchasePlans[0] ?? null,
          comped: snapshot?.entitlement.comped === true,
          entitlementStatus: snapshot?.entitlement.status ?? "none",
          runtimeAccess: snapshot?.subscription.lifecycle.runtimeAccess ?? "suspended",
        }).manageError,
      );
    }
  }

  const loadNativeCapabilities = useCallback(async () => {
    if (!token) return;
    setNativeCapabilitiesBusy(true);
    setNativeCapabilitiesError(null);
    try {
      setNativeCapabilities(await api.nativeCapabilities());
    } catch (err) {
      const message = displayError(err, "Could not load capabilities.");
      recordDiagnostic("error", "Capabilities failed", message);
      if (isProductSessionAuthError(message)) {
        await logout(sessionExpiredText());
        return;
      }
      setNativeCapabilitiesError(userFacingError(message));
    } finally {
      setNativeCapabilitiesBusy(false);
    }
  }, [api, logout, recordDiagnostic, token]);

  const loadAutomations = useCallback(async () => {
    if (!token) return;
    setAutomationsBusy(true);
    setAutomationsError(null);
    try {
      setAutomationsView(await hermesApi.automations());
    } catch (err) {
      const message = displayError(err, "Could not load automations.");
      recordDiagnostic("error", "Automations failed", message);
      if (isProductSessionAuthError(message)) {
        await logout(sessionExpiredText());
        return;
      }
      setAutomationsError(systemPageCopy.automations.loadError);
    } finally {
      setAutomationsBusy(false);
    }
  }, [hermesApi, logout, recordDiagnostic, systemPageCopy.automations.loadError, token]);

  const loadRankedTaskAutomations = useCallback(async () => {
    if (!host.policy.preinstalledRanker && !host.policy.preinstalledEmailScanner) return;
    if (!token) return;
    setRankedTaskAutomationsBusy(true);
    setRankedTaskAutomationsError(null);
    try {
      if (host.policy.preinstalledRanker || host.policy.preinstalledEmailScanner) {
        setRankedTaskAutomationsView(await api.rankedTaskAutomations());
      }
    } catch (error) {
      setRankedTaskAutomationsError(userFacingError(displayError(error, "Could not load Ranked Tasks automations.")));
    } finally {
      setRankedTaskAutomationsBusy(false);
    }
  }, [api, token]);

  const mutateAutomation = useCallback(async (
    operation: () => Promise<unknown>,
  ) => {
    setRankedTaskAutomationsBusy(true);
    setRankedTaskAutomationsError(null);
    try {
      await operation();
      if (host.policy.preinstalledRanker || host.policy.preinstalledEmailScanner) {
        setRankedTaskAutomationsView(await api.rankedTaskAutomations());
      }
    } catch (error) {
      // Every automation runs through here now, not only the shipped ones, so
      // the fallback cannot claim to know which kind failed.
      setRankedTaskAutomationsError(userFacingError(displayError(error, "The automation could not be changed.")));
    } finally {
      setRankedTaskAutomationsBusy(false);
    }
  }, [api]);

  /**
   * HPD-463, Justus: "reset und pause Knoepfe fuer default automations", and
   * delete only for what the customer wrote themselves.
   *
   * Each kind is addressed through the route that owns it. A shipped automation
   * is paused through its own role route, which keeps its installation record
   * in step with the runtime; pausing its native job directly would leave the
   * record claiming it is enabled. What the customer wrote has no such record
   * and is addressed by its native job id.
   */
  const setAutomationEnabled = useCallback(async (automation: AutomationCardModel, enabled: boolean) => {
    const role = automation.role;
    if (role) {
      await mutateAutomation(() => api.updateRankedTaskAutomation(role, { enabled }, Crypto.randomUUID()));
      return;
    }
    if (!automation.jobId) return;
    const jobId = automation.jobId;
    await mutateAutomation(async () => {
      await (enabled ? api.resumeHermesJob(jobId) : api.pauseHermesJob(jobId));
      await loadAutomations();
    });
  }, [api, loadAutomations, mutateAutomation]);

  const deleteCustomerAutomation = useCallback(async (automation: AutomationCardModel) => {
    // The card asks first, in the system dialog, and names the automation.
    if (!automation.deletable || !automation.jobId) return;
    const jobId = automation.jobId;
    await mutateAutomation(async () => {
      await api.deleteHermesJob(jobId, Crypto.randomUUID());
      await loadAutomations();
    });
  }, [api, loadAutomations, mutateAutomation]);

  const loadMobilePushStatus = useCallback(async () => {
    if (host.session.mode === "external") return;
    if (!token) return null;
    try {
      const status = await api.mobilePushStatus();
      setMobilePushStatus(status);
      return status;
    } catch (err) {
      const message = displayError(err, "Could not load notification status.");
      recordDiagnostic("error", "Mobile push status failed", message);
      return null;
    }
  }, [api, recordDiagnostic, token]);

  const enableMobilePushForDevice = useCallback(
    async (options: { silent?: boolean } = {}) => {
      if (host.session.mode === "external") return;
      if (!token) return;
      if (Platform.OS === "web") {
        if (!options.silent) setMobilePushNotice("Mobile push is only available in the native app.");
        return;
      }
      setMobilePushBusy(true);
      if (!options.silent) setMobilePushNotice(null);
      try {
        const projectId = easProjectId();
        if (!projectId) throw new Error("EAS project id is missing from the app config.");
        if (Platform.OS === "android") {
          await Notifications.setNotificationChannelAsync("default", {
            name: "Hey Hermes",
            importance: Notifications.AndroidImportance.MAX,
          });
        }
        const existingPermissions = await Notifications.getPermissionsAsync();
        const permissions = existingPermissions.granted ? existingPermissions : await Notifications.requestPermissionsAsync();
        if (!permissions.granted) {
          setMobilePushNotice("Notifications are not allowed on this device yet.");
          return;
        }
        const expoToken = await Notifications.getExpoPushTokenAsync({ projectId });
        const pushToken = expoToken.data;
        if (!pushToken) throw new Error("Expo did not return a push token.");
        const build = nativeBuildNumber();
        const status = await api.registerMobilePushSubscription({
          provider: "expo",
          token: pushToken,
          platform: mobilePushPlatform(),
          deviceName: Platform.OS === "ios" ? "iPhone/iPad" : Platform.OS === "android" ? "Android device" : "Device",
          appVersion: build.nativeVersion,
          buildNumber: build.nativeBuild,
        });
        registeredMobilePushTokenRef.current = pushToken;
        setMobilePushStatus(status);
        setMobilePushNotice(options.silent ? null : "Notifications are connected on this device.");
      } catch (err) {
        const message = displayError(err, "Could not connect push notifications.");
        recordDiagnostic("error", "Mobile push registration failed", message);
        if (!options.silent) setMobilePushNotice(userFacingError(message));
      } finally {
        setMobilePushBusy(false);
      }
    },
    [api, recordDiagnostic, token],
  );

  const sendMobilePushTest = useCallback(async () => {
    if (!token) return;
    setMobilePushBusy(true);
    setMobilePushNotice(null);
    try {
      if (!registeredMobilePushTokenRef.current) {
        await enableMobilePushForDevice({ silent: true });
      }
      const response = await api.sendMobilePushTest();
      const sent = response.sent ?? response.attempted;
      const failed = response.failed ?? 0;
      const skipped = response.skipped ?? 0;
      setMobilePushNotice(
        sent > 0
          ? "Test notification sent to this device."
          : failed > 0
            ? `Test notification could not be delivered: ${response.errors?.[0] ?? "the push provider rejected it."}`
            : skipped > 0
              ? "Push notifications are currently turned off for this account."
              : "No registered push device was available for the test.",
      );
      await loadMobilePushStatus();
    } catch (err) {
      const message = displayError(err, "Could not send a test notification.");
      recordDiagnostic("error", "Mobile push test failed", message);
      setMobilePushNotice(userFacingError(message));
    } finally {
      setMobilePushBusy(false);
    }
  }, [api, enableMobilePushForDevice, loadMobilePushStatus, recordDiagnostic, token]);

  useEffect(() => {
    if (tab === "capabilities" && !nativeCapabilities && !nativeCapabilitiesBusy) {
      void loadNativeCapabilities();
    }
  }, [loadNativeCapabilities, nativeCapabilities, nativeCapabilitiesBusy, tab]);

  useEffect(() => {
    if (tab === "tasks") void loadRankedTasks();
  }, [loadRankedTasks, tab]);

  useEffect(() => {
    const automationLoadKey = token && snapshot?.workspace.id
      ? `${snapshot.workspace.id}:${accountSessionGenerationRef.current}`
      : null;
    if (tab !== "automations" || !automationLoadKey) return;
    if (automationsAutoLoadKeyRef.current === automationLoadKey) return;
    automationsAutoLoadKeyRef.current = automationLoadKey;
    void Promise.all([loadAutomations(), loadRankedTaskAutomations()]);
  }, [loadAutomations, loadRankedTaskAutomations, snapshot?.workspace.id, tab, token]);

  function askAboutCapability(item: NativeCapabilityItem) {
    stopReadAloud();
    setMenuOpen(false);
    setInput(item.prompt || connectionUiMessage(appLocale, "Tell me what {name} is and how I can use it safely.", { name: item.label }));
    setTab("chat");
  }

  function askAboutAutomation(prompt: string) {
    stopReadAloud();
    setMenuOpen(false);
    setInput(prompt);
    setTab("chat");
  }

  /**
   * Erledigt. A card is completed in the Kanban, which owns what a card's status
   * says; a finding has no card, so its own row carries it.
   */
  async function completeRankedTask(row: RankedTaskListRow) {
    await changeRankedTask(() => (row.nativeTaskId
      ? api.updateTask(row.nativeTaskId, { status: "done" })
      : api.updateRankedTask(row.id, { completed: true })));
  }

  /**
   * Löschen. It takes the task off this list and destroys nothing: the Kanban
   * card keeps its card and its own status, the finding keeps its row, and the
   * row stays visible at the bottom of the list saying so.
   */
  async function deleteRankedTask(row: RankedTaskListRow) {
    await changeRankedTask(() => api.updateRankedTask(row.id, { dismissed: true }));
  }

  /** Chat. The composer is filled with this task by title and origin; nothing is sent. */
  function chatAboutRankedTask(row: RankedTaskListRow) {
    stopReadAloud();
    setMenuOpen(false);
    setInput(buildRankedTaskChatPrompt(row, appLocale));
    setTab("chat");
  }

  async function changeRankedTask(operation: () => Promise<unknown>) {
    setTaskNotice(null);
    try {
      await operation();
    } catch {
      setTaskNotice("change_error");
      return;
    }
    await loadRankedTasks();
  }

  function askAboutOtherAiConnection() {
    askAboutAutomation(systemPageCopy.aiAccess.otherConnectionPrompt);
  }

  function selectMobileScreen(
    nextTab: Tab,
    nextSettingsSection: SettingsSection | null = null,
    nextPluginCatalogManagementTarget: string | null = null,
  ) {
    stopReadAloud();
    setMenuOpen(false);
    setTab(nextTab);
    setSettingsSection(nextSettingsSection);
    setPluginCatalogManagementTarget(nextPluginCatalogManagementTarget);
  }

  function commitMobileAccountActionState(next: MobileAccountActionState) {
    accountActionStateRef.current = next;
    setAccountActionState(next);
  }

  function startMobileAccountAction(intent: MobileAccountActionIntent): MobileAccountActionOperation | null {
    const started = mobileAccountActionStarted(accountActionStateRef.current, intent);
    if (!started.operation) return null;
    commitMobileAccountActionState(started.state);
    return started.operation;
  }

  async function settleMobileAccountAction(
    operation: MobileAccountActionOperation,
    mutation: () => Promise<void>,
    fallback: string,
    localizedFallbackOnly = false,
  ) {
    try {
      await mutation();
      const current = accountActionStateRef.current;
      const settled = mobileAccountActionSucceeded(current, operation);
      if (settled !== current) commitMobileAccountActionState(settled);
      return true;
    } catch (err) {
      const message = displayError(err, fallback);
      if (isProductSessionAuthError(message)) {
        await logout(sessionExpiredText());
        return false;
      }
      const current = accountActionStateRef.current;
      const failed = mobileAccountActionFailed(
        current,
        operation,
        localizedFallbackOnly ? fallback : userFacingError(message),
      );
      if (failed !== current) commitMobileAccountActionState(failed);
      return false;
    }
  }

  async function updateGmailRecommendation(action: "snooze" | "dismiss") {
    if (gmailRecommendationBusy) return;
    const requestId = ++guidedSetupRequestRef.current;
    setGmailRecommendationBusy(true);
    setGmailRecommendationError(null);
    try {
      const nextGuidedSetupState = await mobileGuidedSetupRequest(api, {
        kind: "gmail_recommendation",
        action,
      });
      if (requestId === guidedSetupRequestRef.current) setGuidedSetupState(nextGuidedSetupState);
    } catch {
      if (requestId === guidedSetupRequestRef.current) {
        setGmailRecommendationError(t.firstConversation.guidedSetup.choiceSaveError);
      }
    } finally {
      if (requestId === guidedSetupRequestRef.current) setGmailRecommendationBusy(false);
    }
  }

  function openGmailRecommendation() {
    setGuidedSetupPluginTarget("gmail");
    selectMobileScreen("connections_customer");
  }

  function commitMobileAiAccessState(next: MobileAiAccessState) {
    aiAccessStateRef.current = next;
    setAiAccessState(next);
  }

  function settleMobileAiAccess(
    preference: ChatRoutePreference,
    outcome: MobileAiAccessActionOutcome,
    truth = mobileAiAccessTruthFromSources(
      workspaceStatusTruthRef.current,
      snapshotStateRef.current ? chatGptAccountConnectionView(snapshotStateRef.current).ready : null,
      claudeStatus,
    ),
  ) {
    const result = mobileAiAccessResultFromOutcome(preference, outcome, truth);
    const current = aiAccessStateRef.current;
    const next = mobileAiAccessSettled(current, result);
    if (next === current) return false;
    commitMobileAiAccessState(next);
    return true;
  }

  async function persistConfirmedMobileAiAccessPreference(
    preference: ChatRoutePreference,
    sessionGeneration: number,
    requestToken: string,
    confirmedClaudeStatus: ClaudeConnectionStatus | null = claudeStatus,
  ) {
    const modelSelectionGenerationAtPreferenceStart = modelSelectionRequestRef.current;
    let saved = false;
    let automationFollowState = chatRouteAutomationFollowState(null);
    let currentTruth = mobileAiAccessTruthFromSources(
      workspaceStatusTruthRef.current,
      snapshotStateRef.current ? chatGptAccountConnectionView(snapshotStateRef.current).ready : null,
      confirmedClaudeStatus,
    );
    try {
      const confirmationRequestId = ++workspaceStatusTruthRequestRef.current;
      const confirmationStatusTruth = await workspaceStatusTruthRequest(api, { verify: true });
      if (!accountSessionIsCurrent(sessionGeneration, requestToken)) return false;
      if (workspaceStatusTruthRequestRef.current === confirmationRequestId) {
        commitWorkspaceStatusTruth(confirmationStatusTruth);
      }
      currentTruth = mobileAiAccessTruthFromSources(
        confirmationStatusTruth,
        snapshotStateRef.current ? chatGptAccountConnectionView(snapshotStateRef.current).ready : null,
        confirmedClaudeStatus,
      );
      if (!mobileAiAccessCanPersistPreference(preference, "preference_only", currentTruth)) {
        settleMobileAiAccess(preference, "unknown", currentTruth);
        setAiAccessNotice(preference === "included_ai"
          ? systemPageCopy.aiAccess.includedUnavailableAction
          : systemPageCopy.aiAccess.resultUnknown);
        return false;
      }

      setAiAccessAutomationFailure(null);
      const result = await api.setChatRoutePreference({ preference });
      if (!accountSessionIsCurrent(sessionGeneration, requestToken)) return false;
      saved = true;
      automationFollowState = chatRouteAutomationFollowState(result);
      if (host.policy.preinstalledRanker && automationFollowState === "failed") {
        setAiAccessAutomationFailure(result.preference);
        setAiAccessNotice(mobileRouteAutomationFailureCopy(appLocale).message);
      } else if (host.policy.preinstalledRanker && automationFollowState === "unknown") {
        throw new Error("The server did not confirm whether the scheduled tasks followed the AI choice.");
      }
      const statusTruthRequestId = ++workspaceStatusTruthRequestRef.current;
      const [nextModelOptions, nextStatusTruth] = await Promise.all([
        api.modelOptions(),
        workspaceStatusTruthRequest(api),
      ]);
      if (!accountSessionIsCurrent(sessionGeneration, requestToken)) return false;
      if (nextModelOptions.chatRoutePreference !== result.preference || nextStatusTruth.aiAccess.selectedRoute !== result.preference) {
        throw new Error("The server did not confirm one canonical AI access choice.");
      }
      if (modelSelectionRequestRef.current === modelSelectionGenerationAtPreferenceStart) {
        setModelOptions(nextModelOptions);
      }
      setSnapshot((current) => current ? { ...current, chatRoutePreference: result.preference } : current);
      if (workspaceStatusTruthRequestRef.current === statusTruthRequestId) commitWorkspaceStatusTruth(nextStatusTruth);
      const refreshedTruth = mobileAiAccessTruthFromSources(
        nextStatusTruth,
        snapshotStateRef.current ? chatGptAccountConnectionView(snapshotStateRef.current).ready : null,
        confirmedClaudeStatus,
      );
      const settled = settleMobileAiAccess(preference, "preference_only", refreshedTruth);
      if ((!host.policy.preinstalledRanker || automationFollowState === "followed") && settled) setAiAccessNotice(systemPageCopy.aiAccess.resultSuccess);
      return settled;
    } catch {
      if (!accountSessionIsCurrent(sessionGeneration, requestToken)) return false;
      settleMobileAiAccess(preference, "unknown", currentTruth);
      if (automationFollowState !== "failed") {
        setAiAccessNotice(saved ? systemPageCopy.aiAccess.savedUnconfirmed : systemPageCopy.aiAccess.resultUnknown);
      }
      return false;
    }
  }

  async function chooseMobileIncludedModel(modelId: string) {
    if (!token) return;
    const model = modelOptions?.curatedModels.find((candidate) => candidate.id === modelId);
    if (!model || !model.offered || !model.selectable || model.technicalStatus !== "available") return;
    const requestToken = token;
    const sessionGeneration = accountSessionGenerationRef.current;
    const operationId = ++modelSelectionRequestRef.current;
    setModelSelectionBusyId(modelId);
    setModelSelectionError(null);
    try {
      const result = await api.setModelPreference(modelId);
      if (!accountSessionIsCurrent(sessionGeneration, requestToken) || modelSelectionRequestRef.current !== operationId) return;
      const statusTruthRequestId = ++workspaceStatusTruthRequestRef.current;
      try {
        const [nextOptions, nextTruth] = await Promise.all([
          api.modelOptions(),
          workspaceStatusTruthRequest(api),
        ]);
        if (!accountSessionIsCurrent(sessionGeneration, requestToken) || modelSelectionRequestRef.current !== operationId) return;
        if (nextOptions.selectedModelId !== result.selectedModelId || nextTruth.aiAccess.selectedModelId !== result.selectedModelId) {
          throw new Error("The server did not confirm one canonical model choice.");
        }
        setModelOptions(nextOptions);
        if (workspaceStatusTruthRequestRef.current === statusTruthRequestId) commitWorkspaceStatusTruth(nextTruth);
      } catch {
        if (!accountSessionIsCurrent(sessionGeneration, requestToken) || modelSelectionRequestRef.current !== operationId) return;
        setModelSelectionError({
          modelId,
          message: mobileAiModelCopy(appLocale).modelStatusUnknown,
        });
      }
    } catch (error) {
      if (!accountSessionIsCurrent(sessionGeneration, requestToken) || modelSelectionRequestRef.current !== operationId) return;
      setModelSelectionError({
        modelId,
        message: userFacingError(displayError(error, mobileAiModelCopy(appLocale).modelSaveFailed)),
      });
    } finally {
      if (modelSelectionRequestRef.current === operationId) {
        // Retire this selection generation after its canonical readback. Any
        // model-options request that started before or during it is now stale
        // and must not repaint an older model over the confirmed choice.
        modelSelectionRequestRef.current += 1;
        setModelSelectionBusyId(null);
      }
    }
  }

  function confirmMobileIncludedModelChange(modelId: string) {
    const model = modelOptions?.curatedModels.find((candidate) => candidate.id === modelId);
    if (
      !token ||
      !model ||
      modelOptions?.selectedModelId === model.id ||
      modelSelectionBusyId !== null ||
      !model.offered ||
      !model.selectable ||
      model.technicalStatus !== "available"
    ) return;
    const requestToken = token;
    const sessionGeneration = accountSessionGenerationRef.current;
    const selectionGeneration = modelSelectionRequestRef.current;
    let consumed = false;
    const dismiss = () => { consumed = true; };
    const copy = mobileAiModelCopy(appLocale);
    Alert.alert(
      copy.modelChangeTitle,
      copy.modelChangeDetail.replace("{model}", model.modelName),
      [
        { text: systemPageCopy.aiAccess.cancel, style: "cancel", onPress: dismiss },
        {
          text: copy.modelChangeAction.replace("{model}", model.modelName),
          onPress: () => {
            if (consumed) return;
            consumed = true;
            // An Alert can outlive the session or a newer selection. Reject it
            // before entering the write function, including repeated callbacks.
            if (!accountSessionIsCurrent(sessionGeneration, requestToken) ||
                modelSelectionRequestRef.current !== selectionGeneration) return;
            void chooseMobileIncludedModel(model.id);
          },
        },
      ],
      { onDismiss: dismiss },
    );
  }

  async function chooseMobileAiAccess(preference: ChatRoutePreference) {
    if (!token) return;
    const requestToken = token;
    const sessionGeneration = accountSessionGenerationRef.current;
    commitMobileAiAccessState(mobileAiAccessBegin(aiAccessStateRef.current, preference));
    setAiAccessNotice(null);

    const currentTruth = mobileAiAccessTruthFromSources(
      workspaceStatusTruthRef.current,
      snapshotStateRef.current ? chatGptAccountConnectionView(snapshotStateRef.current).ready : null,
      claudeStatus,
    );
    if (mobileAiAccessCanPersistPreference(preference, "preference_only", currentTruth)) {
      await persistConfirmedMobileAiAccessPreference(preference, sessionGeneration, requestToken);
      return;
    }
    if (preference === "included_ai") {
      const statusTruthRequestId = ++workspaceStatusTruthRequestRef.current;
      try {
        const nextStatusTruth = await workspaceStatusTruthRequest(api);
        if (!accountSessionIsCurrent(sessionGeneration, requestToken)) return;
        if (workspaceStatusTruthRequestRef.current === statusTruthRequestId) {
          commitWorkspaceStatusTruth(nextStatusTruth);
        }
        const refreshedTruth = mobileAiAccessTruthFromSources(
          nextStatusTruth,
          snapshotStateRef.current ? chatGptAccountConnectionView(snapshotStateRef.current).ready : null,
          claudeStatus,
        );
        if (mobileAiAccessCanPersistPreference(preference, "preference_only", refreshedTruth)) {
          await persistConfirmedMobileAiAccessPreference(preference, sessionGeneration, requestToken);
          return;
        }
        settleMobileAiAccess(preference, "unknown", refreshedTruth);
      } catch {
        if (!accountSessionIsCurrent(sessionGeneration, requestToken)) return;
        settleMobileAiAccess(preference, "unknown", currentTruth);
      }
      setAiAccessNotice(systemPageCopy.aiAccess.includedModelUnavailable);
      return;
    }

    const outcome = await startSelectedMobileOauth(preference, sessionGeneration, requestToken);
    if (!outcome || !accountSessionIsCurrent(sessionGeneration, requestToken)) return;
    const actionOutcome: MobileAiAccessActionOutcome = outcome.kind === "opened"
      ? "prepared"
      : outcome.kind === "link_failed"
        ? "link_error"
        : "provider_error";
    pendingAiAccessRouteRef.current = outcome.kind === "opened" || outcome.kind === "link_failed" ? preference : null;
    if (settleMobileAiAccess(preference, actionOutcome, currentTruth)) {
      setAiAccessNotice(mobileOauthNotice(outcome));
    }
  }

  async function persistPendingMobileAiAccessRoute(
    provider: MobileAiAccessProviderRoute,
    confirmedClaudeStatus: ClaudeConnectionStatus | null = claudeStatus,
  ) {
    if (pendingAiAccessRouteRef.current !== provider || !token) return false;
    pendingAiAccessRouteRef.current = null;
    const requestToken = token;
    const sessionGeneration = accountSessionGenerationRef.current;
    commitMobileAiAccessState(mobileAiAccessBegin(aiAccessStateRef.current, provider));
    return persistConfirmedMobileAiAccessPreference(provider, sessionGeneration, requestToken, confirmedClaudeStatus);
  }

  function mobileOauthNotice(outcome: MobileAiAccessOauthStartOutcome<unknown>) {
    const copy = mobileAiAccessOauthCopy(appLocale);
    if (outcome.kind === "opened") {
      return outcome.provider === "chatgpt" ? copy.chatGptOpened : copy.claudeOpened;
    }
    if (outcome.failureClass === "runtime_paused") return copy.runtimePaused;
    if (outcome.failureClass === "ios_link_failed") return copy.iosLinkFailed;
    return copy.startUnavailable;
  }

  function recordMobileOauthFailure(outcome: MobileAiAccessOauthStartOutcome<unknown>) {
    if (outcome.kind === "opened") return;
    recordDiagnostic("error", `${outcome.provider} OAuth ${outcome.kind}`, outcome.failureClass);
  }

  async function startSelectedMobileOauth(
    preference: ChatRoutePreference,
    sessionGeneration: number,
    requestToken: string,
  ) {
    if (preference === "chatgpt_account" && !(snapshot && chatGptAccountConnectionView(snapshot).ready)) {
      return startMobileChatGptOauth(sessionGeneration, requestToken);
    }
    if (preference === "claude_account" && !claudeStatus?.connected) {
      return startMobileClaudeOauth(sessionGeneration, requestToken);
    }
    return null;
  }

  async function startMobileChatGptOauth(sessionGeneration: number, requestToken: string) {
    const outcome = await startMobileAiAccessOauth({
      provider: "chatgpt",
      start: () => api.startChatGptConnection(),
      authorizationUrl: (connection) => connection.verificationUrl,
      preserveConnection: async (connection) => {
        if (!accountSessionIsCurrent(sessionGeneration, requestToken)) throw new Error("Account session changed.");
        setDismissedAiAccessChatGptSessionId(null);
        setChatGptConnection(connection);
        await persistChatGptConnection(connection, snapshot?.workspace.id ?? null);
        if (!accountSessionIsCurrent(sessionGeneration, requestToken)) throw new Error("Account session changed.");
        setSessionNotice(chatGptCodeNoticeText(connection.userCode, appLocale), "chatgpt_connection", "code");
      },
      openUrl: (url) => Linking.openURL(url),
    });
    if (!accountSessionIsCurrent(sessionGeneration, requestToken)) return null;
    recordMobileOauthFailure(outcome);
    return outcome;
  }

  async function startMobileClaudeOauth(sessionGeneration: number, requestToken: string) {
    const outcome = await startMobileAiAccessOauth({
      provider: "claude",
      start: () => api.startClaudeConnection(),
      authorizationUrl: (connection) => connection.authorizationUrl,
      preserveConnection: (connection) => {
        if (!accountSessionIsCurrent(sessionGeneration, requestToken)) throw new Error("Account session changed.");
        setDismissedAiAccessClaudeSessionId(null);
        setClaudeConnection(connection);
        setClaudeCode("");
      },
      openUrl: (url) => Linking.openURL(url),
    });
    if (!accountSessionIsCurrent(sessionGeneration, requestToken)) return null;
    recordMobileOauthFailure(outcome);
    return outcome;
  }

  async function reconnectMobileClaudeOauth() {
    if (!token) return;
    const requestToken = token;
    const sessionGeneration = accountSessionGenerationRef.current;
    commitMobileAiAccessState(mobileAiAccessBegin(aiAccessStateRef.current, "claude_account"));
    setAiAccessNotice(null);
    const outcome = await startMobileClaudeOauth(sessionGeneration, requestToken);
    if (!outcome || !accountSessionIsCurrent(sessionGeneration, requestToken)) return;
    const actionOutcome: MobileAiAccessActionOutcome = outcome.kind === "opened"
      ? "prepared"
      : outcome.kind === "link_failed"
        ? "link_error"
        : "provider_error";
    pendingAiAccessRouteRef.current = outcome.kind === "opened" || outcome.kind === "link_failed"
      ? "claude_account"
      : null;
    const currentTruth = mobileAiAccessTruthFromSources(
      workspaceStatusTruthRef.current,
      snapshotStateRef.current ? chatGptAccountConnectionView(snapshotStateRef.current).ready : null,
      claudeStatus,
    );
    if (settleMobileAiAccess("claude_account", actionOutcome, currentTruth)) {
      setAiAccessNotice(mobileOauthNotice(outcome));
    }
  }

  async function openMobileChatGptOauth() {
    if (!chatGptConnection || busy) return;
    try {
      await Linking.openURL(chatGptConnection.verificationUrl);
      setAiAccessNotice(mobileAiAccessOauthCopy(appLocale).chatGptOpened);
    } catch {
      setAiAccessNotice(mobileAiAccessOauthCopy(appLocale).iosLinkFailed);
    }
  }

  async function openMobileClaudeOauth() {
    if (!claudeConnection || busy) return;
    try {
      await Linking.openURL(claudeConnection.authorizationUrl);
      setAiAccessNotice(mobileAiAccessOauthCopy(appLocale).claudeOpened);
    } catch {
      setAiAccessNotice(mobileAiAccessOauthCopy(appLocale).iosLinkFailed);
    }
  }

  async function completeMobileClaudeOauth() {
    if (!claudeConnection || !claudeCode.trim() || busy) return;
    setBusy(true);
    try {
      const result = await api.completeClaudeConnection({ sessionId: claudeConnection.sessionId, code: claudeCode.trim() });
      setClaudeStatus(result);
      setAiAccessNotice(result.connected ? systemPageCopy.aiAccess.claudeConnected : systemPageCopy.aiAccess.claudeFailed);
      if (result.connected) {
        setClaudeConnection(null);
        setClaudeCode("");
        await persistPendingMobileAiAccessRoute("claude_account", result);
        await refresh();
      }
    } catch {
      setAiAccessNotice(systemPageCopy.aiAccess.claudeFailed);
    } finally {
      setBusy(false);
    }
  }

  function openForegroundNotificationNotice(notice: MobileForegroundNotificationNotice) {
    setForegroundNotification(null);
    const action = mobileNotificationAction({
      target: {
        notificationId: notice.id,
        accountId: notice.accountId,
        conversationSessionId: notice.conversationSessionId,
      },
      signedInAccountId: signedInAccountIdRef.current,
      handledNotificationIds: handledNotificationIdsRef.current,
    });
    if (action === "ignore") return;
    if (action === "remember") {
      setPendingNotificationNotice(notice);
      return;
    }
    const nextHandledNotificationIds = mobileHandledNotificationIdsAfter(
      handledNotificationIdsRef.current,
      notice.id,
    );
    handledNotificationIdsRef.current = nextHandledNotificationIds;
    setHandledNotificationIds(nextHandledNotificationIds);
    // A reply notification is an explicit request to see the answer that just
    // arrived. Reset an older reading position before hydration so both warm
    // resume and cold launch follow the target conversation to its latest row.
    jumpToLatestMobileMessage();
    if (notice.conversationSessionId) selectActiveConversationSession(notice.conversationSessionId);
    selectMobileScreen("chat");
    void refresh(Boolean(notice.conversationSessionId));
  }

  useEffect(() => {
    if (!snapshot?.me.id || !pendingNotificationNotice) return;
    const notice = pendingNotificationNotice;
    setPendingNotificationNotice(null);
    openForegroundNotificationNotice(notice);
  }, [pendingNotificationNotice, snapshot?.me.id]);

  async function downloadWorkspaceExport() {
    if (exportDownloadState === "preparing") return;
    setExportDownloadState("preparing");
    // Der Knopf sagt selbst, dass vorbereitet wird; eine zweite Meldung daneben
    // waere dieselbe Aussage zweimal.
    setExportDownloadNotice(null);
    try {
      const prepared = await prepareWorkspaceExportDownload({ api });
      await openMobileBrowserHref({
        api,
        apiBase: API_BASE,
        href: prepared.href,
        openUrl: (url) => Linking.openURL(url),
        openPrivateUrl: (url) => WebBrowser.openBrowserAsync(url),
      });
      setExportDownloadNotice(t.systemPages.account.exportOpened);
    } catch (err) {
      const message = err instanceof WorkspaceExportError
        ? err.message
        : displayError(err, "Your export could not be prepared.");
      recordDiagnostic("error", "Workspace export failed", message);
      setExportDownloadNotice(message);
    } finally {
      setExportDownloadState("idle");
    }
  }

  /**
   * HPD-411: the customer named the full backup and the restore path as
   * belonging on both surfaces. The single export above is HPD-383; this is
   * the archive beside it, queued and then shown in the list below.
   */
  async function createFullArchive() {
    if (archiveState === "queueing") return;
    setArchiveState("queueing");
    setExportDownloadNotice(null);
    try {
      await api.createArchiveJob({ reason: "Full archive requested from the app" });
      setExportDownloadNotice(systemPageCopy.account.archiveQueued);
      await refresh();
    } catch (err) {
      const message = displayError(err, systemPageCopy.account.archiveFailed);
      recordDiagnostic("error", "Full archive failed", message);
      setExportDownloadNotice(message);
    }
    setArchiveState("idle");
  }

  /** One past export, handed over through the same authenticated handoff. */
  async function downloadBackupJob(jobId: string) {
    if (backupDownloadJobId) return;
    setBackupDownloadJobId(jobId);
    setExportDownloadNotice(null);
    try {
      await openMobileBrowserHref({
        api,
        apiBase: API_BASE,
        href: backupJobDownloadHref(jobId),
        openUrl: (url) => Linking.openURL(url),
        openPrivateUrl: (url) => WebBrowser.openBrowserAsync(url),
      });
      setExportDownloadNotice(systemPageCopy.account.exportOpened);
    } catch (err) {
      const message = displayError(err, systemPageCopy.account.downloadFailed);
      recordDiagnostic("error", "Export download failed", message);
      setExportDownloadNotice(message);
    }
    setBackupDownloadJobId(null);
  }

  /**
   * Restoring can overwrite live data, so the app does exactly what the
   * browser does: it opens the conversation with Support instead of starting
   * anything.
   */
  function askAboutRestore() {
    askAboutAutomation(systemPageCopy.account.restorePrompt);
  }

  async function saveAdminPublicKey() {
    if (!adminPublicKeyInput.trim() || securityBusy) return;
    setSecurityBusy("admin_key");
    setSecurityOutcome(null);
    try {
      await api.registerAdminPublicKey({
        publicKey: adminPublicKeyInput.trim(),
        label: adminPublicKeyLabel.trim() || undefined,
      });
      setAdminPublicKeyInput("");
      setAdminPublicKeyLabel("");
      setSecurityOutcome({ action: "admin_key", tone: "info", text: systemPageCopy.security.adminKeySaved });
      await refresh();
    } catch (err) {
      const message = displayError(err, systemPageCopy.security.adminKeyFailed);
      recordDiagnostic("error", "Admin key could not be saved", message);
      setSecurityOutcome({ action: "admin_key", tone: "error", text: message });
    }
    setSecurityBusy(null);
  }

  async function runAdminHandoverCheck() {
    if (securityBusy) return;
    setSecurityBusy("handover");
    setSecurityOutcome(null);
    try {
      await api.runAdminHandover();
      setSecurityOutcome({ action: "handover", tone: "info", text: systemPageCopy.security.handoverChecked });
      await refresh();
    } catch (err) {
      const message = displayError(err, systemPageCopy.security.handoverFailed);
      recordDiagnostic("error", "Handover check could not run", message);
      setSecurityOutcome({ action: "handover", tone: "error", text: message });
    }
    setSecurityBusy(null);
  }

  async function revokeWorkspaceSupportGrant(grantId: string) {
    if (revokingSupportGrantId) return;
    setRevokingSupportGrantId(grantId);
    setSecurityOutcome(null);
    try {
      await api.revokeSupportGrant(grantId);
      setSecurityOutcome({ action: "revoke", grantId, tone: "info", text: systemPageCopy.security.revokeDone });
      await refresh();
    } catch (err) {
      const message = displayError(err, systemPageCopy.security.revokeFailed);
      recordDiagnostic("error", "Support grant could not be revoked", message);
      setSecurityOutcome({ action: "revoke", grantId, tone: "error", text: message });
    }
    setRevokingSupportGrantId(null);
  }

  async function openSecurityAnchor(url: string) {
    if (securityBusy) return;
    setSecurityBusy("anchor");
    setSecurityOutcome(null);
    try {
      await Linking.openURL(url);
    } catch (err) {
      const message = displayError(err, systemPageCopy.security.anchorOpenFailed);
      recordDiagnostic("error", "External anchor could not be opened", message);
      setSecurityOutcome({ action: "anchor", tone: "error", text: message });
    }
    setSecurityBusy(null);
  }

  /** See `mobile-security-receipt.ts` for what leaves the device and what does not. */
  async function shareSecurityAuditReceipt() {
    if (securityBusy) return;
    setSecurityBusy("receipt");
    setSecurityOutcome(null);
    try {
      await shareSecurityAuditReceiptFile({
        fileSystem: FileSystem,
        receipt: await api.securityAuditReceipt(),
        share: (payload) => Share.share(payload),
      });
      setSecurityOutcome({ action: "receipt", tone: "info", text: systemPageCopy.security.receiptShared });
    } catch (err) {
      const message = displayError(err, systemPageCopy.security.receiptFailed);
      recordDiagnostic("error", "Security audit receipt failed", message);
      setSecurityOutcome({ action: "receipt", tone: "error", text: message });
    }
    setSecurityBusy(null);
  }

  async function openNativeHermesDashboard() {
    if (dashboardOpenState === "opening") return;
    setMenuOpen(false);
    setDashboardOpenState("opening");
    try {
      const route = await api.hermesDashboardRoute();
      if (route.href) {
        await openMobileBrowserHref({
          api,
          apiBase: API_BASE,
          href: route.href,
          openUrl: (url) => Linking.openURL(url),
          openPrivateUrl: (url) => WebBrowser.openBrowserAsync(url),
        });
        setDashboardOpenState("idle");
        return;
      }
      setDashboardOpenState("error");
    } catch (err) {
      const message = displayError(err, "Hermes Dashboard could not be opened.");
      recordDiagnostic("error", "Hermes Dashboard failed", message);
      setDashboardOpenState("error");
    }
  }

  async function updatePreferredLocale(preferredLocale: AppLocale) {
    setAppLocale(preferredLocale);
    try {
      const updated = await api.updateMePreferences({ preferredLocale });
      setSnapshot((current) =>
        current
          ? {
              ...current,
              me: updated,
              accounts: current.accounts.map((account) =>
                account.id === updated.id ? { ...account, preferredLocale: updated.preferredLocale } : account,
              ),
            }
          : current,
      );
    } catch (err) {
      const message = displayError(err, "Could not save language.");
      recordDiagnostic("error", "Language save failed", message);
      setAppError(userFacingError(message));
      setAppLocale(normalizeMobileLocale(snapshot?.me.preferredLocale));
    }
  }

  function updateAppearancePreference(preference: AppearancePreference) {
    setAppearancePreference(preference);
    void persistStoredString(appearancePreferenceStorageKey, preference);
  }

  useEffect(() => {
    if (!token || !snapshot) return;
    let cancelled = false;
    api
      .chatSuggestions()
      .then((suggestions) => {
        if (!cancelled) setChatSuggestions(suggestions);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [api, token, snapshot?.workspace.id, snapshot?.me.preferredLocale]);

  useEffect(() => {
    if (!token || !snapshot || (tab !== "chat" && tab !== "connections_customer")) return;
    if (chatPendingText || chatStreamingText) return;
    let cancelled = false;
    void mobileFirstConversationRequest(api)
      .then((next) => {
        if (!cancelled) setFirstConversationSnapshot(next);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [api, chatPendingText, chatStreamingText, messages.length, snapshot?.workspace.id, tab, token]);

  useEffect(() => {
    if (!token || !snapshot || (tab !== "chat" && tab !== "connections_customer" && tab !== "ai_access")) return;
    let cancelled = false;
    void mobileGuidedSetupRequest(api)
      .then((next) => {
        if (!cancelled) setGuidedSetupState(next);
      })
      .catch(() => {
        if (!cancelled) setGuidedSetupState(null);
      });
    return () => {
      cancelled = true;
    };
  }, [api, snapshot?.workspace.id, tab, token]);

  useEffect(() => {
    if (!token || tab !== "account") return;
    let cancelled = false;
    void api.workspaceServerIdentity()
      .then((identity) => {
        if (!cancelled) setServerIdentity(identity);
      })
      .catch(() => {
        if (!cancelled) setServerIdentity(null);
      });
    return () => {
      cancelled = true;
    };
  }, [api, tab, token]);

  useEffect(() => {
    if (tab !== "ai_access" || !token || !snapshot) return;
    void refreshMobileAiAccessTruth();
  }, [refreshMobileAiAccessTruth, snapshot?.workspace.id, tab, token]);

  useEffect(() => {
    commitMobileAccountActionState(reconcileMobileAccountActionState(
      accountActionStateRef.current,
      mobileAccountActionIntents(snapshot),
    ));
  }, [snapshot]);

  useEffect(() => {
    pluginCatalogRequestRef.current += 1;
    pluginChatFallbackRef.current = null;
    setPluginCatalog(null);
    setPluginCatalogBusy(false);
    setPluginCatalogAttempted(false);
    setPluginCatalogError(null);
    setPluginCatalogNotice(null);
    guidedSetupRequestRef.current += 1;
    setGuidedSetupState(null);
    setGmailRecommendationBusy(false);
    setGmailRecommendationError(null);
    setGuidedSetupPluginTarget(null);
    pendingAiAccessRouteRef.current = null;
    commitMobileAiAccessState(initialMobileAiAccessState);
    setAiAccessNotice(null);
    setAiAccessAutomationFailure(null);
  }, [snapshot?.workspace.id, token]);

  useEffect(() => {
    if (!token || !snapshot || tab !== "connections_customer") return;
    void loadPluginCatalog().catch(() => undefined);
  }, [loadPluginCatalog, snapshot?.workspace.id, tab, token]);

  useEffect(() => {
    if (!token || !snapshot) return;
    let cancelled = false;
    const locale = normalizeMobileLocale(snapshot.me.preferredLocale);
    void api.suggestions(locale).then((response) => {
      if (!cancelled) setHeySuggestions(response.suggestions.filter((item) => host.policy.preinstalledRanker || !isPreinstalledR8Suggestion(item)));
    }).catch(() => {
      if (!cancelled) setHeySuggestionNotice("Suggestions are temporarily unavailable.");
    });
    if (heySuggestionNudgeWorkspaceRef.current !== snapshot.workspace.id) {
      heySuggestionNudgeWorkspaceRef.current = snapshot.workspace.id;
      void api.suggestionHomeNudge({ sessionId: heySuggestionSessionIdRef.current, locale }).then((response) => {
        if (!cancelled && response.result.kind === "selected") {
          const suggestion = response.result.suggestion;
          if (!host.policy.preinstalledRanker && isPreinstalledR8Suggestion(suggestion)) return;
          setHeySuggestionNudge(suggestion);
          setHeySuggestions((current) => current.map((item) => item.id === suggestion.id ? suggestion : item));
        }
      }).catch(() => undefined);
    }
    return () => {
      cancelled = true;
    };
  }, [api, token, snapshot?.workspace.id, snapshot?.me.preferredLocale]);

  useEffect(() => {
    if (!token || !snapshot) return;
    void loadMobilePushStatus();
    if (mobilePushRegistrationAttemptedRef.current) return;
    mobilePushRegistrationAttemptedRef.current = true;
    void enableMobilePushForDevice({ silent: true });
  }, [enableMobilePushForDevice, loadMobilePushStatus, snapshot, token]);

  useEffect(() => {
    const nextContext = { tab, activeConversationSessionId };
    mobileNotificationContextRef.current = nextContext;
    mobileForegroundNotificationContext = nextContext;
    if (foregroundNotification && foregroundNotificationTargetsVisibleChat(foregroundNotification, nextContext)) {
      setForegroundNotification(null);
    }
  }, [activeConversationSessionId, foregroundNotification, tab]);

  useEffect(() => {
    if (!token) return;
    const received = Notifications.addNotificationReceivedListener((notification) => {
      const notice = foregroundNotificationNoticeFromExpo(notification, appLocale);
      if (foregroundNotificationTargetsVisibleChat(notice, mobileNotificationContextRef.current)) {
        void refresh();
        void loadMobilePushStatus();
        return;
      }
      setForegroundNotification(notice);
      void loadMobilePushStatus();
    });
    return () => {
      received.remove();
    };
  }, [appLocale, loadMobilePushStatus, refresh, token]);

  useEffect(() => {
    const response = Notifications.addNotificationResponseReceivedListener((notificationResponse) => {
      openForegroundNotificationNotice(foregroundNotificationNoticeFromExpo(notificationResponse.notification, appLocale));
    });
    return () => {
      response.remove();
    };
  }, [appLocale, handledNotificationIds, refresh]);

  useEffect(() => {
    let active = true;

    void readStoredString(appearancePreferenceStorageKey).then((stored) => {
      if (!active || (stored !== "system" && stored !== "light" && stored !== "dark")) return;
      setAppearancePreference(stored);
    });

    readStoredToken()
      .then(({ token: savedToken }) => {
        if (!active) return;
        if (savedToken) {
          activateAccountSession(savedToken);
          setToken(savedToken);
        }
      })
      .catch((err) => {
        if (!active) return;
        setAppError(displayError(err, "Could not restore the saved session."));
      })
      .finally(() => {
        if (active) setSessionRestored(true);
      });

    return () => {
      active = false;
    };
  }, [setAppError]);

  useEffect(() => {
    if (host.session.mode === "standalone") Appearance.setColorScheme(appearancePreference === "system" ? null : appearancePreference);
  }, [appearancePreference]);

  useEffect(() => {
    if (previousConversationSessionIdRef.current === activeConversationSessionId) return;
    previousConversationSessionIdRef.current = activeConversationSessionId;
    stopReadAloudTransport();
    commitReadAloudState(mobileReadAloudConversationChanged(
      readAloudStateRef.current,
      latestAssistantMessage(messagesStateRef.current)?.id ?? null,
    ));
  }, [activeConversationSessionId, commitReadAloudState, stopReadAloudTransport]);

  useEffect(() => {
    if (!sessionRestored || !token || snapshot) return;
    void refresh();
    const retry = setInterval(() => {
      void refresh();
    }, 2500);
    return () => clearInterval(retry);
  }, [refresh, sessionRestored, snapshot, token]);

  useEffect(() => {
    if (!token) return;
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active" && snapshotStateRef.current) {
        void refreshProductAccess();
        // Notifications can arrive while suspended. Reuse guarded hydration;
        // an already-running refresh must not swallow this resume event.
        void refresh(true);
      }
    });
    return () => subscription.remove();
  }, [refresh, refreshProductAccess, token]);

  useEffect(() => {
    if (!token || !snapshot) {
      setDelegatedTasks([]);
      return;
    }
    let cancelled = false;
    let requestController: AbortController | null = null;
    const poll = () => {
      requestController?.abort();
      requestController = new AbortController();
      void hermesApi.delegatedTasks({ signal: requestController.signal })
        .then((tasks) => {
          if (!cancelled) setDelegatedTasks(tasks);
        })
        .catch(() => undefined);
    };
    poll();
    const timer = setInterval(poll, 2_500);
    return () => {
      cancelled = true;
      requestController?.abort();
      clearInterval(timer);
    };
  }, [hermesApi, snapshot?.workspace.id, token]);

  useEffect(() => {
    if (!snapshot || chatGptAccountConnectionView(snapshot).ready || chatGptConnection) return;
    let active = true;
    readStoredChatGptConnection(snapshot.workspace.id).then((connection) => {
      if (!active || !connection) return;
      setChatGptConnection(connection);
      setSessionNotice("ChatGPT sign-in is still waiting. If you approved it, tap \"I signed in\".", "chatgpt_connection", "reconnect_prompt");
    });
    return () => {
      active = false;
    };
  }, [chatGptConnection, snapshot]);

  useEffect(() => {
    if (snapshot && chatGptAccountConnectionView(snapshot).ready) setDismissedChatGptPanelKey(null);
  }, [snapshot]);

  useEffect(() => {
    if (!snapshot || !chatGptConnection || !shouldPollChatGptConnection(snapshot, true)) return;
    let active = true;

    const check = async () => {
      try {
        const response = await api.completeChatGptConnection({ sessionId: chatGptConnection.sessionId });
        if (!active) return;
        const outcome = chatGptConnectionCompletionOutcome(response);
        if (outcome.clearPollingSession) active = false;
        if (outcome.connected) {
          setChatGptConnection(null);
          await clearStoredChatGptConnection();
          setSessionNotice(response.message, "chatgpt_connection", "confirmation");
          await persistPendingMobileAiAccessRoute("chatgpt_account");
          await refresh();
        } else if (outcome.clearPollingSession) {
          setChatGptConnection(null);
          await clearStoredChatGptConnection();
          setSessionNotice(response.message || "Reconnect ChatGPT to try again.", "chatgpt_connection", "reconnect_prompt");
        }
      } catch (err) {
        if (!active) return;
        const message = displayError(err, "Could not check ChatGPT sign-in.");
        if (!message.toLowerCase().includes("still waiting")) setSessionNotice(userFacingError(message), "chatgpt_connection", "reconnect_prompt");
      }
    };

    void check();
    const interval = setInterval(() => void check(), Math.max(3000, chatGptConnection.pollIntervalSeconds * 1000));
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [api, chatGptConnection, refresh, snapshot]);

  useEffect(() => {
    if (!snapshot) return;
    if (snapshot.workspace.accountId !== snapshot.me.id && settingsSection === "connections") {
      setSettingsSection(null);
    }
  }, [settingsSection, snapshot]);

  async function runAction(
    label: string,
    fallback: string,
    action: () => Promise<void>,
    errorOwner: string | null = null,
    errorRoutePreference: ChatRoutePreference | null = null,
    localizedFallbackOnly = false,
    ownsPresentation: () => boolean = () => true,
  ) {
    setBusy(true);
    setBusyLabel(label);
    setAppError(null);
    try {
      await action();
      return true;
    } catch (err) {
      const message = displayError(err, fallback);
      if (isProductSessionAuthError(message)) {
        await logout(sessionExpiredText());
        return false;
      }
      if (ownsPresentation()) setAppError(localizedFallbackOnly ? fallback : userFacingError(message), errorOwner, errorRoutePreference);
      return false;
    } finally {
      if (ownsPresentation()) {
        setBusy(false);
        setBusyLabel(null);
      }
    }
  }

  function commitSecureConnectionEntryRequest(next: MobileConnectionSecureEntryRequest | null) {
    secureConnectionEntryRequestRef.current = next;
    setSecureConnectionEntryRequest(next);
  }

  function commitSecureSecretEntryRequest(next: SecureSecretEntryRequest | null) {
    secureSecretEntryRequestRef.current = next;
    setSecureSecretEntryRequest(next);
  }

  function presentSecureSecretEntryRequest(next: SecureSecretEntryRequest | null) {
    if (next === secureSecretEntryRequestRef.current) return;
    if (next) setSecureSecretEntryReceipt(null);
    commitSecureSecretEntryRequest(next);
  }

  async function reconcileSecureSecretEntryRequest(
    candidate: SecureSecretEntryRequest,
    revalidateSettled: boolean,
    stillOwnsSource = () => true,
  ) {
    const current = secureSecretEntryRequestRef.current;
    if (
      (revalidateSettled && !sameSecureSecretEntryRequest(current, candidate)) ||
      (!revalidateSettled && current && !sameSecureSecretEntryRequest(current, candidate))
    ) return;
    const accountGeneration = accountSessionGenerationRef.current;
    const requestToken = accountSessionTokenRef.current;
    if (!requestToken || !secureSecretEntryResolutionGate.claim(candidate, revalidateSettled)) return;
    try {
      const resolution = await api.secureSecretEntryRequest(candidate.id);
      if (
        !secureSecretEntryResolutionGate.isInFlight(candidate) ||
        !accountSessionIsCurrent(accountGeneration, requestToken) ||
        !stillOwnsSource() ||
        (secureSecretEntryRequestRef.current &&
          !sameSecureSecretEntryRequest(secureSecretEntryRequestRef.current, candidate))
      ) {
        secureSecretEntryResolutionGate.settle(candidate);
        return;
      }
      secureSecretEntryResolutionGate.settle(candidate);
      presentSecureSecretEntryRequest(secureSecretEntryAfterResolution(
        secureSecretEntryRequestRef.current,
        candidate,
        resolution,
        { conversationSessionId: candidate.conversationSessionId, runId: candidate.runId },
      ));
    } catch {
      secureSecretEntryResolutionGate.backoff(candidate);
    }
  }

  useEffect(() => {
    secureConnectionEntrySaveRef.current = null;
    commitSecureConnectionEntryRequest(null);
    setSecureSecretEntryBusyId(null);
    setSecureSecretEntryReceipt(null);
    secureSecretEntryResolutionGate.reset();
    commitSecureSecretEntryRequest(null);
  }, [secureSecretEntryResolutionGate, snapshot?.me.id, snapshot?.workspace.id, token]);

  useEffect(() => {
    const conversationSessionId = activeConversationSessionId;
    if (!token || !snapshot || !conversationSessionId) return;
    if (secureSecretEntryRequest?.conversationSessionId === conversationSessionId) return;
    const previousRequest = secureSecretEntryRequestRef.current;
    if (previousRequest) {
      secureSecretEntryResolutionGate.settle(previousRequest);
      presentSecureSecretEntryRequest(null);
    }
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let retryDelayMs = 30_000;
    const accountGeneration = accountSessionGenerationRef.current;
    const requestToken = accountSessionTokenRef.current;
    const schedule = () => {
      if (!cancelled) timer = setTimeout(() => void discover(), retryDelayMs);
    };
    const discover = async () => {
      const requestAtStart = secureSecretEntryRequestRef.current;
      try {
        const pending = await api.pendingSecureSecretEntryRequests(conversationSessionId);
        const current = secureSecretEntryRequestRef.current;
        if (
          cancelled ||
          !requestToken ||
          !accountSessionIsCurrent(accountGeneration, requestToken) ||
          activeConversationSessionIdRef.current !== conversationSessionId ||
          (current !== requestAtStart && current?.conversationSessionId === conversationSessionId)
        ) return;
        const next = secureSecretEntryAfterDiscovery(
          current,
          pending,
          { conversationSessionId },
        );
        presentSecureSecretEntryRequest(next);
        retryDelayMs = 30_000;
        if (next?.conversationSessionId !== conversationSessionId) schedule();
      } catch {
        retryDelayMs = Math.min(10 * 60_000, retryDelayMs * 2);
        schedule();
      }
    };
    void discover();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [
    activeConversationSessionId,
    api,
    secureSecretEntryRequest?.conversationSessionId,
    secureSecretEntryRequest?.id,
    secureSecretEntryResolutionGate,
    snapshot?.me.id,
    snapshot?.workspace.id,
    token,
  ]);

  useEffect(() => {
    const request = secureSecretEntryRequest;
    if (!request || !token) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const tick = async () => {
      if (cancelled || !sameSecureSecretEntryRequest(secureSecretEntryRequestRef.current, request)) return;
      await reconcileSecureSecretEntryRequest(request, true);
      if (cancelled || !sameSecureSecretEntryRequest(secureSecretEntryRequestRef.current, request)) return;
      timer = setTimeout(() => void tick(), secureSecretEntryResolutionGate.delayUntilClaim(request));
    };
    void tick();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      secureSecretEntryResolutionGate.settle(request);
    };
  }, [
    api,
    secureSecretEntryRequest?.conversationSessionId,
    secureSecretEntryRequest?.id,
    secureSecretEntryRequest?.runId,
    secureSecretEntryResolutionGate,
    token,
  ]);

  useEffect(() => {
    if (host.session.mode === "external" || Platform.OS !== "ios") return;
    let cancelled = false;
    createApiClient({ baseUrl: API_BASE, token: "login" }).nativeAuthConfig("ios")
      .then((value) => {
        if (!cancelled) setNativeAuthConfig(value);
      })
      .catch(() => {
        if (!cancelled) setNativeAuthConfig({ productRealm: "heyhermes.v1", providers: {}, surface: "ios" });
      });
    void AppleAuthentication.isAvailableAsync().then((available) => {
      if (!cancelled) setAppleSignInAvailable(available);
    }).catch(() => {
      if (!cancelled) setAppleSignInAvailable(false);
    });
    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    if (Platform.OS !== "ios" || !nativeAuthConfig?.providers.google) return;
    let cancelled = false;
    const mode = token ? "link" : "login";
    createApiClient({ baseUrl: API_BASE, token: token || "login" })
      .nativeAuthChallenge({ mode, provider: "google", surface: "ios" })
      .then((challenge) => {
        if (!cancelled) setGoogleChallenge({ ...challenge, mode });
      })
      .catch(() => {
        if (!cancelled) setGoogleChallenge(null);
      });
    return () => {
      cancelled = true;
    };
  }, [googleChallengeVersion, nativeAuthConfig?.providers.google?.clientId, token]);

  // The Google challenge has to be minted before the user taps, because the auth
  // request needs its nonce up front. Server-side challenges expire, so refresh
  // this one while the sign-in surface stays open instead of letting an idle
  // screen hand Google a stale nonce. Never refresh mid-flow: the in-flight
  // request already carries the current nonce.
  useEffect(() => {
    if (Platform.OS !== "ios" || !nativeAuthConfig?.providers.google || nativeAuthBusy) return;
    const timer = setInterval(
      () => setGoogleChallengeVersion((current) => current + 1),
      nativeAuthChallengeRefreshMs,
    );
    return () => clearInterval(timer);
  }, [nativeAuthConfig?.providers.google?.clientId, nativeAuthBusy]);

  async function completeNativeSignIn(
    provider: "apple" | "google",
    idToken: string,
    challenge: { id: string; nonce: string },
    mode: "link" | "login" = "login",
  ) {
    const session = await createApiClient({ baseUrl: API_BASE, token: token || "login" }).nativeAuthSession({
      challengeId: challenge.id,
      idToken,
      mode,
      nonce: challenge.nonce,
      provider,
      surface: "ios",
    });
    await persistToken(session.token);
    refreshGenerationRef.current += 1;
    homeChatRefreshSingleFlight.clear();
    activateAccountSession(session.token);
    setToken(session.token);
    snapshotStateRef.current = null;
    setSnapshot(null);
    setModelOptions(null);
    commitWorkspaceStatusTruth(null);
    setAppError(null);
  }

  useEffect(() => {
    if (!googleAuthResponse) return;
    if (googleAuthResponse.type !== "success") {
      setNativeAuthBusy(null);
      setGoogleChallengeVersion((current) => current + 1);
      return;
    }
    const idToken = googleAuthResponse.params.id_token;
    if (!idToken) {
      setNativeAuthBusy(null);
      setAppError("Google did not return a valid Hey Hermes identity.");
      return;
    }
    if (!googleChallenge || googleChallenge.mode !== nativeAuthModeRef.current) {
      setNativeAuthBusy(null);
      setAppError("This Google sign-in attempt expired. Start again.");
      return;
    }
    void completeNativeSignIn("google", idToken, googleChallenge, nativeAuthModeRef.current)
      .catch((caught) => setAppError(userFacingError(displayError(caught, "Google sign-in failed."))))
      .finally(() => {
        setNativeAuthBusy(null);
        setGoogleChallengeVersion((current) => current + 1);
      });
  }, [googleAuthResponse]);

  async function signInWithGoogle(mode: "link" | "login" = "login") {
    if (!googleAuthRequest || !googleChallenge || googleChallenge.mode !== mode || nativeAuthBusy) return;
    nativeAuthModeRef.current = mode;
    setNativeAuthBusy("google");
    setAppError(null);
    try {
      await promptGoogleAuth();
    } catch (caught) {
      setNativeAuthBusy(null);
      setAppError(userFacingError(displayError(caught, "Google sign-in failed.")));
    }
  }

  async function signInWithApple(mode: "link" | "login" = "login") {
    if (!nativeAuthConfig?.providers.apple || !appleSignInAvailable || nativeAuthBusy) return;
    setNativeAuthBusy("apple");
    setAppError(null);
    try {
      const challenge = await createApiClient({ baseUrl: API_BASE, token: token || "login" })
        .nativeAuthChallenge({ mode, provider: "apple", surface: "ios" });
      const credential = await AppleAuthentication.signInAsync({
        nonce: challenge.nonce,
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        state: `state_${Crypto.randomUUID().replace(/-/g, "")}`,
      });
      const credentialState = await AppleAuthentication.getCredentialStateAsync(credential.user);
      if (credentialState !== AppleAuthentication.AppleAuthenticationCredentialState.AUTHORIZED) {
        throw new Error("The Apple credential is revoked or unavailable.");
      }
      if (!credential.identityToken) throw new Error("Apple did not return a valid Hey Hermes identity.");
      await completeNativeSignIn("apple", credential.identityToken, challenge, mode);
    } catch (caught) {
      const code = typeof caught === "object" && caught && "code" in caught ? String(caught.code) : "";
      if (code !== "ERR_REQUEST_CANCELED") {
        setAppError(userFacingError(displayError(caught, "Apple sign-in failed.")));
      }
    } finally {
      setNativeAuthBusy(null);
    }
  }

  async function login() {
    const loginEmail = email.trim();
    const code = accessCode.trim();
    const password = loginPassword;
    if (!loginEmail || (!password && !code)) return;

    await runAction("Signing in...", "Login failed.", async () => {
      // Same contract the web client already proves: the server branches on
      // `password ?`, so exactly one credential goes up and the password wins.
      // Sending only accessCode is what locked out every redeemed-invite user,
      // whose password was being checked against the access-code hash.
      const session = await createApiClient({ baseUrl: API_BASE, token: "login" }).login({
        email: loginEmail,
        password: password || undefined,
        accessCode: password ? undefined : code,
      });
      await persistToken(session.token);
      refreshGenerationRef.current += 1;
      homeChatRefreshSingleFlight.clear();
      activateAccountSession(session.token);
      setToken(session.token);
      snapshotStateRef.current = null;
      setSnapshot(null);
      setModelOptions(null);
      commitWorkspaceStatusTruth(null);
      setAppError(null);
    });
  }

  async function connectChatGpt() {
    setDismissedChatGptPanelKey(null);
    await runAction("Starting ChatGPT sign-in...", "Could not start ChatGPT sign-in.", async () => {
      const connection = await api.startChatGptConnection();
      setDismissedAiAccessChatGptSessionId(null);
      setChatGptConnection(connection);
      await persistChatGptConnection(connection, snapshot?.workspace.id ?? null);
      setSessionNotice(chatGptCodeNoticeText(connection.userCode, appLocale), "chatgpt_connection", "code");
      await Linking.openURL(connection.verificationUrl);
    });
  }

  async function openChatGptSignIn() {
    if (!chatGptConnection || busy) return;
    await runAction("Opening ChatGPT...", "Could not open ChatGPT sign-in.", async () => {
      await Linking.openURL(chatGptConnection.verificationUrl);
    });
  }

  async function completeChatGptConnection() {
    if (!chatGptConnection || busy) return;
    await runAction("Checking ChatGPT sign-in...", "Could not complete ChatGPT sign-in.", async () => {
      const response = await api.completeChatGptConnection({ sessionId: chatGptConnection.sessionId });
      const outcome = chatGptConnectionCompletionOutcome(response);
      setSessionNotice(response.message, "chatgpt_connection", "confirmation");
      if (outcome.connected) {
        setChatGptConnection(null);
        await clearStoredChatGptConnection();
        await persistPendingMobileAiAccessRoute("chatgpt_account");
        await refresh();
      } else if (outcome.clearPollingSession) {
        setChatGptConnection(null);
        await clearStoredChatGptConnection();
      }
    });
  }

  async function copyChatGptCodeInChat() {
    if (!chatGptConnection) return;
    const copied = await writeClipboardText(chatGptConnection.userCode);
    showCopyNotice(copied ? "Code copied." : "Could not copy the code.");
  }

  async function copyChatGptCodeInAiAccess() {
    if (!chatGptConnection) return;
    const copied = await writeClipboardText(chatGptConnection.userCode);
    setAiAccessNotice(copied ? "Code copied." : "Could not copy the code.");
  }

  async function loadMobileChatSession(sessionId: string, options: { force?: boolean; preserveDraft?: boolean } = {}) {
    // `busy` means a run this screen started is still streaming. It guards
    // against a load racing that stream. Deliberate navigation is not a race:
    // refusing it silently left the customer in a conversation they had already
    // asked to leave, and refused every tap on a sub thread link while a reply
    // was running.
    if (!mobileChatSessionLoadAllowed({
      busy,
      chatSessionsBusy,
      deliberate: Boolean(options.force),
      loadingOlderMessages,
    })) return false;
    const selectionVersion = ++conversationSelectionVersionRef.current;
    chatSessionLoadVersionRef.current = selectionVersion;
    stopReadAloud();
    setChatSessionsBusy(true);
    setChatSessionNotice(null);
    try {
      const [page, activeRun] = await Promise.all([
        chatConversationController.refreshMessages(createHomechatPagedState<ChatMessage>(), {
          conversationId: sessionId,
          limit: 50,
        }),
        hermesApi.activeRun({ conversationId: sessionId }).catch(() => null),
      ]);
      if (conversationSelectionVersionRef.current !== selectionVersion) return false;
      if (page.phase === "error") throw new Error(page.error || "Could not open that chat.");
      selectActiveConversationSession(sessionId, "preserve_version");
      commitReadAloudState(mobileReadAloudConversationChanged(
        readAloudStateRef.current,
        latestAssistantMessage(page.items)?.id ?? null,
      ));
      messagesStateRef.current = page.items;
      setMessages(page.items);
      setFailedMessage(null);
      if (!options.preserveDraft) {
        setPendingAttachments([]);
        setAttachmentNotice(null);
      }
      mobileScrollIntentRef.current = initialMobileScrollIntent;
      messagesScrollOffsetRef.current = 0;
      setShowScrollDown(false);
      setMessagesNextBefore(page.cursor);
      setChatEventsByRunId({});
      explainedRunFailuresRef.current.clear();
      setChatRunStatusesById(activeRun ? { [activeRun.id]: activeRun.status } : {});
      setChatSessionsOpen(false);
      setMenuOpen(false);
      setTab("chat");
      if (activeRun && resumingChatRunRef.current !== activeRun.id) {
        void resumeChatRun(activeRun.id, sessionId, page.items);
      }
      return true;
    } catch (err) {
      if (conversationSelectionVersionRef.current !== selectionVersion) return false;
      const message = displayError(err, "Could not open that chat.");
      recordDiagnostic("error", "Chat session load failed", message);
      setChatSessionNotice(userFacingError(message));
      return false;
    } finally {
      if (chatSessionLoadVersionRef.current === selectionVersion) {
        chatSessionLoadVersionRef.current = null;
        setChatSessionsBusy(false);
      }
    }
  }

  // Opening a delegated task opens its own conversation on the same chat
  // screen. Remember where the user came from so the header can offer the way
  // back instead of the global menu. The tap is deliberate navigation, so it
  // opens even while a reply is still streaming in the conversation behind it.
  async function openMobileSubthread(conversationId: string, taskName: string | null) {
    const parentConversationId = activeConversationSessionIdRef.current;
    await loadMobileChatSession(conversationId, { force: true });
    if (activeConversationSessionIdRef.current !== conversationId) return;
    setSubthreadOrigin((current) => mobileSubthreadOriginAfterOpen({
      current,
      parentConversationId,
      subthreadConversationId: conversationId,
      taskName,
    }));
  }

  async function leaveMobileSubthread(parentConversationId: string) {
    // Only stop calling this a sub thread once the parent is actually open.
    const left = await loadMobileChatSession(parentConversationId, { force: true });
    if (left) setSubthreadOrigin(null);
  }

  function dismissDelegatedTask(taskId: string) {
    setDismissedDelegatedTaskIds((current) => current.includes(taskId) ? current : [...current, taskId]);
  }

  // Closing a card that is still working has to end the work, not only hide the
  // row. The card goes only once the sub order has actually been called off.
  // Answers whether the sub order was called off, so a caller can decide what
  // else it is allowed to take off the screen.
  async function closeDelegatedTask(task: HermesDelegatedTask): Promise<boolean> {
    if (mobileDelegatedTaskCloseIntent({ terminal: mobileDelegatedTaskIsTerminal(task.state) }) === "close") {
      dismissDelegatedTask(task.taskId);
      return false;
    }
    if (stoppingDelegatedTaskIds.includes(task.taskId)) return false;
    setStoppingDelegatedTaskIds((current) => [...current, task.taskId]);
    try {
      const stopped = await hermesApi.stopDelegatedTask(task.taskId);
      setDelegatedTasks((current) => current.map((item) => item.taskId === stopped.taskId ? stopped : item));
      dismissDelegatedTask(stopped.taskId);
      return true;
    } catch (err) {
      const message = displayError(err, "Could not stop that delegated task.");
      recordDiagnostic("error", "Delegated task stop failed", message);
      setAppError(userFacingError(message));
      return false;
    } finally {
      setStoppingDelegatedTaskIds((current) => current.filter((id) => id !== task.taskId));
    }
  }

  // The stop button on a sub order's own screen. The sub order is the work; the
  // run this screen is watching is only its stream. So the sub order is called
  // off first, at the runtime, and the stream is taken down only once that
  // succeeded. A stop that the runtime refused leaves both standing, and the
  // customer sees the refusal instead of a screen that looks finished.
  async function stopDelegatedTaskFromComposer(task: HermesDelegatedTask) {
    const stopped = await closeDelegatedTask(task);
    if (stopped) await stopReply();
  }

  async function loadOlderMobileMessages() {
    const conversationId = activeConversationSessionId;
    if (!conversationId || !messagesNextBefore || chatSessionsBusy || loadingOlderMessages || busy) return;
    setChatSessionsBusy(true);
    setLoadingOlderMessages(true);
    setChatSessionNotice(null);
    try {
      const page = await chatConversationController.loadOlderMessages(
        {
          cursor: messagesNextBefore,
          error: null,
          items: messagesStateRef.current,
          phase: "ready",
        },
        { conversationId, limit: 50 },
      );
      if (page.phase === "error") throw new Error(page.error || "Could not load earlier messages.");
      if (previousConversationSessionIdRef.current !== conversationId) return;
      const olderMessagesWerePrepended = page.items.length > messagesStateRef.current.length;
      preserveMessagesScrollRef.current = olderMessagesWerePrepended;
      setPreserveMessagesScroll(olderMessagesWerePrepended);
      messagesStateRef.current = page.items;
      setMessages(page.items);
      setMessagesNextBefore(page.cursor);
    } catch (err) {
      preserveMessagesScrollRef.current = false;
      setPreserveMessagesScroll(false);
      const message = displayError(err, "Could not load earlier messages.");
      recordDiagnostic("error", "Earlier messages failed", message);
      setChatSessionNotice(userFacingError(message));
    } finally {
      setLoadingOlderMessages(false);
      setChatSessionsBusy(false);
    }
  }

  async function openMobileHomeChat(options: { force?: boolean; preserveDraft?: boolean } = {}) {
    stopReadAloud();
    setMenuOpen(false);
    const homeSession = homeConversationSession(chatSessions);
    if (homeSession) {
      if (activeConversationSessionId === homeSession.id) {
        setTab("chat");
        return true;
      }
      await loadMobileChatSession(homeSession.id, options);
      return activeConversationSessionIdRef.current === homeSession.id;
    }
    setTab("chat");
    try {
      const sessionsPage = await chatConversationController.refreshConversations(createHomechatPagedState<ConversationSession>(), { limit: 12 });
      if (sessionsPage.phase === "error") throw new Error(sessionsPage.error || "Could not open Home chat.");
      const sessions = sessionsPage.items;
      setChatSessions(sessions);
      const nextHomeSession = homeConversationSession(sessions);
      if (nextHomeSession && activeConversationSessionId !== nextHomeSession.id) {
        await loadMobileChatSession(nextHomeSession.id, options);
      }
      return Boolean(nextHomeSession && activeConversationSessionIdRef.current === nextHomeSession.id);
    } catch (err) {
      const message = displayError(err, "Could not open Home chat.");
      recordDiagnostic("error", "Home chat load failed", message);
      setChatSessionNotice(userFacingError(message));
      return false;
    }
  }

  async function startNewMobileChat() {
    if (chatSessionsBusy || loadingOlderMessages || busy) return;
    const selectionVersion = ++conversationSelectionVersionRef.current;
    chatSessionLoadVersionRef.current = selectionVersion;
    stopReadAloud();
    setMenuOpen(false);
    setChatSessionsBusy(true);
    setChatSessionNotice(null);
    try {
      const session = await chatConversationController.create({});
      setChatSessions((current) => [session, ...current.filter((item) => item.id !== session.id)]);
      if (conversationSelectionVersionRef.current !== selectionVersion) return;
      selectActiveConversationSession(session.id, "preserve_version");
      messagesStateRef.current = [];
      setMessages([]);
      setMessagesNextBefore(null);
      preserveMessagesScrollRef.current = false;
      setPreserveMessagesScroll(false);
      setChatEventsByRunId({});
      explainedRunFailuresRef.current.clear();
      setChatRunStatusesById({});
      setInput("");
      setPendingAttachments([]);
      setAttachmentNotice(null);
      mobileScrollIntentRef.current = initialMobileScrollIntent;
      messagesScrollOffsetRef.current = 0;
      setShowScrollDown(false);
      setChatSessionsOpen(false);
      setTab("chat");
      showCopyNotice("New chat started.");
    } catch (err) {
      if (conversationSelectionVersionRef.current !== selectionVersion) return;
      const message = displayError(err, "Could not start a new chat.");
      recordDiagnostic("error", "New chat failed", message);
      setChatSessionNotice(userFacingError(message));
    } finally {
      if (chatSessionLoadVersionRef.current === selectionVersion) {
        chatSessionLoadVersionRef.current = null;
        setChatSessionsBusy(false);
      }
    }
  }

  function removeQueuedFollowUpView(ownershipToken: number) {
    setQueuedFollowUps((items) => items.filter((item) => item.ownershipToken !== ownershipToken));
  }

  function updateQueuedFollowUp(queued: MobileQueuedFollowUpRef, view: Pick<MobileQueuedFollowUpView, "content" | "runId" | "status">) {
    if (!queuedFollowUpOwner.owns(queued.ownershipToken)) return;
    queued.status = view.status;
    const next = { ...view, createdAt: queued.createdAt, ownershipToken: queued.ownershipToken, conversationSessionId: queued.conversationSessionId };
    setQueuedFollowUps((items) => {
      const matches = (item: MobileQueuedFollowUpView) => item.ownershipToken === next.ownershipToken || Boolean(next.runId && item.runId === next.runId);
      const old = items.find(matches);
      if (old?.runId === next.runId && old.status === next.status && old.content === next.content && old.conversationSessionId === next.conversationSessionId) return items;
      return (old ? items.map((item) => matches(item) ? next : item) : [...items, next]).sort((left, right) => {
        if (left.createdAt && right.createdAt) return left.createdAt.localeCompare(right.createdAt) || left.ownershipToken - right.ownershipToken;
        if (left.createdAt) return -1;
        if (right.createdAt) return 1;
        return left.ownershipToken - right.ownershipToken;
      });
    });
  }

  function commitChatRunStatus(runId: string, status: ChatRunStatus) {
    const queued = [...queuedFollowUpRef.current.values()].find((item) => item.runId === runId);
    const terminalStatus = mobileQueuedFollowUpTerminalStatus(queued?.runId, runId, status);
    if (queued && terminalStatus) {
      queued.terminalCleanupPending = true;
      queuedFollowUpRef.current.delete(queued.ownershipToken);
      if (terminalStatus === "completed") {
        removeQueuedFollowUpView(queued.ownershipToken);
      } else if (terminalStatus === "failed") {
        updateQueuedFollowUp(queued, { content: queued.content, runId, status: "failed" });
      } else if (terminalStatus === "cancelled") {
        updateQueuedFollowUp(queued, { content: queued.content, runId, status: "cancelled" });
      }
    }
    setChatRunStatusesById((current) => ({
      ...current,
      [runId]: mobileChatRunStatusAfter(current[runId], status),
    }));
  }

  function clearMobileRunPresentation(presentationToken: number) {
    if (!mobileRunPresentationOwner.owns(presentationToken)) return;
    setChatPendingText(null);
    setChatStreamingText("");
    setActiveChatRunId(null);
    setBusy(false);
    setBusyLabel(null);
  }

  function createMobileHomechatRunSession(input: {
    conversationSessionId: string | null;
    initialMessages: ChatMessage[];
    onRunCreated?: (run: ChatRun) => void;
    onSnapshot?: (run: ChatRun) => void;
    presentationToken?: number;
    reflectLiveProgress?: boolean;
    runId?: string | null;
    startedAt?: number;
    shouldAcceptUpdates?: () => boolean;
  }) {
    let currentRunId = input.runId ?? null;
    let terminalObserved = false;
    const startedAt = input.startedAt ?? Date.now();
    const reflectLiveProgress = input.reflectLiveProgress !== false;
    const terminalUpdateContinuation = createMobileTerminalUpdateContinuation();
    const selectionVersionAtStart = conversationSelectionVersionRef.current;
    const ownsVisibleConversation = () => mobileRunOwnsVisibleConversation({
      conversationSessionId: input.conversationSessionId,
      activeConversationSessionId: activeConversationSessionIdRef.current,
      selectionVersionAtStart,
      currentSelectionVersion: conversationSelectionVersionRef.current,
    });
    const ownsLivePresentation = () => Boolean(
      reflectLiveProgress &&
      ownsVisibleConversation() &&
      input.presentationToken !== undefined &&
      mobileRunPresentationOwner.owns(input.presentationToken),
    );
    const shouldAcceptUpdates = () => input.shouldAcceptUpdates?.() !== false;
    const closeLivePresentation = () => {
      terminalObserved = true;
      if (input.presentationToken !== undefined) clearMobileRunPresentation(input.presentationToken);
    };
    return createHomechatClientController<ChatMessage, ChatRun, CreateChatRunRequest>({
      transport: chatRunTransport,
      initialMessages: input.initialMessages,
      messageFromCompletion: (event, content) => ({
        id: event.messageId || event.id || `${event.runId || currentRunId || "run"}:assistant`,
        runId: event.runId || currentRunId || "run",
        conversationSessionId: input.conversationSessionId,
        role: "assistant",
        content,
        createdAt: event.createdAt || new Date().toISOString(),
      }),
      onRunCreated: (run) => {
        if (!shouldAcceptUpdates()) return;
        currentRunId = run.id;
        const adoptCreatedConversation = input.conversationSessionId === null && ownsLivePresentation();
        input.conversationSessionId = run.conversationSessionId ?? input.conversationSessionId;
        input.onRunCreated?.(run);
        if (adoptCreatedConversation && input.conversationSessionId) {
          selectActiveConversationSession(input.conversationSessionId, "run_created");
        }
        if (ownsLivePresentation() && !terminalObserved) {
          setActiveChatRunId(run.id);
        }
      },
      onState: (state) => {
        if (!shouldAcceptUpdates()) return;
        const runId = currentRunId;
        if (reflectLiveProgress && ownsVisibleConversation()) {
          const merged = reconcileMobileRunBoundMessages({
            conversationSessionId: input.conversationSessionId,
            current: messagesStateRef.current,
            incoming: state.messages,
          });
          messagesStateRef.current = merged;
          setMessages(merged);
        }
        const terminalPhase = state.phase === "completed" || state.phase === "error" || state.phase === "stopped";
        if (terminalPhase) terminalUpdateContinuation.arm(runId);
        if (ownsLivePresentation() && !terminalObserved && !terminalPhase) setChatStreamingText(state.streamingText);
        if (runId && state.phase === "completed") {
          commitChatRunStatus(runId, "completed");
        } else if (runId && state.phase === "error") {
          commitChatRunStatus(runId, "failed");
        } else if (runId && state.phase === "stopped") {
          commitChatRunStatus(runId, "cancelled");
        }
        if (terminalPhase) closeLivePresentation();
        if (ownsLivePresentation() && !terminalObserved) {
          if (state.phase === "streaming") setChatPendingText("Hermes is replying...");
          else if (state.phase === "reconnecting") setChatPendingText("Picking up your reply...");
        }
      },
      onSnapshot: (run) => {
        if (!terminalUpdateContinuation.accept(run.id, shouldAcceptUpdates())) return;
        const expectedRunId = currentRunId;
        currentRunId = run.id;
        input.onSnapshot?.(run);
        commitChatRunStatus(run.id, run.status);
        setChatEventsByRunId((current) => mergeChatRunEvents(current, run.id, run.events));
        if (mobileRunFailureIsExplained(run.events ?? [])) explainedRunFailuresRef.current.add(run.id);
        if (ownsVisibleConversation()) {
          const currentSecureEntry = secureSecretEntryRequestRef.current;
          const secureEntryContext = { conversationSessionId: input.conversationSessionId, runId: expectedRunId };
          const candidate = secureSecretEntryAfterSnapshot(
            currentSecureEntry,
            run,
            secureEntryContext,
          );
          if (!candidate) {
            if (currentSecureEntry) secureSecretEntryResolutionGate.settle(currentSecureEntry);
            presentSecureSecretEntryRequest(null);
          } else {
            if (currentSecureEntry && candidate !== currentSecureEntry) {
              secureSecretEntryResolutionGate.settle(currentSecureEntry);
              presentSecureSecretEntryRequest(null);
            }
            const conversationSessionId = input.conversationSessionId;
            void reconcileSecureSecretEntryRequest(
              candidate,
              candidate === currentSecureEntry,
              () => !terminalObserved &&
                ownsVisibleConversation() &&
                currentRunId === expectedRunId &&
                input.conversationSessionId === conversationSessionId,
            );
          }
        }
        const terminalRun = run.status === "completed" || run.status === "failed" || run.status === "cancelled";
        if (terminalRun) closeLivePresentation();
        if (ownsLivePresentation() && !terminalObserved) {
          const label = chatRunProgressText(run.status, startedAt, appLocale);
          setBusyLabel(label);
          setChatPendingText(label);
        }
      },
      onEvent: (event) => {
        if (!terminalUpdateContinuation.accept(event.runId, shouldAcceptUpdates())) return;
        if (ownsVisibleConversation()) {
          const genericSecureEntry = secureSecretEntryAfterEvent(
            secureSecretEntryRequestRef.current,
            event,
            { conversationSessionId: input.conversationSessionId, runId: currentRunId },
          );
          presentSecureSecretEntryRequest(genericSecureEntry);
          const secureEntry = mobileConnectionSecureEntryAfterEvent(
            secureConnectionEntryRequestRef.current,
            event,
            { conversationSessionId: input.conversationSessionId, runId: currentRunId },
          );
          if (secureEntry !== secureConnectionEntryRequestRef.current) {
            commitSecureConnectionEntryRequest(secureEntry);
          }
        }
        const legacy = chatRunEventFromHermesEvent(event);
        if (!legacy || !mobileRunOwnsEvent(currentRunId, legacy.runId)) return;
        setChatEventsByRunId((current) => mergeChatRunEvents(current, legacy.runId, [legacy]));
        if (legacy.type === "error" && mobileRunFailureIsExplained([legacy])) {
          explainedRunFailuresRef.current.add(legacy.runId);
        }
        const terminalStatus = mobileRunStatusFromTerminalEvent(legacy);
        if (terminalStatus) {
          commitChatRunStatus(legacy.runId, terminalStatus);
          closeLivePresentation();
        } else if (legacy.type === "status") {
          const status = String(legacy.payload.status || "running");
          if (isChatRunStatus(status)) {
            commitChatRunStatus(legacy.runId, status);
          }
        }
      },
    });
  }

  function queuedFollowUpStatusFromRun(status: ChatRunStatus): MobileQueuedFollowUpStatus {
    if (status === "completed") return "queued";
    if (status === "failed") return "failed";
    if (status === "cancelled") return "cancelled";
    return status === "running" || status === "waiting_for_approval" ? "running" : "queued";
  }

  function promoteQueuedFollowUpToTranscript(queued: MobileQueuedFollowUpRef, run: ChatRun) {
    if (!mobileQueuedFollowUpShouldEnterTranscript(run)) return;
    if (queued.conversationSessionId !== activeConversationSessionIdRef.current) return;
    const merged = reconcileMobileRunBoundMessages({
      conversationSessionId: queued.conversationSessionId,
      current: messagesStateRef.current,
      incoming: run.messages,
    });
    messagesStateRef.current = merged;
    setMessages(merged);
  }

  async function finishQueuedFollowUp(queued: MobileQueuedFollowUpRef) {
    try {
      const finalState = await queued.session.waitForBackgroundFollow();
      if (!queuedFollowUpOwner.owns(queued.ownershipToken)) return;
      if (queuedFollowUpRef.current.get(queued.ownershipToken) !== queued && !queued.terminalCleanupPending) return;
      if (queuedFollowUpRef.current.get(queued.ownershipToken) === queued) queuedFollowUpRef.current.delete(queued.ownershipToken);
      queued.terminalCleanupPending = false;
      const outcome = mobileRunAttemptOutcome({
        phase: finalState.phase,
      });
      if (outcome === "completed") {
        if (queued.runId) commitChatRunStatus(queued.runId, "completed");
        setFailedMessage((current) => current?.idempotencyKey === queued.idempotencyKey ? null : current);
        if (appError?.owner === queued.idempotencyKey) setAppError(null);
        removeQueuedFollowUpView(queued.ownershipToken);
        queuedFollowUpOwner.release(queued.ownershipToken);
        await refresh();
        return;
      }
      if (outcome === "cancelled") {
        updateQueuedFollowUp(queued, { content: queued.content, runId: queued.runId, status: "cancelled" });
        return;
      }
      if (outcome === "failed") {
        // The card is for a reply we cannot account for. HPD-533: when the plane
        // said why, the reason is already in the transcript and a retry cannot
        // change it, so the card stays away.
        if (!(queued.runId && explainedRunFailuresRef.current.has(queued.runId))) {
          setFailedMessage({
            content: queued.content,
            idempotencyKey: queued.idempotencyKey,
            source: queued.source,
            attachments: queued.attachments,
            conversationSessionId: queued.conversationSessionId,
            runId: queued.runId,
          });
        }
        updateQueuedFollowUp(queued, { content: queued.content, runId: queued.runId, status: "failed" });
      }
    } finally {
      if (queuedFollowUpOwner.owns(queued.ownershipToken)) {
        if (queuedFollowUpRef.current.get(queued.ownershipToken) === queued) queuedFollowUpRef.current.delete(queued.ownershipToken);
        queued.terminalCleanupPending = false;
      }
    }
  }

  function recoverQueuedFollowUp(run: ChatRun) {
    if ([...queuedFollowUpRef.current.values()].some((item) => item.runId === run.id) || run.status !== "queued" || run.startedAt !== null) return;
    const content = run.messages.find((message) => message.role === "user")?.content.trim();
    if (!content || !run.conversationSessionId) return;
    const ownershipToken = queuedFollowUpOwner.admit();
    const abortController = new AbortController();
    const queuedSession = createMobileHomechatRunSession({
      conversationSessionId: run.conversationSessionId,
      initialMessages: messagesStateRef.current,
      onSnapshot: (snapshotRun) => {
        const current = queuedFollowUpRef.current.get(ownershipToken);
        if (!current || current.ownershipToken !== ownershipToken || current.runId !== snapshotRun.id) return;
        if (
          snapshotRun.status === "completed" ||
          snapshotRun.status === "failed" ||
          snapshotRun.status === "cancelled"
        ) return;
        current.status = queuedFollowUpStatusFromRun(snapshotRun.status);
        updateQueuedFollowUp(current, { content: current.content, runId: snapshotRun.id, status: current.status });
        promoteQueuedFollowUpToTranscript(current, snapshotRun);
      },
      reflectLiveProgress: false,
      runId: run.id,
      shouldAcceptUpdates: () => queuedFollowUpRef.current.has(ownershipToken),
    });
    const queued: MobileQueuedFollowUpRef = {
      createdAt: run.createdAt,
      abortController,
      content,
      conversationSessionId: run.conversationSessionId,
      idempotencyKey: createMobileMessageIdempotencyKey(Crypto.randomUUID),
      ownershipToken,
      runId: run.id,
      session: queuedSession,
      source: "text",
      status: "queued",
      terminalCleanupPending: false,
    };
    queuedFollowUpRef.current.set(ownershipToken, queued);
    updateQueuedFollowUp(queued, { content, runId: run.id, status: "queued" });
    commitChatRunStatus(run.id, "queued");
    void queuedSession.reconnect(run.id, { signal: abortController.signal })
      .then(async () => finishQueuedFollowUp(queued))
      .catch((error) => {
        if (
          !queuedFollowUpOwner.owns(queued.ownershipToken) ||
          abortController.signal.aborted ||
          isChatRunCancelledError(error) ||
          isSharedHomechatRunControllerError(error, "aborted")
        ) return;
        if (queuedFollowUpRef.current.get(queued.ownershipToken) === queued) queuedFollowUpRef.current.delete(queued.ownershipToken);
        setFailedMessage({
          content: queued.content,
          conversationSessionId: queued.conversationSessionId,
          idempotencyKey: queued.idempotencyKey,
          runId: queued.runId,
          source: queued.source,
        });
        updateQueuedFollowUp(queued, { content: queued.content, runId: queued.runId, status: "failed" });
        recordDiagnostic("error", "Follow-up recovery failed", displayError(error, "Could not recover the queued follow-up."));
      });
  }

  async function queueFollowUp(failedAttempt: MobileFailedMessage): Promise<MobileSendResult> {
    // Only acceptance is serialized. Already saved follow-ups never occupy this
    // gate, and a cold start only reconnects their canonical runs.
    if ([...queuedFollowUpRef.current.values()].some((item) => item.status === "queueing")) return "ignored";
    const ownershipToken = queuedFollowUpOwner.admit();
    stopReadAloud();
    setFailedMessage(null);
    const abortController = new AbortController();
    const queuedSession = createMobileHomechatRunSession({
      conversationSessionId: failedAttempt.conversationSessionId ?? activeConversationSessionId,
      initialMessages: messagesStateRef.current,
      onRunCreated: (run) => {
        const queued = queuedFollowUpRef.current.get(ownershipToken);
        if (!queued || queued.ownershipToken !== ownershipToken) return;
        queued.runId = run.id;
        queued.createdAt = run.createdAt;
        queued.conversationSessionId = run.conversationSessionId ?? queued.conversationSessionId;
        if (run.status === "completed" || run.status === "failed" || run.status === "cancelled") return;
        queued.status = queuedFollowUpStatusFromRun(run.status);
        updateQueuedFollowUp(queued, {
          content: failedAttempt.content,
          runId: run.id,
          status: queued.status,
        });
        promoteQueuedFollowUpToTranscript(queued, run);
      },
      onSnapshot: (run) => {
        const queued = queuedFollowUpRef.current.get(ownershipToken);
        if (!queued || queued.ownershipToken !== ownershipToken || queued.runId !== run.id) return;
        if (run.status === "completed" || run.status === "failed" || run.status === "cancelled") return;
        queued.status = queuedFollowUpStatusFromRun(run.status);
        updateQueuedFollowUp(queued, {
          content: queued.content,
          runId: run.id,
          status: queued.status,
        });
        promoteQueuedFollowUpToTranscript(queued, run);
      },
      reflectLiveProgress: false,
      shouldAcceptUpdates: () => queuedFollowUpRef.current.has(ownershipToken),
    });
    const queued: MobileQueuedFollowUpRef = {
      createdAt: null,
      abortController,
      attachments: failedAttempt.attachments,
      connectionSetupIntent: failedAttempt.connectionSetupIntent,
      content: failedAttempt.content,
      conversationSessionId: failedAttempt.conversationSessionId ?? activeConversationSessionId,
      idempotencyKey: failedAttempt.idempotencyKey,
      ownershipToken,
      runId: null,
      session: queuedSession,
      source: failedAttempt.source,
      status: "queueing",
      terminalCleanupPending: false,
    };
    queuedFollowUpRef.current.set(ownershipToken, queued);
    updateQueuedFollowUp(queued, { content: failedAttempt.content, runId: null, status: "queueing" });
    try {
      await queuedSession.send(
        queued.conversationSessionId
          ? {
              message: failedAttempt.content,
              conversationSessionId: queued.conversationSessionId,
              idempotencyKey: failedAttempt.idempotencyKey,
              attachments: failedAttempt.attachments,
              connectionSetupIntent: failedAttempt.connectionSetupIntent,
            }
          : {
              message: failedAttempt.content,
              idempotencyKey: failedAttempt.idempotencyKey,
              attachments: failedAttempt.attachments,
              connectionSetupIntent: failedAttempt.connectionSetupIntent,
            },
        { follow: false, signal: abortController.signal },
      );
      void finishQueuedFollowUp(queued);
      return "queued";
    } catch (err) {
      if (!queuedFollowUpOwner.owns(queued.ownershipToken)) return "ignored";
      const stillCurrent = queuedFollowUpRef.current.get(queued.ownershipToken) === queued;
      if (stillCurrent) queuedFollowUpRef.current.delete(queued.ownershipToken);
      if (isChatRunCancelledError(err) || isSharedHomechatRunControllerError(err, "aborted") || abortController.signal.aborted) {
        if (stillCurrent) {
          if (queued.runId) {
            updateQueuedFollowUp(queued, { content: failedAttempt.content, runId: queued.runId, status: "cancelled" });
          } else {
            const remainingMessages = mobileMessagesWithoutRun(messagesStateRef.current, queued.runId);
            messagesStateRef.current = remainingMessages;
            setMessages(remainingMessages);
            removeQueuedFollowUpView(queued.ownershipToken);
          }
        }
        return "ignored";
      }
      setFailedMessage(failedAttempt);
      updateQueuedFollowUp(queued, { content: failedAttempt.content, runId: queued.runId, status: "failed" });
      recordDiagnostic("error", "Follow-up queue failed", displayError(err, "Could not queue the follow-up."));
      setAppError(
        userFacingError(displayError(err, "Could not queue the follow-up.")),
        failedAttempt.idempotencyKey,
        selectedChatRoutePreference,
      );
      return "failed";
    }
  }

  async function runSend(
    message: string,
    source: MobileMessageSource = "text",
    idempotencyKey?: string,
    attachments?: CreateChatRunRequest["attachments"],
    conversationSessionIdOverride?: string | null,
    connectionSetupIntent?: ConnectionSetupIntent,
  ): Promise<MobileSendResult> {
    if (!message && !attachments?.length) return "ignored";
    const targetConversationSessionId = conversationSessionIdOverride === undefined
      ? activeConversationSessionId
      : conversationSessionIdOverride;
    const failedAttempt: MobileFailedMessage = {
      content: message,
      idempotencyKey: idempotencyKey ?? createMobileMessageIdempotencyKey(Crypto.randomUUID),
      source,
      attachments,
      connectionSetupIntent,
      conversationSessionId: targetConversationSessionId,
    };
    if (!snapshot) {
      setFailedMessage(failedAttempt);
      return "failed";
    }
    const requestRoutePreference = mobileSelectedChatRoutePreference(
      snapshot.chatRoutePreference,
      modelOptions?.chatRoutePreference,
    );
    const access = mobileChatAccessView(snapshot, requestRoutePreference, workspaceStatusTruthRef.current);
    if (!access.ready) {
      setFailedMessage(failedAttempt);
      return "failed";
    }
    const busyIntent = mobileBusySendIntent({
      activeRunId: activeChatRunId ?? [...queuedFollowUpRef.current.values()].find((item) => item.conversationSessionId === targetConversationSessionId && item.runId)?.runId ?? null,
      busy: busy || [...queuedFollowUpRef.current.values()].some((item) => item.conversationSessionId === targetConversationSessionId),
      gateActive: messageSendGate.isActive(),
      hasQueuedFollowUp: [...queuedFollowUpRef.current.values()].some((item) => item.conversationSessionId === targetConversationSessionId),
      allowMultipleFollowUps: ![...queuedFollowUpRef.current.values()].some((item) => item.status === "queueing"),
    });
    if (busyIntent === "queue_follow_up") return queueFollowUp(failedAttempt);
    if (busyIntent !== "send_now") {
      showCopyNotice(
        busyIntent === "ignore_duplicate" ? "Your message is being saved. Try again in a moment." : "Hermes is busy. Try again in a moment.",
      );
      return "ignored";
    }
    if (!messageSendGate.acquire()) {
      showCopyNotice("Hermes is busy. Try again in a moment.");
      return "ignored";
    }
    let messageSendGateHeld = true;
    const releaseMessageSendGate = () => {
      if (!messageSendGateHeld) return;
      messageSendGateHeld = false;
      messageSendGate.release();
    };
    const latencyState = beginMobileChatLatency(requestRoutePreference);
    const presentationToken = mobileRunPresentationOwner.begin();
    let attemptFailed = false;
    stopReadAloud();
    setFailedMessage(null);
    setChatPendingText("Sending to Hermes...");
    try {
      const sent = await runAction("Sending to Hermes...", "Could not send the message.", async () => {
        const optimisticUserId = `m_${Date.now()}`;
        const optimisticMessage: ChatMessage = {
          id: optimisticUserId,
          runId: optimisticUserId,
          role: "user",
          content: message,
          createdAt: new Date().toISOString(),
          conversationSessionId: targetConversationSessionId,
          optimistic: true,
        };
        const abortController = new AbortController();
        let currentRunId: string | null = null;
        const session = createMobileHomechatRunSession({
          conversationSessionId: targetConversationSessionId,
          initialMessages: messagesStateRef.current,
          onRunCreated: (run) => {
            currentRunId = run.id;
            failedAttempt.runId = run.id;
            failedAttempt.conversationSessionId = run.conversationSessionId ?? failedAttempt.conversationSessionId;
            releaseMessageSendGate();
          },
          presentationToken,
          shouldAcceptUpdates: () => activeHomechatRunSessionRef.current === session,
        });
        activeChatAbortRef.current?.abort();
        activeChatAbortRef.current = abortController;
        activeHomechatRunSessionRef.current = session;
        try {
          const finalState = await session.send(
            targetConversationSessionId
              ? {
                  message,
                  conversationSessionId: targetConversationSessionId,
                  idempotencyKey: failedAttempt.idempotencyKey,
                  attachments,
                  connectionSetupIntent,
                }
              : { message, idempotencyKey: failedAttempt.idempotencyKey, attachments, connectionSetupIntent },
            { optimisticMessage, signal: abortController.signal },
          );
          const outcome = mobileRunAttemptOutcome({
            phase: finalState.phase,
          });
          if (outcome === "completed") {
            if (currentRunId) commitChatRunStatus(currentRunId, "completed");
            if (!latencyState.terminalObserved) {
              recordMobileChatLatency({ completionMs: latencyNow() - latencyState.startedAt, outcome: "success" }, latencyState);
            }
            setFailedMessage((current) => current?.idempotencyKey === failedAttempt.idempotencyKey ? null : current);
            if (mobileRunPresentationOwner.owns(presentationToken)) setAppError(null);
            releaseMessageSendGate();
            void refresh();
            return;
          }
          if (outcome === "cancelled") {
            const durationMs = Math.max(0, latencyNow() - latencyState.startedAt);
            recordMobileChatLatency({ completionMs: durationMs, outcome: "cancelled" }, latencyState);
            return;
          }
          if (outcome === "failed") throw new Error(finalState.error || "Hermes could not finish that reply.");
        } catch (err) {
          const currentState = session.getState();
          // A replacement observer aborts this transport, not Hermes' work.
          if (isSharedHomechatRunControllerError(err, "aborted") ||
            (abortController.signal.aborted && activeHomechatRunSessionRef.current !== session)) return;
          const outcome = mobileRunAttemptOutcome({
            phase: currentState.phase,
          });
          if (outcome === "completed") {
            if (currentRunId) commitChatRunStatus(currentRunId, "completed");
            if (!latencyState.terminalObserved) {
              recordMobileChatLatency({ completionMs: latencyNow() - latencyState.startedAt, outcome: "success" }, latencyState);
            }
            setFailedMessage((current) => current?.idempotencyKey === failedAttempt.idempotencyKey ? null : current);
            if (mobileRunPresentationOwner.owns(presentationToken)) setAppError(null);
            releaseMessageSendGate();
            void refresh();
            return;
          }
          if (
            outcome === "cancelled" ||
            isChatRunCancelledError(err) ||
            (abortController.signal.aborted && currentState.phase === "stopped")
          ) {
            const durationMs = Math.max(0, latencyNow() - latencyState.startedAt);
            recordMobileChatLatency({ completionMs: durationMs, outcome: "cancelled" }, latencyState);
            return;
          }
          // Same rule as the queued follow-up above. HPD-533.
          if (!(currentRunId && explainedRunFailuresRef.current.has(currentRunId))) {
            setFailedMessage(failedAttempt);
          }
          const failureMessage = displayError(err, "Could not send the message.");
          recordDiagnostic("error", "Message send failed", failureMessage);
          const durationMs = Math.max(0, latencyNow() - latencyState.startedAt);
          recordMobileChatLatency({ completionMs: durationMs, outcome: "error" }, latencyState);
          if (isProductSessionAuthError(failureMessage)) throw err;
          attemptFailed = true;
        } finally {
          if (activeChatAbortRef.current === abortController) activeChatAbortRef.current = null;
          if (activeHomechatRunSessionRef.current === session) activeHomechatRunSessionRef.current = null;
        }
      }, failedAttempt.idempotencyKey, requestRoutePreference, false, () => mobileRunPresentationOwner.owns(presentationToken));
      return sent && !attemptFailed ? "sent" : "failed";
    } finally {
      releaseMessageSendGate();
      clearMobileRunPresentation(presentationToken);
      mobileRunPresentationOwner.finish(presentationToken);
    }
  }

  async function send() {
    if (!snapshot) return;
    const access = mobileChatAccessView(snapshot, selectedChatRoutePreference ?? snapshot.chatRoutePreference, workspaceStatusTruthRef.current);
    if (!access.ready) return;
    if (busy && !activeChatRunId) return;
    const message = input.trim();
    const attachments = mobileAttachmentPayload(pendingAttachments);
    if (!message && !attachments.length) return;
    const outboundMessage = pageStarterPayload(pageStarterRef.current,
      { workspaceId: snapshot.workspace.id, conversationId: activeConversationSessionId ?? "" },
      pageStarterCopy(appLocale).context, message || "Please review the attached files.");
    const consumedPageStarter = pageStarterRef.current;
    consumePageEntry();
    Keyboard.dismiss();
    setInput("");
    setPendingAttachments([]);
    const result = await runSend(outboundMessage, "text", undefined, attachments);
    if (result === "ignored") {
      if (pageWorkspaceRef.current === snapshot.workspace.id && pageEntryTokenRef.current === token && pageTabRef.current === "chat" && activeConversationSessionIdRef.current === activeConversationSessionId) {
        pageStarterRef.current = consumedPageStarter;
        setPageStarter(consumedPageStarter);
      }
      if (message) setInput((current) => current.trim() ? current : message);
      setPendingAttachments((current) => current.length ? current : pendingAttachments);
    }
  }

  async function mobileAttachmentFromAsset(input: {
    uri: string;
    name: string | null | undefined;
    mimeType: string | null | undefined;
    kind: "image" | "file";
    base64?: string | null;
  }): Promise<MobileAttachment> {
    const encoded = input.base64 || await FileSystem.readAsStringAsync(input.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const { dataBase64, size } = mobileAttachmentBytes(encoded);
    return {
      id: Crypto.randomUUID(),
      name: input.name || (input.kind === "image" ? "photo.jpg" : "attachment"),
      mimeType: input.mimeType || (input.kind === "image" ? "image/jpeg" : "application/octet-stream"),
      size,
      kind: input.kind,
      dataBase64,
    };
  }

  function appendMobileAttachments(incoming: MobileAttachment[]) {
    const result = validateMobileAttachmentSelection(pendingAttachments, incoming, appLocale);
    setPendingAttachments(result.accepted);
    setAttachmentNotice(result.error);
  }

  async function chooseMobilePhotos() {
    setAttachmentBusy(true);
    setAttachmentNotice(null);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsMultipleSelection: true,
        base64: true,
        mediaTypes: ["images"],
        preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
        quality: 1,
        selectionLimit: 5,
      });
      if (result.canceled) return;
      appendMobileAttachments(await Promise.all(result.assets.map((asset) => mobileAttachmentFromAsset({
        uri: asset.uri,
        name: asset.fileName,
        mimeType: asset.mimeType,
        kind: "image",
        base64: asset.base64,
      }))));
    } catch (err) {
      setAttachmentNotice(userFacingError(displayError(err, "Could not attach the selected photos.")));
    } finally {
      setAttachmentBusy(false);
    }
  }

  async function takeMobilePhoto() {
    setAttachmentBusy(true);
    setAttachmentNotice(null);
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        setAttachmentNotice("Camera access is needed to take a photo.");
        return;
      }
      const result = await ImagePicker.launchCameraAsync({ base64: true, mediaTypes: ["images"], quality: 1 });
      if (result.canceled) return;
      const asset = result.assets[0];
      if (!asset) return;
      appendMobileAttachments([await mobileAttachmentFromAsset({
        uri: asset.uri,
        name: asset.fileName,
        mimeType: asset.mimeType,
        kind: "image",
        base64: asset.base64,
      })]);
    } catch (err) {
      setAttachmentNotice(userFacingError(displayError(err, "Could not take a photo.")));
    } finally {
      setAttachmentBusy(false);
    }
  }

  async function chooseMobileFiles() {
    setAttachmentBusy(true);
    setAttachmentNotice(null);
    try {
      const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true, multiple: true });
      if (result.canceled) return;
      appendMobileAttachments(await Promise.all(result.assets.map((asset) => mobileAttachmentFromAsset({
        uri: asset.uri,
        name: asset.name,
        mimeType: asset.mimeType,
        kind: asset.mimeType?.startsWith("image/") ? "image" : "file",
      }))));
    } catch (err) {
      setAttachmentNotice(userFacingError(displayError(err, "Could not attach the selected files.")));
    } finally {
      setAttachmentBusy(false);
    }
  }

  function openMobileAttachmentMenu() {
    Alert.alert(staticUiMessage(appLocale, "Add attachment"), undefined, [
      { text: staticUiMessage(appLocale, "Photos"), onPress: () => void chooseMobilePhotos() },
      { text: staticUiMessage(appLocale, "Camera"), onPress: () => void takeMobilePhoto() },
      { text: staticUiMessage(appLocale, "Files"), onPress: () => void chooseMobileFiles() },
      { text: staticUiMessage(appLocale, "Cancel"), style: "cancel" },
    ]);
  }

  async function submitMobileConfirmation(
    runId: string,
    conversationSessionId: string | null,
    action: MobileConfirmationAction,
  ) {
    if (chatRunStatusesById[runId] !== "waiting_for_approval") return;
    if (!confirmationDecisionGate.claim(runId)) return;
    setConfirmationDecisionRuns((current) => ({ ...current, [runId]: true }));
    const result = await runSend(action, "text", undefined, undefined, conversationSessionId);
    if (result === "failed" || result === "ignored") {
      confirmationDecisionGate.release(runId);
      setConfirmationDecisionRuns((current) => {
        const next = { ...current };
        delete next[runId];
        return next;
      });
    }
  }

  function commitMessagesScrollIntent(event: NativeScrollEvent) {
    messagesScrollOffsetRef.current = event.contentOffset.y;
    const distanceFromBottom = Math.max(
      0,
      event.contentSize.height - event.contentOffset.y - event.layoutMeasurement.height,
    );
    const next = mobileScrollIntentAfterScroll(mobileScrollIntentRef.current, distanceFromBottom);
    mobileScrollIntentRef.current = next;
    setShowScrollDown(next.showScrollDown);
  }

  function jumpToLatestMobileMessage() {
    mobileScrollIntentRef.current = mobileScrollIntentAfterJump();
    setShowScrollDown(false);
    messagesScrollRef.current?.scrollToEnd({ animated: true });
  }

  async function handlePluginCatalogAskHermes(
    prefilledMessage: string,
    item?: PluginCatalogItem,
    origin: ConnectionSetupOrigin = "connection_detail",
  ): Promise<boolean> {
    if (item) {
      if (namedConnectionSetupBusyRef.current) return false;
      namedConnectionSetupBusyRef.current = true;
      try {
        const homeConversationOpened = await openMobileHomeChat();
        const conversationSessionId = activeConversationSessionIdRef.current;
        if (!homeConversationOpened || !conversationSessionId) {
          setChatSessionNotice(`${item.name} setup could not open Home Chat. Please try again.`);
          return false;
        }
        const request = connectionSetupRunRequest({
          catalogItemId: item.id,
          conversationSessionId,
          metadata: item.connectionSetup,
          message: prefilledMessage,
          name: item.name,
          origin,
        });
        if (!request) {
          setChatSessionNotice(`${item.name} setup is not supported for this workspace right now.`);
          return false;
        }
        const sendResult = await runSend(
          request.message,
          "text",
          undefined,
          undefined,
          conversationSessionId,
          request.connectionSetupIntent,
        );
        if (sendResult === "failed" || sendResult === "ignored") {
          setChatSessionNotice(`${item.name} setup could not start. Please try again.`);
          return false;
        }
        return true;
      } finally {
        namedConnectionSetupBusyRef.current = false;
      }
    }
    const homeConversationOpened = await openMobileHomeChat();
    if (!homeConversationOpened) return false;
    setInput(prefilledMessage);
    return true;
  }

  async function handlePluginCatalogAction(item: PluginCatalogItem, action: PluginCatalogAction) {
    if (pluginCatalogBusyActionKey) return;
    if (action.requiresConfirmation) {
      const confirmed = await new Promise<boolean>((resolve) => {
        Alert.alert(
          systemPageCopy.plugins.confirmTitle,
          systemPageCopy.plugins.confirmBody,
          [
            { text: systemPageCopy.plugins.cancel, style: "cancel", onPress: () => resolve(false) },
            { text: systemPageCopy.plugins.confirm, onPress: () => resolve(true) },
          ],
          { cancelable: true, onDismiss: () => resolve(false) },
        );
      });
      if (!confirmed) return;
    }
    const actionKey = `${item.id}:${action.operationId}`;
    setPluginCatalogBusyActionKey(actionKey);
    setPluginCatalogError(null);
    setPluginCatalogNotice(null);
    try {
      const result = await api.runPluginCatalogOperation(item.id, action.operationId);
      if (result.workspaceId !== snapshot?.workspace.id || result.itemId !== item.id || result.operationId !== action.operationId) {
        throw new Error("The plugin operation response was not bound to this workspace action.");
      }
      if (result.effect === "refresh_catalog") {
        await loadPluginCatalog();
        setPluginCatalogNotice(systemPageCopy.plugins.operationComplete);
        return;
      }
      if (result.effect === "open_gmail_setup") {
        const status = await runMobileGmailOAuth({
          api,
          expectedRedirectUri: host.identity.gmailRedirectUri,
          createPkce: async () => {
            const codeVerifier = `${Crypto.randomUUID().replace(/-/g, "")}${Crypto.randomUUID().replace(/-/g, "")}`;
            const digest = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, codeVerifier, {
              encoding: Crypto.CryptoEncoding.BASE64,
            });
            return {
              codeVerifier,
              codeChallenge: digest.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, ""),
            };
          },
          openAuthSession: (authorizationUrl, redirectUri) => WebBrowser.openAuthSessionAsync(authorizationUrl, redirectUri),
        });
        if (status.state !== "connected") throw new Error(status.detail || "Gmail needs attention before it can be used.");
        await loadPluginCatalog();
        selectMobileScreen("account", "connections", "gmail");
        setPluginCatalogNotice(result.message);
        return;
      }
      if (result.effect === "open_existing_connection") {
        selectMobileScreen("account", "connections", result.itemId);
        setIntegrationNotice(systemPageCopy.plugins.operationComplete);
        return;
      }
      if (result.effect === "open_source_review") {
        if (!result.sourceUrl) throw new Error("The fixed source review link is unavailable.");
        await Linking.openURL(result.sourceUrl);
        await loadPluginCatalog();
        setPluginCatalogNotice(systemPageCopy.plugins.operationComplete);
        return;
      }
      if (result.effect === "open_runtime_management") {
        const route = await api.hermesDashboardRoute();
        if (!route.available || !route.href) throw new Error("Private runtime management is not reachable for this workspace.");
        await Linking.openURL(route.href);
        setPluginCatalogNotice(systemPageCopy.plugins.operationComplete);
        return;
      }
      if (result.effect === "create_setup_request") {
        await api.createConnectionSetupRequest({
          provider: "webhook",
          workflow: "Prepare a bounded webhook connection for this workspace with an explicit purpose, scopes, callback, test plan, and disconnect plan.",
          proposedPermissions: [],
          userBenefit: "Connect one declared service callback without exposing a secret in chat.",
          source: "connections_ui",
        });
        await loadPluginCatalog();
        setPluginCatalogNotice(systemPageCopy.plugins.webhookRequested);
        return;
      }
      if (result.effect === "start_guided_chat") {
        if (!item.connectionSetup || result.provider !== item.connectionSetup.providerId || !result.prefilledMessage?.trim()) {
          throw new Error("The guided connection request is unavailable.");
        }
        if (!await handlePluginCatalogAskHermes(result.prefilledMessage, item, "connections_row")) {
          throw new Error("The guided connection request could not be sent.");
        }
        setPluginCatalogNotice(result.message);
        return;
      }
      if (result.effect === "send_chat_setup_request") {
        if (result.provider !== "slack" && result.provider !== "stripe") {
          throw new Error("The chat setup provider is not supported.");
        }
        if (!pluginChatFallbackRef.current) {
          pluginChatFallbackRef.current = createPluginChatFallbackController({
            randomUUID: Crypto.randomUUID,
            send: async ({ message, idempotencyKey }) => {
              const conversationSessionId = activeConversationSessionIdRef.current;
              const run = await hermesApi.createRun(
                conversationSessionId
                  ? { message, idempotencyKey, conversationSessionId }
                  : { message, idempotencyKey },
              );
              return { runId: run.id };
            },
          });
        }
        await pluginChatFallbackRef.current.send(result.provider as PluginChatFallbackProvider);
        selectMobileScreen("chat");
        await refresh();
      }
    } catch (caught) {
      const message = displayError(caught, "The plugin action could not be completed.");
      recordDiagnostic("error", "Plugin action failed", message);
      setPluginCatalogError(gmailOAuthDiagnostic(caught)?.userMessage ?? systemPageCopy.plugins.actionError);
    } finally {
      setPluginCatalogBusyActionKey((current) => current === actionKey ? null : current);
    }
  }

  async function startChatSuggestion(suggestion: ChatSuggestion) {
    if (!snapshot) return;
    const access = mobileChatAccessView(snapshot, selectedChatRoutePreference ?? snapshot.chatRoutePreference, workspaceStatusTruthRef.current);
    if (busy || !access.ready) return;
    setChatSuggestions((current) =>
      current.map((item) => (item.id === suggestion.id ? { ...item, usedAt: item.usedAt || new Date().toISOString() } : item)),
    );
    setInput("");
    try {
      const used = await api.useChatSuggestion(suggestion.id, {
        pillInstanceId: suggestion.pillInstanceId ?? null,
        conversationSessionId: activeConversationSessionId ?? undefined,
      });
      setChatSuggestions((current) => current.map((item) => (item.id === used.id ? used : item)));
    } catch {
      // The prepared prompt still works even if the convenience used-state call fails.
    }
    await runSend(suggestion.prompt);
  }

  function rememberHeySuggestion(suggestion: HeySuggestionView) {
    setHeySuggestions((current) => current.map((item) => item.id === suggestion.id ? suggestion : item));
    setHeySuggestionNudge((current) => current?.id === suggestion.id ? suggestion : current);
  }

  function currentHeySuggestionScope() {
    if (!snapshot) throw new Error("The signed-in Hey workspace is not loaded.");
    return { productId: "hey", accountId: snapshot.me.id, workspaceId: snapshot.workspace.id } as const;
  }

  async function openHeySuggestion(suggestion: HeySuggestionView) {
    setHeySuggestionBusyId(suggestion.id);
    setHeySuggestionNotice(null);
    try {
      const action = heySuggestionAction(suggestion, currentHeySuggestionScope());
      const response = await api.transitionSuggestion(action.suggestionId, "started");
      rememberHeySuggestion(response.suggestion);
      setHeySuggestionNudge((current) => current?.id === suggestion.id ? null : current);
      if (action.kind === "editable_draft") {
        setInput(action.draft);
        selectMobileScreen("chat");
        setHeySuggestionNotice("Draft added to Chat. Edit it before sending.");
        return;
      }
      const destination = action.destination;
      if (destination.surface === "connections") {
        selectMobileScreen("connections_customer");
      } else if (destination.surface === "ai_access") {
        selectMobileScreen("ai_access");
      } else if (destination.capabilityId === "pages_apps") {
        selectMobileScreen("bookmarks");
      } else if (destination.capabilityId === "tasks") {
        selectMobileScreen("tasks");
      } else {
        selectMobileScreen("capabilities");
      }
    } catch (err) {
      setHeySuggestionNotice(userFacingError(displayError(err, "Suggestion could not be opened.")));
    } finally {
      setHeySuggestionBusyId(null);
    }
  }

  async function changeHeySuggestionPromotion(suggestion: HeySuggestionView, type: "dismissed" | "restored") {
    setHeySuggestionBusyId(suggestion.id);
    setHeySuggestionNotice(null);
    try {
      const action = heySuggestionAction(suggestion, currentHeySuggestionScope());
      const response = await api.transitionSuggestion(action.suggestionId, type);
      rememberHeySuggestion(response.suggestion);
      if (type === "dismissed") {
        setHeySuggestionNudge((current) => current?.id === suggestion.id ? null : current);
      }
    } catch (err) {
      setHeySuggestionNotice(userFacingError(displayError(err, "Suggestion could not be updated.")));
    } finally {
      setHeySuggestionBusyId(null);
    }
  }

  async function retryFailedSend() {
    if (!failedMessage || (busy && !activeChatRunId)) return;
    const retry = failedMessage;
    await runSend(
      retry.content,
      retry.source,
      mobileFailedMessageRetryKey(retry, () => createMobileMessageIdempotencyKey(Crypto.randomUUID)),
      retry.attachments,
      retry.conversationSessionId,
      retry.connectionSetupIntent,
    );
  }

  async function dismissFailedSend() {
    const dismissed = failedMessage;
    const ownsCurrentError = Boolean(dismissed && appError?.owner === dismissed.idempotencyKey);
    setFailedMessage(null);
    if (ownsCurrentError) setAppError(null);
  }

  async function cancelQueuedFollowUp(ownershipToken: number) {
    const queued = queuedFollowUpRef.current.get(ownershipToken);
    if (!queued) {
      removeQueuedFollowUpView(ownershipToken);
      return;
    }
    if (queued.status === "queueing") return;
    if (!mobileQueuedFollowUpHasStarted(queued.status)) {
      queuedFollowUpRef.current.delete(ownershipToken);
      queued.abortController.abort();
      const remainingMessages = mobileMessagesWithoutRun(messagesStateRef.current, queued.runId);
      messagesStateRef.current = remainingMessages;
      setMessages(remainingMessages);
      removeQueuedFollowUpView(ownershipToken);
      if (queued.runId) {
        try {
          await queued.session.stop(queued.runId);
          commitChatRunStatus(queued.runId, "cancelled");
        } catch (err) {
          if (!isChatRunCancelledError(err) && !isSharedHomechatRunControllerError(err, "aborted")) {
            updateQueuedFollowUp(queued, { content: queued.content, runId: queued.runId, status: "failed" });
            recordDiagnostic("error", "Queued follow-up cancel failed", displayError(err, "Could not cancel the queued follow-up."));
            void refresh(true);
          }
        }
      }
      return;
    }
    updateQueuedFollowUp(queued, { content: queued.content, runId: queued.runId, status: "cancelling" });
    try {
      await queued.session.stop(queued.runId as string);
      queued.abortController.abort();
      commitChatRunStatus(queued.runId as string, "cancelled");
      updateQueuedFollowUp(queued, { content: queued.content, runId: queued.runId, status: "cancelled" });
    } catch (err) {
      const message = displayError(err, "Could not cancel the queued follow-up.");
      recordDiagnostic("error", "Queued follow-up cancel failed", message);
      updateQueuedFollowUp(queued, { content: queued.content, runId: queued.runId, status: "failed" });
      setAppError(message);
      void refresh(true);
    } finally {
      if (queuedFollowUpRef.current.get(ownershipToken) === queued) queuedFollowUpRef.current.delete(ownershipToken);
    }
  }

  function dismissQueuedFollowUp(ownershipToken: number) {
    if (queuedFollowUpRef.current.has(ownershipToken)) return;
    removeQueuedFollowUpView(ownershipToken);
    queuedFollowUpOwner.release(ownershipToken);
  }

  async function stopReply() {
    if (!activeChatRunId) {
      const queued = [...queuedFollowUpRef.current.values()].find((item) => item.conversationSessionId === activeConversationSessionId && mobileQueuedFollowUpHasStarted(item.status));
      if (queued) await cancelQueuedFollowUp(queued.ownershipToken);
      return;
    }
    setChatPendingText("Stopping the reply...");
    setBusyLabel("Stopping the reply...");
    try {
      const session = activeHomechatRunSessionRef.current ?? createMobileHomechatRunSession({
        conversationSessionId: activeConversationSessionId,
        initialMessages: messagesStateRef.current,
        runId: activeChatRunId,
      });
      await session.stop(activeChatRunId);
      commitChatRunStatus(activeChatRunId, "cancelled");
      activeChatAbortRef.current?.abort();
    } catch (err) {
      setAppError(displayError(err, "Could not stop that reply."));
    }
  }

  async function resumeChatRun(
    runId: string,
    conversationSessionId = activeConversationSessionId,
    initialMessages = messagesStateRef.current,
  ) {
    if (activeConversationSessionIdRef.current !== conversationSessionId || resumingChatRunRef.current === runId) return;
    const presentationToken = mobileRunPresentationOwner.begin();
    resumingChatRunRef.current = runId;
    setActiveChatRunId(runId);
    setBusy(true);
    setBusyLabel("Picking up your reply...");
    setChatPendingText("Picking up your reply...");
    const abortController = new AbortController();
    const session = createMobileHomechatRunSession({
      conversationSessionId,
      initialMessages,
      presentationToken,
      runId,
      shouldAcceptUpdates: () => activeHomechatRunSessionRef.current === session,
    });
    activeChatAbortRef.current?.abort();
    activeChatAbortRef.current = abortController;
    activeHomechatRunSessionRef.current = session;
    try {
      const finalState = await session.reconnect(runId, { signal: abortController.signal });
      if (finalState.phase === "completed") await refresh();
    } catch (err) {
      if (mobileRunPresentationOwner.owns(presentationToken) && !isChatRunCancelledError(err) && !isSharedHomechatRunControllerError(err, "aborted")) {
        setAppError(displayError(err, "Could not reconnect to the current reply."));
      }
    } finally {
      clearMobileRunPresentation(presentationToken);
      mobileRunPresentationOwner.finish(presentationToken);
      if (activeChatAbortRef.current === abortController) activeChatAbortRef.current = null;
      if (activeHomechatRunSessionRef.current === session) {
        activeHomechatRunSessionRef.current = null;
        if (resumingChatRunRef.current === runId) resumingChatRunRef.current = null;
      }
    }
  }

  async function loadConnectionReach() {
    if (!token) return;
    const requestId = connectionReachRequestRef.current + 1;
    connectionReachRequestRef.current = requestId;
    setConnectionReachBusy(true);
    setConnectionReachError(null);
    try {
      const nextReach = await api.connectionReach();
      if (connectionReachRequestRef.current === requestId) setConnectionReach(nextReach);
    } catch (err) {
      if (connectionReachRequestRef.current === requestId) {
        setConnectionReach(null);
        setConnectionReachError(userFacingError(displayError(err, "Could not check the connected services.")));
      }
    } finally {
      if (connectionReachRequestRef.current === requestId) setConnectionReachBusy(false);
    }
  }

  async function authorizeGoogleConnection() {
    if (busy || !googleConnectionClientId.trim() || !googleClientSecret.trim() || !googleAuthorizationCode.trim() || !googleRedirectUri.trim()) return;
    setIntegrationNotice(null);
    await runAction("Connecting Google...", "Could not connect Google.", async () => {
      const result = await api.authorizeGoogleConnection({
        clientId: googleConnectionClientId.trim(),
        clientSecret: googleClientSecret.trim(),
        authorizationCode: googleAuthorizationCode.trim(),
        redirectUri: googleRedirectUri.trim(),
      });
      setGoogleConnectionClientId("");
      setGoogleClientSecret("");
      setGoogleAuthorizationCode("");
      setGoogleRedirectUri("http://127.0.0.1:1");
      setIntegrationNotice(connectionUiMessage(appLocale, "Google is set up for {account}. Checking what Hermes can reach now.", { account: result.connectedAccount }));
      await loadConnectionReach();
    });
  }

  async function openGoogleConsent() {
    const url = googleConsentUrl(googleConnectionClientId, googleRedirectUri);
    if (!url || busy) return;
    await runAction("Opening Google consent...", "Could not open Google consent.", async () => {
      await Linking.openURL(url);
    });
  }

  async function startIntegration(kind: IntegrationKind) {
    if (busy) return;
    setIntegrationNotice(null);
    await runAction("Starting setup...", "Could not start the integration setup.", async () => {
      const integration = await api.startIntegration(kind);
      setIntegrationNotice(connectionUiMessage(appLocale, "{connection} setup started.", { connection: integration.label }));
      await refresh();
    });
  }

  async function saveIntegration(kind: IntegrationKind) {
    if (busy) return false;
    setIntegrationNotice(null);
    return runAction("Saving connection...", "Could not save the connection.", async () => {
      const integration =
        kind === "telegram"
          ? await api.saveIntegration(kind, { telegramBotToken })
          : kind === "whatsapp"
            ? await api.saveIntegration(kind, {
                whatsappAccessToken,
                whatsappPhoneNumberId,
                whatsappPairingPlaceholder,
                whatsappPairingStatus,
              })
            : await api.saveIntegration(kind, { emailSmtpUrl, emailImapUrl, emailFromAddress });

      clearIntegrationFields(kind);
      setIntegrationNotice(connectionUiMessage(appLocale, "{connection} details saved privately. They will not be shown again.", { connection: integration.label }));
      await refresh();
    });
  }

  /**
   * HPD-499. Hands the bot's pairing code to Hermes' own approval endpoint.
   *
   * Hey Hermes records nothing here. `PairingStore.approve_code`
   * (gateway/pairing.py:471) writes the grant into Hermes'
   * `telegram-approved.json`, which the gateway reads on the sender's next
   * message; this only carries the code there and reports what Hermes said.
   */
  async function approveTelegramPairing() {
    if (busy) return false;
    const code = telegramPairingCode.trim();
    if (!code) return false;
    setTelegramPairingNotice(null);
    return runAction("Approving the pairing code...", "Could not approve the pairing code.", async () => {
      const result = await api.approveTelegramPairing({ code });
      setTelegramPairingCode("");
      setTelegramPairingNotice(
        result.userName
          ? connectionUiMessage(appLocale, "{name} can talk to this bot now.", { name: result.userName })
          : "That code is approved. The bot answers you from now on.",
      );
      await refresh();
    });
  }

  // HPD-499. The pairing block exists only once a bot token is saved. Before
  // that there is no bot, so Hermes can never have issued a code, and an empty
  // field would ask the customer for something that cannot exist yet.
  const telegramPairingEntry: SecureConnectionPairing | null = snapshot?.integrations
    .find((integration) => integration.kind === "telegram")
    ?.secrets.some((secret) => secret.key === "telegram_bot_token" && secret.saved)
    ? {
        code: telegramPairingCode,
        notice: telegramPairingNotice,
        onCodeChange: setTelegramPairingCode,
        onApprove: () => void approveTelegramPairing(),
      }
    : null;

  function closeSecureConnectionEntry(request: MobileConnectionSecureEntryRequest) {
    const next = mobileConnectionSecureEntryAfterClose(secureConnectionEntryRequestRef.current, request.requestId);
    if (next === secureConnectionEntryRequestRef.current) return;
    clearIntegrationFields(request.kind);
    commitSecureConnectionEntryRequest(next);
  }

  async function saveSecureConnectionEntry(request: MobileConnectionSecureEntryRequest) {
    if (
      secureConnectionEntrySaveRef.current ||
      secureConnectionEntryRequestRef.current?.requestId !== request.requestId
    ) {
      return;
    }
    secureConnectionEntrySaveRef.current = request.requestId;
    try {
      const saved = await saveIntegration(request.kind);
      if (!saved || secureConnectionEntryRequestRef.current?.requestId !== request.requestId) return;
      commitSecureConnectionEntryRequest(null);
      await runSend(
        mobileConnectionSecureEntryContinuation(request),
        "text",
        undefined,
        undefined,
        request.conversationSessionId,
      );
    } finally {
      if (secureConnectionEntrySaveRef.current === request.requestId) {
        secureConnectionEntrySaveRef.current = null;
      }
    }
  }

  async function saveSecureSecretEntry(request: SecureSecretEntryRequest, value: string) {
    if (secureSecretEntryBusyId || secureSecretEntryRequestRef.current?.id !== request.id) return;
    setSecureSecretEntryBusyId(request.id);
    setSecureSecretEntryReceipt(null);
    try {
      await api.completeSecureSecretEntry(request.id, { value });
      secureSecretEntryResolutionGate.settle(request);
      const next = secureSecretEntryAfterClose(secureSecretEntryRequestRef.current, request.id);
      if (next !== secureSecretEntryRequestRef.current) {
        commitSecureSecretEntryRequest(next);
        setSecureSecretEntryReceipt({
          conversationSessionId: request.conversationSessionId,
          text: `${request.label} saved securely.`,
        });
      }
    } catch {
      setAppError("Could not save this secure entry. It may have expired.", request.conversationSessionId);
    } finally {
      setSecureSecretEntryBusyId((current) => current === request.id ? null : current);
    }
  }

  async function cancelSecureSecretEntry(request: SecureSecretEntryRequest) {
    if (secureSecretEntryBusyId || secureSecretEntryRequestRef.current?.id !== request.id) return;
    setSecureSecretEntryBusyId(request.id);
    try {
      await api.cancelSecureSecretEntry(request.id);
      secureSecretEntryResolutionGate.settle(request);
      const next = secureSecretEntryAfterClose(secureSecretEntryRequestRef.current, request.id);
      if (next !== secureSecretEntryRequestRef.current) commitSecureSecretEntryRequest(next);
    } catch {
      setAppError("Could not cancel this secure entry. It may have expired.", request.conversationSessionId);
    } finally {
      setSecureSecretEntryBusyId((current) => current === request.id ? null : current);
    }
  }

  async function checkIntegration(kind: IntegrationKind) {
    if (busy) return;
    setIntegrationNotice(null);
    await runAction("Checking connection...", "Could not check the connection.", async () => {
      const integration = await api.checkIntegration(kind);
      setIntegrationNotice(connectionUiMessage(appLocale, "{connection} checked: {state}.", { connection: integration.label, state: integrationStateText(integration.state, appLocale) }));
      await refresh();
      await loadConnectionReach();
    });
  }

  async function openBookmark(href: string) {
    if (href === HEY_TASKS_PAGE_HREF) {
      selectMobileScreen("tasks");
      return;
    }
    try {
      await openMobileBrowserHref({
        api,
        apiBase: API_BASE,
        href,
        openUrl: (url) => Linking.openURL(url),
        openPrivateUrl: (url) => WebBrowser.openBrowserAsync(url),
      });
    } catch {
      setAppError("Could not open that page.");
    }
  }

  async function copyPublicBookmarkLink(href: string) {
    try {
      const copied = await writeClipboardText(bookmarkUrlForMobile(href));
      setBookmarkNotice(copied ? "Public link copied." : "Could not copy that public link.");
    } catch {
      setBookmarkNotice("Could not copy that public link.");
    }
  }

  async function publishPreviewBookmark(bookmark: AppSnapshot["bookmarks"][number]) {
    if (bookmarkActionId) return;
    const route = privatePreviewRouteFromHref(bookmark.href);
    if (!route) {
      setBookmarkNotice("This page is not a private preview link.");
      return;
    }
    setBookmarkNotice(null);
    setBookmarkActionId(`publish:${bookmark.id}`);
    try {
      const response = await api.publicRoute({
        port: route.port,
        path: route.path,
        title: bookmarkDisplayTitle(bookmark.title),
      });
      const bookmarks = await api.bookmarks();
      setSnapshot((current) => (current ? { ...current, bookmarks } : current));
      const copied = await writeClipboardText(bookmarkUrlForMobile(response.href));
      setBookmarkNotice(copied ? "Public link created and copied." : "Public link created.");
    } catch (err) {
      setBookmarkNotice(displayError(err, "Could not publish that page."));
    } finally {
      setBookmarkActionId(null);
    }
  }

  async function archiveNavigationEntry(entry: MobileRemovableNavigationEntry) {
    setBookmarkNotice(null);
    const archived = await api.archiveBookmark(entry.entryId);
    setSnapshot((current) =>
      current
        ? {
            ...current,
            bookmarks: current.bookmarks.map((bookmark) => (bookmark.id === archived.id ? archived : bookmark)),
          }
        : current,
    );
    setBookmarkNotice("Removed from Pages.");
  }

  async function startVoiceNote() {
    if (voiceControllerBusy || voiceRecordingActive || voiceNoteDraftRef.current.phase !== "idle") return;
    // The button that leads here is disabled by the same decision, so this is
    // the last line of defence and never what the customer runs into.
    if (mobileVoiceNoteBlockedByPendingRun({ activeRunId: activeChatRunId, busy })) return;
    const operationGeneration = ++voiceOperationGenerationRef.current;
    const accountGeneration = accountSessionGenerationRef.current;
    try {
      await voiceNoteController.start();
      if (!voiceOperationIsCurrent(operationGeneration, accountGeneration)) {
        await voiceNoteController.cancel().catch(() => undefined);
        const undeletedAudioFiles = await clearStoredAudioResidue(FileSystem, voiceRecorder.uri);
        if (undeletedAudioFiles > 0) {
          recordDiagnostic(
            "error",
            "Late voice recording cleanup failed",
            `${undeletedAudioFiles} audio file(s) remain after an invalidated recording start.`,
          );
        }
        return;
      }
      commitVoiceNoteDraft(mobileVoiceNoteRecordingStarted());
    } catch (err) {
      if (!voiceOperationIsCurrent(operationGeneration, accountGeneration)) return;
      const message = displayError(err, "Voice recording could not start.");
      recordDiagnostic("error", "Voice recording start failed", message);
      setAppError(userFacingError(message));
    }
  }

  async function completeVoiceNote(sendAfterTranscription: boolean) {
    if (voiceCompletionInFlightRef.current || voiceControllerBusy || !voiceNoteController.isRecording()) return;
    voiceCompletionInFlightRef.current = true;
    const operationGeneration = ++voiceOperationGenerationRef.current;
    const accountGeneration = accountSessionGenerationRef.current;
    const selectedAttachments = sendAfterTranscription ? pendingAttachments : [];
    const attachmentsToSend = sendAfterTranscription
      ? mobileAttachmentPayload(pendingAttachments)
      : [];
    let messageToSend: string | null = null;
    commitVoiceNoteDraft(mobileVoiceNoteTranscriptionRequested(voiceNoteDraftRef.current));
    try {
      const transcript = await voiceNoteController.stopAndTranscribe();
      if (!voiceOperationIsCurrent(operationGeneration, accountGeneration)) return;
      if (voiceNoteDraftRef.current.phase !== "transcribing") return;
      const recordingUri = voiceRecordingUriRef.current || voiceRecorder.uri || "";
      const withRecording = mobileVoiceNoteTranscriptionStarted(
        voiceNoteDraftRef.current,
        recordingUri,
      );
      const appended = mobileVoiceNoteTranscriptionAppended(withRecording, transcript, inputRef.current);
      commitVoiceNoteDraft(appended.state);
      if (appended.state.phase === "idle") {
        if (sendAfterTranscription) {
          messageToSend = appended.composerText.trim() || (attachmentsToSend.length
            ? "Please review the attached files."
            : null);
          Keyboard.dismiss();
          setInput("");
          const sentAttachmentIds = new Set(selectedAttachments.map((attachment) => attachment.id));
          setPendingAttachments((current) => current.filter((attachment) => !sentAttachmentIds.has(attachment.id)));
        } else {
          setInput(appended.composerText);
        }
        await removeVoiceNoteRecording(recordingUri);
        voiceRecordingUriRef.current = null;
      }
    } catch (err) {
      if (!voiceOperationIsCurrent(operationGeneration, accountGeneration)) return;
      const message = voiceTranscriptError(err);
      const recordingUri = voiceRecordingUriRef.current || voiceRecorder.uri;
      const withRecording = recordingUri
        ? mobileVoiceNoteTranscriptionStarted(voiceNoteDraftRef.current, recordingUri)
        : voiceNoteDraftRef.current;
      commitVoiceNoteDraft(mobileVoiceNoteTranscriptionFailed(withRecording, message));
      recordDiagnostic("error", "Voice transcription failed", message);
    } finally {
      voiceCompletionInFlightRef.current = false;
    }
    if (messageToSend) {
      const result = await runSend(messageToSend, "voice", undefined, attachmentsToSend);
      if (result === "ignored" && selectedAttachments.length) {
        setPendingAttachments((current) => {
          const currentIds = new Set(current.map((attachment) => attachment.id));
          return [...selectedAttachments.filter((attachment) => !currentIds.has(attachment.id)), ...current];
        });
      }
    }
  }

  async function stopVoiceNote() {
    await completeVoiceNote(false);
  }

  async function sendRecordingVoiceNote() {
    await completeVoiceNote(true);
  }

  async function retryVoiceNoteTranscription() {
    const draft = voiceNoteDraftRef.current;
    if (!draft.recordingUri || draft.phase === "transcribing" || draft.phase === "sending") return;
    const operationGeneration = ++voiceOperationGenerationRef.current;
    const accountGeneration = accountSessionGenerationRef.current;
    commitVoiceNoteDraft(mobileVoiceNoteTranscriptionStarted(draft, draft.recordingUri));
    try {
      const audioBase64 = await FileSystem.readAsStringAsync(draft.recordingUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const result = await api.transcribeVoiceNote({
        audioBase64,
        mimeType: voiceMimeTypeForPlatform(),
      });
      if (!voiceOperationIsCurrent(operationGeneration, accountGeneration)) return;
      if (voiceNoteDraftRef.current.phase !== "transcribing") return;
      const transcribing = voiceNoteDraftRef.current;
      const recordingUri = transcribing.recordingUri;
      const appended = mobileVoiceNoteTranscriptionAppended(transcribing, result.text, input);
      commitVoiceNoteDraft(appended.state);
      if (appended.state.phase === "idle") {
        setInput((current) => mobileVoiceNoteTranscriptionAppended(transcribing, result.text, current).composerText);
        await removeVoiceNoteRecording(recordingUri);
        voiceRecordingUriRef.current = null;
      }
    } catch (err) {
      if (!voiceOperationIsCurrent(operationGeneration, accountGeneration)) return;
      const message = voiceTranscriptError(err);
      commitVoiceNoteDraft(mobileVoiceNoteTranscriptionFailed(voiceNoteDraftRef.current, message));
      recordDiagnostic("error", "Voice transcription retry failed", message);
    }
  }

  async function removeVoiceNoteRecording(recordingUri: string | null) {
    if (!recordingUri) return;
    try {
      await FileSystem.deleteAsync(recordingUri, { idempotent: true });
    } catch (err) {
      recordDiagnostic("error", "Voice recording cleanup failed", displayError(err, "The voice recording could not be removed."));
    }
  }

  async function discardVoiceNote() {
    const draft = voiceNoteDraftRef.current;
    if (draft.phase === "sending" || draft.phase === "transcribing") return;
    voiceOperationGenerationRef.current += 1;
    if (voiceNoteController.isRecording()) await voiceNoteController.cancel().catch(() => undefined);
    await removeVoiceNoteRecording(draft.recordingUri || voiceRecorder.uri);
    voiceRecordingUriRef.current = null;
    commitVoiceNoteDraft(mobileVoiceNoteDiscarded());
  }

  function voiceTranscriptError(err: unknown) {
    return homechatVoiceTranscriptError(displayError(err, "Voice note could not be transcribed."));
  }

  async function copyDiagnostics() {
    const copied = await writeClipboardText(diagnosticsText(diagnosticLog, snapshot));
    showCopyNotice(copied ? "Diagnostics copied." : "Could not copy diagnostics.");
  }

  function clearIntegrationFields(kind: IntegrationKind, options: { resetStatus?: boolean } = {}) {
    if (kind === "telegram") {
      setTelegramBotToken("");
      // HPD-499. A code belongs to one bot. Once the token behind it is gone or
      // replaced, the code in the field is no longer approvable.
      setTelegramPairingCode("");
      setTelegramPairingNotice(null);
    } else if (kind === "whatsapp") {
      setWhatsappAccessToken("");
      setWhatsappPhoneNumberId("");
      setWhatsappPairingPlaceholder("");
      if (options.resetStatus) setWhatsappPairingStatus("not_started");
    } else {
      setEmailSmtpUrl("");
      setEmailImapUrl("");
      setEmailFromAddress("");
    }
  }

  async function resetIntegration(kind: IntegrationKind) {
    if (busy) return;
    const currentIntegration = snapshot?.integrations.find((integration) => integration.kind === kind);
    const label = currentIntegration?.label || staticUiCopy(appLocale)["This connection"];
    setIntegrationNotice(null);
    setResettingIntegration(kind);
    try {
      await runAction("Disconnecting...", connectionUiMessage(appLocale, "{connection} could not be disconnected.", { connection: label }), async () => {
        const integration = await api.resetIntegration(kind);
        clearIntegrationFields(kind, { resetStatus: true });
        setIntegrationNotice(
          connectionUiMessage(appLocale, "{connection} was disconnected. Saved details were removed from this workspace.", { connection: integration.label }),
        );
        await refresh();
      });
    } finally {
      setResettingIntegration(null);
    }
  }

  async function createAccount() {
    const name = accountName.trim();
    const accountEmailAddress = accountEmail.trim();
    if (!name || !accountEmailAddress) return;
    const operation = startMobileAccountAction({ kind: "invite_account" });
    if (!operation) return;
    await settleMobileAccountAction(operation, async () => {
      const response = await api.createAccount({ name, email: accountEmailAddress, role: "member" });
      setAccountName("");
      setAccountEmail("");
      if (response.runtimeError) recordDiagnostic("error", "Created account runtime needs attention", response.runtimeError);
      const creationParts = [
        systemPageCopy.account.created.replace("{email}", response.account.email),
        response.assignedWarmWorkspaceId ? systemPageCopy.account.preparedWorkspace : null,
        response.runtimePrepared
          ? systemPageCopy.account.runtimeReady
          : response.runtimeError
            ? systemPageCopy.account.runtimeAttention
            : systemPageCopy.account.runtimeStarts,
        response.generatedAccessCode
          ? systemPageCopy.account.oneTimeCode.replace("{code}", response.generatedAccessCode)
          : null,
      ].filter((part): part is string => Boolean(part));
      setAdminNotice(creationParts.join(" "));
      await refresh();
    }, systemPageCopy.account.createError, true);
  }

  async function disableAccount(account: AlphaAccount) {
    const operation = startMobileAccountAction({ accountId: account.id, kind: "disable_account_access" });
    if (!operation) return;
    await settleMobileAccountAction(operation, async () => {
      await api.deleteAccount(account.id);
      setAdminNotice(systemPageCopy.account.disabled.replace("{email}", account.email));
      await refresh();
    }, systemPageCopy.account.disableError, true);
  }

  async function resetAccount(account: AlphaAccount) {
    const operation = startMobileAccountAction({ accountId: account.id, kind: "reset_account_access" });
    if (!operation) return;
    await settleMobileAccountAction(operation, async () => {
      const response = await api.updateAccount(account.id, { resetAccessCode: true });
      setAdminNotice(response.generatedAccessCode
        ? `${systemPageCopy.account.reset.replace("{email}", account.email)} ${systemPageCopy.account.oneTimeCode.replace("{code}", response.generatedAccessCode)}`
        : systemPageCopy.account.updatedAccount.replace("{email}", account.email));
      await refresh();
    }, systemPageCopy.account.resetError, true);
  }

  async function createSupportAccess() {
    const minutes = Math.max(1, Math.min(240, Number.parseInt(supportMinutes, 10) || 30));
    const operation = startMobileAccountAction({ kind: "create_support_pass" });
    if (!operation) return;
    await settleMobileAccountAction(operation, async () => {
      const response = await api.createSupportGrant({
        reason: supportReason?.trim() || "Temporary read-only diagnostics",
        scopes: [...mobileSupportAccessScopes],
        expiresInMinutes: minutes,
      });
      setSupportToken(response.token);
      setSupportReason(null);
      setSupportMinutes(String(minutes));
      await refresh();
    }, "Could not create the support access.");
  }

  const externalNavigationRef = useRef<string | null>(null);
  useEffect(() => {
    if (!token || !snapshot || !navigationRequest || externalNavigationRef.current === navigationRequest.requestId) return;
    externalNavigationRef.current = navigationRequest.requestId;
    let active = true;
    void loadMobileChatSession(navigationRequest.conversationId, { force: true, preserveDraft: true }).then((accepted) => {
      if (active && accepted) navigationRequest.onAccepted?.(navigationRequest.conversationId);
    });
    return () => { active = false; };
  }, [token, snapshot?.workspace.id, navigationRequest?.requestId]);

  if (!sessionRestored) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar style={resolvedColorScheme === "dark" ? "light" : "dark"} />
        <View style={styles.loading}>
          <MobileWorkingDragon
            animated={reduceMotion === false}
            accessibilityLabel={staticUiCopy(appLocale)["Opening Hey Hermes"]}
            size={72}
          />
          <Text style={styles.title}>{staticUiCopy(appLocale)["Opening Hey Hermes"]}</Text>
          <Text style={styles.openingSubtitle}>{staticUiCopy(appLocale)["Checking for a secure saved session."]}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!token && host.session.mode === "external") return host.session.renderUnavailable();

  if (!token) {
    const canSubmitLogin = Boolean(email.trim() && (loginPassword || accessCode.trim())) && !busy;
    if (signedOutSupportOpen) {
      return (
        <SafeAreaView style={styles.safe}>
          <StatusBar style={resolvedColorScheme === "dark" ? "light" : "dark"} />
          <ScrollView contentContainerStyle={styles.loginScreen}>
            <Pressable
              style={styles.secondaryButtonWide}
              onPress={() => setSignedOutSupportOpen(false)}
              accessibilityRole="button"
              accessibilityLabel={connectionUiMessage(appLocale, "Close {name}", { name: t.nav.support })}
            >
              <Text style={styles.secondaryButtonText}>{staticUiCopy(appLocale)["Back"]}</Text>
            </Pressable>
            <AnonymousSupportRequestForm locale={appLocale} client={anonymousSupportRequestClient} mode="anonymous" />
          </ScrollView>
        </SafeAreaView>
      );
    }
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar style={resolvedColorScheme === "dark" ? "light" : "dark"} />
        <KeyboardAvoidingView
          style={styles.authKeyboard}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.authScreen}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.authCard}>
              <View style={styles.authHero}>
                <MobileWorkingDragon animated={false} accessibilityLabel="Hey Hermes" size={88} />
                <Text style={styles.authTitle}>{appCopy.productName}</Text>
                <Text style={styles.authSubtitle}>{staticUiCopy(appLocale)["Your private assistant, ready when you are."]}</Text>
              </View>

              <View style={styles.authModeSwitch} accessibilityLabel={staticUiCopy(appLocale)["Account access"]}>
                <Pressable
                  style={[styles.authModeButton, authEntryMode === "sign_in" && styles.authModeButtonSelected]}
                  onPress={() => setAuthEntryMode("sign_in")}
                  accessibilityRole="button"
                  accessibilityLabel={staticUiCopy(appLocale)["Sign in"]}
                  accessibilityState={{ selected: authEntryMode === "sign_in" }}
                >
                  <Text style={[styles.authModeText, authEntryMode === "sign_in" && styles.authModeTextSelected]}>{staticUiCopy(appLocale)["Sign in"]}</Text>
                </Pressable>
                <Pressable
                  style={[styles.authModeButton, authEntryMode === "create_account" && styles.authModeButtonSelected]}
                  onPress={() => setAuthEntryMode("create_account")}
                  accessibilityRole="button"
                  accessibilityLabel={staticUiCopy(appLocale)["Create account"]}
                  accessibilityState={{ selected: authEntryMode === "create_account" }}
                >
                  <Text style={[styles.authModeText, authEntryMode === "create_account" && styles.authModeTextSelected]}>{staticUiCopy(appLocale)["Create account"]}</Text>
                </Pressable>
              </View>

              {authEntryMode === "sign_in" ? (
                <View style={styles.authForm}>
                  {/* textContentType is what iOS actually reads; autoComplete alone
                      is Android. Without it iOS guesses, and it guessed "new
                      password" on a sign-in form and offered to invent one. */}
                  <TextInput value={email} onChangeText={setEmail} autoCapitalize="none" autoComplete="email" textContentType="username" keyboardType="email-address" placeholder={staticUiCopy(appLocale)["Email"]} style={styles.input} />
                  {/* Two credentials really exist. Someone who redeemed an invite has
                      only a password; someone who has not redeemed yet has only an
                      access code. One field labelled "Access code" asked most people
                      for a credential they do not have. */}
                  <TextInput value={loginPassword} onChangeText={setLoginPassword} autoCapitalize="none" autoComplete="current-password" textContentType="password" secureTextEntry placeholder={staticUiCopy(appLocale)["Password"]} style={styles.input} />
                  {/* Deliberately not secureTextEntry. An access code is issued in
                      plain text by an owner and pasted in, and a second masked field
                      next to the password made iOS read the form as account
                      creation - it offered to generate a password on a sign-in
                      screen. */}
                  <TextInput value={accessCode} onChangeText={setAccessCode} autoCapitalize="none" autoCorrect={false} autoComplete="off" textContentType="none" placeholder={staticUiCopy(appLocale)["Access code (if you have not set a password)"]} style={styles.input} />
                  <Pressable style={[styles.primaryButtonWide, !canSubmitLogin && styles.disabledButton]} onPress={login} disabled={!canSubmitLogin}>
                    {busy ? <ActivityIndicator color={palette.accentText} /> : <ShieldCheck size={18} color={palette.accentText} />}
                    <Text style={styles.primaryButtonText}>{busyLabel ? staticUiMessage(appLocale, busyLabel) : staticUiCopy(appLocale)["Sign in"]}</Text>
                  </Pressable>
                </View>
              ) : (
                <Text style={styles.authModeIntro}>{staticUiCopy(appLocale)["Create your account securely with Google or Apple."]}</Text>
              )}

              {Platform.OS === "ios" && (nativeAuthConfig?.providers.google || (nativeAuthConfig?.providers.apple && appleSignInAvailable)) ? (
                <View style={styles.nativeAuthGroup}>
                  <Text style={styles.nativeAuthDivider}>
                    {authEntryMode === "sign_in" ? staticUiCopy(appLocale)["or continue with"] : staticUiCopy(appLocale)["Choose a sign-up method"]}
                  </Text>
                  {nativeAuthConfig?.providers.google ? (
                    <Pressable
                      style={[styles.secondaryButtonWide, (!googleAuthRequest || !googleChallenge || googleChallenge.mode !== "login" || Boolean(nativeAuthBusy)) && styles.disabledButton]}
                      onPress={() => void signInWithGoogle()}
                      disabled={!googleAuthRequest || !googleChallenge || googleChallenge.mode !== "login" || Boolean(nativeAuthBusy)}
                    >
                      {nativeAuthBusy === "google" ? <ActivityIndicator color={palette.teal} /> : <Text style={styles.secondaryButtonText}>G</Text>}
                      <Text style={styles.secondaryButtonText}>
                        {authEntryMode === "sign_in" ? staticUiCopy(appLocale)["Continue with Google"] : staticUiCopy(appLocale)["Sign up with Google"]}
                      </Text>
                    </Pressable>
                  ) : null}
                  {nativeAuthConfig?.providers.apple && appleSignInAvailable ? (
                    nativeAuthBusy ? (
                      nativeAuthBusy === "apple" ? <ActivityIndicator color={palette.teal} /> : null
                    ) : (
                      <AppleAuthentication.AppleAuthenticationButton
                        buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                        buttonType={authEntryMode === "sign_in"
                          ? AppleAuthentication.AppleAuthenticationButtonType.CONTINUE
                          : AppleAuthentication.AppleAuthenticationButtonType.SIGN_UP}
                        cornerRadius={8}
                        onPress={() => void signInWithApple()}
                        style={styles.appleAuthButton}
                      />
                    )
                  ) : null}
                </View>
              ) : authEntryMode === "create_account" && nativeAuthConfig ? (
                <Text style={styles.authModeIntro}>{staticUiCopy(appLocale)["Account creation is not available in this build."]}</Text>
              ) : null}
              {error ? <Notice locale={appLocale} tone="error" text={error} onDismiss={dismissAppError} /> : null}
              <Text style={styles.privacyNote}>{staticUiCopy(appLocale)["Connection details are encrypted. Chat content is private to this workspace and processed by Hey Hermes."]}</Text>
              <Pressable
                style={styles.authSupportButton}
                onPress={() => setSignedOutSupportOpen(true)}
                accessibilityRole="button"
              >
                <Text style={styles.authSupportText}>{t.nav.support}</Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  if (!snapshot) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar style={resolvedColorScheme === "dark" ? "light" : "dark"} />
        <View style={styles.loading}>
          <MobileWorkingDragon
            animated={reduceMotion === false}
            accessibilityLabel={staticUiCopy(appLocale)["Opening Hey Hermes"]}
            size={72}
          />
          <Text style={styles.title}>{staticUiCopy(appLocale)["Opening Hey Hermes"]}</Text>
          <Text style={styles.openingSubtitle}>
            {error ? staticUiMessage(appLocale, error) : staticUiMessage(appLocale, "{environment} is starting. I will keep checking automatically.").replace("{environment}", () => apiBaseConfig.label)}
          </Text>
          {!error && apiBaseConfig.isLocal ? (
            <Notice locale={appLocale} tone="info" text={staticUiCopy(appLocale)["Default local testing uses http://localhost:4100. Expo settings can point this build at another server."]} />
          ) : null}
          {visibleSessionNotice ? <Notice locale={appLocale} tone="info" text={visibleSessionNotice} onDismiss={dismissSessionNotice} /> : null}
          <Pressable style={[styles.secondaryButtonWide, isRefreshing && styles.disabledButton]} onPress={() => void refresh()} disabled={isRefreshing}>
            <RefreshCcw size={17} color={palette.teal} />
            <Text style={styles.secondaryButtonText}>{isRefreshing ? staticUiCopy(appLocale)["Checking..."] : staticUiCopy(appLocale)["Retry now"]}</Text>
          </Pressable>
          <Pressable style={styles.secondaryButtonWide} onPress={() => void logout()}>
            <LogOut size={17} color={palette.teal} />
            <Text style={styles.secondaryButtonText}>{staticUiCopy(appLocale)["Sign out"]}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const currentAccount = snapshot.accounts.find((account) => account.id === snapshot.me.id);
  const isOwner = currentAccount?.role === "owner";
  const canManageWorkspaceConnections = snapshot.workspace.accountId === snapshot.me.id;
  const inviteAccountAction = mobileAccountActionRow(accountActionState, { kind: "invite_account" });
  const createSupportPassAction = mobileAccountActionRow(accountActionState, { kind: "create_support_pass" });
  const mobilePurchaseBusy = mobilePurchasePhase === "purchasing" || mobilePurchasePhase === "restoring";
  const paywall = iosPaywallView({
    locale: appLocale,
    plan: mobilePurchasePlans[0] ?? null,
    comped: snapshot.entitlement.comped === true,
    entitlementStatus: snapshot.entitlement.status,
    runtimeAccess: snapshot.subscription.lifecycle.runtimeAccess,
    storeState: iosPaywallStoreState(mobilePurchasePhase),
  });
  const personalAccess = personalAccessPresentation(
    snapshot.entitlement,
    appLocale,
    (value) => formatSecurityDate(value, appLocale),
    snapshot.subscription.promotionalGrant,
  );
  const pendingProductAccess = host.session.mode === "standalone" && !isMobileAccountFullyReady(snapshot, workspaceStatusTruth);
  const pendingAccessCopy = mobilePendingAccessCopy(appLocale);
  const mobilePersonalPurchaseAvailable = mobilePersonalPurchaseCanStart(
    snapshot.me.id,
    snapshot.subscription,
    mobilePurchaseCompletion,
  );
  const chatAccess = mobileChatAccessView(snapshot, selectedChatRoutePreference ?? snapshot.chatRoutePreference, workspaceStatusTruth);
  const activeSubthreadHeader = subthreadHeader(subthreadOrigin, tab, appLocale);
  const aiAccessTruth = mobileAiAccessTruthFromSources(
    workspaceStatusTruth,
    chatGptAccountConnectionView(snapshot).ready,
    claudeStatus,
  );
  const chatConfigured = chatAccess.ready;
  const chatComposerBusy = busy || queuedFollowUps.some((item) => item.conversationSessionId === activeConversationSessionId && mobileQueuedFollowUpBlocksComposer(item.status));
  const composerController = createHomechatComposerController({
    activeRunId: activeChatRunId ?? queuedFollowUps.find((item) => item.conversationSessionId === activeConversationSessionId && mobileQueuedFollowUpBlocksComposer(item.status))?.runId ?? null,
    allowFollowUpQueue: !queuedFollowUps.some((item) => item.status === "queueing"),
    allowTypingWhileBusy: true,
    busy: chatComposerBusy,
    hasAttachments: pendingAttachments.length > 0,
    hasText: Boolean(input.trim()),
    ready: chatConfigured,
    voiceBusy,
    voiceRecording: voiceRecordingActive,
    copy: {
      queueFollowUp: "Queue follow-up",
    },
  });
  const canSendMessage = composerController.view.canUseSendButton;
  const visibleQueuedFollowUps = queuedFollowUps.filter((queued) =>
    queued.conversationSessionId === activeConversationSessionId && mobileQueuedFollowUpNoticeVisible({
      activeRunId: activeChatRunId,
      answerInTranscript: Boolean(queued.runId) && messages.some((message) => message.runId === queued.runId && message.role === "assistant"),
      queued,
      runStatus: queued.runId ? chatRunStatusesById[queued.runId] ?? null : null,
    }),
  );
  const voiceButtonDisabled = mobileVoiceButtonDisabled({
    activeRunId: activeChatRunId,
    busy,
    composerVoiceButtonDisabled: composerController.view.voiceButtonDisabled,
    voiceRecordingActive,
  });
  // HPD-440: a pending line is only true while a run is actually being watched.
  // It is set by whichever session owns the live presentation and cleared by the
  // same owner, so a session that loses ownership mid-run leaves its line
  // standing with nothing behind it. Measured on Build 58: the arrow stayed a
  // spinner on a sub order's screen long after that screen's run had ended.
  const pendingAssistantText = activeChatRunId || busy ? (chatStreamingText || chatPendingText) : "";
  const activeChatRunActivityView = activeChatRunId
    ? mobileLiveRunActivityView({
        assistantText: chatStreamingText,
        events: chatEventsByRunId[activeChatRunId] ?? [],
        runStatus: chatRunStatusesById[activeChatRunId] ?? null,
      })
    : null;
  const canStopReply = Boolean(composerController.canStopRun && pendingAssistantText);
  const activeDelegatedTask = mobileDelegatedTaskForConversation(
    delegatedTasks,
    activeConversationSessionId,
    dismissedDelegatedTaskIds,
  );
  const voiceTranscriptionFailed = voiceNoteDraft.phase === "transcription_failed";
  const readAloudActive = readAloudState.phase === "requesting" || readAloudState.phase === "playing";
  const canStopReadAloud = readAloudActive;
  const composerActions = mobileComposerActionState({
    canSendMessage,
    canStopDelegatedTask: Boolean(activeDelegatedTask),
    canStopReadAloud,
    canStopReply,
    hasComposerContent: Boolean(input.trim()) || pendingAttachments.length > 0,
    pendingAssistantText: Boolean(pendingAssistantText),
    queueFollowUpAvailable: composerController.view.canQueueFollowUp,
    sendButtonTitle: composerController.view.sendButtonTitle,
    voiceRecordingActive,
  });
  const attachmentVoiceComposer = mobileAttachmentVoiceComposerState({
    hasAttachments: pendingAttachments.length > 0,
    hasText: Boolean(input.trim()),
    voiceButtonDisabled,
    voiceRecordingActive,
  });
  const visibleFailedMessage = failedMessage && !mobileFailedMessageHasCompleted(failedMessage, chatRunStatusesById) && (
    !failedMessage.conversationSessionId || failedMessage.conversationSessionId === activeConversationSessionId
  ) ? failedMessage : null;
  const visibleMobileMessages = mobileMessagesForFailedRunNotice({
    events: visibleFailedMessage?.runId ? chatEventsByRunId[visibleFailedMessage.runId] ?? [] : [],
    failedRunId: visibleFailedMessage?.runId,
    messages: pageStarterTranscript(homechatTranscriptMessages(messages, { includeEmpty: true }), pageStarter,
      { workspaceId: snapshot.workspace.id, conversationId: activeConversationSessionId ?? "" }, pageStarterCopy(appLocale).question),
  });
  const chatGptPanel = mobileChatGptConnectionCardView({
    dismissedKey: dismissedChatGptPanelKey,
    pendingSessionId: chatGptConnection?.sessionId ?? null,
    reconnectRequired: chatGptAccountConnectionView(snapshot).reconnectRequired,
    selectedPreference: selectedChatRoutePreference,
  });
  const activeChatSession = chatSessions.find((session) => session.id === activeConversationSessionId) ?? null;
  const isHomeChatActive = tab === "chat" && activeChatSession?.role === "home";
  const recommendedConnection = guidedSetupState?.recommendedConnection ?? null;
  const showGmailRecommendationCard = Boolean(
    host.policy.preinstalledEmailScanner &&
    isHomeChatActive &&
    firstConversationSnapshot?.phase === "connections" &&
    recommendedConnection?.showCard,
  );
  const showConnectGmailMenuEntry = host.policy.preinstalledEmailScanner && recommendedConnection?.showMenuEntry === true;
  const activeBookmarks = snapshot.bookmarks.filter((bookmark) => bookmark.status === "active");
  const filteredHeySuggestions = heySuggestions.filter((suggestion) => heySuggestionMatchesFilter(suggestion, heySuggestionFilter));
  const visibleSettingsSection: SettingsSection | null = tab === "account" ? settingsSection ?? "account" : tab === "support" ? "support" : settingsSection;
  // HPD-411: the archive list and the security evidence the browser shows,
  // derived once so the Account screen only has to draw them.
  const formatSecurityDateValue = (value: string) => formatSecurityDate(value, appLocale);
  const formatRankedTaskInstant = (value: string) => formatRankedTaskDate(value, appLocale);
  const securityAccess = snapshot.securityAccess ?? defaultMobileSecurityAccessOverview();
  const backupJobRows = mobileBackupJobRows(
    snapshot.backupJobs,
    {
      exportKind: t.systemPages.account.exportKind,
      exportStatus: t.systemPages.account.exportStatus,
      exportRequested: t.systemPages.account.exportRequested,
      exportCompleted: t.systemPages.account.exportCompleted,
    },
    formatSecurityDateValue,
  );

  if (host.session.mode === "standalone" && Platform.OS === "ios" && paywall.showOnboarding && !pendingProductAccess) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar style={resolvedColorScheme === "dark" ? "light" : "dark"} />
        <ScrollView contentContainerStyle={styles.paywallScreen}>
          <IosPaywallPanel locale={appLocale}
            view={paywall}
            plan={mobilePurchasePlans[0] ?? null}
            phase={mobilePurchasePhase}
            accountReady={mobilePurchaseAccountReady}
            purchaseAvailable={mobilePersonalPurchaseAvailable}
            notice={mobilePurchaseNotice}
            onDismissNotice={() => setMobilePurchaseNotice(null)}
            onPurchase={purchaseMobilePlan}
            onRestore={restoreMobilePurchases}
            onManage={manageMobileSubscription}
          />
          <Pressable style={styles.secondaryButtonWide} onPress={() => void logout()} accessibilityRole="button">
            <LogOut size={17} color={palette.teal} />
            <Text style={styles.secondaryButtonText}>{staticUiCopy(appLocale)["Sign out"]}</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style={resolvedColorScheme === "dark" ? "light" : "dark"} />
      <View style={styles.mobileAppBar}>
        {activeSubthreadHeader.kind === "subthread" ? (
          <Pressable
            style={styles.mobileMenuButton}
            onPress={() => void leaveMobileSubthread(activeSubthreadHeader.parentConversationId)}
            accessibilityRole="button"
            accessibilityLabel={t.nav.back}
          >
            <ChevronLeft size={22} color={palette.brandBlue} />
          </Pressable>
        ) : (
          <Pressable
            style={styles.mobileMenuButton}
            onPress={() => setMenuOpen(true)}
            accessibilityRole="button"
            accessibilityLabel={t.nav.openMenu}
          >
            <Menu size={22} color={palette.ink} />
          </Pressable>
        )}
        <View style={styles.mobileAppBarTitle}>
          {activeSubthreadHeader.kind === "subthread" ? (
            <Text style={styles.subthreadHeaderTitle} numberOfLines={1}>{activeSubthreadHeader.label}</Text>
          ) : (
            <Text style={styles.chatHeaderTitle}>{mobileScreenTitle(tab, settingsSection, t)}</Text>
          )}
          <Text style={styles.chatHeaderSubtitle} numberOfLines={1}>
            {activeSubthreadHeader.kind === "subthread"
              ? activeSubthreadHeader.taskName || activeChatSession?.title || snapshot.me.email
              : tab === "chat" ? activeChatSession?.title || snapshot.me.email : snapshot.me.email}
          </Text>
        </View>
        {tab === "chat" ? (
          <Pressable
            style={({ pressed }) => [styles.mobilePrivacyButton, pressed && styles.systemRowPressed]}
            onPress={() => setPrivacyWorkspace(snapshot.workspace.id)}
            accessibilityRole="button"
            accessibilityLabel={t.settings.privacy}
          >
            <Lock size={27} strokeWidth={1.4} color={palette.muted} />
          </Pressable>
        ) : (
          <View style={styles.mobileAppBarSpacer} />
        )}
      </View>

      {dashboardOpenState !== "idle" ? (
        <View style={styles.dashboardOpenNotice} accessibilityLiveRegion="polite">
          <Notice locale={appLocale}
            tone={dashboardOpenState === "error" ? "error" : "info"}
            text={dashboardOpenState === "error" ? systemPageCopy.dashboard.error : systemPageCopy.dashboard.opening}
            onDismiss={dashboardOpenState === "error" ? () => setDashboardOpenState("idle") : undefined}
            dismissLabel={systemPageCopy.common.dismiss}
          />
          {dashboardOpenState === "error" ? (
            <Pressable style={styles.secondaryButtonWide} onPress={() => void openNativeHermesDashboard()} accessibilityRole="button">
              <RefreshCcw size={16} color={palette.ink} />
              <Text style={styles.secondaryButtonText}>{systemPageCopy.dashboard.retry}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {showGmailRecommendationCard ? (
        <View
          style={styles.gmailRecommendationCard}
          accessibilityLabel={t.firstConversation.connectionTitle}
        >
          <View style={styles.gmailRecommendationHeading}>
            <Mail size={18} color={palette.teal} />
            <View style={styles.flexOne}>
              <Text style={styles.eyebrow}>{t.firstConversation.connectionTitle}</Text>
              <Text style={styles.rowTitle}>{t.firstConversation.guidedSetup.labels.gmail}</Text>
            </View>
          </View>
          {gmailRecommendationError ? (
            <Text style={styles.guidedSetupLocalError} accessibilityRole="alert" accessibilityLiveRegion="polite">
              {gmailRecommendationError}
            </Text>
          ) : null}
          <View style={styles.gmailRecommendationActions}>
            <Pressable
              accessibilityRole="button"
              disabled={gmailRecommendationBusy}
              onPress={openGmailRecommendation}
              style={({ pressed }) => [styles.gmailRecommendationButton, pressed && styles.systemRowPressed]}
            >
              <Text style={styles.secondaryButtonText}>{t.firstConversation.guidedSetup.open}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ busy: gmailRecommendationBusy, disabled: gmailRecommendationBusy }}
              disabled={gmailRecommendationBusy}
              onPress={() => void updateGmailRecommendation("snooze")}
              style={({ pressed }) => [styles.gmailRecommendationButton, pressed && styles.systemRowPressed]}
            >
              {gmailRecommendationBusy ? (
                <ActivityIndicator size="small" color={palette.teal} />
              ) : (
                <Text style={styles.secondaryButtonText}>{t.firstConversation.guidedSetup.notNow}</Text>
              )}
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={gmailRecommendationBusy}
              onPress={() => void updateGmailRecommendation("dismiss")}
              style={({ pressed }) => [styles.gmailRecommendationDismiss, pressed && styles.systemRowPressed]}
            >
              <Text style={styles.gmailRecommendationDismissText}>{t.firstConversation.guidedSetup.noThanks}</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {privacyWorkspace === snapshot.workspace.id ? <MobilePrivacySheet
        key={snapshot.workspace.id} client={api} workspaceId={snapshot.workspace.id} locale={appLocale}
        onClose={() => setPrivacyWorkspace(null)} /> : null}
      {menuOpen ? (
        <MobileNavigationDrawer
          t={t}
          email={snapshot.me.email}
          plan={snapshot.entitlement.usagePoolPlan ?? snapshot.entitlement.plan}
          tab={tab}
          isOwner={isOwner}
          isHomeChatActive={isHomeChatActive}
          bookmarks={snapshot.bookmarks}
          onRemoveBookmark={archiveNavigationEntry}
          onNewPage={() => void openPageEntry()}
          chatSessions={chatSessions}
          activeSessionId={activeConversationSessionId}
          chatSessionsOpen={chatSessionsOpen}
          chatSessionsBusy={chatSessionsBusy}
          chatSessionNotice={chatSessionNotice}
          onClose={() => setMenuOpen(false)}
          onOpenHome={() => void openMobileHomeChat()}
          onStartNew={() => void startNewMobileChat()}
          onToggleRecents={() => setChatSessionsOpen((current) => !current)}
          onOpenSession={loadMobileChatSession}
          onOpenBookmark={(href) => {
            setMenuOpen(false);
            void openBookmark(href);
          }}
          appLocale={appLocale}
          onLocaleChange={updatePreferredLocale}
          appearancePreference={appearancePreference}
          onAppearanceChange={updateAppearancePreference}
          onOpenTasks={() => selectMobileScreen("tasks")}
          showConnectGmail={showConnectGmailMenuEntry}
          onConnectGmail={openGmailRecommendation}
          onOpenAutomations={() => selectMobileScreen("automations")}
          onOpenAiAccess={() => selectMobileScreen("ai_access")}
          onOpenConnections={() => selectMobileScreen("connections_customer")}
          onOpenAccount={() => selectMobileScreen("account")}
          onOpenSupport={() => selectMobileScreen("support")}
          onOpenPrivacy={() => { setMenuOpen(false); setPrivacyWorkspace(snapshot.workspace.id); }}
          onOpenDashboard={openNativeHermesDashboard}
          onLogout={() => void logout()}
        />
      ) : null}

      {foregroundNotification ? (
        <MobileForegroundNotificationBanner locale={appLocale}
          notice={foregroundNotification}
          onOpen={openForegroundNotificationNotice}
          onDismiss={() => setForegroundNotification(null)}
        />
      ) : null}

      {tab === "chat" ? (
        <KeyboardAvoidingView
          style={styles.chatKeyboard}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={8}
        >
          <View style={styles.chatScreen}>
            <View style={styles.chatNoticeStack}>
              {error ? <Notice locale={appLocale} tone="error" text={error} onDismiss={dismissAppError} /> : null}
              {visibleSessionNotice ? <Notice locale={appLocale} tone="info" text={visibleSessionNotice} onDismiss={dismissSessionNotice} /> : null}
              {secureSecretEntryReceipt?.conversationSessionId === activeConversationSessionId ? (
                <Notice locale={appLocale} tone="info" text={secureSecretEntryReceipt.text} onDismiss={() => setSecureSecretEntryReceipt(null)} />
              ) : null}
              {secureSecretEntryRequest?.conversationSessionId === activeConversationSessionId ? (
                <View style={styles.secureConnectionEntry}>
                  <Text style={styles.eyebrow}>{secureSecretEntryCopy(appLocale).title}</Text>
                  <SecureSecretEntryForm
                    locale={appLocale}
                    key={secureSecretEntryRequest.id}
                    request={secureSecretEntryRequest}
                    busy={secureSecretEntryBusyId === secureSecretEntryRequest.id}
                    onSave={(value) => saveSecureSecretEntry(secureSecretEntryRequest, value)}
                    onCancel={() => cancelSecureSecretEntry(secureSecretEntryRequest)}
                  />
                </View>
              ) : null}
              {secureConnectionEntryRequest?.conversationSessionId === activeConversationSessionId ? (
                <View style={styles.secureConnectionEntry} accessibilityLabel={connectionUiMessage(appLocale, "{name} secure credential entry", { name: secureConnectionEntryRequest.kind === "telegram" ? "Telegram" : "WhatsApp" })}>
                  <View style={styles.rowBetween}>
                    <Text style={styles.eyebrow}>{staticUiCopy(appLocale)["Continue setup securely"]}</Text>
                    <Pressable
                      accessibilityLabel={staticUiCopy(appLocale)["Close secure credential entry"]}
                      accessibilityRole="button"
                      disabled={busy}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      onPress={() => closeSecureConnectionEntry(secureConnectionEntryRequest)}
                    >
                      <X size={16} color={palette.muted} />
                    </Pressable>
                  </View>
                  <SecureConnectionCredentialForm
                      locale={appLocale}
                    kind={secureConnectionEntryRequest.kind}
                    busy={busy}
                    telegramBotToken={telegramBotToken}
                    whatsappAccessToken={whatsappAccessToken}
                    whatsappPhoneNumberId={whatsappPhoneNumberId}
                    onTelegramTokenChange={setTelegramBotToken}
                    onWhatsappAccessTokenChange={setWhatsappAccessToken}
                    onWhatsappPhoneNumberIdChange={setWhatsappPhoneNumberId}
                    onSave={() => void saveSecureConnectionEntry(secureConnectionEntryRequest)}
                    showAskHermes={false}
                  />
                </View>
              ) : null}
              {isHomeChatActive && heySuggestionNudge ? (
                <View style={styles.heySuggestionNudge} accessibilityLabel={staticUiCopy(appLocale)["Hey suggestion"]}>
                  <Text style={styles.eyebrow}>{staticUiCopy(appLocale)["Suggestion"]}</Text>
                  <Text style={styles.rowTitle}>{heySuggestionNudge.label}</Text>
                  <Text style={styles.muted}>{heySuggestionNudge.detail}</Text>
                  <View style={styles.heySuggestionActions}>
                    <Pressable style={[styles.primaryButtonWide, heySuggestionBusyId === heySuggestionNudge.id && styles.disabledButton]} onPress={() => void openHeySuggestion(heySuggestionNudge)} disabled={heySuggestionBusyId === heySuggestionNudge.id} accessibilityRole="button">
                      <Text style={styles.primaryButtonText}>{staticUiCopy(appLocale)["Open"]}</Text>
                    </Pressable>
                    <Pressable style={[styles.secondaryButtonWide, heySuggestionBusyId === heySuggestionNudge.id && styles.disabledButton]} onPress={() => void changeHeySuggestionPromotion(heySuggestionNudge, "dismissed")} disabled={heySuggestionBusyId === heySuggestionNudge.id} accessibilityRole="button">
                      <Text style={styles.secondaryButtonText}>{staticUiCopy(appLocale)["Dismiss"]}</Text>
                    </Pressable>
                  </View>
                </View>
              ) : null}
              {chatGptPanel.visible ? (
                <ChatGptPanel locale={appLocale}
                  snapshot={snapshot}
                  connection={chatGptConnection}
                  onConnect={connectChatGpt}
                  onCopyCode={() => void copyChatGptCodeInChat()}
                  onOpen={openChatGptSignIn}
                  onComplete={completeChatGptConnection}
                  busy={busy}
                  busyLabel={busyLabel}
                  onDismiss={() => setDismissedChatGptPanelKey(chatGptPanel.key)}
                />
              ) : null}
            </View>
            <ScrollView
              ref={messagesScrollRef}
              style={styles.chatMessages}
              contentContainerStyle={[
                styles.chatMessagesInner,
              ]}
              keyboardShouldPersistTaps="handled"
              maintainVisibleContentPosition={preserveMessagesScroll ? { minIndexForVisible: 0 } : undefined}
              onLayout={(event) => {
                messagesViewportHeightRef.current = event.nativeEvent.layout.height;
                const decision = chatTranscriptScrollDecision({
                  autoFollow: mobileScrollIntentRef.current.autoFollow,
                  contentHeight: messagesContentHeightRef.current,
                  viewportHeight: messagesViewportHeightRef.current,
                });
                if (decision === "top") messagesScrollRef.current?.scrollTo({ y: 0, animated: false });
              }}
              onScroll={(event) => {
                messagesScrollOffsetRef.current = event.nativeEvent.contentOffset.y;
              }}
              // Following the newest message is the customer's decision, and it
              // is only readable where their gesture comes to rest. Reading it
              // out of every scroll event counted the app's own scrolling as
              // stepping away: a freshly opened chat parked itself in the
              // middle of the conversation because the transcript was still
              // growing while it scrolled.
              onScrollEndDrag={(event) => commitMessagesScrollIntent(event.nativeEvent)}
              onMomentumScrollEnd={(event) => commitMessagesScrollIntent(event.nativeEvent)}
              scrollEventThrottle={16}
              onContentSizeChange={(_width, height) => {
                messagesContentHeightRef.current = height;
                if (preserveMessagesScrollRef.current) {
                  preserveMessagesScrollRef.current = false;
                  setPreserveMessagesScroll(false);
                  return;
                }
                // An offset past the last message is what the customer sees as
                // an empty chat: iOS keeps whatever offset it was given until a
                // finger touches the screen, so nothing brings the transcript
                // back on its own. Measured on a freshly signed-in device that
                // showed white over fifty loaded messages.
                const lowestVisibleOffset = Math.max(0, height - messagesViewportHeightRef.current);
                if (messagesScrollOffsetRef.current > lowestVisibleOffset + 1) {
                  messagesScrollOffsetRef.current = lowestVisibleOffset;
                  messagesScrollRef.current?.scrollTo({ y: lowestVisibleOffset, animated: false });
                }
                const next = mobileScrollIntentAfterContent(mobileScrollIntentRef.current);
                mobileScrollIntentRef.current = next;
                setShowScrollDown(next.showScrollDown);
                const decision = chatTranscriptScrollDecision({
                  autoFollow: next.scrollToEnd,
                  contentHeight: height,
                  viewportHeight: messagesViewportHeightRef.current,
                });
                if (decision === "top") {
                  setShowScrollDown(false);
                  messagesScrollRef.current?.scrollTo({ y: 0, animated: false });
                } else if (decision === "bottom") {
                  messagesScrollOffsetRef.current = lowestVisibleOffset;
                  messagesScrollRef.current?.scrollToEnd({ animated: true });
                }
              }}
            >
              {messagesNextBefore ? (
                <Pressable
                  style={[styles.messageActionButton, styles.loadOlderMessagesButton, loadingOlderMessages && styles.disabledButton]}
                  onPress={loadOlderMobileMessages}
                  disabled={loadingOlderMessages}
                  accessibilityRole="button"
                  accessibilityLabel={staticUiCopy(appLocale)["Load earlier messages"]}
                >
                  {loadingOlderMessages ? <ActivityIndicator size="small" color={palette.teal} /> : <History size={15} color={palette.teal} />}
                  <Text style={styles.messageActionText}>{staticUiMessage(appLocale, loadingOlderMessages ? "Loading..." : "Earlier messages")}</Text>
                </Pressable>
              ) : null}
              {mobileChatEmptyStateVisible({
                busy,
                messageCount: visibleMobileMessages.length,
                pendingAssistantText: Boolean(pendingAssistantText),
                switchingConversation: chatSessionsBusy,
              }) ? (
                <ChatEmptyState chatAccess={chatAccess} suggestions={chatSuggestions} copy={t} onUseSuggestion={startChatSuggestion} />
              ) : null}
              {visibleMobileMessages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  activityEvents={message.role === "assistant" ? chatEventsByRunId[message.runId] ?? [] : []}
                  runStatus={message.role === "assistant" ? chatRunStatusesById[message.runId] ?? null : null}
                  confirmationPending={Boolean(confirmationDecisionRuns[message.runId])}
                  onConfirm={(action) => void submitMobileConfirmation(
                    message.runId,
                    message.conversationSessionId ?? activeConversationSessionId,
                    action,
                  )}
                  locale={appLocale}
                  copy={t.chat}
                  onVisibleTextLayout={
                    message.role === "assistant" && message.runId === chatLatencyRef.current?.runId
                      ? recordFirstVisibleMobileToken
                      : undefined
                  }
                />
              ))}
              {pendingAssistantText || activeChatRunActivityView ? (
                <PendingAssistantMessage locale={appLocale}
                  text={chatStreamingText}
                  activityEvents={activeChatRunId ? chatEventsByRunId[activeChatRunId] ?? [] : []}
                  runStatus={activeChatRunId ? chatRunStatusesById[activeChatRunId] ?? null : null}
                  activityCopy={t.chat.activity}
                  onVisibleTextLayout={recordFirstVisibleMobileToken}
                />
              ) : null}
              {visibleFailedMessage && !pendingAssistantText ? (
                <FailedMessageNotice
                  text={visibleFailedMessage.content}
                  stage={mobileFailedMessageStage(visibleFailedMessage)}
                  copy={t.chat}
                  disabled={busy && !activeChatRunId}
                  onRetry={retryFailedSend}
                  onDismiss={dismissFailedSend}
                />
              ) : null}
            </ScrollView>
            {showScrollDown ? (
              <Pressable
                style={styles.scrollDownButton}
                onPress={jumpToLatestMobileMessage}
                accessibilityRole="button"
                accessibilityLabel={staticUiCopy(appLocale)["Scroll to latest message"]}
              >
                <ChevronDown size={20} color={palette.accentText} />
              </Pressable>
            ) : null}
            <MobileDelegatedTasksIndicator locale={appLocale}
              tasks={delegatedTasks}
              dismissedTaskIds={dismissedDelegatedTaskIds}
              stoppingTaskIds={stoppingDelegatedTaskIds}
              onOpenConversation={(conversationId, taskName) =>
                void openMobileSubthread(conversationId, taskName)}
              onCloseTask={(task) => void closeDelegatedTask(task)}
            />
            {visibleQueuedFollowUps.length > 0 ? <ScrollView style={styles.queuedFollowUpList} keyboardShouldPersistTaps="handled">
            {visibleQueuedFollowUps.map((queued, index) => (
              <QueuedFollowUpNotice locale={appLocale}
                key={queued.ownershipToken}
                queued={queued}
                position={index + 1}
                onCancel={() => void cancelQueuedFollowUp(queued.ownershipToken)}
                onDismiss={() => dismissQueuedFollowUp(queued.ownershipToken)}
              />
            ))}
            </ScrollView> : null}
            <View style={styles.chatComposerDock}>
              {copyNotice ? <Text style={styles.copyNotice}>{staticUiMessage(appLocale, copyNotice)}</Text> : null}
              {attachmentNotice ? <Text style={styles.attachmentNotice} accessibilityRole="alert">{staticUiMessage(appLocale, attachmentNotice)}</Text> : null}
              {pendingAttachments.length ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.attachmentChips}>
                  {pendingAttachments.map((attachment) => (
                    <View key={attachment.id} style={styles.attachmentChip}>
                      <FileText size={13} color={palette.teal} />
                      <Text style={styles.attachmentChipText} numberOfLines={1}>{attachment.name}</Text>
                      <Pressable
                        onPress={() => setPendingAttachments((current) => current.filter((item) => item.id !== attachment.id))}
                        accessibilityRole="button"
                        accessibilityLabel={connectionUiMessage(appLocale, "Remove {name}", { name: attachment.name })}
                        hitSlop={8}
                      >
                        <X size={13} color={palette.muted} />
                      </Pressable>
                    </View>
                  ))}
                </ScrollView>
              ) : null}
              <View style={styles.composer}>
                <Pressable
                  style={[
                    styles.composerIconButton,
                    (attachmentBusy || !chatConfigured) && styles.disabledButton,
                  ]}
                  onPress={openMobileAttachmentMenu}
                  disabled={attachmentBusy || !chatConfigured}
                  accessibilityRole="button"
                  accessibilityLabel={staticUiCopy(appLocale)["Add attachment"]}
                >
                  {attachmentBusy ? <ActivityIndicator color={palette.ink} /> : <Plus size={18} color={palette.ink} />}
                </Pressable>
                {voiceRecordingActive ? (
                  <Pressable
                    style={styles.voiceRecordingInline}
                    onPress={stopVoiceNote}
                    accessibilityRole="button"
                    accessibilityLabel={t.chat.stopVoiceNote}
                    accessibilityLiveRegion="polite"
                  >
                    <Square size={14} color={palette.coral} fill={palette.coral} />
                    <Text style={styles.voiceRecordingText}>
                      {formatVoiceDuration(voiceRecorderState.durationMillis)}
                    </Text>
                  </Pressable>
                ) : voiceTranscriptionFailed ? (
                  <View style={styles.voiceFailureInline} accessibilityLiveRegion="assertive">
                    <Text style={styles.voiceFailureText} numberOfLines={2}>
                      {voiceNoteDraft.error || t.chat.retryVoiceNote}
                    </Text>
                  </View>
                ) : (
                  <TextInput
                    value={input}
                    onChangeText={setInput}
                    placeholder={voiceControllerBusy ? t.chat.transcribing : t.chat.placeholder}
                    multiline
                    accessibilityLabel={staticUiCopy(appLocale)["Message"]}
                    editable={!composerController.view.inputDisabled}
                    style={[styles.input, styles.chatInput, composerController.view.inputDisabled && styles.inputDisabled]}
                  />
                )}
                {attachmentVoiceComposer.showVoiceButton && pendingAttachments.length && composerActions.stopAction !== "read_aloud" ? (
                  <Pressable
                    style={[
                      styles.composerIconButton,
                      voiceButtonDisabled && styles.disabledButton,
                    ]}
                    onPress={startVoiceNote}
                    disabled={voiceButtonDisabled}
                    accessibilityRole="button"
                    accessibilityLabel={t.chat.startVoiceNote}
                  >
                    {voiceControllerBusy || voiceNoteDraft.phase === "sending"
                      ? <ActivityIndicator color={palette.ink} />
                      : <Mic size={18} color={palette.ink} />}
                  </Pressable>
                ) : null}
                {voiceRecordingActive ? (
                  <Pressable
                    style={styles.sendButton}
                    onPress={sendRecordingVoiceNote}
                    accessibilityRole="button"
                    accessibilityLabel={t.chat.sendVoiceNote}
                  >
                    <ArrowUp size={19} color={palette.accentText} />
                  </Pressable>
                ) : voiceTranscriptionFailed ? (
                  <View style={styles.voiceFailureActions}>
                    {voiceNoteDraft.recordingUri ? (
                      <Pressable
                        style={styles.composerIconButton}
                        onPress={() => void retryVoiceNoteTranscription()}
                        accessibilityRole="button"
                        accessibilityLabel={t.chat.retryVoiceNote}
                      >
                        <RefreshCcw size={18} color={palette.coral} />
                      </Pressable>
                    ) : null}
                    <Pressable
                      style={styles.composerIconButton}
                      onPress={() => void discardVoiceNote()}
                      accessibilityRole="button"
                      accessibilityLabel={t.chat.discardVoiceNote}
                    >
                      <X size={18} color={palette.muted} />
                    </Pressable>
                  </View>
                ) : (
                  <>
                    {/* Stopping and starting the next message are separate wishes.
                        The stop control used to take the composer's only slot, so
                        while Hermes worked there was no way to reach the
                        microphone at all. Both stand here now. */}
                    {composerActions.stopAction ? (
                      <Pressable
                        style={[styles.sendButton, styles.stopButton]}
                        onPress={() => {
                          if (composerActions.stopAction === "delegated_task") {
                            if (activeDelegatedTask) void stopDelegatedTaskFromComposer(activeDelegatedTask);
                            return;
                          }
                          if (composerActions.stopAction === "reply") return void stopReply();
                          stopReadAloud();
                        }}
                        disabled={Boolean(activeDelegatedTask && stoppingDelegatedTaskIds.includes(activeDelegatedTask.taskId))}
                        accessibilityRole="button"
                        accessibilityLabel={composerActions.stopLabel ?? "Stop"}
                      >
                        {activeDelegatedTask && stoppingDelegatedTaskIds.includes(activeDelegatedTask.taskId)
                          ? <ActivityIndicator color={palette.accentText} />
                          : <Square size={18} color={palette.accentText} />}
                      </Pressable>
                    ) : null}
                    {input.trim() || attachmentVoiceComposer.showAttachmentSend ? (
                      <Pressable
                        style={[styles.sendButton, composerActions.sendDisabled && styles.disabledButton]}
                        onPress={send}
                        disabled={composerActions.sendDisabled}
                        accessibilityRole="button"
                        accessibilityLabel={composerActions.sendLabel}
                      >
                        {composerActions.sendButtonShowsBusy ? <ActivityIndicator color={palette.accentText} /> : <ArrowUp size={19} color={palette.accentText} />}
                      </Pressable>
                    ) : (
                      <Pressable
                        style={[
                          styles.composerIconButton,
                          voiceButtonDisabled && styles.disabledButton,
                        ]}
                        onPress={startVoiceNote}
                        disabled={voiceButtonDisabled}
                        accessibilityRole="button"
                        accessibilityLabel={t.chat.startVoiceNote}
                      >
                        {voiceControllerBusy || voiceNoteDraft.phase === "sending"
                          ? <ActivityIndicator color={palette.ink} />
                          : <Mic size={18} color={palette.ink} />}
                      </Pressable>
                    )}
                  </>
                )}
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      ) : (
        <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
          {error ? <Notice locale={appLocale} tone="error" text={error} onDismiss={dismissAppError} dismissLabel={t.systemPages.common.dismiss} /> : null}
          {visibleSessionNotice ? <Notice locale={appLocale} tone="info" text={visibleSessionNotice} onDismiss={dismissSessionNotice} dismissLabel={t.systemPages.common.dismiss} /> : null}

        {tab === "connections_customer" && (
          <View style={styles.stack}>
            {pluginCatalogError ? <Notice locale={appLocale} tone="error" text={pluginCatalogError} onDismiss={() => setPluginCatalogError(null)} dismissLabel={t.systemPages.common.dismiss} /> : null}
            {pluginCatalog?.workspaceId === snapshot.workspace.id ? (
              <PluginCatalogScreen
                locale={appLocale}
                aiAccessConnections={(([
                  ["chatgpt_account", t.systemPages.aiAccess.chatGpt, t.systemPages.aiAccess.chatGptDetail],
                  ["claude_account", t.systemPages.aiAccess.claude, t.systemPages.aiAccess.claudeDetail],
                ] as const).filter(([provider]) => heyOfferedChatRoutes.includes(provider))).map(([provider, label, description]) => ({
                  provider,
                  label,
                  description,
                  status: aiAccessTruth.providers[provider] === "connected"
                    ? t.systemPages.aiAccess.connected
                    : aiAccessTruth.providers[provider] === "unknown"
                      ? t.systemPages.aiAccess.statusUnavailable
                      : t.systemPages.aiAccess.notConnected,
                }))}
                catalog={pluginCatalog}
                busyActionKey={pluginCatalogBusyActionKey}
                copy={t.systemPages.plugins}
                focusItemId={guidedSetupPluginTarget}
                notice={pluginCatalogNotice}
                onOpenAiAccessConnection={() => selectMobileScreen("ai_access")}
                onAction={(item, action) => void handlePluginCatalogAction(item, action)}
                onAskHermes={(prefilledMessage, item) => void handlePluginCatalogAskHermes(prefilledMessage, item)}
                onFocusItemHandled={() => setGuidedSetupPluginTarget(null)}
                onOpenSource={(url) => void Linking.openURL(url)}
                renderConnectionSetup={(item) => {
                  const kind = item.id === "telegram" || item.id === "whatsapp" ? item.id : null;
                  return kind ? (
                    <SecureConnectionCredentialForm
                      locale={appLocale}
                      kind={kind}
                      busy={busy}
                      telegramBotToken={telegramBotToken}
                      whatsappAccessToken={whatsappAccessToken}
                      whatsappPhoneNumberId={whatsappPhoneNumberId}
                      telegramPairing={telegramPairingEntry}
                      onTelegramTokenChange={setTelegramBotToken}
                      onWhatsappAccessTokenChange={setWhatsappAccessToken}
                      onWhatsappPhoneNumberIdChange={setWhatsappPhoneNumberId}
                      onSave={() => void saveIntegration(kind)}
                      onAskHermes={() => void handlePluginCatalogAskHermes(
                        secureConnectionAskHermesPrefill(kind),
                        pluginCatalog?.items.find((item) => item.id === kind),
                      )}
                    />
                  ) : null;
                }}
              />
            ) : pluginCatalogBusy ? (
              <View style={styles.inlineStatus} accessibilityLiveRegion="polite">
                <ActivityIndicator color={palette.teal} />
                <Text style={styles.muted}>{t.systemPages.plugins.loading}</Text>
              </View>
            ) : pluginCatalogAttempted ? (
              <Pressable style={styles.secondaryButtonWide} onPress={() => void loadPluginCatalog().catch(() => undefined)} accessibilityRole="button">
                <RefreshCcw size={16} color={palette.ink} />
                <Text style={styles.secondaryButtonText}>{t.systemPages.dashboard.retry}</Text>
              </Pressable>
            ) : null}
          </View>
        )}

        {tab === "suggestions" && (
          <View style={styles.stack}>
            <View style={styles.panel}>
              <Text style={styles.title}>{staticUiCopy(appLocale)["Suggestions"]}</Text>
              <Text style={styles.muted}>{staticUiCopy(appLocale)["Small, optional ways to get more from your private Hermes workspace."]}</Text>
              {heySuggestionNotice ? <Notice locale={appLocale} tone="info" text={heySuggestionNotice} onDismiss={() => setHeySuggestionNotice(null)} /> : null}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.heySuggestionFilters} accessibilityLabel={staticUiCopy(appLocale)["Suggestion filters"]}>
                {HEY_SUGGESTION_FILTERS.map((filter) => (
                  <Pressable key={filter} style={[styles.chip, heySuggestionFilter === filter && styles.segmentButtonActive]} onPress={() => setHeySuggestionFilter(filter)} accessibilityRole="button" accessibilityState={{ selected: heySuggestionFilter === filter }}>
                    <Text style={[styles.chipText, heySuggestionFilter === filter && styles.segmentButtonTextActive]}>{filter.charAt(0).toUpperCase() + filter.slice(1)}</Text>
                  </Pressable>
                ))}
              </ScrollView>
              <View style={styles.heySuggestionList}>
                {filteredHeySuggestions.map((suggestion) => (
                  <View key={suggestion.id} style={styles.heySuggestionCard}>
                    <View style={styles.heySuggestionCardHeading}>
                      <Text style={styles.rowTitle}>{suggestion.label}</Text>
                      <Text style={styles.heySuggestionState}>{suggestion.state.promotion === "dismissed" ? "Dismissed" : suggestion.state.progress.charAt(0).toUpperCase() + suggestion.state.progress.slice(1)}</Text>
                    </View>
                    <Text style={styles.muted}>{suggestion.detail}</Text>
                    <View style={styles.heySuggestionActions}>
                      {suggestion.state.promotion === "dismissed" ? (
                        <Pressable style={[styles.secondaryButtonWide, heySuggestionBusyId === suggestion.id && styles.disabledButton]} onPress={() => void changeHeySuggestionPromotion(suggestion, "restored")} disabled={heySuggestionBusyId === suggestion.id} accessibilityRole="button">
                          <Text style={styles.secondaryButtonText}>{staticUiCopy(appLocale)["Restore"]}</Text>
                        </Pressable>
                      ) : (
                        <>
                          <Pressable style={[styles.primaryButtonWide, heySuggestionBusyId === suggestion.id && styles.disabledButton]} onPress={() => void openHeySuggestion(suggestion)} disabled={heySuggestionBusyId === suggestion.id} accessibilityRole="button">
                            <Text style={styles.primaryButtonText}>{suggestion.target.kind === "editable_draft" ? "Add draft" : "Open setup"}</Text>
                          </Pressable>
                          <Pressable style={[styles.secondaryButtonWide, heySuggestionBusyId === suggestion.id && styles.disabledButton]} onPress={() => void changeHeySuggestionPromotion(suggestion, "dismissed")} disabled={heySuggestionBusyId === suggestion.id} accessibilityRole="button">
                            <Text style={styles.secondaryButtonText}>{staticUiCopy(appLocale)["Dismiss"]}</Text>
                          </Pressable>
                        </>
                      )}
                    </View>
                  </View>
                ))}
                {!filteredHeySuggestions.length ? <Text style={styles.muted}>{staticUiCopy(appLocale)["No suggestions in this filter."]}</Text> : null}
              </View>
            </View>
          </View>
        )}

        {tab === "tasks" && (
          <View style={styles.stack}>
            {rankedTaskState.phase === "loading" || rankedTaskState.phase === "idle" ? (
              <View style={styles.panel}>
                <ActivityIndicator color={palette.teal} />
                <Text style={styles.muted}>{t.systemPages.tasks.loading}</Text>
              </View>
            ) : rankedTaskState.phase === "error" ? (
              <View style={styles.panel}>
                {taskNotice ? (
                  <Notice locale={appLocale}
                    tone="error"
                    text={t.systemPages.tasks.loadError}
                    onDismiss={() => setTaskNotice(null)}
                    dismissLabel={t.systemPages.common.dismiss}
                  />
                ) : (
                  <Text style={styles.muted}>{t.systemPages.tasks.loadError}</Text>
                )}
              </View>
            ) : (
              <>
                {taskNotice === "change_error" ? (
                  <Notice locale={appLocale}
                    tone="error"
                    text={t.systemPages.tasks.changeError}
                    onDismiss={() => setTaskNotice(null)}
                    dismissLabel={t.systemPages.common.dismiss}
                  />
                ) : null}
                <RankedTaskList
                  collection={rankedTaskState.collection}
                  copy={{ ...t.systemPages.tasks, ...mobileRankedTaskWords(appLocale) }}
                  formatInstant={formatRankedTaskInstant}
                  onChat={chatAboutRankedTask}
                  onComplete={(row) => void completeRankedTask(row)}
                  onDismiss={(row) => void deleteRankedTask(row)}
                />
              </>
            )}
          </View>
        )}

        {tab === "automations" && (
          <View style={styles.systemSurfaceEdgeToEdge}>
            {/* HPD-463: one list of automations. What the customer wrote and
                what shipped with the product are the same kind of thing, so
                they are read into one model and drawn by one card. */}
            <MobileAutomationsPanel
              automations={[
                ...(automationsView?.jobs ?? []).map(automationCardFromJob),
                ...(rankedTaskAutomationsView?.automations ?? []).map(automationCardFromManaged),
              ]}
              timeZone={rankedTaskAutomationsView?.workspaceTimeZone ?? null}
              loaded={automationsView && automationsView.source !== "unavailable"}
              unavailable={automationsView?.source === "unavailable"}
              error={automationsError}
              onDismissError={() => setAutomationsError(null)}
              busy={automationsBusy}
              mutationBusy={rankedTaskAutomationsBusy}
              mutationError={rankedTaskAutomationsError}
              onDismissMutationError={() => setRankedTaskAutomationsError(null)}
              runtimeReadiness={snapshot.runtimeReadiness}
              // One refresh for the whole screen. The shipped automations sit in
              // the same list, so they reload with everything else.
              onRefresh={async () => {
                await loadAutomations();
                await loadRankedTaskAutomations();
              }}
              onAsk={askAboutAutomation}
              onReset={(role: RankedTaskAutomationRole) => void mutateAutomation(
                () => api.resetRankedTaskAutomation(role, Crypto.randomUUID()),
              )}
              onReinstall={(role: RankedTaskAutomationRole) => void mutateAutomation(
                () => api.reinstallRankedTaskAutomation(role, Crypto.randomUUID()),
              )}
              onRestoreVersion={(role: RankedTaskAutomationRole, version: number) => void mutateAutomation(
                () => api.restoreRankedTaskAutomationVersion(role, version, Crypto.randomUUID()),
              )}
              onSetEnabled={(automation, enabled) => void setAutomationEnabled(automation, enabled)}
              onDelete={(automation) => void deleteCustomerAutomation(automation)}
              copy={t.systemPages.automations}
              dismissLabel={t.systemPages.common.dismiss}
              locale={appLocale}
            />
          </View>
        )}

        {tab === "ai_access" && (
          <MobileAiAccessPanel
            locale={appLocale}
            statusTruth={workspaceStatusTruth}
            modelOptions={modelOptions}
            modelBusyId={modelSelectionBusyId}
            modelError={modelSelectionError}
            truth={aiAccessTruth}
            state={aiAccessState}
            copy={t.systemPages.aiAccess}
            modelCopy={mobileAiModelCopy(appLocale)}
            chatGptConnection={chatGptConnection?.sessionId === dismissedAiAccessChatGptSessionId ? null : chatGptConnection}
            onCopyCode={() => void copyChatGptCodeInAiAccess()}
            claudeConnection={claudeConnection?.sessionId === dismissedAiAccessClaudeSessionId ? null : claudeConnection}
            claudeCode={claudeCode}
            notice={aiAccessNotice}
            automationFailureRoute={aiAccessAutomationFailure}
            automationFailureCopy={mobileRouteAutomationFailureCopy(appLocale)}
            refreshing={aiAccessRefreshing}
            refreshError={aiAccessRefreshError}
            onRefresh={() => refreshMobileAiAccessTruth({ verify: true })}
            onChoose={chooseMobileAiAccess}
            onOpenAutomations={() => selectMobileScreen("automations")}
            onChooseModel={confirmMobileIncludedModelChange}
            onAskOther={askAboutOtherAiConnection}
            onOpenChatGpt={openMobileChatGptOauth}
            onOpenClaude={openMobileClaudeOauth}
            onReconnectClaude={reconnectMobileClaudeOauth}
            onCompleteChatGpt={completeChatGptConnection}
            onDismissChatGpt={() => setDismissedAiAccessChatGptSessionId(chatGptConnection?.sessionId ?? null)}
            onClaudeCodeChange={setClaudeCode}
            onCompleteClaude={completeMobileClaudeOauth}
            onDismissClaude={() => setDismissedAiAccessClaudeSessionId(claudeConnection?.sessionId ?? null)}
          />
        )}

        {tab === "bookmarks" && (
          <View style={styles.systemSurfaceEdgeToEdge}>
            <MobileSystemSection
              title={staticUiCopy(appLocale)["Pages"]}
              footer={staticUiCopy(appLocale)["Links to private pages, apps, or tools Hermes has saved for this workspace."]}
            >
            {bookmarkNotice ? <View style={styles.systemSurfaceNotice}><Notice locale={appLocale} tone="info" text={bookmarkNotice} onDismiss={() => setBookmarkNotice(null)} /></View> : null}
            {activeBookmarks.map((bookmark) => {
              const displayTitle = bookmarkDisplayTitle(bookmark.title);
              const publicPage = isPublicPageHref(bookmark.href);
              const privatePreview = isPrivatePreviewHref(bookmark.href);
              const pageStatus = publicPage ? "Published" : privatePreview ? "Private" : "Saved";
              const accessory = publicPage ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={connectionUiMessage(appLocale, "Copy public link for {name}", { name: displayTitle })}
                  style={({ pressed }) => [styles.bookmarkAccessoryButton, pressed && styles.systemRowPressed]}
                  onPress={() => void copyPublicBookmarkLink(bookmark.href)}
                >
                  <Copy size={16} color={palette.muted} />
                </Pressable>
              ) : privatePreview ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={connectionUiMessage(appLocale, "Publish {name}", { name: displayTitle })}
                  accessibilityState={{ busy: bookmarkActionId === `publish:${bookmark.id}`, disabled: Boolean(bookmarkActionId) }}
                  style={({ pressed }) => [styles.bookmarkAccessoryButton, pressed && styles.systemRowPressed, bookmarkActionId === `publish:${bookmark.id}` && styles.disabledButton]}
                  disabled={Boolean(bookmarkActionId)}
                  onPress={() => void publishPreviewBookmark(bookmark)}
                >
                  {bookmarkActionId === `publish:${bookmark.id}` ? (
                    <ActivityIndicator size="small" color={palette.muted} />
                  ) : (
                    <ExternalLink size={16} color={palette.muted} />
                  )}
                </Pressable>
              ) : undefined;
              return (
                <MobileSwipeRemoveRow
                  key={bookmark.id}
                  accessibilityHint={t.nav.removeHint}
                  accessibilityRole="link"
                  accessory={accessory}
                  cancelLabel={t.nav.removeCancel}
                  confirmationMessage={t.nav.removeConfirmMessage.replace("{title}", displayTitle)}
                  confirmationTitle={t.nav.removeConfirmTitle}
                  detail={`${pageStatus} · ${bookmark.href}`}
                  entry={{ entryId: bookmark.id, mode: "archive" }}
                  failureMessage={t.nav.removeFailed}
                  icon={<FileText size={18} color={palette.ink} />}
                  label={displayTitle}
                  onPress={() => void openBookmark(bookmark.href)}
                  onRemoveNavigationEntry={archiveNavigationEntry}
                  pendingLabel={t.nav.removePending}
                  removeLabel={t.nav.remove}
                />
              );
            })}
            </MobileSystemSection>
          </View>
        )}

        {tab === "capabilities" && (
          <MobileCapabilitiesPanel
                    locale={appLocale}
            view={nativeCapabilities}
            error={nativeCapabilitiesError}
            onDismissError={() => setNativeCapabilitiesError(null)}
            busy={nativeCapabilitiesBusy}
            onRefresh={loadNativeCapabilities}
            onAsk={askAboutCapability}
          />
        )}

        {(tab === "account" || tab === "support") && (
          <View style={styles.stack}>
            <View style={styles.stack}>
                {visibleSettingsSection === "overview" ? (
                  <AlphaStatusPanel
                    locale={appLocale}
                    currentAccount={currentAccount}
                    statusTruth={workspaceStatusTruth}
                    mobilePushStatus={mobilePushStatus}
                    mobilePushNotice={mobilePushNotice}
                    onDismissNotice={() => setMobilePushNotice(null)}
                    mobilePushBusy={mobilePushBusy}
                    isRefreshing={isRefreshing}
                    onRefresh={refresh}
                    onEnablePush={enableMobilePushForDevice}
                    onTestPush={sendMobilePushTest}
                    onLogout={logout}
                  />
                ) : null}
                {visibleSettingsSection === "support" ? (
                  <View style={styles.systemSurfaceEdgeToEdge}>
                    <MobileSupportRequestForm locale={appLocale} client={supportRequestClient} />
                    <MobileLegalSupportLinks locale={appLocale} />
                    <SupportAccessPanel
                      locale={appLocale}
                      activeGrantCount={securityAccess.support.activeGrants.length}
                      reason={supportReason ?? staticUiCopy(appLocale)["Temporary read-only diagnostics"]}
                      minutes={supportMinutes}
                      token={supportToken}
                      createAction={createSupportPassAction}
                      onReasonChange={setSupportReason}
                      onMinutesChange={setSupportMinutes}
                      onCreate={createSupportAccess}
                    />
                  </View>
                ) : null}
                {visibleSettingsSection === "account" ? (
                  <View style={styles.systemSurfaceEdgeToEdge}>
                    {Platform.OS === "ios" ? (
                      <View style={styles.systemSurfaceNotice}>
                        <IosPaywallPanel locale={appLocale}
                          compact
                          view={paywall}
                          personalAccess={personalAccess}
                          plan={mobilePurchasePlans[0] ?? null}
                          phase={mobilePurchasePhase}
                          accountReady={mobilePurchaseAccountReady}
                          purchaseAvailable={mobilePersonalPurchaseAvailable}
                          notice={mobilePurchaseNotice}
                          onDismissNotice={() => setMobilePurchaseNotice(null)}
                          onPurchase={purchaseMobilePlan}
                          onRestore={restoreMobilePurchases}
                          onManage={manageMobileSubscription}
                        />
                      </View>
                    ) : null}
                    {Platform.OS === "ios" && (nativeAuthConfig?.providers.google || (nativeAuthConfig?.providers.apple && appleSignInAvailable)) ? (
                      <MobileSystemSection title={accountPage.linkedAccountsTitle} footer={accountPage.linkedAccountsDetail}>
                        <View style={[styles.systemSurfaceNotice, styles.nativeAuthGroup]}>
                          {nativeAuthConfig?.providers.google ? (
                            <Pressable
                              style={[styles.secondaryButtonWide, (!googleAuthRequest || !googleChallenge || googleChallenge.mode !== "link" || Boolean(nativeAuthBusy)) && styles.disabledButton]}
                              onPress={() => void signInWithGoogle("link")}
                              disabled={!googleAuthRequest || !googleChallenge || googleChallenge.mode !== "link" || Boolean(nativeAuthBusy)}
                            >
                              <Text style={styles.secondaryButtonText}>{t.systemPages.account.linkGoogle}</Text>
                            </Pressable>
                          ) : null}
                          {nativeAuthConfig?.providers.apple && appleSignInAvailable ? (
                            nativeAuthBusy ? (
                              nativeAuthBusy === "apple" ? <ActivityIndicator color={palette.teal} /> : null
                            ) : (
                              <AppleAuthentication.AppleAuthenticationButton
                                buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                                buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
                                cornerRadius={8}
                                onPress={() => void signInWithApple("link")}
                                style={styles.appleAuthButton}
                              />
                            )
                          ) : null}
                        </View>
                      </MobileSystemSection>
                    ) : null}
                    {/*
                      Der Export sass zuerst in AlphaStatusPanel. Diese Flaeche
                      verlangt settingsSection === "overview", und kein einziger
                      Menueeintrag setzt das - der Knopf war im Simulator nicht
                      erreichbar. Hier sucht ein Kunde seine Daten ohnehin.
                    */}
                    <MobileSystemSection
                      title={t.systemPages.account.yourDataTitle}
                      footer={t.systemPages.account.yourDataDetail}
                    >
                      <View style={[styles.systemSurfaceNotice, styles.accountDataActions]}>
                        {exportDownloadNotice ? (
                          <Notice locale={appLocale}
                            tone={exportDownloadNotice === t.systemPages.account.exportOpened
                              || exportDownloadNotice === t.systemPages.account.archiveQueued
                              ? "info"
                              : "error"}
                            text={exportDownloadNotice}
                            onDismiss={() => setExportDownloadNotice(null)}
                          />
                        ) : null}
                        <Pressable
                          style={[styles.secondaryButtonWide, exportDownloadState === "preparing" && styles.disabledButton]}
                          onPress={() => void downloadWorkspaceExport()}
                          disabled={exportDownloadState === "preparing"}
                          accessibilityRole="button"
                          accessibilityLabel={t.systemPages.account.exportData}
                        >
                          {exportDownloadState === "preparing"
                            ? <ActivityIndicator color={palette.teal} />
                            : <Download size={17} color={palette.teal} />}
                          <Text style={styles.secondaryButtonText}>
                            {exportDownloadState === "preparing"
                              ? t.systemPages.account.exportPreparing
                              : t.systemPages.account.exportData}
                          </Text>
                        </Pressable>
                        <Pressable
                          style={[styles.secondaryButtonWide, archiveState === "queueing" && styles.disabledButton]}
                          onPress={() => void createFullArchive()}
                          disabled={archiveState === "queueing"}
                          accessibilityRole="button"
                          accessibilityLabel={t.systemPages.account.archive}
                        >
                          {archiveState === "queueing"
                            ? <ActivityIndicator color={palette.teal} />
                            : <HardDrive size={17} color={palette.teal} />}
                          <Text style={styles.secondaryButtonText}>{t.systemPages.account.archive}</Text>
                        </Pressable>
                      </View>
                    </MobileSystemSection>
                    <MobileSystemSection>
                      <MobileSystemRow
                        icon={<Download size={17} color={palette.teal} />}
                        label={`${t.systemPages.account.recentExports} (${new Intl.NumberFormat(appLocale).format(backupJobRows.length)})`}
                        onPress={() => setExportsOpen((open) => !open)}
                        trailing={<ChevronRight size={17} color={palette.muted} />}
                      />
                      {!exportsOpen ? null : backupJobRows.length ? (
                        backupJobRows.map((job) => (
                          <MobileSystemRow
                            key={job.id}
                            accessibilityLabel={job.downloadable
                              ? `${t.systemPages.account.download} ${job.label}, ${job.detail}, ${job.status}`
                              : `${job.label}, ${job.detail}, ${job.status}`}
                            accessibilityRole={job.downloadable ? "button" : "text"}
                            detail={job.detail}
                            disabled={!job.downloadable}
                            icon={<Download size={17} color={job.downloadable ? palette.teal : palette.muted} />}
                            label={job.label}
                            onPress={job.downloadable ? () => void downloadBackupJob(job.id) : () => undefined}
                            pending={backupDownloadJobId === job.id}
                            status={job.status}
                            trailing={job.downloadable ? <ExternalLink size={16} color={palette.muted} /> : undefined}
                          />
                        ))
                      ) : (
                        <View style={styles.systemSurfaceNotice}>
                          <Text style={styles.muted}>{t.systemPages.account.noExports}</Text>
                        </View>
                      )}
                    </MobileSystemSection>
                    <MobileSystemSection
                      title={t.systemPages.account.restoreTitle}
                      footer={t.systemPages.account.restoreDetail}
                    >
                      <MobileSystemRow
                        icon={<MessageSquare size={17} color={palette.teal} />}
                        label={t.systemPages.account.restoreAsk}
                        onPress={askAboutRestore}
                      />
                    </MobileSystemSection>
                    <AccountSecurityPanel
                      accountCopy={accountPage}
                      adminPublicKey={adminPublicKeyInput}
                      adminPublicKeyLabel={adminPublicKeyLabel}
                      busy={securityBusy}
                      copy={{ ...t.systemPages.security, ...mobileSecurityStateWords(appLocale) }}
                      formatDate={formatSecurityDateValue}
                      isOwner={isOwner}
                      outcome={securityOutcome}
                      revokingGrantId={revokingSupportGrantId}
                      security={securityAccess}
                      serverIdentity={serverIdentity}
                      onAdminPublicKeyChange={setAdminPublicKeyInput}
                      onAdminPublicKeyLabelChange={setAdminPublicKeyLabel}
                      onDownloadReceipt={() => void shareSecurityAuditReceipt()}
                      onOpenAnchor={(url) => void openSecurityAnchor(url)}
                      onRevokeGrant={(grantId) => void revokeWorkspaceSupportGrant(grantId)}
                      onRunHandover={() => void runAdminHandoverCheck()}
                      onSaveAdminKey={() => void saveAdminPublicKey()}
                    />
                    {isOwner ? (
                      <>
                        <MobileSystemSection
                          title={t.systemPages.account.invite}
                          footer={t.systemPages.account.capacity
                            .replace("{active}", String(snapshot.runtime.activeAccounts))
                            .replace("{capacity}", String(snapshot.runtime.accountCapacity))}
                        >
                          <View style={styles.systemSurfaceNotice}>
                            <TextInput value={accountName} onChangeText={setAccountName} placeholder={t.systemPages.account.name} editable={inviteAccountAction?.phase !== "pending"} style={styles.input} />
                            <TextInput value={accountEmail} onChangeText={setAccountEmail} placeholder={t.systemPages.account.email} autoCapitalize="none" keyboardType="email-address" editable={inviteAccountAction?.phase !== "pending"} style={styles.input} />
                          </View>
                          <MobileSystemRow
                            icon={<UserPlus size={17} color={palette.teal} />}
                            label={t.systemPages.account.invite}
                            onPress={() => void createAccount()}
                            pending={inviteAccountAction?.phase === "pending"}
                            error={inviteAccountAction?.error}
                            disabled={!accountName.trim() || !accountEmail.trim()}
                          />
                          {adminNotice ? <View style={styles.systemSurfaceNotice}><Notice locale={appLocale} tone="info" text={adminNotice} /></View> : null}
                        </MobileSystemSection>
                        <MobileSystemSection title={t.systemPages.account.ownerTitle}>
                          {snapshot.accounts.map((account) => {
                            const resetAction = mobileAccountActionRow(accountActionState, { accountId: account.id, kind: "reset_account_access" });
                            const disableAction = mobileAccountActionRow(accountActionState, { accountId: account.id, kind: "disable_account_access" });
                            return (
                              <AccountRow
                                key={account.id}
                                account={account}
                                resetPending={resetAction?.phase === "pending"}
                                resetError={resetAction?.error}
                                disablePending={disableAction?.phase === "pending"}
                                disableError={disableAction?.error}
                                onReset={resetAccount}
                                onDisable={disableAccount}
                                copy={t.systemPages.account}
                                locale={appLocale}
                              />
                            );
                          })}
                        </MobileSystemSection>
                      </>
                    ) : currentAccount ? (
                      <MobileSystemSection title={t.systemPages.account.memberTitle}>
                        <AccountRow account={currentAccount} copy={t.systemPages.account} locale={appLocale} />
                      </MobileSystemSection>
                    ) : (
                      <View style={styles.systemSurfaceNotice}><Text style={styles.muted}>{t.systemPages.account.detailsLoading}</Text></View>
                    )}
                    {/* HPD-443: the support entrance belongs under the customer's
                        own account rows, not between the access list and them. */}
                    <MobileSystemSection>
                      <MobileSystemRow
                        icon={<KeyRound size={17} color={palette.teal} />}
                        label={t.systemPages.security.openSupport}
                        onPress={() => selectMobileScreen("support")}
                        trailing={<ChevronRight size={17} color={palette.muted} />}
                      />
                    </MobileSystemSection>
                    {snapshot ? (
                      <MobileSystemSection title={mobileDangerZoneText(appLocale)}>
                        <View style={styles.systemSurfaceNotice}>
                          <AccountDeletionSection accountId={snapshot.me.id} api={api} busy={busy} onDeleted={logout} copy={t.systemPages.account.deletion} locale={appLocale} />
                        </View>
                      </MobileSystemSection>
                    ) : null}
                  </View>
                ) : null}
                {visibleSettingsSection === "connections" && canManageWorkspaceConnections ? (
                  <View style={styles.stack}>
                    <View style={styles.panel}>
                      <Text style={styles.title}>{staticUiCopy(appLocale)["Connections"]}</Text>
                      <Text style={styles.muted}>{staticUiCopy(appLocale)["Manage the account and service connections Hermes can use with your approval."]}</Text>
                    </View>
                    {integrationNotice ? <Notice locale={appLocale} tone="info" text={integrationNotice} onDismiss={() => setIntegrationNotice(null)} /> : null}
                    {!pluginCatalogManagementTarget ||
                    pluginCatalogManagementTarget === "calendar" ||
                    pluginCatalogManagementTarget === "google_drive" ? (
                      <GoogleConnectionsPanel
                        locale={appLocale}
                        reach={connectionReach}
                        loading={connectionReachBusy}
                        error={connectionReachError}
                        dismissReachError={() => setConnectionReachError(null)}
                        busy={busy}
                        clientId={googleConnectionClientId}
                        clientSecret={googleClientSecret}
                        authorizationCode={googleAuthorizationCode}
                        redirectUri={googleRedirectUri}
                        onClientIdChange={setGoogleConnectionClientId}
                        onClientSecretChange={setGoogleClientSecret}
                        onAuthorizationCodeChange={setGoogleAuthorizationCode}
                        onRedirectUriChange={setGoogleRedirectUri}
                        onOpenConsent={openGoogleConsent}
                        onAuthorize={authorizeGoogleConnection}
                        onRefresh={loadConnectionReach}
                      />
                    ) : null}
                    {snapshot.integrations
                      .filter((integration) => !pluginCatalogManagementTarget || integration.kind === pluginCatalogManagementTarget)
                      .map((integration) => (
                      <IntegrationSetupCard
                        locale={appLocale}
                        key={integration.kind}
                        integration={integration}
                        busy={busy}
                        busyLabel={busyLabel}
                        resetting={resettingIntegration === integration.kind}
                        telegramBotToken={telegramBotToken}
                        whatsappAccessToken={whatsappAccessToken}
                        whatsappPhoneNumberId={whatsappPhoneNumberId}
                        telegramPairing={telegramPairingEntry}
                        emailSmtpUrl={emailSmtpUrl}
                        emailImapUrl={emailImapUrl}
                        emailFromAddress={emailFromAddress}
                        onTelegramTokenChange={setTelegramBotToken}
                        onWhatsappAccessTokenChange={setWhatsappAccessToken}
                        onWhatsappPhoneNumberIdChange={setWhatsappPhoneNumberId}
                        onEmailSmtpChange={setEmailSmtpUrl}
                        onEmailImapChange={setEmailImapUrl}
                        onEmailFromAddressChange={setEmailFromAddress}
                        onStart={startIntegration}
                        onSave={saveIntegration}
                        onCheck={checkIntegration}
                        onReset={resetIntegration}
                        onAskHermes={(kind) => void handlePluginCatalogAskHermes(
                          secureConnectionAskHermesPrefill(kind),
                          pluginCatalog?.items.find((item) => item.id === kind),
                        )}
                      />
                      ))}
                  </View>
                ) : null}
                {visibleSettingsSection === "privacy" ? (
                  <View style={styles.stack}>
                    <PrivacySummaryPanel locale={appLocale} />
                    <ChatSourcePanel locale={appLocale} statusTruth={workspaceStatusTruth} />
                  </View>
                ) : null}
                {visibleSettingsSection === "diagnostics" ? (
                  <DiagnosticsPanel locale={appLocale}
                    snapshot={snapshot}
                    apiBase={API_BASE}
                    apiSource={apiBaseConfig.source}
                    entries={diagnosticLog}
                    onCopy={copyDiagnostics}
                  />
                ) : null}
            </View>
          </View>
        )}
        </ScrollView>
      )}

      <PendingProductAccessModal
        busy={productAccessRefreshing}
        copy={pendingAccessCopy}
        onCheckAgain={refreshProductAccess}
        onSignOut={() => logout()}
        visible={pendingProductAccess}
      />

    </SafeAreaView>
  );
}

function PendingProductAccessModal({
  busy,
  copy,
  onCheckAgain,
  onSignOut,
  visible,
}: {
  busy: boolean;
  copy: ReturnType<typeof mobilePendingAccessCopy>;
  onCheckAgain: () => Promise<void>;
  onSignOut: () => Promise<void>;
  visible: boolean;
}) {
  return (
    <Modal
      animationType="fade"
      onRequestClose={() => undefined}
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <View style={styles.pendingAccessBackdrop}>
        <View accessibilityRole="alert" accessibilityViewIsModal style={styles.pendingAccessDialog}>
          <Text style={styles.pendingAccessTitle}>{copy.title}</Text>
          <Text style={styles.pendingAccessBody}>{copy.body}</Text>
          <Pressable
            accessibilityRole="button"
            disabled={busy}
            onPress={() => void onCheckAgain()}
            style={[styles.primaryButtonWide, busy && styles.disabledButton]}
          >
            {busy ? <ActivityIndicator color={palette.accentText} /> : null}
            <Text style={styles.primaryButtonText}>{copy.checkAgain}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => void onSignOut()}
            style={styles.secondaryButtonWide}
          >
            <LogOut size={17} color={palette.teal} />
            <Text style={styles.secondaryButtonText}>{copy.signOut}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function iosPaywallStoreState(phase: MobilePurchasePhase): IosPaywallStoreState {
  if (phase === "unavailable" || phase === "error") return "unavailable";
  if (phase === "loading") return "loading";
  return "ready";
}

function IosPaywallPanel({ locale,
  view,
  personalAccess,
  plan,
  phase,
  accountReady,
  purchaseAvailable,
  notice,
  onDismissNotice,
  compact = false,
  onPurchase,
  onRestore,
  onManage,
}: { locale: AppLocale } & {
  view: ReturnType<typeof iosPaywallView>;
  personalAccess?: ReturnType<typeof personalAccessPresentation>;
  plan: MobilePurchasePlan | null;
  phase: MobilePurchasePhase;
  accountReady: boolean;
  purchaseAvailable: boolean;
  notice: string | null;
  onDismissNotice: () => void;
  compact?: boolean;
  onPurchase: (packageId: MobileRevenueCatPackageId) => Promise<void>;
  onRestore: () => Promise<void>;
  onManage: () => Promise<void>;
}) {
  const busy = phase === "purchasing" || phase === "restoring";
  const purchaseDisabled = busy || !accountReady || !plan;

  return (
    <View style={[styles.mobilePurchaseSection, compact && styles.mobilePurchaseSectionCompact, !compact && styles.paywallPanel]}>
      {!compact ? (
        <View style={styles.paywallHero}>
          <LogoMark />
          <Text style={styles.paywallHeroTitle}>{view.heroTitle}</Text>
          <Text style={styles.paywallHeroBody}>{view.heroBody}</Text>
        </View>
      ) : null}
      <View style={styles.rowBetween}>
        <View style={styles.flexOne}>
          <Text style={styles.sectionTitle}>{view.planName}</Text>
          {!compact ? <Text style={styles.muted}>{view.monthlyAccess}</Text> : null}
        </View>
        <View style={styles.statusPill}>
          <Text style={styles.statusPillText}>{compact && personalAccess ? personalAccess.label : view.planLabel}</Text>
        </View>
      </View>
      {compact && personalAccess ? (
        <View style={styles.paywallAccessSummary}>
          <Text style={styles.paywallDisclosure}>{personalAccess.explanation}</Text>
          <Text style={styles.paywallDisclosure}>{personalAccess.timingLabel}</Text>
        </View>
      ) : !compact ? (
        <>
          <Text style={styles.paywallPrice}>{view.price}</Text>
          <Text style={styles.paywallDisclosure}>{view.trialText}</Text>
          <Text style={styles.paywallDisclosure}>{view.renewalText}</Text>
          <Text style={styles.paywallDisclosure}>{view.accountBoundaryText}</Text>
          {view.complimentaryOverlapText ? <Text style={styles.paywallDisclosure}>{view.complimentaryOverlapText}</Text> : null}
          <Text style={styles.paywallAge}>{view.ageText}</Text>
          {view.trustClaims.length > 0 ? (
            <View style={styles.paywallTrustList}>
              {view.trustClaims.map((claim) => (
                <View key={claim} style={styles.paywallTrustItem}>
                  <Check size={15} color={palette.green} />
                  <Text style={styles.paywallTrustText}>{claim}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </>
      ) : null}
      {phase === "loading" ? <ActivityIndicator color={palette.teal} /> : null}
      {purchaseAvailable ? (
        <Pressable
          style={[styles.primaryButtonWide, purchaseDisabled && styles.disabledButton]}
          disabled={purchaseDisabled}
          onPress={() => plan ? void onPurchase(plan.packageId) : undefined}
          accessibilityRole="button"
          accessibilityLabel={view.purchaseLabel}
        >
          {phase === "purchasing" ? <ActivityIndicator color={palette.accentText} /> : <ShieldCheck size={18} color={palette.accentText} />}
          <Text style={styles.primaryButtonText}>{view.purchaseLabel}</Text>
        </Pressable>
      ) : null}
      <Pressable
        style={[styles.secondaryButtonWide, (busy || !accountReady) && styles.disabledButton]}
        disabled={busy || !accountReady}
        onPress={() => void onRestore()}
        accessibilityRole="button"
        accessibilityLabel={view.restoreLabel}
      >
        {phase === "restoring" ? <ActivityIndicator color={palette.teal} /> : <RefreshCcw size={17} color={palette.teal} />}
        <Text style={styles.secondaryButtonText}>{phase === "restoring" ? view.restoringLabel : view.restoreLabel}</Text>
      </Pressable>
      <Pressable
        style={[styles.secondaryButtonWide, busy && styles.disabledButton]}
        disabled={busy}
        onPress={() => void onManage()}
        accessibilityRole="link"
        accessibilityLabel={view.manageLabel}
      >
        <ExternalLink size={17} color={palette.teal} />
        <Text style={styles.secondaryButtonText}>{view.manageLabel}</Text>
      </Pressable>
      {/* The result of Restore belongs directly under the button that produced
          it. Left at the bottom of the panel it lands below the fold, and a
          Restore that appears to do nothing is its own defect. */}
      {notice ? <Notice locale={locale} tone={phase === "error" ? "error" : "info"} text={notice} onDismiss={onDismissNotice} /> : null}
      <View style={styles.paywallLegalRow}>
        {view.legalLinks.map((link) => (
          <Pressable
            key={link.key}
            onPress={() => void openHeyLegalHref(link.url)}
            accessibilityRole="link"
            accessibilityLabel={link.label}
            // 13pt text alone is a ~17pt target; Apple asks for 44pt.
            hitSlop={{ top: 14, bottom: 14, left: 10, right: 10 }}
          >
            <Text style={styles.paywallLegalLink}>{link.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function LogoMark() {
  return <Image source={brandIcon} style={styles.brandMark as ImageStyle} accessibilityIgnoresInvertColors />;
}

function mobileScreenTitle(tab: Tab, settingsSection: SettingsSection | null, copy: ReturnType<typeof mobileText>) {
  if (tab === "chat") return copy.nav.chat;
  if (tab === "suggestions") return "Suggestions";
  if (tab === "tasks") return copy.nav.tasks;
  if (tab === "automations") return copy.nav.automations;
  if (tab === "ai_access") return copy.nav.aiAccess;
  if (tab === "bookmarks") return copy.nav.pages;
  if (tab === "capabilities") return copy.nav.capabilities;
  if (tab === "connections_customer") return copy.nav.plugins;
  if (tab === "account" && settingsSection) return settingsSectionText(settingsSection, copy).label;
  if (tab === "account") return copy.nav.account;
  if (tab === "support") return copy.nav.support;
  if (settingsSection) return settingsSectionText(settingsSection, copy).label;
  return copy.nav.settings;
}

function MobileNavigationDrawer({
  t,
  email,
  plan,
  tab,
  isOwner,
  isHomeChatActive,
  bookmarks,
  chatSessions,
  activeSessionId,
  chatSessionsOpen,
  chatSessionsBusy,
  chatSessionNotice,
  appLocale,
  onLocaleChange,
  appearancePreference,
  onAppearanceChange,
  onClose,
  onOpenHome,
  onStartNew,
  onToggleRecents,
  onOpenSession,
  onOpenBookmark,
  onRemoveBookmark,
  onNewPage,
  onOpenTasks,
  showConnectGmail,
  onConnectGmail,
  onOpenAutomations,
  onOpenAiAccess,
  onOpenConnections,
  onOpenAccount,
  onOpenSupport,
  onOpenPrivacy,
  onOpenDashboard,
  onLogout,
}: {
  t: ReturnType<typeof mobileText>;
  email: string;
  plan: string;
  tab: Tab;
  isOwner: boolean;
  isHomeChatActive: boolean;
  bookmarks: AppSnapshot["bookmarks"];
  chatSessions: ConversationSession[];
  activeSessionId: string | null;
  chatSessionsOpen: boolean;
  chatSessionsBusy: boolean;
  chatSessionNotice: string | null;
  appLocale: AppLocale;
  onLocaleChange: (locale: AppLocale) => void;
  appearancePreference: AppearancePreference;
  onAppearanceChange: (preference: AppearancePreference) => void;
  onClose: () => void;
  onOpenHome: () => void;
  onStartNew: () => void;
  onToggleRecents: () => void;
  onOpenSession: (sessionId: string) => void;
  onOpenBookmark: (href: string) => void;
  onRemoveBookmark: (entry: MobileRemovableNavigationEntry) => Promise<void>;
  onNewPage: () => void;
  onOpenTasks: () => void;
  showConnectGmail: boolean;
  onConnectGmail: () => void;
  onOpenAutomations: () => void;
  onOpenAiAccess: () => void;
  onOpenConnections: () => void;
  onOpenAccount: () => void;
  onOpenSupport: () => void;
  onOpenPrivacy: () => void;
  onOpenDashboard: () => void;
  onLogout: () => void;
}) {
  const [accountMenuOpen, setAccountMenuOpen] = useState(host.session.mode === "external");
  const rawPlanLabel = String(plan).replace(/_/g, " ");
  const planLabel = isOwner
    ? t.nav.owner
    : rawPlanLabel === "personal"
      ? t.nav.private
      : rawPlanLabel.charAt(0).toUpperCase() + rawPlanLabel.slice(1);
  // HPD-249: a Page or App is itself a destination. A grouping destination
  // called Pages & Apps adds an unnecessary screen and is empty before the
  // first Page exists, so the active entries follow Chat and Tasks directly.
  const primaryNavigation = [
    { id: "home_chat", kind: "product_surface", label: t.nav.chat },
    { id: "tasks", kind: "product_surface", label: t.nav.tasks },
  ] as const;
  const bookmarkNavigation = bookmarks.filter((bookmark) => bookmark.status === "active" && bookmark.href !== HEY_TASKS_PAGE_HREF);
  const drawerTopPadding = Platform.OS === "ios" ? Math.max(Constants.statusBarHeight ?? 0, 20) + 8 : 10;
  const drawerBottomPadding = Platform.OS === "ios" ? 18 : 10;

  return (
    <View style={styles.mobileMenuLayer} pointerEvents="box-none">
      <Pressable style={styles.mobileMenuBackdrop} onPress={onClose} accessibilityRole="button" accessibilityLabel={t.nav.closeMenu} />
      <View style={[styles.mobileDrawer, { paddingTop: drawerTopPadding, paddingBottom: drawerBottomPadding }]}>
        <View style={styles.mobileDrawerHeader}>
          <LogoMark />
          <View style={styles.flexOne}>
            <Text style={styles.brand}>{appCopy.productName}</Text>
          </View>
          <Pressable style={styles.headerIconButton} onPress={onClose} accessibilityRole="button" accessibilityLabel={t.nav.closeMenu}>
            <X size={18} color={palette.ink} />
          </Pressable>
        </View>

        <ScrollView style={styles.mobileDrawerNav} contentContainerStyle={styles.mobileDrawerNavInner}>
          {primaryNavigation.filter((item) => item.id !== "tasks" || host.policy.preinstalledRanker).map((item) => {
            const Icon = item.id === "tasks" ? ClipboardList : MessageSquare;
            const active = item.id === "home_chat" ? isHomeChatActive : tab === "tasks";
            const onPress = item.id === "home_chat" ? onOpenHome : onOpenTasks;
            return (
              <MobileSystemRow
                key={item.id}
                accessibilityState={{ selected: active }}
                icon={<Icon size={18} color={active ? palette.teal : palette.text} />}
                label={item.label}
                onPress={onPress}
              />
            );
          })}
          {showConnectGmail ? (
            <MobileSystemRow
              icon={<Mail size={18} color={palette.teal} />}
              label={t.firstConversation.guidedSetup.connectGmail}
              onPress={onConnectGmail}
            />
          ) : null}
          {bookmarkNavigation.map((bookmark) => (
            <MobilePageMenuRow
              key={bookmark.id}
              entry={{ entryId: bookmark.id, mode: "archive" }}
              icon={<FileText size={18} color={palette.text} />}
              color={palette.text}
              label={bookmark.title}
              copy={pageMenuRemovalCopy(appLocale, bookmark.title)}
              onPress={() => onOpenBookmark(bookmark.href)}
              onRemove={onRemoveBookmark}
            />
          ))}

          <MobileSystemRow icon={<Plus size={18} color={palette.text} />} label={pageStarterCopy(appLocale).label} onPress={onNewPage} />
        </ScrollView>

        {/* HPD-462: the entrance to Settings and Account stands where it stood
            before 76b76ee5 — bottom left, under the rule, below the list. */}
        <View style={styles.mobileDrawerAccount}>
          {accountMenuOpen ? (
            <View style={styles.mobileDrawerAccountMenu}>
              <View style={styles.mobileDrawerLanguagePicker}>
                <Text style={styles.mobileDrawerLanguageLabel}>{t.settings.language}</Text>
                <View style={styles.mobileDrawerLanguageButtonRow}>
                  {mobileLocaleOptions.map((option) => (
                    <Pressable
                      key={option.locale}
                      style={[styles.mobileDrawerLanguageButton, option.locale === appLocale && styles.mobileDrawerLanguageButtonActive]}
                      onPress={() => onLocaleChange(option.locale)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: option.locale === appLocale }}
                      accessibilityLabel={option.label}
                    >
                      <Text style={[styles.mobileDrawerLanguageButtonText, option.locale === appLocale && styles.mobileDrawerLanguageButtonTextActive]}>
                        {option.shortLabel}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
              <View style={styles.mobileDrawerAccountMenuDivider} />
              <View style={styles.mobileDrawerLanguagePicker}>
                <Text style={styles.mobileDrawerLanguageLabel}>{t.nav.appearance}</Text>
                <View style={styles.mobileDrawerLanguageButtonRow}>
                  {(["system", "light", "dark"] as const).map((preference) => (
                    <Pressable
                      key={preference}
                      style={[styles.mobileDrawerLanguageButton, preference === appearancePreference && styles.mobileDrawerLanguageButtonActive]}
                      onPress={() => onAppearanceChange(preference)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: preference === appearancePreference }}
                      accessibilityLabel={t.nav[preference]}
                    >
                      <Text style={[styles.mobileDrawerLanguageButtonText, preference === appearancePreference && styles.mobileDrawerLanguageButtonTextActive]}>
                        {t.nav[preference]}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
              <View style={styles.mobileDrawerAccountMenuDivider} />
              {mobileAccountMenuNavigation.filter((item) => host.session.mode === "standalone" || (item.id !== "account" && !["sign_out", "logout"].includes(item.id))).map((item) => {
                const active = item.id === "ai_access"
                  ? tab === "ai_access"
                  : item.id === "connections"
                    ? tab === "connections_customer"
                    : item.id === "automations"
                      ? tab === "automations"
                      : item.id === "account"
                        ? tab === "account"
                        : item.id === "support"
                          ? tab === "support"
                          : false;
                const Icon = item.id === "ai_access" ? Bot : item.id === "connections" ? PlugZap : item.id === "automations" ? CalendarClock : item.id === "account" ? UserPlus : item.id === "support" ? MessageSquare : item.id === "privacy" ? LockKeyhole : item.id === "dashboard" ? ExternalLink : LogOut;
                const label = item.id === "ai_access" ? t.nav.aiAccess : item.id === "connections" ? t.nav.plugins : item.id === "automations" ? t.nav.automations : item.id === "account" ? t.nav.account : item.id === "support" ? t.nav.support : item.id === "privacy" ? workspacePrivacyCopy(appLocale).title : item.id === "dashboard" ? t.nav.dashboard : t.nav.signOut;
                const onPress = item.id === "ai_access" ? onOpenAiAccess : item.id === "connections" ? onOpenConnections : item.id === "automations" ? onOpenAutomations : item.id === "account" ? onOpenAccount : item.id === "support" ? onOpenSupport : item.id === "privacy" ? onOpenPrivacy : item.id === "dashboard" ? onOpenDashboard : onLogout;
                return (
                  <Pressable
                    key={item.id}
                    style={({ pressed }) => [styles.mobileDrawerAccountMenuRow, active && styles.mobileDrawerAccountMenuRowSelected, pressed && styles.systemRowPressed]}
                    onPress={onPress}
                    accessibilityRole="button"
                    accessibilityLabel={label}
                    accessibilityState={{ selected: active }}
                  >
                    <Icon size={18} color={active ? palette.teal : palette.ink} />
                    <Text style={styles.mobileDrawerAccountMenuText}>{label}</Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}
          {host.session.mode === "standalone" ? <Pressable
            style={[styles.mobileDrawerAccountButton, accountMenuOpen && styles.mobileDrawerAccountButtonActive]}
            onPress={() => setAccountMenuOpen((current) => !current)}
            accessibilityRole="button"
            accessibilityLabel={accountMenuOpen ? t.nav.closeMenu : t.nav.openMenu}
          >
            <View style={styles.sidebarAccountAvatar}>
              <Text style={styles.sidebarAccountAvatarText}>{email.slice(0, 1).toUpperCase()}</Text>
            </View>
            <View style={styles.flexOne}>
              <Text style={styles.mobileDrawerAccountLabel} numberOfLines={1}>{email}</Text>
              <Text style={styles.statusHint} numberOfLines={1}>{planLabel}</Text>
            </View>
            {accountMenuOpen ? <ChevronDown size={18} color={palette.muted} /> : <ChevronRight size={18} color={palette.muted} />}
          </Pressable> : null}
        </View>
      </View>
    </View>
  );
}

function MobileDrawerButton({
  icon: Icon,
  label,
  active,
  expanded,
  onPress,
}: {
  icon: typeof MessageSquare;
  label: string;
  active?: boolean;
  expanded?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={[styles.mobileDrawerButton, active && styles.mobileDrawerButtonActive]} onPress={onPress} accessibilityRole="button" accessibilityLabel={label}>
      {expanded === undefined ? (
        <Icon size={18} color={active ? palette.teal : palette.text} />
      ) : expanded ? (
        <ChevronDown size={18} color={active ? palette.teal : palette.text} />
      ) : (
        <ChevronRight size={18} color={active ? palette.teal : palette.text} />
      )}
      <Text style={[styles.mobileDrawerButtonText, active && styles.mobileDrawerButtonTextActive]}>{label}</Text>
    </Pressable>
  );
}

function Notice({ locale, tone, text, onDismiss, dismissLabel }: { locale: AppLocale; tone: "error" | "info"; text: string; onDismiss?: () => void; dismissLabel?: string }) {
  return (
    <View style={[styles.noticeBox, tone === "error" ? styles.errorNotice : styles.infoNotice]}>
      {tone === "error" ? <AlertTriangle size={16} color={palette.coral} /> : <ShieldCheck size={16} color={palette.teal} />}
      <Text style={styles.noticeText}>{staticUiMessage(locale, text)}</Text>
      {onDismiss ? (
        <Pressable
          style={styles.noticeDismiss}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          onPress={onDismiss}
          accessibilityRole="button"
          accessibilityLabel={dismissLabel ?? staticUiCopy(locale)["Dismiss this notice"]}
        >
          <X size={16} color={palette.muted} />
        </Pressable>
      ) : null}
    </View>
  );
}

function MobileForegroundNotificationBanner({ locale,
  notice,
  onOpen,
  onDismiss,
}: { locale: AppLocale } & {
  notice: MobileForegroundNotificationNotice;
  onOpen: (notice: MobileForegroundNotificationNotice) => void;
  onDismiss: () => void;
}) {
  return (
    <Pressable
      style={styles.foregroundNotification}
      onPress={() => onOpen(notice)}
      accessibilityRole="button"
      accessibilityLabel={connectionUiMessage(locale, "Open notification: {name}", { name: notice.title })}
    >
      <View style={styles.foregroundNotificationIcon}>
        <MessageSquare size={17} color={palette.teal} />
      </View>
      <View style={styles.flexOne}>
        <Text style={styles.foregroundNotificationTitle} numberOfLines={1}>
          {notice.title}
        </Text>
        <Text style={styles.foregroundNotificationBody} numberOfLines={2}>
          {notice.body}
        </Text>
      </View>
      <Pressable
        style={styles.foregroundNotificationDismiss}
        onPress={onDismiss}
        accessibilityRole="button"
        accessibilityLabel={staticUiCopy(locale)["Dismiss notification"]}
      >
        <X size={16} color={palette.muted} />
      </Pressable>
    </Pressable>
  );
}

function InlineStatus({ text }: { text: string }) {
  return (
    <View style={styles.inlineStatus}>
      <ActivityIndicator color={palette.teal} />
      <Text style={styles.muted}>{text}</Text>
    </View>
  );
}

function mobileChatAccessView(
  snapshot: AppSnapshot,
  preference = snapshot.chatRoutePreference,
  statusTruth: WorkspaceStatusTruthView | null = null,
) {
  const connectedAccountReady = chatGptAccountConnectionView(snapshot).ready;
  const snapshotRoute = mobileRouteReadiness({
    preference,
    providers: snapshot.providerStatus.providers,
    chatGptAccountReady: connectedAccountReady,
  });
  const truthProviderId = preference === "included_ai"
    ? "openrouter_managed"
    : preference === "claude_account"
      ? "claude_account"
      : "chatgpt_account";
  const truthProvider = statusTruth?.aiAccess.availability === "available" &&
    statusTruth.aiAccess.selectedRoute === preference
    ? statusTruth.aiAccess.providers.find((provider) => provider.id === truthProviderId)
    : null;
  const route = truthProvider?.live
    ? { ...snapshotRoute, ready: true, provider: truthProvider }
    : snapshotRoute;
  const activeProvider = route.provider;
  const modelRouteReady = preference !== "chatgpt_account" && route.ready;
  const providerReady = route.ready;
  const providerWaitingHint =
    activeProvider && activeProvider.id !== "chatgpt_account"
      ? "Your included model route is still setting up."
      : "Model connection needs attention.";
  const runtimeAccess = runtimeBoundAccessView(snapshot.runtimeReadiness, providerReady, providerWaitingHint);
  const ready = runtimeAccess.ready;
  const providerLabel = modelRouteReady
    ? activeProvider?.id === "openrouter_managed"
      ? "Included models"
      : activeProvider && "label" in activeProvider
        ? activeProvider.label || "Models"
        : activeProvider?.id === "claude_account"
          ? "Claude"
          : "Models"
    : snapshot.aiConnection.label || "ChatGPT";

  return {
    ready,
    managedReady: modelRouteReady,
    connectedAccountReady,
    providerLabel,
    waitingHint: runtimeAccess.waitingHint,
    statusValue: runtimeAccess.statusValue,
  };
}

function ChatEmptyState({
  chatAccess,
  suggestions,
  copy,
  onUseSuggestion,
}: {
  chatAccess: ReturnType<typeof mobileChatAccessView>;
  suggestions: ChatSuggestion[];
  copy: ReturnType<typeof mobileText>;
  onUseSuggestion: (suggestion: ChatSuggestion) => void;
}) {
  const ordered = [...suggestions].sort((left, right) => Number(Boolean(left.usedAt)) - Number(Boolean(right.usedAt))).slice(0, 5);
  return (
    <View style={styles.chatEmptyState}>
      <MessageSquare size={20} color={palette.muted} />
      <Text style={styles.chatEmptyTitle}>{copy.chat.emptyTitle}</Text>
      <Text style={styles.muted}>
        {chatAccess.ready ? copy.chat.emptyReady : chatAccess.waitingHint}
      </Text>
      {chatAccess.ready && ordered.length ? (
        <View style={styles.suggestionChipWrap}>
          {ordered.map((suggestion) => (
            <Pressable
              key={suggestion.id}
              style={[styles.suggestionChip, suggestion.usedAt && styles.suggestionChipUsed]}
              onPress={() => onUseSuggestion(suggestion)}
              accessibilityLabel={suggestion.detail}
            >
              <Text style={styles.suggestionChipText}>{suggestion.label}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function MessageBubble({
  message,
  activityEvents,
  runStatus,
  confirmationPending,
  onConfirm,
  locale,
  copy,
  onVisibleTextLayout,
}: {
  message: ChatMessage;
  activityEvents: ChatRunEvent[];
  runStatus: ChatRunStatus | null;
  confirmationPending: boolean;
  onConfirm: (action: MobileConfirmationAction) => void;
  locale: AppLocale;
  copy: ReturnType<typeof mobileText>["chat"];
  onVisibleTextLayout?: () => void;
}) {
  const isUser = message.role === "user";
  const textStyle = isUser ? styles.userMessageText : styles.messageText;
  const messageTime = formatMessageTime(message.createdAt, locale);
  const assistantView = isUser ? null : mobileAssistantContentView(message.content);
  const assistantText = assistantView?.visibleText || (assistantView?.technicalActivities.length
    ? "Hermes finished without a visible reply."
    : message.content);
  const confirmation = isUser ? null : mobileNativeConfirmationView({
    runId: message.runId,
    runStatus,
    text: assistantText,
    events: activityEvents,
  });
  const visibleAssistantText = confirmation?.explanation || assistantText;
  const uploadReferences = isUser
    ? (message.artifactReferences ?? []).filter((reference) => reference.source === "upload")
    : [];

  return (
    <View
      style={[styles.message, isUser ? styles.userMessage : styles.assistantMessage]}
    >
      {uploadReferences.length ? (
        <View style={styles.userAttachmentList}>
          {uploadReferences.map((reference) => (
            <View key={`${reference.id}:${reference.version}`} style={styles.userAttachmentChip}>
              <FileText size={13} color={palette.ink} />
              <Text style={styles.userAttachmentText} numberOfLines={1}>
                {reference.label || "Attachment"}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
      {isUser
        ? <Text style={textStyle} selectable>{message.content}</Text>
        : <View onLayout={onVisibleTextLayout}><LinkedMessageText text={visibleAssistantText} /></View>}
      {!isUser && confirmation ? (
        <View style={styles.confirmationActions} accessibilityLabel={staticUiCopy(locale)["Confirmation choices"]}>
          {confirmation.actions.map((action) => (
            <Pressable
              key={action}
              style={[
                action === "Approve Once" ? styles.confirmationPrimaryButton : styles.confirmationSecondaryButton,
                confirmationPending && styles.disabledButton,
              ]}
              onPress={() => onConfirm(action)}
              disabled={confirmationPending}
              accessibilityRole="button"
              accessibilityLabel={action}
            >
              <Text style={action === "Approve Once" ? styles.confirmationPrimaryText : styles.confirmationSecondaryText}>
                {action}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
      {messageTime ? (
        <Text style={[styles.messageTime, isUser && styles.userMessageTime]} accessibilityLabel={`${copy.messageTime} ${messageTime}`}>
          {messageTime}
        </Text>
      ) : null}
    </View>
  );
}

// The transient trail mounts only for the active run. The shared store still
// keeps the native Reduced Motion subscription stable across remounts.
const reduceMotionStore = createReduceMotionStore({
  read: () => AccessibilityInfo.isReduceMotionEnabled(),
  subscribe: (onChange) => AccessibilityInfo.addEventListener("reduceMotionChanged", onChange),
});

function useReduceMotion() {
  const [reduceMotion, setReduceMotion] = useState<boolean | null>(null);
  useEffect(() => {
    let cancelled = false;
    const unsubscribe = reduceMotionStore.subscribe((enabled) => {
      if (!cancelled) setReduceMotion(enabled);
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);
  return reduceMotion;
}

function MobileRunActivityTrail({ locale,
  view,
  copy,
}: { locale: AppLocale } & {
  view: MobileRunActivityView;
  copy: ReturnType<typeof mobileText>["chat"]["activity"];
}) {
  const reduceMotion = useReduceMotion();
  const { summary } = view;
  if (!summary) return null;
  // The animated dragon already says that Hermes is busy. The line beside it
  // says what he is busy with, and it has to say it in the customer's language.
  const label = summary.labelKey ? copy[summary.labelKey] : summary.label;

  const tone = summary.tone;
  const Icon = tone === "done" ? Check : tone === "error" ? AlertTriangle : Clock3;
  const symbol = mobileActivitySymbol({ tone, reduceMotion });

  return (
    <View style={[styles.activityTrail, activityTrailToneStyle(tone)]}>
      <View style={styles.activityTrailSummary}>
        <View style={styles.activityTrailIcon}>
          {tone === "working" ? (
            <MobileWorkingDragon
              animated={symbol === "spinner"}
              accessibilityLabel={staticUiCopy(locale)["Hermes is working"]}
              size={24}
            />
          ) : (
            <Icon size={13} color={activityTrailToneColor(tone)} />
          )}
        </View>
        <MobileStatusShimmerText
          animated={tone === "working" && reduceMotion === false}
          // Dark in light mode, light in dark mode: the band always contrasts
          // with the muted text it sweeps over.
          bandColor={palette.ink}
          style={styles.activityTrailTitle}
          text={label}
        />
      </View>
    </View>
  );
}

function MobileDelegatedTasksIndicator({ locale,
  tasks,
  dismissedTaskIds,
  stoppingTaskIds,
  onOpenConversation,
  onCloseTask,
}: { locale: AppLocale } & {
  tasks: HermesDelegatedTask[];
  dismissedTaskIds: readonly string[];
  stoppingTaskIds: readonly string[];
  onOpenConversation: (conversationId: string, taskName: string) => void;
  onCloseTask: (task: HermesDelegatedTask) => void;
}) {
  const reduceMotion = useReduceMotion();
  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    if (!tasks.length) return;
    setNowMs(Date.now());
    const timer = setInterval(() => setNowMs(Date.now()), 1_000);
    return () => clearInterval(timer);
  }, [tasks.length]);
  // This compact indicator contains active work only. Closing a visible row
  // dismisses it locally and calls the running sub order off.
  const view = delegatedTasksView(
    tasks.filter((task) => !dismissedTaskIds.includes(task.taskId)),
    nowMs,
  );
  if (!view) return null;

  return (
    <View style={styles.delegatedTasksIndicator} accessibilityLabel={staticUiCopy(locale)["Delegated tasks"]}>
      <View style={styles.delegatedTasksDragon}>
        <MobileWorkingDragon
          animated={view.animated && reduceMotion === false}
          accessibilityLabel={staticUiMessage(locale, view.animated ? "Delegated work is running" : "Delegated work is waiting")}
          size={20}
          tintColor={palette.brandBlue}
        />
      </View>
      <View style={styles.delegatedTasksRows}>
        {view.rows.map((task) => (
          <View key={task.taskId} style={styles.delegatedTaskRow}>
            <Pressable
              accessibilityRole="link"
              accessibilityLabel={staticUiMessage(locale, "Open delegated task {name}").replace("{name}", () => task.name)}
              hitSlop={6}
              onPress={() => onOpenConversation(task.conversationId, task.name)}
              style={({ pressed }) => pressed && styles.delegatedTaskPressed}
            >
              <Text style={styles.delegatedTaskLink} numberOfLines={1} ellipsizeMode="tail">{task.name}</Text>
            </Pressable>
            <Text style={styles.delegatedTaskMeta}>{staticUiMessage(locale, task.statusLabel)} · {task.elapsed}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={task.terminal
                ? staticUiMessage(locale, "Close delegated task {name}").replace("{name}", () => task.name)
                : staticUiMessage(locale, "Stop and close delegated task {name}").replace("{name}", () => task.name)}
              hitSlop={10}
              disabled={stoppingTaskIds.includes(task.taskId)}
              onPress={() => onCloseTask(task)}
              style={({ pressed }) => [styles.delegatedTaskDismiss, pressed && styles.systemRowPressed]}
            >
              {stoppingTaskIds.includes(task.taskId)
                ? <ActivityIndicator color={palette.muted} size="small" />
                : <X size={14} color={palette.muted} />}
            </Pressable>
          </View>
        ))}
      </View>
    </View>
  );
}

function activityTrailToneColor(tone: "working" | "done" | "error" | "neutral") {
  if (tone === "done") return palette.teal;
  if (tone === "error") return palette.coral;
  if (tone === "working") return palette.muted;
  return palette.muted;
}

function activityTrailToneStyle(tone: "working" | "done" | "error" | "neutral") {
  if (tone === "done") return styles.activityTrailDone;
  if (tone === "error") return styles.activityTrailError;
  if (tone === "working") return styles.activityTrailWorking;
  return styles.activityTrailNeutral;
}

// The only place that turns an assistant segment's style *name* into a
// concrete StyleSheet entry. It branches on the string
// assistantSegmentStyleName returns, not on any array or position, so there
// is no bracket-indexed expression here for a positional bug to hide inside:
// the render has no lookup to get wrong and no place an index could go.
function assistantSegmentRenderStyle(kind: AssistantMessageSegmentKind) {
  return assistantSegmentStyleName(kind) === "messageTextBold" ? styles.messageTextBold : styles.messageText;
}

function MobileMarkdownInlineText({
  segments,
  variant = "paragraph",
}: {
  segments: MobileMarkdownInlineSegment[];
  variant?: "paragraph" | "table_header" | "table_cell";
}) {
  const textStyle = variant === "table_header"
    ? styles.markdownTableHeaderText
    : variant === "table_cell"
      ? styles.markdownTableCellText
      : styles.messageText;
  return (
    <Text style={textStyle} selectable accessibilityRole={variant === "table_header" ? "header" : "text"}>
      {segments.flatMap((markdownSegment, segmentIndex) => {
        if (markdownSegment.kind === "inline_code") {
          return <Text key={`${segmentIndex}-${markdownSegment.text}`} style={styles.inlineCode}>{markdownSegment.text}</Text>;
        }
        return mobileAssistantLinkSegments(markdownSegment.text).map((segment, linkIndex) => {
          const kind = markdownSegment.kind === "bold" ? "bold" : segment.kind;
          const kindStyle = variant === "paragraph"
            ? assistantSegmentRenderStyle(kind)
            : kind === "bold"
              ? styles.markdownTableBoldText
              : undefined;
          const href = segment.href ? mobileMessageUrl(segment.href) : null;
          if (!href) return <Text key={`${segmentIndex}-${linkIndex}-${segment.text}`} style={kindStyle}>{segment.text}</Text>;
          return (
            <Text
              key={`${segmentIndex}-${linkIndex}-${segment.text}`}
              style={[kindStyle, styles.messageLink]}
              accessibilityRole="link"
              onPress={() => void Linking.openURL(href)}
            >
              {segment.text}
            </Text>
          );
        });
      })}
    </Text>
  );
}

function LinkedMessageText({ text }: { text: string }) {
  return (
    <View style={styles.markdownBlocks}>
      {mobileMarkdownBlocks(text).map((block, blockIndex) => block.kind === "code" ? (
        // Code used to sit in a horizontal ScrollView so long lines could be
        // scrolled sideways. Nested in the transcript's own scroll view it took
        // a height of its own: a thirteen-line block of HTML measured 13,928
        // points on the device, the transcript grew past what the scroll view
        // would report as its content, and the newest messages became
        // unreachable behind a screen of white. Code wraps instead.
        <View key={`code-${blockIndex}`} style={styles.codeBlock}>
          {block.language ? <Text style={styles.codeLanguage}>{block.language}</Text> : null}
          <Text style={styles.codeBlockText} selectable>{block.text}</Text>
        </View>
      ) : block.kind === "table" ? (
        <View
          key={`table-${blockIndex}`}
          style={styles.markdownTableViewport}
          accessibilityLabel="Table"
        >
          <View style={styles.markdownTable}>
            {[block.header, ...block.rows].map((row, rowIndex) => (
              <View
                key={`table-${blockIndex}-row-${rowIndex}`}
                style={[styles.markdownTableRow, rowIndex > 0 && styles.markdownTableRowBorder]}
              >
                {row.map((cell, cellIndex) => (
                  <View
                    key={`table-${blockIndex}-row-${rowIndex}-cell-${cellIndex}`}
                    style={[
                      styles.markdownTableCell,
                      rowIndex === 0 && styles.markdownTableHeaderCell,
                      cellIndex > 0 && styles.markdownTableColumnBorder,
                    ]}
                  >
                    <MobileMarkdownInlineText
                      segments={cell}
                      variant={rowIndex === 0 ? "table_header" : "table_cell"}
                    />
                  </View>
                ))}
              </View>
            ))}
          </View>
        </View>
      ) : (
        <MobileMarkdownInlineText key={`paragraph-${blockIndex}`} segments={block.segments} />
      ))}
    </View>
  );
}

function PendingAssistantMessage({ locale,
  text,
  activityEvents,
  runStatus,
  activityCopy,
  onVisibleTextLayout,
}: { locale: AppLocale } & {
  text: string;
  activityEvents: ChatRunEvent[];
  runStatus: ChatRunStatus | null;
  activityCopy: ReturnType<typeof mobileText>["chat"]["activity"];
  onVisibleTextLayout?: () => void;
}) {
  const assistantView = mobileAssistantContentView(text);
  const activityView = mobileLiveRunActivityView({ assistantText: text, events: activityEvents, runStatus });
  return (
    <View style={[styles.message, styles.assistantMessage, styles.pendingMessage]}>
      {assistantView.visibleText ? (
        <View style={styles.pendingMessageHead} onLayout={onVisibleTextLayout}>
          <LinkedMessageText text={assistantView.visibleText} />
        </View>
      ) : null}
      {activityView ? (
        <MobileRunActivityTrail locale={locale} view={activityView} copy={activityCopy} />
      ) : null}
    </View>
  );
}

function FailedMessageNotice({
  text,
  stage,
  copy,
  disabled,
  onRetry,
  onDismiss,
}: {
  text: string;
  stage: MobileFailedMessageStage;
  copy: MobileChatCopy;
  disabled: boolean;
  onRetry: () => void;
  onDismiss: () => void;
}) {
  const title = stage === "no_answer" ? copy.failedNoAnswerTitle : copy.failedNotSentTitle;
  return (
    <View style={[styles.message, styles.failedMessage]}>
      <View style={styles.failedMessageHead}>
        <AlertTriangle size={15} color={palette.coral} />
        <Text style={styles.failedMessageTitle}>{title}</Text>
      </View>
      <Text style={styles.failedMessageBody} numberOfLines={3}>
        {text}
      </Text>
      <View style={styles.messageActions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={copy.failedRetryHint}
          style={[styles.messageActionButton, styles.failedRetryButton, disabled && styles.disabledButton]}
          onPress={onRetry}
          disabled={disabled}
        >
          <RefreshCcw size={14} color={palette.coral} />
          <Text style={[styles.messageActionText, styles.failedRetryText]}>{copy.failedRetry}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={copy.failedDismiss}
          style={styles.messageActionButton}
          onPress={onDismiss}
        >
          <Text style={styles.messageActionText}>{copy.failedDismiss}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function queuedFollowUpStatusText(status: MobileQueuedFollowUpStatus, locale: AppLocale) {
  switch (status) {
    case "queueing":
      return staticUiCopy(locale)["Queueing follow-up"];
    case "running":
      return staticUiCopy(locale)["Follow-up is running"];
    case "cancelling":
      return staticUiCopy(locale)["Cancelling follow-up"];
    case "cancelled":
      return staticUiCopy(locale)["Follow-up cancelled"];
    case "failed":
      return staticUiCopy(locale)["Follow-up could not run"];
    case "queued":
    default:
      return staticUiCopy(locale)["Follow-up queued"];
  }
}

function QueuedFollowUpNotice({ locale,
  queued,
  position,
  onCancel,
  onDismiss,
}: { locale: AppLocale } & {
  queued: MobileQueuedFollowUpView;
  position: number;
  onCancel: () => void;
  onDismiss: () => void;
}) {
  const actions = mobileQueuedFollowUpNoticeActionState(queued.status);
  return (
    <View style={[styles.message, styles.queuedFollowUpMessage]}>
      <View style={styles.failedMessageHead}>
        {actions.cancelDisabled ? <ActivityIndicator size="small" color={palette.teal} /> : <Clock3 size={15} color={palette.teal} />}
        <Text style={styles.queuedFollowUpTitle}>{position}. {queuedFollowUpStatusText(queued.status, locale)}</Text>
      </View>
      <Text style={styles.failedMessageBody} numberOfLines={3}>
        {queued.content}
      </Text>
      <View style={styles.messageActions}>
        {actions.showCancel ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={staticUiCopy(locale)["Cancel queued follow-up"]}
            style={[styles.messageActionButton, actions.cancelDisabled && styles.disabledButton]}
            onPress={onCancel}
            disabled={actions.cancelDisabled}
          >
            <X size={14} color={palette.teal} />
            <Text style={styles.messageActionText}>{staticUiCopy(locale)["Cancel"]}</Text>
          </Pressable>
        ) : null}
        {actions.showDismiss ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={staticUiCopy(locale)["Dismiss queued follow-up"]}
            style={styles.messageActionButton}
            onPress={onDismiss}
          >
            <Text style={styles.messageActionText}>{staticUiCopy(locale)["Dismiss"]}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function MobileAiAccessLogo({
  logoKey,
  label,
}: {
  logoKey: MobileAiAccessLogoKey;
  label: string;
}) {
  let mark: ReactNode = null;
  if (logoKey === "openai") {
    mark = <MobileAiAccessBrandMark brand="openai" size={24} />;
  } else if (logoKey === "anthropic") {
    mark = <MobileAiAccessBrandMark brand="anthropic" size={24} />;
  } else if (logoKey === "openrouter") {
    mark = (
      <Svg width={24} height={24} viewBox="0 0 24 24">
        <Rect width="24" height="24" rx="7" fill="#171717" />
        <Path d="M5 8.2h8.6l-2-2M13.6 8.2l-2 2M19 15.8h-8.6l2 2m-2-2 2-2" fill="none" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        <Circle cx="17.3" cy="8.2" r="1.7" fill="#fff" />
        <Circle cx="6.7" cy="15.8" r="1.7" fill="#fff" />
      </Svg>
    );
  } else if (logoKey === "google") {
    mark = (
      <Svg width={24} height={24} viewBox="0 0 24 24">
        <Rect width="24" height="24" rx="7" fill="#EEF3FF" />
        <Path d="M12 3.8c.75 4.45 3.25 6.95 7.7 7.7-4.45.75-6.95 3.25-7.7 7.7-.75-4.45-3.25-6.95-7.7-7.7 4.45-.75 6.95-3.25 7.7-7.7Z" fill="#7259FF" />
        <Path d="M12 3.8c.75 4.45 3.25 6.95 7.7 7.7H12V3.8Z" fill="#4285F4" />
      </Svg>
    );
  } else if (logoKey === "minimax") {
    mark = (
      <Svg width={24} height={24} viewBox="0 0 24 24">
        <Rect width="24" height="24" rx="7" fill="#6D28D9" />
        <Path d="M5 17V7l3.5 5L12 7l3.5 5L19 7v10h-2.2v-4.2l-1.3 2-3.5-5-3.5 5-1.3-2V17H5Z" fill="#fff" />
      </Svg>
    );
  } else if (logoKey === "deepseek") {
    mark = (
      <Svg width={24} height={24} viewBox="0 0 24 24">
        <Rect width="24" height="24" rx="7" fill="#4D6BFE" />
        <Path d="M4.6 14.4c3.2 0 4.6-1.1 6.1-2.6 1.6-1.6 3-2.9 6.3-2.9-1 1.1-1.5 2-1.5 3.1 0 2.2-1.9 3.8-4.6 3.8-2.4 0-3.9-.6-6.3-1.4Z" fill="#fff" />
        <Circle cx="15.4" cy="12.1" r="0.9" fill="#4D6BFE" />
      </Svg>
    );
  } else if (logoKey === "qwen") {
    mark = (
      <Svg width={24} height={24} viewBox="0 0 24 24">
        <Rect width="24" height="24" rx="7" fill="#615CED" />
        <Circle cx="12" cy="11.4" r="4.4" fill="none" stroke="#fff" strokeWidth="1.9" />
        <Path d="M14.2 14.2 17 17.4" stroke="#fff" strokeWidth="1.9" strokeLinecap="round" />
      </Svg>
    );
  } else if (logoKey === "glm") {
    mark = (
      <Svg width={24} height={24} viewBox="0 0 24 24">
        <Rect width="24" height="24" rx="7" fill="#12B2A6" />
        <Path d="M7.4 7.4h9.2L8.6 16.6h8" fill="none" stroke="#fff" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    );
  } else if (logoKey === "generic") {
    mark = (
      <Svg width={24} height={24} viewBox="0 0 24 24">
        <Rect width="24" height="24" rx="7" fill="#0F766E" />
        <Circle cx="12" cy="12" r="5" fill="none" stroke="#fff" strokeWidth="1.8" />
        <Circle cx="12" cy="12" r="1.5" fill="#fff" />
      </Svg>
    );
  }
  return (
    <View
      style={styles.aiAccessLogo}
      accessible
      accessibilityRole="image"
      accessibilityLabel={`${label} logo`}
    >
      {mark}
    </View>
  );
}

function mobileAiAccessTruthFromSources(
  statusTruth: WorkspaceStatusTruthView | null,
  chatGptConnected: boolean | null,
  claudeStatus: ClaudeConnectionStatus | null,
): MobileAiAccessTruth {
  const aiAccess = statusTruth?.aiAccess.availability === "available" ? statusTruth.aiAccess : null;
  const managed = aiAccess?.providers.find((provider) => provider.id === "openrouter_managed");
  const chatGptProvider = aiAccess?.providers.find((provider) => provider.id === "chatgpt_account");
  const claudeProvider = aiAccess?.providers.find((provider) => provider.id === "claude_account");
  const includedAvailability = statusTruth?.aiAccess.includedAvailability;
  return {
    selectedRoute: aiAccess?.selectedRoute ?? null,
    providers: {
      chatgpt_account: chatGptProvider
        ? chatGptProvider.live ? "connected" : "not_connected"
        : chatGptConnected === null ? "unknown" : chatGptConnected ? "connected" : "not_connected",
      claude_account: claudeProvider
        ? claudeProvider.live ? "connected" : "not_connected"
        : !claudeStatus
          ? "unknown"
          : claudeStatus.connected
            ? "connected"
            : claudeStatus.state === "not_connected"
              ? "not_connected"
              : "unknown",
    },
    included: includedAvailability === "available"
      ? "confirmed"
      : includedAvailability === "unavailable"
        ? "unavailable"
        : managed?.configured && managed.live
          ? "confirmed"
          : managed
            ? "unavailable"
            : "unknown",
  };
}

function mobileCuratedModelStatus(
  model: CuratedModelTruthItem,
  copy: MobileAiModelCopy,
) {
  const labels = [
    model.recommended ? copy.modelRecommended : null,
    model.default ? copy.modelDefault : null,
  ].filter((label): label is string => Boolean(label));
  const selectable = model.offered && model.selectable && model.technicalStatus === "available";
  if (!selectable) labels.push(copy.modelUnavailable);
  return labels.join(" · ") || copy.modelAvailable;
}

function MobileAiAccessPanel({
  locale, statusTruth, modelOptions, modelBusyId, modelError, truth, state, copy, modelCopy, chatGptConnection, claudeConnection, claudeCode, notice,
  automationFailureRoute, automationFailureCopy,
  refreshing, refreshError, onRefresh, onCopyCode,
  onChoose, onChooseModel, onOpenAutomations, onAskOther, onOpenChatGpt, onOpenClaude, onReconnectClaude, onCompleteChatGpt, onDismissChatGpt,
  onClaudeCodeChange, onCompleteClaude, onDismissClaude,
}: {
  locale: AppLocale;
  statusTruth: WorkspaceStatusTruthView | null;
  modelOptions: ModelOptionsView | null;
  modelBusyId: string | null;
  modelError: { modelId: string; message: string } | null;
  truth: MobileAiAccessTruth;
  state: MobileAiAccessState;
  copy: ReturnType<typeof mobileText>["systemPages"]["aiAccess"];
  modelCopy: MobileAiModelCopy;
  chatGptConnection: ChatGptConnectionStartResponse | null;
  claudeConnection: ClaudeConnectionStartResponse | null;
  claudeCode: string;
  notice: string | null;
  automationFailureRoute: ChatRoutePreference | null;
  automationFailureCopy: ReturnType<typeof mobileRouteAutomationFailureCopy>;
  refreshing: boolean;
  refreshError: string | null;
  onRefresh: () => void | Promise<void>;
  onCopyCode: () => void;
  onChoose: (preference: ChatRoutePreference) => void | Promise<void>;
  onChooseModel: (modelId: string) => void | Promise<void>;
  onOpenAutomations: () => void;
  onAskOther: () => void;
  onOpenChatGpt: () => void | Promise<void>;
  onOpenClaude: () => void | Promise<void>;
  onReconnectClaude: () => void | Promise<void>;
  onCompleteChatGpt: () => void | Promise<void>;
  onDismissChatGpt: () => void;
  onClaudeCodeChange: (value: string) => void;
  onCompleteClaude: () => void | Promise<void>;
  onDismissClaude: () => void;
}) {
  const truthAvailable = statusTruth?.aiAccess.availability === "available";
  const preference = truth.selectedRoute;
  const remainingPercent = truthAvailable ? statusTruth.aiAccess.remainingIncludedPercent : null;
  const managedModelName = truthAvailable ? statusTruth.aiAccess.managedModelName : null;
  const canonicalProviderIds = statusTruth?.aiAccess.availability === "available"
    ? statusTruth.aiAccess.providers.map((provider) => provider.id)
    : [];
  // HPD-401, HPD-386: only the routes the product offers, plus whatever this
  // workspace already stands on, so nobody sees a screen with nothing selected.
  const choices = heyChatRouteChoices(preference ?? "included_ai").map((value) => ({
    value,
    logoKey: mobileAiAccessRouteLogoKey(value, canonicalProviderIds),
  }));
  const labelFor = (value: ChatRoutePreference) => value === "chatgpt_account" ? copy.chatGpt : value === "claude_account" ? copy.claude : copy.included;
  const detailFor = (value: ChatRoutePreference) => value === "chatgpt_account" ? copy.chatGptDetail : value === "claude_account" ? copy.claudeDetail : copy.includedDetail;
  const includedStatus = truth.included === "confirmed" && managedModelName
    ? `${managedModelName} · ${remainingPercent === null ? copy.statusUnavailable : copy.allowanceRemaining.replace("{percent}", String(remainingPercent))}`
    : copy.includedModelUnavailable;
  const statusFor = (value: ChatRoutePreference) => value === "chatgpt_account"
    ? (truth.providers.chatgpt_account === "connected" ? copy.connected : truth.providers.chatgpt_account === "unknown" ? copy.statusUnavailable : copy.notConnected)
    : value === "claude_account"
      ? (truth.providers.claude_account === "connected" ? copy.connected : truth.providers.claude_account === "unknown" ? copy.statusUnavailable : copy.notConnected)
      : includedStatus;
  const actionResult = state.result;
  const resultFor = (value: ChatRoutePreference) => actionResult?.route !== value
    ? null
    : actionResult.kind === "success"
      ? copy.resultSuccess
      : actionResult.kind === "cancelled"
        ? copy.resultCancelled
        : actionResult.kind === "provider_error"
          ? copy.resultProviderError
          : actionResult.kind === "link_error"
            ? copy.resultLinkError
            : copy.resultUnknown;
  const currentStatus = !truthAvailable
    ? copy.currentUnavailable
    : preference
      ? `${labelFor(preference)} · ${statusFor(preference)}`
      : copy.none;
  return (
    <View style={styles.systemSurfaceEdgeToEdge}>
      <MobileSystemSection title={copy.title} footer={`${copy.description} ${copy.oauthUsageTruth}`}>
        <View style={styles.systemSurfaceNotice}>
        <Text style={styles.statusValue}>{copy.current}: {currentStatus}</Text>
        </View>
        <MobileSystemRow
          label={copy.checkStatus}
          status={refreshing ? copy.working : null}
          error={refreshError}
          pending={refreshing}
          disabled={refreshing}
          icon={<RefreshCcw size={16} color={palette.ink} />}
          onPress={() => void onRefresh()}
        />
        {chatGptConnection ? (
          <View style={[styles.stack, styles.systemSurfaceNotice]}>
            <View style={styles.rowBetween}>
              <Text style={styles.rowTitle}>{copy.chatGptComplete}</Text>
              <Pressable style={styles.noticeDismiss} onPress={onDismissChatGpt} accessibilityRole="button" accessibilityLabel={copy.cancel}>
                <X size={17} color={palette.muted} />
              </Pressable>
            </View>
            <Text style={styles.muted}>{copy.chatGptSteps}</Text>
            <View style={styles.noticeBox}>
              <KeyRound size={16} color={palette.teal} />
              <Text style={[styles.statusValue, styles.flexOne]}>{chatGptConnection.userCode}</Text>
              <Pressable
                style={styles.noticeDismiss}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                onPress={onCopyCode}
                accessibilityRole="button"
                accessibilityLabel={copy.copyChatGptCode}
              >
                <Copy size={16} color={palette.teal} />
              </Pressable>
            </View>
            <Pressable style={styles.secondaryButtonWide} onPress={() => void onOpenChatGpt()}><Text style={styles.secondaryButtonText}>{copy.openSignIn}</Text></Pressable>
            <Pressable style={styles.primaryButtonWide} onPress={() => void onCompleteChatGpt()}><Text style={styles.primaryButtonText}>{copy.checkStatus}</Text></Pressable>
          </View>
        ) : null}
        {claudeConnection ? (
          <View style={[styles.stack, styles.systemSurfaceNotice]}>
            <View style={styles.rowBetween}>
              <Text style={styles.rowTitle}>{copy.claudeComplete}</Text>
              <Pressable style={styles.noticeDismiss} onPress={onDismissClaude} accessibilityRole="button" accessibilityLabel={copy.cancel}>
                <X size={17} color={palette.muted} />
              </Pressable>
            </View>
            <Text style={styles.muted}>{copy.claudeCodeHint}</Text>
            <Pressable style={styles.secondaryButtonWide} onPress={() => void onOpenClaude()} accessibilityRole="button">
              <Text style={styles.secondaryButtonText}>{copy.openSignIn}</Text>
            </Pressable>
            <TextInput
              style={styles.input}
              value={claudeCode}
              onChangeText={onClaudeCodeChange}
              placeholder={copy.claudeCodePlaceholder}
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={() => {
                if (claudeCode.trim() && state.busyRoute !== "claude_account") void onCompleteClaude();
              }}
            />
            <Pressable style={[styles.primaryButtonWide, (!claudeCode.trim() || state.busyRoute === "claude_account") && styles.disabledButton]} disabled={!claudeCode.trim() || state.busyRoute === "claude_account"} onPress={() => void onCompleteClaude()}>
              <Check size={18} color={palette.accentText} /><Text style={styles.primaryButtonText}>{copy.completeConnection}</Text>
            </Pressable>
          </View>
        ) : null}
        {choices.map((choice) => {
          const row = mobileAiAccessRowState(state, truth, choice.value);
          const result = resultFor(choice.value);
          const routeAutomationFailed = automationFailureRoute === choice.value;
          const rowOutcome = routeAutomationFailed
            ? automationFailureCopy.message
            : actionResult?.route === choice.value && notice ? notice : result;
          const rowError = routeAutomationFailed
            ? rowOutcome
            : actionResult?.route === choice.value &&
            (actionResult.kind === "provider_error" || actionResult.kind === "link_error" || actionResult.kind === "unknown")
            ? rowOutcome
            : null;
          const rowStatus = row.busy ? copy.working : rowError ? null : rowOutcome ?? statusFor(choice.value);
          return (
          <MobileSystemRow
            key={choice.value}
            label={labelFor(choice.value)}
            detail={detailFor(choice.value)}
            status={rowStatus}
            error={rowError}
            pending={row.busy}
            disabled={row.busy}
            onPress={() => void onChoose(choice.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected: row.active, busy: row.busy }}
            accessibilityLabel={`${labelFor(choice.value)}. ${rowStatus}`}
            icon={<MobileAiAccessLogo logoKey={choice.logoKey} label={labelFor(choice.value)} />}
            trailing={row.active ? <Check size={16} color={palette.teal} /> : null}
          />
          );
        })}
        {automationFailureRoute ? (
          <>
            <MobileSystemRow
              label={automationFailureCopy.saveAgain}
              pending={state.busyRoute === automationFailureRoute}
              disabled={state.busyRoute !== null}
              icon={<RefreshCcw size={16} color={palette.ink} />}
              onPress={() => void onChoose(automationFailureRoute)}
            />
            <MobileSystemRow
              label={automationFailureCopy.openAutomations}
              icon={<CalendarClock size={16} color={palette.ink} />}
              onPress={onOpenAutomations}
            />
          </>
        ) : null}
        {preference === "included_ai" ? (
          <View style={styles.aiAccessIncludedModels}>
            <View style={styles.systemSurfaceNotice}>
              <Text style={styles.rowTitle}>{modelCopy.modelsTitle}</Text>
              <Text style={styles.muted}>{modelCopy.modelsDetail}</Text>
              <Text style={styles.muted}>{modelComparisonCopy(locale).explanation}</Text>
            </View>
            {(modelOptions && [...(modelOptions.legacySelectedModel ? [modelOptions.legacySelectedModel] : []), ...modelOptions.curatedModels].map((model) => {
          const selectable = model.offered && model.selectable && model.technicalStatus === "available";
          const busy = modelBusyId === model.id;
          const selected = modelOptions.selectedModelId === model.id;
          const logoKey = mobileCuratedModelLogoKey(model);
          return (
            <MobileSystemRow
              key={model.id}
              label={model.modelName}
              detail={[modelComparisonPresentation(model, locale).summary, modelComparisonPresentation(model, locale).details, model.blocker].filter(Boolean).join("\n")}
              status={modelOptions.legacySelectedModel?.id === model.id ? modelComparisonCopy(locale).legacySelected : mobileCuratedModelStatus(model, modelCopy)}
              error={modelError?.modelId === model.id ? modelError.message : null}
              pending={busy}
              disabled={!selectable || modelBusyId !== null}
              onPress={() => void onChooseModel(model.id)}
              accessibilityRole="radio"
              accessibilityState={{ selected: modelOptions.selectedModelId === model.id, busy, disabled: !selectable }}
              icon={<MobileAiAccessLogo logoKey={logoKey} label={model.modelName} />}
              trailing={selected ? <Check size={16} color={palette.teal} /> : null}
            />
          );
            })) ?? (
              <MobileSystemRow
                label={modelCopy.modelsTitle}
                status={copy.statusUnavailable}
                disabled
                onPress={() => undefined}
              />
            )}
          </View>
        ) : null}
        <MobileSystemRow
          label={copy.otherConnection}
          icon={<MessageSquare size={15} color={palette.ink} />}
          onPress={onAskOther}
          separator={false}
        />
      </MobileSystemSection>
    </View>
  );
}

function MobileAutomationsPanel({
  automations,
  timeZone,
  loaded,
  unavailable,
  error,
  busy,
  mutationBusy,
  mutationError,
  runtimeReadiness,
  copy,
  dismissLabel,
  locale,
  onDismissError,
  onDismissMutationError,
  onRefresh,
  onAsk,
  onReset,
  onReinstall,
  onRestoreVersion,
  onSetEnabled,
  onDelete,
}: {
  automations: readonly AutomationCardModel[];
  timeZone: string | null;
  loaded: boolean | null;
  unavailable: boolean;
  error: string | null;
  busy: boolean;
  mutationBusy: boolean;
  mutationError: string | null;
  runtimeReadiness: AppSnapshot["runtimeReadiness"];
  copy: ReturnType<typeof mobileText>["systemPages"]["automations"];
  dismissLabel: string;
  locale: AppLocale;
  onDismissError: () => void;
  onDismissMutationError: () => void;
  onRefresh: () => void;
  onAsk: (prompt: string) => void;
  onReset: (role: RankedTaskAutomationRole) => void;
  onReinstall: (role: RankedTaskAutomationRole) => void;
  onRestoreVersion: (role: RankedTaskAutomationRole, version: number) => void;
  onSetEnabled: (automation: AutomationCardModel, enabled: boolean) => void;
  onDelete: (automation: AutomationCardModel) => void;
}) {
  const cardCopy: AutomationCardCopy = copy;
  // The prompt names the automation the customer is looking at; the identifier
  // is whichever one its own route knows it by.
  const promptFor = (template: string, automation: AutomationCardModel) =>
    template.replace(/\{(title|id)\}/g, (_placeholder, key: string) => key === "title" ? automation.title : automation.jobId ?? automation.role ?? "");
  return (
    // Heading, the two controls, then one card per automation. The explanatory
    // footer and the empty-state paragraph said nothing the list does not.
    <MobileSystemSection title={copy.title}>
      <MobileSystemRow
        label={copy.refresh}
        pending={busy}
        error={error ? staticUiMessage(locale, error) : null}
        status={loaded ? copy.loaded.replace("{count}", new Intl.NumberFormat(locale).format(automations.length)) : null}
        icon={<RefreshCcw size={18} color={palette.text} />}
        onPress={() => void onRefresh()}
      />
      {error ? (
        <MobileSystemRow
          label={dismissLabel}
          icon={<X size={16} color={palette.muted} />}
          onPress={onDismissError}
        />
      ) : null}
      {!runtimeReadiness.canUseJobs ? (
        <View style={styles.systemSurfaceNotice}>
          <Notice locale={locale} tone="info" text={copy.loadError} />
        </View>
      ) : null}
      {unavailable ? (
        <View style={styles.systemSurfaceNotice}>
          <Notice locale={locale} tone="error" text={copy.loadError} />
        </View>
      ) : null}
      {mutationError ? (
        <View style={styles.systemSurfaceNotice}>
          <Notice locale={locale} tone="error" text={mutationError} onDismiss={onDismissMutationError} dismissLabel={dismissLabel} />
        </View>
      ) : null}
      <MobileSystemRow
        label={copy.add}
        icon={<Plus size={16} color={palette.ink} />}
        trailing={<MessageSquare size={15} color={palette.ink} />}
        accessibilityLabel={copy.add}
        onPress={() => onAsk(copy.addPrompt)}
        disabled={!runtimeReadiness.canUseJobs}
        separator={false}
      />
      <View style={styles.automationCardList}>
        {automations.map((automation) => (
          <AutomationCard
            key={automation.key}
            automation={automation}
            copy={cardCopy}
            locale={locale}
            timeZone={timeZone}
            busy={mutationBusy}
            onChat={(target) => onAsk(promptFor(copy.chatPrompt, target))}
            onEdit={(target) => onAsk(promptFor(copy.editPrompt, target))}
            onReset={(target) => { if (target.role) onReset(target.role); }}
            onReinstall={(target) => { if (target.role) onReinstall(target.role); }}
            onRestoreVersion={(target, version) => { if (target.role) onRestoreVersion(target.role, version); }}
            onSetEnabled={onSetEnabled}
            onDelete={onDelete}
          />
        ))}
      </View>
    </MobileSystemSection>
  );
}

function MobileCapabilitiesPanel({
  locale,
  view,
  error,
  busy,
  onDismissError,
  onRefresh,
  onAsk,
}: {
  locale: AppLocale;
  view: NativeCapabilitiesView | null;
  error: string | null;
  busy: boolean;
  onDismissError: () => void;
  onRefresh: () => void;
  onAsk: (item: NativeCapabilityItem) => void;
}) {
  const copy = capabilityCopy(locale);
  const items = view?.items ?? [];
  const categories: Array<{ id: NativeCapabilityItem["category"]; label: string }> = [
    { id: "ai", label: copy.categories.ai },
    { id: "messaging", label: copy.categories.messaging },
    { id: "email", label: copy.categories.email },
    { id: "workspace", label: copy.categories.workspace },
    { id: "memory", label: copy.categories.memory },
    { id: "tasks", label: copy.categories.tasks },
    { id: "custom", label: copy.categories.custom },
  ];

  return (
    <View style={styles.stack}>
      <View style={styles.panel}>
        <View style={styles.rowBetween}>
          <View style={styles.flexOne}>
            <Text style={styles.title}>{copy.title}</Text>
            <Text style={styles.muted}>{copy.panelDescription}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={capabilityStatusCopy(locale).refresh}
            style={[styles.headerIconButton, busy && styles.disabledButton]}
            onPress={() => void onRefresh()}
            disabled={busy}
          >
            {busy ? <ActivityIndicator size="small" color={palette.muted} /> : <RefreshCcw size={18} color={palette.text} />}
          </Pressable>
        </View>
        {error ? <Notice locale={locale} tone="error" text={error} onDismiss={onDismissError} /> : null}
        {view ? (
          <Text style={styles.statusHint}>
            {copy.checked(new Date(view.checkedAt).toLocaleString(locale))}
          </Text>
        ) : null}
        {!view && !busy && !error ? (
          <View style={styles.emptyState}>
            <Text style={styles.rowTitle}>{copy.emptyTitle}</Text>
            <Text style={styles.muted}>{copy.emptyBody}</Text>
          </View>
        ) : null}
      </View>

      {categories.map((category) => {
        const categoryItems = items.filter((item) => item.category === category.id);
        if (!categoryItems.length) return null;
        return (
          <View key={category.id} style={styles.panel}>
            <Text style={styles.sectionTitle}>{category.label}</Text>
            {categoryItems.map((item) => (
              <MobileCapabilityRow locale={locale} key={item.id} item={item} onAsk={onAsk} />
            ))}
          </View>
        );
      })}
    </View>
  );
}

function MobileCapabilityRow({ locale, item, onAsk }: { locale: AppLocale; item: NativeCapabilityItem; onAsk: (item: NativeCapabilityItem) => void }) {
  const Icon = mobileCapabilityIcon(item);
  const promptActions =
    item.promptActions && item.promptActions.length
      ? item.promptActions
      : [{ id: "ask", label: capabilityCopy(locale).askHermes, prompt: item.prompt }];

  return (
    <View style={[styles.capabilityRow, item.status === "active" && styles.capabilityRowActive]}>
      <View style={styles.capabilityIcon}>
        <Icon size={17} color={item.status === "active" ? palette.teal : palette.muted} />
      </View>
      <View style={styles.flexOne}>
        <View style={styles.bookmarkTitleRow}>
          <Text style={styles.rowTitle}>{item.label}</Text>
          <View style={mobileCapabilityPillStyle(item)}>
            <Text style={mobileCapabilityPillTextStyle(item)}>
              {mobileNativeCapabilityStatusLabel(item.status, item.activeUse, locale)}
            </Text>
          </View>
        </View>
        <Text style={styles.muted}>{item.detail}</Text>
        <View style={styles.rowWrap}>
          {promptActions.map((action) => (
            <Pressable
              key={action.id}
              accessibilityRole="button"
              accessibilityLabel={`${action.label}: ${item.label}`}
              style={styles.ghostSmallButton}
              onPress={() => onAsk({ ...item, prompt: action.prompt })}
            >
              <Text style={styles.secondaryButtonText}>{action.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

function mobileCapabilityIcon(item: NativeCapabilityItem) {
  if (item.category === "ai") return KeyRound;
  if (item.category === "tasks") return ClipboardList;
  if (item.category === "workspace") return FileText;
  if (item.category === "messaging" || item.category === "email") return MessageSquare;
  return PlugZap;
}

function mobileNativeCapabilityStatusLabel(status: NativeCapabilityItem["status"], activeUse: NativeCapabilityItem["activeUse"] | undefined, locale: AppLocale) {
  const copy = capabilityStatusCopy(locale);
  if (activeUse === "current") return copy.current;
  if (activeUse === "available") return copy.available;
  if (status === "needs_attention") return copy.needs_attention;
  if (status === "suggested") return copy.suggested;
  if (status === "active") return copy.active;
  if (status === "unavailable") return copy.unavailable;
  return copy.unknown;
}

function mobileCapabilityPillStyle(item: NativeCapabilityItem) {
  if (item.status === "active" || item.activeUse) return styles.connectedPill;
  if (item.status === "needs_attention" || item.status === "unavailable") return styles.attentionPill;
  return styles.statusPill;
}

function mobileCapabilityPillTextStyle(item: NativeCapabilityItem) {
  if (item.status === "active" || item.activeUse) return styles.connectedPillText;
  if (item.status === "needs_attention" || item.status === "unavailable") return styles.attentionPillText;
  return styles.statusPillText;
}

function GoogleConnectionsPanel({
  locale,
  reach,
  loading,
  error,
  dismissReachError,
  busy,
  clientId,
  clientSecret,
  authorizationCode,
  redirectUri,
  onClientIdChange,
  onClientSecretChange,
  onAuthorizationCodeChange,
  onRedirectUriChange,
  onOpenConsent,
  onAuthorize,
  onRefresh,
}: {
  locale: AppLocale;
  reach: ConnectionReachView | null;
  loading: boolean;
  error: string | null;
  dismissReachError: () => void;
  busy: boolean;
  clientId: string;
  clientSecret: string;
  authorizationCode: string;
  redirectUri: string;
  onClientIdChange: (value: string) => void;
  onClientSecretChange: (value: string) => void;
  onAuthorizationCodeChange: (value: string) => void;
  onRedirectUriChange: (value: string) => void;
  onOpenConsent: () => void;
  onAuthorize: () => void;
  onRefresh: () => void;
}) {
  const canAuthorize = Boolean(clientId.trim() && clientSecret.trim() && authorizationCode.trim() && redirectUri.trim());
  const canOpenConsent = Boolean(googleConsentUrl(clientId, redirectUri));
  const now = new Date();
  const serviceReachRows = reach ? connectionRows(reach, now) : [];

  return (
    <>
      <View style={styles.panel}>
        <View style={styles.rowBetween}>
          <View style={styles.flexOne}>
            <Text style={styles.title}>{staticUiCopy(locale)["Service reach"]}</Text>
            <Text style={styles.muted}>{staticUiCopy(locale)["A service is reached only after Hermes reads provider-backed evidence. Times below are the provider's times."]}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={staticUiCopy(locale)["Check service reach now"]}
            style={[styles.headerIconButton, (loading || busy) && styles.disabledButton]}
            onPress={() => void onRefresh()}
            disabled={loading || busy}
          >
            {loading ? <ActivityIndicator size="small" color={palette.muted} /> : <RefreshCcw size={18} color={palette.text} />}
          </Pressable>
        </View>
        {error ? (
          <View style={[styles.noticeBox, styles.errorNotice]}>
            <AlertTriangle size={18} color={palette.coral} />
            <Text style={styles.noticeText}>{staticUiMessage(locale, error)}</Text>
            <Pressable
              style={styles.noticeDismiss}
              accessibilityRole="button"
              accessibilityLabel={staticUiCopy(locale)["Dismiss service reach error"]}
              onPress={dismissReachError}
            >
              <X size={15} color={palette.text} />
            </Pressable>
          </View>
        ) : null}
        {reach ? <Text style={styles.statusHint}>{staticUiCopy(locale)["Checked"]}{" "}{new Date(reach.checkedAt).toLocaleString(locale)}{staticUiCopy(locale)[". Refresh reads the services again; nothing is stored on this device."]}</Text> : null}
        <View style={styles.secretList}>
          {serviceReachRows.map((row) => {
            return (
              <View key={row.id} style={styles.secretRow}>
                <View style={styles.flexOne}>
                  <Text style={styles.secretTitle}>{row.label}</Text>
                  <Text style={styles.muted}>{row.line}</Text>
                </View>
                <View style={row.state === "reached" ? styles.connectedPill : row.state === "not_set_up" ? styles.statusPill : styles.attentionPill}>
                  <Text style={row.state === "reached" ? styles.connectedPillText : row.state === "not_set_up" ? styles.statusPillText : styles.attentionPillText}>
                    {row.badge}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>

      <View style={styles.panel}>
        <Text style={styles.title}>{staticUiCopy(locale)["Connect Google on your own machine"]}</Text>
        <Text style={styles.muted}>{staticUiCopy(locale)["Your Google credentials pass once to your private machine. Hey Hermes does not save them on the control server or this device."]}</Text>
        <View style={styles.permissionList}>
          {GOOGLE_SETUP_STEPS.map((step, index) => (
            <View key={step.title} style={styles.permissionRow}>
              <View style={styles.statusPill}><Text style={styles.statusPillText}>{index + 1}</Text></View>
              <View style={styles.flexOne}>
                <Text style={styles.permissionTitle}>{step.title}</Text>
                <Text style={styles.muted}>{step.detail}</Text>
                <Text style={styles.statusHint}>{staticUiCopy(locale)["Check:"]}{" "}{step.check}</Text>
              </View>
            </View>
          ))}
        </View>
        <TextInput
          style={styles.input}
          value={clientId}
          onChangeText={onClientIdChange}
          placeholder={staticUiCopy(locale)["Desktop app client ID"]}
          autoCapitalize="none"
          autoCorrect={false}
          editable={!busy}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={staticUiCopy(locale)["Open Google consent"]}
          style={[styles.secondaryButtonWide, (busy || !canOpenConsent) && styles.disabledButton]}
          onPress={() => void onOpenConsent()}
          disabled={busy || !canOpenConsent}
        >
          <ExternalLink size={17} color={palette.teal} />
          <Text style={styles.secondaryButtonText}>{staticUiCopy(locale)["Open Google consent"]}</Text>
        </Pressable>
        <TextInput
          style={styles.input}
          value={clientSecret}
          onChangeText={onClientSecretChange}
          placeholder={staticUiCopy(locale)["Desktop app client secret"]}
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry
          editable={!busy}
        />
        <TextInput
          style={styles.input}
          value={redirectUri}
          onChangeText={onRedirectUriChange}
          placeholder={staticUiCopy(locale)["Redirect URI from the Desktop app flow"]}
          autoCapitalize="none"
          autoCorrect={false}
          editable={!busy}
        />
        <TextInput
          style={styles.input}
          value={authorizationCode}
          onChangeText={onAuthorizationCodeChange}
          placeholder={staticUiCopy(locale)["One-time authorization code"]}
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry
          editable={!busy}
        />
        <Pressable
          style={[styles.secondaryButtonWide, (busy || !canAuthorize) && styles.disabledButton]}
          onPress={() => void onAuthorize()}
          disabled={busy || !canAuthorize}
        >
          <ShieldCheck size={17} color={palette.teal} />
          <Text style={styles.secondaryButtonText}>{staticUiCopy(locale)["Pass to my machine and check"]}</Text>
        </Pressable>
      </View>
    </>
  );
}

function DiagnosticsPanel({ locale,
  snapshot,
  apiBase,
  apiSource,
  entries,
  onCopy,
}: { locale: AppLocale } & {
  snapshot: AppSnapshot;
  apiBase: string;
  apiSource: ApiBaseSource;
  entries: MobileLogEntry[];
  onCopy: () => void;
}) {
  return (
    <View style={styles.panel}>
      <View style={styles.rowBetween}>
        <Text style={styles.title}>{staticUiCopy(locale)["Diagnostics"]}</Text>
        <Pressable style={styles.secondaryButtonWide} onPress={() => void onCopy()}>
          <Copy size={16} color={palette.teal} />
          <Text style={styles.secondaryButtonText}>{staticUiCopy(locale)["Copy"]}</Text>
        </Pressable>
      </View>
      <View style={styles.statusGrid}>
        <StatusItem label="API" value={staticUiCopy(locale)[apiBase.includes("heyhermes.app") ? "Production" : "Custom"]} hint={apiBase} />
        <StatusItem label={staticUiCopy(locale)["Source"]} value={apiSource} hint={staticUiCopy(locale)["Expo config or environment"]} />
        <StatusItem label={staticUiCopy(locale)["Workspace"]} value={snapshot.workspace.id} hint={staticUiMessage(locale, workspaceStateText(snapshot.workspace.state))} />
        <StatusItem label={staticUiCopy(locale)["Account"]} value={snapshot.me.email} hint={staticUiCopy(locale)["Signed in on this device"]} />
      </View>
      <Text style={styles.privacyNote}>{staticUiCopy(locale)["Recent local errors stay on this device until you copy them for support."]}</Text>
      {entries.length ? (
        entries.map((entry) => (
          <View key={entry.id} style={styles.diagnosticRow}>
            <Text style={entry.level === "error" ? styles.failedMessageTitle : styles.permissionTitle}>{entry.message}</Text>
            <Text style={styles.statusHint}>{new Date(entry.createdAt).toLocaleString(locale)}</Text>
            {entry.detail ? <Text style={styles.muted}>{entry.detail}</Text> : null}
          </View>
        ))
      ) : (
        <Text style={styles.muted}>{staticUiCopy(locale)["No app errors recorded in this session."]}</Text>
      )}
    </View>
  );
}

function IntegrationSetupCard({
  locale,
  integration,
  busy,
  busyLabel,
  resetting,
  telegramBotToken,
  whatsappAccessToken,
  whatsappPhoneNumberId,
  telegramPairing,
  emailSmtpUrl,
  emailImapUrl,
  emailFromAddress,
  onTelegramTokenChange,
  onWhatsappAccessTokenChange,
  onWhatsappPhoneNumberIdChange,
  onEmailSmtpChange,
  onEmailImapChange,
  onEmailFromAddressChange,
  onStart,
  onSave,
  onCheck,
  onReset,
  onAskHermes,
}: {
  locale: AppLocale;
  integration: IntegrationStatus;
  busy: boolean;
  busyLabel: string | null;
  resetting: boolean;
  telegramBotToken: string;
  whatsappAccessToken: string;
  whatsappPhoneNumberId: string;
  telegramPairing: SecureConnectionPairing | null;
  emailSmtpUrl: string;
  emailImapUrl: string;
  emailFromAddress: string;
  onTelegramTokenChange: (value: string) => void;
  onWhatsappAccessTokenChange: (value: string) => void;
  onWhatsappPhoneNumberIdChange: (value: string) => void;
  onEmailSmtpChange: (value: string) => void;
  onEmailImapChange: (value: string) => void;
  onEmailFromAddressChange: (value: string) => void;
  onStart: (kind: IntegrationKind) => void;
  onSave: (kind: IntegrationKind) => void;
  onCheck: (kind: IntegrationKind) => void;
  onReset: (kind: IntegrationKind) => void;
  onAskHermes: (kind: SecureConnectionCredentialKind) => void;
}) {
  const canSave = integrationCanSave(integration, {
    telegramBotToken,
    whatsappAccessToken,
    whatsappPhoneNumberId,
    whatsappPairingPlaceholder: "",
    emailSmtpUrl,
    emailImapUrl,
    emailFromAddress,
  });
  const canReset = integrationCanReset(integration);
  const isReady = integration.state === "connected" || integration.state === "configured";
  const secureMessagingKind: SecureConnectionCredentialKind | null =
    integration.kind === "telegram" || integration.kind === "whatsapp" ? integration.kind : null;

  return (
    <View style={styles.panel}>
      <View style={styles.rowBetween}>
        <Text style={styles.title}>{integration.label}</Text>
        <View style={isReady ? styles.connectedPill : styles.attentionPill}>
          <Text style={isReady ? styles.connectedPillText : styles.attentionPillText}>
            {integrationStateText(integration.state, locale)}
          </Text>
        </View>
      </View>
      <Text style={styles.muted}>{staticUiMessage(locale, integration.description)}</Text>
      <Text style={styles.body}>{staticUiMessage(locale, integration.nextStep)}</Text>

      {secureMessagingKind ? (
        <SecureConnectionCredentialForm
          locale={locale}
          kind={secureMessagingKind}
          busy={busy}
          telegramBotToken={telegramBotToken}
          whatsappAccessToken={whatsappAccessToken}
          whatsappPhoneNumberId={whatsappPhoneNumberId}
          telegramPairing={telegramPairing}
          onTelegramTokenChange={onTelegramTokenChange}
          onWhatsappAccessTokenChange={onWhatsappAccessTokenChange}
          onWhatsappPhoneNumberIdChange={onWhatsappPhoneNumberIdChange}
          onSave={() => onSave(secureMessagingKind)}
          onAskHermes={() => onAskHermes(secureMessagingKind)}
        />
      ) : (
        <>
          <View style={styles.permissionList}>
            {integrationPermissionLines(integration.kind, locale).map((permission) => (
              <View key={permission.title} style={styles.permissionRow}>
                <ShieldCheck size={16} color={palette.teal} />
                <View style={styles.flexOne}>
                  <Text style={styles.permissionTitle}>{permission.title}</Text>
                  <Text style={styles.muted}>{permission.detail}</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.secretList}>
            {integration.secrets.map((secret) => (
              <View key={secret.key} style={styles.secretRow}>
                <View style={styles.flexOne}>
                  <Text style={styles.secretTitle}>{staticUiMessage(locale, secret.label)}</Text>
                  <Text style={styles.muted}>{integrationSecretText(secret, locale)}</Text>
                </View>
                <View style={secret.saved ? styles.connectedPill : secret.optional ? styles.statusPill : styles.attentionPill}>
                  <Text style={secret.saved ? styles.connectedPillText : secret.optional ? styles.statusPillText : styles.attentionPillText}>
                    {staticUiMessage(locale, secret.saved ? "Saved" : secret.optional ? "Optional" : "Needed")}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.formStack}>
            <Text style={styles.fieldLabel}>{staticUiCopy(locale)["SMTP sending URL"]}</Text>
            <TextInput
              value={emailSmtpUrl}
              onChangeText={onEmailSmtpChange}
              placeholder="smtp://user:password@mail.example.com:587"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              editable={!busy}
              style={styles.input}
            />
            <Text style={styles.fieldLabel}>{staticUiCopy(locale)["IMAP receiving URL"]}</Text>
            <TextInput
              value={emailImapUrl}
              onChangeText={onEmailImapChange}
              placeholder="imap://user:password@mail.example.com:993"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              editable={!busy}
              style={styles.input}
            />
            <Text style={styles.fieldLabel}>{staticUiCopy(locale)["From address"]}</Text>
            <TextInput
              value={emailFromAddress}
              onChangeText={onEmailFromAddressChange}
              placeholder="you@example.com"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!busy}
              style={styles.input}
            />
          </View>

          <View style={styles.integrationActions}>
            <Pressable
              style={[styles.secondaryButtonWide, styles.integrationActionButton, busy && styles.disabledButton]}
              onPress={() => onStart(integration.kind)}
              disabled={busy}
            >
              <PlugZap size={17} color={palette.teal} />
              <Text style={styles.secondaryButtonText}>{busyLabel === "Starting setup..." ? staticUiCopy(locale)["Starting..."] : staticUiCopy(locale)["Set up"]}</Text>
            </Pressable>
            <Pressable
              style={[styles.secondaryButtonWide, styles.integrationActionButton, (busy || !canSave) && styles.disabledButton]}
              onPress={() => onSave(integration.kind)}
              disabled={busy || !canSave}
            >
              <Check size={17} color={palette.teal} />
              <Text style={styles.secondaryButtonText}>{busyLabel === "Saving connection..." ? staticUiCopy(locale)["Saving..."] : staticUiCopy(locale)["Save"]}</Text>
            </Pressable>
            <Pressable
              style={[styles.secondaryButtonWide, styles.integrationActionButton, busy && styles.disabledButton]}
              onPress={() => onCheck(integration.kind)}
              disabled={busy}
            >
              <RefreshCcw size={17} color={palette.teal} />
              <Text style={styles.secondaryButtonText}>{busyLabel === "Checking connection..." ? staticUiCopy(locale)["Checking..."] : staticUiCopy(locale)["Check"]}</Text>
            </Pressable>
          </View>
        </>
      )}

      {canReset ? (
        <View style={styles.integrationReset}>
          <Text style={styles.muted}>{staticUiCopy(locale)["Disconnecting removes saved details from this workspace."]}</Text>
          <Pressable
            style={[styles.dangerButtonWide, (busy || resetting) && styles.disabledButton]}
            onPress={() => onReset(integration.kind)}
            disabled={busy || resetting}
          >
            <Trash2 size={17} color={palette.coral} />
            <Text style={styles.dangerButtonText}>{staticUiMessage(locale, resetting ? "Disconnecting..." : "Disconnect")}</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

function AlphaStatusPanel({
  locale,
  currentAccount,
  statusTruth,
  mobilePushStatus,
  mobilePushNotice,
  onDismissNotice,
  mobilePushBusy,
  isRefreshing,
  onRefresh,
  onEnablePush,
  onTestPush,
  onLogout,
}: {
  locale: AppLocale;
  currentAccount?: AlphaAccount;
  statusTruth: WorkspaceStatusTruthView | null;
  mobilePushStatus: MobilePushStatus | null;
  mobilePushNotice: string | null;
  onDismissNotice: () => void;
  mobilePushBusy: boolean;
  isRefreshing: boolean;
  onRefresh: () => Promise<void>;
  onEnablePush: () => Promise<void>;
  onTestPush: () => Promise<void>;
  onLogout: () => Promise<void>;
}) {
  const copy = statusPanelCopy(locale);
  const countText = (template: string, count: number) => template.replace("{count}", count.toLocaleString(locale));
  const truthSummary = workspaceStatusTruthSummary(statusTruth, Date.now(), mobileStatusSummaryLanguage(locale));
  const activeSupportGrants = statusTruth?.security.availability === "available"
    ? statusTruth.security.activeSupportGrantCount
    : null;
  const checkedAt = statusTruth?.server.observedAt ?? null;
  const isOwner = currentAccount?.role === "owner";
  const statusReady = Boolean(
    statusTruth &&
    statusTruth.account.availability === "available" &&
    statusTruth.plan.availability === "available" &&
    statusTruth.aiAccess.availability === "available" &&
    workspaceStatusTruthServerIsCurrent(statusTruth) &&
    statusTruth.server.ready &&
    statusTruth.security.availability === "available" &&
    statusTruth.capabilities.availability === "available",
  );
  const activePushDevices = mobilePushStatus?.subscriptions.filter((subscription) => subscription.enabled).length ?? 0;
  const pushReady = Boolean(mobilePushStatus?.enabledByPreference && activePushDevices > 0);

  return (
    <View style={styles.panel}>
      <View style={styles.rowBetween}>
        <View style={styles.flexOne}>
          <Text style={styles.title}>{copy.workspaceTitle}</Text>
          <Text style={styles.muted}>{copy.workspaceDescription}</Text>
        </View>
        <View style={statusReady ? styles.connectedPill : styles.attentionPill}>
          <Activity size={14} color={statusReady ? palette.teal : palette.amber} />
          <Text style={statusReady ? styles.connectedPillText : styles.attentionPillText}>
            {statusReady ? capabilityStatusCopy(locale).current : copy.unavailable}
          </Text>
        </View>
      </View>

      <View style={styles.statusGrid}>
        <StatusItem label={copy.account} value={truthSummary.account.value} hint={truthSummary.account.detail} />
        <StatusItem label={copy.plan} value={truthSummary.plan.value} hint={truthSummary.plan.detail} />
        <StatusItem label={copy.aiModel} value={truthSummary.aiModel.value} hint={truthSummary.aiModel.detail} />
        <StatusItem label={copy.server} value={truthSummary.server.value} hint={truthSummary.server.detail} />
        <StatusItem label={copy.security} value={truthSummary.security.value} hint={truthSummary.security.detail} />
        <StatusItem label={copy.capabilities} value={truthSummary.capabilities.value} hint={truthSummary.capabilities.detail} />
        <StatusItem
          label={copy.notifications}
          value={pushReady ? copy.on : mobilePushStatus?.enabledByPreference === false ? copy.off : copy.notConnected}
          hint={pushReady ? countText(copy.devices, activePushDevices) : copy.enableHint}
        />
        <StatusItem
          label={copy.support}
          value={
            activeSupportGrants === null
              ? copy.unavailable
              : activeSupportGrants
              ? isOwner
                ? countText(copy.temporaryAccess, activeSupportGrants)
                : countText(copy.supportCodes, activeSupportGrants)
              : copy.closed
          }
          hint={checkedAt ? copy.observation.replace("{date}", new Date(checkedAt).toLocaleString(locale)) : copy.noObservation}
        />
      </View>

      <View style={styles.pushPanel}>
        <View style={styles.flexOne}>
          <Text style={styles.rowTitle}>{copy.pushTitle}</Text>
          <Text style={styles.muted}>
            {copy.pushDescription}
          </Text>
        </View>
        {mobilePushNotice ? <Notice locale={locale} tone={mobilePushNotice.toLowerCase().includes("could not") ? "error" : "info"} text={notificationDeliveryNotice(locale, mobilePushNotice)} onDismiss={onDismissNotice} /> : null}
        <View style={styles.rowWrap}>
          <Pressable
            style={[styles.secondaryButtonWide, styles.statusActionButton, mobilePushBusy && styles.disabledButton]}
            onPress={() => void onEnablePush()}
            disabled={mobilePushBusy}
          >
            {mobilePushBusy ? <ActivityIndicator color={palette.teal} /> : <ShieldCheck size={17} color={palette.teal} />}
            <Text style={styles.secondaryButtonText}>{pushReady ? copy.reconnect : copy.enable}</Text>
          </Pressable>
          <Pressable
            style={[styles.secondaryButtonWide, styles.statusActionButton, (mobilePushBusy || !pushReady) && styles.disabledButton]}
            onPress={() => void onTestPush()}
            disabled={mobilePushBusy || !pushReady}
          >
            <Send size={17} color={palette.teal} />
            <Text style={styles.secondaryButtonText}>{copy.sendTest}</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.rowWrap}>
        <Pressable
          style={[styles.secondaryButtonWide, styles.statusActionButton, isRefreshing && styles.disabledButton]}
          onPress={() => void onRefresh()}
          disabled={isRefreshing}
        >
          {isRefreshing ? <ActivityIndicator color={palette.teal} /> : <RefreshCcw size={17} color={palette.teal} />}
          <Text style={styles.secondaryButtonText}>{isRefreshing ? copy.checking : copy.checkAgain}</Text>
        </Pressable>
        <Pressable style={[styles.secondaryButtonWide, styles.statusActionButton]} onPress={() => void onLogout()}>
          <LogOut size={17} color={palette.teal} />
          <Text style={styles.secondaryButtonText}>{copy.signOut}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function StatusItem({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <View style={styles.statusItem}>
      <Text style={styles.muted}>{label}</Text>
      <Text style={styles.statusValue}>{value}</Text>
      <Text style={styles.statusHint}>{hint}</Text>
    </View>
  );
}

function ChatGptPanel({ locale,
  snapshot,
  connection,
  onConnect,
  onCopyCode,
  onOpen,
  onComplete,
  busy,
  busyLabel,
  onDismiss,
}: { locale: AppLocale } & {
  snapshot: AppSnapshot;
  connection: ChatGptConnectionStartResponse | null;
  onConnect: () => void;
  onCopyCode: () => void;
  onOpen: () => void;
  onComplete: () => void;
  busy: boolean;
  busyLabel: string | null;
  onDismiss: () => void;
}) {
  const chatGptAccount = chatGptAccountConnectionView(snapshot);
  const connected = chatGptAccount.ready;
  const isStarting = busy && busyLabel === "Starting ChatGPT sign-in...";
  const isOpening = busy && busyLabel === "Opening ChatGPT...";
  const isChecking = busy && busyLabel === "Checking ChatGPT sign-in...";

  return (
    <View style={styles.panel}>
      <View style={styles.rowBetween}>
        <Text style={styles.title}>
          {staticUiMessage(locale, connected
            ? "Chat is ready"
            : connection
              ? "Finish ChatGPT sign-in"
              : chatGptAccount.reconnectRequired
                ? "Reconnect ChatGPT"
                : "Connect ChatGPT")}
        </Text>
        <View style={styles.chatGptPanelHeaderActions}>
          <View style={connected ? styles.connectedPill : styles.attentionPill}>
            <Text style={connected ? styles.connectedPillText : styles.attentionPillText}>
              {staticUiMessage(locale, connected ? "Ready" : connection ? "Waiting" : "Needed")}
            </Text>
          </View>
          <Pressable
            style={styles.noticeDismiss}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            onPress={onDismiss}
            accessibilityRole="button"
            accessibilityLabel={staticUiCopy(locale)["Dismiss ChatGPT connection card"]}
          >
            <X size={17} color={palette.muted} />
          </Pressable>
        </View>
      </View>
      <Text style={styles.body}>
        {staticUiMessage(locale, connected
          ? "You can chat with Hermes now."
          : connection
            ? "Use this code on ChatGPT, then come back and confirm here."
            : chatGptAccount.reconnectRequired
              ? "Reconnect ChatGPT to restore this private account route."
              : snapshot.aiConnection.description)}
      </Text>
      {!connected ? <Text style={styles.muted}>{staticUiCopy(locale)["You sign in on OpenAI's page. Hey Hermes never asks for your OpenAI password."]}</Text> : null}
      {connection ? (
        <View style={styles.noticeBox}>
          <KeyRound size={16} color={palette.teal} />
          <View style={styles.flexOne}>
            <Text style={styles.muted}>{staticUiCopy(locale)["Enter this code on ChatGPT"]}</Text>
            <Text style={styles.statusValue}>{connection.userCode}</Text>
          </View>
          <Pressable
            style={styles.noticeDismiss}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            onPress={onCopyCode}
            accessibilityRole="button"
            accessibilityLabel={staticUiCopy(locale)["Copy the ChatGPT code"]}
          >
            <Copy size={16} color={palette.teal} />
          </Pressable>
        </View>
      ) : null}
      {!connected && connection ? (
        <View style={styles.chatGptActionStack}>
          <Pressable style={[styles.secondaryButtonWide, busy && styles.disabledButton]} onPress={onOpen} disabled={busy}>
            {isOpening ? <ActivityIndicator color={palette.teal} /> : <ExternalLink size={17} color={palette.teal} />}
            <Text style={styles.secondaryButtonText}>{staticUiMessage(locale, isOpening ? "Opening..." : "Open ChatGPT")}</Text>
          </Pressable>
          <Pressable style={[styles.primaryButtonWide, busy && styles.disabledButton]} onPress={onComplete} disabled={busy}>
            {isChecking ? <ActivityIndicator color={palette.accentText} /> : <Check size={17} color={palette.accentText} />}
            <Text style={styles.primaryButtonText}>{staticUiMessage(locale, isChecking ? "Checking..." : "I signed in")}</Text>
          </Pressable>
          <Pressable style={[styles.secondaryButtonWide, busy && styles.disabledButton]} onPress={onConnect} disabled={busy}>
            {isStarting ? <ActivityIndicator color={palette.teal} /> : <KeyRound size={17} color={palette.teal} />}
            <Text style={styles.secondaryButtonText}>{staticUiMessage(locale, isStarting ? "Getting code..." : "Get a new code")}</Text>
          </Pressable>
        </View>
      ) : !connected ? (
        <Pressable style={[styles.primaryButtonWide, busy && styles.disabledButton]} onPress={onConnect} disabled={busy}>
          {isStarting ? <ActivityIndicator color={palette.accentText} /> : <KeyRound size={17} color={palette.accentText} />}
          <Text style={styles.primaryButtonText}>
            {staticUiMessage(locale, isStarting ? "Starting..." : chatGptAccount.reconnectRequired ? "Reconnect ChatGPT" : "Connect ChatGPT")}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function ChatSourcePanel({ locale, statusTruth }: { locale: AppLocale } & { statusTruth: WorkspaceStatusTruthView | null }) {
  const summary = workspaceStatusTruthSummary(statusTruth, Date.now(), mobileStatusSummaryLanguage(locale)).aiModel;
  const chatPathText = statusTruth?.aiAccess.availability === "available"
    ? `${summary.value}. ${summary.detail}`
    : staticUiMessage(locale, "The current AI route could not be confirmed.");

  return (
    <View style={styles.panel}>
      <Text style={styles.sectionTitle}>{staticUiCopy(locale)["Chat route"]}</Text>
      <View style={styles.privacyList}>
        <PrivacyLine icon="lock" text={staticUiCopy(locale)["Private to this Hermes workspace and processed by Hey Hermes."]} />
        <PrivacyLine icon="shield" text={chatPathText} />
        <PrivacyLine icon="clock" text={staticUiCopy(locale)["Connection settings live in Connections."]} />
      </View>
    </View>
  );
}

function PrivacySummaryPanel({ locale }: { locale: AppLocale }) {
  const copy = supportAccessCopy(locale);
  return (
    <View style={styles.panel}>
      <Text style={styles.title}>{copy.privacyTitle}</Text>
      <View style={styles.privacyList}>
        <PrivacyLine icon="lock" text={copy.privacyConnections} />
        <PrivacyLine icon="shield" text={copy.privacySupport} />
        <PrivacyLine icon="shield" text={copy.privacyIsolation} />
        <PrivacyLine icon="clock" text={copy.privacyProcessing} />
      </View>
      <MobileLegalSupportLinks locale={locale} compact />
    </View>
  );
}

async function openHeyLegalHref(href: string): Promise<boolean> {
  if (!isAllowedHeyLegalHref(href)) return false;
  await Linking.openURL(href);
  return true;
}

function MobileLegalSupportLinks({ locale, compact = false }: { locale: AppLocale; compact?: boolean }) {
  const copy = supportAccessCopy(locale);
  const legal = iosPaywallCopy(locale);
  return (
    <MobileSystemSection title={compact ? undefined : copy.legal}>
      <MobileSystemRow
        icon={<ShieldCheck size={17} color={palette.teal} />}
        label={legal.privacy}
        onPress={() => void openHeyLegalHref(HEY_LEGAL_LINKS.privacy)}
        accessibilityRole="link"
        accessibilityLabel={legal.privacy}
      />
      <MobileSystemRow
        icon={<FileText size={17} color={palette.teal} />}
        label={legal.terms}
        onPress={() => void openHeyLegalHref(HEY_LEGAL_LINKS.terms)}
        accessibilityRole="link"
        accessibilityLabel={legal.terms}
      />
      <MobileSystemRow
        icon={<MessageSquare size={17} color={palette.teal} />}
        label={copy.contactSupport}
        onPress={() => void openHeyLegalHref(HEY_LEGAL_LINKS.supportEmail)}
        accessibilityRole="link"
        accessibilityLabel={copy.contactSupport}
      />
    </MobileSystemSection>
  );
}

/**
 * HPD-415: the one place a customer hands out support access on the phone.
 * It stays on the Support screen because that is where somebody is standing
 * when support asks. Minutes, and the three named read-only rights — the same
 * grant the browser makes, on the same screen. What is open, and the way to
 * close it, is in the security panel under Account.
 */
function SupportAccessPanel({
  locale,
  activeGrantCount,
  reason,
  minutes,
  token,
  createAction,
  onReasonChange,
  onMinutesChange,
  onCreate,
}: {
  locale: AppLocale;
  activeGrantCount: number;
  reason: string;
  minutes: string;
  token: string | null;
  createAction: ReturnType<typeof mobileAccountActionRow>;
  onReasonChange: (value: string) => void;
  onMinutesChange: (value: string) => void;
  onCreate: () => void;
}) {
  const copy = supportAccessCopy(locale);
  const [expanded, setExpanded] = useState(false);
  const [tokenCopied, setTokenCopied] = useState(false);
  useEffect(() => setTokenCopied(false), [token]);
  const createPending = createAction?.phase === "pending";
  return (
    <MobileSystemSection
      title={copy.title}
      footer={copy.footer}
    >
      <MobileSystemRow
        accessibilityState={{ expanded }}
        detail={copy.expandDetail}
        icon={<ShieldCheck size={17} color={palette.teal} />}
        label={copy.allow}
        onPress={() => setExpanded((value) => !value)}
        status={activeGrantCount ? supportAccessOpenCount(locale, activeGrantCount) : null}
        trailing={expanded ? <ChevronDown size={17} color={palette.muted} /> : <ChevronRight size={17} color={palette.muted} />}
      />
      {expanded ? (
        <>
          <View style={styles.systemSurfaceNotice}>
            <Text style={styles.muted}>
              {copy.rights} {copy.scope}
            </Text>
            <TextInput value={reason} onChangeText={onReasonChange} placeholder={copy.reason} editable={!createPending} style={styles.input} />
            <TextInput value={minutes} onChangeText={onMinutesChange} placeholder={copy.minutes} keyboardType="number-pad" editable={!createPending} style={styles.input} />
          </View>
          <MobileSystemRow
            icon={<KeyRound size={17} color={palette.teal} />}
            label={copy.create}
            status={copy.readonly}
            onPress={onCreate}
            pending={createPending}
            error={createAction?.error}
          />
          {token ? (
            <>
              <View style={styles.systemSurfaceNotice}>
                <Text selectable style={styles.notice}>{copy.code}: {token}</Text>
                <Text style={styles.muted}>{copy.copyNotice}</Text>
              </View>
              <MobileSystemRow
                accessibilityLabel={copy.copyAction}
                icon={<Copy size={17} color={palette.teal} />}
                label={tokenCopied ? copy.copiedAction : copy.copyAction}
                onPress={() => {
                  Clipboard.setString(token);
                  setTokenCopied(true);
                }}
                status={tokenCopied ? copy.copied : null}
              />
            </>
          ) : null}
          <View style={styles.systemSurfaceNotice}>
            <Text style={styles.muted}>
              {activeGrantCount
                ? copy.manage
                : copy.noAccess}
            </Text>
          </View>
        </>
      ) : null}
    </MobileSystemSection>
  );
}

function AccountRow({
  account,
  resetPending = false,
  resetError = null,
  disablePending = false,
  disableError = null,
  onReset,
  onDisable,
  copy,
  locale,
}: {
  account: AlphaAccount;
  resetPending?: boolean;
  resetError?: string | null;
  disablePending?: boolean;
  disableError?: string | null;
  onReset?: (account: AlphaAccount) => void;
  onDisable?: (account: AlphaAccount) => void;
  copy: ReturnType<typeof mobileText>["systemPages"]["account"];
  locale: AppLocale;
}) {
  const detail = `${account.email} · ${account.role === "owner" ? copy.roleOwner : copy.roleMember} · ${account.status === "active" ? copy.statusActive : copy.statusDisabled} · ${copy.lastSignIn} ${account.lastLoginAt ? new Date(account.lastLoginAt).toLocaleString(locale) : copy.notYet}`;
  const canReset = Boolean(onReset && account.status === "active");
  const canDisable = Boolean(onDisable && account.role !== "owner" && account.status === "active");
  return (
    <>
      <MobileSystemRow
        accessibilityLabel={canReset ? copy.resetAccess.replace("{name}", account.name) : account.name}
        accessibilityRole={canReset ? "button" : "text"}
        icon={<RefreshCcw size={17} color={palette.text} />}
        label={account.name}
        detail={detail}
        onPress={canReset ? () => onReset?.(account) : () => undefined}
        disabled={!canReset || disablePending}
        pending={resetPending}
        error={resetError}
      />
      {canDisable ? (
        <MobileSystemRow
          accessibilityLabel={copy.disableAccess.replace("{name}", account.name)}
          icon={<Trash2 size={17} color={palette.text} />}
          label={copy.disableAccess.replace("{name}", account.name)}
          detail={account.email}
          onPress={() => onDisable?.(account)}
          disabled={resetPending}
          pending={disablePending}
          error={disableError}
        />
      ) : null}
    </>
  );
}

/**
 * HPD-411: the browser's Security & Access panel on the phone.
 *
 * Every label/value pair the browser prints is here, in the browser's order,
 * derived in `mobile-security-access-view.ts`. Nothing is dropped for width;
 * the phone scrolls instead. No secret value is shown — the admin key appears
 * as its fingerprint, access as a status word, evidence as a shortened hash.
 *
 * Granting support access is not repeated here. The app already mints its
 * one-time diagnostics code on the Support screen, where a customer is when
 * support asks for it, and two places that hand out access is one place too
 * many. What was granted, for how long and with which scopes is shown here,
 * together with the way to withdraw it.
 */
function AccountSecurityPanel({
  accountCopy,
  adminPublicKey,
  adminPublicKeyLabel,
  busy,
  copy,
  formatDate,
  isOwner,
  outcome,
  revokingGrantId,
  security,
  serverIdentity,
  onAdminPublicKeyChange,
  onAdminPublicKeyLabelChange,
  onDownloadReceipt,
  onOpenAnchor,
  onRevokeGrant,
  onRunHandover,
  onSaveAdminKey,
}: {
  accountCopy: ReturnType<typeof accountPageCopy>;
  adminPublicKey: string;
  adminPublicKeyLabel: string;
  busy: "admin_key" | "handover" | "receipt" | "anchor" | null;
  copy: MobileSystemPagesCopy["security"] & MobileSecurityStateWords;
  formatDate: (value: string) => string;
  isOwner: boolean;
  outcome: MobileSecurityOutcome | null;
  revokingGrantId: string | null;
  security: SecurityAccessOverview;
  serverIdentity: WorkspaceServerIdentity | null;
  onAdminPublicKeyChange: (value: string) => void;
  onAdminPublicKeyLabelChange: (value: string) => void;
  onDownloadReceipt: () => void;
  onOpenAnchor: (url: string) => void;
  onRevokeGrant: (grantId: string) => void;
  onRunHandover: () => void;
  onSaveAdminKey: () => void;
}) {
  // HPD-434, settled by Justus on 2026-08-23 after Build 58: one sentence he
  // can act on, and one list he can read. The six operator fields that used to
  // stand here — handover, customer-controlled since, admin key, SSH/root
  // login, baseline check — told him nothing and were mostly empty.
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [serverOpen, setServerOpen] = useState(false);
  const entries = mobileServerAccessEntries(security);
  const accessCopy = {
    automatic: copy.accessAutomatic,
    ended: copy.accessEnded,
    grantedByYou: copy.accessGrantedByYou,
    manual: copy.accessManual,
    neverUsed: copy.accessNeverUsed,
    used: copy.accessUsed,
  };
  return (
    <>
      <MobileSystemSection title={copy.title}>
        <View style={styles.systemSurfaceNotice}>
          <Text style={styles.body}>{accountCopy.privacyPromise}</Text>
        </View>
        <MobileSystemRow
          icon={<ShieldCheck size={17} color={palette.teal} />}
          label={accountCopy.privacyDetailsTitle}
          onPress={() => setDetailsOpen((open) => !open)}
          trailing={<ChevronRight size={17} color={palette.muted} />}
        />
        {detailsOpen ? (
          <View style={styles.systemSurfaceNotice}>
            {/* HPD-595: the expanded row carries the approved plain privacy
                sentence. Existing server identity and legal rows stay separate. */}
            <PrivacyLine icon="server" text={accountCopy.privacySentence} />
          </View>
        ) : null}
        {detailsOpen && serverIdentity ? (
          <MobileSystemRow
            accessibilityLabel={serverIdentity.hostname}
            icon={<Server size={17} color={palette.teal} />}
            label={serverIdentity.hostname}
            onPress={() => setServerOpen((open) => !open)}
            trailing={<ChevronRight size={17} color={palette.muted} />}
          />
        ) : null}
        {detailsOpen && serverOpen && serverIdentity ? (
          <>
            <MobileSystemRow
              accessibilityRole="text"
              detail={serverIdentity.workspaceId}
              disabled
              label={copy.serverWorkspace}
              onPress={() => undefined}
              reserveIconSpace={false}
            />
            {serverIdentity.publicIpv4 ? (
              <MobileSystemRow
                accessibilityRole="text"
                detail={serverIdentity.publicIpv4}
                disabled
                label={copy.serverIpv4}
                onPress={() => undefined}
                reserveIconSpace={false}
              />
            ) : null}
            {serverIdentity.serverType ? (
              <MobileSystemRow
                accessibilityRole="text"
                detail={[serverIdentity.serverType, serverIdentity.location].filter(Boolean).join(" · ")}
                disabled
                label={copy.serverType}
                onPress={() => undefined}
                reserveIconSpace={false}
              />
            ) : null}
            {serverIdentity.inServiceSince ? (
              <MobileSystemRow
                accessibilityRole="text"
                detail={formatDate(serverIdentity.inServiceSince)}
                disabled
                label={copy.serverSince}
                onPress={() => undefined}
                reserveIconSpace={false}
              />
            ) : null}
          </>
        ) : null}
        {detailsOpen ? (
          <MobileSystemRow
            accessibilityLabel={copy.privacyLink}
            accessibilityRole="link"
            icon={<ShieldCheck size={17} color={palette.teal} />}
            label={copy.privacyLink}
            onPress={() => void openHeyLegalHref(HEY_LEGAL_LINKS.privacy)}
            trailing={<ExternalLink size={16} color={palette.muted} />}
          />
        ) : null}
      </MobileSystemSection>

      <MobileSystemSection title={accountCopy.accessHistoryTitle}>
        {entries.length ? (
          entries.map((entry) => (
            <MobileSystemRow
              key={entry.id}
              accessibilityLabel={entry.revocable ? `${copy.revokeGrant}: ${entry.subject}` : entry.subject}
              accessibilityRole={entry.revocable ? "button" : "text"}
              detail={mobileServerAccessDetail(entry, accessCopy, formatDate)}
              disabled={!entry.revocable}
              icon={<Clock3 size={17} color={entry.revocable ? palette.amber : palette.muted} />}
              label={entry.subject}
              onPress={entry.revocable ? () => onRevokeGrant(entry.id) : () => undefined}
              pending={revokingGrantId === entry.id}
              {...mobileSecurityRowOutcome(outcome, "revoke", entry.id)}
            />
          ))
        ) : (
          <View style={styles.systemSurfaceNotice}>
            <Text style={styles.muted}>{copy.accessNone}</Text>
          </View>
        )}
      </MobileSystemSection>
    </>
  );
}

function PrivacyLine({ icon, text }: { icon: "clock" | "lock" | "server" | "shield"; text: string }) {
  const Icon = icon === "lock" ? LockKeyhole : icon === "server" ? Server : icon === "shield" ? ShieldCheck : Clock3;
  return (
    <View style={styles.privacyLine}>
      <View style={styles.privacyLineIcon}>
        <Icon size={16} color={palette.text} />
      </View>
      <Text style={styles.privacyLineText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pendingAccessBackdrop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "rgba(7, 24, 32, 0.58)",
  },
  pendingAccessDialog: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 16,
    padding: 22,
    gap: 14,
    backgroundColor: palette.surface,
  },
  pendingAccessTitle: {
    color: palette.ink,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "600",
  },
  pendingAccessBody: {
    color: palette.text,
    fontSize: 16,
    lineHeight: 23,
  },
  safe: {
    flex: 1,
    backgroundColor: palette.pageBg,
  },
  loginScreen: {
    padding: 16,
    gap: 12,
  },
  authKeyboard: {
    flex: 1,
  },
  authScreen: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 28,
  },
  authCard: {
    alignSelf: "center",
    gap: 14,
    maxWidth: 420,
    width: "100%",
  },
  authHero: {
    alignItems: "center",
    gap: 7,
    marginBottom: 6,
  },
  authTitle: {
    color: palette.ink,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "600",
    letterSpacing: -0.5,
  },
  authSubtitle: {
    color: palette.muted,
    fontSize: 15,
    lineHeight: 21,
    textAlign: "center",
  },
  authModeSwitch: {
    backgroundColor: palette.tealSoft,
    borderColor: palette.lineStrong,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    padding: 3,
  },
  authModeButton: {
    alignItems: "center",
    borderRadius: 8,
    flex: 1,
    justifyContent: "center",
    minHeight: 42,
    paddingHorizontal: 10,
  },
  authModeButtonSelected: {
    backgroundColor: palette.surface,
    borderColor: palette.line,
    borderWidth: 1,
  },
  authModeText: {
    color: palette.muted,
    fontSize: 15,
    fontWeight: "500",
  },
  authModeTextSelected: {
    color: palette.ink,
  },
  authForm: {
    gap: 10,
  },
  authModeIntro: {
    color: palette.muted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  authSupportButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  authSupportText: {
    color: palette.teal,
    fontSize: 15,
    fontWeight: "500",
  },
  paywallScreen: {
    padding: 18,
    gap: 12,
  },
  nativeAuthGroup: {
    gap: 8,
  },
  accountDataActions: {
    gap: 12,
  },
  appleAuthButton: {
    height: 48,
    width: "100%",
  },
  nativeAuthDivider: {
    color: palette.muted,
    fontSize: 13,
    textAlign: "center",
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 20,
  },
  openingSubtitle: {
    color: palette.muted,
    fontSize: 14,
    lineHeight: 20,
    maxWidth: 320,
    textAlign: "center",
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: palette.line,
    backgroundColor: palette.surface,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexShrink: 1,
  },
  brandMark: {
    width: 36,
    height: 36,
    borderRadius: 10,
  },
  brand: {
    fontSize: 17,
    fontWeight: "600",
    color: palette.ink,
  },
  mobileAppBar: {
    minHeight: 56,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: palette.chromeLine,
    backgroundColor: palette.pageBg,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  mobileAppBarTitle: {
    flex: 1,
    minWidth: 0,
  },
  mobileMenuButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 0,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  mobileAppBarSpacer: {
    width: 44,
    height: 44,
  },
  mobilePrivacyButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  mobileMenuLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 50,
    elevation: 50,
  },
  mobileMenuBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.28)",
  },
  mobileDrawer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: 318,
    maxWidth: "88%",
    backgroundColor: palette.surface,
    borderRightWidth: 1,
    borderRightColor: palette.line,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 4, height: 0 },
    elevation: 60,
  },
  mobileDrawerHeader: {
    minHeight: 56,
    paddingHorizontal: 12,
    paddingBottom: 0,
    borderBottomWidth: 1,
    borderBottomColor: palette.line,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  mobileDrawerNav: {
    flex: 1,
  },
  mobileDrawerNavInner: {
    paddingHorizontal: 8,
    paddingVertical: 12,
    gap: 4,
  },
  mobileDrawerButton: {
    minHeight: 48,
    borderRadius: 12,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  mobileDrawerButtonActive: {
    backgroundColor: palette.tealSoft,
  },
  mobileDrawerButtonText: {
    flex: 1,
    minWidth: 0,
    color: palette.text,
    fontSize: 17,
    fontWeight: "500",
  },
  mobileDrawerButtonTextActive: {
    color: palette.teal,
  },
  mobileDrawerSubsection: {
    marginLeft: 28,
    paddingLeft: 10,
    borderLeftWidth: 1,
    borderLeftColor: palette.line,
    gap: 6,
  },
  drawerEmptyText: {
    color: palette.muted,
    fontSize: 13,
    lineHeight: 18,
    paddingVertical: 6,
  },
  mobileDrawerSessionButton: {
    minHeight: 34,
    borderRadius: 7,
    paddingHorizontal: 9,
    paddingVertical: 7,
  },
  mobileDrawerSessionButtonActive: {
    backgroundColor: palette.tealSoft,
  },
  mobileDrawerSessionText: {
    color: palette.text,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: "600",
  },
  mobileDrawerSessionTextActive: {
    color: palette.teal,
  },
  mobileDrawerBookmarkRow: {
    minHeight: 38,
    borderRadius: 7,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  mobileDrawerBookmarkTitle: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 8,
    paddingVertical: 7,
  },
  mobileDrawerMiniButton: {
    width: 44,
    height: 44,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.tealSoft,
  },
  // HPD-462: back to the footer it was in before 76b76ee5 — pinned to the
  // bottom edge of the drawer, separated by a rule, with its own larger avatar
  // and the plan name under the address.
  mobileDrawerAccount: {
    borderTopWidth: 1,
    borderTopColor: palette.line,
    padding: 12,
    gap: 8,
  },
  mobileDrawerAccountButton: {
    minHeight: 52,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: palette.tealSoft,
    borderColor: palette.line,
    borderWidth: StyleSheet.hairlineWidth,
  },
  // The weight this label carried before the move, at a size one step above
  // the 17 it was given there — the "leicht größere Schrift" Justus asked for.
  mobileDrawerAccountLabel: {
    color: palette.ink,
    fontWeight: "500",
    fontSize: 15,
    flexShrink: 1,
  },
  mobileDrawerAccountButtonActive: {
    backgroundColor: palette.tealSoft,
  },
  sidebarAccountAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.ink,
  },
  sidebarAccountAvatarText: {
    color: palette.pageBg,
    fontWeight: "600",
  },
  mobileDrawerAccountMenu: {
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 12,
    backgroundColor: palette.surface,
    padding: 12,
    gap: 5,
  },
  mobileDrawerLanguagePicker: {
    gap: 9,
  },
  mobileDrawerLanguageLabel: {
    color: palette.muted,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
  },
  mobileDrawerLanguageButtonRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },
  mobileDrawerLanguageButton: {
    minWidth: 38,
    minHeight: 34,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: palette.line,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 9,
    backgroundColor: palette.surface,
  },
  mobileDrawerLanguageButtonActive: {
    borderColor: palette.teal,
    backgroundColor: palette.tealSoft,
  },
  mobileDrawerLanguageButtonText: {
    color: palette.text,
    fontSize: 13,
    fontWeight: "500",
  },
  mobileDrawerLanguageButtonTextActive: {
    color: palette.teal,
  },
  mobileDrawerAccountMenuDivider: {
    height: 1,
    backgroundColor: palette.line,
    marginVertical: 8,
  },
  mobileDrawerAccountMenuRow: {
    minHeight: 36,
    borderRadius: 8,
    paddingHorizontal: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  mobileDrawerAccountMenuRowSelected: {
    backgroundColor: palette.tealSoft,
  },
  mobileDrawerAccountMenuText: {
    color: palette.ink,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "500",
  },
  content: {
    flex: 1,
  },
  dashboardOpenNotice: {
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  contentInner: {
    padding: 16,
    paddingBottom: 104,
    gap: 12,
  },
  systemSurfaceEdgeToEdge: {
    marginHorizontal: -16,
  },
  automationCardList: {
    gap: 14,
    paddingTop: 8,
  },
  systemSurfaceNotice: {
    paddingHorizontal: 16,
    // HPD-443: without a top padding the text sat against the divider above it.
    paddingTop: 8,
    paddingBottom: 8,
  },
  aiAccessLogo: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  aiAccessIncludedModels: {
    marginTop: 12,
    marginHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 4,
    borderLeftWidth: 3,
    borderLeftColor: palette.teal,
    backgroundColor: palette.tealSoft,
  },
  systemRowPressed: {
    backgroundColor: "rgba(127, 127, 127, 0.16)",
  },
  chatKeyboard: {
    flex: 1,
  },
  chatScreen: {
    flex: 1,
    backgroundColor: palette.pageBg,
  },
  chatHeader: {
    minHeight: 54,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: palette.line,
    backgroundColor: palette.surface,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  chatHeaderTitle: {
    color: palette.ink,
    fontWeight: "600",
    fontSize: 17,
    lineHeight: 22,
  },
  subthreadHeaderTitle: {
    color: palette.brandBlue,
    fontWeight: "600",
    fontSize: 16,
  },
  chatHeaderSubtitle: {
    color: palette.muted,
    fontSize: 13,
    lineHeight: 16,
    maxWidth: 220,
  },
  chatNoticeStack: {
    paddingHorizontal: 12,
    paddingTop: 10,
    gap: 8,
  },
  secureConnectionEntry: {
    backgroundColor: palette.surface,
    borderColor: palette.line,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    padding: 14,
  },
  panel: {
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 8,
    padding: 14,
    gap: 10,
  },
  stack: {
    gap: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    flexWrap: "wrap",
  },
  rowWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    color: palette.ink,
    flexShrink: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: palette.ink,
    textTransform: "capitalize",
  },
  muted: {
    color: palette.muted,
    fontSize: 13,
  },
  eyebrow: {
    color: palette.teal,
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  heySuggestionNudge: {
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 10,
    padding: 12,
    gap: 8,
    backgroundColor: palette.surface,
  },
  heySuggestionFilters: {
    gap: 8,
    paddingVertical: 4,
  },
  heySuggestionList: {
    gap: 10,
  },
  heySuggestionCard: {
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 10,
    padding: 12,
    gap: 8,
    backgroundColor: palette.surface,
  },
  gmailRecommendationCard: {
    backgroundColor: palette.surface,
    borderBottomColor: palette.line,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  gmailRecommendationHeading: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  gmailRecommendationActions: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  gmailRecommendationButton: {
    alignItems: "center",
    borderColor: palette.line,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 38,
    minWidth: 78,
    paddingHorizontal: 12,
  },
  gmailRecommendationDismiss: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 38,
    paddingHorizontal: 8,
  },
  gmailRecommendationDismissText: {
    color: palette.muted,
    fontSize: 13,
    textDecorationLine: "underline",
  },
  guidedSetupLocalError: {
    color: palette.coral,
    fontSize: 13,
    lineHeight: 18,
    paddingVertical: 4,
  },
  heySuggestionCardHeading: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  heySuggestionState: {
    color: palette.teal,
    fontSize: 13,
    fontWeight: "600",
  },
  heySuggestionActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  notice: {
    color: palette.text,
    fontSize: 13,
    lineHeight: 19,
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 8,
    padding: 10,
    backgroundColor: palette.surface,
  },
  noticeBox: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  errorNotice: {
    borderColor: palette.coral,
    backgroundColor: palette.coralSoft,
  },
  infoNotice: {
    borderColor: palette.line,
    backgroundColor: palette.tealSoft,
  },
  noticeText: {
    color: palette.text,
    fontSize: 13,
    lineHeight: 19,
    flex: 1,
  },
  noticeDismiss: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  foregroundNotification: {
    marginHorizontal: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: palette.teal,
    borderRadius: 10,
    backgroundColor: palette.tealSoft,
    padding: 11,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  foregroundNotificationIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: palette.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  foregroundNotificationTitle: {
    color: palette.ink,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "600",
  },
  foregroundNotificationBody: {
    color: palette.text,
    fontSize: 13,
    lineHeight: 18,
  },
  foregroundNotificationDismiss: {
    width: 44,
    height: 44,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  inlineStatus: {
    minHeight: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: palette.surface,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  statusItem: {
    width: "48%",
    minHeight: 92,
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 8,
    padding: 10,
    gap: 4,
    backgroundColor: palette.surface,
  },
  statusValue: {
    color: palette.ink,
    fontWeight: "600",
    fontSize: 15,
  },
  statusHint: {
    color: palette.muted,
    fontSize: 13,
    lineHeight: 17,
  },
  pushPanel: {
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 8,
    padding: 12,
    gap: 10,
    backgroundColor: palette.surface,
  },
  statusActionButton: {
    flex: 1,
    minWidth: 138,
  },
  body: {
    color: palette.text,
    fontSize: 14,
    lineHeight: 20,
  },
  privacyNote: {
    color: palette.muted,
    fontSize: 13,
    lineHeight: 17,
  },
  privacyList: {
    gap: 8,
  },
  privacyLine: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  // HPD-443: a 16pt icon against a 24pt line sits high; this drops it onto the
  // first line instead of the block's top edge.
  privacyLineIcon: {
    marginTop: 3,
  },
  // HPD-445: without a share of the row, the sentence beside the icon ran past
  // the right edge instead of wrapping inside it. Seen on the simulator on
  // 2026-08-24: "Only you" ended in a clipped "u" at the screen edge.
  privacyLineText: {
    color: palette.text,
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  permissionList: {
    gap: 8,
  },
  permissionRow: {
    minHeight: 58,
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 8,
    padding: 10,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: palette.surface,
  },
  permissionTitle: {
    color: palette.ink,
    fontWeight: "600",
    fontSize: 13,
  },
  flexOne: {
    flex: 1,
    minWidth: 0,
  },
  chatMessages: {
    flex: 1,
  },
  chatMessagesInner: {
    flexGrow: 1,
    justifyContent: "flex-start",
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 14,
    gap: 14,
  },
  messages: {
    minHeight: 300,
    gap: 10,
  },
  chatEmptyState: {
    minHeight: 180,
    borderWidth: 0,
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingHorizontal: 28,
    paddingVertical: 18,
    backgroundColor: "transparent",
  },
  chatEmptyTitle: {
    color: palette.ink,
    fontWeight: "600",
    fontSize: 22,
    lineHeight: 28,
  },
  suggestionChipWrap: {
    marginTop: 6,
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 7,
  },
  suggestionChip: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: palette.lineStrong,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: palette.surface,
  },
  suggestionChipUsed: {
    backgroundColor: palette.tealSoft,
  },
  suggestionChipText: {
    color: palette.ink,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "400",
  },
  message: {
    maxWidth: "82%",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 11,
    gap: 8,
  },
  assistantMessage: {
    maxWidth: "100%",
    borderRadius: 0,
    paddingHorizontal: 0,
    paddingVertical: 2,
    backgroundColor: "transparent",
    alignSelf: "flex-start",
  },
  userMessage: {
    backgroundColor: palette.userTint,
    alignSelf: "flex-end",
    borderBottomRightRadius: 6,
  },
  userAttachmentList: {
    alignSelf: "stretch",
    gap: 5,
  },
  userAttachmentChip: {
    maxWidth: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 9,
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: palette.tealSoft,
  },
  userAttachmentText: {
    flexShrink: 1,
    color: palette.ink,
    fontSize: 13,
    fontWeight: "500",
  },
  pendingMessage: {
    alignItems: "stretch",
  },
  pendingMessageHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  failedMessage: {
    alignSelf: "stretch",
    maxWidth: "100%",
    backgroundColor: palette.coralSoft,
    borderWidth: 1,
    borderColor: palette.coral,
    gap: 8,
  },
  queuedFollowUpList: { maxHeight: 240, flexGrow: 0 },
  queuedFollowUpMessage: {
    alignSelf: "stretch",
    maxWidth: "100%",
    backgroundColor: palette.tealSoft,
    borderWidth: 1,
    borderColor: "#b8dfd8",
    gap: 8,
  },
  failedMessageHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  failedMessageTitle: {
    color: palette.coral,
    fontWeight: "600",
    fontSize: 13,
  },
  queuedFollowUpTitle: {
    color: palette.teal,
    fontWeight: "600",
    fontSize: 13,
  },
  failedMessageBody: {
    color: palette.text,
    fontSize: 13,
  },
  failedRetryButton: {
    borderColor: palette.coral,
  },
  failedRetryText: {
    color: palette.coral,
  },
  messageText: {
    color: palette.text,
    fontSize: 17,
    lineHeight: 25,
  },
  messageTextBold: {
    color: palette.ink,
    fontSize: 17,
    lineHeight: 25,
    fontWeight: "600",
  },
  markdownBlocks: {
    gap: 12,
    alignSelf: "stretch",
  },
  markdownTableViewport: {
    alignSelf: "stretch",
    maxWidth: "100%",
    minWidth: 0,
  },
  markdownTable: {
    alignSelf: "stretch",
    maxWidth: "100%",
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: palette.surface,
  },
  markdownTableRow: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  markdownTableRowBorder: {
    borderTopWidth: 1,
    borderTopColor: palette.line,
  },
  markdownTableCell: {
    flex: 1,
    flexBasis: 0,
    minWidth: 0,
    paddingHorizontal: 9,
    paddingVertical: 8,
    justifyContent: "flex-start",
  },
  markdownTableHeaderCell: {
    backgroundColor: palette.tealSoft,
  },
  markdownTableColumnBorder: {
    borderLeftWidth: 1,
    borderLeftColor: palette.line,
  },
  markdownTableHeaderText: {
    color: palette.ink,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "600",
  },
  markdownTableCellText: {
    color: palette.text,
    fontSize: 15,
    lineHeight: 20,
  },
  markdownTableBoldText: {
    fontWeight: "700",
  },
  inlineCode: {
    color: palette.ink,
    backgroundColor: palette.tealSoft,
    fontFamily: Platform.select({ ios: "Menlo", android: "monospace" }),
    fontSize: 16,
  },
  codeBlock: {
    alignSelf: "stretch",
    borderRadius: 8,
    backgroundColor: "#111827",
    borderColor: palette.line,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 10,
    gap: 6,
  },
  codeLanguage: {
    color: "#9ca3af",
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  codeBlockText: {
    color: "#f9fafb",
    fontFamily: Platform.select({ ios: "Menlo", android: "monospace" }),
    fontSize: 15,
    lineHeight: 22,
  },
  confirmationActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },
  confirmationPrimaryButton: {
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: palette.accentStrong,
    borderColor: palette.accent,
    borderWidth: 1,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmationSecondaryButton: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: palette.surface,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmationPrimaryText: {
    color: palette.accentText,
    fontSize: 13,
    fontWeight: "600",
  },
  confirmationSecondaryText: {
    color: palette.teal,
    fontSize: 13,
    fontWeight: "600",
  },
  messageLink: {
    color: palette.teal,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  activityTrail: {
    marginTop: 2,
    borderLeftWidth: StyleSheet.hairlineWidth,
    paddingLeft: 10,
    gap: 7,
    alignSelf: "stretch",
    maxWidth: "100%",
  },
  activityTrailDone: {
    borderLeftColor: palette.teal,
  },
  activityTrailError: {
    borderLeftColor: palette.coral,
  },
  activityTrailWorking: {
    borderLeftColor: palette.line,
  },
  activityTrailNeutral: {
    borderLeftColor: palette.line,
  },
  activityTrailSummary: {
    minHeight: 28,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "stretch",
    maxWidth: "100%",
  },
  activityTrailIcon: {
    width: 24,
    alignItems: "center",
    flexShrink: 0,
  },
  activityTrailTitle: {
    color: palette.muted,
    // Same size as the sub thread line beneath it, so the two status texts on
    // this screen read as one family rather than two.
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500",
    // Never `flex: 1` here. The assistant bubble is sized to its content, so a
    // flexible width resolves to the space left over beside the dragon, which is
    // none: the line measured zero and nothing was painted at all.
    flexShrink: 1,
  },
  userMessageText: {
    color: palette.ink,
    fontSize: 17,
    lineHeight: 25,
  },
  messageTime: {
    alignSelf: "flex-end",
    color: palette.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  userMessageTime: {
    color: palette.muted,
  },
  messageActions: {
    flexDirection: "row",
    justifyContent: "flex-start",
    flexWrap: "wrap",
    gap: 6,
    alignSelf: "stretch",
    maxWidth: "100%",
  },
  messageActionButton: {
    minHeight: 28,
    borderRadius: 7,
    paddingHorizontal: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: palette.tealSoft,
    alignSelf: "flex-start",
    flexShrink: 1,
    maxWidth: "100%",
  },
  messageActionText: {
    color: palette.teal,
    fontSize: 13,
    fontWeight: "600",
    flexShrink: 1,
  },
  loadOlderMessagesButton: {
    alignSelf: "center",
  },
  sessionList: {
    gap: 8,
  },
  sessionButton: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 8,
    padding: 10,
    backgroundColor: palette.surface,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sessionButtonActive: {
    borderColor: palette.teal,
    backgroundColor: palette.tealSoft,
  },
  sessionButtonTextActive: {
    color: palette.teal,
  },
  readAloudRow: {
    minHeight: 28,
    paddingHorizontal: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  readAloudText: {
    color: palette.muted,
    fontSize: 13,
    fontWeight: "600",
  },
  readAloudControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  readAloudStopButton: {
    minHeight: 28,
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 999,
    paddingHorizontal: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: palette.surface,
  },
  readAloudStopText: {
    color: palette.coral,
    fontSize: 13,
    fontWeight: "600",
  },
  diagnosticRow: {
    borderTopWidth: 1,
    borderTopColor: palette.line,
    paddingTop: 8,
    gap: 3,
  },
  composer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 26,
    backgroundColor: palette.surface,
    paddingHorizontal: 4,
    paddingVertical: 4,
    minHeight: 52,
  },
  voiceRecordingInline: {
    flex: 1,
    minHeight: 44,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 20,
    backgroundColor: palette.coralSoft,
  },
  voiceRecordingText: {
    color: palette.coral,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  voiceFailureInline: {
    flex: 1,
    minHeight: 44,
    paddingHorizontal: 8,
    justifyContent: "center",
  },
  voiceFailureText: {
    color: palette.coral,
    fontSize: 13,
    lineHeight: 16,
    fontWeight: "700",
  },
  voiceFailureActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  chatComposerDock: {
    borderTopWidth: 0,
    backgroundColor: palette.pageBg,
    paddingHorizontal: 14,
    paddingTop: 6,
    paddingBottom: 10,
    gap: 8,
  },
  delegatedTasksIndicator: {
    borderTopWidth: 1,
    borderTopColor: palette.line,
    backgroundColor: palette.surface,
    paddingHorizontal: 12,
    paddingVertical: 7,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  delegatedTasksDragon: {
    width: 24,
    alignItems: "center",
    flexShrink: 0,
  },
  delegatedTaskDismiss: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  delegatedTasksRows: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  delegatedTaskRow: {
    minHeight: 19,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  delegatedTaskPressed: {
    opacity: 0.55,
  },
  delegatedTaskLink: {
    color: palette.teal,
    fontSize: 13,
    lineHeight: 16,
    fontWeight: "600",
    textDecorationLine: "underline",
    maxWidth: 210,
  },
  delegatedTaskMeta: {
    color: palette.muted,
    fontSize: 13,
    lineHeight: 16,
    fontVariant: ["tabular-nums"],
    flexShrink: 0,
  },
  scrollDownButton: {
    position: "absolute",
    right: 18,
    bottom: 92,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: palette.accentStrong,
    borderColor: palette.accent,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.16,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
    zIndex: 3,
  },
  copyNotice: {
    color: palette.teal,
    fontSize: 13,
    fontWeight: "600",
  },
  attachmentNotice: {
    color: palette.coral,
    fontSize: 13,
    fontWeight: "700",
  },
  attachmentChips: {
    gap: 7,
    paddingRight: 4,
  },
  attachmentChip: {
    maxWidth: 220,
    minHeight: 30,
    borderRadius: 8,
    backgroundColor: palette.tealSoft,
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  attachmentChipText: {
    maxWidth: 160,
    color: palette.ink,
    fontSize: 13,
    fontWeight: "700",
  },
  input: {
    flex: 1,
    minHeight: 44,
    borderWidth: 1,
    borderColor: palette.lineStrong,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: palette.surface,
    color: palette.text,
    fontSize: 15,
  },
  chatInput: {
    minHeight: 38,
    maxHeight: 116,
    borderWidth: 0,
    borderRadius: 18,
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: "transparent",
    fontSize: 17,
    lineHeight: 22,
  },
  inputDisabled: {
    backgroundColor: "#f4f7f7",
    color: palette.muted,
  },
  formStack: {
    gap: 8,
  },
  fieldLabel: {
    color: palette.text,
    fontSize: 13,
    fontWeight: "600",
  },
  secretList: {
    gap: 8,
  },
  secretRow: {
    minHeight: 58,
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 8,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    backgroundColor: palette.surface,
  },
  secretTitle: {
    color: palette.ink,
    fontWeight: "600",
    fontSize: 13,
  },
  segmentedControl: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  segmentButton: {
    minHeight: 36,
    minWidth: 96,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: palette.line,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.surface,
  },
  segmentButtonActive: {
    borderColor: palette.teal,
    backgroundColor: palette.tealSoft,
  },
  segmentButtonText: {
    color: palette.text,
    fontSize: 13,
    fontWeight: "600",
  },
  segmentButtonTextActive: {
    color: palette.teal,
  },
  integrationActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  integrationActionButton: {
    flexGrow: 1,
    minWidth: 104,
  },
  integrationReset: {
    borderTopWidth: 1,
    borderTopColor: palette.line,
    paddingTop: 10,
    gap: 8,
  },
  chatGptActionStack: {
    gap: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: palette.accentStrong,
    borderColor: palette.accent,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  composerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  chatGptPanelHeaderActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  stopButton: {
    backgroundColor: "#dc2626",
  },
  disabledButton: {
    opacity: 0.45,
  },
  primaryButtonWide: {
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: palette.accentStrong,
    borderColor: palette.accent,
    borderWidth: 1,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  primaryButtonText: {
    color: palette.accentText,
    fontSize: 15,
    fontWeight: "600",
  },
  secondaryButtonWide: {
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: "transparent",
    borderColor: palette.lineStrong,
    borderWidth: 1,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  secondaryButtonText: {
    color: palette.ink,
    fontSize: 15,
    fontWeight: "600",
  },
  newPageButton: {
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: palette.accentStrong,
    borderColor: palette.accent,
    borderWidth: 1,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 7,
  },
  ghostSmallButton: {
    minHeight: 34,
    borderRadius: 7,
    backgroundColor: palette.tealSoft,
    paddingHorizontal: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  dangerButtonWide: {
    minHeight: 42,
    borderRadius: 8,
    backgroundColor: palette.coralSoft,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  dangerButtonText: {
    color: palette.coral,
    fontWeight: "600",
  },
  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: palette.line,
  },
  settingsRowIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.tealSoft,
  },
  settingsRowLabel: {
    color: palette.text,
    fontWeight: "600",
    fontSize: 15,
  },
  settingsRowHint: {
    color: palette.muted,
    fontSize: 13,
    marginTop: 1,
  },
  settingsRowChevron: {
    color: palette.muted,
    fontSize: 22,
  },
  mobilePurchaseSection: {
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: palette.line,
  },
  mobilePurchaseSectionCompact: {
    marginBottom: 12,
    paddingBottom: 24,
  },
  paywallAccessSummary: {
    gap: 6,
  },
  paywallPanel: {
    padding: 18,
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 12,
    backgroundColor: palette.surface,
  },
  paywallHero: {
    gap: 8,
    paddingBottom: 8,
  },
  paywallHeroTitle: {
    color: palette.ink,
    fontSize: 28,
    lineHeight: 33,
    fontWeight: "600",
  },
  paywallHeroBody: {
    color: palette.text,
    fontSize: 15,
    lineHeight: 21,
  },
  paywallPrice: {
    color: palette.ink,
    fontSize: 24,
    fontWeight: "600",
  },
  paywallDisclosure: {
    color: palette.text,
    fontSize: 13,
    lineHeight: 18,
  },
  paywallAge: {
    color: palette.muted,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: "600",
  },
  paywallLegalRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: 24,
    justifyContent: "center",
    marginTop: 12,
    rowGap: 12,
  },
  paywallLegalLink: {
    color: palette.teal,
    fontSize: 13,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  paywallTrustList: {
    gap: 6,
  },
  paywallTrustItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  paywallTrustText: {
    color: palette.text,
    fontSize: 13,
    fontWeight: "600",
  },
  languagePicker: {
    gap: 9,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: palette.line,
    marginBottom: 12,
  },
  languageButtonRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },
  languageButton: {
    minWidth: 42,
    minHeight: 34,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: palette.line,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    backgroundColor: palette.surface,
  },
  languageButtonActive: {
    borderColor: palette.teal,
    backgroundColor: palette.tealSoft,
  },
  languageButtonText: {
    color: palette.text,
    fontSize: 13,
    fontWeight: "600",
  },
  languageButtonTextActive: {
    color: palette.teal,
  },
  settingsBack: {
    paddingVertical: 6,
  },
  settingsBackText: {
    color: palette.accent,
    fontSize: 15,
    fontWeight: "600",
  },
  bookmarkRow: {
    minHeight: 58,
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: palette.surface,
    overflow: "hidden",
  },
  bookmarkOpenArea: {
    flex: 1,
    minHeight: 58,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  bookmarkIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.tealSoft,
  },
  bookmarkTitleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 6,
  },
  capabilityRow: {
    minHeight: 64,
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 8,
    padding: 10,
    backgroundColor: palette.surface,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  capabilityRowActive: {
    borderColor: palette.teal,
    backgroundColor: palette.tealSoft,
  },
  capabilityIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.tealSoft,
  },
  bookmarkRemoveButton: {
    width: 46,
    minHeight: 58,
    borderLeftWidth: 1,
    borderLeftColor: palette.line,
    alignItems: "center",
    justifyContent: "center",
  },
  bookmarkAccessoryButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    minWidth: 44,
  },
  rowTitle: {
    color: palette.ink,
    fontWeight: "600",
    flexShrink: 1,
  },
  emptyState: {
    minHeight: 92,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: palette.line,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: palette.surface,
  },
  chip: {
    minHeight: 30,
    borderRadius: 7,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.tealSoft,
  },
  chipText: {
    color: palette.teal,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  accountRow: {
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 8,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: palette.line,
    alignItems: "center",
    justifyContent: "center",
  },
  headerIconButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: palette.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  statusPill: {
    minHeight: 30,
    borderRadius: 7,
    paddingHorizontal: 10,
    backgroundColor: palette.tealSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  statusPillText: {
    color: palette.teal,
    fontWeight: "600",
  },
  connectedPill: {
    minHeight: 28,
    borderRadius: 7,
    paddingHorizontal: 10,
    backgroundColor: palette.tealSoft,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  connectedPillText: {
    color: palette.teal,
    fontWeight: "600",
  },
  attentionPill: {
    minHeight: 28,
    borderRadius: 7,
    paddingHorizontal: 10,
    backgroundColor: palette.amberSoft,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  attentionPillText: {
    color: palette.amber,
    fontWeight: "600",
  },
});

  return NativeR8Surface;
}
