import { mobileDelegatedTaskIsTerminal } from "../core/delegated-tasks-view";
import type { HermesDelegatedTaskState } from "../core/index";
import { subthreadOpened, type SubthreadOrigin } from "../core/subthread-view";

/**
 * The sub order that owns the conversation on screen, while it is still
 * running. That is the one the stop control on this screen belongs to.
 *
 * Measured on the R2 device build on 2026-08-22: the sub thread screen showed
 * no stop control at all, because the control plane reports no active run for a
 * delegated conversation (`activeRunId: null` while the card read
 * "Working · 1:34:16"). The screen has to reach the task itself.
 */
export function mobileDelegatedTaskForConversation<
  Task extends { conversationId: string; state: HermesDelegatedTaskState },
>(
  tasks: readonly Task[],
  conversationId: string | null,
  dismissedTaskIds: readonly string[] = [],
  taskIdOf: (task: Task) => string = (task) => (task as unknown as { taskId: string }).taskId,
): Task | null {
  if (!conversationId) return null;
  return tasks.find((task) =>
    task.conversationId === conversationId &&
    !mobileDelegatedTaskIsTerminal(task.state) &&
    !dismissedTaskIds.includes(taskIdOf(task))
  ) ?? null;
}

/**
 * Every card in the delegated task strip carries the same control, and a
 * running task has to be stopped before its card can honestly go away.
 */
export function mobileDelegatedTaskCloseIntent(input: { terminal: boolean }) {
  return input.terminal ? "close" as const : "stop_and_close" as const;
}

/**
 * Opening a delegated task and leaving it again are two halves of one journey,
 * and both have to survive a reply that is still streaming behind them.
 *
 * Measured on the R2 device build on 2026-08-22: with a reply running in the
 * parent conversation, the tap on a sub thread link was refused by the
 * streaming guard (`busy: true`, `opened: false`) and the screen did not move.
 * Returning from a sub thread resumes the parent's active run, so from the
 * first return onwards the guard stayed closed and the sub thread could not be
 * opened a second time.
 *
 * A streaming reply is a reason not to let a background reload race it. It is
 * not a reason to refuse a tap the customer just made.
 */
export function mobileChatSessionLoadAllowed(input: {
  busy: boolean;
  chatSessionsBusy: boolean;
  deliberate: boolean;
  loadingOlderMessages: boolean;
}) {
  if (input.chatSessionsBusy || input.loadingOlderMessages) return false;
  return input.deliberate || !input.busy;
}

/**
 * The way back out of a sub thread hangs on the remembered origin. Re-opening
 * the sub thread that is already on screen — its row stays in the delegated
 * task strip on every chat screen, including its own — used to recompute that
 * origin with the sub thread as its own parent, which is no origin at all.
 *
 * Measured on the same build: the second tap on the row of the open sub thread
 * left the sub thread's transcript on screen under the main chat's header,
 * with the menu button in place of the back button and no way back.
 *
 * Re-opening what is already open is not a new journey. It keeps the way back
 * it already has.
 */
export function mobileSubthreadOriginAfterOpen(input: {
  current: SubthreadOrigin | null;
  parentConversationId: string | null;
  subthreadConversationId: string;
  taskName: string | null;
}): SubthreadOrigin | null {
  const opened = subthreadOpened(
    input.parentConversationId,
    input.subthreadConversationId,
    input.taskName,
  );
  if (opened) return opened;
  const current = input.current;
  if (current && current.subthreadConversationId === input.subthreadConversationId.trim()) {
    return current;
  }
  return null;
}
