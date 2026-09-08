import type { ChatMessage } from "../core/index";

export type PageStarterScope = Readonly<{ workspaceId: string; conversationId: string }>;
export type PageStarterState = Readonly<{
  scope: PageStarterScope;
  armed: boolean;
  createdAt: string;
  afterMessageId: string | null;
}> | null;
export function pageStarterMatches(state: PageStarterState, scope: PageStarterScope) {
  return Boolean(state && state.scope.workspaceId === scope.workspaceId && state.scope.conversationId === scope.conversationId);
}
export function openPageStarter(state: PageStarterState, scope: PageStarterScope, hasDraft: boolean,
  afterMessageId: string | null = null, createdAt = new Date().toISOString()): PageStarterState {
  // Reopening must neither duplicate the question nor reinterpret its reply as an old draft.
  if (state && pageStarterMatches(state, scope)) return state.armed || hasDraft ? state : { ...state, armed: true };
  return { scope, armed: !hasDraft, createdAt, afterMessageId };
}
export function consumePageStarter(state: PageStarterState): PageStarterState {
  // Keep the question above its answer after consuming the one-shot request context.
  return state ? { ...state, armed: false } : null;
}
export function pageStarterTranscript(messages: readonly ChatMessage[], state: PageStarterState,
  scope: PageStarterScope, question: string): ChatMessage[] {
  if (!state || !pageStarterMatches(state, scope)) return [...messages];
  // B87-F620: Justus explicitly requested this static product message in the normal
  // transcript. It never enters stored history or starts a Hermes/model run.
  const id = `menu-page-entry:${state.createdAt}`;
  const prompt: ChatMessage = { id, runId: id, conversationSessionId: scope.conversationId,
    role: "assistant", content: question, createdAt: state.createdAt };
  const result = messages.filter((message) => message.id !== id);
  const anchor = state.afterMessageId ? result.findIndex((message) => message.id === state.afterMessageId) : -1;
  const later = result.findIndex((message) => message.createdAt >= state.createdAt);
  result.splice(anchor >= 0 ? anchor + 1 : later >= 0 ? later : result.length, 0, prompt);
  return result;
}
export function pageStarterPayload(state: PageStarterState, scope: PageStarterScope, visibleContext: string, userText: string) {
  return state?.armed && pageStarterMatches(state, scope) ? `${visibleContext}\n\n${userText}` : userText;
}
export function pageStarterAfterNavigation(state: PageStarterState, scope: PageStarterScope, inChat: boolean): PageStarterState {
  return inChat && pageStarterMatches(state, scope) ? state : null;
}
