import type { ComponentType, ReactNode } from "react";
import type { ColorValue, ImageSourcePropType, StyleProp, ViewStyle } from "react-native";
import type { createApiClient, ApiClientOptions, AppLocale, ChatLatencySummary, FirstConversationSnapshot } from "./core/index";
import type { GuidedSetupState, GuidedSetupConnectionId, GuidedSetupConnectionChoice } from "./core/guided-setup";
import type { createSupportRequestClient, createAnonymousSupportRequestClient } from "./core/support-request";
import type { createNativeR8CanonicalController } from "./src/hermes-canonical";
import type { MobilePurchasesController } from "./src/revenuecat-purchases";
import type { NativeSessionSecureStore } from "./src/mobile-session-storage";
import type { MobilePalette } from "./src/mobile-palette";
import type { MobileFinanceCitation } from "./src/mobile-finance-artifacts";

export type NativeAudioStatus = {
  playing: boolean; didJustFinish: boolean; isBuffering: boolean; currentTime: number;
};
export type NativeAudioPlayer = {
  play(): void; pause(): void; replace(source: string): void;
  addListener(event: "playbackStatusUpdate", listener: (status: NativeAudioStatus) => void): { remove(): void };
};
export type NativeAudioRecorder = {
  getStatus(): { url?: string | null };
  uri: string | null; prepareToRecordAsync(): Promise<void>; record(): void; stop(): Promise<void>;
};
export type NativeNotification = {
  date: number;
  request: { identifier: string; content: { data?: Record<string, unknown>; title?: string | null; body?: string | null } };
};
export type NativePickedAsset = { uri: string; fileName?: string | null; name?: string; mimeType?: string; base64?: string | null };
export type NativePickResult = { canceled: boolean; assets: NativePickedAsset[] };
export type NativePermission = { granted: boolean; status?: string };
export type NativeGoogleRequest = { [key: string]: unknown };
export type NativeGoogleResponse = { type: string; params: Record<string, string>; authentication?: { idToken?: string | null } | null } | null;
export type NativeBrowserResult = { type: string; url?: string };

