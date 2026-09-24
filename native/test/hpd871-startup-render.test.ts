import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test, { mock } from "node:test";

import { act, createElement } from "react";
import { create, type ReactTestInstance, type ReactTestRenderer } from "react-test-renderer";

import { createApiClient } from "../core/api-client";
import { bundleNativeSurface } from "./helpers/bundle-native-surface";
import { inertNodeRef } from "./helpers/native-module-stubs";

// HPD-871 startup hotfix, proven at render level. PR #71 removed
// mobileHomeChatSnapshotSessionId from mobile-home-chat-startup.ts while
// surface.tsx still called it inside refresh(), right after GET
// /snapshot/startup and before the snapshot is stored. On the device (Metro)
// the missing import is undefined, so every startup refresh threw "is not a
// function", the snapshot never landed, and the 2.5 s startup retry asked for
// /snapshot/startup forever: the app never opened the chat (HODL Builds 56/57).
//
// This test renders the real surface, bundled the way Metro bundles it, with a
// restored synthetic session and a ready Hermes API, and drives the startup
// retry with a mocked interval clock. No real account, token or network.

const SYNTHETIC_TOKEN = "synthetic-token-871";
const API_BASE = "https://heyhermes.app/api";
const NOW = "2026-09-24T08:00:00.000Z";
const ACCOUNT_ID = "acct_synthetic_871";
const WORKSPACE_ID = "ws_synthetic_871";
const HOME_SESSION_ID = "session_home_871";

const entitlement = {
  accountId: ACCOUNT_ID,
  workspaceId: WORKSPACE_ID,
  status: "active",
  plan: "personal",
  usagePoolPlan: "personal",
  comped: true,
  provider: "manual",
  revenueCatCustomerId: null,
  revenueCatEntitlementId: null,
  trialEndsAt: null,
  renewsAt: null,
  gracePeriodEndsAt: null,
  cancelledAt: null,
  expiresAt: null,
  storeProductId: null,
  updatedAt: NOW,
};

const recentMessages = [
  {
    id: "msg_871_1",
    runId: "run_871_1",
    conversationSessionId: HOME_SESSION_ID,
    role: "assistant",
    content: "Welcome back.",
    createdAt: NOW,
  },
];

const homeSession = {
  id: HOME_SESSION_ID,
  workspaceId: WORKSPACE_ID,
  title: "Home",
  role: "home",
  status: "active",
  messageCount: recentMessages.length,
  createdAt: NOW,
  updatedAt: NOW,
  lastMessageAt: NOW,
};

const startupSnapshotBody = {
  me: { id: ACCOUNT_ID, name: "Synthetic 871", email: "synthetic-871@example.invalid", preferredLocale: "en", aiMode: "managed", createdAt: NOW },
  accounts: [{
    id: ACCOUNT_ID, name: "Synthetic 871", email: "synthetic-871@example.invalid", role: "owner", status: "active",
    workspaceId: WORKSPACE_ID, preferredLocale: "en", createdAt: NOW, lastLoginAt: NOW,
  }],
  runtime: {},
  workspace: { id: WORKSPACE_ID, accountId: ACCOUNT_ID, name: "Synthetic workspace" },
  workspaceRuntime: {},
  workspaceStyle: {},
  aiConnection: { label: "Included models" },
  entitlement,
  usage: {},
  usageLimits: {},
  subscription: {
    accountId: ACCOUNT_ID,
    workspaceId: WORKSPACE_ID,
    providerMode: "manual",
    livePaymentsEnabled: false,
    revenueCatWebhookSigningConfigured: false,
    fakeAdapterActive: false,
    entitlement,
    workspaceAccess: {},
    lifecycle: { runtimeAccess: "enabled" },
    promotionalGrant: null,
    lastWebhookEvent: null,
  },
  providerStatus: {
    workspaceId: WORKSPACE_ID,
    activeProviderId: "openrouter_managed",
    providers: [{ id: "openrouter_managed", label: "Included models", state: "active", configured: true, live: true, status: "Ready" }],
    credentialRules: [],
  },
  chatRoutePreference: "included_ai",
  server: {},
  runtimeReadiness: {
    state: "ready", ready: true, retryable: false, canChat: true, canUseVoice: true, canUseJobs: true,
    statusLabel: "Ready", message: "Ready",
  },
  tasks: [],
  integrations: [],
  bookmarks: [],
  apiKeys: {},
  securityAccess: {},
  notifications: [],
  notificationPreferences: {},
  emailDeliveries: [],
  agentMailbox: {},
  agentMailboxMessages: [],
  backupJobs: [],
  restoreJobs: [],
  auditLogs: [],
  recentMessages,
};

