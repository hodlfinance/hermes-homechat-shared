import { mobileAssistantContentView } from "./mobile-chat-activity";

export type MobileReadAloudPhase = "off" | "ready" | "requesting" | "playing" | "error";

export type MobileReadAloudState = {
  enabled: boolean;
  error: string | null;
  lastHandledMessageId: string | null;
  phase: MobileReadAloudPhase;
  requestId: number;
};

export type MobileReadAloudRequest = {
  messageId: string;
  requestId: number;
};

export const initialMobileReadAloudState: MobileReadAloudState = Object.freeze({
  enabled: false,
  error: null,
  lastHandledMessageId: null,
  phase: "off",
  requestId: 0,
});

export function mobileReadAloudPreferenceChanged(
  state: MobileReadAloudState,
  enabled: boolean,
  latestMessageId: string | null,
): MobileReadAloudState {
  return {
    enabled,
    error: null,
    lastHandledMessageId: latestMessageId,
    phase: enabled ? "ready" : "off",
    requestId: state.requestId + 1,
  };
}

export function mobileReadAloudMessageObserved(
  state: MobileReadAloudState,
  input: { currentConversation: boolean; messageId: string },
): { request: MobileReadAloudRequest | null; state: MobileReadAloudState } {
  if (!state.enabled) {
    return {
      request: null,
      state: { ...state, lastHandledMessageId: input.messageId },
    };
  }
  if (!input.currentConversation || input.messageId === state.lastHandledMessageId) {
    return { request: null, state };
  }
  const requestId = state.requestId + 1;
  return {
    request: { messageId: input.messageId, requestId },
    state: {
      ...state,
      error: null,
      lastHandledMessageId: input.messageId,
      phase: "requesting",
      requestId,
    },
  };
}

export function mobileReadAloudPlaybackStarted(
  state: MobileReadAloudState,
  requestId: number,
): MobileReadAloudState {
  return state.enabled && state.requestId === requestId
    ? { ...state, error: null, phase: "playing" }
    : state;
}

export function mobileReadAloudRequestFinished(
  state: MobileReadAloudState,
  requestId: number,
): MobileReadAloudState {
  return state.requestId === requestId
    ? { ...state, error: null, phase: state.enabled ? "ready" : "off" }
    : state;
}

export function mobileReadAloudRequestFailed(
  state: MobileReadAloudState,
  requestId: number,
  error: string,
): MobileReadAloudState {
  return state.enabled && state.requestId === requestId
    ? { ...state, error: error.trim() || "Could not read the reply aloud.", phase: "error" }
    : state;
}

export function mobileReadAloudConversationChanged(
  state: MobileReadAloudState,
  latestMessageId: string | null,
): MobileReadAloudState {
  return {
    ...state,
    error: null,
    lastHandledMessageId: latestMessageId,
    phase: state.enabled ? "ready" : "off",
    requestId: state.requestId + 1,
  };
}

export function mobileReadAloudAccountCleared(state: MobileReadAloudState): MobileReadAloudState {
  return { ...initialMobileReadAloudState, requestId: state.requestId + 1 };
}

export function mobileReadAloudRequestIsCurrent(state: MobileReadAloudState, requestId: number) {
  return state.enabled && state.requestId === requestId && (state.phase === "requesting" || state.phase === "playing");
}

export type MobileReadAloudFileSystem = {
  deleteAsync(uri: string, options?: { idempotent?: boolean }): Promise<void>;
  writeAsStringAsync(uri: string, audioBase64: string): Promise<void>;
};

export async function writeMobileReadAloudAudio(input: {
  audioBase64: string;
  fileSystem: MobileReadAloudFileSystem;
  isCurrent: () => boolean;
  uri: string;
}): Promise<{ cleanupFailed: boolean; source: string | null }> {
  if (!input.isCurrent()) return { cleanupFailed: false, source: null };
  await input.fileSystem.writeAsStringAsync(input.uri, input.audioBase64);
  if (input.isCurrent()) return { cleanupFailed: false, source: input.uri };
  try {
    await input.fileSystem.deleteAsync(input.uri, { idempotent: true });
    return { cleanupFailed: false, source: null };
  } catch {
    return { cleanupFailed: true, source: null };
  }
}

export function mobileReadAloudSpeechText(markdown: string) {
  return mobileAssistantContentView(markdown).visibleText
    .replace(/```[\s\S]*?```/g, " code block ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_#>~|-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 1200);
}

export function mobileReadAloudFileExtension(mimeType: string) {
  const normalized = mimeType.toLowerCase();
  if (normalized.includes("ogg") || normalized.includes("opus")) return "ogg";
  if (normalized.includes("aac")) return "aac";
  if (normalized.includes("flac")) return "flac";
  if (normalized.includes("wav")) return "wav";
  return "mp3";
}
