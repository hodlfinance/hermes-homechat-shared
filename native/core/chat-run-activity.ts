import { projectHermesVisibleAssistantOutput } from "./hermes-api";
import type { ChatRunEvent, ChatRunStatus } from "./types";

/**
 * One status contract for every Hey Hermes client.
 *
 * HPD-322 settled what a customer may see while Hermes works, and the iOS app
 * was accepted on it: while a run is alive, exactly one short status line; when
 * the run ends, nothing at all; and never a raw command, path, identifier, URL,
 * environment value, or model name. HPD-350 carries that same contract to the
 * web, so this module holds the truth and the two surfaces only draw it.
 *
 * The logic here was lifted from the accepted iOS implementation
 * (`apps/mobile/src/mobile-chat-activity.ts` and `mobile-live-run-status.ts`)
 * without a behaviour change, so that neither client has to own a second one.
 */

/**
 * `labelKey` names one of the fixed states so the surface can say it in the
 * customer's language. A summary built from a tool's own wording has no key,
 * because that text is the tool's, not ours.
 */
export type HeyRunActivityStateKey =
  | "needsAttention"
  | "stopped"
  | "waitingForYou"
  | "writing"
  | "gettingReady"
  | "working";

export type HeyRunActivityDetail = {
  key: string;
  label: string;
  detail: string;
  createdAt: string | null;
};

export type HeyAssistantContentView = {
  visibleText: string;
  technicalActivities: HeyRunActivityDetail[];
};

export type HeyLiveRunActivity = {
  label: string;
  labelKey?: HeyRunActivityStateKey;
};

const TECHNICAL_ACTIVITY_LINE = /^\s*(?:📚|🔎|🔍|⚙️?|💻|📖|📝|✏️?|🛠️?|🌐|🧠|🔌|🖥️?)\s*(skill_view|search_files|search|read_file|read|write_file|write|edit_file|edit|apply_patch|terminal|shell|process|browser_[a-z0-9_]+|web_search|web_fetch|memory_[a-z0-9_]+|plugin_[a-z0-9_]+|computer_[a-z0-9_]+)\s*:\s*(.*)$/i;
const RUNNING_TECHNICAL_ACTIVITY_LINE = /(?:📚|🔎|🔍|⚙️?|💻|📖|📝|✏️?|🛠️?|🌐|🧠|🔌|🖥️?|🐍)\s*(?:running|ran)\s+(.+)$/i;
const HISTORICAL_SKILL_ACTIVITY_LINE = /^\s*📚\s+Reading skill\s+(.{1,240}?)\s*$/i;
const RUNTIME_FILE_SEARCH_ACTIVITY_LINE = /^\s*🔎\s+Searching files(?:\s+for)?\s+(.{1,240}?)\s*$/i;
const RUNTIME_FILE_READ_ACTIVITY_LINE = /^\s*📖\s+Reading\s+(.{1,240}?)\s*$/i;
const HISTORICAL_GATEWAY_STATUS_LINE = /^\s*⚠️\s+Gateway shutting down\s+—\s+Your current task will be interrupted\.\s*$/;
const RESTORED_BROWSER_NAVIGATION_LINE = /^\s*🌐\s+Browsing\s+(https?:\/\/\S+)\s*$/;
const RESTORED_BROWSER_ACTION_LINE = /^\s*(?:⌨️\s+(browser_press)|📷\s+(browser_snapshot))(?:\s*:\s*.*|…|\.\.\.)?\s*$/;
const INTERNAL_RUNTIME_PRELUDE_LINE = /(?:\bcodex\b.*\b(?:caps?|context)\b|\bauto-?compaction\b|\bcompression\.codex_[a-z0-9_.-]+\b)/i;

