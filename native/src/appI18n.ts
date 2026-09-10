import { statusPanelCopy } from "../core/status-truth";
import { capabilityStatusCopy } from "../core/capability-copy";
import {
  appLocales,
  defaultAppLocale,
  type AdminHandoverStatus,
  type AppLocale,
  type AuditProofBatch,
  type CloudInfrastructureEventSeverity,
  type StandingAccessStatus,
  type SupportGrantStatus,
} from "../core/index";
import type { RankedTaskSource, RankedTaskStatus } from "../core/ranked-tasks";
import type { RankedTaskRowActionId } from "../core/ranked-task-list-view";
import type {
  GuidedSetupConnectionId,
  GuidedSetupConnectionStatus,
} from "../core/guided-setup";
import type { PluginCatalogScreenCopy } from "./plugin-catalog-copy";

type AuditProofBatchStatus = AuditProofBatch["status"];

export type MobileSystemPagesCopy = {
  common: {
    dismiss: string;
  };
  dashboard: {
    opening: string;
    error: string;
    retry: string;
  };
  automations: {
    title: string;
    description: string;
    refresh: string;
    loadError: string;
    add: string;
    addPrompt: string;
    loaded: string;
    emptyTitle: string;
    emptyBody: string;
    active: string;
    paused: string;
    unknown: string;
    next: string;
    noNext: string;
    delivery: string;
    result: {
      never: string;
      pending: string;
      stored: string;
      failed: string;
      not_stored: string;
    };
    chat: string;
    chatAbout: string;
    chatPrompt: string;
    editPrompt: string;
    /** HPD-463: one card for every automation, so one set of words for it. */
    edit: string;
    standard: string;
    reset: string;
    resetConfirm: string;
    pause: string;
    resume: string;
    delete: string;
    deleteConfirmTitle: string;
    deleteConfirmMessage: string;
    deleteConfirm: string;
    deleteCancel: string;
    versions: string;
    versionsHide: string;
    activeVersion: string;
    restore: string;
    restoreConfirm: string;
    reinstall: string;
    reinstallConfirm: string;
    schedule: {
      daily: string;
      everyDays: string;
      weekdays: string;
      monthly: string;
      hourly: string;
      everyHours: string;
      everyMinutes: string;
      once: string;
      unknown: string;
      and: string;
    };
  };
  tasks: {
    title: string;
    empty: string;
    pendingTitle: string;
    loading: string;
    loadError: string;
    changeError: string;
    about: string;
    aboutSentence: string;
    aboutClose: string;
  };
  account: {
    ownerTitle: string;
    memberTitle: string;
    monthlyBudget: string;
    allowanceUnavailable: string;
    allowanceRemaining: string;
    unavailable: string;
    used: string;
    yourDataTitle: string;
    yourDataDetail: string;
    exportData: string;
    exportPreparing: string;
    exportOpened: string;
    signInMethods: string;
    signInDetail: string;
    linkGoogle: string;
    capacity: string;
    name: string;
    email: string;
    creating: string;
    createError: string;
    invite: string;
    disabling: string;
    disableError: string;
    resetting: string;
    resetError: string;
    detailsLoading: string;
    roleOwner: string;
    roleMember: string;
    statusActive: string;
    statusDisabled: string;
    lastSignIn: string;
    notYet: string;
    resetAccess: string;
    disableAccess: string;
    created: string;
    preparedWorkspace: string;
    runtimeReady: string;
    runtimeAttention: string;
    runtimeStarts: string;
    oneTimeCode: string;
    disabled: string;
    reset: string;
    updatedAccount: string;
    archive: string;
    archiveQueued: string;
    archiveFailed: string;
    recentExports: string;
    noExports: string;
    exportRequested: string;
    exportCompleted: string;
    download: string;
    downloadFailed: string;
    exportKind: Readonly<Record<"export" | "archive", string>>;
    exportStatus: Readonly<Record<"queued" | "running" | "completed" | "failed" | "cancelled", string>>;
    restoreTitle: string;
    restoreDetail: string;
    restoreAsk: string;
    restorePrompt: string;
    deletion: {
      confirmTitle: string;
      confirmBody: string;
      keep: string;
      delete: string;
      title: string;
      description: string;
      credentialPlaceholder: string;
      credentialLabel: string;
      recentSignInHint: string;
      confirmationLabel: string;
      deleting: string;
      reauthenticationError: string;
      confirmationError: string;
      genericError: string;
      deleted: string;
      purged: string;
      purgePending: string;
      subscriptionKept: string;
    };
  };
  /**
   * HPD-411: the browser's Security & Access panel, word for word on the
   * phone. Status words that come from the server (`not_started`,
   * `none_detected`) stay as the server says them, exactly as the browser
   * prints them — a translated status would be a different claim.
   */
  security: {
    title: string;
    description: string;
    anchorPending: string;
    stateRow: string;
    privacyPromise: string;
    privacyDetailsOpen: string;
    privacyWhere: string;
    privacyLink: string;
    serverWorkspace: string;
    serverIpv4: string;
    serverType: string;
    serverSince: string;
    accessTitle: string;
    accessNone: string;
    accessGrantedByYou: string;
    accessAutomatic: string;
    accessManual: string;
    accessNeverUsed: string;
    accessUsed: string;
    accessEnded: string;
    adminTitle: string;
    handover: string;
    customerControlledSince: string;
    pending: string;
    adminKey: string;
    customerKey: string;
    keyNotRegistered: string;
    standingAccess: string;
    noneDetected: string;
    lastBaselineCheck: string;
    notChecked: string;
    adminDetail: string;
    keyLabelPlaceholder: string;
    keyPlaceholder: string;
    saveAdminKey: string;
    adminKeySaved: string;
    adminKeyFailed: string;
    runHandover: string;
    handoverChecked: string;
    handoverFailed: string;
    supportTitle: string;
    supportDetail: string;
    activeGrants: string;
    none: string;
    noGrants: string;
    grantCodeHint: string;
    grantExpires: string;
    grantScopes: string;
    grantLastUsed: string;
    grantRevoked: string;
    revokeGrant: string;
    revokeDone: string;
    revokeFailed: string;
    openSupport: string;
    infrastructureTitle: string;
    exceptionalEvents: string;
    unmatchedEvents: string;
    latestEvent: string;
    noEvents: string;
    latestEventHash: string;
    noReceipt: string;
    latestSealedBatch: string;
    notSealed: string;
    wormRetentionUntil: string;
    externalAnchor: string;
    notAnchored: string;
    externalAnchorFallback: string;
    viewAnchor: string;
    anchorOpenFailed: string;
    infrastructureDetail: string;
    downloadReceipt: string;
    receiptShared: string;
    receiptFailed: string;
  };
  aiAccess: {
    title: string;
    description: string;
    current: string;
    currentUnavailable: string;
    none: string;
    chatGpt: string;
    claude: string;
    included: string;
    connected: string;
    notConnected: string;
    statusUnavailable: string;
    working: string;
    resultSuccess: string;
    resultCancelled: string;
    resultProviderError: string;
    resultLinkError: string;
    resultUnknown: string;
    includedUnavailableAction: string;
    chatGptDetail: string;
    claudeDetail: string;
    includedDetail: string;
    allowanceLoading: string;
    allowanceRemaining: string;
    includedModelUnavailable: string;
    connectChatGpt: string;
    reconnectChatGpt: string;
    connectClaude: string;
    reconnectClaude: string;
    chatGptComplete: string;
    chatGptSteps: string;
    copyChatGptCode: string;
    openSignIn: string;
    checkStatus: string;
    claudeComplete: string;
    claudeCodeHint: string;
    claudeCodePlaceholder: string;
    completeConnection: string;
    cancel: string;
    otherConnection: string;
    otherConnectionPrompt: string;
    oauthUsageTruth: string;
    saved: string;
    savedUnconfirmed: string;
    saveFailed: string;
    claudeStarted: string;
    claudeConnected: string;
    claudeFailed: string;
  };
  plugins: PluginCatalogScreenCopy & {
    loading: string;
    loadError: string;
    operationComplete: string;
    webhookRequested: string;
    actionError: string;
    confirmTitle: string;
    confirmBody: string;
    cancel: string;
    confirm: string;
  };
};

type MobileCopy = {
  short: string;
  name: string;
  nav: {
    chat: string;
    pages: string;
    plugins: string;
    tasks: string;
    automations: string;
    capabilities: string;
    settings: string;
    aiAccess: string;
    account: string;
    support: string;
    dashboard: string;
    signOut: string;
    openMenu: string;
    closeMenu: string;
    back: string;
    appearance: string;
    system: string;
    light: string;
    dark: string;
    remove: string;
    removeHint: string;
    removeConfirmTitle: string;
    removeConfirmMessage: string;
    removeCancel: string;
    removePending: string;
    removeFailed: string;
    owner: string;
    private: string;
  };
  settings: {
    title: string;
    back: string;
    overview: string;
    overviewHint: string;
    account: string;
    accountHint: string;
    connections: string;
    connectionsHint: string;
    support: string;
    supportHint: string;
    privacy: string;
    privacyHint: string;
    diagnostics: string;
    diagnosticsHint: string;
    language: string;
  };
  chat: {
    title: string;
    placeholder: string;
    emptyTitle: string;
    emptyReady: string;
    startFresh: string;
    typing: string;
    activity: Readonly<Record<"needsAttention" | "stopped" | "waitingForYou" | "writing" | "gettingReady" | "working", string>>;
    waiting: string;
    routeNeedsAttention: string;
    startVoiceNote: string;
    stopVoiceNote: string;
    sendVoiceNote: string;
    recording: string;
    transcribing: string;
    retryVoiceNote: string;
    discardVoiceNote: string;
    copyMessage: string;
    copyMessageHint: string;
    cancel: string;
    messageCopied: string;
    messageCopyFailed: string;
    messageTime: string;
    failedNotSentTitle: string;
    failedNoAnswerTitle: string;
    failedRetry: string;
    failedRetryHint: string;
    failedDismiss: string;
  };
  firstConversation: {
    greetingTitle: string;
    greetingBody: string;
    connectionTitle: string;
    connectionBody: string;
    connectionSkip: string;
    guidedSetup: {
      open: string;
      connectGmail: string;
      notNow: string;
      noThanks: string;
      decline: string;
      choiceSaveError: string;
      skipError: string;
      labels: Record<GuidedSetupConnectionId, string>;
      statuses: Record<GuidedSetupConnectionStatus, string>;
    };
  };
  systemPages: MobileSystemPagesCopy;
};

export type MobilePendingAccessCopy = {
  title: string;
  body: string;
  checkAgain: string;
  signOut: string;
};

const pendingAccessCopyByLocale: Record<AppLocale, MobilePendingAccessCopy> = {
  en: {
    title: "Your access is being prepared",
    body: "Your Hey Hermes account is ready. We’ll activate your access shortly. Please check again in a little while.",
    checkAgain: "Check again",
    signOut: "Sign out",
  },
  de: {
    title: "Dein Zugang wird vorbereitet",
    body: "Dein Hey-Hermes-Account ist bereit. Wir schalten Deinen Zugang in Kürze frei. Bitte prüfe es gleich noch einmal.",
    checkAgain: "Erneut prüfen",
    signOut: "Abmelden",
  },
  fr: {
    title: "Votre accès est en cours de préparation",
    body: "Votre compte Hey Hermes est prêt. Nous activerons bientôt votre accès. Veuillez réessayer dans quelques instants.",
    checkAgain: "Vérifier à nouveau",
    signOut: "Se déconnecter",
  },
  es: {
    title: "Estamos preparando tu acceso",
    body: "Tu cuenta de Hey Hermes está lista. Activaremos tu acceso en breve. Vuelve a comprobarlo dentro de un momento.",
    checkAgain: "Comprobar de nuevo",
    signOut: "Cerrar sesión",
  },
  it: {
    title: "Stiamo preparando il tuo accesso",
    body: "Il tuo account Hey Hermes è pronto. Attiveremo il tuo accesso a breve. Controlla di nuovo tra poco.",
    checkAgain: "Controlla di nuovo",
    signOut: "Esci",
  },
  "pt-BR": {
    title: "Seu acesso está sendo preparado",
    body: "Sua conta do Hey Hermes está pronta. Ativaremos seu acesso em breve. Verifique novamente daqui a pouco.",
    checkAgain: "Verificar novamente",
    signOut: "Sair",
  },
  ja: {
    title: "アクセスを準備しています",
    body: "Hey Hermes アカウントの準備ができました。まもなくアクセスを有効にします。しばらくしてからもう一度ご確認ください。",
    checkAgain: "もう一度確認",
    signOut: "サインアウト",
  },
  ko: {
    title: "액세스를 준비하고 있습니다",
    body: "Hey Hermes 계정이 준비되었습니다. 곧 액세스를 활성화할 예정입니다. 잠시 후 다시 확인해 주세요.",
    checkAgain: "다시 확인",
    signOut: "로그아웃",
  },
};

export function mobilePendingAccessCopy(locale: AppLocale): MobilePendingAccessCopy {
  return pendingAccessCopyByLocale[locale];
}

type NavigationRemovalCopy = Pick<MobileCopy["nav"],
  | "removeHint"
  | "removeConfirmTitle"
  | "removeConfirmMessage"
  | "removeCancel"
  | "removePending"
  | "removeFailed"
>;

const navigationRemovalCopy: Record<AppLocale, NavigationRemovalCopy> = {
  en: {
    removeHint: "Swipe left or long-press to unpin this entry.",
    removeConfirmTitle: "Unpin this entry?",
    removeConfirmMessage: "This removes {title} from navigation. Its underlying content stays available.",
    removeCancel: "Cancel",
    removePending: "Unpinning…",
    removeFailed: "This entry could not be unpinned.",
  },
  de: {
    removeHint: "Nach links wischen oder lange drücken, um diesen Eintrag zu lösen.",
    removeConfirmTitle: "Diesen Eintrag lösen?",
    removeConfirmMessage: "Dadurch wird {title} nur aus der Navigation entfernt. Die zugrunde liegenden Inhalte bleiben erhalten.",
    removeCancel: "Abbrechen",
    removePending: "Wird gelöst…",
    removeFailed: "Dieser Eintrag konnte nicht gelöst werden.",
  },
  fr: {
    removeHint: "Balayez vers la gauche ou appuyez longuement pour détacher cette entrée.",
    removeConfirmTitle: "Détacher cette entrée ?",
    removeConfirmMessage: "Cela retire {title} de la navigation uniquement. Son contenu reste disponible.",
    removeCancel: "Annuler",
    removePending: "Détachement…",
    removeFailed: "Cette entrée n’a pas pu être détachée.",
  },
  es: {
    removeHint: "Desliza a la izquierda o mantén pulsado para desfijar esta entrada.",
    removeConfirmTitle: "¿Desfijar esta entrada?",
    removeConfirmMessage: "Esto solo quita {title} de la navegación. Su contenido sigue disponible.",
    removeCancel: "Cancelar",
    removePending: "Desfijando…",
    removeFailed: "No se pudo desfijar esta entrada.",
  },
  it: {
    removeHint: "Scorri a sinistra o tieni premuto per rimuovere questa voce dalla navigazione.",
    removeConfirmTitle: "Rimuovere questa voce?",
    removeConfirmMessage: "Questo rimuove solo {title} dalla navigazione. I contenuti restano disponibili.",
    removeCancel: "Annulla",
    removePending: "Rimozione…",
    removeFailed: "Non è stato possibile rimuovere questa voce.",
  },
  "pt-BR": {
    removeHint: "Deslize para a esquerda ou mantenha pressionado para desafixar esta entrada.",
    removeConfirmTitle: "Desafixar esta entrada?",
    removeConfirmMessage: "Isso remove apenas {title} da navegação. O conteúdo continua disponível.",
    removeCancel: "Cancelar",
    removePending: "Desafixando…",
    removeFailed: "Não foi possível desafixar esta entrada.",
  },
  ja: {
    removeHint: "左にスワイプするか長押しして、この項目のピン留めを解除します。",
    removeConfirmTitle: "この項目のピン留めを解除しますか？",
    removeConfirmMessage: "ナビゲーションから{title}のみを外します。元のコンテンツは引き続き利用できます。",
    removeCancel: "キャンセル",
    removePending: "ピン留めを解除中…",
    removeFailed: "この項目のピン留めを解除できませんでした。",
  },
  ko: {
    removeHint: "왼쪽으로 쓸어 넘기거나 길게 눌러 이 항목의 고정을 해제합니다.",
    removeConfirmTitle: "이 항목의 고정을 해제할까요?",
    removeConfirmMessage: "탐색 메뉴에서 {title} 항목만 제거합니다. 원본 콘텐츠는 계속 사용할 수 있습니다.",
    removeCancel: "취소",
    removePending: "고정 해제 중…",
    removeFailed: "이 항목의 고정을 해제하지 못했습니다.",
  },
};

const pluginItemsEn: PluginCatalogScreenCopy["items"] = {
  calendar: { description: "Use Google Calendar events from this workspace.", setupHint: "Continue through the existing protected Google setup.", permissions: ["Calendar access"], searchTerms: ["calendar", "google", "events"] },
  google_drive: { description: "Use Google Drive files from this workspace.", setupHint: "Continue through the existing protected Google setup.", permissions: ["Drive file access"], searchTerms: ["drive", "google", "files"] },
  discord: { description: "Ask Hermes to guide a bounded Discord bot or webhook setup.", setupHint: "One tap sends a fixed, secret-free setup request to the home chat.", permissions: ["Sending the setup request grants no permission"], searchTerms: ["messaging", "bot", "server"] },
  gmail: { description: "Read and organize mail with your permission.", setupHint: "Authorize this workspace through Google OAuth.", permissions: ["Read mail metadata and message content"], searchTerms: ["email", "google", "inbox"] },
  google_workspace: { description: "Use calendars and Drive files from this workspace.", setupHint: "Enter Google app details only in the protected setup, then run Check.", permissions: ["Calendar access", "Drive file access"], searchTerms: ["calendar", "drive", "google", "events", "files"] },
  telegram: { description: "Talk to Hermes through a workspace-bound Telegram bot.", setupHint: "Follow the guided bot setup and send a test message.", permissions: ["Receive messages sent to the configured bot", "Send replies through that bot"], searchTerms: ["messaging", "bot", "chat"] },
  whatsapp: { description: "Connect a WhatsApp Cloud number through the guided setup.", setupHint: "Finish the protected credential and webhook steps, then run Check.", permissions: ["Receive routed messages", "Send replies through the configured number"], searchTerms: ["meta", "messaging", "cloud api"] },
  skills_hub: { description: "Review and install a declared Hermes skill from its exact source.", setupHint: "Review source and scan results before a separate install or enable action.", permissions: ["Permissions vary by skill and are shown before installation"], searchTerms: ["skill", "hub", "install", "trust"] },
  local_plugins: { description: "Inspect declared local plugins without exposing runtime paths or raw configuration.", setupHint: "Review source, version, declarations, and trust result before enabling.", permissions: ["Declared tools, hooks, and commands are reviewed before activation"], searchTerms: ["plugin", "local", "hooks", "commands"] },
  browser: { description: "Use the browser toolset included in the pinned Hermes runtime.", setupHint: "Check the pinned runtime inventory and live browser capability.", permissions: ["Website access requested by the user"], searchTerms: ["web", "browse", "automation"] },
  webhooks: { description: "Prepare a bounded inbound or outbound service callback.", setupHint: "Use the protected setup; secrets never enter chat.", permissions: ["Service, purpose, scopes, callback, test plan, and disconnect plan"], searchTerms: ["callback", "http", "events", "integration"] },
  slack: { description: "Ask Hermes to guide the approved Slack connection path.", setupHint: "One tap sends a fixed, secret-free setup request in Home Chat.", permissions: ["No permission is granted by sending the setup request"], searchTerms: ["messaging", "workspace", "chat"] },
  stripe: { description: "Ask Hermes to plan a bounded Stripe setup without moving money.", setupHint: "One tap sends a fixed, secret-free setup request in Home Chat.", permissions: ["No permission is granted by sending the setup request"], searchTerms: ["billing", "payments", "finance"] },
};

const pluginsEn: MobileSystemPagesCopy["plugins"] = {
  title: "Connections", description: "Connect tools and services to this workspace.", searchPlaceholder: "Search connections", yours: "Your connections", all: "All connections", empty: "No connections match this search.", close: "Close", source: "Official source", tools: "Tools", skills: "Skills", permissions: "Permissions", setup: "Setup", working: "Working…",
  statusLabels: { available: "Add", authorization_required: "Authorize", setup_incomplete: "Finish setup", added: "Added", attention: "Needs attention" },
  connectionStatusLabels: { available: "Available", authorization_required: "Authorization required", setup_incomplete: "Setup incomplete", unknown: "Unknown", unavailable: "Unavailable", connected: "Connected", attention: "Needs attention" },
  statusDetails: { available: "Available for this workspace.", authorization_required: "Authorization is still required.", setup_incomplete: "Setup is not complete yet.", added: "Available in this workspace.", attention: "The current evidence needs attention." },
  actionLabels: { add: "Add", authorize: "Authorize", finish_setup: "Finish setup", probe: "Check", disconnect: "Manage", repair: "Repair", review_source: "Review source", confirm_review: "Confirm review", install: "Open install", activate: "Open activation", enable: "Open enablement", send_setup_request: "Ask Hermes" },
  items: pluginItemsEn,
  partialStatus: "Some connection statuses could not be refreshed. Available results are shown; affected setup actions stay unavailable until the catalog recovers.", loading: "Loading connections…", loadError: "Connections are not reachable right now.", operationComplete: "The connection status was updated.", webhookRequested: "Webhook setup was requested. No provider or secret was changed.", actionError: "The connection action could not be completed.", confirmTitle: "Confirm source review", confirmBody: "Confirm that you reviewed the exact pinned source, permissions, and trust information for this workspace.", cancel: "Cancel", confirm: "Confirm",
};

const systemPagesEn: MobileSystemPagesCopy = {
  common: { dismiss: "Dismiss this notice" },
  dashboard: { opening: "Opening Hermes dashboard…", error: "Hermes dashboard could not be opened.", retry: "Try again" },
  automations: { title: "Automations", description: "Reminders and scheduled jobs saved in Hermes.", refresh: "Refresh automations", loadError: "Automations could not be loaded.", add: "Add automation", addPrompt: "Help me create a new Hermes automation. Ask what should happen, when it should run, which timezone and delivery channel to use, then create it through the normal Hermes reminder or cron path after I confirm the details.", loaded: "{count} automations loaded.", emptyTitle: "No automations yet", emptyBody: "Use Add automation to ask Hermes to create a reminder or scheduled job.", active: "Active", paused: "Paused", unknown: "Unknown", next: "Next", noNext: "Next run not shown", delivery: "Delivery", result: { never: "No result saved yet", pending: "Result pending", stored: "Last result saved", failed: "Last run failed", not_stored: "Last run saved no result" }, chat: "Chat", chatAbout: "Chat about {title}", chatPrompt: "Tell me about this Hermes automation: {title} ({id}). Show its schedule, status, delivery and purpose, and answer my questions about it. Change nothing unless I ask for it.", edit: "Edit", standard: "Standard", reset: "Reset to standard", resetConfirm: "Confirm reset", pause: "Pause", resume: "Resume", delete: "Delete", deleteConfirmTitle: "Delete this automation?", deleteConfirmMessage: "{title} will be deleted and will not run again. This cannot be undone.", deleteConfirm: "Delete", deleteCancel: "Keep it", versions: "Version history", versionsHide: "Hide version history", activeVersion: "In use", restore: "Restore", restoreConfirm: "Confirm restore", reinstall: "Restore", reinstallConfirm: "Confirm restore", schedule: { daily: "daily", everyDays: "every {count} days", weekdays: "{weekdays}", monthly: "monthly on the {days}", hourly: "hourly at minute {minute}", everyHours: "every {count} hours", everyMinutes: "every {count} minutes", once: "once on {date}", unknown: "Schedule saved in Hermes", and: " and " }, editPrompt: "Help me edit this Hermes automation: {title} ({id}). First show the current schedule, status, delivery channel, and purpose. Then ask what I want to change, and only update the normal Hermes cron or reminder after I confirm the final details." },
  tasks: { title: "Tasks", empty: "No tasks have been collected yet.", pendingTitle: "Not ranked yet", loading: "Loading ranked tasks…", loadError: "The ranked task inventory is unavailable right now.", changeError: "That change could not be saved.", about: "About this order", aboutSentence: "This order comes from the last ranking run over your Kanban tasks.", aboutClose: "Close" },
  account: { ownerTitle: "People", memberTitle: "Your account", monthlyBudget: "Monthly model budget", allowanceUnavailable: "Current allowance status is unavailable.", allowanceRemaining: "{percent}% of the included allowance remains.", unavailable: "Unavailable", used: "{percent}% used", yourDataTitle: "Your data", yourDataDetail: "Download everything Hey Hermes keeps for you: chats, tasks, workspace files and settings.", exportData: "Export your data", exportPreparing: "Preparing…", exportOpened: "Your export opened in the browser. Save it from there.", signInMethods: "Sign-in methods", signInDetail: "Link a provider only while signed in to this exact Hey account. Matching email addresses never link accounts.", linkGoogle: "Link Google", capacity: "{active}/{capacity} accounts are active. Removing access keeps saved workspace data.", name: "Name", email: "Email", creating: "Creating account…", createError: "The account could not be created.", invite: "Invite person", disabling: "Disabling account…", disableError: "The account could not be disabled.", resetting: "Resetting account code…", resetError: "The account code could not be reset.", detailsLoading: "Account details are loading.", roleOwner: "Owner", roleMember: "Member", statusActive: "Active", statusDisabled: "Disabled", lastSignIn: "Last sign-in", notYet: "not yet", resetAccess: "Reset access for {name}", disableAccess: "Disable {name}", created: "Created {email}.", preparedWorkspace: "A prepared workspace was assigned.", runtimeReady: "Runtime ready.", runtimeAttention: "Runtime needs attention.", runtimeStarts: "Runtime starts automatically when used.", oneTimeCode: "One-time code: {code}", disabled: "{email} is disabled. Workspace data is preserved.", reset: "Reset {email}.", updatedAccount: "{email} was updated.", archive: "Create full archive", archiveQueued: "Full archive queued. It appears in the list below when it is ready.", archiveFailed: "The full archive could not be queued.", recentExports: "Recent exports", noExports: "No exports have been created yet.", exportRequested: "Requested", exportCompleted: "completed", download: "Download", downloadFailed: "This export could not be opened.", exportKind: { export: "Data export", archive: "Full archive" }, exportStatus: { queued: "Queued", running: "Running", completed: "Completed", failed: "Failed", cancelled: "Cancelled" }, restoreTitle: "Restore", restoreDetail: "Restoring data can overwrite private data with an older copy. Start with Support so the exact action is confirmed first.", restoreAsk: "Ask Support about restore", restorePrompt: "I need help with a Hey Hermes restore request. Please ask which export, archive, or date I mean, explain what can be restored safely, and do not overwrite live data until I explicitly approve the exact restore plan.", deletion: { confirmTitle: "Delete this Hey Hermes account?", confirmBody: "Your Hey sessions and grants are revoked immediately and your active Hey data is deleted. This cannot be undone.\n\nThis does not cancel your App Store subscription, and it does not touch any other product account or your email address.", keep: "Keep account", delete: "Delete account", title: "Delete this Hey account", description: "Reauthenticate, then confirm. This revokes your Hey sessions and grants and deletes your active Hey data. Cancelling your subscription is separate, and no other product account is affected.", credentialPlaceholder: "Password or access code", credentialLabel: "Password or access code for account deletion", recentSignInHint: "Leave blank only if you signed in with Apple or Google in the last few minutes.", confirmationLabel: "Type {phrase} to confirm", deleting: "Deleting…", reauthenticationError: "That password or access code did not match. If you signed in with Apple or Google, sign in again and retry.", confirmationError: "Type {phrase} exactly to confirm.", genericError: "The account could not be deleted. Nothing was changed.", deleted: "Hey Hermes account deleted. Receipt {receipt}.", purged: "Your active Hey data has been deleted.", purgePending: "Your active Hey data will be deleted by {date}.", subscriptionKept: "Your App Store subscription was not cancelled." } },
  security: {
    title: "Security & Access",
    description: "Control-plane access, support grants, and infrastructure exceptions for this private Hermes server.",
    anchorPending: "anchor pending",
    stateRow: "Current state",
    privacyPromise: "Your data sits on your own server and belongs to you.",
    privacyDetailsOpen: "What that means",
    privacyWhere: "Hey Hermes keeps your server running — updates, restarts, backups. That needs standing access; without it the server would not run. We do not look at your conversations, tasks or files. That is our undertaking, not a technical barrier. What you grant yourself is listed below, with date, scope and duration.",
    privacyLink: "Privacy Policy",
    serverWorkspace: "Workspace",
    serverIpv4: "Public IPv4",
    serverType: "Server",
    serverSince: "In service since",
    accessTitle: "Access you granted",
    accessNone: "No access so far.",
    accessGrantedByYou: "granted by you",
    accessAutomatic: "automatic",
    accessManual: "by hand",
    accessNeverUsed: "never used",
    accessUsed: "used",
    accessEnded: "ended",
    adminTitle: "Admin access",
    handover: "Handover",
    customerControlledSince: "Customer-controlled since",
    pending: "Pending",
    adminKey: "Admin key",
    customerKey: "Customer key",
    keyNotRegistered: "Not registered",
    standingAccess: "Hey Hermes SSH/root login",
    noneDetected: "none detected",
    lastBaselineCheck: "Last baseline check",
    notChecked: "Not checked",
    adminDetail: "Hey Hermes does not keep a standing SSH/root login after handover. Infrastructure-level recovery can still be performed in emergencies because your server runs in the Hey Hermes Hetzner account. Those exceptional events are shown here.",
    keyLabelPlaceholder: "Key label, e.g. Justus MacBook",
    keyPlaceholder: "ssh-ed25519 AAAA...",
    saveAdminKey: "Save admin key",
    adminKeySaved: "Admin key saved. Handover can run during provisioning or from this screen.",
    adminKeyFailed: "Admin key could not be saved.",
    runHandover: "Run handover check",
    handoverChecked: "Handover check completed. The status above is refreshed.",
    handoverFailed: "Handover check could not run.",
    supportTitle: "Support",
    supportDetail: "Temporary support access is granted on the Support screen. What was granted, for how long, and with which scopes is listed here.",
    activeGrants: "Active grants",
    none: "None",
    noGrants: "No support grants active or past.",
    grantCodeHint: "Code hint",
    grantExpires: "Expires",
    grantScopes: "Scopes",
    grantLastUsed: "Last used",
    grantRevoked: "Revoked",
    revokeGrant: "Revoke this support grant",
    revokeDone: "Support grant revoked.",
    revokeFailed: "The support grant could not be revoked.",
    openSupport: "Open Support",
    infrastructureTitle: "Infrastructure",
    exceptionalEvents: "Exceptional events",
    unmatchedEvents: "Unmatched events",
    latestEvent: "Latest event",
    noEvents: "None",
    latestEventHash: "Latest event hash",
    noReceipt: "No receipt yet",
    latestSealedBatch: "Latest sealed batch",
    notSealed: "Not sealed",
    wormRetentionUntil: "WORM retention until",
    externalAnchor: "External anchor",
    notAnchored: "Not anchored yet",
    externalAnchorFallback: "external",
    viewAnchor: "View external anchor",
    anchorOpenFailed: "The external anchor could not be opened.",
    infrastructureDetail: "These records are evidence about Hey Hermes infrastructure and support access. They do not limit what you can do inside your private Hermes server.",
    downloadReceipt: "Download receipt",
    receiptShared: "Security audit receipt prepared. It is evidence only, not a restriction on your private Hermes server.",
    receiptFailed: "Security audit receipt could not be prepared.",
  },
  aiAccess: { title: "AI Access", description: "Choose one standard route for this workspace.", current: "Current AI access", currentUnavailable: "Current AI access could not be confirmed.", none: "No AI connection", chatGpt: "ChatGPT OAuth", claude: "Claude OAuth", included: "Included AI", connected: "Connected", notConnected: "Not connected", statusUnavailable: "Status unavailable", working: "Working…", resultSuccess: "Connected and selected.", resultCancelled: "Sign-in cancelled. Nothing changed.", resultProviderError: "Provider sign-in could not start. Try again.", resultLinkError: "Sign-in is ready, but iOS could not open it. Tap Open sign-in.", resultUnknown: "Connection is not confirmed yet. Finish sign-in, then check again.", includedUnavailableAction: "Included AI is not confirmed for this workspace. Refresh, then try again.", chatGptDetail: "Use your ChatGPT account through OAuth.", claudeDetail: "Use your Claude account through OAuth. It spends your Claude account's extra usage budget, not your plan allowance, so extra usage has to be switched on.", includedDetail: "Use the managed allowance included with your plan.", allowanceLoading: "The included allowance is being confirmed. No remaining value is guessed.", allowanceRemaining: "{percent}% of the included allowance remains.", includedModelUnavailable: "The current included model is not available.", connectChatGpt: "Connect ChatGPT", reconnectChatGpt: "Reconnect or change ChatGPT", connectClaude: "Connect Claude", reconnectClaude: "Reconnect or change Claude", chatGptComplete: "Finish ChatGPT connection", chatGptSteps: "1. Open sign-in. 2. Enter this code. 3. Check status.", copyChatGptCode: "Copy the ChatGPT code", openSignIn: "Open sign-in", checkStatus: "Check status", claudeComplete: "Finish Claude connection", claudeCodeHint: "Paste the code returned by Claude here.", claudeCodePlaceholder: "Claude authorization code", completeConnection: "Complete connection", cancel: "Cancel", otherConnection: "Add another AI connection", otherConnectionPrompt: "Help me understand another AI connection for this workspace. Ask what I want to connect, explain the safe supported path, and do not change any provider or credential without my explicit confirmation.", oauthUsageTruth: "Provider percentages appear only when the provider supplies authoritative usage data.", saved: "Selection saved. It applies from the next run.", savedUnconfirmed: "Selection saved, but the current status could not be confirmed. Please reload.", saveFailed: "AI access choice could not be saved.", claudeStarted: "Claude sign-in was opened.", claudeConnected: "Claude is connected.", claudeFailed: "Claude connection could not be completed." },
  plugins: pluginsEn,
};

