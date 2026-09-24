import type { ChatRunStatus } from "../core/index";
import { mobileRunIsForeground } from "./mobile-home-chat-startup";

/**
 * HPD-871: what an assistant text says about the run that posted it.
 *
 * Hermes posts interim texts while it works (progress, a first finding, "I am
 * checking…"). They look exactly like an answer. Measured on 2026-09-24: run
 * run_JCh4lzmu9_uIqi posted four of them between 06:49 and 06:51Z, never
 * completed, and the customer read them as the answer.
 *
 *   "working"      the run is still going: the text is interim;
 *   "stopped"      the run was stopped before it answered;
 *   "interrupted"  the run failed before it answered;
 *   null           the run completed (its last text is the answer), or the
 *                  text belongs to no run this chat is following.
 */
export type MobileInterimReplyMark = "working" | "stopped" | "interrupted";

export type MobileInterimReplyCopy = {
  interimWorking: string;
  interimStopped: string;
  interimInterrupted: string;
};

export function mobileInterimReplyMark(input: {
  message: { role: string; runId?: string | null; conversationSessionId?: string | null };
  runStatus: ChatRunStatus | null | undefined;
  activeRunId: string | null;
  openConversationId: string | null;
}): MobileInterimReplyMark | null {
  const { message } = input;
  const runId = message.runId?.trim();
  if (message.role !== "assistant" || !runId) return null;
  // A job or a delivery posts finished results, not a reply in progress.
  if (!mobileRunIsForeground({ id: runId, conversationSessionId: message.conversationSessionId ?? null }, input.openConversationId)) {
    return null;
  }
  const status = input.runStatus ?? (runId === input.activeRunId ? "running" : null);
  if (status === "running" || status === "queued" || status === "waiting_for_approval") return "working";
  if (status === "cancelled") return "stopped";
  if (status === "failed") return "interrupted";
  return null;
}

export function mobileInterimReplyLabel(mark: MobileInterimReplyMark, copy: MobileInterimReplyCopy) {
  if (mark === "working") return copy.interimWorking;
  if (mark === "stopped") return copy.interimStopped;
  return copy.interimInterrupted;
}
