export const MOBILE_CONFIRMATION_ACTIONS = ["Approve Once", "Always Approve", "Cancel"] as const;
export type MobileConfirmationAction = (typeof MOBILE_CONFIRMATION_ACTIONS)[number];

type ConfirmationEvent = {
  runId: string;
  payload?: Record<string, unknown> | null;
};

function confirmationRequestFromEvent(event: ConfirmationEvent) {
  const payload = event.payload;
  if (payload?.requiresUserReply !== true || typeof payload.approvalId !== "string" || !payload.approvalId.trim()) {
    return null;
  }
  const raw = payload.approvalRequest;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const request = raw as Record<string, unknown>;
  if (request.command !== "/new" && request.command !== "/reset") return null;
  const choices = Array.isArray(request.choices) ? request.choices : [];
  if (choices.length !== MOBILE_CONFIRMATION_ACTIONS.length || !MOBILE_CONFIRMATION_ACTIONS.every((action, index) => choices[index] === action)) {
    return null;
  }
  return {
    title: typeof request.title === "string" ? request.title.trim() : "",
    actions: [...MOBILE_CONFIRMATION_ACTIONS],
  };
}

export function mobileNativeConfirmationView(input: {
  runId: string;
  runStatus?: string | null;
  text: string;
  events: readonly ConfirmationEvent[];
}) {
  if (input.runStatus !== "waiting_for_approval") return null;
  const request = input.events
    .filter((event) => event.runId === input.runId)
    .map(confirmationRequestFromEvent)
    .find((candidate) => candidate !== null);
  if (!request) return null;
  return {
    runId: input.runId,
    explanation: request.title || input.text.trim(),
    actions: request.actions,
  };
}

export function createMobileConfirmationDecisionGate() {
  const claimedRuns = new Set<string>();
  return {
    claim(runId: string) {
      if (claimedRuns.has(runId)) return false;
      claimedRuns.add(runId);
      return true;
    },
    release(runId: string) {
      claimedRuns.delete(runId);
    },
  };
}
