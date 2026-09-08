import type {
  CanonicalHermesRunEvent,
  HermesChannelId,
  HermesConversationSensitivity,
  HermesJsonValue,
  HermesRunState,
  HermesSurface,
} from "./hermes-channel";
import type { BrowserResultCard } from "./types";

export const HERMES_API_CONTRACT_VERSION = "2026-07-14.1" as const;
export type HermesApiContractVersion =
  | typeof HERMES_API_CONTRACT_VERSION
  | "2026-07-11.2"
  | "2026-07-11.1"
  | "2026-07-11";

export type CanonicalHermesAccessPolicy = {
  surface: HermesSurface;
  defaultChannel: HermesChannelId;
  allowedChannels: HermesChannelId[];
};

export type HermesContextReference = {
  id: string;
  kind: string;
  source?: string | null;
  label?: string | null;
};

export type HermesArtifactReference = {
  id: string;
  kind: string;
  source: string;
  version: number;
  sensitivity: HermesConversationSensitivity;
  label?: string | null;
  safeSummary?: string | null;
  href?: string | null;
};

export type HermesArtifactReferenceInput = Omit<HermesArtifactReference, "sensitivity"> & {
  sensitivity?: HermesConversationSensitivity;
};

export type HermesConversationVisibility = "full" | "summary" | "hidden";

export const HERMES_CONSUMER_UNAVAILABLE_MESSAGE =
  "Hermes is temporarily unavailable. Please try again shortly." as const;

export type HermesMessageConsumerSafetyReason =
  | "provider_authentication"
  | "runtime_configuration"
  | "delivery_configuration";

export type HermesMessageConsumerSafety = {
  classification: "operator_diagnostic";
  reason: HermesMessageConsumerSafetyReason;
  safeContent: typeof HERMES_CONSUMER_UNAVAILABLE_MESSAGE;
  retryable: true;
};

type HermesMessageConsumerSafetyInput = {
  role: "user" | "assistant" | "system";
  content: string;
};

export type HermesVisibleAssistantOutput = {
  outcome: "visible" | "incomplete" | "empty";
  removedControl: boolean;
  visibleText: string;
};

export type HermesVisibleAssistantOutputInput = HermesMessageConsumerSafetyInput;

const hermesReasoningControlTags = [
  "mm:think",
  "think",
  "thinking",
  "reasoning",
  "analysis",
] as const;

function reasoningControlTagAt(content: string, offset: number) {
  const remaining = content.slice(offset);
  for (const name of hermesReasoningControlTags) {
    const opening = `<${name}>`;
    if (remaining.slice(0, opening.length).toLowerCase() === opening) {
      return { kind: "opening" as const, length: opening.length, name };
    }
    const closing = `</${name}>`;
    if (remaining.slice(0, closing.length).toLowerCase() === closing) {
      return { kind: "closing" as const, length: closing.length, name };
    }
  }
  return null;
}

function isPartialReasoningControlTag(content: string, offset: number) {
  const remaining = content.slice(offset).toLowerCase();
  if (!remaining.startsWith("<")) return false;
  return hermesReasoningControlTags.some((name) =>
    [`<${name}>`, `</${name}>`].some(
      (controlTag) => remaining.length < controlTag.length && controlTag.startsWith(remaining),
    ),
  );
}

function matchingReasoningClose(content: string, offset: number, name: string) {
  const close = `</${name}>`;
  const index = content.toLowerCase().indexOf(close, offset);
  return index < 0 ? null : { end: index + close.length };
}

function skipAssistantControlBoundaryWhitespace(content: string, offset: number) {
  let cursor = offset;
  while (cursor < content.length && /\s/.test(content[cursor] ?? "")) cursor += 1;
  return cursor;
}

function removeControlSeparatorWhitespace(content: string) {
  if (/^[ \t]*\r?\n/.test(content)) {
    return content.replace(/^(?:[ \t]*\r?\n)+/, "");
  }
  return content.replace(/^[ \t]+/, "");
}

/**
 * Projects trusted assistant/runtime output to the text a consumer may see.
 *
 * Reasoning wrappers are recognized only at the structural beginning of the
 * accumulated output. This deliberately leaves arbitrary XML, Markdown code,
 * and embedded tag explanations untouched. User and system content never
 * enters this assistant-only interpretation.
 */