/*
 * The runtime also writes tool markers into the middle of a line, and ends them
 * with an ellipsis instead of a colon:
 *
 *   👆 Clicking @e30 📸 browser_snapshot... 🖥️ browser_console...
 *   ⚙️ mcp__basic_memory__read_content: "README.md"
 *   Jetzt zu deiner neuen To-do-Aufgabe:✅ tasks_create...
 *   🔄 ranked_tasks_refresh...Cronjob Response: Ranked Tasks ranker
 *
 * All four were measured in saved answers on the running web client on
 * 2026-08-22, after HPD-397 had already sharpened the line-shaped rules once.
 *
 * Two rules decide what may be taken out of one line, and they are deliberately
 * unequal, because a marker means something different depending on who put it
 * there:
 *
 * - A line that **begins** with a tool marker is the runtime's own line. Its
 *   tool calls go, and whatever the runtime wrote behind them stays.
 * - A line that begins with the customer's own text keeps everything, unless
 *   the whole tail from the first tool call to the end of the line is nothing
 *   but tool calls. Then the tail goes and the sentence stays.
 *
 * That second rule is what keeps a quotation intact. "Hermes displayed
 * “🌐 Browsing https://example.com” as status text." has words after the
 * marker, so the line is left exactly as written — and a Markdown blockquote is
 * quoted material by definition, so a `>` line is never touched at all, the
 * same way a fenced block is not.
 *
 * Three characters are deliberately left out of the marker list:
 *
 * - `⚠️`, because a warning is usually the only thing such a message says and
 *   eating it would leave an empty answer behind;
 * - `📷` and `⌨️`, because `RESTORED_BROWSER_ACTION_LINE` already takes those
 *   two in their correct pairing, and the accepted app keeps the swapped pair
 *   (`⌨️ browser_snapshot…`, `📷 browser_press…`) on purpose to prove that
 *   pattern is exact. This rule must not quietly overrule that decision.
 *
 * Note `📸` and `📷` are different characters. The runtime writes `📸`.
 */
const INLINE_ACTIVITY_MARKER = "(?:👆|📸|📋|🖥️?|✅|🔄|📚|🔎|🔍|⚙️?|💻|📖|📝|✏️?|🛠️?|🌐|🧠|🔌|🐍)";
const INLINE_ACTIVITY_MARKERS = new RegExp(INLINE_ACTIVITY_MARKER, "gu");
// `mcp__basic_memory__read_content` is a tool name too. One underscore or two,
// the shape is the same, and the doubled one is what was reaching customers.
const INLINE_ACTIVITY_TOOL_NAME = "[a-z][a-z0-9]*(?:_+[a-z0-9]+)+";
const INLINE_ACTIVITY_PHRASE = "[A-Z][a-z]+ing(?:\\s+\\S{1,60}){0,2}";
const INLINE_ACTIVITY_HEAD = new RegExp(
  `^\\s*(?:(${INLINE_ACTIVITY_TOOL_NAME})(?:\\s*:\\s*(.*)|\\s*(?:\\.\\.\\.|…))?|(${INLINE_ACTIVITY_PHRASE})\\s*(?:\\.\\.\\.|…)?)`,
  "u",
);
const MARKDOWN_QUOTED_LINE = /^\s*>/;
const ONLY_LINE_BREAK_TAGS = /^(?:<br\s*\/?>|\s)+$/i;

