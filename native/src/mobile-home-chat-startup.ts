export type MobileHomeChatMessageReference = {
  conversationSessionId?: string | null;
};

export type MobileHomeChatHydrationSelectionInput = {
  activeRunSessionId: string | null;
  currentSelectionId: string | null;
  currentSelectionVersion: number;
  firstSessionId: string | null;
  homeSessionId: string | null;
  selectionVersionAtStart: number;
};

export type MobileHomeChatHydrationSelection = {
  applyHydration: boolean;
  sessionId: string | null;
};

export type MobileHomeChatActiveRunReference = {
  conversationSessionId?: string | null;
  createdAt: string;
  id: string;
  sourceExecutionId?: string | null;
  sourceJobId?: string | null;
  startedAt?: string | null;
  status: "queued" | "running" | "waiting_for_approval" | "completed" | "cancelled" | "failed";
};

export type MobileRunOriginReference = {
  id: string;
  sourceExecutionId?: string | null;
  sourceJobId?: string | null;
};

// HPD-871: runs the customer did not start. The plane (hey-hermes
// apps/api/src/store.ts) opens them in the customer's conversation:
//   run_job_<hash>        a scheduled job execution, carries sourceJobId and
//                         sourceExecutionId;
//   run_delivery_<hash>   a background result posted into the chat, carries
//                         no source field;
//   run_delegated_<hash>  a helper Hermes started for a sub order, carries no
//                         source field.
// The run payload of GET /hermes/runs has no kind or initiator field, so the
// job's source fields decide first and the id prefix covers the two kinds that
// carry nothing else.
const backgroundRunIdPrefixes = ["run_job_", "run_delivery_", "run_delegated_"] as const;

function presentText(value: unknown) {
  return typeof value === "string" && value.trim().length > 0;
}

export function mobileRunIdIsBackground(runId: string | null | undefined) {
  return Boolean(runId && backgroundRunIdPrefixes.some((prefix) => runId.startsWith(prefix)));
}

/**
 * Whether the customer started this run from the composer. Only such a run may
 * own the chat's Working state, its stop button and the queue behind it.
 */
export function mobileRunIsForeground(run: MobileRunOriginReference) {
  const raw = run as MobileRunOriginReference & { source_job_id?: unknown; source_execution_id?: unknown };
  if (presentText(run.sourceJobId) || presentText(raw.source_job_id)) return false;
  if (presentText(run.sourceExecutionId) || presentText(raw.source_execution_id)) return false;
  return !mobileRunIdIsBackground(run.id);
}

export type MobileHomeChatActiveRunRecovery<Run extends MobileHomeChatActiveRunReference> = {
  primaryRun: Run | null;
  queuedFollowUps: Run[];
};

export type MobileHomeChatTimingSummary = {
  averageMs: number;
  count: number;
  maximumMs: number;
  medianMs: number;
  minimumMs: number;
};

export type MobileHomeChatSingleFlight = {
  clear(): void;
  run(task: () => Promise<void>): Promise<void>;
  runAfterCurrent(task: () => Promise<void>): Promise<void>;
};

export function mobileHomeChatSnapshotSessionId(messages: MobileHomeChatMessageReference[]) {
  for (const message of messages) {
    const sessionId = message.conversationSessionId?.trim();
    if (sessionId) return sessionId;
  }
  return null;
}

export function mobileHomeChatActiveRunRecovery<Run extends MobileHomeChatActiveRunReference>(
  runs: Run[],
  preferredConversationSessionId?: string | null,
): MobileHomeChatActiveRunRecovery<Run> {
  const preferredConversationId = preferredConversationSessionId?.trim() || null;
  // HPD-871: a job, delivery or helper run in the open chat is not the reply
  // the customer is waiting for. Recovering it kept Working and Stop on after
  // his own reply had finished, and labelled his next question queued.
  const foregroundRuns = runs.filter(mobileRunIsForeground);
  const preferredRuns = preferredConversationId
    ? foregroundRuns.filter((run) => run.conversationSessionId === preferredConversationId)
    : [];
  // Once the customer has a selected conversation, an active run elsewhere is
  // background work. Falling back to it changes foreground ownership and makes
  // an immediately executable message look queued behind the wrong run.
  const candidates = [...(preferredConversationId ? preferredRuns : foregroundRuns)].sort((left, right) => left.createdAt.localeCompare(right.createdAt) || left.id.localeCompare(right.id));
  const primaryRun = candidates.find((run) =>
    run.status === "running" || run.status === "waiting_for_approval"
  ) ?? candidates.find((run) => run.status === "queued") ?? null;
  if (!primaryRun || !primaryRun.conversationSessionId) {
    return { primaryRun, queuedFollowUps: [] };
  }
  const queuedFollowUps = candidates
    .filter((run) =>
      run.id !== primaryRun.id &&
      run.status === "queued" &&
      run.startedAt === null &&
      run.conversationSessionId === primaryRun.conversationSessionId &&
      Date.parse(run.createdAt) >= Date.parse(primaryRun.createdAt)
    )
    .sort((left, right) => left.createdAt.localeCompare(right.createdAt) || left.id.localeCompare(right.id));
  return { primaryRun, queuedFollowUps };
}

export function mobileHomeChatHydrationSelection(
  input: MobileHomeChatHydrationSelectionInput,
): MobileHomeChatHydrationSelection {
  if (input.currentSelectionVersion !== input.selectionVersionAtStart) {
    return {
      applyHydration: false,
      sessionId: input.currentSelectionId,
    };
  }

  return {
    applyHydration: true,
    sessionId:
      input.currentSelectionId ||
      input.activeRunSessionId ||
      input.homeSessionId ||
      input.firstSessionId,
  };
}

export function createMobileHomeChatSingleFlight(): MobileHomeChatSingleFlight {
  let current: Promise<void> | null = null;
  let queued: Promise<void> | null = null;
  let generation = 0;

  const run = (task: () => Promise<void>) => {
    if (current) return current;
    const started = Promise.resolve().then(task);
    const tracked = started.finally(() => {
      if (current === tracked) current = null;
    });
    current = tracked;
    return tracked;
  };

  return {
    clear() {
      generation += 1;
      current = null;
      queued = null;
    },
    run,
    runAfterCurrent(task) {
      if (!current) return run(task);
      if (queued) return queued;
      const scheduledGeneration = generation;
      const waitingFor = current;
      const scheduled = waitingFor.catch(() => undefined).then(async () => {
        if (generation !== scheduledGeneration) return;
        await run(task);
      }).finally(() => {
        if (queued === scheduled) queued = null;
      });
      queued = scheduled;
      return scheduled;
    },
  };
}

export function summarizeMobileHomeChatTimings(durationsMs: number[]): MobileHomeChatTimingSummary | null {
  if (!durationsMs.length || durationsMs.some((duration) => !Number.isFinite(duration) || duration < 0)) {
    return null;
  }

  const ordered = [...durationsMs].sort((left, right) => left - right);
  const midpoint = Math.floor(ordered.length / 2);
  const medianMs = ordered.length % 2
    ? ordered[midpoint]!
    : (ordered[midpoint - 1]! + ordered[midpoint]!) / 2;
  const totalMs = ordered.reduce((total, duration) => total + duration, 0);

  return {
    averageMs: totalMs / ordered.length,
    count: ordered.length,
    maximumMs: ordered[ordered.length - 1]!,
    medianMs,
    minimumMs: ordered[0]!,
  };
}