const statusTruthBody = {
  schemaVersion: "heyhermes.workspace-status-truth/v1",
  generatedAt: NOW,
  account: {
    availability: "available", observedAt: NOW, id: ACCOUNT_ID, name: "Synthetic 871",
    email: "synthetic-871@example.invalid", role: "owner", status: "active", createdAt: NOW, lastLoginAt: NOW,
  },
  plan: {
    availability: "available", observedAt: NOW, status: "active", plan: "personal", usagePoolPlan: "personal",
    comped: true, provider: "manual", trialEndsAt: null, renewsAt: null, gracePeriodEndsAt: null, cancelledAt: null, expiresAt: null,
  },
  aiAccess: {
    availability: "available", includedAvailability: "available", observedAt: NOW, selectedRoute: "included_ai",
    activeProviderId: "openrouter_managed", routingMode: "managed", selectedModelId: null, selectedModelName: null,
    managedModelName: null, modelChoices: [], remainingIncludedPercent: 100, cycleResetAt: null,
    providers: [{ id: "openrouter_managed", state: "active", configured: true, live: true, status: "Ready" }],
  },
  server: {
    availability: "available", observedAt: NOW, id: "srv_synthetic_871", kind: "workspace_runtime", provider: null,
    state: "ready", readiness: "ready", ready: true, statusLabel: "Ready", message: "Ready",
    region: null, serverType: null, backupsEnabled: null,
  },
  security: {
    availability: "available", observedAt: NOW, runtimeAccess: "enabled", adminHandoverStatus: null,
    standingAccessStatus: null, activeSupportGrantCount: 0, infrastructureStatus: "green", latestAuditSealedAt: null,
  },
  capabilities: { availability: "available", observedAt: NOW, hostingMode: "shared_pool", runtimeAccess: "enabled", items: [] },
};

type Calls = Map<string, number>;
const bump = (calls: Calls, key: string) => calls.set(key, (calls.get(key) ?? 0) + 1);

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

/** The mocked Hermes API. Anything not listed answers with a benign empty value. */
function createFakeHermes() {
  const api: Calls = new Map();
  const canonical: Calls = new Map();
  const unmatched = new Set<string>();

  const fetchImpl = (async (input: string | URL | Request) => {
    const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
    assert.ok(url.href.startsWith(API_BASE), `unexpected request outside the mocked API: ${url.origin}`);
    const path = url.pathname.slice(new URL(API_BASE).pathname.length);
    bump(api, path);
    switch (path) {
      case "/workspace/status-truth": return json(statusTruthBody);
      case "/snapshot/startup": return json(startupSnapshotBody);
      case "/snapshot": return json(startupSnapshotBody);
      case "/approvals": return json([]);
      case "/workspace/model-options": return json(null);
      case "/ai-connection/claude": return json(null);
      default:
        unmatched.add(path);
        return json(null);
    }
  }) as typeof fetch;

  const canonicalResults: Record<string, unknown> = {
    activeRuns: [],
    conversationSessions: [homeSession],
    messages: { messages: recentMessages, nextBefore: null },
    delegatedTasks: [],
  };
  const canonicalClient = new Proxy({}, {
    get: (_target, key) => {
      if (typeof key !== "string" || key === "then") return undefined;
      return async () => {
        bump(canonical, key);
        return key in canonicalResults ? structuredClone(canonicalResults[key]) : null;
      };
    },
  });

  return {
    api,
    canonical,
    unmatched,
    fetchImpl,
    createApiClient: (options: { baseUrl: string; token?: string }) => createApiClient({ ...options, fetchImpl }),
    createCanonicalClient: () => canonicalClient,
  };
}

/** Every method resolves null; the same function object each time (hooks compare identities). */
function inert<T extends object>(): T {
  const methods = new Map<string, () => Promise<null>>();
  return new Proxy({}, {
    get: (_target, key) => {
      if (typeof key !== "string" || key === "then") return undefined;
      if (!methods.has(key)) methods.set(key, async () => null);
      return methods.get(key);
    },
  }) as T;
}