/** Native service ports. Expo, RevenueCat and HODL modules belong in hosts. */
export type NativeR8Platform = {
  StatusBar: ComponentType<{ style: "light" | "dark" }>;
  SecureStore: NativeSessionSecureStore;
  Constants: {
    nativeAppVersion?: string | null; nativeBuildVersion?: string | null; statusBarHeight?: number;
    expoConfig?: { version?: string; extra?: Record<string, unknown> } | null;
    easConfig?: { projectId?: string } | null;
  };
  Crypto: {
    randomUUID(): string;
    CryptoDigestAlgorithm: { SHA256: string };
    CryptoEncoding: { BASE64: string };
    digestStringAsync(algorithm: string, input: string, options: { encoding: string }): Promise<string>;
  };
  Notifications: {
    setNotificationHandler(handler: { handleNotification(notification: NativeNotification): Promise<{ shouldPlaySound: boolean; shouldSetBadge: boolean; shouldShowBanner: boolean; shouldShowList: boolean }> }): void;
    addNotificationReceivedListener(callback: (notification: NativeNotification) => void): { remove(): void };
    addNotificationResponseReceivedListener(callback: (response: { notification: NativeNotification }) => void): { remove(): void };
    setNotificationChannelAsync(id: string, options: { name: string; importance: number }): Promise<unknown>;
    AndroidImportance: { MAX: number };
    getPermissionsAsync(): Promise<NativePermission>; requestPermissionsAsync(): Promise<NativePermission>;
    getExpoPushTokenAsync(options: { projectId: string }): Promise<{ data: string }>;
  };
  DocumentPicker: { getDocumentAsync(options: { copyToCacheDirectory: boolean; multiple: boolean }): Promise<NativePickResult> };
  ImagePicker: {
    launchImageLibraryAsync(options: { allowsMultipleSelection: boolean; base64: boolean; mediaTypes: string[]; preferredAssetRepresentationMode: string | number; quality: number; selectionLimit: number }): Promise<NativePickResult>;
    requestCameraPermissionsAsync(): Promise<NativePermission>;
    launchCameraAsync(options: { base64: boolean; mediaTypes: string[]; quality: number }): Promise<NativePickResult>;
    UIImagePickerPreferredAssetRepresentationMode: { Compatible: string | number };
  };
  AppleAuthentication: {
    isAvailableAsync(): Promise<boolean>;
    signInAsync(options: { nonce: string; state: string; requestedScopes: (string | number)[] }): Promise<{ user: string; identityToken: string | null }>;
    getCredentialStateAsync(user: string): Promise<string | number>;
    AppleAuthenticationScope: { FULL_NAME: string | number; EMAIL: string | number };
    AppleAuthenticationCredentialState: { AUTHORIZED: string | number };
    AppleAuthenticationButton: ComponentType<{ buttonStyle: string | number; buttonType: string | number; cornerRadius: number; onPress(): void; style: StyleProp<ViewStyle> }>;
    AppleAuthenticationButtonStyle: { BLACK: string | number };
    AppleAuthenticationButtonType: { CONTINUE: string | number; SIGN_UP: string | number };
  };
  Google: {
    useIdTokenAuthRequest(options: { clientId: string; extraParams?: { nonce: string }; iosClientId: string; selectAccount: boolean }): [NativeGoogleRequest | null, NativeGoogleResponse, () => Promise<unknown>];
  };
  WebBrowser: {
    maybeCompleteAuthSession(): unknown; openBrowserAsync(url: string): Promise<unknown>;
    openAuthSessionAsync(url: string, redirect: string): Promise<NativeBrowserResult>;
  };
  createAudioPlayer(source: string): NativeAudioPlayer;
  RecordingPresets: { HIGH_QUALITY: unknown };
  requestRecordingPermissionsAsync(): Promise<NativePermission>;
  setAudioModeAsync(options: { allowsRecording: boolean; playsInSilentMode: boolean }): Promise<void>;
  useAudioRecorder(options: unknown): NativeAudioRecorder;
  useAudioRecorderState(recorder: NativeAudioRecorder): { durationMillis: number; isRecording: boolean };
  FileSystem: {
    cacheDirectory: string | null; documentDirectory: string | null;
    EncodingType: { Base64: string };
    readAsStringAsync(uri: string, options: { encoding: string }): Promise<string>;
    writeAsStringAsync(uri: string, data: string, options?: { encoding: string }): Promise<void>;
    deleteAsync(uri: string, options?: { idempotent?: boolean }): Promise<void>;
    readDirectoryAsync(uri: string): Promise<string[]>;
    getInfoAsync(uri: string): Promise<{ exists: boolean; isDirectory?: boolean }>;
  };
};

export type NativeR8SessionHost = {
  mode: "standalone" | "external";
  read(): Promise<{ token: string | null; storage: "secure" | "local" | "memory" }>;
  persist(token: string): Promise<"secure" | "local" | "memory">;
  clear(): Promise<void>;
  renderUnavailable(): ReactNode;
};
export type NativeR8GuidedSetupMutation = { kind: "skip" } | {
  kind: "choice"; connectionId: GuidedSetupConnectionId;
  choice: Exclude<GuidedSetupConnectionChoice, "undecided">;
} | { kind: "gmail_recommendation"; action: "snooze" | "dismiss" };

export type NativeFinanceActionApprovalField = { key: string; label: string; value: string };
export type NativeFinanceActionApprovalSurface = "hey_hermes" | "finhermes";
export type NativeFinanceActionApprovalChannel =
  | "hey_hermes_web"
  | "hey_hermes_mobile"
  | "finhermes_web"
  | "finhermes_mobile"
  | "hodl_mobile"
  | "capchat_app"
  | "telegram"
  | "hermes_cron";