const pluginItemsDe: PluginCatalogScreenCopy["items"] = {
  calendar: { description: "Nutze Google-Kalender-Termine dieses Workspace.", setupHint: "Folge der bestehenden geschützten Google-Einrichtung.", permissions: ["Kalenderzugriff"], searchTerms: ["Kalender", "Google", "Termine"] },
  google_drive: { description: "Nutze Google-Drive-Dateien dieses Workspace.", setupHint: "Folge der bestehenden geschützten Google-Einrichtung.", permissions: ["Zugriff auf Drive-Dateien"], searchTerms: ["Drive", "Google", "Dateien"] },
  discord: { description: "Bitte Hermes, eine begrenzte Discord-Bot- oder Webhook-Einrichtung zu führen.", setupHint: "Ein Tap sendet eine feste, secret-freie Einrichtungsanfrage an den Home Chat.", permissions: ["Das Senden der Einrichtungsanfrage vergibt keine Berechtigung"], searchTerms: ["Nachrichten", "Bot", "Server"] },
  gmail: { description: "Lies und organisiere E-Mails mit deiner Erlaubnis.", setupHint: "Autorisiere diesen Workspace über Google OAuth.", permissions: ["E-Mail-Metadaten und Nachrichteninhalte lesen"], searchTerms: ["E-Mail", "Google", "Posteingang"] },
  google_workspace: { description: "Nutze Kalender und Drive-Dateien dieses Workspace.", setupHint: "Gib Google-App-Daten nur in der geschützten Einrichtung ein und wähle danach Prüfen.", permissions: ["Kalenderzugriff", "Zugriff auf Drive-Dateien"], searchTerms: ["Kalender", "Drive", "Google", "Termine", "Dateien"] },
  telegram: { description: "Sprich über einen an den Workspace gebundenen Telegram-Bot mit Hermes.", setupHint: "Folge der geführten Bot-Einrichtung und sende eine Testnachricht.", permissions: ["Nachrichten an den eingerichteten Bot empfangen", "Antworten über diesen Bot senden"], searchTerms: ["Nachrichten", "Bot", "Chat"] },
  whatsapp: { description: "Verbinde eine WhatsApp-Cloud-Nummer über die geführte Einrichtung.", setupHint: "Schließe die geschützten Zugangsdaten- und Webhook-Schritte ab und wähle danach Prüfen.", permissions: ["Weitergeleitete Nachrichten empfangen", "Antworten über die eingerichtete Nummer senden"], searchTerms: ["Meta", "Nachrichten", "Cloud API"] },
  skills_hub: { description: "Prüfe und installiere einen deklarierten Hermes-Skill aus seiner exakten Quelle.", setupHint: "Prüfe Quelle und Scan-Ergebnis vor einer separaten Installation oder Aktivierung.", permissions: ["Berechtigungen unterscheiden sich je Skill und werden vor der Installation angezeigt"], searchTerms: ["Skill", "Katalog", "Installation", "Vertrauen"] },
  local_plugins: { description: "Prüfe deklarierte lokale Plugins, ohne Laufzeitpfade oder Rohkonfiguration offenzulegen.", setupHint: "Prüfe Quelle, Version, Deklarationen und Vertrauensnachweis vor der Aktivierung.", permissions: ["Deklarierte Werkzeuge, Hooks und Befehle werden vor der Aktivierung geprüft"], searchTerms: ["Plugin", "lokal", "Hooks", "Befehle"] },
  browser: { description: "Nutze die Browser-Werkzeuge der festgelegten Hermes-Laufzeit.", setupHint: "Prüfe das festgelegte Laufzeitinventar und die aktuelle Browser-Fähigkeit.", permissions: ["Vom Nutzer angeforderter Website-Zugriff"], searchTerms: ["Web", "Browser", "Automation"] },
  webhooks: { description: "Bereite einen klar begrenzten eingehenden oder ausgehenden Dienstaufruf vor.", setupHint: "Nutze die geschützte Einrichtung; Secrets gehören nie in den Chat.", permissions: ["Dienst, Zweck, Umfang, Rückruf, Test- und Trennplan"], searchTerms: ["Rückruf", "HTTP", "Ereignisse", "Integration"] },
  slack: { description: "Bitte Hermes, dich durch den freigegebenen Slack-Verbindungsweg zu führen.", setupHint: "Ein Tap sendet eine feste, secret-freie Einrichtungsanfrage an den Home Chat.", permissions: ["Das Senden der Einrichtungsanfrage vergibt keine Berechtigung"], searchTerms: ["Nachrichten", "Workspace", "Chat"] },
  stripe: { description: "Bitte Hermes, eine begrenzte Stripe-Einrichtung zu planen, ohne Geld zu bewegen.", setupHint: "Ein Tap sendet eine feste, secret-freie Einrichtungsanfrage an den Home Chat.", permissions: ["Das Senden der Einrichtungsanfrage vergibt keine Berechtigung"], searchTerms: ["Abrechnung", "Zahlungen", "Finanzen"] },
};

const systemPagesDe: MobileSystemPagesCopy = {
  common: { dismiss: "Hinweis schließen" },
  dashboard: { opening: "Hermes-Dashboard wird geöffnet…", error: "Das Hermes-Dashboard konnte nicht geöffnet werden.", retry: "Erneut versuchen" },
  automations: { title: "Automationen", description: "In Hermes gespeicherte Erinnerungen und geplante Aufgaben.", refresh: "Automationen aktualisieren", loadError: "Automationen konnten nicht geladen werden.", add: "Automation hinzufügen", addPrompt: "Hilf mir, eine neue Hermes-Automation anzulegen. Frag, was passieren soll, wann sie laufen soll und welche Zeitzone und Zustellung gelten. Lege sie erst über den normalen Hermes-Erinnerungs- oder Cron-Weg an, nachdem ich die Details bestätigt habe.", loaded: "{count} Automationen geladen.", emptyTitle: "Noch keine Automationen", emptyBody: "Mit Automation hinzufügen kannst du Hermes um eine Erinnerung oder geplante Aufgabe bitten.", active: "Aktiv", paused: "Pausiert", unknown: "Unbekannt", next: "Nächster Lauf", noNext: "Nächster Lauf nicht angezeigt", delivery: "Zustellung", result: { never: "Noch kein Ergebnis gespeichert", pending: "Ergebnis steht noch aus", stored: "Letztes Ergebnis gespeichert", failed: "Letzter Lauf fehlgeschlagen", not_stored: "Letzter Lauf speicherte kein Ergebnis" }, chat: "Chat", chatAbout: "Über {title} chatten", chatPrompt: "Erzähl mir von dieser Hermes-Automation: {title} ({id}). Zeige Zeitplan, Status, Zustellung und Zweck und beantworte meine Fragen dazu. Ändere nichts, solange ich nicht darum bitte.", edit: "Bearbeiten", standard: "Standard", reset: "Auf Standard zurücksetzen", resetConfirm: "Zurücksetzen bestätigen", pause: "Pausieren", resume: "Fortsetzen", delete: "Löschen", deleteConfirmTitle: "Diese Automation löschen?", deleteConfirmMessage: "{title} wird gelöscht und läuft nicht mehr. Das lässt sich nicht rückgängig machen.", deleteConfirm: "Löschen", deleteCancel: "Behalten", versions: "Versionsverlauf", versionsHide: "Versionsverlauf schließen", activeVersion: "In Verwendung", restore: "Wiederherstellen", restoreConfirm: "Wiederherstellen bestätigen", reinstall: "Wiederherstellen", reinstallConfirm: "Wiederherstellen bestätigen", schedule: { daily: "täglich", everyDays: "alle {count} Tage", weekdays: "{weekdays}", monthly: "monatlich am {days}", hourly: "stündlich zur Minute {minute}", everyHours: "alle {count} Stunden", everyMinutes: "alle {count} Minuten", once: "einmalig am {date}", unknown: "Zeitplan in Hermes gespeichert", and: " und " }, editPrompt: "Hilf mir, diese Hermes-Automation zu bearbeiten: {title} ({id}). Zeige zuerst Zeitplan, Status, Zustellung und Zweck. Frag dann nach der Änderung und aktualisiere die normale Hermes-Cron- oder Erinnerungsaufgabe erst nach meiner Bestätigung." },
  tasks: { title: "Aufgaben", empty: "Es wurden noch keine Aufgaben gesammelt.", pendingTitle: "Noch nicht gerankt", loading: "Gerankte Aufgaben werden geladen…", loadError: "Die gerankte Aufgabenliste ist derzeit nicht verfügbar.", changeError: "Die Änderung konnte nicht gespeichert werden.", about: "Über diese Reihenfolge", aboutSentence: "Diese Reihenfolge stammt aus dem letzten Ranglisten-Lauf über deine Kanban-Aufgaben.", aboutClose: "Schließen" },
  account: { ownerTitle: "Personen", memberTitle: "Dein Account", monthlyBudget: "Monatliches Modellbudget", allowanceUnavailable: "Der aktuelle Kontingentstatus ist nicht verfügbar.", allowanceRemaining: "{percent}% des enthaltenen Kontingents verbleiben.", unavailable: "Nicht verfügbar", used: "{percent}% verwendet", yourDataTitle: "Deine Daten", yourDataDetail: "Lade alles herunter, was Hey Hermes für dich aufbewahrt: Chats, Aufgaben, Workspace-Dateien und Einstellungen.", exportData: "Daten exportieren", exportPreparing: "Wird vorbereitet…", exportOpened: "Dein Export wurde im Browser geöffnet. Speichere ihn dort.", signInMethods: "Anmeldemethoden", signInDetail: "Verknüpfe einen Provider nur, während du in genau diesem Hey-Account angemeldet bist. Gleiche E-Mail-Adressen verknüpfen keine Accounts.", linkGoogle: "Google verknüpfen", capacity: "{active}/{capacity} Accounts sind aktiv. Beim Entfernen des Zugangs bleiben gespeicherte Workspace-Daten erhalten.", name: "Name", email: "E-Mail", creating: "Account wird erstellt…", createError: "Der Account konnte nicht erstellt werden.", invite: "Person einladen", disabling: "Account wird deaktiviert…", disableError: "Der Account konnte nicht deaktiviert werden.", resetting: "Account-Code wird zurückgesetzt…", resetError: "Der Account-Code konnte nicht zurückgesetzt werden.", detailsLoading: "Account-Details werden geladen.", roleOwner: "Eigentümer", roleMember: "Mitglied", statusActive: "Aktiv", statusDisabled: "Deaktiviert", lastSignIn: "Letzte Anmeldung", notYet: "noch nie", resetAccess: "Zugang für {name} zurücksetzen", disableAccess: "{name} deaktivieren", created: "{email} wurde erstellt.", preparedWorkspace: "Ein vorbereiteter Workspace wurde zugewiesen.", runtimeReady: "Laufzeit bereit.", runtimeAttention: "Die Laufzeit benötigt Aufmerksamkeit.", runtimeStarts: "Die Laufzeit startet bei der ersten Nutzung automatisch.", oneTimeCode: "Einmalcode: {code}", disabled: "{email} ist deaktiviert. Workspace-Daten bleiben erhalten.", reset: "{email} wurde zurückgesetzt.", updatedAccount: "{email} wurde aktualisiert.", archive: "Vollständiges Archiv erstellen", archiveQueued: "Vollständiges Archiv angefordert. Es erscheint unten in der Liste, sobald es fertig ist.", archiveFailed: "Das vollständige Archiv konnte nicht angefordert werden.", recentExports: "Bisherige Exporte", noExports: "Es wurden noch keine Exporte erstellt.", exportRequested: "Angefordert", exportCompleted: "fertig", download: "Herunterladen", downloadFailed: "Dieser Export konnte nicht geöffnet werden.", exportKind: { export: "Datenexport", archive: "Vollständiges Archiv" }, exportStatus: { queued: "In Warteschlange", running: "Läuft", completed: "Fertig", failed: "Fehlgeschlagen", cancelled: "Abgebrochen" }, restoreTitle: "Wiederherstellung", restoreDetail: "Eine Wiederherstellung kann private Daten mit einer älteren Kopie überschreiben. Beginne beim Support, damit die genaue Aktion zuerst bestätigt wird.", restoreAsk: "Support zur Wiederherstellung fragen", restorePrompt: "Ich brauche Hilfe bei einer Wiederherstellung in Hey Hermes. Frag bitte, welchen Export, welches Archiv oder welches Datum ich meine, erkläre, was sich sicher wiederherstellen lässt, und überschreibe keine Live-Daten, bevor ich den genauen Plan ausdrücklich freigegeben habe.", deletion: { confirmTitle: "Diesen Hey-Hermes-Account löschen?", confirmBody: "Deine Hey-Sitzungen und Freigaben werden sofort widerrufen und deine aktiven Hey-Daten gelöscht. Dies kann nicht rückgängig gemacht werden.\n\nDadurch wird dein App-Store-Abonnement nicht gekündigt. Andere Produkt-Accounts und deine E-Mail-Adresse bleiben unberührt.", keep: "Account behalten", delete: "Account löschen", title: "Diesen Hey-Account löschen", description: "Authentifiziere dich erneut und bestätige dann. Dadurch werden deine Hey-Sitzungen und Freigaben widerrufen und deine aktiven Hey-Daten gelöscht. Die Kündigung deines Abonnements ist davon getrennt; andere Produkt-Accounts bleiben unberührt.", credentialPlaceholder: "Passwort oder Zugangscode", credentialLabel: "Passwort oder Zugangscode für die Account-Löschung", recentSignInHint: "Leer lassen nur, wenn du dich in den letzten Minuten mit Apple oder Google angemeldet hast.", confirmationLabel: "Zum Bestätigen {phrase} eingeben", deleting: "Wird gelöscht…", reauthenticationError: "Passwort oder Zugangscode stimmen nicht. Melde dich nach einer Apple- oder Google-Anmeldung erneut an und versuche es noch einmal.", confirmationError: "Gib zur Bestätigung exakt {phrase} ein.", genericError: "Der Account konnte nicht gelöscht werden. Es wurde nichts geändert.", deleted: "Hey-Hermes-Account gelöscht. Beleg {receipt}.", purged: "Deine aktiven Hey-Daten wurden gelöscht.", purgePending: "Deine aktiven Hey-Daten werden bis {date} gelöscht.", subscriptionKept: "Dein App-Store-Abonnement wurde nicht gekündigt." } },
  security: {
    title: "Sicherheit & Zugriff",
    description: "Zugriff auf die Steuerebene, Support-Freigaben und Infrastruktur-Ausnahmen für diesen privaten Hermes-Server.",
    anchorPending: "Anker ausstehend",
    stateRow: "Aktueller Zustand",
    privacyPromise: "Deine Daten liegen auf Deinem eigenen Server und gehören Dir.",
    privacyDetailsOpen: "Was das heißt",
    privacyWhere: "Hey Hermes hält Deinen Server instand — Updates, Neustarts, Sicherungen. Dafür haben wir dauerhaft Zugang; ohne ihn liefe er nicht. Deine Gespräche, Aufgaben und Dateien sehen wir uns nicht an. Das ist unsere Zusage, keine technische Sperre. Was Du selbst freigibst, steht unten — mit Datum, Umfang und Dauer.",
    privacyLink: "Datenschutz",
    serverWorkspace: "Arbeitsbereich",
    serverIpv4: "Öffentliche IPv4",
    serverType: "Server",
    serverSince: "In Betrieb seit",
    accessTitle: "Von Dir freigegebene Zugänge",
    accessNone: "Bisher keine Zugriffe.",
    accessGrantedByYou: "von Dir freigegeben",
    accessAutomatic: "automatisch",
    accessManual: "von Hand",
    accessNeverUsed: "nie benutzt",
    accessUsed: "benutzt",
    accessEnded: "beendet",
    adminTitle: "Admin-Zugriff",
    handover: "Übergabe",
    customerControlledSince: "Kundenkontrolliert seit",
    pending: "Ausstehend",
    adminKey: "Admin-Schlüssel",
    customerKey: "Kundenschlüssel",
    keyNotRegistered: "Nicht hinterlegt",
    standingAccess: "SSH-/root-Login von Hey Hermes",
    noneDetected: "keiner festgestellt",
    lastBaselineCheck: "Letzte Baseline-Prüfung",
    notChecked: "Nicht geprüft",
    adminDetail: "Hey Hermes behält nach der Übergabe keinen dauerhaften SSH-/root-Login. Eine Wiederherstellung auf Infrastruktur-Ebene bleibt im Notfall möglich, weil dein Server im Hetzner-Konto von Hey Hermes läuft. Genau diese Ausnahmefälle stehen hier.",
    keyLabelPlaceholder: "Bezeichnung, z. B. Justus MacBook",
    keyPlaceholder: "ssh-ed25519 AAAA...",
    saveAdminKey: "Admin-Schlüssel speichern",
    adminKeySaved: "Admin-Schlüssel gespeichert. Die Übergabe läuft bei der Einrichtung oder von diesem Bildschirm aus.",
    adminKeyFailed: "Der Admin-Schlüssel konnte nicht gespeichert werden.",
    runHandover: "Übergabe prüfen",
    handoverChecked: "Die Übergabeprüfung ist gelaufen. Der Status oben ist aktualisiert.",
    handoverFailed: "Die Übergabeprüfung konnte nicht laufen.",
    supportTitle: "Support",
    supportDetail: "Zeitlich begrenzter Support-Zugriff wird auf dem Support-Bildschirm freigegeben. Was freigegeben wurde, wie lange und mit welchem Umfang, steht hier.",
    activeGrants: "Aktive Freigaben",
    none: "Keine",
    noGrants: "Keine aktiven oder früheren Support-Freigaben.",
    grantCodeHint: "Code-Hinweis",
    grantExpires: "Läuft ab",
    grantScopes: "Umfang",
    grantLastUsed: "Zuletzt genutzt",
    grantRevoked: "Widerrufen",
    revokeGrant: "Diese Support-Freigabe widerrufen",
    revokeDone: "Support-Freigabe widerrufen.",
    revokeFailed: "Die Support-Freigabe konnte nicht widerrufen werden.",
    openSupport: "Support öffnen",
    infrastructureTitle: "Infrastruktur",
    exceptionalEvents: "Ausnahme-Ereignisse",
    unmatchedEvents: "Nicht zugeordnete Ereignisse",
    latestEvent: "Letztes Ereignis",
    noEvents: "Keine",
    latestEventHash: "Hash des letzten Ereignisses",
    noReceipt: "Noch kein Beleg",
    latestSealedBatch: "Letztes versiegeltes Paket",
    notSealed: "Nicht versiegelt",
    wormRetentionUntil: "WORM-Aufbewahrung bis",
    externalAnchor: "Externer Anker",
    notAnchored: "Noch nicht verankert",
    externalAnchorFallback: "extern",
    viewAnchor: "Externen Anker ansehen",
    anchorOpenFailed: "Der externe Anker konnte nicht geöffnet werden.",
    infrastructureDetail: "Diese Aufzeichnungen sind Belege über die Infrastruktur und den Support-Zugriff von Hey Hermes. Sie schränken nicht ein, was du in deinem privaten Hermes-Server tun kannst.",
    downloadReceipt: "Beleg herunterladen",
    receiptShared: "Der Sicherheitsbeleg ist bereit. Er ist nur ein Nachweis und keine Einschränkung deines privaten Hermes-Servers.",
    receiptFailed: "Der Sicherheitsbeleg konnte nicht erstellt werden.",
  },
  aiAccess: { title: "KI-Zugang", description: "Wähle einen Standardweg für diesen Workspace.", current: "Aktueller KI-Zugang", currentUnavailable: "Der aktuelle KI-Zugang konnte nicht bestätigt werden.", none: "Keine KI-Verbindung", chatGpt: "ChatGPT OAuth", claude: "Claude OAuth", included: "Enthaltene KI", connected: "Verbunden", notConnected: "Nicht verbunden", statusUnavailable: "Status nicht verfügbar", working: "Wird ausgeführt…", resultSuccess: "Verbunden und ausgewählt.", resultCancelled: "Anmeldung abgebrochen. Nichts wurde geändert.", resultProviderError: "Die Provider-Anmeldung konnte nicht starten. Versuche es erneut.", resultLinkError: "Die Anmeldung ist bereit, aber iOS konnte sie nicht öffnen. Tippe auf Anmeldung öffnen.", resultUnknown: "Die Verbindung ist noch nicht bestätigt. Schließe die Anmeldung ab und prüfe erneut.", includedUnavailableAction: "Enthaltene KI ist für diesen Workspace nicht bestätigt. Aktualisiere und versuche es erneut.", chatGptDetail: "Verwende dein ChatGPT-Konto über OAuth.", claudeDetail: "Verwende dein Claude-Konto über OAuth. Dieser Weg verbraucht das Zusatzguthaben deines Claude-Kontos, nicht das Plankontingent — das Zusatzguthaben muss also aktiv sein.", includedDetail: "Verwende das im Plan enthaltene verwaltete Kontingent.", allowanceLoading: "Das enthaltene Kontingent wird bestätigt. Es wird kein Restwert geschätzt.", allowanceRemaining: "{percent}% des enthaltenen Kontingents verbleiben.", includedModelUnavailable: "Das aktuelle enthaltene Modell ist nicht verfügbar.", connectChatGpt: "ChatGPT verbinden", reconnectChatGpt: "ChatGPT neu verbinden oder ändern", connectClaude: "Claude verbinden", reconnectClaude: "Claude neu verbinden oder ändern", chatGptComplete: "ChatGPT-Verbindung abschließen", chatGptSteps: "1. Anmeldung öffnen. 2. Diesen Code eingeben. 3. Status prüfen.", copyChatGptCode: "ChatGPT-Code kopieren", openSignIn: "Anmeldung öffnen", checkStatus: "Status prüfen", claudeComplete: "Claude-Verbindung abschließen", claudeCodeHint: "Füge den von Claude zurückgegebenen Code hier ein.", claudeCodePlaceholder: "Claude-Autorisierungscode", completeConnection: "Verbindung abschließen", cancel: "Abbrechen", otherConnection: "Weitere KI-Verbindung hinzufügen", otherConnectionPrompt: "Hilf mir, eine andere KI-Verbindung für diesen Workspace zu verstehen. Frag, was ich verbinden möchte, erkläre den sicheren unterstützten Weg und ändere keinen Provider und keine Zugangsdaten ohne meine ausdrückliche Bestätigung.", oauthUsageTruth: "Provider-Prozentwerte erscheinen nur bei verbindlichen Nutzungsdaten des Providers.", saved: "Auswahl gespeichert. Sie gilt ab dem nächsten Lauf.", savedUnconfirmed: "Auswahl gespeichert, aber der aktuelle Status konnte nicht bestätigt werden. Bitte neu laden.", saveFailed: "Der KI-Zugang konnte nicht gespeichert werden.", claudeStarted: "Die Claude-Anmeldung wurde geöffnet.", claudeConnected: "Claude ist verbunden.", claudeFailed: "Die Claude-Verbindung konnte nicht abgeschlossen werden." },
  plugins: {
    ...pluginsEn,
    title: "Verbindungen", description: "Verbinde Werkzeuge und Dienste mit diesem Workspace.", searchPlaceholder: "Verbindungen suchen", yours: "Deine Verbindungen", all: "Alle Verbindungen", empty: "Keine Verbindungen passen zu dieser Suche.", close: "Schließen", source: "Offizielle Quelle", tools: "Werkzeuge", skills: "Skills", permissions: "Berechtigungen", setup: "Einrichtung", working: "Wird ausgeführt…", partialStatus: "Einige Verbindungsstatus konnten nicht aktualisiert werden. Verfügbare Ergebnisse werden angezeigt; betroffene Einrichtungsaktionen bleiben bis zur Erholung des Katalogs gesperrt.", loading: "Verbindungen werden geladen…", loadError: "Verbindungen sind derzeit nicht erreichbar.", operationComplete: "Der Verbindungsstatus wurde aktualisiert.", webhookRequested: "Die Webhook-Einrichtung wurde angefordert. Kein Provider und kein Secret wurden geändert.", actionError: "Die Verbindungsaktion konnte nicht abgeschlossen werden.", confirmTitle: "Quellenprüfung bestätigen", confirmBody: "Bestätige, dass du die genaue festgelegte Quelle, Berechtigungen und Vertrauensinformationen für diesen Workspace geprüft hast.", cancel: "Abbrechen", confirm: "Bestätigen",
    statusLabels: { available: "Hinzufügen", authorization_required: "Autorisieren", setup_incomplete: "Einrichtung abschließen", added: "Hinzugefügt", attention: "Prüfung nötig" },
    connectionStatusLabels: { available: "Verfügbar", authorization_required: "Autorisierung nötig", setup_incomplete: "Einrichtung unvollständig", unknown: "Unbekannt", unavailable: "Nicht verfügbar", connected: "Verbunden", attention: "Prüfung nötig" },
    statusDetails: { available: "Für diesen Workspace verfügbar.", authorization_required: "Die Autorisierung fehlt noch.", setup_incomplete: "Die Einrichtung ist noch nicht vollständig.", added: "In diesem Workspace verfügbar.", attention: "Die aktuellen Nachweise benötigen Aufmerksamkeit." },
    actionLabels: { add: "Hinzufügen", authorize: "Autorisieren", manage: "Verwalten", finish_setup: "Einrichtung abschließen", probe: "Prüfen", disconnect: "Verwalten", repair: "Reparieren", review_source: "Quelle prüfen", confirm_review: "Prüfung bestätigen", install: "Installation öffnen", activate: "Aktivierung öffnen", enable: "Freigabe öffnen", send_setup_request: "Hermes fragen" },
    items: pluginItemsDe,
  },
};