function createHost(hermes: ReturnType<typeof createFakeHermes>) {
  const sessionReads: string[] = [];
  const subscription = { remove: () => undefined };
  // Hook results must be stable across renders, as the real Expo hooks are.
  const googleRequest = [null, null, async () => undefined] as const;
  const audioRecorder = {
    getStatus: () => ({ url: null }), uri: null,
    prepareToRecordAsync: async () => undefined, record: () => undefined, stop: async () => undefined,
  };
  const audioRecorderState = { durationMillis: 0, isRecording: false };
  return {
    sessionReads,
    host: {
      apiBaseUrl: API_BASE,
      storageNamespace: "hpd871-render-test",
      identity: {
        icon: { uri: "synthetic-icon" },
        copy: {
          productName: "Hey Hermes",
          tagline: "Synthetic",
          trialCta: "Start",
          provisioningTitle: "Preparing",
          chatPlaceholder: "Message Hermes",
        },
      },
      session: {
        mode: "standalone",
        read: async () => {
          sessionReads.push("read");
          return { token: SYNTHETIC_TOKEN, storage: "secure" };
        },
        persist: async () => "secure",
        clear: async () => undefined,
        renderUnavailable: () => null,
      },
      policy: { preinstalledRanker: false, preinstalledEmailScanner: false },
      transport: {
        createApiClient: hermes.createApiClient,
        createCanonicalClient: hermes.createCanonicalClient,
        createSupportClient: () => inert(),
        createAnonymousSupportClient: () => inert(),
        firstConversation: async () => null,
        guidedSetup: async () => null,
        listPendingFinanceActionApprovals: async () => [],
        confirmFinanceActionApproval: async () => undefined,
        cancelFinanceActionApproval: async () => undefined,
        reportLatency: async () => undefined,
        fetchStream: hermes.fetchImpl,
      },
      platform: {
        StatusBar: () => null,
        SecureStore: {
          isAvailableAsync: async () => true,
          getItemAsync: async () => null,
          setItemAsync: async () => undefined,
          deleteItemAsync: async () => undefined,
        },
        Constants: { nativeAppVersion: "1.0.0", nativeBuildVersion: "58", statusBarHeight: 0, expoConfig: null, easConfig: null },
        Crypto: {
          randomUUID,
          CryptoDigestAlgorithm: { SHA256: "SHA-256" },
          CryptoEncoding: { BASE64: "base64" },
          digestStringAsync: async () => "c3ludGhldGlj",
        },
        Notifications: {
          setNotificationHandler: () => undefined,
          addNotificationReceivedListener: () => subscription,
          addNotificationResponseReceivedListener: () => subscription,
          setNotificationChannelAsync: async () => undefined,
          AndroidImportance: { MAX: 5 },
          getPermissionsAsync: async () => ({ granted: false, status: "undetermined" }),
          requestPermissionsAsync: async () => ({ granted: false, status: "denied" }),
          getExpoPushTokenAsync: async () => ({ data: "" }),
          getLastNotificationResponseAsync: async () => null,
        },
        DocumentPicker: { getDocumentAsync: async () => ({ canceled: true, assets: [] }) },
        ImagePicker: {
          launchImageLibraryAsync: async () => ({ canceled: true, assets: [] }),
          requestCameraPermissionsAsync: async () => ({ granted: false }),
          launchCameraAsync: async () => ({ canceled: true, assets: [] }),
          UIImagePickerPreferredAssetRepresentationMode: { Compatible: "compatible" },
        },
        AppleAuthentication: {
          isAvailableAsync: async () => false,
          signInAsync: async () => ({ user: "", identityToken: null }),
          getCredentialStateAsync: async () => 0,
          AppleAuthenticationScope: { FULL_NAME: 0, EMAIL: 1 },
          AppleAuthenticationCredentialState: { AUTHORIZED: 1 },
          AppleAuthenticationButton: () => null,
          AppleAuthenticationButtonStyle: { BLACK: 0 },
          AppleAuthenticationButtonType: { CONTINUE: 0, SIGN_UP: 1 },
        },
        Google: { useIdTokenAuthRequest: () => googleRequest },
        WebBrowser: {
          maybeCompleteAuthSession: () => undefined,
          openBrowserAsync: async () => undefined,
          openAuthSessionAsync: async () => ({ type: "cancel" }),
        },
        createAudioPlayer: () => ({
          play: () => undefined, pause: () => undefined, replace: () => undefined,
          addListener: () => subscription,
        }),
        RecordingPresets: { HIGH_QUALITY: {} },
        requestRecordingPermissionsAsync: async () => ({ granted: false }),
        setAudioModeAsync: async () => undefined,
        useAudioRecorder: () => audioRecorder,
        useAudioRecorderState: () => audioRecorderState,
        FileSystem: {
          cacheDirectory: "file:///synthetic-cache/",
          documentDirectory: "file:///synthetic-documents/",
          EncodingType: { Base64: "base64" },
          readAsStringAsync: async () => "",
          writeAsStringAsync: async () => undefined,
          deleteAsync: async () => undefined,
          readDirectoryAsync: async () => [],
          getInfoAsync: async () => ({ exists: false }),
        },
      },
      purchases: {
        mobilePurchasesController: inert(),
        bindMobilePurchasesAccount: async () => undefined,
        isMobilePurchaseCancelled: () => false,
        mobilePurchasesConfiguredForBuild: () => false,
      },
    },
  };
}

