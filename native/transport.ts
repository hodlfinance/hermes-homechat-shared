import { createApiClient, createHermesApiClient } from "./core/index";
import { DEVICE_TIME_ZONE_HEADER, deviceTimeZone } from "./core/device-time-zone";
import { createSupportRequestClient, createAnonymousSupportRequestClient } from "./core/support-request";
import { createNativeR8CanonicalController, type NativeR8ChannelIdentity } from "./src/hermes-canonical";
import type {
  NativeFinanceActionApproval,
  NativeFinanceActionApprovalChannel,
  NativeFinanceActionApprovalSurface,
  NativeR8Transport,
} from "./host";

const APPROVAL_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PAYLOAD_SHA256 = /^[0-9a-f]{64}$/;
const APPROVAL_SURFACES = new Set<NativeFinanceActionApprovalSurface>(["hey_hermes", "finhermes"]);
const APPROVAL_CHANNELS = new Set<NativeFinanceActionApprovalChannel>([
  "hey_hermes_web", "hey_hermes_mobile", "finhermes_web", "finhermes_mobile",
  "hodl_mobile", "livequote_mobile", "capchat_app", "telegram", "hermes_cron",
]);

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function pendingFinanceApproval(
  value: unknown,
  identity: NativeR8ChannelIdentity,
  conversationSessionId: string,
): NativeFinanceActionApproval {
  const proposal = record(value);
  const review = record(proposal?.review);
  const fields = Array.isArray(review?.fields) ? review.fields.map(record) : [];
  if (
    !proposal || proposal.kind !== "finance_tool_action" ||
    typeof proposal.approvalId !== "string" || !APPROVAL_ID.test(proposal.approvalId) ||
    typeof proposal.payloadSha256 !== "string" || !PAYLOAD_SHA256.test(proposal.payloadSha256) ||
    typeof proposal.canonicalConversationId !== "string" || proposal.canonicalConversationId !== conversationSessionId ||
    typeof proposal.canonicalRunId !== "string" || !proposal.canonicalRunId ||
    typeof proposal.originSurface !== "string" || !APPROVAL_SURFACES.has(proposal.originSurface as NativeFinanceActionApprovalSurface) ||
    proposal.originSurface !== identity.surface ||
    typeof proposal.confirmationSurface !== "string" || !APPROVAL_SURFACES.has(proposal.confirmationSurface as NativeFinanceActionApprovalSurface) ||
    proposal.confirmationSurface !== identity.surface ||
    typeof proposal.channel !== "string" || !APPROVAL_CHANNELS.has(proposal.channel as NativeFinanceActionApprovalChannel) ||
    proposal.channel !== identity.channel ||
    !review || typeof review.title !== "string" || typeof review.summary !== "string" ||
    !Array.isArray(review.fields) || fields.some((field) =>
      !field || typeof field.key !== "string" || typeof field.label !== "string" || typeof field.value !== "string") ||
    typeof proposal.expiresAt !== "string" || !Number.isFinite(Date.parse(proposal.expiresAt))
  ) {
    throw new Error("The Finance approval response was invalid.");
  }
  return {
    approvalId: proposal.approvalId,
    payloadSha256: proposal.payloadSha256,
    canonicalConversationId: proposal.canonicalConversationId,
    canonicalRunId: proposal.canonicalRunId,
    originSurface: proposal.originSurface as NativeFinanceActionApprovalSurface,
    confirmationSurface: proposal.confirmationSurface as NativeFinanceActionApprovalSurface,
    channel: proposal.channel as NativeFinanceActionApprovalChannel,
    title: review.title,
    summary: review.summary,
    fields: fields.map((field) => ({
      key: field!.key as string,
      label: field!.label as string,
      value: field!.value as string,
    })),
    expiresAt: proposal.expiresAt,
  };
}

function approvalDecisionBody(approval: NativeFinanceActionApproval, decision: "confirm" | "cancel") {
  return JSON.stringify({
    decision,
    expectedPayloadSha256: approval.payloadSha256,
    context: {
      canonicalRunId: approval.canonicalRunId,
      canonicalConversationId: approval.canonicalConversationId,
      originSurface: approval.originSurface,
      confirmationSurface: approval.confirmationSurface,
      channel: approval.channel,
    },
  });
}

/**
 * HPD-1285: every host reports the device's IANA time zone with every request,
 * read per request so it follows the customer when he travels; the Hey Control
 * Plane keeps it per workspace. Justus, 2026-10-17: Fin too, so a Finance host
 * (HODL, LiveQuote) sends it as well and the Fin BFF forwards it to the Plane.
 * A header the caller set itself is kept; a plain object stays a plain object,
 * so the host fetch sees the same shape as before.
 */
