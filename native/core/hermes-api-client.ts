import { parseHermesEventStream } from "./hermes-channel";
import type { CreateHermesRunRequest } from "./hermes-channel";
import type {
  CreateHermesConversationRequest,
  CreateHermesJobRequest,
  CreateHermesRunResponse,
  HermesConversationListResponse,
  HermesConversationResponse,
  HermesDelegatedTaskResponse,
  HermesDelegatedTasksResponse,
  HermesJobResponse,
  HermesJobRunResponse,
  HermesJobsResponse,
  HermesMessagesResponse,
  HermesRunResponse,
  HermesRunsResponse,
  UpdateHermesJobRequest,
} from "./hermes-api";

export type HermesApiClientOptions = {
  baseUrl: string;
  token?: string;
  fetchImpl?: typeof fetch;
};

export type HermesRequestOptions = {
  signal?: AbortSignal;
};

export type HermesRunCreateOptions = HermesRequestOptions & {
  idempotencyKey?: string;
};

export type HermesRunEventsOptions = HermesRequestOptions & {
  lastEventId?: string | null;
};

export type HermesMutationOptions = HermesRequestOptions & {
  idempotencyKey: string;
};

export function createHermesApiClient({ baseUrl, token = "", fetchImpl = fetch }: HermesApiClientOptions) {
  const root = baseUrl.replace(/\/$/, "");

  const headers = (extra?: HeadersInit) => ({
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  });

  async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const response = await fetchImpl(`${root}${path}`, {
      ...init,
      headers: headers({
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...(init.headers ?? {}),
      }),
    });
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      try {
        const parsed = JSON.parse(text) as { error?: unknown; message?: unknown };
        throw new Error(
          typeof parsed.error === "string"
            ? parsed.error
            : typeof parsed.message === "string"
              ? parsed.message
              : `Hermes API returned ${response.status}.`,
        );
      } catch (error) {
        if (error instanceof SyntaxError) throw new Error(text || `Hermes API returned ${response.status}.`);
        throw error;
      }
    }
    if (response.status === 204) return undefined as T;
    return (await response.json()) as T;
  }

  const runEventsResponse = (runId: string, options: HermesRunEventsOptions = {}) =>
    fetchImpl(`${root}/hermes/runs/${encodeURIComponent(runId)}/events`, {
      signal: options.signal,
      headers: headers({
        Accept: "text/event-stream",
        ...(options.lastEventId ? { "Last-Event-ID": options.lastEventId } : {}),
      }),
    });

  return {
    listConversations: (
      query: { surface?: string; limit?: number } = {},
      options: HermesRequestOptions = {},
    ) => {
      const params = new URLSearchParams();
      if (query.surface) params.set("surface", query.surface);
      if (query.limit) params.set("limit", String(query.limit));
      const suffix = params.size ? `?${params.toString()}` : "";
      return request<HermesConversationListResponse>(`/hermes/conversations${suffix}`, {
        signal: options.signal,
      });
    },
    createConversation: (
      body: CreateHermesConversationRequest = {},
      options: HermesRequestOptions = {},
    ) =>
      request<HermesConversationResponse>("/hermes/conversations", {
        method: "POST",
        body: JSON.stringify(body),
        signal: options.signal,
      }),
    messages: (
      conversationId: string,
      query: { surface?: string; before?: string; limit?: number } = {},
      options: HermesRequestOptions = {},
    ) => {
      const params = new URLSearchParams();
      if (query.surface) params.set("surface", query.surface);
      if (query.before) params.set("before", query.before);
      if (query.limit) params.set("limit", String(query.limit));
      const suffix = params.size ? `?${params.toString()}` : "";
      return request<HermesMessagesResponse>(
        `/hermes/conversations/${encodeURIComponent(conversationId)}/messages${suffix}`,
        { signal: options.signal },
      );
    },
    createRun: (body: CreateHermesRunRequest, options: HermesRunCreateOptions = {}) =>
      request<CreateHermesRunResponse>("/hermes/runs", {
        method: "POST",
        headers: options.idempotencyKey ? { "Idempotency-Key": options.idempotencyKey } : undefined,
        body: JSON.stringify(body),
        signal: options.signal,
      }),
    run: (runId: string, options: HermesRequestOptions = {}) =>
      request<HermesRunResponse>(`/hermes/runs/${encodeURIComponent(runId)}`, {
        signal: options.signal,
      }),
    listRuns: (
      query: { active: true; channel?: string; limit?: number; surface?: string },
      options: HermesRequestOptions = {},
    ) => {
      const params = new URLSearchParams({ active: "true" });
      if (query.surface) params.set("surface", query.surface);
      if (query.channel) params.set("channel", query.channel);
      if (query.limit) params.set("limit", String(query.limit));
      return request<HermesRunsResponse>(`/hermes/runs?${params.toString()}`, {
        signal: options.signal,
      });
    },
    runEventsResponse,
    async runEvents(runId: string, options: HermesRunEventsOptions = {}) {
      const response = await runEventsResponse(runId, options);
      if (!response.ok) throw new Error(`Hermes events API returned ${response.status}.`);
      return parseHermesEventStream(await response.text());
    },
    stopRun: (runId: string, options: HermesRequestOptions = {}) =>
      request<HermesRunResponse>(`/hermes/runs/${encodeURIComponent(runId)}/stop`, {
        method: "POST",
        signal: options.signal,
      }),
    delegatedTasks: (
      query: { surface?: string } = {},
      options: HermesRequestOptions = {},
    ) => {
      const params = new URLSearchParams({ recent: "true" });
      if (query.surface) params.set("surface", query.surface);
      return request<HermesDelegatedTasksResponse>(`/hermes/delegated-tasks?${params.toString()}`, {
        signal: options.signal,
      });
    },
    stopDelegatedTask: (
      taskId: string,
      query: { surface?: string } = {},
      options: HermesRequestOptions = {},
    ) => {
      const params = new URLSearchParams();
      if (query.surface) params.set("surface", query.surface);
      const suffix = params.size ? `?${params.toString()}` : "";
      return request<HermesDelegatedTaskResponse>(
        `/hermes/delegated-tasks/${encodeURIComponent(taskId)}/stop${suffix}`,
        { method: "POST", signal: options.signal },
      );
    },
    jobs: (options: HermesRequestOptions = {}) =>
      request<HermesJobsResponse>("/hermes/jobs", { signal: options.signal }),
    job: (jobId: string, options: HermesRequestOptions = {}) =>
      request<HermesJobResponse>(`/hermes/jobs/${encodeURIComponent(jobId)}`, {
        signal: options.signal,
      }),
    createJob: (body: CreateHermesJobRequest, options: HermesMutationOptions) =>
      request<HermesJobResponse>("/hermes/jobs", {
        method: "POST",
        headers: { "Idempotency-Key": options.idempotencyKey },
        body: JSON.stringify(body),
        signal: options.signal,
      }),
    updateJob: (jobId: string, body: UpdateHermesJobRequest, options: HermesMutationOptions) =>
      request<HermesJobResponse>(`/hermes/jobs/${encodeURIComponent(jobId)}`, {
        method: "PATCH",
        headers: { "Idempotency-Key": options.idempotencyKey },
        body: JSON.stringify(body),
        signal: options.signal,
      }),
    pauseJob: (jobId: string, options: HermesRequestOptions = {}) =>
      request<HermesJobResponse>(`/hermes/jobs/${encodeURIComponent(jobId)}/pause`, {
        method: "POST",
        signal: options.signal,
      }),
    resumeJob: (jobId: string, options: HermesRequestOptions = {}) =>
      request<HermesJobResponse>(`/hermes/jobs/${encodeURIComponent(jobId)}/resume`, {
        method: "POST",
        signal: options.signal,
      }),
    runJob: (jobId: string, options: HermesMutationOptions) =>
      request<HermesJobRunResponse>(`/hermes/jobs/${encodeURIComponent(jobId)}/run`, {
        method: "POST",
        headers: { "Idempotency-Key": options.idempotencyKey },
        signal: options.signal,
      }),
    deleteJob: (jobId: string, options: HermesMutationOptions) =>
      request<void>(`/hermes/jobs/${encodeURIComponent(jobId)}`, {
        method: "DELETE",
        headers: { "Idempotency-Key": options.idempotencyKey },
        signal: options.signal,
      }),
  };
}
