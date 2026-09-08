import {
  completeHomechatVoiceNote,
  composeHomechatVoiceMessage,
  createHomechatClientController,
  createHomechatClientState,
  createHomechatComposerController,
  createHomechatConversationController,
  createHomechatEventStreamDecoder,
  createHomechatHistoryController,
  createHomechatHistoryState,
  createHomechatJobController,
  createHomechatKeyedProductSlots,
  createHomechatPagedState,
  createHomechatRunController,
  createHomechatVoiceController,
  formatHomechatElapsedSeconds,
  homechatActionView as sharedHomechatActionView,
  homechatComposerView as sharedHomechatComposerView,
  homechatRunStatusLabel as sharedHomechatRunStatusLabel,
  homechatProductSlotsForMessage,
  homechatTranscriptMessages,
  homechatVoiceTranscriptError,
  isSharedHomechatRunControllerError,
  isTerminalHomechatEvent,
  isUserVisibleHomechatEvent,
  latestHomechatMessage,
  mergeHomechatHistoryItems,
  mergeHomechatMessages,
  mergeHomechatProductSlots,
  normalizeHomechatRunEvent,
  normalizeHomechatRunStatus,
  parseHomechatEventStream,
  putHomechatProductSlots,
  reconcileHomechatFinalAnswer,
  reduceHomechatClientState,
  selectVoiceRecordingMimeType,
  voiceNoticeIsError as sharedVoiceNoticeIsError,
  type SharedHomechatActionCopy,
  type SharedHomechatActionPhase,
  type SharedHomechatActionView,
  type SharedHomechatComposerCopy,
  type SharedHomechatComposerView,
  type SharedHomechatCanonicalEvent,
  type SharedHomechatClientControllerOptions,
  type SharedHomechatClientAction,
  type SharedHomechatClientState,
  type SharedHomechatHistoryItem,
  type SharedHomechatHistoryState,
  type SharedHomechatKeyedProductSlots,
  type SharedHomechatPagedState,
  type SharedHomechatProductRenderers,
  type SharedHomechatProductSlots,
  type SharedHomechatRunControllerErrorCode,
  type SharedHomechatFollowOptions,
  type SharedHomechatRunTransport,
  type SharedHomechatVoiceController,
  type SharedHomechatVoiceState,
} from "@hodlfinance/hermes-homechat-shared/core";
import type { ChatMessage, ChatRunEvent, ChatRunStatus, ConversationSession } from "./types";

export type HomechatActionPhase = SharedHomechatActionPhase;
export type HomechatActionView = SharedHomechatActionView;
export type HomechatActionCopy = SharedHomechatActionCopy;
export type HomechatComposerCopy = SharedHomechatComposerCopy;
export type HomechatComposerView = SharedHomechatComposerView;
export type {
  SharedHomechatCanonicalEvent,
  SharedHomechatClientControllerOptions,
  SharedHomechatClientAction,
  SharedHomechatClientState,
  SharedHomechatHistoryItem,
  SharedHomechatHistoryState,
  SharedHomechatKeyedProductSlots,
  SharedHomechatPagedState,
  SharedHomechatProductRenderers,
  SharedHomechatProductSlots,
  SharedHomechatRunControllerErrorCode,
  SharedHomechatFollowOptions,
  SharedHomechatRunTransport,
  SharedHomechatVoiceController,
  SharedHomechatVoiceState,
};

export function visibleChatMessagesForSession(
  messages: ChatMessage[],
  activeConversationSessionId: string | null,
): ChatMessage[] {
  return homechatTranscriptMessages(messages, {
    conversationSessionId: activeConversationSessionId,
    includeEmpty: true,
    roles: ["user", "assistant", "tool"],
  });
}

export function selectConversationSessionId(input: {
  activeConversationSessionId: string | null;
  activeRunSessionId: string | null;
  sessions: ConversationSession[];
}): string | null {
  if (input.activeConversationSessionId) return input.activeConversationSessionId;
  if (input.activeRunSessionId) return input.activeRunSessionId;
  return input.sessions.find((session) => session.role === "home")?.id ?? input.sessions[0]?.id ?? null;
}