function withDeviceTimeZone(init: RequestInit | undefined): RequestInit | undefined {
  const zone = deviceTimeZone();
  if (!zone) return init;
  const headers = init?.headers;
  if (headers instanceof Headers || Array.isArray(headers)) {
    const merged = new Headers(headers);
    if (!merged.has(DEVICE_TIME_ZONE_HEADER)) merged.set(DEVICE_TIME_ZONE_HEADER, zone);
    return { ...init, headers: merged };
  }
  return { ...init, headers: { [DEVICE_TIME_ZONE_HEADER]: zone, ...(headers ?? {}) } };
}

/** Host supplied fetch is the only network capability of the shared native UI. */
export function createNativeR8Transport(options: {
  baseUrl: string;
  fetch: typeof fetch;
  identity: NativeR8ChannelIdentity;
}): NativeR8Transport {
  const nativeFetch: typeof fetch = (input, init) => options.fetch(
    input,
    withDeviceTimeZone(init?.credentials === "same-origin" ? { ...init, credentials: "omit" } : init),
  );
  const request = async (token: string, path: string, init: RequestInit = {}) => {
    const response = await nativeFetch(`${options.baseUrl}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...init.headers },
    });
    if (!response.ok) throw new Error(`The assistant request could not be completed (${response.status}).`);
    return response.status === 204 ? null : response.json();
  };
  const guidedSetup: NativeR8Transport["guidedSetup"] = async (token, mutation) => {
    const path = mutation?.kind === "choice" ? `/workspace/guided-setup/${mutation.connectionId}`
      : mutation?.kind === "gmail_recommendation" ? "/workspace/guided-setup/gmail-recommendation/action"
      : mutation?.kind === "skip" ? "/workspace/guided-setup/skip" : "/workspace/guided-setup";
    const response = await request(token, path, {
      method: mutation?.kind === "choice" || mutation?.kind === "gmail_recommendation" ? "PATCH" : mutation ? "POST" : "GET",
      body: mutation?.kind === "choice" ? JSON.stringify({ choice: mutation.choice })
        : mutation?.kind === "gmail_recommendation" ? JSON.stringify({ action: mutation.action }) : undefined,
    });
    return mutation ? guidedSetup(token) : response.state;
  };
  const listPendingFinanceActionApprovals: NativeR8Transport["listPendingFinanceActionApprovals"] = async ({ token, conversationSessionId }) => {
    const response = record(await request(
      token,
      `/tools/action-approvals?conversationId=${encodeURIComponent(conversationSessionId)}&surface=${encodeURIComponent(options.identity.surface)}`,
    ));
    if (response?.status !== "ok" || !Array.isArray(response.approvals)) {
      throw new Error("Pending Finance approvals could not be loaded.");
    }
    return response.approvals.map((approval) =>
      pendingFinanceApproval(approval, options.identity, conversationSessionId));
  };
  const decideFinanceActionApproval = async (
    token: string,
    approval: NativeFinanceActionApproval,
    decision: "confirm" | "cancel",
  ) => {
    await request(token, `/tools/action-approvals/${encodeURIComponent(approval.approvalId)}`, {
      method: "POST",
      body: approvalDecisionBody(approval, decision),
    });
  };
  return {
    createApiClient: (input) => createApiClient({ ...input, fetchImpl: nativeFetch }),
    createCanonicalClient: (input) => createNativeR8CanonicalController(
      createHermesApiClient({ ...input, fetchImpl: nativeFetch }), options.identity),
    createSupportClient: (input) => createSupportRequestClient({ ...input, fetchImpl: nativeFetch }),
    createAnonymousSupportClient: (input) => createAnonymousSupportRequestClient({ ...input, fetchImpl: nativeFetch }),
    fetchStream: nativeFetch,
    firstConversation: (token) => request(token, "/workspace/first-conversation"),
    guidedSetup,
    listPendingFinanceActionApprovals,
    confirmFinanceActionApproval: ({ token, approval }) =>
      decideFinanceActionApproval(token, approval, "confirm"),
    cancelFinanceActionApproval: ({ token, approval }) =>
      decideFinanceActionApproval(token, approval, "cancel"),
    reportLatency: async (token, runId, summary) => {
      await request(token, `/hermes/runs/${encodeURIComponent(runId)}/latency`, { method: "POST", body: JSON.stringify({ summary }) });
    },
  };
}