export function projectHermesVisibleAssistantOutput(
  input: HermesVisibleAssistantOutputInput,
): HermesVisibleAssistantOutput {
  if (input.role !== "assistant") {
    return {
      outcome: input.content.trim() ? "visible" : "empty",
      removedControl: false,
      visibleText: input.content,
    };
  }

  let cursor = skipAssistantControlBoundaryWhitespace(input.content, 0);
  let removedControl = false;
  let visibleStart = 0;

  while (cursor < input.content.length) {
    const controlTag = reasoningControlTagAt(input.content, cursor);
    if (!controlTag) {
      if (isPartialReasoningControlTag(input.content, cursor)) {
        return { outcome: "incomplete", removedControl: true, visibleText: "" };
      }
      break;
    }

    removedControl = true;
    cursor += controlTag.length;
    if (controlTag.kind === "opening") {
      const close = matchingReasoningClose(input.content, cursor, controlTag.name);
      if (!close) {
        return { outcome: "incomplete", removedControl: true, visibleText: "" };
      }
      cursor = close.end;
    }
    visibleStart = cursor;
    cursor = skipAssistantControlBoundaryWhitespace(input.content, cursor);
  }

  if (!removedControl) {
    return {
      outcome: input.content.trim() ? "visible" : "empty",
      removedControl: false,
      visibleText: input.content,
    };
  }

  const visibleText = removeControlSeparatorWhitespace(input.content.slice(visibleStart));
  return {
    outcome: visibleText.trim() ? "visible" : "empty",
    removedControl: true,
    visibleText,
  };
}

const providerAuthenticationDiagnostic =
  /^(?:provider\s+authentication\s+failed|(?:codex|openai|openrouter|anthropic)\s+(?:provider\s+)?auth(?:entication)?\s+(?:is\s+)?(?:missing|failed|invalid|unavailable)|missing\s+(?:provider\s+)?credentials?\b)/i;
const providerCredentialStateDiagnostic =
  /\b(?:refresh[_ -]?token[_ -]?(?:reused|invalid|expired|revoked)|invalid[_ -]?grant|needs[_ -]?reauthentication|credential[_ -]?(?:invalid|revoked)|credential[_ -]?materialization[_ -]?(?:missing|failed))\b/i;
const runtimeConfigurationDiagnostic =
  /^(?:hermes\s+)?(?:runtime|model|provider)(?:\s+[a-z0-9_-]+){0,3}\s+(?:is\s+)?(?:not\s+configured|unavailable|failed|missing)\b/i;
