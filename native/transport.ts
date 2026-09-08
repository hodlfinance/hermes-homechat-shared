import { createApiClient, createHermesApiClient } from "./core/index";
import { createSupportRequestClient, createAnonymousSupportRequestClient } from "./core/support-request";
import { createNativeR8CanonicalController, type NativeR8ChannelIdentity } from "./src/hermes-canonical";
import type { NativeR8Transport } from "./host";

/** Host supplied fetch is the only network capability of the shared native UI. */
export function createNativeR8Transport(options: {
  baseUrl: string;
  fetch: typeof fetch;
  identity: NativeR8ChannelIdentity;
}): NativeR8Transport {
  const request = async (token: string, path: string, init: RequestInit = {}) => {
    const response = await options.fetch(`${options.baseUrl}${path}`, {
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
  return {
    createApiClient: (input) => createApiClient({ ...input, fetchImpl: options.fetch }),
    createCanonicalClient: (input) => createNativeR8CanonicalController(
      createHermesApiClient({ ...input, fetchImpl: options.fetch }), options.identity),
    createSupportClient: (input) => createSupportRequestClient({ ...input, fetchImpl: options.fetch }),
    createAnonymousSupportClient: (input) => createAnonymousSupportRequestClient({ ...input, fetchImpl: options.fetch }),
    fetchStream: options.fetch,
    firstConversation: (token) => request(token, "/workspace/first-conversation"),
    guidedSetup,
    reportLatency: async (token, runId, summary) => {
      await request(token, `/hermes/runs/${encodeURIComponent(runId)}/latency`, { method: "POST", body: JSON.stringify(summary) });
    },
  };
}
