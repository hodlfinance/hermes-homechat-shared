import {
  heyAssistantContentView,
  heyRunStatusFromTerminalEvent,
  type ChatRunEvent,
  type ChatRunStatus,
  type HeyAssistantContentView,
  type HeyRunActivityDetail,
  type HeyRunActivityStateKey,
} from "../core/index";

export type MobileActivityTone = "working" | "done" | "error" | "neutral";

export type MobileActivitySymbol = "spinner" | "glyph";

// Whether something moves is decided here, as data, so it can be tested
// without drawing anything. "working" is the only run state that is still in
// progress; Reduced Motion overrides it because HPD-120 requires it and Apple
// checks it.
export function mobileActivitySymbol(input: {
  tone: MobileActivityTone;
  reduceMotion: boolean | null;
}): MobileActivitySymbol {
  if (input.tone !== "working") return "glyph";
  return input.reduceMotion === false ? "spinner" : "glyph";
}

/**
 * `labelKey` names one of the fixed states so the surface can say it in the
 * customer's language. A summary built from a tool's own wording has no key,
 * because that text is the tool's, not ours.
 *
 * The six states, the assistant-output projection and the terminal-status rule
 * live in `@hermes/core`'s `chat-run-activity` since HPD-350, so the app and
 * the web say one thing rather than two. What stays here is what only this app
 * draws: the tone, the symbol, and the run view the transcript renders.
 */
export type MobileActivityStateKey = HeyRunActivityStateKey;

export type MobileActivitySummary = {
  label: string;
  labelKey?: MobileActivityStateKey;
  detail: string;
  tone: MobileActivityTone;
};

export type MobileActivityDetail = HeyRunActivityDetail;

export type MobileAssistantContentView = HeyAssistantContentView;

export type MobileRunActivityView = {
  summary: MobileActivitySummary | null;
  details: MobileActivityDetail[];
};

export function mobileChatRunStatusAfter(
  current: ChatRunStatus | null | undefined,
  incoming: ChatRunStatus,
): ChatRunStatus {
  if (current === "completed" || current === "failed" || current === "cancelled") return current;
  return incoming;
}