const systemPagesEs: MobileSystemPagesCopy = {
  common: { dismiss: "Cerrar aviso" },
  dashboard: { opening: "Abriendo el panel de Hermes…", error: "No se pudo abrir el panel de Hermes.", retry: "Reintentar" },
  automations: { title: "Automatizaciones", description: "Recordatorios y tareas programadas guardados en Hermes.", refresh: "Actualizar automatizaciones", loadError: "No se pudieron cargar las automatizaciones.", add: "Añadir automatización", addPrompt: "Ayúdame a crear una automatización de Hermes. Pregunta qué debe ocurrir, cuándo debe ejecutarse y qué zona horaria y canal de entrega debe usar. Créala mediante la ruta normal de recordatorios o cron de Hermes solo después de que confirme los detalles.", loaded: "{count} automatizaciones cargadas.", emptyTitle: "Aún no hay automatizaciones", emptyBody: "Usa Añadir automatización para pedir a Hermes un recordatorio o una tarea programada.", active: "Activa", paused: "Pausada", unknown: "Desconocida", next: "Próxima ejecución", noNext: "No se muestra la próxima ejecución", delivery: "Entrega", result: { never: "Aún no hay resultados guardados", pending: "Resultado pendiente", stored: "Último resultado guardado", failed: "La última ejecución falló", not_stored: "La última ejecución no guardó ningún resultado" }, chat: "Chat", chatAbout: "Hablar sobre {title}", chatPrompt: "Háblame de esta automatización de Hermes: {title} ({id}). Muestra su horario, estado, entrega y objetivo, y responde a mis preguntas. No cambies nada mientras no te lo pida.", edit: "Editar", standard: "Estándar", reset: "Restablecer al estándar", resetConfirm: "Confirmar restablecimiento", pause: "Pausar", resume: "Reanudar", delete: "Eliminar", deleteConfirmTitle: "¿Eliminar esta automatización?", deleteConfirmMessage: "{title} se eliminará y dejará de ejecutarse. Esto no se puede deshacer.", deleteConfirm: "Eliminar", deleteCancel: "Conservar", versions: "Historial de versiones", versionsHide: "Ocultar el historial de versiones", activeVersion: "En uso", restore: "Restaurar", restoreConfirm: "Confirmar restauración", reinstall: "Restaurar", reinstallConfirm: "Confirmar restauración", schedule: { daily: "a diario", everyDays: "cada {count} días", weekdays: "{weekdays}", monthly: "mensualmente los días {days}", hourly: "cada hora en el minuto {minute}", everyHours: "cada {count} horas", everyMinutes: "cada {count} minutos", once: "una vez el {date}", unknown: "Horario guardado en Hermes", and: " y " }, editPrompt: "Ayúdame a editar esta automatización de Hermes: {title} ({id}). Muestra primero su horario, estado, canal de entrega y objetivo. Después pregunta qué quiero cambiar y actualiza el cron o recordatorio normal de Hermes solo cuando confirme los detalles finales." },
  tasks: { title: "Tareas", empty: "Aún no se han recopilado tareas.", pendingTitle: "Aún sin priorizar", loading: "Cargando tareas priorizadas…", loadError: "La lista priorizada de tareas no está disponible ahora.", changeError: "No se pudo guardar el cambio.", about: "Sobre este orden", aboutSentence: "Este orden proviene de la última ejecución de priorización sobre tus tareas de Kanban.", aboutClose: "Cerrar" },
  account: { ownerTitle: "Personas", memberTitle: "Tu cuenta", monthlyBudget: "Presupuesto mensual del modelo", allowanceUnavailable: "El estado actual del cupo no está disponible.", allowanceRemaining: "Queda el {percent}% del cupo incluido.", unavailable: "No disponible", used: "{percent}% usado", yourDataTitle: "Tus datos", yourDataDetail: "Descarga todo lo que Hey Hermes guarda para ti: chats, tareas, archivos del espacio de trabajo y ajustes.", exportData: "Exportar tus datos", exportPreparing: "Preparando…", exportOpened: "Tu exportación se abrió en el navegador. Guárdala desde allí.", signInMethods: "Métodos de inicio de sesión", signInDetail: "Vincula un proveedor solo mientras hayas iniciado sesión en esta cuenta exacta de Hey. Las direcciones de correo iguales nunca vinculan cuentas.", linkGoogle: "Vincular Google", capacity: "Hay {active}/{capacity} cuentas activas. Al retirar el acceso se conservan los datos guardados del espacio de trabajo.", name: "Nombre", email: "Correo electrónico", creating: "Creando cuenta…", createError: "No se pudo crear la cuenta.", invite: "Invitar a una persona", disabling: "Desactivando cuenta…", disableError: "No se pudo desactivar la cuenta.", resetting: "Restableciendo el código de la cuenta…", resetError: "No se pudo restablecer el código de la cuenta.", detailsLoading: "Cargando los datos de la cuenta.", roleOwner: "Propietario", roleMember: "Miembro", statusActive: "Activa", statusDisabled: "Desactivada", lastSignIn: "Último inicio de sesión", notYet: "todavía no", resetAccess: "Restablecer el acceso de {name}", disableAccess: "Desactivar a {name}", created: "Se creó {email}.", preparedWorkspace: "Se asignó un espacio de trabajo preparado.", runtimeReady: "Entorno listo.", runtimeAttention: "El entorno requiere atención.", runtimeStarts: "El entorno se inicia automáticamente al usarlo.", oneTimeCode: "Código de un solo uso: {code}", disabled: "{email} está desactivada. Se conservan los datos del espacio de trabajo.", reset: "Se restableció {email}.", updatedAccount: "Se actualizó {email}.", archive: "Crear archivo completo", archiveQueued: "Archivo completo en cola. Aparecerá en la lista de abajo cuando esté listo.", archiveFailed: "No se pudo poner en cola el archivo completo.", recentExports: "Exportaciones recientes", noExports: "Aún no se ha creado ninguna exportación.", exportRequested: "Solicitada", exportCompleted: "completada", download: "Descargar", downloadFailed: "No se pudo abrir esta exportación.", exportKind: { export: "Exportación de datos", archive: "Archivo completo" }, exportStatus: { queued: "En cola", running: "En curso", completed: "Completada", failed: "Fallida", cancelled: "Cancelada" }, restoreTitle: "Restauración", restoreDetail: "Restaurar datos puede sobrescribir datos privados con una copia más antigua. Empieza por Soporte para que se confirme antes la acción exacta.", restoreAsk: "Preguntar a Soporte sobre la restauración", restorePrompt: "Necesito ayuda con una restauración en Hey Hermes. Pregunta qué exportación, archivo o fecha quiero decir, explica qué se puede restaurar con seguridad y no sobrescribas datos en vivo hasta que yo apruebe explícitamente el plan exacto.", deletion: { confirmTitle: "¿Eliminar esta cuenta de Hey Hermes?", confirmBody: "Tus sesiones y permisos de Hey se revocan inmediatamente y se eliminan tus datos activos de Hey. Esto no se puede deshacer.\n\nNo cancela tu suscripción del App Store ni afecta a cuentas de otros productos o a tu correo electrónico.", keep: "Conservar cuenta", delete: "Eliminar cuenta", title: "Eliminar esta cuenta de Hey", description: "Vuelve a autenticarte y confirma. Se revocarán tus sesiones y permisos de Hey y se eliminarán tus datos activos de Hey. La cancelación de la suscripción es independiente y no afecta a cuentas de otros productos.", credentialPlaceholder: "Contraseña o código de acceso", credentialLabel: "Contraseña o código de acceso para eliminar la cuenta", recentSignInHint: "Déjalo vacío solo si iniciaste sesión con Apple o Google hace unos minutos.", confirmationLabel: "Escribe {phrase} para confirmar", deleting: "Eliminando…", reauthenticationError: "La contraseña o el código de acceso no coinciden. Si usaste Apple o Google, vuelve a iniciar sesión e inténtalo de nuevo.", confirmationError: "Escribe exactamente {phrase} para confirmar.", genericError: "No se pudo eliminar la cuenta. No se cambió nada.", deleted: "Cuenta de Hey Hermes eliminada. Recibo {receipt}.", purged: "Tus datos activos de Hey se han eliminado.", purgePending: "Tus datos activos de Hey se eliminarán antes del {date}.", subscriptionKept: "Tu suscripción del App Store no se canceló." } },
  security: {
    title: "Seguridad y acceso",
    description: "Acceso al plano de control, permisos de soporte y excepciones de infraestructura de este servidor privado de Hermes.",
    anchorPending: "anclaje pendiente",
    stateRow: "Estado actual",
    privacyPromise: "Tus datos están en tu propio servidor y te pertenecen.",
    privacyDetailsOpen: "Qué significa",
    privacyWhere: "Hey Hermes mantiene tu servidor en marcha: actualizaciones, reinicios, copias de seguridad. Eso requiere acceso permanente; sin él el servidor no funcionaría. No miramos tus conversaciones, tareas ni archivos. Es un compromiso nuestro, no una barrera técnica. Lo que tú autorices aparece abajo, con fecha, alcance y duración.",
    privacyLink: "Privacidad",
    serverWorkspace: "Espacio de trabajo",
    serverIpv4: "IPv4 pública",
    serverType: "Servidor",
    serverSince: "En servicio desde",
    accessTitle: "Accesos que autorizaste",
    accessNone: "Todavía no hay accesos.",
    accessGrantedByYou: "autorizado por ti",
    accessAutomatic: "automático",
    accessManual: "manual",
    accessNeverUsed: "nunca usado",
    accessUsed: "usado",
    accessEnded: "terminado",
    adminTitle: "Acceso de administración",
    handover: "Traspaso",
    customerControlledSince: "Bajo control del cliente desde",
    pending: "Pendiente",
    adminKey: "Clave de administración",
    customerKey: "Clave del cliente",
    keyNotRegistered: "No registrada",
    standingAccess: "Acceso SSH/root de Hey Hermes",
    noneDetected: "ninguno detectado",
    lastBaselineCheck: "Última comprobación de referencia",
    notChecked: "Sin comprobar",
    adminDetail: "Hey Hermes no conserva un acceso SSH/root permanente después del traspaso. La recuperación a nivel de infraestructura sigue siendo posible en emergencias porque tu servidor funciona en la cuenta de Hetzner de Hey Hermes. Esos casos excepcionales aparecen aquí.",
    keyLabelPlaceholder: "Etiqueta de la clave, p. ej. Justus MacBook",
    keyPlaceholder: "ssh-ed25519 AAAA...",
    saveAdminKey: "Guardar clave de administración",
    adminKeySaved: "Clave guardada. El traspaso puede ejecutarse durante el aprovisionamiento o desde esta pantalla.",
    adminKeyFailed: "No se pudo guardar la clave de administración.",
    runHandover: "Comprobar el traspaso",
    handoverChecked: "La comprobación del traspaso ha terminado. El estado de arriba está actualizado.",
    handoverFailed: "No se pudo ejecutar la comprobación del traspaso.",
    supportTitle: "Soporte",
    supportDetail: "El acceso temporal de soporte se concede en la pantalla de Soporte. Aquí figura qué se concedió, durante cuánto tiempo y con qué alcance.",
    activeGrants: "Permisos activos",
    none: "Ninguno",
    noGrants: "No hay permisos de soporte activos ni anteriores.",
    grantCodeHint: "Pista del código",
    grantExpires: "Caduca",
    grantScopes: "Alcance",
    grantLastUsed: "Último uso",
    grantRevoked: "Revocado",
    revokeGrant: "Revocar este permiso de soporte",
    revokeDone: "Permiso de soporte revocado.",
    revokeFailed: "No se pudo revocar el permiso de soporte.",
    openSupport: "Abrir Soporte",
    infrastructureTitle: "Infraestructura",
    exceptionalEvents: "Eventos excepcionales",
    unmatchedEvents: "Eventos sin correspondencia",
    latestEvent: "Último evento",
    noEvents: "Ninguno",
    latestEventHash: "Hash del último evento",
    noReceipt: "Aún sin comprobante",
    latestSealedBatch: "Último lote sellado",
    notSealed: "Sin sellar",
    wormRetentionUntil: "Retención WORM hasta",
    externalAnchor: "Anclaje externo",
    notAnchored: "Aún sin anclar",
    externalAnchorFallback: "externo",
    viewAnchor: "Ver el anclaje externo",
    anchorOpenFailed: "No se pudo abrir el anclaje externo.",
    infrastructureDetail: "Estos registros son pruebas sobre la infraestructura y el acceso de soporte de Hey Hermes. No limitan lo que puedes hacer dentro de tu servidor privado de Hermes.",
    downloadReceipt: "Descargar comprobante",
    receiptShared: "El comprobante de auditoría está listo. Es solo una prueba, no una restricción de tu servidor privado de Hermes.",
    receiptFailed: "No se pudo preparar el comprobante de auditoría.",
  },
  aiAccess: { title: "Acceso a IA", description: "Elige una ruta estándar para este espacio de trabajo.", current: "Acceso a IA actual", currentUnavailable: "No se pudo confirmar el acceso a IA actual.", none: "Sin conexión de IA", chatGpt: "ChatGPT OAuth", claude: "Claude OAuth", included: "IA incluida", connected: "Conectado", notConnected: "No conectado", statusUnavailable: "Estado no disponible", working: "En curso…", resultSuccess: "Conectado y seleccionado.", resultCancelled: "Inicio de sesión cancelado. No se cambió nada.", resultProviderError: "No se pudo iniciar la sesión del proveedor. Inténtalo de nuevo.", resultLinkError: "El inicio de sesión está listo, pero iOS no pudo abrirlo. Pulsa Abrir inicio de sesión.", resultUnknown: "La conexión aún no está confirmada. Termina el inicio de sesión y vuelve a comprobar.", includedUnavailableAction: "La IA incluida no está confirmada para este espacio. Actualiza y vuelve a intentarlo.", chatGptDetail: "Usa tu cuenta de ChatGPT mediante OAuth.", claudeDetail: "Usa tu cuenta de Claude mediante OAuth. Gasta el saldo de uso adicional de tu cuenta de Claude, no el cupo de tu plan, así que el uso adicional debe estar activado.", includedDetail: "Usa el cupo gestionado incluido en tu plan.", allowanceLoading: "Se está confirmando el cupo incluido. No se estima ningún valor restante.", allowanceRemaining: "Queda el {percent}% del cupo incluido.", includedModelUnavailable: "El modelo incluido actual no está disponible.", connectChatGpt: "Conectar ChatGPT", reconnectChatGpt: "Volver a conectar o cambiar ChatGPT", connectClaude: "Conectar Claude", reconnectClaude: "Volver a conectar o cambiar Claude", chatGptComplete: "Completar conexión con ChatGPT", chatGptSteps: "1. Abre el inicio de sesión. 2. Introduce este código. 3. Comprueba el estado.", copyChatGptCode: "Copiar el código de ChatGPT", openSignIn: "Abrir inicio de sesión", checkStatus: "Comprobar estado", claudeComplete: "Completar conexión con Claude", claudeCodeHint: "Pega aquí el código devuelto por Claude.", claudeCodePlaceholder: "Código de autorización de Claude", completeConnection: "Completar conexión", cancel: "Cancelar", otherConnection: "Añadir otra conexión de IA", otherConnectionPrompt: "Ayúdame a entender otra conexión de IA para este espacio de trabajo. Pregunta qué quiero conectar, explica la ruta segura compatible y no cambies ningún proveedor ni credencial sin mi confirmación explícita.", oauthUsageTruth: "Los porcentajes del proveedor solo aparecen cuando este aporta datos de uso autoritativos.", saved: "Selección guardada. Se aplicará desde la próxima ejecución.", savedUnconfirmed: "Selección guardada, pero no se pudo confirmar el estado actual. Vuelve a cargar.", saveFailed: "No se pudo guardar la opción de acceso a IA.", claudeStarted: "Se abrió el inicio de sesión de Claude.", claudeConnected: "Claude está conectado.", claudeFailed: "No se pudo completar la conexión con Claude." },
  plugins: {
    ...pluginsEn,
    title: "Conexiones", description: "Conecta herramientas y servicios a este espacio de trabajo.", searchPlaceholder: "Buscar conexiones", yours: "Tus conexiones", all: "Todas las conexiones", empty: "Ninguna conexión coincide con esta búsqueda.", close: "Cerrar", source: "Fuente oficial", tools: "Herramientas", skills: "Habilidades", permissions: "Permisos", setup: "Configuración", working: "En curso…", partialStatus: "No se pudieron actualizar algunos estados de conexiones. Se muestran los resultados disponibles; las acciones de configuración afectadas permanecen bloqueadas hasta que el catálogo se recupere.", loading: "Cargando conexiones…", loadError: "Las conexiones no están disponibles ahora.", operationComplete: "Se actualizó el estado de la conexión.", webhookRequested: "Se solicitó la configuración del webhook. No se cambió ningún proveedor ni secreto.", actionError: "No se pudo completar la acción de conexión.", confirmTitle: "Confirmar revisión de la fuente", confirmBody: "Confirma que revisaste la fuente fijada exacta, los permisos y la información de confianza de este espacio de trabajo.", cancel: "Cancelar", confirm: "Confirmar",
    statusLabels: { available: "Añadir", authorization_required: "Autorizar", setup_incomplete: "Completar configuración", added: "Añadido", attention: "Requiere atención" },
    connectionStatusLabels: { available: "Disponible", authorization_required: "Autorización necesaria", setup_incomplete: "Configuración incompleta", unknown: "Desconocido", unavailable: "No disponible", connected: "Conectado", attention: "Requiere atención" },
    statusDetails: { available: "Disponible para este espacio de trabajo.", authorization_required: "Aún requiere autorización.", setup_incomplete: "La configuración todavía no está completa.", added: "Disponible en este espacio de trabajo.", attention: "Las pruebas actuales requieren atención." },
    actionLabels: { add: "Añadir", authorize: "Autorizar", manage: "Gestionar", finish_setup: "Completar configuración", probe: "Comprobar", disconnect: "Gestionar", repair: "Reparar", review_source: "Revisar fuente", confirm_review: "Confirmar revisión", install: "Abrir instalación", activate: "Abrir activación", enable: "Abrir habilitación", send_setup_request: "Preguntar a Hermes" },
    items: {
      calendar: { description: "Usa eventos de Google Calendar de este espacio de trabajo.", setupHint: "Continúa con la configuración protegida de Google que ya existe.", permissions: ["Acceso al calendario"], searchTerms: ["calendario", "google", "eventos"] },
      google_drive: { description: "Usa archivos de Google Drive de este espacio de trabajo.", setupHint: "Continúa con la configuración protegida de Google que ya existe.", permissions: ["Acceso a archivos de Drive"], searchTerms: ["drive", "google", "archivos"] },
      discord: { description: "Pide a Hermes que guíe una configuración acotada de bot o webhook de Discord.", setupHint: "Un toque envía una solicitud de configuración fija y sin secretos al chat principal.", permissions: ["Enviar la solicitud de configuración no concede ningún permiso"], searchTerms: ["mensajes", "bot", "servidor"] },
      gmail: { description: "Lee y organiza el correo con tu permiso.", setupHint: "Autoriza este espacio de trabajo mediante Google OAuth.", permissions: ["Leer metadatos y contenido de los mensajes"], searchTerms: ["correo", "google", "bandeja"] },
      google_workspace: { description: "Usa calendarios y archivos de Drive de este espacio de trabajo.", setupHint: "Introduce los datos de la app de Google solo en la configuración protegida y después pulsa Comprobar.", permissions: ["Acceso al calendario", "Acceso a archivos de Drive"], searchTerms: ["calendario", "drive", "google", "eventos", "archivos"] },
      telegram: { description: "Habla con Hermes mediante un bot de Telegram vinculado al espacio de trabajo.", setupHint: "Sigue la configuración guiada del bot y envía un mensaje de prueba.", permissions: ["Recibir mensajes enviados al bot configurado", "Enviar respuestas mediante ese bot"], searchTerms: ["mensajes", "bot", "chat"] },
      whatsapp: { description: "Conecta un número de WhatsApp Cloud mediante la configuración guiada.", setupHint: "Completa las credenciales protegidas y el webhook; después pulsa Comprobar.", permissions: ["Recibir mensajes dirigidos", "Enviar respuestas mediante el número configurado"], searchTerms: ["meta", "mensajes", "cloud api"] },
      skills_hub: { description: "Revisa e instala una habilidad declarada de Hermes desde su fuente exacta.", setupHint: "Revisa la fuente y el análisis antes de instalarla o habilitarla por separado.", permissions: ["Los permisos dependen de la habilidad y se muestran antes de instalarla"], searchTerms: ["habilidad", "catálogo", "instalar", "confianza"] },
      local_plugins: { description: "Inspecciona plugins locales declarados sin exponer rutas ni configuración sin procesar.", setupHint: "Revisa la fuente, la versión, las declaraciones y la confianza antes de habilitarlo.", permissions: ["Las herramientas, hooks y órdenes declarados se revisan antes de activarlos"], searchTerms: ["plugin", "local", "hooks", "órdenes"] },
      browser: { description: "Usa las herramientas de navegador incluidas en el runtime fijado de Hermes.", setupHint: "Comprueba el inventario fijado y la capacidad real del navegador.", permissions: ["Acceso a sitios web solicitado por el usuario"], searchTerms: ["web", "navegador", "automatización"] },
      webhooks: { description: "Prepara una llamada entrante o saliente con límites claros.", setupHint: "Usa la configuración protegida; los secretos nunca entran en el chat.", permissions: ["Servicio, objetivo, ámbitos, callback, prueba y plan de desconexión"], searchTerms: ["callback", "http", "eventos", "integración"] },
      slack: { description: "Pide a Hermes que te guíe por la ruta aprobada para conectar Slack.", setupHint: "Un toque envía una solicitud fija y sin secretos al chat principal.", permissions: ["Enviar la solicitud de configuración no concede permisos"], searchTerms: ["mensajes", "espacio", "chat"] },
      stripe: { description: "Pide a Hermes que planifique una configuración limitada de Stripe sin mover dinero.", setupHint: "Un toque envía una solicitud fija y sin secretos al chat principal.", permissions: ["Enviar la solicitud de configuración no concede permisos"], searchTerms: ["facturación", "pagos", "finanzas"] },
    },
  },
};


const systemPagesFr: MobileSystemPagesCopy = {
  "common": {
    "dismiss": "Fermer cet avis"
  },
  "dashboard": {
    "opening": "Ouverture du tableau de bord Hermes…",
    "error": "Impossible d’ouvrir le tableau de bord Hermes.",
    "retry": "Réessayer"
  },
  "automations": {
    "title": "Automatisations",
    "description": "Rappels et tâches planifiées enregistrés dans Hermes.",
    "refresh": "Actualiser les automatisations",
    "loadError": "Impossible de charger les automatisations.",
    "add": "Ajouter une automatisation",
    "addPrompt": "Aide-moi à créer une automatisation Hermes. Demande ce qui doit se passer, quand l’exécuter, le fuseau horaire et le canal de livraison, puis crée-la par le parcours normal de rappel ou de cron Hermes après ma confirmation des détails.",
    "loaded": "{count} automatisations chargées.",
    "emptyTitle": "Aucune automatisation pour le moment",
    "emptyBody": "Utilisez Ajouter une automatisation pour demander à Hermes de créer un rappel ou une tâche planifiée.",
    "active": "Actif",
    "paused": "En pause",
    "unknown": "Inconnu",
    "next": "Prochaine",
    "noNext": "Prochaine exécution non affichée",
    "delivery": "Livraison",
    "result": {
      "never": "Aucun résultat enregistré",
      "pending": "Résultat en attente",
      "stored": "Dernier résultat enregistré",
      "failed": "La dernière exécution a échoué",
      "not_stored": "La dernière exécution n’a enregistré aucun résultat"
    },
    "chat": "Discussion",
    "chatAbout": "Discuter de {title}",
    "chatPrompt": "Parle-moi de cette automatisation Hermes : {title} ({id}). Présente son calendrier, son état, sa livraison et son objectif, puis réponds à mes questions. Ne change rien sans ma demande.",
    "edit": "Modifier",
    "standard": "Par défaut",
    "reset": "Rétablir les paramètres par défaut",
    "resetConfirm": "Confirmer la réinitialisation",
    "pause": "Mettre en pause",
    "resume": "Reprendre",
    "delete": "Supprimer",
    "deleteConfirmTitle": "Supprimer cette automatisation ?",
    "deleteConfirmMessage": "{title} sera supprimée et ne sera plus exécutée. Cette action est irréversible.",
    "deleteConfirm": "Supprimer",
    "deleteCancel": "Conserver",
    "versions": "Historique des versions",
    "versionsHide": "Masquer l’historique des versions",
    "activeVersion": "En cours d’utilisation",
    "restore": "Restaurer",
    "restoreConfirm": "Confirmer la restauration",
    "reinstall": "Restaurer",
    "reinstallConfirm": "Confirmer la restauration",
    "schedule": {
      "daily": "chaque jour",
      "everyDays": "tous les {count} jours",
      "weekdays": "{weekdays}",
      "monthly": "chaque mois, le {days}",
      "hourly": "chaque heure à la minute {minute}",
      "everyHours": "toutes les {count} heures",
      "everyMinutes": "toutes les {count} minutes",
      "once": "une fois le {date}",
      "unknown": "Calendrier enregistré dans Hermes",
      "and": " et "
    },
    "editPrompt": "Aide-moi à modifier cette automatisation Hermes : {title} ({id}). Présente d’abord le calendrier, l’état, le canal de livraison et l’objectif actuels. Demande ensuite ce que je souhaite changer et ne modifie le cron ou rappel Hermes normal qu’après ma confirmation des détails définitifs."
  },
  "tasks": {
    "title": "Taches",
    "empty": "Aucune tache n'a encore ete collectee.",
    "pendingTitle": "Pas encore classée",
    "loading": "Chargement des tâches classées…",
    "loadError": "La liste des tâches classées est actuellement indisponible.",
    "changeError": "Impossible d’enregistrer cette modification.",
    "about": "À propos de cet ordre",
    "aboutSentence": "Cet ordre vient du dernier classement effectué sur vos taches Kanban.",
    "aboutClose": "Fermer"
  },
  "account": {
    "ownerTitle": "Personnes",
    "memberTitle": "Votre compte",
    "monthlyBudget": "Budget de modèle mensuel",
    "allowanceUnavailable": "Le statut actuel du quota est indisponible.",
    "allowanceRemaining": "Il reste {percent} % du quota inclus.",
    "unavailable": "Indisponible",
    "used": "{percent} % utilisés",
    "yourDataTitle": "Vos données",
    "yourDataDetail": "Téléchargez tout ce que Hey Hermes conserve pour vous : conversations, tâches, fichiers de l'espace de travail et réglages.",
    "exportData": "Exporter vos données",
    "exportPreparing": "Préparation…",
    "exportOpened": "Votre export s’est ouvert dans le navigateur. Enregistrez-le depuis celui-ci.",
    "signInMethods": "Méthodes de connexion",
    "signInDetail": "Liez un fournisseur uniquement pendant que vous êtes connecté à ce compte Hey exact. Des adresses e-mail identiques ne lient jamais des comptes.",
    "linkGoogle": "Associer Google",
    "capacity": "{active}/{capacity} comptes sont actifs. Retirer l’accès conserve les données enregistrées de l’espace de travail.",
    "name": "Nom",
    "email": "E-mail",
    "creating": "Création du compte…",
    "createError": "Impossible de créer le compte.",
    "invite": "Inviter une personne",
    "disabling": "Désactivation du compte…",
    "disableError": "Impossible de désactiver le compte.",
    "resetting": "Réinitialisation du code du compte…",
    "resetError": "Impossible de réinitialiser le code du compte.",
    "detailsLoading": "Les détails du compte se chargent.",
    "roleOwner": "Propriétaire",
    "roleMember": "Membre",
    "statusActive": "Actif",
    "statusDisabled": "Désactivé",
    "lastSignIn": "Dernière connexion",
    "notYet": "jamais",
    "resetAccess": "Réinitialiser l’accès de {name}",
    "disableAccess": "Désactiver {name}",
    "created": "{email} créé.",
    "preparedWorkspace": "Un espace de travail préparé a été attribué.",
    "runtimeReady": "Runtime prêt.",
    "runtimeAttention": "Le runtime nécessite une vérification.",
    "runtimeStarts": "Le runtime démarre automatiquement à l’utilisation.",
    "oneTimeCode": "Code à usage unique : {code}",
    "disabled": "{email} est désactivé. Les données de l’espace de travail sont conservées.",
    "reset": "{email} réinitialisé.",
    "updatedAccount": "{email} a été mis à jour.",
    "archive": "Créer une archive complète",
    "archiveQueued": "L’archive complète est en attente. Elle apparaîtra dans la liste ci-dessous une fois prête.",
    "archiveFailed": "Impossible de mettre l’archive complète en attente.",
    "recentExports": "Exports récents",
    "noExports": "Aucun export n'a encore été créé.",
    "exportRequested": "Demandé",
    "exportCompleted": "terminé",
    "download": "Télécharger",
    "downloadFailed": "Impossible d’ouvrir cet export.",
    "exportKind": {
      "export": "Export de données",
      "archive": "Archive complète"
    },
    "exportStatus": {
      "queued": "En attente",
      "running": "En cours",
      "completed": "Terminé",
      "failed": "Échoué",
      "cancelled": "Annulé"
    },
    "restoreTitle": "Restaurer",
    "restoreDetail": "Une restauration peut écraser des données privées avec une copie plus ancienne. Commencez par le support pour que l'action exacte soit confirmée d'abord.",
    "restoreAsk": "Demander une restauration au support",
    "restorePrompt": "J’ai besoin d’aide pour une restauration Hey Hermes. Demande de quel export, archive ou date il s’agit, explique ce qui peut être restauré en toute sécurité et n’écrase aucune donnée active avant mon accord explicite sur le plan exact de restauration.",
    "deletion": {
      "confirmTitle": "Supprimer ce compte Hey Hermes ?",
      "confirmBody": "Vos sessions et autorisations Hey sont immédiatement révoquées et vos données Hey actives sont supprimées. Cette action est irréversible.\n\nCela ne résilie pas votre abonnement App Store et ne touche aucun autre compte de produit ni votre adresse e-mail.",
      "keep": "Conserver le compte",
      "delete": "Supprimer le compte",
      "title": "Supprimer ce compte Hey",
      "description": "Authentifiez-vous à nouveau, puis confirmez. Vos sessions et autorisations Hey sont révoquées et vos données Hey actives supprimées. La résiliation de l'abonnement est distincte et aucun autre compte produit n'est touché.",
      "credentialPlaceholder": "Mot de passe ou code d'accès",
      "credentialLabel": "Mot de passe ou code d'accès pour la suppression du compte",
      "recentSignInHint": "Laissez vide seulement si vous vous êtes connecté avec Apple ou Google il y a quelques minutes.",
      "confirmationLabel": "Saisissez {phrase} pour confirmer",
      "deleting": "Suppression…",
      "reauthenticationError": "Ce mot de passe ou code d'accès ne correspond pas. Si vous vous êtes connecté avec Apple ou Google, reconnectez-vous et réessayez.",
      "confirmationError": "Saisissez exactement {phrase} pour confirmer.",
      "genericError": "Le compte n'a pas pu être supprimé. Rien n'a été modifié.",
      "deleted": "Compte Hey Hermes supprimé. Reçu {receipt}.",
      "purged": "Vos données Hey actives ont été supprimées.",
      "purgePending": "Vos données Hey actives seront supprimées d’ici le {date}.",
      "subscriptionKept": "Votre abonnement App Store n’a pas été résilié."
    }
  },
  "security": {
    "title": "Sécurité et accès",
    "description": "Accès du plan de contrôle, autorisations d’assistance et exceptions d’infrastructure pour ce serveur Hermes privé.",
    "anchorPending": "ancrage en attente",
    "stateRow": "État actuel",
    "privacyPromise": "Vos données se trouvent sur votre propre serveur et vous appartiennent.",
    "privacyDetailsOpen": "Ce que cela signifie",
    "privacyWhere": "Hey Hermes assure le fonctionnement de votre serveur : mises à jour, redémarrages et sauvegardes. Cela nécessite un accès permanent ; sans lui, le serveur ne fonctionnerait pas. Nous ne consultons pas vos conversations, tâches ou fichiers. C’est notre engagement, pas une barrière technique. Les accès que vous accordez vous-même sont listés ci-dessous avec leur date, périmètre et durée.",
    "privacyLink": "Politique de confidentialité",
    "serverWorkspace": "Espace de travail",
    "serverIpv4": "IPv4 publique",
    "serverType": "Serveur",
    "serverSince": "En service depuis",
    "accessTitle": "Accès que vous avez accordés",
    "accessNone": "Aucun accès jusqu’à présent.",
    "accessGrantedByYou": "accordé par vous",
    "accessAutomatic": "automatique",
    "accessManual": "manuel",
    "accessNeverUsed": "jamais utilisé",
    "accessUsed": "utilisé",
    "accessEnded": "terminé",
    "adminTitle": "Accès administrateur",
    "handover": "Transfert",
    "customerControlledSince": "Contrôlé par le client depuis",
    "pending": "En attente",
    "adminKey": "Clé administrateur",
    "customerKey": "Clé du client",
    "keyNotRegistered": "Non enregistrée",
    "standingAccess": "Connexion SSH/root de Hey Hermes",
    "noneDetected": "aucun détecté",
    "lastBaselineCheck": "Dernière vérification de référence",
    "notChecked": "Non vérifié",
    "adminDetail": "Hey Hermes ne conserve pas de connexion SSH/root permanente après le transfert. Une récupération au niveau de l’infrastructure reste possible en cas d’urgence, car votre serveur fonctionne dans le compte Hetzner de Hey Hermes. Ces événements exceptionnels sont affichés ici.",
    "keyLabelPlaceholder": "Nom de la clé, par exemple MacBook de Justus",
    "keyPlaceholder": "ssh-ed25519 AAAA...",
    "saveAdminKey": "Enregistrer la clé administrateur",
    "adminKeySaved": "Clé administrateur enregistrée. Le transfert peut être exécuté pendant la préparation ou depuis cet écran.",
    "adminKeyFailed": "Impossible d’enregistrer la clé administrateur.",
    "runHandover": "Vérifier le transfert",
    "handoverChecked": "Vérification du transfert terminée. L’état ci-dessus est actualisé.",
    "handoverFailed": "Impossible de vérifier le transfert.",
    "supportTitle": "Assistance",
    "supportDetail": "L’accès temporaire est accordé sur l’écran Assistance. Les accès accordés, leur durée et leur périmètre sont listés ici.",
    "activeGrants": "Autorisations actives",
    "none": "Aucune",
    "noGrants": "Aucune autorisation d’assistance active ou passée.",
    "grantCodeHint": "Indice du code",
    "grantExpires": "Expiration",
    "grantScopes": "Périmètres",
    "grantLastUsed": "Dernière utilisation",
    "grantRevoked": "Révoquée",
    "revokeGrant": "Révoquer cette autorisation d’assistance",
    "revokeDone": "Autorisation d’assistance révoquée.",
    "revokeFailed": "Impossible de révoquer l’autorisation d’assistance.",
    "openSupport": "Ouvrir l’assistance",
    "infrastructureTitle": "Infrastructure",
    "exceptionalEvents": "Événements exceptionnels",
    "unmatchedEvents": "Événements sans correspondance",
    "latestEvent": "Dernier événement",
    "noEvents": "Aucun",
    "latestEventHash": "Empreinte du dernier événement",
    "noReceipt": "Aucun reçu pour le moment",
    "latestSealedBatch": "Dernier lot scellé",
    "notSealed": "Non scellé",
    "wormRetentionUntil": "Conservation WORM jusqu’au",
    "externalAnchor": "Ancrage externe",
    "notAnchored": "Pas encore ancré",
    "externalAnchorFallback": "externe",
    "viewAnchor": "Voir l’ancrage externe",
    "anchorOpenFailed": "Impossible d’ouvrir l’ancrage externe.",
    "infrastructureDetail": "Ces enregistrements constituent des preuves concernant l’infrastructure Hey Hermes et les accès d’assistance. Ils ne limitent pas vos actions dans votre serveur Hermes privé.",
    "downloadReceipt": "Télécharger le reçu",
    "receiptShared": "Reçu d’audit de sécurité préparé. Il constitue une preuve, pas une restriction sur votre serveur Hermes privé.",
    "receiptFailed": "Impossible de préparer le reçu d’audit de sécurité."
  },
  "aiAccess": {
    "title": "Accès IA",
    "description": "Choisissez une route standard pour cet espace de travail.",
    "current": "Accès IA actuel",
    "currentUnavailable": "L'accès IA actuel n'a pas pu être confirmé.",
    "none": "Aucune connexion IA",
    "chatGpt": "ChatGPT OAuth",
    "claude": "Claude OAuth",
    "included": "IA incluse",
    "connected": "Connecté",
    "notConnected": "Non connecté",
    "statusUnavailable": "Statut indisponible",
    "working": "En cours…",
    "resultSuccess": "Connecté et sélectionné.",
    "resultCancelled": "Connexion annulée. Aucun changement.",
    "resultProviderError": "La connexion au fournisseur n'a pas pu démarrer. Réessayez.",
    "resultLinkError": "La connexion est prête, mais iOS n’a pas pu l’ouvrir. Touchez Ouvrir la connexion.",
    "resultUnknown": "La connexion n’est pas encore confirmée. Terminez la connexion, puis vérifiez à nouveau.",
    "includedUnavailableAction": "L’IA incluse n’est pas confirmée pour cet espace de travail. Actualisez, puis réessayez.",
    "chatGptDetail": "Utilisez votre compte ChatGPT via OAuth.",
    "claudeDetail": "Utilisez votre compte Claude via OAuth. Cette route dépense le budget d'utilisation supplémentaire de votre compte Claude, pas le quota de votre offre : l'utilisation supplémentaire doit donc être activée.",
    "includedDetail": "Utilisez le quota géré inclus dans votre offre.",
    "allowanceLoading": "Le quota inclus est en cours de confirmation. Aucune valeur restante n’est estimée.",
    "allowanceRemaining": "Il reste {percent} % du quota inclus.",
    "includedModelUnavailable": "Le modèle inclus actuel n'est pas disponible.",
    "connectChatGpt": "Connecter ChatGPT",
    "reconnectChatGpt": "Reconnecter ou changer ChatGPT",
    "connectClaude": "Connecter Claude",
    "reconnectClaude": "Reconnecter ou changer Claude",
    "chatGptComplete": "Terminer la connexion ChatGPT",
    "chatGptSteps": "1. Ouvrez la connexion. 2. Saisissez ce code. 3. Vérifiez le statut.",
    "copyChatGptCode": "Copier le code ChatGPT",
    "openSignIn": "Ouvrir la connexion",
    "checkStatus": "Vérifier le statut",
    "claudeComplete": "Terminer la connexion Claude",
    "claudeCodeHint": "Collez ici le code renvoyé par Claude.",
    "claudeCodePlaceholder": "Code d'autorisation Claude",
    "completeConnection": "Terminer la connexion",
    "cancel": "Annuler",
    "otherConnection": "Ajouter une autre connexion IA",
    "otherConnectionPrompt": "Aide-moi à comprendre une autre connexion IA pour cet espace de travail. Demande ce que je veux connecter, explique la voie sûre prise en charge, et ne modifie aucun fournisseur ni identifiant sans ma confirmation explicite.",
    "oauthUsageTruth": "Les pourcentages du fournisseur n'apparaissent que lorsqu'il fournit des données d'utilisation fiables.",
    "saved": "Choix enregistré. Il s'applique dès la prochaine exécution.",
    "savedUnconfirmed": "Choix enregistré, mais le statut actuel n'a pas pu être confirmé. Rechargez la page.",
    "saveFailed": "L'accès IA n'a pas pu être enregistré.",
    "claudeStarted": "La connexion Claude a été ouverte.",
    "claudeConnected": "Claude est connecté.",
    "claudeFailed": "La connexion Claude n'a pas pu être terminée."
  },
  "plugins": {
    "title": "Connexions",
    "description": "Connectez des outils et des services à cet espace.",
    "searchPlaceholder": "Rechercher des connexions",
    "yours": "Vos connexions",
    "all": "Toutes les connexions",
    "empty": "Aucune connexion ne correspond à cette recherche.",
    "close": "Fermer",
    "source": "Source officielle",
    "tools": "Outils",
    "skills": "Compétences",
    "permissions": "Autorisations",
    "setup": "Configuration",
    "working": "En cours…",
    "statusLabels": {
      "available": "Ajouter",
      "authorization_required": "Autoriser",
      "setup_incomplete": "Terminer la configuration",
      "added": "Ajouté",
      "attention": "À vérifier"
    },
    "connectionStatusLabels": {
      "available": "Disponible",
      "authorization_required": "Autorisation requise",
      "setup_incomplete": "Configuration incomplète",
      "unknown": "Inconnu",
      "unavailable": "Indisponible",
      "connected": "Connecté",
      "attention": "À vérifier"
    },
    "statusDetails": {
      "available": "Disponible pour cet espace.",
      "authorization_required": "L'autorisation manque encore.",
      "setup_incomplete": "La configuration n'est pas terminée.",
      "added": "Disponible dans cet espace.",
      "attention": "Les preuves actuelles demandent votre attention."
    },
    "actionLabels": {
      "add": "Ajouter",
      "authorize": "Autoriser",
      "finish_setup": "Terminer la configuration",
      "probe": "Vérifier",
      "disconnect": "Gérer",
      "repair": "Réparer",
      "review_source": "Vérifier la source",
      "confirm_review": "Confirmer la vérification",
      "install": "Ouvrir l'installation",
      "activate": "Ouvrir l'activation",
      "enable": "Ouvrir l'autorisation",
      "send_setup_request": "Demander à Hermes"
    },
    "items": {
      "calendar": {
        "description": "Utilisez les événements Google Agenda depuis cet espace de travail.",
        "setupHint": "Poursuivez la configuration Google protégée existante.",
        "permissions": [
          "Accès à l’agenda"
        ],
        "searchTerms": [
          "calendar",
          "google",
          "events"
        ]
      },
      "google_drive": {
        "description": "Utilisez les fichiers Google Drive depuis cet espace de travail.",
        "setupHint": "Poursuivez la configuration Google protégée existante.",
        "permissions": [
          "Accès aux fichiers Drive"
        ],
        "searchTerms": [
          "drive",
          "google",
          "files"
        ]
      },
      "discord": {
        "description": "Demandez à Hermes de vous guider pour configurer un bot ou webhook Discord au périmètre limité.",
        "setupHint": "Un appui envoie une demande de configuration prédéfinie, sans secret, au chat principal.",
        "permissions": [
          "L’envoi de la demande de configuration n’accorde aucune autorisation"
        ],
        "searchTerms": [
          "messaging",
          "bot",
          "server"
        ]
      },
      "gmail": {
        "description": "Lisez et organisez vos e-mails avec votre autorisation.",
        "setupHint": "Autorisez cet espace de travail via Google OAuth.",
        "permissions": [
          "Lecture des métadonnées et du contenu des e-mails"
        ],
        "searchTerms": [
          "email",
          "google",
          "inbox"
        ]
      },
      "google_workspace": {
        "description": "Utilisez les agendas et fichiers Drive depuis cet espace de travail.",
        "setupHint": "Saisissez les informations de l’application Google uniquement dans la configuration protégée, puis lancez la vérification.",
        "permissions": [
          "Accès à l’agenda",
          "Accès aux fichiers Drive"
        ],
        "searchTerms": [
          "calendar",
          "drive",
          "google",
          "events",
          "files"
        ]
      },
      "telegram": {
        "description": "Parlez à Hermes via un bot Telegram lié à cet espace de travail.",
        "setupHint": "Suivez la configuration guidée du bot et envoyez un message de test.",
        "permissions": [
          "Réception des messages envoyés au bot configuré",
          "Envoi de réponses via ce bot"
        ],
        "searchTerms": [
          "messaging",
          "bot",
          "chat"
        ]
      },
      "whatsapp": {
        "description": "Connectez un numéro WhatsApp Cloud via la configuration guidée.",
        "setupHint": "Terminez les étapes protégées d’identifiants et de webhook, puis lancez la vérification.",
        "permissions": [
          "Réception des messages acheminés",
          "Envoi de réponses via le numéro configuré"
        ],
        "searchTerms": [
          "meta",
          "messaging",
          "cloud api"
        ]
      },
      "skills_hub": {
        "description": "Examinez et installez une compétence Hermes déclarée depuis sa source exacte.",
        "setupHint": "Examinez la source et les résultats de l’analyse avant une action distincte d’installation ou d’activation.",
        "permissions": [
          "Les autorisations varient selon la compétence et sont affichées avant l’installation"
        ],
        "searchTerms": [
          "skill",
          "hub",
          "install",
          "trust"
        ]
      },
      "local_plugins": {
        "description": "Examinez les extensions locales déclarées sans exposer les chemins du runtime ni la configuration brute.",
        "setupHint": "Examinez la source, la version, les déclarations et le résultat de confiance avant l’activation.",
        "permissions": [
          "Les outils, hooks et commandes déclarés sont examinés avant l’activation"
        ],
        "searchTerms": [
          "plugin",
          "local",
          "hooks",
          "commands"
        ]
      },
      "browser": {
        "description": "Utilisez les outils de navigateur inclus dans la version fixée du runtime Hermes.",
        "setupHint": "Vérifiez l’inventaire du runtime fixé et les capacités actuelles du navigateur.",
        "permissions": [
          "Accès aux sites web demandé par l’utilisateur"
        ],
        "searchTerms": [
          "web",
          "browse",
          "automation"
        ]
      },
      "webhooks": {
        "description": "Préparez un rappel de service entrant ou sortant au périmètre limité.",
        "setupHint": "Utilisez la configuration protégée ; les secrets n’entrent jamais dans le chat.",
        "permissions": [
          "Service, objectif, périmètres, rappel, plan de test et plan de déconnexion"
        ],
        "searchTerms": [
          "callback",
          "http",
          "events",
          "integration"
        ]
      },
      "slack": {
        "description": "Demandez à Hermes de vous guider dans le parcours de connexion Slack approuvé.",
        "setupHint": "Un appui envoie une demande de configuration prédéfinie, sans secret, au chat principal.",
        "permissions": [
          "L’envoi de la demande de configuration n’accorde aucune autorisation"
        ],
        "searchTerms": [
          "messaging",
          "workspace",
          "chat"
        ]
      },
      "stripe": {
        "description": "Demandez à Hermes de planifier une configuration Stripe limitée sans déplacer d’argent.",
        "setupHint": "Un appui envoie une demande de configuration prédéfinie, sans secret, au chat principal.",
        "permissions": [
          "L’envoi de la demande de configuration n’accorde aucune autorisation"
        ],
        "searchTerms": [
          "billing",
          "payments",
          "finance"
        ]
      }
    },
    "partialStatus": "Certains états de connexion n'ont pas pu être actualisés. Les résultats disponibles sont affichés ; les actions de configuration concernées restent indisponibles jusqu'au rétablissement du catalogue.",
    "loading": "Chargement des connexions…",
    "loadError": "Les connexions sont actuellement inaccessibles.",
    "operationComplete": "L’état de la connexion a été mis à jour.",
    "webhookRequested": "La configuration du webhook a été demandée. Aucun fournisseur ni secret n’a été modifié.",
    "actionError": "Impossible de terminer l’action de connexion.",
    "confirmTitle": "Confirmer l’examen de la source",
    "confirmBody": "Confirmez avoir examiné la source exacte fixée, les autorisations et les informations de confiance pour cet espace de travail.",
    "cancel": "Annuler",
    "confirm": "Confirmer"
  }
};