const operatorSetupCommand =
  /(?:^|\s)(?:run|type|execute)\s+(?:`)?(?:hermes\s+(?:auth|model)\b|\/sethome\b)/i;
const internalCredentialField = /\b(?:access_token|refresh_token|client_secret|api_key)\b/i;
const failedSetupLanguage = /\b(?:failed|failure|missing|required|not\s+configured|unavailable|authenticate)\b/i;

const hermesConsumerSecretPatterns: ReadonlyArray<[RegExp, string]> = [
  [/https:\/\/openrouter\.ai\/workspaces\/[^/\s"'{}]+\/keys\/[A-Za-z0-9._~/-]+/gi, "https://openrouter.ai/keys/redacted"],
  [/\b(?:sk|rk|pk)-(?:proj-)?[A-Za-z0-9_-]{8,}\b/gi, "key-redacted"],
  [/\b\d{6,12}:[A-Za-z0-9_-]{20,}\b/g, "[redacted-token]"],
  [
    /\b(access[_-]?token|refresh[_-]?token|id[_-]?token|api[_-]?key|client[_-]?secret|password|credential|authorization[_-]?code|code[_-]?verifier)\b\s*["'=:\s]+[A-Za-z0-9._~+/-]{8,}/gi,
    "$1=redacted",
  ],
  [/\bBearer\s+[A-Za-z0-9._~+/-]{8,}/gi, "Bearer redacted"],
];

/** Redacts credential-shaped values before runtime text crosses a consumer boundary. */
export function redactHermesConsumerSecrets(content: string) {
  return hermesConsumerSecretPatterns.reduce(
    (redacted, [pattern, replacement]) => redacted.replace(pattern, replacement),
    content,
  );
}

function operatorDiagnosticSafety(reason: HermesMessageConsumerSafetyReason): HermesMessageConsumerSafety {
  return {
    classification: "operator_diagnostic",
    reason,
    safeContent: HERMES_CONSUMER_UNAVAILABLE_MESSAGE,
    retryable: true,
  };
}

/**
 * Classifies known runtime/operator failure payloads before persistence and at
 * compatibility boundaries that may still receive older canonical history.
 */
export function classifyHermesMessageConsumerSafety(
  message: HermesMessageConsumerSafetyInput,
): HermesMessageConsumerSafety | null {
  if (message.role === "user") return null;
  const content = message.content.trim();
  if (!content) return null;
  // Upstream prefixes its operator diagnostics with a warning symbol. The
  // anchored patterns below never matched "⚠️ Provider authentication failed…",
  // so that raw text reached the chat instead of a plain product message.
  let anchored = content.replace(/^[^\p{L}\p{N}]+/u, "");
  // The Gateway can emit the safe product sentence and then append the raw
  // operator diagnostic to the same message. Anchored matching saw only the safe
  // opening and let the credentials advice and gateway-log pointer through, so
  // look past that opening too.
  if (anchored.startsWith(HERMES_CONSUMER_UNAVAILABLE_MESSAGE)) {
    const remainder = anchored.slice(HERMES_CONSUMER_UNAVAILABLE_MESSAGE.length).replace(/^[^\p{L}\p{N}]+/u, "");
    if (remainder) anchored = remainder;
  }
  const lower = anchored.toLowerCase();

  if (
    lower.startsWith("hey hermes web has not saved a default delivery chat yet") ||
    (lower.startsWith("no home channel is set") && /\/(?:sethome)\b/i.test(content))
  ) {
    return operatorDiagnosticSafety("delivery_configuration");
  }

  if (
    providerAuthenticationDiagnostic.test(anchored) ||
    providerCredentialStateDiagnostic.test(content) ||
    ((internalCredentialField.test(content) || operatorSetupCommand.test(content)) &&
      /\b(?:provider|codex|openai|openrouter|anthropic|auth(?:entication)?)\b/i.test(content) &&
      failedSetupLanguage.test(content))
  ) {
    return operatorDiagnosticSafety("provider_authentication");
  }

  if (
    runtimeConfigurationDiagnostic.test(anchored) ||
    (operatorSetupCommand.test(content) && failedSetupLanguage.test(content))
  ) {
    return operatorDiagnosticSafety("runtime_configuration");
  }

  return null;
}

export function safeHermesConsumerText(
  content: string,
  role: HermesMessageConsumerSafetyInput["role"] = "assistant",
) {
  const projection = projectHermesVisibleAssistantOutput({ role, content });
  if (role === "assistant" && projection.outcome !== "visible") {
    return HERMES_CONSUMER_UNAVAILABLE_MESSAGE;
  }
  const safeContent = classifyHermesMessageConsumerSafety({
    role,
    content: projection.visibleText,
  })?.safeContent;
  return safeContent ?? redactHermesConsumerSecrets(projection.visibleText);
}

export function safeHermesConsumerValue(value: unknown): unknown {
  if (typeof value === "string") {
    return value.trim() ? safeHermesConsumerText(value) : value;
  }
  if (Array.isArray(value)) return value.map(safeHermesConsumerValue);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, safeHermesConsumerValue(item)]),
  );
}

export type HermesApiConversation = {
  id: string;
  workspaceId: string;
  title: string;
  role: "home" | "chat";
  status: "active" | "archived";
  surfaceOrigin: HermesSurface;
  channelOrigin: HermesChannelId;
  sensitivity: HermesConversationSensitivity;
  allowedSurfaces: HermesSurface[];
  visibility: HermesConversationVisibility;
  safeSummary: string | null;
  activeRunId: string | null;
  messageCount: number;
  lastMessageAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type HermesApiMessage = {
  id: string;
  conversationId: string;
  runId: string;
  role: "user" | "assistant" | "system";
  content: string;
  consumerSafety: HermesMessageConsumerSafety | null;
  artifactReferences: HermesArtifactReference[];
  createdAt: string;
};

export type HermesApiRun = {
  id: string;
  accountId: string;
  workspaceId: string;
  conversationId: string;
  runtimeRunId: string | null;
  status: HermesRunState;
  surface: HermesSurface;
  channel: HermesChannelId;
  sensitivity: HermesConversationSensitivity;
  contextReferences: HermesContextReference[];
  requestedCapabilityFamilies: string[];
  sourceJobId: string | null;
  sourceExecutionId: string | null;
  messages: HermesApiMessage[];
  /**
   * A bounded, safe activity window for clients that must poll when native
   * event streaming is unavailable. Terminal runs deliberately return no
   * activity because this is transient presentation state, not history.
   */
  events?: CanonicalHermesRunEvent[];
  /**
   * What the reply browsed, as something the customer can keep.
   *
   * HPD-402: the clients have drawn this card and its save button since it was
   * built, and the canonical run never carried the field, so the branch that
   * draws it could not run even once a card existed.
   */
  browserResultCards?: BrowserResultCard[];
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
};

export type CreateHermesConversationRequest = {
  title?: string;
  surface?: HermesSurface;
  channel?: HermesChannelId;
  sensitivity?: HermesConversationSensitivity;
  allowedSurfaces?: HermesSurface[];
};

export type HermesConversationListResponse = {
  contractVersion: HermesApiContractVersion;
  conversations: HermesApiConversation[];
};

export type HermesConversationResponse = {
  contractVersion: HermesApiContractVersion;
  conversation: HermesApiConversation;
};

export type HermesMessagesResponse = {
  contractVersion: HermesApiContractVersion;
  conversation: HermesApiConversation;
  messages: HermesApiMessage[];
  nextBefore: string | null;
};

export type HermesRunResponse = {
  contractVersion: HermesApiContractVersion;
  run: HermesApiRun;
};

export type HermesRunsResponse = {
  contractVersion: HermesApiContractVersion;
  run: HermesApiRun | null;
  runs: HermesApiRun[];
};

// The lifecycle of a delegated sub thread, as the runtime actually reports it.
// Two more names used to stand here, "paused" and "quiet_wait", and nothing ever
// wrote either: the plugin reports "running" at the start
// (heyhermes-web-gateway-plugin.ts) and then one of completed/cancelled/failed
// out of _delegated_task_terminal_state. Hermes has no counterpart to them; a
// delegated child either runs or has ended. They were a promise on the wire that
// no writer kept, and a label the app could never show.
//
// "human_gate" stays, because it is the one that has a counterpart: Hermes
// answers a pending approval on POST /v1/runs/{id}/approval, so the state has
// somewhere to come from.
//
// Not the "paused" of an automation. That one is a scheduled job the customer
// stopped in the app (HermesAutomationStatus below), a different thing on a
// different table, and it is untouched.
export const hermesDelegatedTaskStates = [
  "running",
  "human_gate",
  "failed",
  "cancelled",
  "completed",
] as const;

export type HermesDelegatedTaskState = (typeof hermesDelegatedTaskStates)[number];

export type HermesDelegatedTask = {
  taskId: string;
  name: string;
  conversationId: string;
  sourceRunId: string;
  state: HermesDelegatedTaskState;
  startedAt: string;
  updatedAt: string;
  completedAt: string | null;
};

export type HermesDelegatedTasksResponse = {
  contractVersion: HermesApiContractVersion;
  tasks: HermesDelegatedTask[];
};

export type HermesDelegatedTaskResponse = {
  contractVersion: HermesApiContractVersion;
  task: HermesDelegatedTask;
};

/**
 * The one answer the control plane gives when a sub order the customer called
 * off is offered again. The runtime bridge matches this exact sentence to know
 * the refusal is final and the receipt must be dropped rather than retried, so
 * both sides have to read it from the same place.
 */
export const hermesDelegatedTaskCancelledByCustomerError =
  "A delegated sub-thread the customer cancelled is not started again.";

export type CreateHermesRunResponse = HermesRunResponse & {
  conversation: HermesApiConversation;
};

export type HermesJobPolicy = {
  conversationId: string;
  surface: HermesSurface;
  channel: HermesChannelId;
  sensitivity: HermesConversationSensitivity;
  allowedSurfaces: HermesSurface[];
  requestedCapabilityFamilies: string[];
};

export type HermesApiJob = {
  id: string;
  name: string;
  visibility: HermesConversationVisibility;
  prompt: string;
  schedule: HermesJsonValue;
  scheduleDisplay: string;
  enabled: boolean;
  state: string;
  deliver: HermesJsonValue;
  nextRunAt: string | null;
  lastRunAt: string | null;
  lastStatus: string | null;
  lastError: string | null;
  policy: HermesJobPolicy | null;
  native: Record<string, HermesJsonValue>;
};

export type CreateHermesJobRequest = {
  name: string;
  schedule: string;
  prompt?: string;
  deliver?: string;
  skills?: string[];
  repeat?: number;
  conversationId?: string | null;
  surface?: HermesSurface;
  channel?: HermesChannelId;
  sensitivity?: HermesConversationSensitivity;
  allowedSurfaces?: HermesSurface[];
  requestedCapabilityFamilies?: string[];
};

export type UpdateHermesJobRequest = Partial<
  Pick<CreateHermesJobRequest, "name" | "schedule" | "prompt" | "deliver" | "skills" | "repeat" | "surface" | "channel" | "sensitivity" | "allowedSurfaces" | "requestedCapabilityFamilies">
> & {
  status?: "active" | "paused";
  conversationId?: string | null;
};

export type HermesJobsResponse = {
  contractVersion: HermesApiContractVersion;
  jobs: HermesApiJob[];
};

export type HermesJobResponse = {
  contractVersion: HermesApiContractVersion;
  job: HermesApiJob;
};

export type HermesJobRunResponse = HermesJobResponse & {
  executionId: string | null;
};

export type HermesCanonicalEvent = CanonicalHermesRunEvent;