function eventPayloadText(event: ChatRunEvent, key: string) {
  const value = event.payload?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function technicalSummaryLabel(tool: string) {
  if (tool === "skill_view") return "Opening a skill";
  if (tool.includes("search")) return "Searching";
  if (tool.startsWith("read")) return "Reading";
  if (tool.startsWith("write") || tool.startsWith("edit") || tool === "apply_patch") return "Updating";
  if (tool.startsWith("browser") || tool.startsWith("web_")) return "Using the browser";
  if (tool.startsWith("memory_")) return "Checking memory";
  if (tool.startsWith("plugin_")) return "Using a plugin";
  return "Running a tool";
}

/** The shared projection. Kept under its old name so callers do not move. */
export const mobileAssistantContentView: (text: string) => MobileAssistantContentView =
  heyAssistantContentView;

function technicalActivitiesFromEvents(events: ChatRunEvent[]) {
  let best: MobileActivityDetail[] = [];
  for (const event of events) {
    if (event.type !== "message_delta" && event.type !== "message_completed") continue;
    const content = eventPayloadText(event, "content") || eventPayloadText(event, "delta");
    if (!content) continue;
    const activities = mobileAssistantContentView(content).technicalActivities.map((activity) => ({
      ...activity,
      createdAt: event.createdAt,
    }));
    if (activities.length >= best.length) best = activities;
  }
  return best;
}

function isLowValueStatusEvent(event: ChatRunEvent) {
  if (event.type !== "status") return false;
  const status = eventPayloadText(event, "status").toLowerCase();
  const label = eventPayloadText(event, "label").toLowerCase();
  const detail = eventPayloadText(event, "detail").toLowerCase();
  return status === "typing" || detail === "typing" || (label === "hermes gateway" && (!detail || detail === "running"));
}

/**
 * Whether the plane said why this run ended.
 *
 * A run that stops because the included AI is used up is not a malfunction, and
 * the plane already writes the reason into the chat as the assistant message.
 * It marks the matching `error` event with `customerReason` so a client can
 * tell that case from a run that simply broke, without reading the sentence and
 * without a second copy of the wording. HPD-533.
 *
 * Only the newest error decides: a run that was explained and then broke for
 * another reason is not explained any more.
 */
export function mobileRunFailureIsExplained(events: ChatRunEvent[]) {
  const latestError = [...events].reverse().find((event) => event.type === "error");
  return Boolean(latestError && eventPayloadText(latestError, "customerReason"));
}

function eventActivityDetail(event: ChatRunEvent): MobileActivityDetail | null {
  if (event.type === "message_delta" || event.type === "message_completed" || isLowValueStatusEvent(event)) return null;
  const label = eventPayloadText(event, "label");
  const detail = eventPayloadText(event, "detail");
  if (event.type === "error") {
    return {
      key: event.id,
      label: "Error",
      detail: eventPayloadText(event, "error") || detail || "Hermes could not finish this reply.",
      createdAt: event.createdAt,
    };
  }
  if (event.type === "usage") {
    return {
      key: event.id,
      label: label || "Model usage",
      detail: detail || "Model usage was recorded.",
      createdAt: event.createdAt,
    };
  }
  if (event.type === "status") {
    const status = eventPayloadText(event, "status").toLowerCase();
    if (status === "queued" && !label) return null;
    return {
      key: event.id,
      label: label || status || "Status",
      detail: detail || "Hermes reported an activity update.",
      createdAt: event.createdAt,
    };
  }
  return {
    key: event.id,
    label: label || "Activity",
    detail: detail || "Hermes reported an activity update.",
    createdAt: event.createdAt,
  };
}

function compactActivityDetails(details: MobileActivityDetail[]) {
  const compacted: MobileActivityDetail[] = [];
  for (const detail of details) {
    const previous = compacted.at(-1);
    if (
      previous &&
      previous.label.trim().toLowerCase() === detail.label.trim().toLowerCase() &&
      previous.detail.trim().toLowerCase() === detail.detail.trim().toLowerCase()
    ) {
      continue;
    }
    compacted.push(detail);
  }
  return compacted.slice(-24);
}

function currentStatusFromEvents(events: ChatRunEvent[]): ChatRunStatus | null {
  for (const event of [...events].reverse()) {
    if (event.type === "message_completed") return "completed";
    if (event.type === "error") return "failed";
    if (event.type !== "status") continue;
    const status = eventPayloadText(event, "status");
    if (["queued", "running", "waiting_for_approval", "completed", "cancelled", "failed"].includes(status)) {
      return status as ChatRunStatus;
    }
    if (status === "processing_completed") return "completed";
    if (status === "processing_started" || status === "typing") return "running";
  }
  return null;
}

function latestTechnicalSummary(details: MobileActivityDetail[]) {
  const latest = [...details].reverse().find((detail) => detail.key.startsWith("tool-"));
  return latest ? technicalSummaryLabel(latest.label) : null;
}

export function mobileRunActivityView(input: {
  assistantText?: string;
  events: ChatRunEvent[];
  runStatus: ChatRunStatus | null;
}): MobileRunActivityView {
  const assistantView = mobileAssistantContentView(input.assistantText ?? "");
  const eventTechnicalActivities = technicalActivitiesFromEvents(input.events);
  const technicalActivities = assistantView.technicalActivities.length
    ? assistantView.technicalActivities
    : eventTechnicalActivities;
  const eventDetails = input.events
    .map(eventActivityDetail)
    .filter((detail): detail is MobileActivityDetail => Boolean(detail));
  const details = compactActivityDetails([...technicalActivities, ...eventDetails]);
  const status = input.runStatus ?? currentStatusFromEvents(input.events);
  const latestError = [...input.events].reverse().find((event) => event.type === "error");

  if (latestError || status === "failed") {
    // "Hermes could not finish this reply." is what we say when we do not know
    // why a run ended. When we do know, the plane marks the error event with
    // `customerReason` and has already written the reason into the chat as the
    // assistant message. Both lines together read as two different events -- a
    // failure and a bill -- for one thing. So when the reason is known, the
    // reason is the whole message: it stands on its own if the chat carries it,
    // and otherwise it takes the generic line's place. HPD-533.
    const explained = latestError && mobileRunFailureIsExplained([latestError]) ? latestError : null;
    if (explained && assistantView.visibleText) return { details, summary: null };
    const explainedDetail = explained ? eventPayloadText(explained, "error") : "";
    return {
      details,
      summary: {
        label: "Reply needs attention",
        labelKey: "needsAttention",
        detail: explainedDetail || "Hermes could not finish this reply.",
        tone: "error",
      },
    };
  }
  if (status === "cancelled") {
    return {
      details,
      summary: { label: "Reply stopped", labelKey: "stopped", detail: "This reply was stopped.", tone: "neutral" },
    };
  }
  if (status === "completed" && !assistantView.visibleText) {
    return {
      details,
      summary: {
        label: "Reply needs attention",
        labelKey: "needsAttention",
        detail: "Hermes finished without a visible answer.",
        tone: "error",
      },
    };
  }
  if (status === "completed" || (!status && assistantView.visibleText)) {
    return { details, summary: null };
  }
  if (status === "waiting_for_approval") {
    return {
      details,
      summary: { label: "Waiting for you", labelKey: "waitingForYou", detail: "Hermes needs your input before continuing.", tone: "working" },
    };
  }
  if (assistantView.visibleText) {
    return {
      details,
      summary: { label: "Writing a reply", labelKey: "writing", detail: "Hermes is preparing the answer.", tone: "working" },
    };
  }
  const technicalLabel = latestTechnicalSummary(technicalActivities);
  if (technicalLabel) {
    return {
      details,
      summary: { label: technicalLabel, detail: "Hermes is working on your request.", tone: "working" },
    };
  }
  if (status === "queued") {
    return {
      details,
      summary: { label: "Getting ready", labelKey: "gettingReady", detail: "Hermes received your message.", tone: "working" },
    };
  }
  return {
    details,
    summary: { label: "Working", labelKey: "working", detail: "Hermes is working on your request.", tone: "working" },
  };
}

export const mobileRunStatusFromTerminalEvent: (event: ChatRunEvent) => ChatRunStatus | null =
  heyRunStatusFromTerminalEvent;

/**
 * The suggestions belong to a conversation that is empty and settled.
 *
 * HPD-433: they flashed on the way into a sub thread. The transcript is
 * filtered by conversation, and the customer's own message was drawn before
 * any conversation existed, so the moment the run named one, that message no
 * longer matched and the list was empty for a frame — long enough to show the
 * empty state of a chat the customer had just written into.
 *
 * The message keeping its place is the fix; this is the second lock. While a
 * send is in flight or a conversation is being opened, the app does not yet
 * know what the conversation holds, and an empty list is not an answer.
 */
export function mobileChatEmptyStateVisible(input: {
  busy: boolean;
  messageCount: number;
  pendingAssistantText: boolean;
  switchingConversation: boolean;
}): boolean {
  if (input.messageCount > 0 || input.pendingAssistantText) return false;
  return !input.busy && !input.switchingConversation;
}