const systemPagesIt: MobileSystemPagesCopy = {
  "common": {
    "dismiss": "Chiudi questo avviso"
  },
  "dashboard": {
    "opening": "Apertura della dashboard Hermes…",
    "error": "Impossibile aprire la dashboard Hermes.",
    "retry": "Riprova"
  },
  "automations": {
    "title": "Automazioni",
    "description": "Promemoria e attività pianificate salvati in Hermes.",
    "refresh": "Aggiorna automazioni",
    "loadError": "Impossibile caricare le automazioni.",
    "add": "Aggiungi automazione",
    "addPrompt": "Aiutami a creare una nuova automazione Hermes. Chiedi cosa deve succedere, quando eseguirla, quale fuso orario e canale di consegna usare, poi creala tramite il normale percorso di promemoria o cron Hermes dopo la mia conferma dei dettagli.",
    "loaded": "Automazioni caricate: {count}.",
    "emptyTitle": "Nessuna automazione",
    "emptyBody": "Usa Aggiungi automazione per chiedere a Hermes di creare un promemoria o un’attività pianificata.",
    "active": "Attivo",
    "paused": "In pausa",
    "unknown": "Sconosciuto",
    "next": "Prossima",
    "noNext": "Prossima esecuzione non mostrata",
    "delivery": "Consegna",
    "result": {
      "never": "Nessun risultato salvato",
      "pending": "Risultato in attesa",
      "stored": "Ultimo risultato salvato",
      "failed": "L’ultima esecuzione non è riuscita",
      "not_stored": "L’ultima esecuzione non ha salvato alcun risultato"
    },
    "chat": "Chat",
    "chatAbout": "Parla di {title}",
    "chatPrompt": "Parlami di questa automazione Hermes: {title} ({id}). Mostra pianificazione, stato, consegna e scopo, poi rispondi alle mie domande. Non modificare nulla se non lo chiedo.",
    "edit": "Modifica",
    "standard": "Predefinita",
    "reset": "Ripristina impostazioni predefinite",
    "resetConfirm": "Conferma ripristino",
    "pause": "Metti in pausa",
    "resume": "Riprendi",
    "delete": "Elimina",
    "deleteConfirmTitle": "Eliminare questa automazione?",
    "deleteConfirmMessage": "{title} sarà eliminata e non verrà più eseguita. L’operazione è irreversibile.",
    "deleteConfirm": "Elimina",
    "deleteCancel": "Mantieni",
    "versions": "Cronologia delle versioni",
    "versionsHide": "Nascondi cronologia delle versioni",
    "activeVersion": "In uso",
    "restore": "Ripristina",
    "restoreConfirm": "Conferma ripristino",
    "reinstall": "Ripristina",
    "reinstallConfirm": "Conferma ripristino",
    "schedule": {
      "daily": "ogni giorno",
      "everyDays": "ogni {count} giorni",
      "weekdays": "{weekdays}",
      "monthly": "ogni mese il {days}",
      "hourly": "ogni ora al minuto {minute}",
      "everyHours": "ogni {count} ore",
      "everyMinutes": "ogni {count} minuti",
      "once": "una volta il {date}",
      "unknown": "Pianificazione salvata in Hermes",
      "and": " e "
    },
    "editPrompt": "Aiutami a modificare questa automazione Hermes: {title} ({id}). Mostra prima pianificazione, stato, canale di consegna e scopo attuali. Poi chiedi cosa voglio cambiare e aggiorna il normale cron o promemoria Hermes solo dopo la mia conferma dei dettagli definitivi."
  },
  "tasks": {
    "title": "Attivita",
    "empty": "Non e stata ancora raccolta alcuna attivita.",
    "pendingTitle": "Non ancora classificata",
    "loading": "Caricamento delle attività ordinate…",
    "loadError": "L’elenco delle attività ordinate non è disponibile al momento.",
    "changeError": "Impossibile salvare la modifica.",
    "about": "Su questo ordine",
    "aboutSentence": "Questo ordine viene dall'ultima classificazione delle tue attivita Kanban.",
    "aboutClose": "Chiudi"
  },
  "account": {
    "ownerTitle": "Persone",
    "memberTitle": "Il tuo account",
    "monthlyBudget": "Budget mensile del modello",
    "allowanceUnavailable": "Lo stato attuale del contingente non è disponibile.",
    "allowanceRemaining": "Resta il {percent}% della quota inclusa.",
    "unavailable": "Non disponibile",
    "used": "{percent}% utilizzato",
    "yourDataTitle": "I tuoi dati",
    "yourDataDetail": "Scarica tutto ciò che Hey Hermes conserva per te: chat, attività, file dello spazio di lavoro e impostazioni.",
    "exportData": "Esporta i tuoi dati",
    "exportPreparing": "Preparazione…",
    "exportOpened": "L’esportazione si è aperta nel browser. Salvala da lì.",
    "signInMethods": "Metodi di accesso",
    "signInDetail": "Collega un fornitore solo mentre sei connesso a questo esatto account Hey. Indirizzi e-mail uguali non collegano mai gli account.",
    "linkGoogle": "Collega Google",
    "capacity": "Sono attivi {active}/{capacity} account. Rimuovere l’accesso conserva i dati salvati dello spazio di lavoro.",
    "name": "Nome",
    "email": "E-mail",
    "creating": "Creazione dell’account…",
    "createError": "Impossibile creare l’account.",
    "invite": "Invita una persona",
    "disabling": "Disattivazione dell’account…",
    "disableError": "Impossibile disattivare l’account.",
    "resetting": "Reimpostazione del codice dell’account…",
    "resetError": "Impossibile reimpostare il codice dell’account.",
    "detailsLoading": "I dettagli dell'account si stanno caricando.",
    "roleOwner": "Proprietario",
    "roleMember": "Membro",
    "statusActive": "Attivo",
    "statusDisabled": "Disattivato",
    "lastSignIn": "Ultimo accesso",
    "notYet": "mai",
    "resetAccess": "Reimposta l’accesso di {name}",
    "disableAccess": "Disattiva {name}",
    "created": "Creato {email}.",
    "preparedWorkspace": "È stato assegnato uno spazio di lavoro preparato.",
    "runtimeReady": "Runtime pronto.",
    "runtimeAttention": "Il runtime richiede attenzione.",
    "runtimeStarts": "Il runtime si avvia automaticamente all’utilizzo.",
    "oneTimeCode": "Codice monouso: {code}",
    "disabled": "{email} è disattivato. I dati dello spazio di lavoro sono conservati.",
    "reset": "Reimpostato {email}.",
    "updatedAccount": "{email} è stato aggiornato.",
    "archive": "Crea un archivio completo",
    "archiveQueued": "Archivio completo in coda. Comparirà nell’elenco sottostante quando sarà pronto.",
    "archiveFailed": "Impossibile mettere in coda l’archivio completo.",
    "recentExports": "Esportazioni recenti",
    "noExports": "Non è ancora stata creata alcuna esportazione.",
    "exportRequested": "Richiesta",
    "exportCompleted": "completata",
    "download": "Scarica",
    "downloadFailed": "Impossibile aprire questa esportazione.",
    "exportKind": {
      "export": "Esportazione dei dati",
      "archive": "Archivio completo"
    },
    "exportStatus": {
      "queued": "In coda",
      "running": "In corso",
      "completed": "Completati",
      "failed": "Non riuscita",
      "cancelled": "Annullata"
    },
    "restoreTitle": "Ripristina",
    "restoreDetail": "Un ripristino può sovrascrivere dati privati con una copia più vecchia. Parti dal supporto, così l'azione esatta viene confermata prima.",
    "restoreAsk": "Chiedi al supporto un ripristino",
    "restorePrompt": "Ho bisogno di aiuto con un ripristino Hey Hermes. Chiedi a quale esportazione, archivio o data mi riferisco, spiega cosa può essere ripristinato in sicurezza e non sovrascrivere dati attivi finché non approvo esplicitamente il piano esatto di ripristino.",
    "deletion": {
      "confirmTitle": "Eliminare questo account Hey Hermes?",
      "confirmBody": "Le sessioni e le autorizzazioni Hey vengono revocate immediatamente e i tuoi dati Hey attivi vengono eliminati. L’operazione è irreversibile.\n\nQuesto non annulla l’abbonamento App Store e non riguarda altri account di prodotti né il tuo indirizzo email.",
      "keep": "Mantieni l'account",
      "delete": "Elimina account",
      "title": "Elimina questo account Hey",
      "description": "Autenticati di nuovo, poi conferma. Questo revoca le tue sessioni e autorizzazioni Hey ed elimina i tuoi dati Hey attivi. La disdetta dell'abbonamento è separata e nessun altro account prodotto viene toccato.",
      "credentialPlaceholder": "Password o codice di accesso",
      "credentialLabel": "Password o codice di accesso per l'eliminazione dell'account",
      "recentSignInHint": "Lascialo vuoto solo se ti sei collegato con Apple o Google negli ultimi minuti.",
      "confirmationLabel": "Digita {phrase} per confermare",
      "deleting": "Eliminazione…",
      "reauthenticationError": "La password o il codice di accesso non corrispondono. Se hai usato Apple o Google, accedi di nuovo e riprova.",
      "confirmationError": "Digita esattamente {phrase} per confermare.",
      "genericError": "Non è stato possibile eliminare l'account. Non è stato cambiato nulla.",
      "deleted": "Account Hey Hermes eliminato. Ricevuta {receipt}.",
      "purged": "I tuoi dati Hey attivi sono stati eliminati.",
      "purgePending": "I tuoi dati Hey attivi saranno eliminati entro il {date}.",
      "subscriptionKept": "Il tuo abbonamento App Store non è stato annullato."
    }
  },
  "security": {
    "title": "Sicurezza e accesso",
    "description": "Accesso del piano di controllo, autorizzazioni di assistenza ed eccezioni infrastrutturali per questo server Hermes privato.",
    "anchorPending": "ancoraggio in attesa",
    "stateRow": "Stato attuale",
    "privacyPromise": "I tuoi dati si trovano sul tuo server e appartengono a te.",
    "privacyDetailsOpen": "Cosa significa",
    "privacyWhere": "Hey Hermes mantiene operativo il tuo server: aggiornamenti, riavvii e backup. Serve un accesso permanente; senza di esso il server non funzionerebbe. Non esaminiamo conversazioni, attività o file. È il nostro impegno, non una barriera tecnica. Gli accessi che concedi personalmente sono elencati qui sotto con data, ambito e durata.",
    "privacyLink": "Informativa sulla privacy",
    "serverWorkspace": "Spazio di lavoro",
    "serverIpv4": "IPv4 pubblico",
    "serverType": "Server",
    "serverSince": "In servizio dal",
    "accessTitle": "Accessi concessi da te",
    "accessNone": "Nessun accesso finora.",
    "accessGrantedByYou": "concesso da te",
    "accessAutomatic": "automatico",
    "accessManual": "manuale",
    "accessNeverUsed": "mai usato",
    "accessUsed": "usato",
    "accessEnded": "terminato",
    "adminTitle": "Accesso amministratore",
    "handover": "Passaggio di controllo",
    "customerControlledSince": "Sotto il controllo del cliente dal",
    "pending": "In attesa",
    "adminKey": "Chiave amministratore",
    "customerKey": "Chiave del cliente",
    "keyNotRegistered": "Non registrata",
    "standingAccess": "Accesso SSH/root di Hey Hermes",
    "noneDetected": "nessuno rilevato",
    "lastBaselineCheck": "Ultima verifica di riferimento",
    "notChecked": "Non verificato",
    "adminDetail": "Hey Hermes non mantiene un accesso SSH/root permanente dopo il passaggio di controllo. Il recupero a livello infrastrutturale resta possibile in emergenza perché il server è nell’account Hetzner di Hey Hermes. Questi eventi eccezionali sono mostrati qui.",
    "keyLabelPlaceholder": "Nome della chiave, ad esempio MacBook di Justus",
    "keyPlaceholder": "ssh-ed25519 AAAA...",
    "saveAdminKey": "Salva chiave amministratore",
    "adminKeySaved": "Chiave amministratore salvata. Il passaggio di controllo può avvenire durante la preparazione o da questa schermata.",
    "adminKeyFailed": "Impossibile salvare la chiave amministratore.",
    "runHandover": "Verifica passaggio di controllo",
    "handoverChecked": "Verifica del passaggio completata. Lo stato sopra è aggiornato.",
    "handoverFailed": "Impossibile verificare il passaggio di controllo.",
    "supportTitle": "Assistenza",
    "supportDetail": "L’accesso temporaneo è concesso nella schermata Assistenza. Qui sono elencati gli accessi concessi, la durata e gli ambiti.",
    "activeGrants": "Autorizzazioni attive",
    "none": "Nessuna",
    "noGrants": "Nessuna autorizzazione di assistenza attiva o passata.",
    "grantCodeHint": "Indizio del codice",
    "grantExpires": "Scadenza",
    "grantScopes": "Ambiti",
    "grantLastUsed": "Ultimo utilizzo",
    "grantRevoked": "Revocata",
    "revokeGrant": "Revoca questa autorizzazione di assistenza",
    "revokeDone": "Autorizzazione di assistenza revocata.",
    "revokeFailed": "Impossibile revocare l’autorizzazione di assistenza.",
    "openSupport": "Apri assistenza",
    "infrastructureTitle": "Infrastruttura",
    "exceptionalEvents": "Eventi eccezionali",
    "unmatchedEvents": "Eventi senza corrispondenza",
    "latestEvent": "Ultimo evento",
    "noEvents": "Nessuno",
    "latestEventHash": "Hash dell’ultimo evento",
    "noReceipt": "Nessuna ricevuta",
    "latestSealedBatch": "Ultimo lotto sigillato",
    "notSealed": "Non sigillato",
    "wormRetentionUntil": "Conservazione WORM fino al",
    "externalAnchor": "Ancoraggio esterno",
    "notAnchored": "Non ancora ancorato",
    "externalAnchorFallback": "esterno",
    "viewAnchor": "Visualizza ancoraggio esterno",
    "anchorOpenFailed": "Impossibile aprire l’ancoraggio esterno.",
    "infrastructureDetail": "Questi registri attestano l’infrastruttura Hey Hermes e gli accessi di assistenza. Non limitano ciò che puoi fare nel tuo server Hermes privato.",
    "downloadReceipt": "Scarica ricevuta",
    "receiptShared": "Ricevuta di audit di sicurezza preparata. È solo una prova, non una restrizione sul tuo server Hermes privato.",
    "receiptFailed": "Impossibile preparare la ricevuta di audit di sicurezza."
  },
  "aiAccess": {
    "title": "Accesso IA",
    "description": "Scegli una route standard per questo spazio di lavoro.",
    "current": "Accesso IA attuale",
    "currentUnavailable": "Non è stato possibile confermare l'accesso IA attuale.",
    "none": "Nessuna connessione IA",
    "chatGpt": "ChatGPT OAuth",
    "claude": "Claude OAuth",
    "included": "IA inclusa",
    "connected": "Collegato",
    "notConnected": "Non collegato",
    "statusUnavailable": "Stato non disponibile",
    "working": "In corso…",
    "resultSuccess": "Collegato e selezionato.",
    "resultCancelled": "Accesso annullato. Nessuna modifica.",
    "resultProviderError": "L'accesso al fornitore non è potuto partire. Riprova.",
    "resultLinkError": "L’accesso è pronto, ma iOS non è riuscito ad aprirlo. Tocca Apri accesso.",
    "resultUnknown": "La connessione non è ancora confermata. Completa l’accesso e verifica di nuovo.",
    "includedUnavailableAction": "L’IA inclusa non è confermata per questo spazio di lavoro. Aggiorna e riprova.",
    "chatGptDetail": "Usa il tuo account ChatGPT tramite OAuth.",
    "claudeDetail": "Usa il tuo account Claude tramite OAuth. Questa route consuma il budget di utilizzo aggiuntivo del tuo account Claude, non il contingente del piano: l'utilizzo aggiuntivo deve quindi essere attivo.",
    "includedDetail": "Usa il contingente gestito incluso nel tuo piano.",
    "allowanceLoading": "La quota inclusa è in fase di conferma. Nessun valore residuo viene stimato.",
    "allowanceRemaining": "Resta il {percent}% della quota inclusa.",
    "includedModelUnavailable": "Il modello incluso attuale non è disponibile.",
    "connectChatGpt": "Collega ChatGPT",
    "reconnectChatGpt": "Ricollega o cambia ChatGPT",
    "connectClaude": "Collega Claude",
    "reconnectClaude": "Ricollega o cambia Claude",
    "chatGptComplete": "Completa la connessione ChatGPT",
    "chatGptSteps": "1. Apri l'accesso. 2. Inserisci questo codice. 3. Verifica lo stato.",
    "copyChatGptCode": "Copia il codice ChatGPT",
    "openSignIn": "Apri l'accesso",
    "checkStatus": "Verifica stato",
    "claudeComplete": "Completa la connessione Claude",
    "claudeCodeHint": "Incolla qui il codice restituito da Claude.",
    "claudeCodePlaceholder": "Codice di autorizzazione Claude",
    "completeConnection": "Completa la connessione",
    "cancel": "Annulla",
    "otherConnection": "Aggiungi un'altra connessione IA",
    "otherConnectionPrompt": "Aiutami a capire un'altra connessione IA per questo spazio di lavoro. Chiedi che cosa voglio collegare, spiega il percorso sicuro supportato e non cambiare alcun fornitore o credenziale senza la mia conferma esplicita.",
    "oauthUsageTruth": "Le percentuali del fornitore compaiono solo quando il fornitore fornisce dati d'uso attendibili.",
    "saved": "Scelta salvata. Vale dalla prossima esecuzione.",
    "savedUnconfirmed": "Scelta salvata, ma non è stato possibile confermare lo stato attuale. Ricarica la pagina.",
    "saveFailed": "Non è stato possibile salvare l'accesso IA.",
    "claudeStarted": "L’accesso a Claude è stato aperto.",
    "claudeConnected": "Claude è collegato.",
    "claudeFailed": "Non è stato possibile completare la connessione Claude."
  },
  "plugins": {
    "title": "Connessioni",
    "description": "Collega strumenti e servizi a questo spazio.",
    "searchPlaceholder": "Cerca connessioni",
    "yours": "Le tue connessioni",
    "all": "Tutte le connessioni",
    "empty": "Nessuna connessione corrisponde a questa ricerca.",
    "close": "Chiudi",
    "source": "Fonte ufficiale",
    "tools": "Strumenti",
    "skills": "Competenze",
    "permissions": "Autorizzazioni",
    "setup": "Configurazione",
    "working": "In corso…",
    "statusLabels": {
      "available": "Aggiungi",
      "authorization_required": "Autorizza",
      "setup_incomplete": "Completa la configurazione",
      "added": "Aggiunto",
      "attention": "Richiede attenzione"
    },
    "connectionStatusLabels": {
      "available": "Disponibile",
      "authorization_required": "Autorizzazione necessaria",
      "setup_incomplete": "Configurazione incompleta",
      "unknown": "Sconosciuto",
      "unavailable": "Non disponibile",
      "connected": "Collegato",
      "attention": "Richiede attenzione"
    },
    "statusDetails": {
      "available": "Disponibile per questo spazio.",
      "authorization_required": "Manca ancora l'autorizzazione.",
      "setup_incomplete": "La configurazione non è ancora completa.",
      "added": "Disponibile in questo spazio.",
      "attention": "Le prove attuali richiedono attenzione."
    },
    "actionLabels": {
      "add": "Aggiungi",
      "authorize": "Autorizza",
      "finish_setup": "Completa la configurazione",
      "probe": "Verifica",
      "disconnect": "Gestisci",
      "repair": "Ripara",
      "review_source": "Controlla la fonte",
      "confirm_review": "Conferma il controllo",
      "install": "Apri l'installazione",
      "activate": "Apri l'attivazione",
      "enable": "Apri l'abilitazione",
      "send_setup_request": "Chiedi a Hermes"
    },
    "items": {
      "calendar": {
        "description": "Usa gli eventi di Google Calendar da questo spazio di lavoro.",
        "setupHint": "Continua con la configurazione Google protetta esistente.",
        "permissions": [
          "Accesso al calendario"
        ],
        "searchTerms": [
          "calendar",
          "google",
          "events"
        ]
      },
      "google_drive": {
        "description": "Usa i file di Google Drive da questo spazio di lavoro.",
        "setupHint": "Continua con la configurazione Google protetta esistente.",
        "permissions": [
          "Accesso ai file di Drive"
        ],
        "searchTerms": [
          "drive",
          "google",
          "files"
        ]
      },
      "discord": {
        "description": "Chiedi a Hermes di guidare una configurazione limitata di un bot o webhook Discord.",
        "setupHint": "Un tocco invia una richiesta di configurazione predefinita, senza segreti, alla chat principale.",
        "permissions": [
          "Inviare la richiesta di configurazione non concede alcuna autorizzazione"
        ],
        "searchTerms": [
          "messaging",
          "bot",
          "server"
        ]
      },
      "gmail": {
        "description": "Leggi e organizza le email con la tua autorizzazione.",
        "setupHint": "Autorizza questo spazio di lavoro tramite Google OAuth.",
        "permissions": [
          "Lettura dei metadati e del contenuto delle email"
        ],
        "searchTerms": [
          "email",
          "google",
          "inbox"
        ]
      },
      "google_workspace": {
        "description": "Usa calendari e file di Drive da questo spazio di lavoro.",
        "setupHint": "Inserisci i dati dell’app Google solo nella configurazione protetta, poi avvia la verifica.",
        "permissions": [
          "Accesso al calendario",
          "Accesso ai file di Drive"
        ],
        "searchTerms": [
          "calendar",
          "drive",
          "google",
          "events",
          "files"
        ]
      },
      "telegram": {
        "description": "Parla con Hermes tramite un bot Telegram associato allo spazio di lavoro.",
        "setupHint": "Segui la configurazione guidata del bot e invia un messaggio di prova.",
        "permissions": [
          "Ricezione dei messaggi inviati al bot configurato",
          "Invio di risposte tramite quel bot"
        ],
        "searchTerms": [
          "messaging",
          "bot",
          "chat"
        ]
      },
      "whatsapp": {
        "description": "Collega un numero WhatsApp Cloud tramite la configurazione guidata.",
        "setupHint": "Completa i passaggi protetti per credenziali e webhook, poi avvia la verifica.",
        "permissions": [
          "Ricezione dei messaggi instradati",
          "Invio di risposte tramite il numero configurato"
        ],
        "searchTerms": [
          "meta",
          "messaging",
          "cloud api"
        ]
      },
      "skills_hub": {
        "description": "Esamina e installa una competenza Hermes dichiarata dalla sua fonte esatta.",
        "setupHint": "Esamina la fonte e i risultati della scansione prima di installare o attivare separatamente.",
        "permissions": [
          "Le autorizzazioni variano in base alla competenza e vengono mostrate prima dell’installazione"
        ],
        "searchTerms": [
          "skill",
          "hub",
          "install",
          "trust"
        ]
      },
      "local_plugins": {
        "description": "Esamina i plugin locali dichiarati senza esporre percorsi del runtime o configurazioni grezze.",
        "setupHint": "Esamina fonte, versione, dichiarazioni ed esito di affidabilità prima di attivare.",
        "permissions": [
          "Strumenti, hook e comandi dichiarati vengono esaminati prima dell’attivazione"
        ],
        "searchTerms": [
          "plugin",
          "local",
          "hooks",
          "commands"
        ]
      },
      "browser": {
        "description": "Usa gli strumenti del browser inclusi nella versione fissata del runtime Hermes.",
        "setupHint": "Verifica l’inventario fissato del runtime e le capacità attuali del browser.",
        "permissions": [
          "Accesso ai siti web richiesto dall’utente"
        ],
        "searchTerms": [
          "web",
          "browse",
          "automation"
        ]
      },
      "webhooks": {
        "description": "Prepara una chiamata di servizio in entrata o in uscita con limiti definiti.",
        "setupHint": "Usa la configurazione protetta; i segreti non entrano mai nella chat.",
        "permissions": [
          "Servizio, scopo, ambiti, callback, piano di test e piano di disconnessione"
        ],
        "searchTerms": [
          "callback",
          "http",
          "events",
          "integration"
        ]
      },
      "slack": {
        "description": "Chiedi a Hermes di guidarti nel percorso di connessione Slack approvato.",
        "setupHint": "Un tocco invia una richiesta di configurazione predefinita, senza segreti, alla chat principale.",
        "permissions": [
          "Inviare la richiesta di configurazione non concede alcuna autorizzazione"
        ],
        "searchTerms": [
          "messaging",
          "workspace",
          "chat"
        ]
      },
      "stripe": {
        "description": "Chiedi a Hermes di pianificare una configurazione Stripe limitata senza spostare denaro.",
        "setupHint": "Un tocco invia una richiesta di configurazione predefinita, senza segreti, alla chat principale.",
        "permissions": [
          "Inviare la richiesta di configurazione non concede alcuna autorizzazione"
        ],
        "searchTerms": [
          "billing",
          "payments",
          "finance"
        ]
      }
    },
    "partialStatus": "Alcuni stati di connessione non sono stati aggiornati. Vengono mostrati i risultati disponibili; le azioni di configurazione interessate restano non disponibili finché il catalogo non si riprende.",
    "loading": "Caricamento delle connessioni…",
    "loadError": "Le connessioni non sono raggiungibili al momento.",
    "operationComplete": "Lo stato della connessione è stato aggiornato.",
    "webhookRequested": "È stata richiesta la configurazione del webhook. Nessun provider o segreto è stato modificato.",
    "actionError": "Impossibile completare l’azione di connessione.",
    "confirmTitle": "Conferma esame della fonte",
    "confirmBody": "Conferma di aver esaminato la fonte esatta fissata, le autorizzazioni e le informazioni di affidabilità per questo spazio di lavoro.",
    "cancel": "Annulla",
    "confirm": "Conferma"
  }
};