function inlineActivityLine(line: string, index: number): {
  activities: HeyRunActivityDetail[];
  visibleText: string;
} | null {
  // A blockquote is quoted material, like a fenced block. Whatever it shows, it
  // shows on purpose.
  if (MARKDOWN_QUOTED_LINE.test(line)) return null;

  const markers = [...line.matchAll(INLINE_ACTIVITY_MARKERS)];
  if (!markers.length) return null;

  const activities: HeyRunActivityDetail[] = [];
  const kept: string[] = [];
  let cursor = 0;
  let firstRemovedAt = -1;

  for (let position = 0; position < markers.length; position += 1) {
    const marker = markers[position];
    const markerStart = marker?.index ?? -1;
    // A marker inside a span already taken is part of that span.
    if (markerStart < cursor) continue;
    const spanStart = markerStart + (marker?.[0].length ?? 0);
    const nextMarkerStart = markers[position + 1]?.index ?? line.length;
    const span = line.slice(spanStart, Math.max(spanStart, nextMarkerStart));
    const head = span.match(INLINE_ACTIVITY_HEAD);
    const tool = head?.[1];
    const phrase = head?.[3];
    // No tool call behind this marker: it is an ordinary character in a
    // sentence, and the sentence keeps it.
    if (!head || (!tool && !phrase)) continue;

    kept.push(line.slice(cursor, markerStart));
    if (firstRemovedAt < 0) firstRemovedAt = markerStart;
    const detail = (tool ? (head[2] ?? "").trim() || tool : phrase ?? "").trim();
    const label = (tool ?? detail.split(/\s+/)[0] ?? "tool").toLowerCase();
    activities.push({
      key: `tool-${index}-${label}-${detail.toLowerCase()}`,
      label,
      detail,
      createdAt: null,
    });
    cursor = spanStart + head[0].length;
  }

  if (!activities.length) return null;
  kept.push(line.slice(cursor));

  const prefix = line.slice(0, firstRemovedAt);
  const tailLeftover = kept.join("").slice(prefix.length);
  const runtimeLine = !prefix.trim() || ONLY_LINE_BREAK_TAGS.test(prefix);
  const tailIsOnlyToolCalls = !tailLeftover.trim();
  // The customer wrote this line and there are words of theirs behind the first
  // tool call. Anything could be quotation, so nothing is taken.
  if (!runtimeLine && !tailIsOnlyToolCalls) return null;

  const remainder = (prefix + tailLeftover).trim();
  // What the runtime leaves behind when the markers go is sometimes a bare
  // `<br>`. That is markup, not a sentence, so it does not become an empty line
  // in the middle of the answer.
  return { activities, visibleText: ONLY_LINE_BREAK_TAGS.test(remainder) ? "" : remainder };
}