export function chatMessagesForSelectedSession(input: {
  selectedSessionId: string | null;
  loadedMessages: ChatMessage[] | null;
  snapshotRecentMessages: ChatMessage[];
}): ChatMessage[] {
  return input.selectedSessionId ? input.loadedMessages ?? [] : input.snapshotRecentMessages;
}

export function upsertChatSession(
  sessions: ConversationSession[],
  session: ConversationSession,
): ConversationSession[] {
  return [session, ...sessions.filter((item) => item.id !== session.id)];
}

export function preserveSelectedChatSession(
  nextSessions: ConversationSession[],
  currentSessions: ConversationSession[],
  selectedSessionId: string | null,
): ConversationSession[] {
  if (!selectedSessionId || nextSessions.some((session) => session.id === selectedSessionId)) return nextSessions;
  const selectedSession = currentSessions.find((session) => session.id === selectedSessionId);
  return selectedSession ? upsertChatSession(nextSessions, selectedSession) : nextSessions;
}

export function shouldApplyRefreshSelection(input: {
  selectedSessionId: string | null;
  latestActiveConversationSessionId: string | null;
}): boolean {
  return !input.latestActiveConversationSessionId || input.latestActiveConversationSessionId === input.selectedSessionId;
}

/**
 * What a run is called while it happens. The app and the web client had two
 * vocabularies for the same six states — the app said "Hermes is typing" where
 * the web said "Hermes is thinking...", and "Reply stopped" where the web said
 * "That message was stopped." One customer using both clients was told two
 * different things about one run.
 *
 * These are the app's words, which are the ones that were accepted.
 */
export const heyChatRunStatusLabels = Object.freeze({
  queued: "Hermes is getting ready",
  running: "Hermes is typing",
  waiting: "Waiting for you",
  completed: "Reply ready",
  cancelled: "Reply stopped",
  failed: "Reply needs attention",
  unknown: "Hermes is working",
} as const);

export function homechatRunStatusLabel(status: string | null | undefined): string {
  return sharedHomechatRunStatusLabel(status, { ...heyChatRunStatusLabels });
}

export function homechatActionView(input: {
  copy?: HomechatActionCopy;
  replying?: boolean;
  startedAt: number | string | null | undefined;
  status: ChatRunStatus | string | null | undefined;
  tick?: number;
}): HomechatActionView {
  const view = sharedHomechatActionView({
    ...input,
    copy: {
      writingDetail: "Streaming the response into this chat.",
      ...input.copy,
    },
  });
  return (
    view ?? {
      label: "Working",
      detail: "Hermes is working...",
      elapsed: "",
      phase: "working",
    }
  );
}

export const voiceNoticeIsError = sharedVoiceNoticeIsError;
export const homechatComposerView = sharedHomechatComposerView;
export {
  completeHomechatVoiceNote,
  composeHomechatVoiceMessage,
  createHomechatClientController,
  createHomechatClientState,
  createHomechatComposerController,
  createHomechatConversationController,
  createHomechatEventStreamDecoder,
  createHomechatHistoryController,
  createHomechatHistoryState,
  createHomechatJobController,
  createHomechatKeyedProductSlots,
  createHomechatPagedState,
  createHomechatRunController,
  createHomechatVoiceController,
  formatHomechatElapsedSeconds,
  homechatTranscriptMessages,
  homechatProductSlotsForMessage,
  homechatVoiceTranscriptError,
  isSharedHomechatRunControllerError,
  isTerminalHomechatEvent,
  isUserVisibleHomechatEvent,
  latestHomechatMessage,
  mergeHomechatHistoryItems,
  mergeHomechatMessages,
  mergeHomechatProductSlots,
  normalizeHomechatRunEvent,
  normalizeHomechatRunStatus,
  parseHomechatEventStream,
  putHomechatProductSlots,
  reconcileHomechatFinalAnswer,
  reduceHomechatClientState,
  selectVoiceRecordingMimeType,
};

function eventPayloadText(event: ChatRunEvent, key: string): string {
  const value = event.payload?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

export function isHeartbeatSoulCaptureActivityEvent(event: ChatRunEvent): boolean {
  if (event.type !== "status") return false;
  return eventPayloadText(event, "action").toLowerCase() === "capability.heartbeat_soul.captured";
}