const systemPagesPt: MobileSystemPagesCopy = {
  "common": {
    "dismiss": "Fechar este aviso"
  },
  "dashboard": {
    "opening": "Abrindo o painel do Hermes…",
    "error": "Não foi possível abrir o painel do Hermes.",
    "retry": "Tentar novamente"
  },
  "automations": {
    "title": "Automações",
    "description": "Lembretes e tarefas agendadas salvos no Hermes.",
    "refresh": "Atualizar automações",
    "loadError": "Não foi possível carregar as automações.",
    "add": "Adicionar automação",
    "addPrompt": "Ajude-me a criar uma nova automação do Hermes. Pergunte o que deve acontecer, quando executar, qual fuso horário e canal de entrega usar. Depois crie-a pelo caminho normal de lembrete ou cron do Hermes após eu confirmar os detalhes.",
    "loaded": "Automações carregadas: {count}.",
    "emptyTitle": "Nenhuma automação ainda",
    "emptyBody": "Use Adicionar automação para pedir ao Hermes que crie um lembrete ou uma tarefa agendada.",
    "active": "Ativa",
    "paused": "Pausada",
    "unknown": "Desconhecido",
    "next": "Próxima",
    "noNext": "Próxima execução não exibida",
    "delivery": "Entrega",
    "result": {
      "never": "Nenhum resultado salvo ainda",
      "pending": "Resultado pendente",
      "stored": "Último resultado salvo",
      "failed": "A última execução falhou",
      "not_stored": "A última execução não salvou nenhum resultado"
    },
    "chat": "Chat",
    "chatAbout": "Conversar sobre {title}",
    "chatPrompt": "Fale sobre esta automação do Hermes: {title} ({id}). Mostre o agendamento, estado, entrega e finalidade e responda às minhas perguntas. Não mude nada sem que eu peça.",
    "edit": "Editar",
    "standard": "Padrão",
    "reset": "Restaurar padrão",
    "resetConfirm": "Confirmar redefinição",
    "pause": "Pausar",
    "resume": "Retomar",
    "delete": "Excluir",
    "deleteConfirmTitle": "Excluir esta automação?",
    "deleteConfirmMessage": "{title} será excluída e não será executada novamente. Isso não pode ser desfeito.",
    "deleteConfirm": "Excluir",
    "deleteCancel": "Manter",
    "versions": "Histórico de versões",
    "versionsHide": "Ocultar histórico de versões",
    "activeVersion": "Em uso",
    "restore": "Restaurar",
    "restoreConfirm": "Confirmar restauração",
    "reinstall": "Restaurar",
    "reinstallConfirm": "Confirmar restauração",
    "schedule": {
      "daily": "diariamente",
      "everyDays": "a cada {count} dias",
      "weekdays": "{weekdays}",
      "monthly": "mensalmente no dia {days}",
      "hourly": "a cada hora no minuto {minute}",
      "everyHours": "a cada {count} horas",
      "everyMinutes": "a cada {count} minutos",
      "once": "uma vez em {date}",
      "unknown": "Agendamento salvo no Hermes",
      "and": " e "
    },
    "editPrompt": "Ajude-me a editar esta automação do Hermes: {title} ({id}). Primeiro mostre o agendamento, estado, canal de entrega e finalidade atuais. Depois pergunte o que quero mudar e só atualize o cron ou lembrete normal do Hermes após minha confirmação dos detalhes finais."
  },
  "tasks": {
    "title": "Tarefas",
    "empty": "Ainda não foram coletadas tarefas.",
    "pendingTitle": "Ainda sem classificação",
    "loading": "Carregando tarefas priorizadas…",
    "loadError": "A lista de tarefas priorizadas está indisponível no momento.",
    "changeError": "Não foi possível salvar essa alteração.",
    "about": "Sobre esta ordem",
    "aboutSentence": "Esta ordem vem da última execução de priorização sobre suas tarefas do Kanban.",
    "aboutClose": "Fechar"
  },
  "account": {
    "ownerTitle": "Pessoas",
    "memberTitle": "Sua conta",
    "monthlyBudget": "Orçamento mensal de modelo",
    "allowanceUnavailable": "O status atual da cota não está disponível.",
    "allowanceRemaining": "Restam {percent}% da cota incluída.",
    "unavailable": "Indisponível",
    "used": "{percent}% utilizado",
    "yourDataTitle": "Seus dados",
    "yourDataDetail": "Baixe tudo o que o Hey Hermes guarda para você: conversas, tarefas, arquivos do espaço de trabalho e configurações.",
    "exportData": "Exportar seus dados",
    "exportPreparing": "Preparando…",
    "exportOpened": "Sua exportação foi aberta no navegador. Salve-a por lá.",
    "signInMethods": "Métodos de login",
    "signInDetail": "Vincule um provedor apenas enquanto estiver conectado exatamente nesta conta Hey. Endereços de e-mail iguais nunca vinculam contas.",
    "linkGoogle": "Vincular Google",
    "capacity": "{active}/{capacity} contas estão ativas. Remover o acesso preserva os dados salvos do espaço de trabalho.",
    "name": "Nome",
    "email": "E-mail",
    "creating": "Criando conta…",
    "createError": "Não foi possível criar a conta.",
    "invite": "Convidar pessoa",
    "disabling": "Desativando conta…",
    "disableError": "Não foi possível desativar a conta.",
    "resetting": "Redefinindo o código da conta…",
    "resetError": "Não foi possível redefinir o código da conta.",
    "detailsLoading": "Os detalhes da conta estão carregando.",
    "roleOwner": "Proprietário",
    "roleMember": "Membro",
    "statusActive": "Ativa",
    "statusDisabled": "Desativada",
    "lastSignIn": "Último login",
    "notYet": "ainda não",
    "resetAccess": "Redefinir acesso de {name}",
    "disableAccess": "Desativar {name}",
    "created": "{email} criado.",
    "preparedWorkspace": "Um espaço de trabalho preparado foi atribuído.",
    "runtimeReady": "Runtime pronto.",
    "runtimeAttention": "O runtime precisa de atenção.",
    "runtimeStarts": "O runtime inicia automaticamente quando usado.",
    "oneTimeCode": "Código de uso único: {code}",
    "disabled": "{email} está desativado. Os dados do espaço de trabalho foram preservados.",
    "reset": "{email} redefinido.",
    "updatedAccount": "{email} foi atualizado.",
    "archive": "Criar arquivo completo",
    "archiveQueued": "Arquivo completo na fila. Ele aparecerá na lista abaixo quando estiver pronto.",
    "archiveFailed": "Não foi possível colocar o arquivo completo na fila.",
    "recentExports": "Exportações recentes",
    "noExports": "Nenhuma exportação foi criada ainda.",
    "exportRequested": "Solicitada",
    "exportCompleted": "concluída",
    "download": "Baixar",
    "downloadFailed": "Não foi possível abrir esta exportação.",
    "exportKind": {
      "export": "Exportação de dados",
      "archive": "Arquivo completo"
    },
    "exportStatus": {
      "queued": "Na fila",
      "running": "Em andamento",
      "completed": "Concluídas",
      "failed": "Falhou",
      "cancelled": "Cancelada"
    },
    "restoreTitle": "Restaurar",
    "restoreDetail": "Restaurar dados pode sobrescrever dados privados com uma cópia mais antiga. Comece pelo Suporte para que a ação exata seja confirmada primeiro.",
    "restoreAsk": "Perguntar ao Suporte sobre a restauração",
    "restorePrompt": "Preciso de ajuda com uma restauração do Hey Hermes. Pergunte a qual exportação, arquivo ou data me refiro, explique o que pode ser restaurado com segurança e não sobrescreva dados ativos até que eu aprove explicitamente o plano exato de restauração.",
    "deletion": {
      "confirmTitle": "Excluir esta conta do Hey Hermes?",
      "confirmBody": "Suas sessões e autorizações Hey são revogadas imediatamente e seus dados Hey ativos são excluídos. Isso não pode ser desfeito.\n\nIsso não cancela sua assinatura da App Store nem afeta outra conta de produto ou seu endereço de e-mail.",
      "keep": "Manter conta",
      "delete": "Excluir conta",
      "title": "Excluir esta conta Hey",
      "description": "Autentique-se de novo e confirme. Isso revoga suas sessões e permissões do Hey e exclui seus dados ativos do Hey. O cancelamento da assinatura é separado e nenhuma outra conta de produto é afetada.",
      "credentialPlaceholder": "Senha ou código de acesso",
      "credentialLabel": "Senha ou código de acesso para excluir a conta",
      "recentSignInHint": "Deixe em branco só se você entrou com Apple ou Google nos últimos minutos.",
      "confirmationLabel": "Digite {phrase} para confirmar",
      "deleting": "Excluindo…",
      "reauthenticationError": "A senha ou o código de acesso não conferem. Se você entrou com Apple ou Google, entre de novo e tente outra vez.",
      "confirmationError": "Digite exatamente {phrase} para confirmar.",
      "genericError": "Não foi possível excluir a conta. Nada foi alterado.",
      "deleted": "Conta Hey Hermes excluída. Comprovante {receipt}.",
      "purged": "Seus dados ativos do Hey foram excluídos.",
      "purgePending": "Seus dados Hey ativos serão excluídos até {date}.",
      "subscriptionKept": "Sua assinatura da App Store não foi cancelada."
    }
  },
  "security": {
    "title": "Segurança e acesso",
    "description": "Acesso do plano de controle, autorizações de suporte e exceções de infraestrutura deste servidor Hermes privado.",
    "anchorPending": "ancoragem pendente",
    "stateRow": "Estado atual",
    "privacyPromise": "Seus dados ficam no seu próprio servidor e pertencem a você.",
    "privacyDetailsOpen": "O que isso significa",
    "privacyWhere": "O Hey Hermes mantém seu servidor funcionando: atualizações, reinicializações e backups. Isso exige acesso permanente; sem ele, o servidor não funcionaria. Não olhamos suas conversas, tarefas ou arquivos. Esse é nosso compromisso, não uma barreira técnica. Os acessos que você concede estão listados abaixo com data, escopo e duração.",
    "privacyLink": "Política de privacidade",
    "serverWorkspace": "Espaço de trabalho",
    "serverIpv4": "IPv4 público",
    "serverType": "Servidor",
    "serverSince": "Em serviço desde",
    "accessTitle": "Acessos concedidos por você",
    "accessNone": "Nenhum acesso até agora.",
    "accessGrantedByYou": "concedido por você",
    "accessAutomatic": "automático",
    "accessManual": "manual",
    "accessNeverUsed": "nunca usado",
    "accessUsed": "usado",
    "accessEnded": "encerrado",
    "adminTitle": "Acesso de administrador",
    "handover": "Transferência de controle",
    "customerControlledSince": "Sob controle do cliente desde",
    "pending": "Pendente",
    "adminKey": "Chave de administrador",
    "customerKey": "Chave do cliente",
    "keyNotRegistered": "Não registrada",
    "standingAccess": "Login SSH/root do Hey Hermes",
    "noneDetected": "nenhum detectado",
    "lastBaselineCheck": "Última verificação de referência",
    "notChecked": "Não verificado",
    "adminDetail": "O Hey Hermes não mantém um login SSH/root permanente após a transferência. A recuperação no nível da infraestrutura ainda pode ser feita em emergências porque seu servidor está na conta Hetzner do Hey Hermes. Esses eventos excepcionais são mostrados aqui.",
    "keyLabelPlaceholder": "Nome da chave, por exemplo MacBook do Justus",
    "keyPlaceholder": "ssh-ed25519 AAAA...",
    "saveAdminKey": "Salvar chave de administrador",
    "adminKeySaved": "Chave de administrador salva. A transferência pode ocorrer durante a preparação ou por esta tela.",
    "adminKeyFailed": "Não foi possível salvar a chave de administrador.",
    "runHandover": "Verificar transferência",
    "handoverChecked": "Verificação da transferência concluída. O estado acima foi atualizado.",
    "handoverFailed": "Não foi possível verificar a transferência.",
    "supportTitle": "Suporte",
    "supportDetail": "O acesso temporário é concedido na tela de Suporte. Os acessos concedidos, sua duração e seus escopos são listados aqui.",
    "activeGrants": "Autorizações ativas",
    "none": "Nenhuma",
    "noGrants": "Nenhuma autorização de suporte ativa ou passada.",
    "grantCodeHint": "Dica do código",
    "grantExpires": "Expira",
    "grantScopes": "Escopos",
    "grantLastUsed": "Último uso",
    "grantRevoked": "Revogada",
    "revokeGrant": "Revogar esta autorização de suporte",
    "revokeDone": "Autorização de suporte revogada.",
    "revokeFailed": "Não foi possível revogar a autorização de suporte.",
    "openSupport": "Abrir suporte",
    "infrastructureTitle": "Infraestrutura",
    "exceptionalEvents": "Eventos excepcionais",
    "unmatchedEvents": "Eventos sem correspondência",
    "latestEvent": "Último evento",
    "noEvents": "Nenhum",
    "latestEventHash": "Hash do último evento",
    "noReceipt": "Nenhum comprovante ainda",
    "latestSealedBatch": "Último lote selado",
    "notSealed": "Não selado",
    "wormRetentionUntil": "Retenção WORM até",
    "externalAnchor": "Ancoragem externa",
    "notAnchored": "Ainda não ancorado",
    "externalAnchorFallback": "externa",
    "viewAnchor": "Ver ancoragem externa",
    "anchorOpenFailed": "Não foi possível abrir a ancoragem externa.",
    "infrastructureDetail": "Estes registros são evidências sobre a infraestrutura e o acesso de suporte do Hey Hermes. Eles não limitam o que você pode fazer no seu servidor Hermes privado.",
    "downloadReceipt": "Baixar comprovante",
    "receiptShared": "Comprovante de auditoria de segurança preparado. É apenas uma evidência, não uma restrição no seu servidor Hermes privado.",
    "receiptFailed": "Não foi possível preparar o comprovante de auditoria de segurança."
  },
  "aiAccess": {
    "title": "Acesso à IA",
    "description": "Escolha uma rota padrão para este espaço de trabalho.",
    "current": "Acesso de IA atual",
    "currentUnavailable": "Não foi possível confirmar o acesso de IA atual.",
    "none": "Sem conexão de IA",
    "chatGpt": "ChatGPT OAuth",
    "claude": "Claude OAuth",
    "included": "IA incluída",
    "connected": "Conectado",
    "notConnected": "Não conectado",
    "statusUnavailable": "Status indisponível",
    "working": "Trabalhando…",
    "resultSuccess": "Conectado e selecionado.",
    "resultCancelled": "Login cancelado. Nada foi alterado.",
    "resultProviderError": "Não foi possível iniciar o login do provedor. Tente de novo.",
    "resultLinkError": "O login está pronto, mas o iOS não conseguiu abri-lo. Toque em Abrir login.",
    "resultUnknown": "A conexão ainda não foi confirmada. Conclua o login e verifique novamente.",
    "includedUnavailableAction": "A IA incluída não está confirmada para este espaço de trabalho. Atualize e tente novamente.",
    "chatGptDetail": "Use sua conta do ChatGPT via OAuth.",
    "claudeDetail": "Use sua conta do Claude via OAuth. Esta rota gasta o saldo de uso adicional da sua conta do Claude, não a cota do seu plano — portanto o uso adicional precisa estar ligado.",
    "includedDetail": "Use a cota gerenciada incluída no seu plano.",
    "allowanceLoading": "A cota incluída está sendo confirmada. Nenhum valor restante é estimado.",
    "allowanceRemaining": "Restam {percent}% da cota incluída.",
    "includedModelUnavailable": "O modelo incluído atual não está disponível.",
    "connectChatGpt": "Conectar ChatGPT",
    "reconnectChatGpt": "Reconectar ou trocar ChatGPT",
    "connectClaude": "Conectar Claude",
    "reconnectClaude": "Reconectar ou trocar Claude",
    "chatGptComplete": "Concluir a conexão com o ChatGPT",
    "chatGptSteps": "1. Abra o login. 2. Digite este código. 3. Verifique o status.",
    "copyChatGptCode": "Copiar o código do ChatGPT",
    "openSignIn": "Abrir login",
    "checkStatus": "Verificar status",
    "claudeComplete": "Concluir a conexão com o Claude",
    "claudeCodeHint": "Cole aqui o código devolvido pelo Claude.",
    "claudeCodePlaceholder": "Código de autorização do Claude",
    "completeConnection": "Concluir conexão",
    "cancel": "Cancelar",
    "otherConnection": "Adicionar outra conexão de IA",
    "otherConnectionPrompt": "Ajude-me a entender outra conexão de IA para este espaço de trabalho. Pergunte o que eu quero conectar, explique o caminho seguro compatível e não altere nenhum provedor ou credencial sem a minha confirmação explícita.",
    "oauthUsageTruth": "As porcentagens do provedor aparecem apenas quando ele fornece dados de uso confiáveis.",
    "saved": "Escolha salva. Vale a partir da próxima execução.",
    "savedUnconfirmed": "Escolha salva, mas não foi possível confirmar o status atual. Recarregue a página.",
    "saveFailed": "Não foi possível salvar o acesso de IA.",
    "claudeStarted": "O login do Claude foi aberto.",
    "claudeConnected": "O Claude está conectado.",
    "claudeFailed": "Não foi possível concluir a conexão com o Claude."
  },
  "plugins": {
    "title": "Conexões",
    "description": "Conecte ferramentas e serviços a este espaço.",
    "searchPlaceholder": "Buscar conexões",
    "yours": "Suas conexões",
    "all": "Todas as conexões",
    "empty": "Nenhuma conexão corresponde a esta busca.",
    "close": "Fechar",
    "source": "Fonte oficial",
    "tools": "Ferramentas",
    "skills": "Habilidades",
    "permissions": "Permissões",
    "setup": "Configuração",
    "working": "Trabalhando…",
    "statusLabels": {
      "available": "Adicionar",
      "authorization_required": "Autorizar",
      "setup_incomplete": "Concluir configuração",
      "added": "Adicionado",
      "attention": "Precisa de atenção"
    },
    "connectionStatusLabels": {
      "available": "Disponível",
      "authorization_required": "Autorização necessária",
      "setup_incomplete": "Configuração incompleta",
      "unknown": "Desconhecido",
      "unavailable": "Indisponível",
      "connected": "Conectado",
      "attention": "Precisa de atenção"
    },
    "statusDetails": {
      "available": "Disponível para este espaço.",
      "authorization_required": "A autorização ainda falta.",
      "setup_incomplete": "A configuração ainda não está completa.",
      "added": "Disponível neste espaço.",
      "attention": "As evidências atuais precisam de atenção."
    },
    "actionLabels": {
      "add": "Adicionar",
      "authorize": "Autorizar",
      "finish_setup": "Concluir configuração",
      "probe": "Verificar",
      "disconnect": "Gerenciar",
      "repair": "Reparar",
      "review_source": "Revisar a fonte",
      "confirm_review": "Confirmar a revisão",
      "install": "Abrir a instalação",
      "activate": "Abrir a ativação",
      "enable": "Abrir a liberação",
      "send_setup_request": "Perguntar ao Hermes"
    },
    "items": {
      "calendar": {
        "description": "Use eventos do Google Agenda neste espaço de trabalho.",
        "setupHint": "Continue pela configuração protegida existente do Google.",
        "permissions": [
          "Acesso ao calendário"
        ],
        "searchTerms": [
          "calendar",
          "google",
          "events"
        ]
      },
      "google_drive": {
        "description": "Use arquivos do Google Drive neste espaço de trabalho.",
        "setupHint": "Continue pela configuração protegida existente do Google.",
        "permissions": [
          "Acesso a arquivos do Drive"
        ],
        "searchTerms": [
          "drive",
          "google",
          "files"
        ]
      },
      "discord": {
        "description": "Peça ao Hermes para orientar uma configuração limitada de bot ou webhook do Discord.",
        "setupHint": "Um toque envia uma solicitação de configuração predefinida, sem segredos, ao chat principal.",
        "permissions": [
          "Enviar a solicitação de configuração não concede permissão"
        ],
        "searchTerms": [
          "messaging",
          "bot",
          "server"
        ]
      },
      "gmail": {
        "description": "Leia e organize e-mails com sua permissão.",
        "setupHint": "Autorize este espaço de trabalho pelo Google OAuth.",
        "permissions": [
          "Ler metadados e conteúdo dos e-mails"
        ],
        "searchTerms": [
          "email",
          "google",
          "inbox"
        ]
      },
      "google_workspace": {
        "description": "Use calendários e arquivos do Drive neste espaço de trabalho.",
        "setupHint": "Insira os dados do app do Google somente na configuração protegida e depois execute a verificação.",
        "permissions": [
          "Acesso ao calendário",
          "Acesso a arquivos do Drive"
        ],
        "searchTerms": [
          "calendar",
          "drive",
          "google",
          "events",
          "files"
        ]
      },
      "telegram": {
        "description": "Converse com o Hermes por um bot do Telegram vinculado ao espaço de trabalho.",
        "setupHint": "Siga a configuração guiada do bot e envie uma mensagem de teste.",
        "permissions": [
          "Receber mensagens enviadas ao bot configurado",
          "Enviar respostas por esse bot"
        ],
        "searchTerms": [
          "messaging",
          "bot",
          "chat"
        ]
      },
      "whatsapp": {
        "description": "Conecte um número do WhatsApp Cloud pela configuração guiada.",
        "setupHint": "Conclua as etapas protegidas de credenciais e webhook e depois execute a verificação.",
        "permissions": [
          "Receber mensagens encaminhadas",
          "Enviar respostas pelo número configurado"
        ],
        "searchTerms": [
          "meta",
          "messaging",
          "cloud api"
        ]
      },
      "skills_hub": {
        "description": "Revise e instale uma habilidade declarada do Hermes a partir de sua fonte exata.",
        "setupHint": "Revise a fonte e os resultados da análise antes de instalar ou ativar separadamente.",
        "permissions": [
          "As permissões variam por habilidade e são mostradas antes da instalação"
        ],
        "searchTerms": [
          "skill",
          "hub",
          "install",
          "trust"
        ]
      },
      "local_plugins": {
        "description": "Inspecione plugins locais declarados sem expor caminhos do runtime nem configurações brutas.",
        "setupHint": "Revise fonte, versão, declarações e resultado de confiança antes de ativar.",
        "permissions": [
          "Ferramentas, hooks e comandos declarados são revisados antes da ativação"
        ],
        "searchTerms": [
          "plugin",
          "local",
          "hooks",
          "commands"
        ]
      },
      "browser": {
        "description": "Use as ferramentas de navegador incluídas na versão fixada do runtime Hermes.",
        "setupHint": "Verifique o inventário fixado do runtime e a capacidade atual do navegador.",
        "permissions": [
          "Acesso a sites solicitado pelo usuário"
        ],
        "searchTerms": [
          "web",
          "browse",
          "automation"
        ]
      },
      "webhooks": {
        "description": "Prepare uma chamada de serviço de entrada ou saída com limites definidos.",
        "setupHint": "Use a configuração protegida; segredos nunca entram no chat.",
        "permissions": [
          "Serviço, finalidade, escopos, callback, plano de teste e plano de desconexão"
        ],
        "searchTerms": [
          "callback",
          "http",
          "events",
          "integration"
        ]
      },
      "slack": {
        "description": "Peça ao Hermes para orientar o caminho aprovado de conexão com o Slack.",
        "setupHint": "Um toque envia uma solicitação de configuração predefinida, sem segredos, ao chat principal.",
        "permissions": [
          "Enviar a solicitação de configuração não concede permissão"
        ],
        "searchTerms": [
          "messaging",
          "workspace",
          "chat"
        ]
      },
      "stripe": {
        "description": "Peça ao Hermes para planejar uma configuração limitada do Stripe sem movimentar dinheiro.",
        "setupHint": "Um toque envia uma solicitação de configuração predefinida, sem segredos, ao chat principal.",
        "permissions": [
          "Enviar a solicitação de configuração não concede permissão"
        ],
        "searchTerms": [
          "billing",
          "payments",
          "finance"
        ]
      }
    },
    "partialStatus": "Alguns status de conexão não puderam ser atualizados. Os resultados disponíveis são exibidos; as ações de configuração afetadas seguem indisponíveis até o catálogo se recuperar.",
    "loading": "Carregando conexões…",
    "loadError": "As conexões estão inacessíveis no momento.",
    "operationComplete": "O estado da conexão foi atualizado.",
    "webhookRequested": "A configuração do webhook foi solicitada. Nenhum provedor ou segredo foi alterado.",
    "actionError": "Não foi possível concluir a ação de conexão.",
    "confirmTitle": "Confirmar revisão da fonte",
    "confirmBody": "Confirme que revisou a fonte exata fixada, as permissões e as informações de confiança deste espaço de trabalho.",
    "cancel": "Cancelar",
    "confirm": "Confirmar"
  }
};

const systemPagesJa: MobileSystemPagesCopy = {
  "common": {
    "dismiss": "この通知を閉じる"
  },
  "dashboard": {
    "opening": "Hermesダッシュボードを開いています…",
    "error": "Hermesダッシュボードを開けませんでした。",
    "retry": "再試行"
  },
  "automations": {
    "title": "自動化",
    "description": "Hermesに保存されたリマインダーと定期実行ジョブです。",
    "refresh": "自動化を更新",
    "loadError": "自動化を読み込めませんでした。",
    "add": "自動化を追加",
    "addPrompt": "新しいHermes自動化の作成を手伝ってください。何をするか、いつ実行するか、タイムゾーンと配信先を確認し、私が詳細を承認してから通常のHermesリマインダーまたはcronの手順で作成してください。",
    "loaded": "自動化を{count}件読み込みました。",
    "emptyTitle": "自動化はまだありません",
    "emptyBody": "「自動化を追加」から、Hermesにリマインダーや定期実行ジョブの作成を依頼できます。",
    "active": "有効",
    "paused": "一時停止中",
    "unknown": "不明",
    "next": "次回",
    "noNext": "次回の実行は表示されていません",
    "delivery": "配信先",
    "result": {
      "never": "保存済みの結果はまだありません",
      "pending": "結果を処理中",
      "stored": "前回の結果を保存済み",
      "failed": "前回の実行に失敗しました",
      "not_stored": "前回の実行では結果が保存されませんでした"
    },
    "chat": "チャット",
    "chatAbout": "{title}について話す",
    "chatPrompt": "このHermes自動化について教えてください：{title}（{id}）。スケジュール、状態、配信先、目的を示し、質問に答えてください。私が依頼しない限り変更しないでください。",
    "edit": "編集",
    "standard": "標準",
    "reset": "標準に戻す",
    "resetConfirm": "リセットを確認",
    "pause": "一時停止",
    "resume": "再開",
    "delete": "削除",
    "deleteConfirmTitle": "この自動化を削除しますか？",
    "deleteConfirmMessage": "{title}は削除され、今後実行されなくなります。この操作は取り消せません。",
    "deleteConfirm": "削除",
    "deleteCancel": "残す",
    "versions": "バージョン履歴",
    "versionsHide": "バージョン履歴を隠す",
    "activeVersion": "使用中",
    "restore": "元に戻す",
    "restoreConfirm": "復元を確認",
    "reinstall": "元に戻す",
    "reinstallConfirm": "復元を確認",
    "schedule": {
      "daily": "毎日",
      "everyDays": "{count}日ごと",
      "weekdays": "{weekdays}",
      "monthly": "毎月{days}日",
      "hourly": "毎時{minute}分",
      "everyHours": "{count}時間ごと",
      "everyMinutes": "{count}分ごと",
      "once": "{date}に一度",
      "unknown": "スケジュールはHermesに保存されています",
      "and": "と"
    },
    "editPrompt": "このHermes自動化の編集を手伝ってください：{title}（{id}）。まず現在のスケジュール、状態、配信先、目的を示してください。次に変更内容を尋ね、私が最終的な詳細を確認してから通常のHermes cronまたはリマインダーを更新してください。"
  },
  "tasks": {
    "title": "タスク",
    "empty": "まだタスクは集まっていません。",
    "pendingTitle": "まだ順位がありません",
    "loading": "順位付きタスクを読み込み中…",
    "loadError": "現在、順位付きタスク一覧を利用できません。",
    "changeError": "変更を保存できませんでした。",
    "about": "この順番について",
    "aboutSentence": "この順番は、Kanban のタスクに対する直近の順位づけの結果です。",
    "aboutClose": "閉じる"
  },
  "account": {
    "ownerTitle": "メンバー",
    "memberTitle": "あなたのアカウント",
    "monthlyBudget": "月額モデル予算",
    "allowanceUnavailable": "現在の割り当て状況は利用できません。",
    "allowanceRemaining": "含まれる利用枠の残りは{percent}%です。",
    "unavailable": "利用できません",
    "used": "{percent}%使用済み",
    "yourDataTitle": "あなたのデータ",
    "yourDataDetail": "Hey Hermes が保管しているものをすべてダウンロードします: チャット、タスク、ワークスペースのファイル、設定。",
    "exportData": "データをエクスポート",
    "exportPreparing": "準備中…",
    "exportOpened": "エクスポートをブラウザで開きました。そこから保存してください。",
    "signInMethods": "サインイン方法",
    "signInDetail": "このアカウントにサインインしている間だけプロバイダーを連携してください。メールアドレスが同じでもアカウントは連携されません。",
    "linkGoogle": "Googleを連携",
    "capacity": "{active}/{capacity}件のアカウントが有効です。アクセスを削除しても保存済みのワークスペースデータは保持されます。",
    "name": "名前",
    "email": "メール",
    "creating": "アカウントを作成中…",
    "createError": "アカウントを作成できませんでした。",
    "invite": "メンバーを招待",
    "disabling": "アカウントを無効化中…",
    "disableError": "アカウントを無効化できませんでした。",
    "resetting": "アカウントコードをリセット中…",
    "resetError": "アカウントコードをリセットできませんでした。",
    "detailsLoading": "アカウントの詳細を読み込んでいます。",
    "roleOwner": "所有者",
    "roleMember": "メンバー",
    "statusActive": "有効",
    "statusDisabled": "無効",
    "lastSignIn": "前回のサインイン",
    "notYet": "まだありません",
    "resetAccess": "{name}のアクセスをリセット",
    "disableAccess": "{name}を無効化",
    "created": "{email}を作成しました。",
    "preparedWorkspace": "準備済みのワークスペースを割り当てました。",
    "runtimeReady": "ランタイムは準備完了です。",
    "runtimeAttention": "ランタイムの確認が必要です。",
    "runtimeStarts": "ランタイムは使用時に自動起動します。",
    "oneTimeCode": "ワンタイムコード：{code}",
    "disabled": "{email}は無効です。ワークスペースデータは保持されています。",
    "reset": "{email}をリセットしました。",
    "updatedAccount": "{email}を更新しました。",
    "archive": "完全なアーカイブを作成",
    "archiveQueued": "完全アーカイブをキューに追加しました。準備ができると下の一覧に表示されます。",
    "archiveFailed": "完全アーカイブをキューに追加できませんでした。",
    "recentExports": "最近のエクスポート",
    "noExports": "まだエクスポートは作成されていません。",
    "exportRequested": "依頼",
    "exportCompleted": "完了",
    "download": "ダウンロード",
    "downloadFailed": "このエクスポートを開けませんでした。",
    "exportKind": {
      "export": "データのエクスポート",
      "archive": "完全なアーカイブ"
    },
    "exportStatus": {
      "queued": "待機中",
      "running": "進行中",
      "completed": "完了",
      "failed": "失敗",
      "cancelled": "キャンセル"
    },
    "restoreTitle": "元に戻す",
    "restoreDetail": "復元すると、非公開のデータが古いコピーで上書きされることがあります。正確な操作を先に確認できるよう、まずサポートに相談してください。",
    "restoreAsk": "復元についてサポートに相談",
    "restorePrompt": "Hey Hermesの復元について相談したいです。対象のエクスポート、アーカイブ、日付を確認し、安全に復元できる内容を説明してください。私が正確な復元計画を明示的に承認するまで、稼働中のデータを上書きしないでください。",
    "deletion": {
      "confirmTitle": "この Hey Hermes アカウントを削除しますか？",
      "confirmBody": "Heyのセッションと権限は直ちに取り消され、有効なHeyデータは削除されます。この操作は取り消せません。\n\nApp Storeのサブスクリプションは解約されません。他の製品のアカウントやメールアドレスにも影響しません。",
      "keep": "アカウントを残す",
      "delete": "アカウントを削除",
      "title": "この Hey アカウントを削除する",
      "description": "もう一度認証してから確定してください。Hey のセッションと許可が取り消され、有効な Hey のデータが削除されます。定期購入の解約は別で、ほかの製品アカウントには影響しません。",
      "credentialPlaceholder": "パスワードまたはアクセスコード",
      "credentialLabel": "アカウント削除のためのパスワードまたはアクセスコード",
      "recentSignInHint": "直近の数分以内に Apple または Google でサインインした場合にだけ、空のままにしてください。",
      "confirmationLabel": "確認のため{phrase}と入力してください",
      "deleting": "削除中…",
      "reauthenticationError": "パスワードまたはアクセスコードが一致しません。Apple か Google でサインインした場合は、もう一度サインインしてからお試しください。",
      "confirmationError": "確認のため{phrase}を正確に入力してください。",
      "genericError": "アカウントを削除できませんでした。何も変更されていません。",
      "deleted": "Hey Hermesアカウントを削除しました。受領番号{receipt}。",
      "purged": "有効な Hey のデータは削除されました。",
      "purgePending": "有効なHeyデータは{date}までに削除されます。",
      "subscriptionKept": "App Storeのサブスクリプションは解約されていません。"
    }
  },
  "security": {
    "title": "セキュリティとアクセス",
    "description": "このプライベートなHermesサーバーの制御プレーンアクセス、サポート権限、インフラの例外です。",
    "anchorPending": "アンカー待ち",
    "stateRow": "現在の状態",
    "privacyPromise": "データはあなた自身のサーバーに保存され、あなたに帰属します。",
    "privacyDetailsOpen": "その意味",
    "privacyWhere": "Hey Hermesは更新、再起動、バックアップによりサーバーを稼働させます。これには常設アクセスが必要で、なければサーバーは動作しません。会話、タスク、ファイルを閲覧することはありません。これは当社の約束であり、技術的な障壁ではありません。ご自身で付与したアクセスは、日付、範囲、期間とともに下に表示されます。",
    "privacyLink": "プライバシーポリシー",
    "serverWorkspace": "ワークスペース",
    "serverIpv4": "公開IPv4",
    "serverType": "サーバー",
    "serverSince": "稼働開始日",
    "accessTitle": "付与したアクセス",
    "accessNone": "これまでアクセスはありません。",
    "accessGrantedByYou": "ご自身が付与",
    "accessAutomatic": "自動",
    "accessManual": "手動",
    "accessNeverUsed": "未使用",
    "accessUsed": "使用済み",
    "accessEnded": "終了",
    "adminTitle": "管理者アクセス",
    "handover": "引き渡し",
    "customerControlledSince": "顧客管理の開始日",
    "pending": "保留中",
    "adminKey": "管理者キー",
    "customerKey": "顧客キー",
    "keyNotRegistered": "未登録",
    "standingAccess": "Hey HermesのSSH/rootログイン",
    "noneDetected": "検出なし",
    "lastBaselineCheck": "最終ベースライン確認",
    "notChecked": "未確認",
    "adminDetail": "引き渡し後、Hey Hermesは常設のSSH/rootログインを保持しません。ただしサーバーはHey HermesのHetznerアカウント内にあるため、緊急時にはインフラレベルの復旧が可能です。そのような例外的なイベントをここに表示します。",
    "keyLabelPlaceholder": "キー名（例：JustusのMacBook）",
    "keyPlaceholder": "ssh-ed25519 AAAA...",
    "saveAdminKey": "管理者キーを保存",
    "adminKeySaved": "管理者キーを保存しました。引き渡しは準備中またはこの画面から実行できます。",
    "adminKeyFailed": "管理者キーを保存できませんでした。",
    "runHandover": "引き渡しを確認",
    "handoverChecked": "引き渡しの確認が完了しました。上の状態を更新しました。",
    "handoverFailed": "引き渡しの確認を実行できませんでした。",
    "supportTitle": "サポート",
    "supportDetail": "一時的なサポートアクセスはサポート画面で付与します。付与したアクセス、期間、範囲はここに表示されます。",
    "activeGrants": "有効な権限",
    "none": "なし",
    "noGrants": "有効なサポート権限も過去の権限もありません。",
    "grantCodeHint": "コードのヒント",
    "grantExpires": "有効期限",
    "grantScopes": "範囲",
    "grantLastUsed": "最終使用日時",
    "grantRevoked": "取り消し済み",
    "revokeGrant": "このサポート権限を取り消す",
    "revokeDone": "サポート権限を取り消しました。",
    "revokeFailed": "サポート権限を取り消せませんでした。",
    "openSupport": "サポートを開く",
    "infrastructureTitle": "インフラ",
    "exceptionalEvents": "例外的なイベント",
    "unmatchedEvents": "照合できないイベント",
    "latestEvent": "最新のイベント",
    "noEvents": "なし",
    "latestEventHash": "最新イベントのハッシュ",
    "noReceipt": "受領記録はまだありません",
    "latestSealedBatch": "最新の封印済みバッチ",
    "notSealed": "未封印",
    "wormRetentionUntil": "WORM保持期限",
    "externalAnchor": "外部アンカー",
    "notAnchored": "アンカー未設定",
    "externalAnchorFallback": "外部",
    "viewAnchor": "外部アンカーを表示",
    "anchorOpenFailed": "外部アンカーを開けませんでした。",
    "infrastructureDetail": "これらはHey Hermesのインフラとサポートアクセスに関する証拠です。プライベートなHermesサーバー内でできることを制限するものではありません。",
    "downloadReceipt": "受領記録をダウンロード",
    "receiptShared": "セキュリティ監査の受領記録を準備しました。これは証拠であり、プライベートなHermesサーバーを制限するものではありません。",
    "receiptFailed": "セキュリティ監査の受領記録を準備できませんでした。"
  },
  "aiAccess": {
    "title": "AIアクセス",
    "description": "このワークスペースの標準ルートを一つ選んでください。",
    "current": "現在の AI アクセス",
    "currentUnavailable": "現在の AI アクセスを確認できませんでした。",
    "none": "AI 接続なし",
    "chatGpt": "ChatGPT OAuth",
    "claude": "Claude OAuth",
    "included": "含まれる AI",
    "connected": "接続済み",
    "notConnected": "未接続",
    "statusUnavailable": "ステータス不明",
    "working": "実行中…",
    "resultSuccess": "接続して選択しました。",
    "resultCancelled": "ログインをキャンセルしました。変更はありません。",
    "resultProviderError": "プロバイダーのサインインを開始できませんでした。もう一度お試しください。",
    "resultLinkError": "ログインの準備はできましたが、iOSで開けませんでした。「ログインを開く」をタップしてください。",
    "resultUnknown": "接続はまだ確認できていません。ログインを完了してから再確認してください。",
    "includedUnavailableAction": "このワークスペースの付属AIを確認できていません。更新して再試行してください。",
    "chatGptDetail": "OAuth でご自身の ChatGPT アカウントを使います。",
    "claudeDetail": "OAuth でご自身の Claude アカウントを使います。このルートはプランの割り当てではなく Claude アカウントの追加利用予算を消費するため、追加利用を有効にする必要があります。",
    "includedDetail": "プランに含まれる管理割り当てを使います。",
    "allowanceLoading": "付属の利用枠を確認中です。残量を推測して表示することはありません。",
    "allowanceRemaining": "含まれる利用枠の残りは{percent}%です。",
    "includedModelUnavailable": "現在の含まれるモデルは利用できません。",
    "connectChatGpt": "ChatGPTに接続",
    "reconnectChatGpt": "ChatGPTを再接続または変更",
    "connectClaude": "Claudeに接続",
    "reconnectClaude": "Claudeを再接続または変更",
    "chatGptComplete": "ChatGPT の接続を完了する",
    "chatGptSteps": "1. サインインを開く。2. このコードを入力する。3. ステータスを確認する。",
    "copyChatGptCode": "ChatGPT のコードをコピー",
    "openSignIn": "サインインを開く",
    "checkStatus": "ステータスを確認",
    "claudeComplete": "Claude の接続を完了する",
    "claudeCodeHint": "Claude から返されたコードをここに貼り付けてください。",
    "claudeCodePlaceholder": "Claude の認証コード",
    "completeConnection": "接続を完了する",
    "cancel": "キャンセル",
    "otherConnection": "別の AI 接続を追加",
    "otherConnectionPrompt": "このワークスペース向けの別の AI 接続について教えてください。何を接続したいか尋ね、安全でサポートされた方法を説明し、私の明示的な確認なしにプロバイダーや資格情報を変更しないでください。",
    "oauthUsageTruth": "プロバイダーの割合は、プロバイダーが確かな使用データを返したときだけ表示されます。",
    "saved": "選択を保存しました。次回の実行から適用されます。",
    "savedUnconfirmed": "選択を保存しましたが、現在のステータスを確認できませんでした。再読み込みしてください。",
    "saveFailed": "AI アクセスを保存できませんでした。",
    "claudeStarted": "Claudeのログインを開きました。",
    "claudeConnected": "Claudeに接続されています。",
    "claudeFailed": "Claude の接続を完了できませんでした。"
  },
  "plugins": {
    "title": "接続",
    "description": "このワークスペースにツールやサービスをつなぎます。",
    "searchPlaceholder": "接続を検索",
    "yours": "あなたの接続",
    "all": "すべての接続",
    "empty": "この検索に合う接続はありません。",
    "close": "閉じる",
    "source": "公式の提供元",
    "tools": "ツール",
    "skills": "スキル",
    "permissions": "権限",
    "setup": "設定",
    "working": "実行中…",
    "statusLabels": {
      "available": "追加",
      "authorization_required": "認可する",
      "setup_incomplete": "設定を完了",
      "added": "追加済み",
      "attention": "確認が必要"
    },
    "connectionStatusLabels": {
      "available": "利用できます",
      "authorization_required": "認可が必要",
      "setup_incomplete": "設定が未完了",
      "unknown": "不明",
      "unavailable": "利用できません",
      "connected": "接続済み",
      "attention": "確認が必要"
    },
    "statusDetails": {
      "available": "このワークスペースで利用できます。",
      "authorization_required": "まだ認可が必要です。",
      "setup_incomplete": "設定はまだ終わっていません。",
      "added": "このワークスペースで使えます。",
      "attention": "現在の裏づけには確認が必要です。"
    },
    "actionLabels": {
      "add": "追加",
      "authorize": "認可する",
      "finish_setup": "設定を完了",
      "probe": "確認",
      "disconnect": "管理",
      "repair": "修復",
      "review_source": "提供元を確認",
      "confirm_review": "確認を承認",
      "install": "インストールを開く",
      "activate": "有効化を開く",
      "enable": "有効化を開く",
      "send_setup_request": "Hermes に聞く"
    },
    "items": {
      "calendar": {
        "description": "このワークスペースからGoogleカレンダーの予定を利用します。",
        "setupHint": "既存の保護されたGoogle設定を続けてください。",
        "permissions": [
          "カレンダーへのアクセス"
        ],
        "searchTerms": [
          "calendar",
          "google",
          "events"
        ]
      },
      "google_drive": {
        "description": "このワークスペースからGoogleドライブのファイルを利用します。",
        "setupHint": "既存の保護されたGoogle設定を続けてください。",
        "permissions": [
          "ドライブのファイルへのアクセス"
        ],
        "searchTerms": [
          "drive",
          "google",
          "files"
        ]
      },
      "discord": {
        "description": "範囲を限定したDiscordボットまたはWebhookの設定案内をHermesに依頼します。",
        "setupHint": "タップすると、秘密情報を含まない定型の設定依頼をホームチャットに送信します。",
        "permissions": [
          "設定依頼の送信によって権限が付与されることはありません"
        ],
        "searchTerms": [
          "messaging",
          "bot",
          "server"
        ]
      },
      "gmail": {
        "description": "許可を得てメールを読み、整理します。",
        "setupHint": "Google OAuthを通じてこのワークスペースを承認してください。",
        "permissions": [
          "メールのメタデータと本文の読み取り"
        ],
        "searchTerms": [
          "email",
          "google",
          "inbox"
        ]
      },
      "google_workspace": {
        "description": "このワークスペースからカレンダーやドライブのファイルを利用します。",
        "setupHint": "Googleアプリの情報は保護された設定画面でのみ入力し、その後確認を実行してください。",
        "permissions": [
          "カレンダーへのアクセス",
          "ドライブのファイルへのアクセス"
        ],
        "searchTerms": [
          "calendar",
          "drive",
          "google",
          "events",
          "files"
        ]
      },
      "telegram": {
        "description": "ワークスペースに紐づくTelegramボットを通じてHermesと話します。",
        "setupHint": "ボットの設定案内に従い、テストメッセージを送信してください。",
        "permissions": [
          "設定されたボット宛てのメッセージの受信",
          "そのボットを通じた返信"
        ],
        "searchTerms": [
          "messaging",
          "bot",
          "chat"
        ]
      },
      "whatsapp": {
        "description": "設定案内に従ってWhatsApp Cloudの番号を接続します。",
        "setupHint": "保護された認証情報とWebhookの設定を完了し、確認を実行してください。",
        "permissions": [
          "転送されたメッセージの受信",
          "設定された番号を通じた返信"
        ],
        "searchTerms": [
          "meta",
          "messaging",
          "cloud api"
        ]
      },
      "skills_hub": {
        "description": "宣言されたHermesスキルを、その正確なソースから確認してインストールします。",
        "setupHint": "個別のインストールや有効化の前に、ソースとスキャン結果を確認してください。",
        "permissions": [
          "権限はスキルごとに異なり、インストール前に表示されます"
        ],
        "searchTerms": [
          "skill",
          "hub",
          "install",
          "trust"
        ]
      },
      "local_plugins": {
        "description": "ランタイムのパスや生の設定を公開せず、宣言されたローカルプラグインを確認します。",
        "setupHint": "有効化する前にソース、バージョン、宣言、信頼性の結果を確認してください。",
        "permissions": [
          "宣言されたツール、フック、コマンドは有効化前に確認されます"
        ],
        "searchTerms": [
          "plugin",
          "local",
          "hooks",
          "commands"
        ]
      },
      "browser": {
        "description": "固定されたHermesランタイムに含まれるブラウザツールを利用します。",
        "setupHint": "固定されたランタイムの構成と現在のブラウザ機能を確認してください。",
        "permissions": [
          "ユーザーが依頼したウェブサイトへのアクセス"
        ],
        "searchTerms": [
          "web",
          "browse",
          "automation"
        ]
      },
      "webhooks": {
        "description": "範囲を限定した受信または送信のサービスコールバックを準備します。",
        "setupHint": "保護された設定を利用してください。秘密情報がチャットに入ることはありません。",
        "permissions": [
          "サービス、目的、範囲、コールバック、テスト計画、切断計画"
        ],
        "searchTerms": [
          "callback",
          "http",
          "events",
          "integration"
        ]
      },
      "slack": {
        "description": "承認済みのSlack接続手順の案内をHermesに依頼します。",
        "setupHint": "タップすると、秘密情報を含まない定型の設定依頼をホームチャットに送信します。",
        "permissions": [
          "設定依頼の送信によって権限が付与されることはありません"
        ],
        "searchTerms": [
          "messaging",
          "workspace",
          "chat"
        ]
      },
      "stripe": {
        "description": "資金を移動せず、範囲を限定したStripe設定の計画をHermesに依頼します。",
        "setupHint": "タップすると、秘密情報を含まない定型の設定依頼をホームチャットに送信します。",
        "permissions": [
          "設定依頼の送信によって権限が付与されることはありません"
        ],
        "searchTerms": [
          "billing",
          "payments",
          "finance"
        ]
      }
    },
    "partialStatus": "一部の接続ステータスを更新できませんでした。取得できた結果を表示します。該当する設定操作は、カタログが回復するまで使えません。",
    "loading": "接続を読み込み中…",
    "loadError": "現在、接続にアクセスできません。",
    "operationComplete": "接続状態を更新しました。",
    "webhookRequested": "Webhookの設定を依頼しました。プロバイダーや秘密情報は変更していません。",
    "actionError": "接続操作を完了できませんでした。",
    "confirmTitle": "ソースの確認を承認",
    "confirmBody": "このワークスペースの正確に固定されたソース、権限、信頼性情報を確認したことを承認してください。",
    "cancel": "キャンセル",
    "confirm": "確認"
  }
};

