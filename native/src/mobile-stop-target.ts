import type { ChatRunStatus } from "../core/index";

// HPD-807: the run that holds the conversation — one waiting on the customer
// (a clarify question or an approval) or still running — when it is not the run
// the composer calls active. After a restart the app resumes the newest queued
// run, so without this Stop reached "Bist Du da?" and the run blocking it
// stayed open. `conversationRunIds` are the runs of the open conversation only.
export function mobileBlockingRunId(
  statuses: Readonly<Record<string, ChatRunStatus>>,
  conversationRunIds: readonly string[],
  activeRunId: string | null,
): string | null {
  const holding = (status: ChatRunStatus | undefined) => status === "waiting_for_approval" || status === "running";
  return conversationRunIds.find((runId) => runId !== activeRunId && holding(statuses[runId])) ?? null;
}