export type NativeFinanceActionApproval = {
  approvalId: string;
  payloadSha256: string;
  canonicalConversationId: string;
  canonicalRunId: string;
  originSurface: NativeFinanceActionApprovalSurface;
  confirmationSurface: NativeFinanceActionApprovalSurface;
  channel: NativeFinanceActionApprovalChannel;
  title: string;
  summary: string;
  fields: NativeFinanceActionApprovalField[];
  expiresAt: string;
};

/** All operations retain the canonical R8 response types; hosts bind authority. */
export type NativeR8Transport = {
  createApiClient(options: ApiClientOptions): ReturnType<typeof createApiClient>;
  createCanonicalClient(options: { baseUrl: string; token: string; fetchImpl: typeof fetch }): ReturnType<typeof createNativeR8CanonicalController>;
  createSupportClient: typeof createSupportRequestClient;
  createAnonymousSupportClient: typeof createAnonymousSupportRequestClient;
  firstConversation(token: string): Promise<FirstConversationSnapshot>;
  guidedSetup(token: string, mutation?: NativeR8GuidedSetupMutation): Promise<GuidedSetupState | null>;
  listPendingFinanceActionApprovals(input: { token: string; conversationSessionId: string }): Promise<NativeFinanceActionApproval[]>;
  confirmFinanceActionApproval(input: { token: string; approval: NativeFinanceActionApproval }): Promise<void>;
  cancelFinanceActionApproval(input: { token: string; approval: NativeFinanceActionApproval }): Promise<void>;
  reportLatency(token: string, runId: string, summary: ChatLatencySummary): Promise<void>;
  fetchStream: typeof fetch;
  /** Optional product-owned reader. A null result means the exact source has no stored full document. */
  readFinanceSourceDocument?(input: {
    reference: NonNullable<MobileFinanceCitation["documentReference"]>;
    sourceNumber: number;
    signal?: AbortSignal;
  }): Promise<unknown | null>;
};
export type NativeR8Host = {
  apiBaseUrl: string;
  storageNamespace: string;
  identity: {
    icon?: ImageSourcePropType;
    gmailRedirectUri?: string;
    copy: { productName: string; tagline: string; trialCta: string; provisioningTitle: string; chatPlaceholder: string };
  };
  theme?: Partial<MobilePalette>;
  presentation?: {
    accountLabel?: string;
    appLocale?: AppLocale;
    centerChatTitle?: boolean;
    /**
     * HPD-837: the host's own support glyph. When set, a support button sits in
     * the chat header left of the privacy lock, drawn in the muted header grey,
     * and opens the Hermes support screen.
     */
    // The palette's grey is a dynamic iOS colour, not a plain string.
    chatHeaderSupportIcon?: ComponentType<{ size: number; color: ColorValue }>;
    chatTitle?: string;
    hideChatSubtitle?: boolean;
    hideDrawerPreferences?: boolean;
    /** HPD-606: Fin Hermes suggestions page, drawer entry and chat carousel. */
    finSuggestions?: boolean;
    keyboardVerticalOffset?: number;
    openingMode?: "brand" | "chat";
    openingStatus?: string;
    showAssistantIdentity?: boolean;
    sessionFailure?: {
      title: string;
      body: string;
      retryLabel: string;
      dismissLabel: string;
    };
  };
  session: NativeR8SessionHost;
  policy: { preinstalledRanker: boolean; preinstalledEmailScanner: boolean };
  transport: NativeR8Transport;
  platform: NativeR8Platform;
  purchases: {
    mobilePurchasesController: MobilePurchasesController;
    bindMobilePurchasesAccount(accountId: string): ReturnType<MobilePurchasesController["bindAccount"]>;
    isMobilePurchaseCancelled(error: unknown): boolean;
    mobilePurchasesConfiguredForBuild(): boolean;
  };
};