const systemPagesKo: MobileSystemPagesCopy = {
  "common": {
    "dismiss": "이 알림 닫기"
  },
  "dashboard": {
    "opening": "Hermes 대시보드를 여는 중…",
    "error": "Hermes 대시보드를 열지 못했습니다.",
    "retry": "다시 시도"
  },
  "automations": {
    "title": "자동화",
    "description": "Hermes에 저장된 알림과 예약 작업입니다.",
    "refresh": "자동화 새로 고침",
    "loadError": "자동화를 불러오지 못했습니다.",
    "add": "자동화 추가",
    "addPrompt": "새 Hermes 자동화를 만들도록 도와주세요. 무엇을 할지, 언제 실행할지, 사용할 시간대와 전달 채널을 물어본 다음, 제가 세부 사항을 확인한 후 일반 Hermes 알림 또는 cron 경로로 만들어 주세요.",
    "loaded": "자동화 {count}개를 불러왔습니다.",
    "emptyTitle": "아직 자동화가 없습니다",
    "emptyBody": "자동화 추가를 사용해 Hermes에게 알림 또는 예약 작업을 만들어 달라고 요청하세요.",
    "active": "활성",
    "paused": "일시 중지됨",
    "unknown": "알 수 없음",
    "next": "다음",
    "noNext": "다음 실행이 표시되지 않음",
    "delivery": "전달",
    "result": {
      "never": "저장된 결과가 아직 없습니다",
      "pending": "결과 대기 중",
      "stored": "최근 결과 저장됨",
      "failed": "최근 실행 실패",
      "not_stored": "최근 실행에서 결과가 저장되지 않음"
    },
    "chat": "채팅",
    "chatAbout": "{title}에 대해 대화",
    "chatPrompt": "이 Hermes 자동화에 대해 알려주세요: {title} ({id}). 일정, 상태, 전달 방식과 목적을 보여주고 질문에 답해주세요. 제가 요청하지 않으면 아무것도 변경하지 마세요.",
    "edit": "편집",
    "standard": "기본값",
    "reset": "기본값으로 재설정",
    "resetConfirm": "재설정 확인",
    "pause": "일시 중지",
    "resume": "재개",
    "delete": "삭제",
    "deleteConfirmTitle": "이 자동화를 삭제할까요?",
    "deleteConfirmMessage": "{title}이(가) 삭제되어 다시 실행되지 않습니다. 이 작업은 되돌릴 수 없습니다.",
    "deleteConfirm": "삭제",
    "deleteCancel": "유지",
    "versions": "버전 기록",
    "versionsHide": "버전 기록 숨기기",
    "activeVersion": "사용 중",
    "restore": "되돌리기",
    "restoreConfirm": "복원 확인",
    "reinstall": "되돌리기",
    "reinstallConfirm": "복원 확인",
    "schedule": {
      "daily": "매일",
      "everyDays": "{count}일마다",
      "weekdays": "{weekdays}",
      "monthly": "매월 {days}일",
      "hourly": "매시간 {minute}분에",
      "everyHours": "{count}시간마다",
      "everyMinutes": "{count}분마다",
      "once": "{date}에 한 번",
      "unknown": "Hermes에 저장된 일정",
      "and": " 및 "
    },
    "editPrompt": "이 Hermes 자동화를 편집하도록 도와주세요: {title} ({id}). 먼저 현재 일정, 상태, 전달 채널과 목적을 보여주세요. 그런 다음 무엇을 변경하고 싶은지 물어보고, 제가 최종 세부 사항을 확인한 후에만 일반 Hermes cron 또는 알림을 업데이트하세요."
  },
  "tasks": {
    "title": "작업",
    "empty": "아직 수집된 작업이 없습니다.",
    "pendingTitle": "아직 순위 없음",
    "loading": "순위가 매겨진 작업을 불러오는 중…",
    "loadError": "현재 순위가 매겨진 작업 목록을 사용할 수 없습니다.",
    "changeError": "변경 사항을 저장하지 못했습니다.",
    "about": "이 순서에 대하여",
    "aboutSentence": "이 순서는 칸반 작업을 대상으로 한 가장 최근 순위 계산 결과입니다.",
    "aboutClose": "닫기"
  },
  "account": {
    "ownerTitle": "사람",
    "memberTitle": "내 계정",
    "monthlyBudget": "월 모델 예산",
    "allowanceUnavailable": "현재 할당량 상태를 확인할 수 없습니다.",
    "allowanceRemaining": "포함된 사용량의 {percent}%가 남았습니다.",
    "unavailable": "사용할 수 없음",
    "used": "{percent}% 사용됨",
    "yourDataTitle": "내 데이터",
    "yourDataDetail": "Hey Hermes가 보관하는 모든 것을 내려받으세요: 채팅, 작업, 워크스페이스 파일, 설정.",
    "exportData": "데이터 내보내기",
    "exportPreparing": "준비 중…",
    "exportOpened": "브라우저에서 내보내기를 열었습니다. 거기서 저장하세요.",
    "signInMethods": "로그인 방법",
    "signInDetail": "바로 이 Hey 계정에 로그인한 상태에서만 공급자를 연결하세요. 이메일 주소가 같아도 계정은 연결되지 않습니다.",
    "linkGoogle": "Google 연결",
    "capacity": "{active}/{capacity}개 계정이 활성화되어 있습니다. 접근 권한을 제거해도 저장된 워크스페이스 데이터는 유지됩니다.",
    "name": "이름",
    "email": "메일",
    "creating": "계정을 만드는 중…",
    "createError": "계정을 만들지 못했습니다.",
    "invite": "사람 초대",
    "disabling": "계정을 비활성화하는 중…",
    "disableError": "계정을 비활성화하지 못했습니다.",
    "resetting": "계정 코드를 재설정하는 중…",
    "resetError": "계정 코드를 재설정하지 못했습니다.",
    "detailsLoading": "계정 세부 정보를 불러오는 중입니다.",
    "roleOwner": "소유자",
    "roleMember": "구성원",
    "statusActive": "활성",
    "statusDisabled": "비활성",
    "lastSignIn": "마지막 로그인",
    "notYet": "아직 없음",
    "resetAccess": "{name}의 접근 권한 재설정",
    "disableAccess": "{name} 비활성화",
    "created": "{email}을(를) 만들었습니다.",
    "preparedWorkspace": "준비된 워크스페이스를 배정했습니다.",
    "runtimeReady": "런타임이 준비되었습니다.",
    "runtimeAttention": "런타임을 확인해야 합니다.",
    "runtimeStarts": "런타임은 사용할 때 자동으로 시작됩니다.",
    "oneTimeCode": "일회용 코드: {code}",
    "disabled": "{email}이(가) 비활성화되었습니다. 워크스페이스 데이터는 유지됩니다.",
    "reset": "{email}을(를) 재설정했습니다.",
    "updatedAccount": "{email}을(를) 업데이트했습니다.",
    "archive": "전체 아카이브 만들기",
    "archiveQueued": "전체 아카이브를 대기열에 추가했습니다. 준비되면 아래 목록에 표시됩니다.",
    "archiveFailed": "전체 아카이브를 대기열에 추가하지 못했습니다.",
    "recentExports": "최근 내보내기",
    "noExports": "아직 만든 내보내기가 없습니다.",
    "exportRequested": "요청",
    "exportCompleted": "완료",
    "download": "내려받기",
    "downloadFailed": "이 내보내기를 열지 못했습니다.",
    "exportKind": {
      "export": "데이터 내보내기",
      "archive": "전체 아카이브"
    },
    "exportStatus": {
      "queued": "대기 중",
      "running": "진행 중",
      "completed": "완료",
      "failed": "실패",
      "cancelled": "취소됨"
    },
    "restoreTitle": "되돌리기",
    "restoreDetail": "복원하면 비공개 데이터가 오래된 사본으로 덮어써질 수 있습니다. 정확한 작업을 먼저 확인할 수 있도록 지원팀부터 거치세요.",
    "restoreAsk": "복원에 대해 지원팀에 문의",
    "restorePrompt": "Hey Hermes 복원에 도움이 필요합니다. 어떤 내보내기, 아카이브 또는 날짜를 뜻하는지 물어보고 안전하게 복원할 수 있는 내용을 설명해주세요. 제가 정확한 복원 계획을 명시적으로 승인할 때까지 실제 데이터를 덮어쓰지 마세요.",
    "deletion": {
      "confirmTitle": "이 Hey Hermes 계정을 삭제할까요?",
      "confirmBody": "Hey 세션과 권한이 즉시 취소되고 활성 Hey 데이터가 삭제됩니다. 이 작업은 되돌릴 수 없습니다.\n\nApp Store 구독은 취소되지 않으며 다른 제품 계정이나 이메일 주소에도 영향을 주지 않습니다.",
      "keep": "계정 유지",
      "delete": "계정 삭제",
      "title": "이 Hey 계정 삭제",
      "description": "다시 인증한 뒤 확인하세요. Hey 세션과 권한이 취소되고 활성 Hey 데이터가 삭제됩니다. 구독 해지는 별개이며 다른 제품 계정에는 영향이 없습니다.",
      "credentialPlaceholder": "비밀번호 또는 액세스 코드",
      "credentialLabel": "계정 삭제를 위한 비밀번호 또는 액세스 코드",
      "recentSignInHint": "최근 몇 분 안에 Apple 또는 Google로 로그인했을 때만 비워 두세요.",
      "confirmationLabel": "확인하려면 {phrase}을(를) 입력하세요",
      "deleting": "삭제하는 중…",
      "reauthenticationError": "비밀번호 또는 액세스 코드가 맞지 않습니다. Apple이나 Google로 로그인했다면 다시 로그인한 뒤 시도해 주세요.",
      "confirmationError": "확인하려면 {phrase}을(를) 정확히 입력하세요.",
      "genericError": "계정을 삭제하지 못했습니다. 아무것도 바뀌지 않았습니다.",
      "deleted": "Hey Hermes 계정을 삭제했습니다. 확인 번호 {receipt}.",
      "purged": "활성 Hey 데이터가 삭제되었습니다.",
      "purgePending": "활성 Hey 데이터는 {date}까지 삭제됩니다.",
      "subscriptionKept": "App Store 구독은 취소되지 않았습니다."
    }
  },
  "security": {
    "title": "보안 및 접근",
    "description": "이 비공개 Hermes 서버의 제어 플레인 접근, 지원 권한 및 인프라 예외입니다.",
    "anchorPending": "앵커 대기 중",
    "stateRow": "현재 상태",
    "privacyPromise": "데이터는 본인의 서버에 저장되며 본인에게 속합니다.",
    "privacyDetailsOpen": "이 의미",
    "privacyWhere": "Hey Hermes는 업데이트, 재시작, 백업으로 서버를 유지합니다. 이를 위해 상시 접근이 필요하며, 없으면 서버가 작동하지 않습니다. 대화, 작업 또는 파일을 들여다보지 않습니다. 이는 기술적 장벽이 아니라 저희의 약속입니다. 직접 부여한 접근 권한은 날짜, 범위, 기간과 함께 아래에 표시됩니다.",
    "privacyLink": "개인정보 처리방침",
    "serverWorkspace": "워크스페이스",
    "serverIpv4": "공개 IPv4",
    "serverType": "서버",
    "serverSince": "서비스 시작일",
    "accessTitle": "직접 부여한 접근 권한",
    "accessNone": "아직 접근 권한이 없습니다.",
    "accessGrantedByYou": "직접 부여함",
    "accessAutomatic": "자동",
    "accessManual": "수동",
    "accessNeverUsed": "사용한 적 없음",
    "accessUsed": "사용됨",
    "accessEnded": "종료됨",
    "adminTitle": "관리자 접근",
    "handover": "관리권 인계",
    "customerControlledSince": "고객 관리 시작일",
    "pending": "대기 중",
    "adminKey": "관리자 키",
    "customerKey": "고객 키",
    "keyNotRegistered": "등록되지 않음",
    "standingAccess": "Hey Hermes SSH/root 로그인",
    "noneDetected": "감지되지 않음",
    "lastBaselineCheck": "마지막 기준 상태 확인",
    "notChecked": "확인하지 않음",
    "adminDetail": "관리권 인계 후 Hey Hermes는 상시 SSH/root 로그인을 유지하지 않습니다. 다만 서버가 Hey Hermes의 Hetzner 계정에서 실행되므로 긴급 상황에서는 인프라 수준의 복구가 가능합니다. 그런 예외적 이벤트는 여기에 표시됩니다.",
    "keyLabelPlaceholder": "키 이름, 예: Justus의 MacBook",
    "keyPlaceholder": "ssh-ed25519 AAAA...",
    "saveAdminKey": "관리자 키 저장",
    "adminKeySaved": "관리자 키를 저장했습니다. 준비 과정이나 이 화면에서 관리권을 인계할 수 있습니다.",
    "adminKeyFailed": "관리자 키를 저장하지 못했습니다.",
    "runHandover": "관리권 인계 확인",
    "handoverChecked": "관리권 인계 확인을 완료했습니다. 위 상태를 새로 고쳤습니다.",
    "handoverFailed": "관리권 인계 확인을 실행하지 못했습니다.",
    "supportTitle": "지원",
    "supportDetail": "임시 지원 접근 권한은 지원 화면에서 부여합니다. 부여된 권한, 기간, 범위는 여기에 표시됩니다.",
    "activeGrants": "활성 권한",
    "none": "없음",
    "noGrants": "현재 또는 과거의 지원 권한이 없습니다.",
    "grantCodeHint": "코드 힌트",
    "grantExpires": "만료",
    "grantScopes": "범위",
    "grantLastUsed": "마지막 사용",
    "grantRevoked": "취소됨",
    "revokeGrant": "이 지원 권한 취소",
    "revokeDone": "지원 권한을 취소했습니다.",
    "revokeFailed": "지원 권한을 취소하지 못했습니다.",
    "openSupport": "지원 열기",
    "infrastructureTitle": "인프라",
    "exceptionalEvents": "예외적 이벤트",
    "unmatchedEvents": "일치하지 않는 이벤트",
    "latestEvent": "최근 이벤트",
    "noEvents": "없음",
    "latestEventHash": "최근 이벤트 해시",
    "noReceipt": "아직 확인 기록 없음",
    "latestSealedBatch": "최근 봉인된 묶음",
    "notSealed": "봉인되지 않음",
    "wormRetentionUntil": "WORM 보존 기한",
    "externalAnchor": "외부 앵커",
    "notAnchored": "아직 앵커 없음",
    "externalAnchorFallback": "외부",
    "viewAnchor": "외부 앵커 보기",
    "anchorOpenFailed": "외부 앵커를 열지 못했습니다.",
    "infrastructureDetail": "이 기록은 Hey Hermes 인프라와 지원 접근에 관한 증거입니다. 비공개 Hermes 서버 안에서 할 수 있는 일을 제한하지 않습니다.",
    "downloadReceipt": "확인 기록 다운로드",
    "receiptShared": "보안 감사 확인 기록을 준비했습니다. 증거일 뿐이며 비공개 Hermes 서버에 대한 제한이 아닙니다.",
    "receiptFailed": "보안 감사 확인 기록을 준비하지 못했습니다."
  },
  "aiAccess": {
    "title": "AI 액세스",
    "description": "이 워크스페이스의 표준 경로를 하나 선택하세요.",
    "current": "현재 AI 액세스",
    "currentUnavailable": "현재 AI 액세스를 확인하지 못했습니다.",
    "none": "AI 연결 없음",
    "chatGpt": "ChatGPT OAuth",
    "claude": "Claude OAuth",
    "included": "포함된 AI",
    "connected": "연결됨",
    "notConnected": "연결 안 됨",
    "statusUnavailable": "상태 확인 불가",
    "working": "처리 중…",
    "resultSuccess": "연결하고 선택했습니다.",
    "resultCancelled": "로그인을 취소했습니다. 변경 사항이 없습니다.",
    "resultProviderError": "공급자 로그인을 시작하지 못했습니다. 다시 시도하세요.",
    "resultLinkError": "로그인은 준비되었지만 iOS가 열지 못했습니다. 로그인 열기를 탭하세요.",
    "resultUnknown": "연결이 아직 확인되지 않았습니다. 로그인을 완료한 후 다시 확인하세요.",
    "includedUnavailableAction": "이 워크스페이스의 포함된 AI를 확인하지 못했습니다. 새로 고친 후 다시 시도하세요.",
    "chatGptDetail": "OAuth로 본인의 ChatGPT 계정을 사용합니다.",
    "claudeDetail": "OAuth로 본인의 Claude 계정을 사용합니다. 이 경로는 요금제 할당량이 아니라 Claude 계정의 추가 사용 예산을 쓰므로 추가 사용을 켜두어야 합니다.",
    "includedDetail": "요금제에 포함된 관리 할당량을 사용합니다.",
    "allowanceLoading": "포함된 사용량을 확인 중입니다. 남은 값은 추정하지 않습니다.",
    "allowanceRemaining": "포함된 사용량의 {percent}%가 남았습니다.",
    "includedModelUnavailable": "현재 포함된 모델을 사용할 수 없습니다.",
    "connectChatGpt": "ChatGPT 연결",
    "reconnectChatGpt": "ChatGPT 다시 연결 또는 변경",
    "connectClaude": "Claude 연결",
    "reconnectClaude": "Claude 다시 연결 또는 변경",
    "chatGptComplete": "ChatGPT 연결 마치기",
    "chatGptSteps": "1. 로그인을 엽니다. 2. 이 코드를 입력합니다. 3. 상태를 확인합니다.",
    "copyChatGptCode": "ChatGPT 코드 복사",
    "openSignIn": "로그인 열기",
    "checkStatus": "상태 확인",
    "claudeComplete": "Claude 연결 마치기",
    "claudeCodeHint": "Claude가 돌려준 코드를 여기에 붙여넣으세요.",
    "claudeCodePlaceholder": "Claude 인증 코드",
    "completeConnection": "연결 마치기",
    "cancel": "취소",
    "otherConnection": "다른 AI 연결 추가",
    "otherConnectionPrompt": "이 워크스페이스에 맞는 다른 AI 연결을 이해하게 도와주세요. 무엇을 연결하고 싶은지 물어보고, 안전하게 지원되는 경로를 설명하며, 내 명시적인 확인 없이는 어떤 공급자나 자격 증명도 바꾸지 마세요.",
    "oauthUsageTruth": "공급자 백분율은 공급자가 확실한 사용 데이터를 줄 때만 표시됩니다.",
    "saved": "선택을 저장했습니다. 다음 실행부터 적용됩니다.",
    "savedUnconfirmed": "선택을 저장했지만 현재 상태를 확인하지 못했습니다. 페이지를 새로 고쳐 주세요.",
    "saveFailed": "AI 액세스를 저장하지 못했습니다.",
    "claudeStarted": "Claude 로그인을 열었습니다.",
    "claudeConnected": "Claude가 연결되었습니다.",
    "claudeFailed": "Claude 연결을 완료하지 못했습니다."
  },
  "plugins": {
    "title": "연결",
    "description": "이 워크스페이스에 도구와 서비스를 연결합니다.",
    "searchPlaceholder": "연결 검색",
    "yours": "내 연결",
    "all": "모든 연결",
    "empty": "이 검색과 맞는 연결이 없습니다.",
    "close": "닫기",
    "source": "공식 출처",
    "tools": "도구",
    "skills": "스킬",
    "permissions": "권한",
    "setup": "설정",
    "working": "처리 중…",
    "statusLabels": {
      "available": "추가",
      "authorization_required": "인증",
      "setup_incomplete": "설정 마치기",
      "added": "추가됨",
      "attention": "확인 필요"
    },
    "connectionStatusLabels": {
      "available": "사용 가능",
      "authorization_required": "인증 필요",
      "setup_incomplete": "설정 미완료",
      "unknown": "알 수 없음",
      "unavailable": "사용할 수 없음",
      "connected": "연결됨",
      "attention": "확인 필요"
    },
    "statusDetails": {
      "available": "이 워크스페이스에서 사용할 수 있습니다.",
      "authorization_required": "아직 인증이 필요합니다.",
      "setup_incomplete": "설정이 아직 끝나지 않았습니다.",
      "added": "이 워크스페이스에서 쓸 수 있습니다.",
      "attention": "현재 근거를 확인해야 합니다."
    },
    "actionLabels": {
      "add": "추가",
      "authorize": "인증",
      "finish_setup": "설정 마치기",
      "probe": "확인",
      "disconnect": "관리",
      "repair": "복구",
      "review_source": "출처 확인",
      "confirm_review": "확인 승인",
      "install": "설치 열기",
      "activate": "활성화 열기",
      "enable": "허용 열기",
      "send_setup_request": "Hermes에게 묻기"
    },
    "items": {
      "calendar": {
        "description": "이 워크스페이스에서 Google 캘린더 일정을 사용합니다.",
        "setupHint": "기존의 보호된 Google 설정을 계속하세요.",
        "permissions": [
          "캘린더 접근"
        ],
        "searchTerms": [
          "calendar",
          "google",
          "events"
        ]
      },
      "google_drive": {
        "description": "이 워크스페이스에서 Google Drive 파일을 사용합니다.",
        "setupHint": "기존의 보호된 Google 설정을 계속하세요.",
        "permissions": [
          "Drive 파일 접근"
        ],
        "searchTerms": [
          "drive",
          "google",
          "files"
        ]
      },
      "discord": {
        "description": "범위가 제한된 Discord 봇 또는 웹훅 설정을 Hermes에게 안내받습니다.",
        "setupHint": "탭하면 비밀 정보가 없는 정해진 설정 요청이 홈 채팅으로 전송됩니다.",
        "permissions": [
          "설정 요청을 보내도 권한은 부여되지 않습니다"
        ],
        "searchTerms": [
          "messaging",
          "bot",
          "server"
        ]
      },
      "gmail": {
        "description": "허락을 받아 이메일을 읽고 정리합니다.",
        "setupHint": "Google OAuth를 통해 이 워크스페이스를 승인하세요.",
        "permissions": [
          "이메일 메타데이터와 본문 읽기"
        ],
        "searchTerms": [
          "email",
          "google",
          "inbox"
        ]
      },
      "google_workspace": {
        "description": "이 워크스페이스에서 캘린더와 Drive 파일을 사용합니다.",
        "setupHint": "Google 앱 정보는 보호된 설정에서만 입력한 후 확인을 실행하세요.",
        "permissions": [
          "캘린더 접근",
          "Drive 파일 접근"
        ],
        "searchTerms": [
          "calendar",
          "drive",
          "google",
          "events",
          "files"
        ]
      },
      "telegram": {
        "description": "워크스페이스에 연결된 Telegram 봇을 통해 Hermes와 대화합니다.",
        "setupHint": "봇 설정 안내를 따르고 테스트 메시지를 보내세요.",
        "permissions": [
          "설정된 봇으로 전송된 메시지 수신",
          "해당 봇을 통한 답장 전송"
        ],
        "searchTerms": [
          "messaging",
          "bot",
          "chat"
        ]
      },
      "whatsapp": {
        "description": "설정 안내를 통해 WhatsApp Cloud 번호를 연결합니다.",
        "setupHint": "보호된 인증 정보 및 웹훅 설정 단계를 완료한 후 확인을 실행하세요.",
        "permissions": [
          "전달된 메시지 수신",
          "설정된 번호를 통한 답장 전송"
        ],
        "searchTerms": [
          "meta",
          "messaging",
          "cloud api"
        ]
      },
      "skills_hub": {
        "description": "선언된 Hermes 스킬을 정확한 소스에서 검토하고 설치합니다.",
        "setupHint": "별도로 설치하거나 활성화하기 전에 소스와 검사 결과를 검토하세요.",
        "permissions": [
          "권한은 스킬에 따라 다르며 설치 전에 표시됩니다"
        ],
        "searchTerms": [
          "skill",
          "hub",
          "install",
          "trust"
        ]
      },
      "local_plugins": {
        "description": "런타임 경로나 원시 설정을 노출하지 않고 선언된 로컬 플러그인을 살펴봅니다.",
        "setupHint": "활성화하기 전에 소스, 버전, 선언 및 신뢰성 결과를 검토하세요.",
        "permissions": [
          "선언된 도구, 훅 및 명령은 활성화 전에 검토됩니다"
        ],
        "searchTerms": [
          "plugin",
          "local",
          "hooks",
          "commands"
        ]
      },
      "browser": {
        "description": "고정된 Hermes 런타임에 포함된 브라우저 도구를 사용합니다.",
        "setupHint": "고정된 런타임 구성과 현재 브라우저 기능을 확인하세요.",
        "permissions": [
          "사용자가 요청한 웹사이트 접근"
        ],
        "searchTerms": [
          "web",
          "browse",
          "automation"
        ]
      },
      "webhooks": {
        "description": "범위가 제한된 수신 또는 발신 서비스 콜백을 준비합니다.",
        "setupHint": "보호된 설정을 사용하세요. 비밀 정보는 채팅에 들어가지 않습니다.",
        "permissions": [
          "서비스, 목적, 범위, 콜백, 테스트 계획 및 연결 해제 계획"
        ],
        "searchTerms": [
          "callback",
          "http",
          "events",
          "integration"
        ]
      },
      "slack": {
        "description": "승인된 Slack 연결 절차를 Hermes에게 안내받습니다.",
        "setupHint": "탭하면 비밀 정보가 없는 정해진 설정 요청이 홈 채팅으로 전송됩니다.",
        "permissions": [
          "설정 요청을 보내도 권한은 부여되지 않습니다"
        ],
        "searchTerms": [
          "messaging",
          "workspace",
          "chat"
        ]
      },
      "stripe": {
        "description": "자금 이동 없이 범위가 제한된 Stripe 설정을 계획하도록 Hermes에게 요청합니다.",
        "setupHint": "탭하면 비밀 정보가 없는 정해진 설정 요청이 홈 채팅으로 전송됩니다.",
        "permissions": [
          "설정 요청을 보내도 권한은 부여되지 않습니다"
        ],
        "searchTerms": [
          "billing",
          "payments",
          "finance"
        ]
      }
    },
    "partialStatus": "일부 연결 상태를 새로 고치지 못했습니다. 가져온 결과만 표시하며, 해당 설정 동작은 카탈로그가 회복될 때까지 사용할 수 없습니다.",
    "loading": "연결을 불러오는 중…",
    "loadError": "현재 연결에 접근할 수 없습니다.",
    "operationComplete": "연결 상태를 업데이트했습니다.",
    "webhookRequested": "웹훅 설정을 요청했습니다. 제공업체나 비밀 정보는 변경하지 않았습니다.",
    "actionError": "연결 작업을 완료하지 못했습니다.",
    "confirmTitle": "소스 검토 확인",
    "confirmBody": "이 워크스페이스의 정확하게 고정된 소스, 권한 및 신뢰 정보를 검토했는지 확인하세요.",
    "cancel": "취소",
    "confirm": "확인"
  }
};