function eventPayloadText(event: ChatRunEvent, key: string) {
  const value = event.payload?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function technicalActivityFromLine(line: string, index: number): {
  activity: HeyRunActivityDetail;
  visiblePrefix: string;
} | null {
  const match = line.match(TECHNICAL_ACTIVITY_LINE);
  if (match) {
    const tool = (match[1] ?? "").toLowerCase();
    if (!tool) return null;
    const detail = (match[2] ?? "").trim();
    return {
      activity: {
        key: `tool-${index}-${tool}-${detail.toLowerCase()}`,
        label: tool,
        detail: detail || "Hermes used this tool.",
        createdAt: null,
      },
      visiblePrefix: "",
    };
  }

  const historicalSkillMatch = line.match(HISTORICAL_SKILL_ACTIVITY_LINE);
  if (historicalSkillMatch) {
    const detail = (historicalSkillMatch[1] ?? "").trim();
    return {
      activity: {
        key: `tool-${index}-skill_view-${detail.toLowerCase()}`,
        label: "skill_view",
        detail,
        createdAt: null,
      },
      visiblePrefix: "",
    };
  }

  const runtimeFileSearch = line.match(RUNTIME_FILE_SEARCH_ACTIVITY_LINE);
  if (runtimeFileSearch) {
    const detail = (runtimeFileSearch[1] ?? "").trim();
    return {
      activity: {
        key: `tool-${index}-search_files-${detail.toLowerCase()}`,
        label: "search_files",
        detail,
        createdAt: null,
      },
      visiblePrefix: "",
    };
  }

  const runtimeFileRead = line.match(RUNTIME_FILE_READ_ACTIVITY_LINE);
  if (runtimeFileRead) {
    const detail = (runtimeFileRead[1] ?? "").trim();
    return {
      activity: {
        key: `tool-${index}-read_file-${detail.toLowerCase()}`,
        label: "read_file",
        detail,
        createdAt: null,
      },
      visiblePrefix: "",
    };
  }

  if (HISTORICAL_GATEWAY_STATUS_LINE.test(line)) {
    return {
      activity: {
        key: `tool-${index}-process-gateway-shutdown`,
        label: "process",
        detail: "Gateway is shutting down.",
        createdAt: null,
      },
      visiblePrefix: "",
    };
  }

  const restoredBrowserNavigation = line.match(RESTORED_BROWSER_NAVIGATION_LINE);
  if (restoredBrowserNavigation) {
    const detail = (restoredBrowserNavigation[1] ?? "").trim();
    return {
      activity: {
        key: `tool-${index}-browser_navigate-${detail.toLowerCase()}`,
        label: "browser_navigate",
        detail,
        createdAt: null,
      },
      visiblePrefix: "",
    };
  }

  const restoredBrowserAction = line.match(RESTORED_BROWSER_ACTION_LINE);
  if (restoredBrowserAction) {
    const tool = (restoredBrowserAction[1] ?? restoredBrowserAction[2] ?? "").toLowerCase();
    return {
      activity: {
        key: `tool-${index}-${tool}`,
        label: tool,
        detail: "Hermes used the browser.",
        createdAt: null,
      },
      visiblePrefix: "",
    };
  }

  const runningMatch = line.match(RUNNING_TECHNICAL_ACTIVITY_LINE);
  if (!runningMatch) return null;
  const detail = (runningMatch[1] ?? "").trim();
  const markerOffset = runningMatch.index ?? 0;
  return {
    activity: {
      key: `tool-${index}-terminal-${detail.toLowerCase()}`,
      label: "terminal",
      detail: detail || "Hermes used a command-line tool.",
      createdAt: null,
    },
    visiblePrefix: line.slice(0, markerOffset).trimEnd(),
  };
}

function dedupeTechnicalActivities(activities: HeyRunActivityDetail[]) {
  const seen = new Set<string>();
  const result: HeyRunActivityDetail[] = [];
  for (const activity of activities) {
    const key = `${activity.label.toLowerCase()}|${activity.detail.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(activity);
  }
  return result;
}

/**
 * Splits one assistant message into the part a customer should read and the
 * tool lines that were never meant for them. The tool lines carry file names,
 * identifiers, and command arguments, so they are removed from the message
 * rather than styled differently.
 */
export function heyAssistantContentView(text: string): HeyAssistantContentView {
  const projection = projectHermesVisibleAssistantOutput({
    content: text,
    role: "assistant",
  });
  const normalized = projection.visibleText.replace(/\r\n/g, "\n");
  const lines = normalized.split("\n");
  const technicalActivities: HeyRunActivityDetail[] = [];
  const visibleLines: string[] = [];
  const preActivityLines: string[] = [];
  let fenceMarker: "```" | "~~~" | null = null;
  let removedActivitySinceVisible = false;
  let sawTechnicalActivity = false;

  const appendVisibleLine = (line: string) => {
    if (
      removedActivitySinceVisible &&
      !line.trim() &&
      visibleLines.length > 0 &&
      !visibleLines.at(-1)?.trim()
    ) {
      return;
    }
    visibleLines.push(line);
    if (line.trim()) removedActivitySinceVisible = false;
  };

  const appendCandidateLine = (line: string) => {
    if (sawTechnicalActivity) appendVisibleLine(line);
    else preActivityLines.push(line);
  };

  const flushPreActivityLines = (removeRuntimePrelude: boolean) => {
    for (const line of preActivityLines) {
      if (removeRuntimePrelude && INTERNAL_RUNTIME_PRELUDE_LINE.test(line)) continue;
      appendVisibleLine(line);
    }
    preActivityLines.length = 0;
  };

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? "";

    if (fenceMarker) {
      appendCandidateLine(line);
      if (line.trimStart().startsWith(fenceMarker)) fenceMarker = null;
      continue;
    }

    const fence = line.trimStart().match(/^(```|~~~)/)?.[1] as "```" | "~~~" | undefined;
    if (fence) {
      fenceMarker = fence;
      appendCandidateLine(line);
      continue;
    }

    const parsedActivity = technicalActivityFromLine(line, index);
    if (parsedActivity) {
      if (parsedActivity.visiblePrefix) appendCandidateLine(parsedActivity.visiblePrefix);
      technicalActivities.push(parsedActivity.activity);
      if (!sawTechnicalActivity) {
        flushPreActivityLines(true);
        sawTechnicalActivity = true;
      }
      removedActivitySinceVisible = true;
      continue;
    }

    const inlineRun = inlineActivityLine(line, index);
    if (inlineRun) {
      if (inlineRun.visibleText) appendCandidateLine(inlineRun.visibleText);
      technicalActivities.push(...inlineRun.activities);
      if (!sawTechnicalActivity) {
        flushPreActivityLines(true);
        sawTechnicalActivity = true;
      }
      removedActivitySinceVisible = !inlineRun.visibleText;
      continue;
    }

    appendCandidateLine(line);
  }

  if (!sawTechnicalActivity) flushPreActivityLines(false);

  return {
    visibleText: visibleLines.join("\n").trim(),
    technicalActivities: dedupeTechnicalActivities(technicalActivities),
  };
}

/**
 * The pages Hermes actually opened, read out of one runtime status text.
 *
 * The runtime writes one line per navigation, and the plane has been storing
 * those lines since long before anything read them:
 *
 *   {"label":"Hermes activity","detail":"🌐 Browsing <the page it opened>"}
 *
 * `RESTORED_BROWSER_NAVIGATION_LINE` is deliberately the whole line, so a
 * sentence that merely quotes the marker — "Hermes displayed 🌐 Browsing
 * https://example.com as status text." — is not a navigation and yields
 * nothing. That distinction is already covered by this module's tests and this
 * function must not soften it.
 */
export function heyBrowsedPagesFromStatusText(text: string): string[] {
  const seen = new Set<string>();
  const pages: string[] = [];
  for (const line of String(text ?? "").split("\n")) {
    const match = line.match(RESTORED_BROWSER_NAVIGATION_LINE);
    const url = match?.[1];
    if (!url || seen.has(url)) continue;
    seen.add(url);
    pages.push(url);
  }
  return pages;
}

/** True once a run has reached a state it cannot leave. */
export function heyRunStatusFromTerminalEvent(event: ChatRunEvent): ChatRunStatus | null {
  if (event.type === "message_completed") return "completed";
  if (event.type === "error") return "failed";
  if (event.type !== "status") return null;
  const status = eventPayloadText(event, "status");
  if (status === "completed" || status === "processing_completed") return "completed";
  if (status === "cancelled") return "cancelled";
  if (status === "failed") return "failed";
  return null;
}

function friendlyToolLabel(tool: string, privateDetail = "") {
  // `mcp__basic_memory__read_content` says what it does in its last segment.
  // The server and product prefix in front of it is plumbing, and classifying
  // on it would call every connected tool "Using a tool".
  const normalized = tool.toLowerCase().replace(/^mcp__[a-z0-9_]*?__/, "");
  const command = privateDetail.trim().replace(/^['"]/, "").split(/\s+/)[0]?.toLowerCase() ?? "";
  if (["cat", "sed", "head", "tail"].includes(command)) return "Reading";
  if (["rg", "grep", "find"].includes(command)) return "Searching";
  if (["curl", "wget"].includes(command)) return "Checking a service";
  if (normalized.includes("search")) return "Searching";
  if (normalized.startsWith("read") || normalized === "cat") return "Reading";
  if (
    normalized.startsWith("write") ||
    normalized.startsWith("edit") ||
    normalized.includes("patch")
  ) {
    return "Updating";
  }
  if (normalized.startsWith("browser") || normalized.startsWith("web_")) return "Checking the web";
  if (normalized.startsWith("memory")) return "Checking memory";
  return "Using a tool";
}

function toolStatus(label: string): HeyLiveRunActivity {
  return { label };
}

// `agent.display.build_status_phrase()` is the runtime's customer-facing
// activity seam. Hey Hermes configures it in verb-only mode, then accepts only
// the exact curated phrases below. That makes the current work more useful
// than "Working" without ever rendering a command, path, query, plugin name,
// URL, control tag, or other runtime payload.
const approvedHermesActivityDescriptions: Readonly<Record<string, string>> = {
  "is searching the web…": "Searching the web",
  "is reading…": "Reading",
  "is browsing…": "Browsing",
  "is clicking…": "Clicking",
  "is typing…": "Typing",
  "is writing…": "Writing",
  "is editing…": "Editing",
  "is searching files…": "Searching files",
  "is running…": "Running",
  "is running code…": "Running code",
  "is generating image…": "Generating image",
  "is generating video…": "Generating video",
  "is generating speech…": "Generating speech",
  "is looking at the image…": "Looking at the image",
  "is searching past sessions…": "Searching past sessions",
  "is reading skill…": "Reading skill",
  "is listing skills…": "Listing skills",
  "is updating skill…": "Updating skill",
  "is delegating…": "Delegating",
  "is scheduling…": "Scheduling",
  "is asking…": "Asking",
  "is updating memory…": "Updating memory",
  "is updating tasks…": "Updating tasks",
};

function approvedHermesActivityDescription(event: ChatRunEvent): string | null {
  if (event.type !== "status") return null;
  if (eventPayloadText(event, "source") !== "hermes_gateway") return null;
  if (eventPayloadText(event, "platform") !== "heyhermes_web") return null;
  if (!eventPayloadText(event, "chatId")) return null;
  return approvedHermesActivityDescriptions[eventPayloadText(event, "content").toLowerCase()] ?? null;
}

function friendlyStatusLabel(event: ChatRunEvent): HeyLiveRunActivity | null {
  if (event.type === "message_completed" || event.type === "error" || event.type === "usage") return null;
  if (event.type === "artifact_update") return toolStatus("Updating a result");

  if (event.type === "message_delta") {
    const content = eventPayloadText(event, "content") || eventPayloadText(event, "delta");
    if (!content) return null;
    const projection = heyAssistantContentView(content);
    if (projection.visibleText) return { label: "Writing a reply", labelKey: "writing" };
    const latestTool = projection.technicalActivities.at(-1);
    return latestTool ? toolStatus(friendlyToolLabel(latestTool.label, latestTool.detail)) : null;
  }

  const status = eventPayloadText(event, "status").toLowerCase();
  if (status === "waiting_for_approval") return { label: "Waiting for you", labelKey: "waitingForYou" };
  if (status === "queued") return { label: "Getting ready", labelKey: "gettingReady" };

  const action = eventPayloadText(event, "action").toLowerCase();
  const runtimeLabel = eventPayloadText(event, "label").toLowerCase();
  const detail = eventPayloadText(event, "detail").toLowerCase();
  if (
    status === "typing" ||
    (runtimeLabel === "hermes gateway" && detail === "typing" && (!action || action.includes("typing")))
  ) {
    return null;
  }

  const approvedDescription = approvedHermesActivityDescription(event);
  if (approvedDescription) return toolStatus(approvedDescription);

  // Runtime status payloads are not user copy. They can contain command lines,
  // environment names, URLs, or provider diagnostics, so only their category
  // influences the friendly label. No payload value is ever rendered verbatim.
  const category = [action, runtimeLabel, detail].join(" ").toLowerCase();
  if (category.includes("search")) return toolStatus("Searching");
  if (category.includes("browser") || category.includes("web")) return toolStatus("Checking the web");
  if (category.includes("read")) return toolStatus("Reading");
  if (category.includes("write") || category.includes("edit") || category.includes("update")) return toolStatus("Updating");
  if (category.includes("memory")) return toolStatus("Checking memory");
  if (category.includes("tool") || category.includes("terminal") || category.includes("shell")) return toolStatus("Using a tool");
  return status === "processing_started" || status === "typing" || status === "running"
    ? { label: "Working", labelKey: "working" }
    : null;
}

/**
 * The recent friendly labels of one active run, newest last, at most eight.
 *
 * Nothing draws this as a list today — the contract allows one line — but the
 * accepted app carries it so a surface can show what came just before without
 * ever reaching back into the raw payload. Only the friendly labels travel; the
 * detail is a fixed sentence, never a runtime value.
 */
export function heyLiveRunActivityHistory(events: ChatRunEvent[]): HeyRunActivityDetail[] {
  const result: HeyRunActivityDetail[] = [];
  for (const event of events) {
    const candidate = friendlyStatusLabel(event);
    if (!candidate) continue;
    if (result.at(-1)?.label === candidate.label) continue;
    result.push({
      key: event.id,
      label: candidate.label,
      detail: "Hermes is working on your request.",
      createdAt: event.createdAt,
    });
  }
  return result.slice(-8);
}

/**
 * Projects one active run into a single, user-facing live status line.
 *
 * The projection deliberately returns null for every terminal status. The
 * status is transient UI, never a persisted part of the assistant's answer, so
 * a finished reply carries no status block, no detail line, and no event log.
 * Raw runtime payloads are reduced to a small allow-list of friendly labels so
 * command arguments, environment values, URLs, and secrets cannot leak.
 */
export function heyLiveRunActivity(input: {
  assistantText?: string;
  events: ChatRunEvent[];
  runStatus: ChatRunStatus | null;
}): HeyLiveRunActivity | null {
  if (
    input.runStatus === "completed" ||
    input.runStatus === "failed" ||
    input.runStatus === "cancelled" ||
    input.events.some((event) => heyRunStatusFromTerminalEvent(event) !== null)
  ) {
    return null;
  }

  const candidates: Array<{ activity: HeyLiveRunActivity; eventIndex: number }> = [];
  for (const [eventIndex, event] of input.events.entries()) {
    const candidate = friendlyStatusLabel(event);
    // The queued event remains in the bounded run history after the run row
    // has already advanced. It may explain the initial frame, but it must not
    // keep saying "Getting ready" once canonical run state says work started.
    if (
      candidate?.labelKey === "gettingReady" &&
      input.runStatus !== null &&
      input.runStatus !== "queued"
    ) {
      continue;
    }
    if (candidate) candidates.push({ activity: candidate, eventIndex });
  }

  const assistantProjection = heyAssistantContentView(input.assistantText ?? "");
  // A fixed state travels as a key so the surface can say it in the customer's
  // language. A label taken from a tool's own wording keeps that wording.
  const currentCandidate = candidates.at(-1);
  let current = currentCandidate?.activity;
  // `assistantText` is the aggregate stream, not the newest event. Once any
  // visible prefix existed it used to overwrite every later structured tool
  // status forever. Keep a specific event label (Reading, Searching, Updating,
  // and so on) when event chronology proves it followed visible text. Without
  // that proof the aggregate may be newer than the retained events, so it wins.
  const currentDescribesSpecificWork = Boolean(current && !current.labelKey);
  const latestVisibleEventIndex = [...candidates]
    .reverse()
    .find(({ activity }) => activity.labelKey === "writing")
    ?.eventIndex ?? -1;
  const currentSpecificWorkFollowsVisibleText = Boolean(
    currentDescribesSpecificWork &&
    latestVisibleEventIndex >= 0 &&
    (currentCandidate?.eventIndex ?? -1) > latestVisibleEventIndex
  );
  if (assistantProjection.visibleText && !currentSpecificWorkFollowsVisibleText) {
    current = { label: "Writing a reply", labelKey: "writing" };
  } else if (assistantProjection.technicalActivities.length && !currentDescribesSpecificWork) {
    const latestTool = assistantProjection.technicalActivities.at(-1);
    current = toolStatus(friendlyToolLabel(latestTool?.label ?? "tool", latestTool?.detail));
  }
  if (input.runStatus === "waiting_for_approval") {
    current = { label: "Waiting for you", labelKey: "waitingForYou" };
  } else if (!current && input.runStatus === "queued") {
    current = { label: "Getting ready", labelKey: "gettingReady" };
  }

  return current ?? { label: "Working", labelKey: "working" };
}