function textOf(node: ReactTestInstance | string): string {
  if (typeof node === "string") return node;
  return node.children.map(textOf).join(" ");
}

/** Lets fetch promises, effects and requestAnimationFrame callbacks settle. */
async function settle(rounds = 6) {
  for (let round = 0; round < rounds; round += 1) {
    await act(async () => {
      await new Promise<void>((resolve) => setImmediate(resolve));
      await new Promise<void>((resolve) => setImmediate(resolve));
    });
  }
}

test("HPD-871: a restored session stores the startup snapshot once and opens the Home chat", async (t) => {
  const globals = globalThis as Record<string, unknown>;
  const previousFetch = globals.fetch;
  globals.IS_REACT_ACT_ENVIRONMENT = true;
  globals.requestAnimationFrame ??= (callback: (time: number) => void) => setImmediate(() => callback(Date.now()));
  globals.cancelAnimationFrame ??= (handle: ReturnType<typeof setImmediate>) => clearImmediate(handle);
  // Nothing may reach a real network.
  globals.fetch = async (input: unknown) => {
    throw new Error(`unexpected global fetch: ${String(input).slice(0, 60)}`);
  };
  // React's own warnings (react-test-renderer is deprecated) stay quiet; set
  // HPD871_DEBUG=1 to see the first few.
  let consoleErrors = 0;
  const consoleError = mock.method(console, "error", (...args: unknown[]) => {
    if (process.env.HPD871_DEBUG && consoleErrors++ < 5) {
      process.stderr.write(`[console.error] ${args.map(String).join(" ").slice(0, 600)}\n`);
    }
  });
  t.after(() => {
    globals.fetch = previousFetch;
    consoleError.mock.restore();
  });

  const { createNativeR8Surface } = await bundleNativeSurface();
  const hermes = createFakeHermes();
  const { host, sessionReads } = createHost(hermes);
  const Surface = createNativeR8Surface(host);

  // Only the interval clock is simulated: the startup retry is a 2.5 s
  // setInterval, and ticking it is what separates "stored once" from "retried
  // forever".
  mock.timers.enable({ apis: ["setInterval"] });
  t.after(() => mock.timers.reset());

  let renderer: ReactTestRenderer | undefined;
  await act(async () => {
    renderer = create(createElement(Surface), { createNodeMock: inertNodeRef });
  });
  await settle();

  const startupRequests = () => hermes.api.get("/snapshot/startup") ?? 0;
  const requestsByTick: number[] = [startupRequests()];
  for (let tick = 0; tick < 4; tick += 1) {
    await act(async () => {
      mock.timers.tick(2500);
    });
    await settle();
    requestsByTick.push(startupRequests());
  }

  const root = renderer!.root;
  const screenText = textOf(root).replace(/\s+/g, " ");
  const composer = root.findAll((node) => node.type === "TextInput" && node.props.accessibilityLabel === "Message");
  const observed = {
    sessionRestoredFromStore: sessionReads.length > 0,
    startupSnapshotRequestsAfterEachRetryTick: requestsByTick,
    refreshThrewNotAFunction: /is not a function/.test(screenText),
    stillOnOpeningScreen: /Opening Hey Hermes/.test(screenText),
    homeChatComposerRendered: composer.length === 1,
    postSnapshotPhaseRan: (hermes.canonical.get("activeRuns") ?? 0) > 0 && (hermes.api.get("/snapshot") ?? 0) > 0,
  };

  await act(async () => renderer!.unmount());
  t.diagnostic(`observed: ${JSON.stringify(observed)}`);
  t.diagnostic(`API requests: ${JSON.stringify(Object.fromEntries(hermes.api))}`);
  t.diagnostic(`canonical calls: ${JSON.stringify(Object.fromEntries(hermes.canonical))}`);

  assert.deepEqual(observed, {
    sessionRestoredFromStore: true,
    // One startup snapshot; the 2.5 s retry stops once it is stored.
    startupSnapshotRequestsAfterEachRetryTick: [1, 1, 1, 1, 1],
    refreshThrewNotAFunction: false,
    stillOnOpeningScreen: false,
    homeChatComposerRendered: true,
    postSnapshotPhaseRan: true,
  }, `rendered text: ${screenText.slice(0, 400)}`);
});