export type MobileChatCopy = MobileCopy["chat"];

const en: MobileCopy = {
  short: "EN",
  name: "English",
  nav: { chat: "Chat", pages: "Pages & Apps", plugins: "Connections", tasks: "Tasks", automations: "Automations", capabilities: "Capabilities", settings: "Settings", aiAccess: "AI Access", account: "Account", support: "Support", dashboard: "Hermes dashboard", signOut: "Sign out", openMenu: "Open menu", closeMenu: "Close menu", back: "Back", appearance: "Appearance", system: "Automatic", light: "Light", dark: "Dark", remove: "Unpin", ...navigationRemovalCopy.en, owner: "Owner", private: "Private" },
  settings: {
    title: "Settings",
    back: "Settings",
    overview: "Status & access",
    overviewHint: "Chat status, refresh, sign out",
    account: "Account",
    accountHint: "Your account and the people you invite",
    connections: "Connections",
    connectionsHint: "Gmail, Calendar, Drive, Telegram, and other connections",
    support: "Support & repair",
    supportHint: "Temporary, scoped support access",
    privacy: "Privacy",
    privacyHint: "How your private space is protected",
    diagnostics: "Diagnostics",
    diagnosticsHint: "Build, API, and recent app errors",
    language: "Language",
  },
  chat: {
    title: "Chat",
    placeholder: "Ask Hermes",
    emptyTitle: "Start with one message",
    emptyReady: "Ask Hermes what you want to do, plan, or understand.",
    startFresh: "Start fresh",
    typing: "Typing",
    activity: {
      needsAttention: "Reply needs attention",
      stopped: "Reply stopped",
      waitingForYou: "Waiting for you",
      writing: "Writing a reply",
      gettingReady: "Getting ready",
      working: "Working",
    },
    waiting: "Waiting",
    routeNeedsAttention: "Connection needed",
    startVoiceNote: "Start voice note",
    stopVoiceNote: "Stop recording",
    sendVoiceNote: "Send voice note",
    recording: "Recording",
    transcribing: "Transcribing voice note",
    retryVoiceNote: "Retry voice note",
    discardVoiceNote: "Discard voice note",
    copyMessage: "Copy",
    copyMessageHint: "Long-press for message actions",
    cancel: "Cancel",
    messageCopied: "Message copied.",
    messageCopyFailed: "Could not copy this message.",
    messageTime: "Sent at",
    failedNotSentTitle: "That message didn't send",
    failedNoAnswerTitle: "That reply never arrived",
    failedRetry: "Try again",
    failedRetryHint: "Try again",
    failedDismiss: "Dismiss",
  },
  firstConversation: {
    greetingTitle: "Hey. I just came online.",
    greetingBody: "Apparently I'm Hermes — and this is your private machine. Who are you, and what should I call you?",
    connectionTitle: "Recommended connection",
    connectionBody: "Connect Gmail so Hermes can help with your email.",
    connectionSkip: "Not now",
    guidedSetup: {
      open: "Open",
      connectGmail: "Connect Gmail",
      notNow: "Not now",
      noThanks: "No thanks",
      decline: "Not now",
      choiceSaveError: "The optional setup choice could not be saved.",
      skipError: "The optional setup guidance could not be dismissed.",
      labels: { gmail: "Gmail", ai_access: "AI Access", telegram: "Telegram" },
      statuses: {
        available: "Available",
        authorization_required: "Authorization required",
        setup_incomplete: "Finish setup",
        added: "Added",
        attention: "Needs attention",
        unknown: "Unknown",
        configured: "Configured",
        unavailable: "Unavailable",
      },
    },
  },
  systemPages: systemPagesEn,
};

export const mobileCatalog: Record<AppLocale, MobileCopy> = {
  en,
  de: {
    ...en,
    short: "DE",
    name: "Deutsch",
    nav: { chat: "Chat", pages: "Seiten & Apps", plugins: "Verbindungen", tasks: "Aufgaben", automations: "Automationen", capabilities: "Funktionen", settings: "Einstellungen", aiAccess: "KI-Zugang", account: "Account", support: "Support", dashboard: "Hermes-Dashboard", signOut: "Abmelden", openMenu: "Menü öffnen", closeMenu: "Menü schließen", back: "Zurück", appearance: "Darstellung", system: "Automatisch", light: "Hell", dark: "Dunkel", remove: "Lösen", ...navigationRemovalCopy.de, owner: "Eigentümer", private: "Privat" },
    settings: {
  "title": "Einstellungen",
  "back": "Einstellungen",
  "overview": "Status & Zugang",
  "overviewHint": "Chat-Status, Aktualisieren, Abmelden",
  "account": "Account",
  "accountHint": "Dein Account und eingeladene Personen",
  "connections": "Verbindungen",
  "connectionsHint": "Gmail, Kalender, Drive, Telegram und weitere Verbindungen",
  "support": "Support & Reparatur",
  "supportHint": "Zeitlich und im Umfang begrenzter Support-Zugriff",
  "privacy": "Privatsphäre",
  "privacyHint": "So wird dein privater Bereich geschützt",
  "diagnostics": "Diagnose",
  "diagnosticsHint": "Build, API und letzte App-Fehler",
  "language": "Sprache"
},
    chat: {
  "title": "Chat",
  "placeholder": "Hermes fragen",
  "emptyTitle": "Starte mit einer Nachricht",
  "emptyReady": "Frag Hermes, was du tun, planen oder verstehen willst.",
  "startFresh": "Neu starten",
  "typing": "Schreibt",
  "activity": {
    "needsAttention": "Antwort braucht Aufmerksamkeit",
    "stopped": "Antwort gestoppt",
    "waitingForYou": "Wartet auf dich",
    "writing": "Schreibt die Antwort",
    "gettingReady": "Wird vorbereitet",
    "working": "Arbeitet"
  },
  "waiting": "Wartet",
  "routeNeedsAttention": "Verbindung erforderlich",
  "startVoiceNote": "Sprachnachricht aufnehmen",
  "stopVoiceNote": "Aufnahme stoppen",
  "sendVoiceNote": "Sprachnachricht senden",
  "recording": "Aufnahme",
  "transcribing": "Sprachnachricht wird transkribiert",
  "retryVoiceNote": "Sprachnachricht erneut versuchen",
  "discardVoiceNote": "Sprachnachricht verwerfen",
  "copyMessage": "Kopieren",
  "copyMessageHint": "Lange drücken für Nachrichtenaktionen",
  "cancel": "Abbrechen",
  "messageCopied": "Nachricht kopiert.",
  "messageCopyFailed": "Diese Nachricht konnte nicht kopiert werden.",
  "messageTime": "Gesendet um",
  "failedNotSentTitle": "Die Nachricht wurde nicht gesendet",
  "failedNoAnswerTitle": "Die Antwort kam nicht zustande",
  "failedRetry": "Erneut versuchen",
  "failedRetryHint": "Erneut versuchen",
  "failedDismiss": "Ausblenden"
},
    firstConversation: {
      greetingTitle: "Hey. Ich bin gerade online gekommen.",
      greetingBody: "Anscheinend bin ich Hermes — und das hier ist deine private Maschine. Wer bist du, und wie soll ich dich nennen?",
      connectionTitle: "Empfohlene Verbindung",
      connectionBody: "Verbinde Gmail, damit Hermes dir mit deinen E-Mails helfen kann.",
      connectionSkip: "Nicht jetzt",
      guidedSetup: {
        open: "Öffnen",
        connectGmail: "Gmail verbinden",
        notNow: "Nicht jetzt",
        noThanks: "Nein, danke",
        decline: "Nicht jetzt",
        choiceSaveError: "Die optionale Auswahl konnte nicht gespeichert werden.",
        skipError: "Die optionale Einrichtung konnte nicht geschlossen werden.",
        labels: { gmail: "Gmail", ai_access: "KI-Zugang", telegram: "Telegram" },
        statuses: {
          available: "Verfügbar",
          authorization_required: "Autorisierung erforderlich",
          setup_incomplete: "Einrichtung abschließen",
          added: "Hinzugefügt",
          attention: "Prüfung erforderlich",
          unknown: "Unbekannt",
          configured: "Konfiguriert",
          unavailable: "Nicht verfügbar",
        },
      },
    },
    systemPages: systemPagesDe,
  },
  fr: { ...en, systemPages: systemPagesFr, short: "FR", name: "Français", nav: {
  "chat": "Discussion",
  "pages": "Pages & apps",
  "plugins": "Connexions",
  "tasks": "Tâches",
  "automations": "Automatisations",
  "capabilities": "Capacités",
  "settings": "Réglages",
  "aiAccess": "Accès IA",
  "account": "Compte",
  "support": "Support",
  "dashboard": "Tableau de bord Hermes",
  "signOut": "Se déconnecter",
  "openMenu": "Ouvrir le menu",
  "closeMenu": "Fermer le menu",
  "back": "Retour",
  "appearance": "Apparence",
  "system": "Système",
  "light": "Clair",
  "dark": "Sombre",
  "remove": "Détacher",
  "removeHint": "Balayez vers la gauche ou appuyez longuement pour détacher cette entrée.",
  "removeConfirmTitle": "Détacher cette entrée ?",
  "removeConfirmMessage": "Cela retire {title} de la navigation uniquement. Son contenu reste disponible.",
  "removeCancel": "Annuler",
  "removePending": "Détachement…",
  "removeFailed": "Cette entrée n’a pas pu être détachée.",
  "owner": "Propriétaire",
  "private": "Privé"
}, settings: {
  "title": "Réglages",
  "back": "Reglages",
  "overview": "État et accès",
  "overviewHint": "État du chat, actualisation, déconnexion",
  "account": "Compte",
  "accountHint": "Votre compte et les personnes invitées",
  "connections": "Connexions",
  "connectionsHint": "Gmail, Agenda, Drive, Telegram et autres connexions",
  "support": "Assistance et réparation",
  "supportHint": "Accès d’assistance temporaire et limité",
  "privacy": "Confidentialité",
  "privacyHint": "Comment votre espace privé est protégé",
  "diagnostics": "Diagnostic",
  "diagnosticsHint": "Version, API et erreurs récentes de l’application",
  "language": "Langue"
}, chat: {
  "title": "Discussion",
  "placeholder": "Demander à Hermes",
  "emptyTitle": "Commencez par un message",
  "emptyReady": "Demandez à Hermes ce que vous souhaitez faire, planifier ou comprendre.",
  "startFresh": "Nouveau départ",
  "typing": "Saisie en cours",
  "activity": {
    "needsAttention": "La réponse nécessite votre attention",
    "stopped": "Reponse arretee",
    "waitingForYou": "En attente de vous",
    "writing": "Redige la reponse",
    "gettingReady": "Preparation",
    "working": "Travaille"
  },
  "waiting": "En attente",
  "routeNeedsAttention": "Connexion nécessaire",
  "startVoiceNote": "Commencer une note vocale",
  "stopVoiceNote": "Arrêter l’enregistrement",
  "sendVoiceNote": "Envoyer la note vocale",
  "recording": "Enregistrement",
  "transcribing": "Transcription de la note vocale",
  "retryVoiceNote": "Réessayer la note vocale",
  "discardVoiceNote": "Supprimer la note vocale",
  "copyMessage": "Copier",
  "copyMessageHint": "Appuyez longuement pour les actions du message",
  "cancel": "Annuler",
  "messageCopied": "Message copié.",
  "messageCopyFailed": "Impossible de copier ce message.",
  "messageTime": "Envoyé à",
  "failedNotSentTitle": "Le message n’a pas été envoyé",
  "failedNoAnswerTitle": "La réponse n’est pas arrivée",
  "failedRetry": "Réessayer",
  "failedRetryHint": "Réessayer",
  "failedDismiss": "Ignorer"
}, firstConversation: {
  "greetingTitle": "Salut. Je viens de me réveiller.",
  "greetingBody": "Apparemment, je suis Hermes — et ceci est votre machine privée. Qui êtes-vous, et comment dois-je vous appeler ?",
  "connectionTitle": "Souhaitez-vous connecter quelque chose ?",
  "connectionBody": "Vous pouvez connecter ces services maintenant ou plus tard. Rien de tout cela n'est obligatoire.",
  "connectionSkip": "Pas maintenant",
  "guidedSetup": {
    "open": "Ouvrir",
    "connectGmail": "Connecter Gmail",
    "notNow": "Pas maintenant",
    "noThanks": "Non merci",
    "decline": "Pas maintenant",
    "choiceSaveError": "Impossible d’enregistrer le choix de configuration facultative.",
    "skipError": "Impossible de fermer l’aide à la configuration facultative.",
    "labels": {
      "gmail": "Gmail",
      "ai_access": "Accès IA",
      "telegram": "Telegram"
    },
    "statuses": {
      "available": "Disponible",
      "authorization_required": "Autorisation requise",
      "setup_incomplete": "Terminer la configuration",
      "added": "Ajouté",
      "attention": "À vérifier",
      "unknown": "Inconnu",
      "configured": "Configuré",
      "unavailable": "Indisponible"
    }
  }
} },
  es: { ...en, short: "ES", name: "Español", nav: {
  "chat": "Chat",
  "pages": "Páginas y apps",
  "plugins": "Conexiones",
  "tasks": "Tareas",
  "automations": "Automatizaciones",
  "capabilities": "Funciones",
  "settings": "Ajustes",
  "aiAccess": "Acceso a IA",
  "account": "Cuenta",
  "support": "Support",
  "dashboard": "Panel de Hermes",
  "signOut": "Cerrar sesión",
  "openMenu": "Abrir menú",
  "closeMenu": "Cerrar menú",
  "back": "Atrás",
  "appearance": "Apariencia",
  "system": "Sistema",
  "light": "Claro",
  "dark": "Oscuro",
  "remove": "Desfijar",
  "removeHint": "Desliza a la izquierda o mantén pulsado para desfijar esta entrada.",
  "removeConfirmTitle": "¿Desfijar esta entrada?",
  "removeConfirmMessage": "Esto solo quita {title} de la navegación. Su contenido sigue disponible.",
  "removeCancel": "Cancelar",
  "removePending": "Desfijando…",
  "removeFailed": "No se pudo desfijar esta entrada.",
  "owner": "Propietario",
  "private": "Privado"
}, settings: {
  "title": "Ajustes",
  "back": "Ajustes",
  "overview": "Estado y acceso",
  "overviewHint": "Estado del chat, actualizar, cerrar sesión",
  "account": "Cuenta",
  "accountHint": "Tu cuenta y las personas que invitas",
  "connections": "Conexiones",
  "connectionsHint": "Gmail, Calendar, Drive, Telegram y otras conexiones",
  "support": "Soporte y reparación",
  "supportHint": "Acceso de soporte temporal y limitado",
  "privacy": "Privacidad",
  "privacyHint": "Cómo se protege tu espacio privado",
  "diagnostics": "Diagnóstico",
  "diagnosticsHint": "Versión, API y errores recientes de la app",
  "language": "Idioma"
}, chat: {
  "title": "Chat",
  "placeholder": "Preguntar a Hermes",
  "emptyTitle": "Empieza con un mensaje",
  "emptyReady": "Pregunta a Hermes qué quieres hacer, planificar o entender.",
  "startFresh": "Empezar de nuevo",
  "typing": "Escribiendo",
  "activity": {
    "needsAttention": "La respuesta necesita atención",
    "stopped": "Respuesta detenida",
    "waitingForYou": "Esperándote",
    "writing": "Escribiendo la respuesta",
    "gettingReady": "Preparando",
    "working": "Trabajando"
  },
  "waiting": "Esperando",
  "routeNeedsAttention": "Conexión necesaria",
  "startVoiceNote": "Grabar nota de voz",
  "stopVoiceNote": "Detener grabación",
  "sendVoiceNote": "Enviar nota de voz",
  "recording": "Grabando",
  "transcribing": "Transcribiendo nota de voz",
  "retryVoiceNote": "Reintentar nota de voz",
  "discardVoiceNote": "Descartar nota de voz",
  "copyMessage": "Copiar",
  "copyMessageHint": "Mantén pulsado para ver las acciones del mensaje",
  "cancel": "Cancelar",
  "messageCopied": "Mensaje copiado.",
  "messageCopyFailed": "No se pudo copiar este mensaje.",
  "messageTime": "Enviado a las",
  "failedNotSentTitle": "El mensaje no se envió",
  "failedNoAnswerTitle": "La respuesta no llegó",
  "failedRetry": "Intentar de nuevo",
  "failedRetryHint": "Intentar de nuevo",
  "failedDismiss": "Descartar"
}, firstConversation: { greetingTitle: "Hola. Acabo de conectarme.", greetingBody: "Al parecer soy Hermes, y esta es tu máquina privada. ¿Quién eres y cómo debería llamarte?", connectionTitle: "Conexión recomendada", connectionBody: "Conecta Gmail para que Hermes pueda ayudarte con tu correo.", connectionSkip: "Ahora no", guidedSetup: { open: "Abrir", connectGmail: "Conectar Gmail", notNow: "Ahora no", noThanks: "No, gracias", decline: "Ahora no", choiceSaveError: "No se pudo guardar la opción de configuración.", skipError: "No se pudo cerrar la configuración opcional.", labels: { gmail: "Gmail", ai_access: "Acceso a IA", telegram: "Telegram" }, statuses: { available: "Disponible", authorization_required: "Autorización necesaria", setup_incomplete: "Finalizar configuración", added: "Añadido", attention: "Necesita atención", unknown: "Desconocido", configured: "Configurado", unavailable: "No disponible" } } }, systemPages: systemPagesEs },
  it: { ...en, systemPages: systemPagesIt, short: "IT", name: "Italiano", nav: {
  "chat": "Chat",
  "pages": "Pagine e app",
  "plugins": "Connessioni",
  "tasks": "Attività",
  "automations": "Automazioni",
  "capabilities": "Funzioni",
  "settings": "Impostazioni",
  "aiAccess": "Accesso IA",
  "account": "Account",
  "support": "Support",
  "dashboard": "Dashboard Hermes",
  "signOut": "Esci",
  "openMenu": "Apri menu",
  "closeMenu": "Chiudi menu",
  "back": "Indietro",
  "appearance": "Aspetto",
  "system": "Sistema",
  "light": "Chiaro",
  "dark": "Scuro",
  "remove": "Rimuovi",
  "removeHint": "Scorri a sinistra o tieni premuto per rimuovere questa voce dalla navigazione.",
  "removeConfirmTitle": "Rimuovere questa voce?",
  "removeConfirmMessage": "Questo rimuove solo {title} dalla navigazione. I contenuti restano disponibili.",
  "removeCancel": "Annulla",
  "removePending": "Rimozione…",
  "removeFailed": "Non è stato possibile rimuovere questa voce.",
  "owner": "Proprietario",
  "private": "Privato"
}, settings: {
  "title": "Impostazioni",
  "back": "Impostazioni",
  "overview": "Stato e accesso",
  "overviewHint": "Stato della chat, aggiornamento, uscita",
  "account": "Account",
  "accountHint": "Il tuo account e le persone che inviti",
  "connections": "Connessioni",
  "connectionsHint": "Gmail, Calendar, Drive, Telegram e altre connessioni",
  "support": "Assistenza e riparazione",
  "supportHint": "Accesso di assistenza temporaneo e limitato",
  "privacy": "Privacy",
  "privacyHint": "Come viene protetto il tuo spazio privato",
  "diagnostics": "Diagnostica",
  "diagnosticsHint": "Versione, API ed errori recenti dell’app",
  "language": "Lingua"
}, chat: {
  "title": "Chat",
  "placeholder": "Chiedi a Hermes",
  "emptyTitle": "Inizia con un messaggio",
  "emptyReady": "Chiedi a Hermes cosa vuoi fare, pianificare o capire.",
  "startFresh": "Ricomincia",
  "typing": "Scrittura in corso",
  "activity": {
    "needsAttention": "La risposta richiede attenzione",
    "stopped": "Risposta interrotta",
    "waitingForYou": "In attesa di te",
    "writing": "Scrive la risposta",
    "gettingReady": "Preparazione",
    "working": "Al lavoro"
  },
  "waiting": "In attesa",
  "routeNeedsAttention": "Connessione necessaria",
  "startVoiceNote": "Avvia nota vocale",
  "stopVoiceNote": "Interrompi registrazione",
  "sendVoiceNote": "Invia nota vocale",
  "recording": "Registrazione",
  "transcribing": "Trascrizione della nota vocale",
  "retryVoiceNote": "Riprova nota vocale",
  "discardVoiceNote": "Elimina nota vocale",
  "copyMessage": "Copia",
  "copyMessageHint": "Tieni premuto per le azioni del messaggio",
  "cancel": "Annulla",
  "messageCopied": "Messaggio copiato.",
  "messageCopyFailed": "Impossibile copiare questo messaggio.",
  "messageTime": "Inviato alle",
  "failedNotSentTitle": "Il messaggio non è stato inviato",
  "failedNoAnswerTitle": "La risposta non è arrivata",
  "failedRetry": "Riprova",
  "failedRetryHint": "Riprova",
  "failedDismiss": "Ignora"
}, firstConversation: {
  "greetingTitle": "Ciao. Mi sono appena connesso.",
  "greetingBody": "A quanto pare sono Hermes, e questa è la tua macchina privata. Chi sei e come dovrei chiamarti?",
  "connectionTitle": "Vuoi collegare qualcosa?",
  "connectionBody": "Puoi collegare questi servizi ora o più tardi. Nulla è obbligatorio.",
  "connectionSkip": "Non ora",
  "guidedSetup": {
    "open": "Aperta",
    "connectGmail": "Collega Gmail",
    "notNow": "Non ora",
    "noThanks": "No, grazie",
    "decline": "Non ora",
    "choiceSaveError": "Impossibile salvare la scelta di configurazione facoltativa.",
    "skipError": "Impossibile chiudere la guida alla configurazione facoltativa.",
    "labels": {
      "gmail": "Gmail",
      "ai_access": "Accesso IA",
      "telegram": "Telegram"
    },
    "statuses": {
      "available": "Disponibile",
      "authorization_required": "Autorizzazione necessaria",
      "setup_incomplete": "Completa la configurazione",
      "added": "Aggiunto",
      "attention": "Richiede attenzione",
      "unknown": "Sconosciuto",
      "configured": "Configurato",
      "unavailable": "Non disponibile"
    }
  }
} },
  "pt-BR": { ...en, systemPages: systemPagesPt, short: "PT", name: "Português", nav: {
  "chat": "Chat",
  "pages": "Páginas e apps",
  "plugins": "Conexões",
  "tasks": "Tarefas",
  "automations": "Automações",
  "capabilities": "Recursos",
  "settings": "Configurações",
  "aiAccess": "Acesso à IA",
  "account": "Conta",
  "support": "Support",
  "dashboard": "Painel do Hermes",
  "signOut": "Sair",
  "openMenu": "Abrir menu",
  "closeMenu": "Fechar menu",
  "back": "Voltar",
  "appearance": "Aparência",
  "system": "Sistema",
  "light": "Claro",
  "dark": "Escuro",
  "remove": "Desafixar",
  "removeHint": "Deslize para a esquerda ou mantenha pressionado para desafixar esta entrada.",
  "removeConfirmTitle": "Desafixar esta entrada?",
  "removeConfirmMessage": "Isso remove apenas {title} da navegação. O conteúdo continua disponível.",
  "removeCancel": "Cancelar",
  "removePending": "Desafixando…",
  "removeFailed": "Não foi possível desafixar esta entrada.",
  "owner": "Proprietário",
  "private": "Privado"
}, settings: {
  "title": "Configurações",
  "back": "Configuracoes",
  "overview": "Estado e acesso",
  "overviewHint": "Estado do chat, atualizar, sair",
  "account": "Conta",
  "accountHint": "Sua conta e as pessoas que você convida",
  "connections": "Conexões",
  "connectionsHint": "Gmail, Agenda, Drive, Telegram e outras conexões",
  "support": "Suporte e reparo",
  "supportHint": "Acesso de suporte temporário e limitado",
  "privacy": "Privacidade",
  "privacyHint": "Como seu espaço privado é protegido",
  "diagnostics": "Diagnóstico",
  "diagnosticsHint": "Versão, API e erros recentes do app",
  "language": "Idioma"
}, chat: {
  "title": "Chat",
  "placeholder": "Perguntar ao Hermes",
  "emptyTitle": "Comece com uma mensagem",
  "emptyReady": "Pergunte ao Hermes o que você quer fazer, planejar ou entender.",
  "startFresh": "Recomecar",
  "typing": "Digitando",
  "activity": {
    "needsAttention": "A resposta precisa de atenção",
    "stopped": "Resposta interrompida",
    "waitingForYou": "Esperando por você",
    "writing": "Escrevendo a resposta",
    "gettingReady": "Preparando",
    "working": "Trabalhando"
  },
  "waiting": "Aguardando",
  "routeNeedsAttention": "Conexão necessária",
  "startVoiceNote": "Iniciar nota de voz",
  "stopVoiceNote": "Parar gravação",
  "sendVoiceNote": "Enviar nota de voz",
  "recording": "Gravando",
  "transcribing": "Transcrevendo nota de voz",
  "retryVoiceNote": "Tentar nota de voz novamente",
  "discardVoiceNote": "Descartar nota de voz",
  "copyMessage": "Copiar",
  "copyMessageHint": "Pressione e segure para ver as ações da mensagem",
  "cancel": "Cancelar",
  "messageCopied": "Mensagem copiada.",
  "messageCopyFailed": "Não foi possível copiar esta mensagem.",
  "messageTime": "Enviada às",
  "failedNotSentTitle": "A mensagem não foi enviada",
  "failedNoAnswerTitle": "A resposta não chegou",
  "failedRetry": "Tentar novamente",
  "failedRetryHint": "Tentar novamente",
  "failedDismiss": "Dispensar"
}, firstConversation: {
  "greetingTitle": "Oi. Acabei de ficar online.",
  "greetingBody": "Pelo visto eu sou o Hermes, e esta é a sua máquina privada. Quem é você e como devo chamar você?",
  "connectionTitle": "Gostaria de conectar alguma coisa?",
  "connectionBody": "Você pode conectar estes serviços agora ou mais tarde. Nenhum deles é obrigatório.",
  "connectionSkip": "Agora não",
  "guidedSetup": {
    "open": "Aberta",
    "connectGmail": "Conectar Gmail",
    "notNow": "Agora não",
    "noThanks": "Não, obrigado",
    "decline": "Agora não",
    "choiceSaveError": "Não foi possível salvar a escolha da configuração opcional.",
    "skipError": "Não foi possível fechar a orientação da configuração opcional.",
    "labels": {
      "gmail": "Gmail",
      "ai_access": "Acesso à IA",
      "telegram": "Telegram"
    },
    "statuses": {
      "available": "Disponível",
      "authorization_required": "Autorização necessária",
      "setup_incomplete": "Concluir configuração",
      "added": "Adicionado",
      "attention": "Precisa de atenção",
      "unknown": "Desconhecido",
      "configured": "Configurado",
      "unavailable": "Indisponível"
    }
  }
} },
  ja: {
    ...en,
    systemPages: systemPagesJa,
    short: "JA",
    name: "日本語",
    nav: {
  "chat": "チャット",
  "pages": "ページとアプリ",
  "plugins": "接続",
  "tasks": "タスク",
  "automations": "自動化",
  "capabilities": "機能",
  "settings": "設定",
  "aiAccess": "AIアクセス",
  "account": "アカウント",
  "support": "Support",
  "dashboard": "Hermesダッシュボード",
  "signOut": "サインアウト",
  "openMenu": "メニューを開く",
  "closeMenu": "メニューを閉じる",
  "back": "戻る",
  "appearance": "外観",
  "system": "システム",
  "light": "ライト",
  "dark": "ダーク",
  "remove": "ピン留めを解除",
  "removeHint": "左にスワイプするか長押しして、この項目のピン留めを解除します。",
  "removeConfirmTitle": "この項目のピン留めを解除しますか？",
  "removeConfirmMessage": "ナビゲーションから{title}のみを外します。元のコンテンツは引き続き利用できます。",
  "removeCancel": "キャンセル",
  "removePending": "ピン留めを解除中…",
  "removeFailed": "この項目のピン留めを解除できませんでした。",
  "owner": "所有者",
  "private": "プライベート"
},
    settings: {
  "title": "設定",
  "back": "設定",
  "overview": "状態とアクセス",
  "overviewHint": "チャット状態、更新、ログアウト",
  "account": "アカウント",
  "accountHint": "自分のアカウントと招待した人",
  "connections": "接続",
  "connectionsHint": "Gmail、カレンダー、ドライブ、Telegramなどの接続",
  "support": "サポートと修復",
  "supportHint": "期間と範囲を限定したサポートアクセス",
  "privacy": "プライバシー",
  "privacyHint": "プライベート空間の保護について",
  "diagnostics": "診断",
  "diagnosticsHint": "ビルド、API、最近のアプリエラー",
  "language": "言語"
},
    chat: {
  "title": "チャット",
  "placeholder": "Hermes に聞く",
  "emptyTitle": "最初のメッセージから始めましょう",
  "emptyReady": "やりたいこと、計画、知りたいことを Hermes に聞いてください。",
  "startFresh": "新規開始",
  "typing": "入力中",
  "activity": {
    "needsAttention": "返信の確認が必要です",
    "stopped": "返信を停止しました",
    "waitingForYou": "あなたの入力待ち",
    "writing": "返信を作成中",
    "gettingReady": "準備中",
    "working": "作業中"
  },
  "waiting": "待機中",
  "routeNeedsAttention": "接続が必要です",
  "startVoiceNote": "音声メモを開始",
  "stopVoiceNote": "録音を停止",
  "sendVoiceNote": "音声メモを送信",
  "recording": "録音中",
  "transcribing": "音声メモを文字起こし中",
  "retryVoiceNote": "音声メモを再試行",
  "discardVoiceNote": "音声メモを破棄",
  "copyMessage": "コピー",
  "copyMessageHint": "長押しでメッセージ操作を表示",
  "cancel": "キャンセル",
  "messageCopied": "メッセージをコピーしました。",
  "messageCopyFailed": "このメッセージをコピーできませんでした。",
  "messageTime": "送信時刻",
  "failedNotSentTitle": "メッセージを送信できませんでした",
  "failedNoAnswerTitle": "返信が届きませんでした",
  "failedRetry": "再試行",
  "failedRetryHint": "再試行",
  "failedDismiss": "閉じる"
},
    firstConversation: {
  "greetingTitle": "こんにちは。今オンラインになりました。",
  "greetingBody": "どうやら私はHermesで、ここはあなた専用のマシンです。あなたは誰で、何とお呼びすればよいですか？",
  "connectionTitle": "何か接続しますか？",
  "connectionBody": "これらのサービスは今でも後でも接続できます。どれも必須ではありません。",
  "connectionSkip": "今はしない",
  "guidedSetup": {
    "open": "未着手",
    "connectGmail": "Gmailに接続",
    "notNow": "今はしない",
    "noThanks": "不要です",
    "decline": "今はしない",
    "choiceSaveError": "任意の設定の選択を保存できませんでした。",
    "skipError": "任意の設定案内を閉じられませんでした。",
    "labels": {
      "gmail": "Gmail",
      "ai_access": "AIアクセス",
      "telegram": "Telegram"
    },
    "statuses": {
      "available": "利用できます",
      "authorization_required": "認可が必要",
      "setup_incomplete": "設定を完了",
      "added": "追加済み",
      "attention": "確認が必要",
      "unknown": "不明",
      "configured": "設定済み",
      "unavailable": "利用できません"
    }
  }
},
  },
  ko: {
    ...en,
    systemPages: systemPagesKo,
    short: "KO",
    name: "한국어",
    nav: {
  "chat": "채팅",
  "pages": "페이지와 앱",
  "plugins": "연결",
  "tasks": "작업",
  "automations": "자동화",
  "capabilities": "기능",
  "settings": "설정",
  "aiAccess": "AI 액세스",
  "account": "계정",
  "support": "Support",
  "dashboard": "Hermes 대시보드",
  "signOut": "로그아웃",
  "openMenu": "메뉴 열기",
  "closeMenu": "메뉴 닫기",
  "back": "뒤로",
  "appearance": "화면 모드",
  "system": "시스템",
  "light": "라이트",
  "dark": "다크",
  "remove": "고정 해제",
  "removeHint": "왼쪽으로 쓸어 넘기거나 길게 눌러 이 항목의 고정을 해제합니다.",
  "removeConfirmTitle": "이 항목의 고정을 해제할까요?",
  "removeConfirmMessage": "탐색 메뉴에서 {title} 항목만 제거합니다. 원본 콘텐츠는 계속 사용할 수 있습니다.",
  "removeCancel": "취소",
  "removePending": "고정 해제 중…",
  "removeFailed": "이 항목의 고정을 해제하지 못했습니다.",
  "owner": "소유자",
  "private": "비공개"
},
    settings: {
  "title": "설정",
  "back": "설정",
  "overview": "상태 및 접근",
  "overviewHint": "채팅 상태, 새로 고침, 로그아웃",
  "account": "계정",
  "accountHint": "내 계정과 초대한 사람들",
  "connections": "연결",
  "connectionsHint": "Gmail, 캘린더, Drive, Telegram 및 기타 연결",
  "support": "지원 및 복구",
  "supportHint": "기간과 범위가 제한된 지원 접근",
  "privacy": "개인정보 보호",
  "privacyHint": "비공개 공간이 보호되는 방식",
  "diagnostics": "진단",
  "diagnosticsHint": "빌드, API 및 최근 앱 오류",
  "language": "언어"
},
    chat: {
  "title": "채팅",
  "placeholder": "Hermes에게 묻기",
  "emptyTitle": "메시지 하나로 시작하세요",
  "emptyReady": "하고 싶은 일, 계획, 궁금한 점을 Hermes에게 물어보세요.",
  "startFresh": "새로 시작",
  "typing": "입력 중",
  "activity": {
    "needsAttention": "답변을 확인해야 합니다",
    "stopped": "답변이 중지됨",
    "waitingForYou": "입력을 기다리는 중",
    "writing": "답변 작성 중",
    "gettingReady": "준비 중",
    "working": "작업 중"
  },
  "waiting": "대기 중",
  "routeNeedsAttention": "연결 필요",
  "startVoiceNote": "음성 메모 시작",
  "stopVoiceNote": "녹음 중지",
  "sendVoiceNote": "음성 메모 보내기",
  "recording": "녹음 중",
  "transcribing": "음성 메모를 텍스트로 변환 중",
  "retryVoiceNote": "음성 메모 다시 시도",
  "discardVoiceNote": "음성 메모 버리기",
  "copyMessage": "복사",
  "copyMessageHint": "길게 누르면 메시지 동작이 표시됩니다",
  "cancel": "취소",
  "messageCopied": "메시지를 복사했습니다.",
  "messageCopyFailed": "이 메시지를 복사하지 못했습니다.",
  "messageTime": "보낸 시간",
  "failedNotSentTitle": "메시지를 보내지 못했습니다",
  "failedNoAnswerTitle": "답변이 도착하지 않았습니다",
  "failedRetry": "다시 시도",
  "failedRetryHint": "다시 시도",
  "failedDismiss": "닫기"
},
    firstConversation: {
  "greetingTitle": "안녕하세요. 방금 온라인이 됐어요.",
  "greetingBody": "아무래도 저는 Hermes이고, 여기는 당신만의 컴퓨터인 것 같아요. 누구시고, 어떻게 불러 드리면 될까요?",
  "connectionTitle": "연결하고 싶은 것이 있나요?",
  "connectionBody": "이 서비스들은 지금 또는 나중에 연결할 수 있습니다. 어느 것도 필수는 아닙니다.",
  "connectionSkip": "나중에",
  "guidedSetup": {
    "open": "열림",
    "connectGmail": "Gmail 연결",
    "notNow": "나중에",
    "noThanks": "괜찮습니다",
    "decline": "나중에",
    "choiceSaveError": "선택적 설정 항목을 저장하지 못했습니다.",
    "skipError": "선택적 설정 안내를 닫지 못했습니다.",
    "labels": {
      "gmail": "Gmail",
      "ai_access": "AI 액세스",
      "telegram": "Telegram"
    },
    "statuses": {
      "available": "사용 가능",
      "authorization_required": "인증 필요",
      "setup_incomplete": "설정 마치기",
      "added": "추가됨",
      "attention": "확인 필요",
      "unknown": "알 수 없음",
      "configured": "설정됨",
      "unavailable": "사용할 수 없음"
    }
  }
},
  },
};

