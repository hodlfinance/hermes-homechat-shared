import type { RankedTaskAutomationMetadata } from "./ranked-task-automations";

export interface ConfiguredRankerInvocation {
  readonly nativeJobId: string;
  readonly operation: "run";
  readonly acceptsRankingInput: false;
  readonly changesSchedule: false;
  readonly startsScanner: false;
}

export type RankedTaskRefreshReceipt =
  | Readonly<{
      status: "accepted";
      nativeJobId: string;
      executionId: string | null;
    }>
  | Readonly<{
      status: "completed";
      nativeJobId: string;
      executionId: string;
      projectionRunId: string;
      reason?: "projection_completed";
    }>
  | Readonly<{
      status: "pending";
      nativeJobId: string;
      executionId: string | null;
      projectionRunId: null;
      reason: "ranker_start_outcome_unknown" | "ranker_execution_pending";
    }>
  | Readonly<{
      status: "failed";
      nativeJobId: string;
      executionId: string | null;
      projectionRunId?: null;
      reason?: "ranker_start_failed" | "ranker_execution_failed" | "ranker_completed_without_projection";
    }>;

export type RankedTaskRefreshClientOutcome = Readonly<{
  terminal: boolean;
  successful: boolean;
  message: string;
}>;

export function rankedTaskRefreshClientOutcome(
  receipt: RankedTaskRefreshReceipt,
): RankedTaskRefreshClientOutcome {
  if (receipt.status === "completed") {
    return Object.freeze({
      terminal: true,
      successful: true,
      message: "Ranked Tasks refresh completed with a confirmed projection.",
    });
  }
  if (receipt.status === "failed") {
    return Object.freeze({
      terminal: true,
      successful: false,
      message: receipt.reason === "ranker_execution_failed"
        ? "The configured ranker finished with a confirmed failure."
        : receipt.reason === "ranker_completed_without_projection"
          // A ranker that finished and stored nothing has failed the refresh.
          // Reporting that as "still running" is the start confirmation without
          // a real run that this contract exists to prevent.
          ? "The configured ranker finished without storing a ranking."
          : "The configured ranker could not be started.",
    });
  }
  return Object.freeze({
    terminal: false,
    successful: false,
    message: "The configured ranker is still running; no terminal projection has been confirmed yet.",
  });
}

export function resolveConfiguredRankerInvocation(input: {
  readonly automations: readonly RankedTaskAutomationMetadata[];
  readonly observedNativeJobIds: readonly string[];
  readonly requestedPayload?: Readonly<Record<string, unknown>>;
}): ConfiguredRankerInvocation {
  const payloadFields = Object.keys(input.requestedPayload ?? {});
  if (payloadFields.length) {
    throw new Error(`ranked_tasks.refresh accepts no ranking input: ${payloadFields[0]}.`);
  }
  const rankers = input.automations.filter((automation) => automation.role === "ranker");
  if (rankers.length !== 1) {
    throw new Error("ranked_tasks.refresh requires exactly one configured ranker automation.");
  }
  const ranker = rankers[0]!;
  if (!ranker.nativeJobId) {
    throw new Error("The configured ranker was deleted and is not silently reinstalled.");
  }
  if (!input.observedNativeJobIds.includes(ranker.nativeJobId)) {
    throw new Error("The configured ranker native job is unavailable.");
  }
  return Object.freeze({
    nativeJobId: ranker.nativeJobId,
    operation: "run" as const,
    acceptsRankingInput: false as const,
    changesSchedule: false as const,
    startsScanner: false as const,
  });
}
