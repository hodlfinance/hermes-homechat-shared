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
import type { NativeLiveVoicePort } from "./src/mobile-live-voice";

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
    AppleAuthenticationButtonStyle: { BLACK: string | number; WHITE: string | number };
    AppleAuthenticationButtonType: { CONTINUE: string | number; SIGN_UP: string | number; SIGN_IN?: string | number };
  };
  Google: {
    useIdTokenAuthRequest(options: { clientId: string; extraParams?: { nonce: string }; iosClientId: string; selectAccount: boolean; shouldAutoExchangeCode?: boolean }): [NativeGoogleRequest | null, NativeGoogleResponse, () => Promise<unknown>];
  };
  /**
   * HPD-1243: Google's native sign-in on Android (Credential Manager). The id
   * token it returns names `serverClientId` as its audience, which is the id
   * the Plane publishes for the surface "android". Optional: without it an
   * Android build offers no Google button.
   */
  GoogleNative?: {
    signIn(input: { serverClientId: string; nonce: string }): Promise<{ idToken: string } | null>;
  };
  WebBrowser: {
    maybeCompleteAuthSession(): unknown; openBrowserAsync(url: string): Promise<unknown>;
    openAuthSessionAsync(url: string, redirect: string): Promise<NativeBrowserResult>;
    dismissAuthSession?(): void;
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
  | "livequote_mobile"
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

/**
 * HPD-1442: what the surface tells a host-drawn Hermes figure. The host picks
 * colour and motion from it; the surface only says which thread the figure
 * stands for and whether it may move.
 */
export type NativeR8AssistantAvatarProps = {
  size: number;
  /** The thread the figure stands for; null while the chat has not opened one yet. */
  conversationId: string | null;
  /** True for the Home conversation (and the drawer's brand mark). */
  home: boolean;
  /** False when Reduce Motion is on or the mark should stand still. */
  animated: boolean;
  /** True while Hermes (or the background task) is working. */
  working: boolean;
  /** Absent: the figure is decoration next to a text that says the same. */
  accessibilityLabel?: string;
};
/**
 * HPD-1722: the customer's own payment cards (Hey Hermes only; HODL and
 * LiveQuote pass nothing and show nothing). `randomBytes` is the device's
 * secure random source, used to seal the card to the guest's key.
 * `scanText` lets the user take or pick a photo of a card and returns the text
 * lines recognised ON THE DEVICE (iOS Vision, Android ML Kit); the image never
 * leaves the phone. Without it the form has no scan button.
 */
export type NativeCardsPort = {
  randomBytes(length: number): Uint8Array;
  scanText?: () => Promise<string[] | null>;
  /**
   * Keeps the fingerprint of the server key this device first saw, in the
   * device's secure store. The card form and the payment approval refuse a key
   * that differs; Settings > Cards shows it. Hey Hermes passes it.
   */
  keyPin?: { read: () => Promise<string | null>; write: (fingerprint: string) => Promise<void> };
};

export type NativeR8Host = {
  /** HPD-1722: present only in Hey Hermes. Turns on the card form, the payment approval and Settings > Cards. */
  cards?: NativeCardsPort;
  /**
   * HPD-1097: opens the protected browser takeover (an authenticated
   * /browser/<id> URL) in the host's own full-screen view. Hey Hermes passes
   * its WebView screen; a host without it keeps the in-app Safari view.
   */
  openBrowserTakeover?: (url: string) => Promise<unknown>;
  /** HPD-1015: opt-in live voice supplied by the owning product host. */
  liveVoice?: NativeLiveVoicePort;
  /**
   * HPD-1121: called when the Home chat comes into view with the app in front
   * (app foreground, Home opened). Hey Hermes uses it to warm the provider cache
   * of the Home conversation; a host without it does nothing. Fire and forget:
   * the surface never waits for it and nothing it does is shown.
   */
  onHomeChatInFront?: (input: { token: string }) => void;
  /**
   * HPD-1121 (Justus, 2026-10-09): called on every change of a non-empty draft
   * in the Home chat while it is in front, with the newest Home message time.
   * The host decides whether to warm (Hey: three quiet minutes). Fire and forget.
   */
  onHomeChatTyping?: (input: { token: string; lastMessageAt: string | null }) => void;
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
    /**
     * HPD-1466: the chat measures its own position in the window and keeps the
     * composer right above the keyboard on every device and orientation. When
     * true, keyboardVerticalOffset is not used for the chat.
     */
    keyboardOffsetFromWindow?: boolean;
    openingMode?: "brand" | "chat";
    openingStatus?: string;
    showAssistantIdentity?: boolean;
    /**
     * HPD-1442: the host's own figure for Hermes in the chat. When set, it
     * replaces the dragon and the brand icon on the chat surface: the name mark
     * above a reply, the working mark beside the live status, the opening line,
     * the drawer and live voice brand, and one small mark per background task
     * (drawn for that task's own thread). Without it nothing changes (Hey).
     */
    assistantAvatar?: ComponentType<NativeR8AssistantAvatarProps>;
    /**
     * HPD-1466: for a host that shows the chat as one entry of its own list
     * (HODL Bots). When set, the chat has no left menu and no menu button: the
     * header is one row with a back arrow on the left (it calls `onPress`;
     * from a page other than the chat it returns to the chat first), the
     * assistant mark with the thread's name, and "..." on the right. In the
     * Home chat "..." lists everything the left menu offered (Pages, New App or
     * Page, Suggestions, Automations, Connections, AI Access, Account, Support,
     * Privacy, Hermes dashboard); an automation thread keeps its own options.
     * Without it nothing changes (Hey keeps its menu). `button` lets the host
     * draw every back control of the chat in its own look (HODL: HPD-1440's
     * round back button); without it a plain chevron is drawn.
     */
    headerBack?: {
      onPress: () => void;
      accessibilityLabel: string;
      button?: ComponentType<{ onPress: () => void; accessibilityLabel: string }>;
    };
    /**
     * HPD-1515 (Justus, 2026-10-23, HODL 10.0.1): with headerBack only. The
     * header row's name for the Home chat (HODL and LiveQuote: "Home"). Other
     * threads keep their own titles and every other place keeps productName;
     * without it the Home chat is named productName as before (Hey).
     */
    homeChatTitle?: string;
    sessionFailure?: {
      title: string;
      body: string;
      retryLabel: string;
      dismissLabel: string;
    };
  };
  session: NativeR8SessionHost;
  policy: {
    preinstalledRanker: boolean;
    preinstalledEmailScanner: boolean;
    /**
     * HPD-1243: the one switch for Hey on Android. Absent or false: an Android
     * build signs in by email link only and shows no paywall, as before. True:
     * the Google Play paywall, the RevenueCat binding, Google sign-in and the
     * sales status are on for Android. iOS never reads it.
     */
    heyAndroidLaunchEnabled?: boolean;
    /** Hey-only common app entry contract; requires a compatible backend. */
    heyAppEntryGate?: boolean;
  };
  transport: NativeR8Transport;
  platform: NativeR8Platform;
  purchases: {
    mobilePurchasesController: MobilePurchasesController;
    bindMobilePurchasesAccount(accountId: string): ReturnType<MobilePurchasesController["bindAccount"]>;
    isMobilePurchaseCancelled(error: unknown): boolean;
    mobilePurchasesConfiguredForBuild(): boolean;
  };
};