for (const locale of appLocales) {
  Object.assign(mobileCatalog[locale].nav, navigationRemovalCopy[locale]);
}

export type MobileAiAccessOauthCopy = {
  chatGptOpened: string;
  claudeOpened: string;
  runtimePaused: string;
  startUnavailable: string;
  iosLinkFailed: string;
};

const mobileAiAccessOauthCopyEn: MobileAiAccessOauthCopy = {
  chatGptOpened: "ChatGPT sign-in was opened.",
  claudeOpened: "Claude sign-in was opened.",
  runtimePaused: "Hermes is paused. Resume access, then try again.",
  startUnavailable: "Provider sign-in is unavailable. Try again.",
  iosLinkFailed: "Sign-in is ready, but iOS could not open it. Tap Open sign-in.",
};

const mobileAiAccessOauthCopyByLocale: Partial<Record<AppLocale, MobileAiAccessOauthCopy>> = {
  de: {
    chatGptOpened: "Die ChatGPT-Anmeldung wurde geöffnet.",
    claudeOpened: "Die Claude-Anmeldung wurde geöffnet.",
    runtimePaused: "Hermes ist pausiert. Aktiviere den Zugang und versuche es erneut.",
    startUnavailable: "Die Provider-Anmeldung ist derzeit nicht verfügbar. Versuche es erneut.",
    iosLinkFailed: "Die Anmeldung ist bereit, aber iOS konnte sie nicht öffnen. Tippe auf Anmeldung öffnen.",
  },
  es: {
    chatGptOpened: "Se abrió el inicio de sesión de ChatGPT.",
    claudeOpened: "Se abrió el inicio de sesión de Claude.",
    runtimePaused: "Hermes está pausado. Reactiva el acceso y vuelve a intentarlo.",
    startUnavailable: "El inicio de sesión del proveedor no está disponible. Vuelve a intentarlo.",
    iosLinkFailed: "El inicio de sesión está listo, pero iOS no pudo abrirlo. Pulsa Abrir inicio de sesión.",
  },
};

export function mobileAiAccessOauthCopy(locale: AppLocale) {
  return mobileAiAccessOauthCopyByLocale[locale] ?? mobileAiAccessOauthCopyEn;
}

export type MobileAiModelCopy = {
  modelsTitle: string;
  modelsDetail: string;
  modelChangeTitle: string;
  modelChangeDetail: string;
  modelChangeAction: string;
  modelRecommended: string;
  modelDefault: string;
  modelAvailable: string;
  modelUnavailable: string;
  modelSpeed: string;
  modelQuality: string;
  modelCost: string;
  modelSourceDate: string;
  modelUnknown: string;
  modelStatusUnknown: string;
  modelSaveFailed: string;
};

const mobileAiModelCopyEn: MobileAiModelCopy = {
  modelsTitle: "AI model",
  modelsDetail: "Which model thinks for you. Your own choice stays.",
  modelChangeTitle: "Change AI model?",
  modelChangeDetail: "Use {model} for new chats and automations?",
  modelChangeAction: "Use {model}",
  modelRecommended: "Recommended",
  modelDefault: "Default",
  modelAvailable: "Available",
  modelUnavailable: "Not selectable",
  modelSpeed: "Speed",
  modelQuality: "Intelligence",
  modelCost: "Cost in/out",
  modelSourceDate: "Sources",
  modelUnknown: "Unknown",
  modelStatusUnknown: "The model choice was sent, but the current selection could not be confirmed. Refresh and check again.",
  modelSaveFailed: "The model choice could not be saved.",
};

const mobileAiModelCopyByLocale: Partial<Record<AppLocale, MobileAiModelCopy>> = {
  de: {
    modelsTitle: "KI-Modell",
    modelsDetail: "Welches Modell für Dich denkt. Deine eigene Wahl bleibt bestehen.",
    modelChangeTitle: "KI-Modell wechseln?",
    modelChangeDetail: "{model} für neue Chats und Automationen verwenden?",
    modelChangeAction: "{model} verwenden",
    modelRecommended: "Empfohlen",
    modelDefault: "Standard",
    modelAvailable: "Verfügbar",
    modelUnavailable: "Nicht auswählbar",
    modelSpeed: "Geschwindigkeit",
    modelQuality: "Klugheit",
    modelCost: "Kosten Ein/Aus",
    modelSourceDate: "Quellen",
    modelUnknown: "Unbekannt",
    modelStatusUnknown: "Die Modellauswahl wurde gesendet, aber die aktuelle Auswahl konnte nicht bestätigt werden. Aktualisiere und prüfe erneut.",
    modelSaveFailed: "Die Modellauswahl konnte nicht gespeichert werden.",
  },
  es: {
    modelsTitle: "Modelo de IA",
    modelsDetail: "Qué modelo piensa por ti. Tu propia elección se mantiene.",
    modelChangeTitle: "¿Cambiar el modelo de IA?",
    modelChangeDetail: "¿Usar {model} para nuevos chats y automatizaciones?",
    modelChangeAction: "Usar {model}",
    modelRecommended: "Recomendado",
    modelDefault: "Predeterminado",
    modelAvailable: "Disponible",
    modelUnavailable: "No seleccionable",
    modelSpeed: "Velocidad",
    modelQuality: "Inteligencia",
    modelCost: "Coste entrada/salida",
    modelSourceDate: "Fuentes",
    modelUnknown: "Desconocido",
    modelStatusUnknown: "La selección del modelo se envió, pero no se pudo confirmar la selección actual. Actualiza y vuelve a comprobarla.",
    modelSaveFailed: "No se pudo guardar la selección del modelo.",
  },
};

export function mobileAiModelCopy(locale: AppLocale) {
  return mobileAiModelCopyByLocale[locale] ?? mobileAiModelCopyEn;
}

export const mobileLocaleOptions = appLocales.map((locale) => ({
  locale,
  shortLabel: mobileCatalog[locale].short,
  label: mobileCatalog[locale].name,
}));

export function normalizeMobileLocale(value: string | null | undefined): AppLocale {
  return appLocales.includes(value as AppLocale) ? (value as AppLocale) : defaultAppLocale;
}

const mobileNavigationSupplement: Record<AppLocale, Pick<MobileCopy["nav"], "support" | "system">> = {
  en: { support: "Support", system: "Automatic" },
  de: { support: "Support", system: "Automatisch" },
  fr: { support: "Assistance", system: "Auto" },
  es: { support: "Soporte", system: "Automático" },
  it: { support: "Assistenza", system: "Automatico" },
  "pt-BR": { support: "Suporte", system: "Automático" },
  ja: { support: "サポート", system: "自動" },
  ko: { support: "지원", system: "자동" },
};

const mobileDangerZoneLabels: Record<AppLocale, string> = {
  en: "Danger Zone",
  de: "Gefahrenbereich",
  fr: "Zone dangereuse",
  es: "Zona de peligro",
  it: "Zona pericolosa",
  "pt-BR": "Zona de perigo",
  ja: "危険な操作",
  ko: "위험 구역",
};

export function mobileText(locale: AppLocale) {
  const copy = mobileCatalog[locale] ?? mobileCatalog[defaultAppLocale];
  return {
    ...copy,
    nav: { ...copy.nav, ...mobileNavigationSupplement[locale] },
  };
}

const mobileRouteAutomationFailureByLocale: Record<AppLocale, Readonly<{
  message: string;
  saveAgain: string;
  openAutomations: string;
}>> = {
  en: { message: "Your AI choice was saved, but the scheduled tasks could not be updated. Save the same choice again or open Automations.", saveAgain: "Save this AI choice again", openAutomations: "Open Automations" },
  de: { message: "Deine KI-Auswahl wurde gespeichert, aber die geplanten Aufgaben konnten nicht mitgezogen werden. Speichere dieselbe Auswahl erneut oder öffne Automationen.", saveAgain: "Diese KI-Auswahl erneut speichern", openAutomations: "Automationen öffnen" },
  fr: { message: "Votre choix d'IA a été enregistré, mais les tâches planifiées n'ont pas pu être mises à jour. Enregistrez à nouveau le même choix ou ouvrez Automations.", saveAgain: "Enregistrer à nouveau ce choix d'IA", openAutomations: "Ouvrir Automations" },
  es: { message: "Tu elección de IA se guardó, pero las tareas programadas no pudieron actualizarse. Guarda de nuevo la misma elección o abre Automatizaciones.", saveAgain: "Guardar de nuevo esta elección de IA", openAutomations: "Abrir Automatizaciones" },
  it: { message: "La scelta IA è stata salvata, ma le attività pianificate non sono state aggiornate. Salva di nuovo la stessa scelta o apri Automazioni.", saveAgain: "Salva di nuovo questa scelta IA", openAutomations: "Apri Automazioni" },
  "pt-BR": { message: "Sua escolha de IA foi salva, mas as tarefas agendadas não puderam ser atualizadas. Salve a mesma escolha novamente ou abra Automações.", saveAgain: "Salvar esta escolha de IA novamente", openAutomations: "Abrir Automações" },
  ja: { message: "AI の選択は保存されましたが、予定されたタスクを更新できませんでした。同じ選択をもう一度保存するか、オートメーションを開いてください。", saveAgain: "この AI の選択をもう一度保存", openAutomations: "オートメーションを開く" },
  ko: { message: "AI 선택은 저장되었지만 예약된 작업을 업데이트하지 못했습니다. 같은 선택을 다시 저장하거나 자동화를 여세요.", saveAgain: "이 AI 선택 다시 저장", openAutomations: "자동화 열기" },
};

export function mobileRouteAutomationFailureCopy(locale: AppLocale) {
  return mobileRouteAutomationFailureByLocale[locale] ?? mobileRouteAutomationFailureByLocale[defaultAppLocale];
}

export function mobileDangerZoneText(locale: AppLocale) {
  return mobileDangerZoneLabels[locale] ?? mobileDangerZoneLabels[defaultAppLocale];
}

const pluginCatalogYoursLabels: Record<AppLocale, string> = {
  en: "Yours",
  de: "Deine",
  fr: "Les vôtres",
  es: "Tus conexiones",
  it: "Le tue",
  "pt-BR": "Suas conexões",
  ja: "あなたの接続",
  ko: "내 연결",
};

export function mobilePluginCatalogYours(locale: AppLocale) {
  return pluginCatalogYoursLabels[locale] ?? pluginCatalogYoursLabels[defaultAppLocale];
}

/**
 * HPD-416. The server answers the security screen and the ranked task list in
 * its own vocabulary — `not_started`, `unknown`, `revoked`, `sealed`, `open`.
 * Until now the phone printed those words with their underscores opened up, so
 * a German account read "Übergabe · not started" and "Aktive Freigaben · Keine"
 * in the same column.
 *
 * A state word is a closed set, so it is translated here rather than dressed up
 * at the point it is drawn. Free-form server text — an infrastructure event
 * type, a support scope name — is not in a closed set and keeps its own words.
 */
export type MobileSecurityStateWords = Readonly<{
  handoverStatuses: Readonly<Record<AdminHandoverStatus, string>>;
  standingAccessStatuses: Readonly<Record<StandingAccessStatus, string>>;
  infrastructureStatuses: Readonly<Record<CloudInfrastructureEventSeverity, string>>;
  auditBatchStatuses: Readonly<Record<AuditProofBatchStatus, string>>;
  supportGrantStatuses: Readonly<Record<SupportGrantStatus, string>>;
}>;

const mobileSecurityStateWordsByLocale: Record<AppLocale, MobileSecurityStateWords> = {
  en: {
    handoverStatuses: { not_started: "Not started", pending: "Pending", passed: "Passed", failed: "Failed", waived: "Waived" },
    standingAccessStatuses: { unknown: "Unknown", none_detected: "none detected", detected: "Detected", not_checked: "Not checked" },
    infrastructureStatuses: { green: "All clear", yellow: "Watch", red: "Critical" },
    auditBatchStatuses: { planned: "Planned", sealed: "Sealed", anchored: "Anchored" },
    supportGrantStatuses: { active: "Active", expired: "Expired", revoked: "Revoked" },
  },
  de: {
    handoverStatuses: { not_started: "Nicht begonnen", pending: "Ausstehend", passed: "Bestanden", failed: "Fehlgeschlagen", waived: "Erlassen" },
    standingAccessStatuses: { unknown: "Unbekannt", none_detected: "keiner festgestellt", detected: "Festgestellt", not_checked: "Nicht geprüft" },
    infrastructureStatuses: { green: "In Ordnung", yellow: "Auffällig", red: "Kritisch" },
    auditBatchStatuses: { planned: "Geplant", sealed: "Versiegelt", anchored: "Verankert" },
    supportGrantStatuses: { active: "Aktiv", expired: "Abgelaufen", revoked: "Widerrufen" },
  },
  fr: {
    handoverStatuses: { not_started: "Pas commencé", pending: "En attente", passed: "Réussi", failed: "Échoué", waived: "Levé" },
    standingAccessStatuses: { unknown: "Inconnu", none_detected: "aucun détecté", detected: "Détecté", not_checked: "Non vérifié" },
    infrastructureStatuses: { green: "Tout va bien", yellow: "À surveiller", red: "Critique" },
    auditBatchStatuses: { planned: "Planifié", sealed: "Scellé", anchored: "Ancré" },
    supportGrantStatuses: { active: "Actif", expired: "Expiré", revoked: "Révoqué" },
  },
  es: {
    handoverStatuses: { not_started: "Sin empezar", pending: "Pendiente", passed: "Superado", failed: "Fallido", waived: "Eximido" },
    standingAccessStatuses: { unknown: "Desconocido", none_detected: "ninguno detectado", detected: "Detectado", not_checked: "Sin comprobar" },
    infrastructureStatuses: { green: "Todo correcto", yellow: "En observación", red: "Crítico" },
    auditBatchStatuses: { planned: "Planificado", sealed: "Sellado", anchored: "Anclado" },
    supportGrantStatuses: { active: "Activo", expired: "Caducado", revoked: "Revocado" },
  },
  it: {
    handoverStatuses: { not_started: "Non avviato", pending: "In attesa", passed: "Superato", failed: "Fallito", waived: "Derogato" },
    standingAccessStatuses: { unknown: "Sconosciuto", none_detected: "nessuno rilevato", detected: "Rilevato", not_checked: "Non verificato" },
    infrastructureStatuses: { green: "Tutto a posto", yellow: "Da osservare", red: "Critico" },
    auditBatchStatuses: { planned: "Pianificato", sealed: "Sigillato", anchored: "Ancorato" },
    supportGrantStatuses: { active: "Attivo", expired: "Scaduto", revoked: "Revocato" },
  },
  "pt-BR": {
    handoverStatuses: { not_started: "Não iniciada", pending: "Pendente", passed: "Aprovada", failed: "Falhou", waived: "Dispensada" },
    standingAccessStatuses: { unknown: "Desconhecido", none_detected: "nenhum detectado", detected: "Detectado", not_checked: "Não verificado" },
    infrastructureStatuses: { green: "Tudo certo", yellow: "Em observação", red: "Crítico" },
    auditBatchStatuses: { planned: "Planejado", sealed: "Selado", anchored: "Ancorado" },
    supportGrantStatuses: { active: "Ativa", expired: "Expirada", revoked: "Revogada" },
  },
  ja: {
    handoverStatuses: { not_started: "未開始", pending: "保留中", passed: "完了", failed: "失敗", waived: "免除" },
    standingAccessStatuses: { unknown: "不明", none_detected: "検出なし", detected: "検出あり", not_checked: "未確認" },
    infrastructureStatuses: { green: "異常なし", yellow: "要観察", red: "重大" },
    auditBatchStatuses: { planned: "予定", sealed: "封印済み", anchored: "アンカー済み" },
    supportGrantStatuses: { active: "有効", expired: "期限切れ", revoked: "取り消し済み" },
  },
  ko: {
    handoverStatuses: { not_started: "시작 전", pending: "대기 중", passed: "통과", failed: "실패", waived: "면제" },
    standingAccessStatuses: { unknown: "알 수 없음", none_detected: "발견되지 않음", detected: "발견됨", not_checked: "확인 안 함" },
    infrastructureStatuses: { green: "이상 없음", yellow: "관찰 필요", red: "심각" },
    auditBatchStatuses: { planned: "예정", sealed: "봉인됨", anchored: "고정됨" },
    supportGrantStatuses: { active: "활성", expired: "만료됨", revoked: "철회됨" },
  },
};

export function mobileSecurityStateWords(locale: AppLocale): MobileSecurityStateWords {
  return mobileSecurityStateWordsByLocale[locale] ?? mobileSecurityStateWordsByLocale[defaultAppLocale];
}

/**
 * HPD-416. The same for the ranked task list: `Open`, `Score:`, `Urgency:`,
 * `Importance:`, `Implied time:` and `Kanban ID:` stood in English on a German
 * account, because the phone only ever overrode the row buttons.
 *
 * Those buttons are still three, and the same three on every row: Done, Delete,
 * Chat. "Delete" takes the task off this list and destroys nothing - a Kanban
 * card keeps its card, a finding keeps its row, and both can be put back.
 */
export type MobileRankedTaskWords = Readonly<{
  showCompleted: string;
  hideCompleted: string;
  confirmComplete: string;
  confirmDismiss: string;
  cancel: string;
  inventoryLabel: string;
  rank: string;
  score: string;
  urgency: string;
  importance: string;
  nativeId: string;
  deadline: string;
  impliedTime: string;
  reviewTime: string;
  refresh: string;
  refreshing: string;
  nativeStatuses: Readonly<Record<RankedTaskStatus, string>>;
  candidateStates: Readonly<Record<"suggested" | "dismissed", string>>;
  sourceNames: Readonly<Record<RankedTaskSource, string>>;
  rowActions: Readonly<Record<RankedTaskRowActionId, string>>;
}>;

const mobileRankedTaskWordsByLocale: Record<AppLocale, MobileRankedTaskWords> = {
  en: {
    inventoryLabel: "Ranked task inventory",
    rank: "Rank", score: "Score", urgency: "Urgency", importance: "Importance",
    nativeId: "Kanban ID", deadline: "Deadline", impliedTime: "Implied time", reviewTime: "Review",
    refresh: "Refresh ranking", refreshing: "Refreshing…",
    nativeStatuses: { open: "Open", blocked: "Blocked", running: "Running", done: "Done", dismissed: "Dismissed" },
    candidateStates: { suggested: "Suggestion", dismissed: "Dismissed" },
    sourceNames: { kanban: "Kanban", email_triage: "Email", vault: "Vault", memory: "Memory" },
    showCompleted: "Show completed tasks",
    hideCompleted: "Hide completed tasks",
    confirmComplete: "Mark this task as done?",
    confirmDismiss: "Dismiss this task from the list?",
    cancel: "Cancel",
    rowActions: { complete: "Done", dismiss: "Dismiss", chat: "Chat" },
  },
  de: {
    inventoryLabel: "Gerankter Aufgabenbestand",
    rank: "Rang", score: "Wert", urgency: "Dringlichkeit", importance: "Wichtigkeit",
    nativeId: "Kanban-ID", deadline: "Frist", impliedTime: "Angenommener Termin", reviewTime: "Prüfung",
    refresh: "Ranking aktualisieren", refreshing: "Wird aktualisiert…",
    nativeStatuses: { open: "Offen", blocked: "Blockiert", running: "Läuft", done: "Erledigt", dismissed: "Ausgeblendet" },
    candidateStates: { suggested: "Vorschlag", dismissed: "Ausgeblendet" },
    sourceNames: { kanban: "Kanban", email_triage: "E-Mail", vault: "Vault", memory: "Erinnerung" },
    showCompleted: "Erledigte Aufgaben anzeigen",
    hideCompleted: "Erledigte Aufgaben ausblenden",
    confirmComplete: "Diese Aufgabe als erledigt markieren?",
    confirmDismiss: "Diese Aufgabe aus der Liste ausblenden?",
    cancel: "Abbrechen",
    rowActions: { complete: "Erledigt", dismiss: "Ausblenden", chat: "Chat" },
  },
  fr: {
    inventoryLabel: "Inventaire des tâches classées",
    rank: "Rang", score: "Score", urgency: "Urgence", importance: "Importance",
    nativeId: "ID Kanban", deadline: "Échéance", impliedTime: "Échéance déduite", reviewTime: "Revue",
    refresh: "Actualiser le classement", refreshing: "Actualisation…",
    nativeStatuses: { open: "Ouvert", blocked: "Bloqué", running: "En cours", done: "Terminé", dismissed: "Ignoré" },
    candidateStates: { suggested: "Suggestion", dismissed: "Ignoré" },
    sourceNames: { kanban: "Kanban", email_triage: "E-mail", vault: "Coffre", memory: "Mémoire" },
    showCompleted: "Afficher les tâches terminées",
    hideCompleted: "Masquer les tâches terminées",
    confirmComplete: "Marquer cette tâche comme terminée ?",
    confirmDismiss: "Masquer cette tâche de la liste ?",
    cancel: "Annuler",
    rowActions: { complete: "Terminé", dismiss: "Masquer", chat: "Chat" },
  },
  es: {
    inventoryLabel: "Inventario de tareas priorizadas",
    rank: "Puesto", score: "Puntuación", urgency: "Urgencia", importance: "Importancia",
    nativeId: "ID de Kanban", deadline: "Fecha límite", impliedTime: "Fecha estimada", reviewTime: "Revisión",
    refresh: "Actualizar la priorización", refreshing: "Actualizando…",
    nativeStatuses: { open: "Abierta", blocked: "Bloqueada", running: "En curso", done: "Hecha", dismissed: "Descartada" },
    candidateStates: { suggested: "Sugerencia", dismissed: "Descartada" },
    sourceNames: { kanban: "Kanban", email_triage: "Correo", vault: "Bóveda", memory: "Memoria" },
    showCompleted: "Mostrar tareas completadas",
    hideCompleted: "Ocultar tareas completadas",
    confirmComplete: "¿Marcar esta tarea como completada?",
    confirmDismiss: "¿Ocultar esta tarea de la lista?",
    cancel: "Cancelar",
    rowActions: { complete: "Hecho", dismiss: "Ocultar", chat: "Chat" },
  },
  it: {
    inventoryLabel: "Inventario delle attività ordinate",
    rank: "Posizione", score: "Punteggio", urgency: "Urgenza", importance: "Importanza",
    nativeId: "ID Kanban", deadline: "Scadenza", impliedTime: "Scadenza presunta", reviewTime: "Revisione",
    refresh: "Aggiorna l'ordinamento", refreshing: "Aggiornamento…",
    nativeStatuses: { open: "Aperta", blocked: "Bloccata", running: "In corso", done: "Fatta", dismissed: "Ignorata" },
    candidateStates: { suggested: "Suggerimento", dismissed: "Ignorata" },
    sourceNames: { kanban: "Kanban", email_triage: "E-mail", vault: "Cassaforte", memory: "Memoria" },
    showCompleted: "Mostra attività completate",
    hideCompleted: "Nascondi attività completate",
    confirmComplete: "Contrassegnare questa attività come completata?",
    confirmDismiss: "Nascondere questa attività dalla lista?",
    cancel: "Annulla",
    rowActions: { complete: "Fatto", dismiss: "Nascondi", chat: "Chat" },
  },
  "pt-BR": {
    inventoryLabel: "Inventário de tarefas priorizadas",
    rank: "Posição", score: "Pontuação", urgency: "Urgência", importance: "Importância",
    nativeId: "ID do Kanban", deadline: "Prazo", impliedTime: "Prazo estimado", reviewTime: "Revisão",
    refresh: "Atualizar a priorização", refreshing: "Atualizando…",
    nativeStatuses: { open: "Aberta", blocked: "Bloqueada", running: "Em andamento", done: "Concluída", dismissed: "Descartada" },
    candidateStates: { suggested: "Sugestão", dismissed: "Descartada" },
    sourceNames: { kanban: "Kanban", email_triage: "E-mail", vault: "Cofre", memory: "Memória" },
    showCompleted: "Mostrar tarefas concluídas",
    hideCompleted: "Ocultar tarefas concluídas",
    confirmComplete: "Marcar esta tarefa como concluída?",
    confirmDismiss: "Ocultar esta tarefa da lista?",
    cancel: "Cancelar",
    rowActions: { complete: "Concluído", dismiss: "Ocultar", chat: "Chat" },
  },
  ja: {
    inventoryLabel: "順位づけされたタスク一覧",
    rank: "順位", score: "スコア", urgency: "緊急度", importance: "重要度",
    nativeId: "Kanban ID", deadline: "期限", impliedTime: "推定の時期", reviewTime: "確認",
    refresh: "順位を更新", refreshing: "更新中…",
    nativeStatuses: { open: "未着手", blocked: "停滞", running: "進行中", done: "完了", dismissed: "閉じた" },
    candidateStates: { suggested: "提案", dismissed: "閉じた" },
    sourceNames: { kanban: "Kanban", email_triage: "メール", vault: "Vault", memory: "メモリ" },
    showCompleted: "完了したタスクを表示",
    hideCompleted: "完了したタスクを非表示",
    confirmComplete: "このタスクを完了にしますか？",
    confirmDismiss: "このタスクを一覧から非表示にしますか？",
    cancel: "キャンセル",
    rowActions: { complete: "完了", dismiss: "非表示", chat: "チャット" },
  },
  ko: {
    inventoryLabel: "순위가 매겨진 작업 목록",
    rank: "순위", score: "점수", urgency: "긴급도", importance: "중요도",
    nativeId: "Kanban ID", deadline: "기한", impliedTime: "예상 시점", reviewTime: "검토",
    refresh: "순위 새로 고침", refreshing: "새로 고치는 중…",
    nativeStatuses: { open: "열림", blocked: "막힘", running: "진행 중", done: "완료", dismissed: "닫음" },
    candidateStates: { suggested: "제안", dismissed: "닫음" },
    sourceNames: { kanban: "Kanban", email_triage: "메일", vault: "Vault", memory: "메모리" },
    showCompleted: "완료된 작업 표시",
    hideCompleted: "완료된 작업 숨기기",
    confirmComplete: "이 작업을 완료로 표시할까요?",
    confirmDismiss: "이 작업을 목록에서 숨길까요?",
    cancel: "취소",
    rowActions: { complete: "완료", dismiss: "숨기기", chat: "채팅" },
  },
};

export function mobileRankedTaskWords(locale: AppLocale): MobileRankedTaskWords {
  return mobileRankedTaskWordsByLocale[locale] ?? mobileRankedTaskWordsByLocale[defaultAppLocale];
}

// Status summaries reuse the app’s existing security and capability state words.
const statusSummaryExtraWords = {
  "de": {
    "disabled": "Deaktiviert",
    "owner": "Eigentümer",
    "member": "Mitglied",
    "trial": "Testphase",
    "personal": "Personal",
    "business": "Business",
    "none": "Keine",
    "trialing": "In Testphase",
    "grace_period": "Nachfrist",
    "cancelled": "Gekündigt",
    "enabled": "Aktiviert",
    "suspended": "Ausgesetzt",
    "dedicated_vps": "Dedizierter Server",
    "workspace_runtime": "Workspace-Laufzeitumgebung",
    "workspace_container": "Workspace-Container",
    "unresolved": "Nicht geklärt",
    "missing": "Fehlt",
    "unhealthy": "Gestört",
    "status_unavailable": "Status nicht verfügbar"
  },
  "fr": {
    "disabled": "Désactivé",
    "owner": "Propriétaire",
    "member": "Membre",
    "trial": "Essai",
    "personal": "Personal",
    "business": "Business",
    "none": "Aucun",
    "trialing": "En période d’essai",
    "grace_period": "Délai de grâce",
    "cancelled": "Résilié",
    "enabled": "Activé",
    "suspended": "Suspendu",
    "dedicated_vps": "Serveur dédié",
    "workspace_runtime": "Environnement de l’espace",
    "workspace_container": "Conteneur de l’espace",
    "unresolved": "Non résolu",
    "missing": "Absent",
    "unhealthy": "Défaillant",
    "status_unavailable": "État indisponible"
  },
  "es": {
    "disabled": "Desactivado",
    "owner": "Propietario",
    "member": "Miembro",
    "trial": "Prueba",
    "personal": "Personal",
    "business": "Business",
    "none": "Ninguno",
    "trialing": "En prueba",
    "grace_period": "Periodo de gracia",
    "cancelled": "Cancelado",
    "enabled": "Habilitado",
    "suspended": "Suspendido",
    "dedicated_vps": "Servidor dedicado",
    "workspace_runtime": "Entorno del espacio",
    "workspace_container": "Contenedor del espacio",
    "unresolved": "Sin resolver",
    "missing": "Ausente",
    "unhealthy": "Con problemas",
    "status_unavailable": "Estado no disponible"
  },
  "it": {
    "disabled": "Disattivato",
    "owner": "Proprietario",
    "member": "Membro",
    "trial": "Prova",
    "personal": "Personal",
    "business": "Business",
    "none": "Nessuno",
    "trialing": "In prova",
    "grace_period": "Periodo di tolleranza",
    "cancelled": "Annullato",
    "enabled": "Abilitato",
    "suspended": "Sospeso",
    "dedicated_vps": "Server dedicato",
    "workspace_runtime": "Ambiente dello spazio",
    "workspace_container": "Contenitore dello spazio",
    "unresolved": "Non risolto",
    "missing": "Assente",
    "unhealthy": "Non funzionante",
    "status_unavailable": "Stato non disponibile"
  },
  "pt-BR": {
    "disabled": "Desativado",
    "owner": "Proprietário",
    "member": "Membro",
    "trial": "Teste",
    "personal": "Personal",
    "business": "Business",
    "none": "Nenhum",
    "trialing": "Em teste",
    "grace_period": "Período de tolerância",
    "cancelled": "Cancelado",
    "enabled": "Habilitado",
    "suspended": "Suspenso",
    "dedicated_vps": "Servidor dedicado",
    "workspace_runtime": "Ambiente do espaço",
    "workspace_container": "Contêiner do espaço",
    "unresolved": "Não resolvido",
    "missing": "Ausente",
    "unhealthy": "Com problemas",
    "status_unavailable": "Estado indisponível"
  },
  "ja": {
    "disabled": "無効",
    "owner": "所有者",
    "member": "メンバー",
    "trial": "試用",
    "personal": "Personal",
    "business": "Business",
    "none": "なし",
    "trialing": "試用中",
    "grace_period": "猶予期間",
    "cancelled": "解約済み",
    "enabled": "有効",
    "suspended": "停止中",
    "dedicated_vps": "専用サーバー",
    "workspace_runtime": "ワークスペース実行環境",
    "workspace_container": "ワークスペースコンテナー",
    "unresolved": "未解決",
    "missing": "なし",
    "unhealthy": "異常",
    "status_unavailable": "状態を取得できません"
  },
  "ko": {
    "disabled": "비활성화됨",
    "owner": "소유자",
    "member": "멤버",
    "trial": "체험",
    "personal": "Personal",
    "business": "Business",
    "none": "없음",
    "trialing": "체험 중",
    "grace_period": "유예 기간",
    "cancelled": "취소됨",
    "enabled": "활성화됨",
    "suspended": "중단됨",
    "dedicated_vps": "전용 서버",
    "workspace_runtime": "워크스페이스 실행 환경",
    "workspace_container": "워크스페이스 컨테이너",
    "unresolved": "미해결",
    "missing": "없음",
    "unhealthy": "비정상",
    "status_unavailable": "상태를 확인할 수 없음"
  }
};
export function mobileStatusSummaryLanguage(locale: AppLocale) {
  const states = mobileSecurityStateWords(locale);
  const text = mobileText(locale);
  const words: Record<string, string> = {
    ...text.systemPages.account.exportStatus,
    ...capabilityStatusCopy(locale),
    ...states.handoverStatuses,
    ...states.standingAccessStatuses,
    ...states.infrastructureStatuses,
    ...states.supportGrantStatuses,
    ...(locale === "en" ? {} : statusSummaryExtraWords[locale]),
    ready: statusPanelCopy(locale).ready,
    setting_up: text.firstConversation.guidedSetup.statuses.setup_incomplete,
    paused: text.systemPages.automations.paused,
  };
  return { locale, word: (value: string) => locale === "en"
    ? value.replace(/_/g, " ").replace(/\b\w/g, character => character.toUpperCase())
    : words[value] ?? value };
}
