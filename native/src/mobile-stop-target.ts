import type { ChatRunStatus } from "../core/index";
import { mobileRunIdIsBackground } from "./mobile-home-chat-startup";

// HPD-807: the run that holds the conversation — one waiting on the customer
// (a clarify question or an approval) or still running — when it is not the run
// the composer calls active. After a restart the app resumes the newest queued
// run, so without this Stop reached "Bist Du da?" and the run blocking it
// stayed open. `conversationRunIds` are the runs of the open conversation only.
//
// HPD-871: a scheduled job, a background delivery or a helper run never holds
// the customer's reply, so Stop never reaches one of them.
export function mobileBlockingRunId(
  statuses: Readonly<Record<string, ChatRunStatus>>,
  conversationRunIds: readonly string[],
  activeRunId: string | null,
): string | null {
  const holding = (status: ChatRunStatus | undefined) => status === "waiting_for_approval" || status === "running";
  return conversationRunIds.find((runId) =>
    runId !== activeRunId && !mobileRunIdIsBackground(runId) && holding(statuses[runId])
  ) ?? null;
}

type StatusText = string | null | undefined;

export function mobileRunStatusIsFinished(status: StatusText): status is "completed" | "cancelled" | "failed" {
  return status === "completed" || status === "cancelled" || status === "failed";
}

/**
 * The status the chat records after Stop. A run that had already finished keeps
 * its own ending; only a run the stop reached becomes cancelled.
 */
export function mobileStoppedRunStatus(status: StatusText): ChatRunStatus {
  return mobileRunStatusIsFinished(status) ? status : "cancelled";
}

export type MobileStopOutcome<Run> = { sent: boolean; run: Run };

/**
 * HPD-871: read the run before stopping it. Measured on 2026-09-24: a stop
 * reached run_Llia8JeTURv9rP at 06:29:54Z, one second after it had completed.
 * A finished run is returned as read and no stop is sent; the caller clears
 * its working state locally. If the read fails, the stop is sent as before.
 */
export async function mobileStopRunUnlessFinished<Run extends { status: StatusText }>(
  runId: string,
  transport: {
    readRun: (runId: string) => Promise<Run>;
    stopRun: (runId: string) => Promise<Run>;
  },
): Promise<MobileStopOutcome<Run>> {
  let current: Run | null = null;
  try {
    current = await transport.readRun(runId);
  } catch {
    current = null;
  }
  if (current && mobileRunStatusIsFinished(current.status)) return { sent: false, run: current };
  return { sent: true, run: await transport.stopRun(runId) };
}
