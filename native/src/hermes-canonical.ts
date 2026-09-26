import {
  chatRunEventFromHermesEvent,
  type createHermesApiClient,
  type ChatMessage,
  type ChatRun,
  type ChatRunStatus,
  type ConversationSession,
  type CreateChatRunRequest,
  type CreateHermesRunRequest,
  type HermesApiClientOptions,
  type HermesApiConversation,
  type HermesDelegatedTask,
  type HermesApiJob,
  type HermesApiMessage,
  type HermesApiRun,
  type HermesAutomationsView,
  type HermesRunEventsOptions,
} from "../core/index";
import { mobileHomeChatActiveRunRecovery, mobileRunIsForeground } from "./mobile-home-chat-startup";
import { mobileStopRunUnlessFinished } from "./mobile-stop-target";

export type NativeR8ChannelIdentity = {
  surface: "hey_hermes" | "finhermes";
  channel: "hey_hermes_mobile" | "hodl_mobile";
  allowedSurfaces: ("hey_hermes" | "finhermes")[];
};

type MobileHermesRequestContext = {
  signal?: AbortSignal;
};

type MobileHermesConversationQuery = {
  limit?: number;
  search?: string;
};

type MobileHermesMessageQuery = {
  before?: string;
  limit?: number;
};

function chatRunStatus(status: HermesApiRun["status"]): ChatRunStatus {
  return status === "waiting" ? "waiting_for_approval" : status;
}

function assertFullHeyConversation(conversation: HermesApiConversation, surface: NativeR8ChannelIdentity["surface"], expectedId?: string) {
  if (
    (expectedId && conversation.id !== expectedId) ||
    conversation.visibility !== "full" ||
    !conversation.allowedSurfaces.includes(surface)
  ) {
    throw new Error("Canonical Hermes response crossed the active conversation boundary.");
  }
}

export function mobileConversationSessionFromCanonical(
  conversation: HermesApiConversation,
): ConversationSession {
  return {
    id: conversation.id,
    workspaceId: conversation.workspaceId,
    title: conversation.title,
    role: conversation.role,
    status: conversation.status,
    surfaceOrigin: conversation.surfaceOrigin,
    channelOrigin: conversation.channelOrigin,
    sensitivity: conversation.sensitivity,
    allowedSurfaces: conversation.allowedSurfaces,
    messageCount: conversation.messageCount,
    lastMessageAt: conversation.lastMessageAt,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
    automationJobId: conversation.automationJobId ?? null,
    // HPD-924: only a count the plane stated; an older plane leaves it absent.
    ...(Number.isSafeInteger(conversation.unreadCount) && (conversation.unreadCount as number) >= 0
      ? { unreadCount: conversation.unreadCount }
      : {}),
  };
}

export function mobileChatMessageFromCanonical(message: HermesApiMessage): ChatMessage {
  return {
    id: message.id,
    runId: message.runId,
    conversationSessionId: message.conversationId,
    role: message.role,
    content: message.content,
    artifactReferences: message.artifactReferences,
    createdAt: message.createdAt,
  };
}

export function mobileChatRunFromCanonical(run: HermesApiRun): ChatRun {
  const events = (run.events ?? [])
    .map((event) => chatRunEventFromHermesEvent(event))
    .filter((event): event is NonNullable<typeof event> => Boolean(event));
  if (
    run.messages.some((message) => message.conversationId !== run.conversationId) ||
    events.some((event) => event.runId !== run.id)
  ) {
    throw new Error("Canonical Hermes run crossed the active conversation boundary.");
  }
  return {
    id: run.id,
    accountId: run.accountId,
    workspaceId: run.workspaceId,
    conversationSessionId: run.conversationId,
    runtimeRunId: run.runtimeRunId,
    status: chatRunStatus(run.status),
    surface: run.surface,
    channel: run.channel,
    sensitivity: run.sensitivity,
    contextReferences: run.contextReferences,
    requestedCapabilityFamilies: run.requestedCapabilityFamilies,
    sourceJobId: run.sourceJobId,
    sourceExecutionId: run.sourceExecutionId,
    messages: run.messages.map(mobileChatMessageFromCanonical),
    events,
    createdAt: run.createdAt,
    startedAt: run.startedAt,
    completedAt: run.completedAt,
  };
}

function matchesConversationSearch(conversation: HermesApiConversation, search?: string) {
  const query = search?.trim().toLowerCase();
  return !query || conversation.title.toLowerCase().includes(query);
}

function mobileConversationSessions(
  conversations: HermesApiConversation[],
  search?: string,
  surface: NativeR8ChannelIdentity["surface"] = "hey_hermes",
): ConversationSession[] {
  return conversations
    .filter((conversation) =>
      conversation.visibility === "full" &&
      conversation.allowedSurfaces.includes(surface) &&
      matchesConversationSearch(conversation, search),
    )
    .map(mobileConversationSessionFromCanonical);
}

function automationStatus(job: HermesApiJob) {
  if (!job.enabled || job.state.toLowerCase() === "paused") return "paused" as const;
  return job.state ? "active" as const : "unknown" as const;
}

function automationDelivery(delivery: HermesApiJob["deliver"]): string | null {
  if (typeof delivery === "string") return delivery.trim() || null;
  if (delivery === null) return null;
  try {
    return JSON.stringify(delivery);
  } catch {
    return null;
  }
}

export function mobileAutomationsViewFromCanonical(
  jobs: HermesApiJob[],
  updatedAt = new Date().toISOString(),
): HermesAutomationsView {
  return {
    source: "hermes_cron",
    label: "Automations",
    message: jobs.length
      ? `${jobs.length} Hermes automation${jobs.length === 1 ? "" : "s"} loaded.`
      : "No Hermes automations are saved yet.",
    updatedAt,
    jobs: jobs.map((job) => ({
      id: job.id,
      title: job.name,
      status: automationStatus(job),
      schedule: job.scheduleDisplay || "Schedule saved in Hermes",
      nextRunAt: job.nextRunAt,
      lastRunAt: job.lastRunAt,
      delivery: automationDelivery(job.deliver),
      summary: job.prompt.trim() || null,
    })),
  };
}

export function createNativeR8CanonicalController(
  client: ReturnType<typeof createHermesApiClient>,
  identity: NativeR8ChannelIdentity,
) {
  const { surface: heyHermesMobileSurface, channel: heyHermesMobileChannel } = identity;
  const conversationByRunId = new Map<string, string>();

  function rememberRun(run: HermesApiRun, expectedConversationId?: string) {
    const knownConversationId = conversationByRunId.get(run.id);
    if (
      (expectedConversationId && run.conversationId !== expectedConversationId) ||
      (knownConversationId && run.conversationId !== knownConversationId)
    ) {
      throw new Error("Canonical Hermes run crossed the active conversation boundary.");
    }
    conversationByRunId.set(run.id, run.conversationId);
    return mobileChatRunFromCanonical(run);
  }

  async function activeRuns(context: MobileHermesRequestContext = {}) {
    const response = await client.listRuns({
      active: true,
      channel: heyHermesMobileChannel,
      limit: 20,
      surface: heyHermesMobileSurface,
    }, context);
    return response.runs.map((run) => {
      if (
        run.surface !== heyHermesMobileSurface ||
        run.channel !== heyHermesMobileChannel
      ) {
        throw new Error("Canonical Hermes run did not retain the mobile surface binding.");
      }
      if (run.messages.some((message) => message.conversationId !== run.conversationId)) {
        throw new Error("Canonical Hermes active run crossed the active conversation boundary.");
      }
      return rememberRun(run, run.conversationId);
    });
  }

  async function canonicalConversations(
    query: { limit?: number } = {},
    context: MobileHermesRequestContext = {},
  ) {
    return client.listConversations({
      surface: heyHermesMobileSurface,
      limit: query.limit,
    }, context);
  }

  return {
    conversationSessions: async (
      query: MobileHermesConversationQuery = {},
      context: MobileHermesRequestContext = {},
    ) => {
      const response = await canonicalConversations({ limit: query.limit }, context);
      return mobileConversationSessions(response.conversations, query.search, identity.surface);
    },
    createConversation: async (
      body: { title?: string } = {},
      context: MobileHermesRequestContext = {},
    ) => {
      const response = await client.createConversation({
        ...body,
        allowedSurfaces: identity.allowedSurfaces,
        surface: heyHermesMobileSurface,
        channel: heyHermesMobileChannel,
      }, context);
      assertFullHeyConversation(response.conversation, identity.surface);
      if (response.conversation.channelOrigin !== heyHermesMobileChannel) {
        throw new Error("Canonical Hermes conversation did not retain the mobile channel binding.");
      }
      return mobileConversationSessionFromCanonical(response.conversation);
    },
    archiveConversation: async (
      conversationId: string,
      context: MobileHermesRequestContext = {},
    ) => {
      const response = await client.archiveConversation(conversationId, context);
      if (response.conversation.id !== conversationId || response.conversation.status !== "archived") {
        throw new Error("Canonical Hermes did not delete that thread.");
      }
      return mobileConversationSessionFromCanonical(response.conversation);
    },
    /**
     * HPD-924. Acknowledges the newest message the client rendered in this
     * conversation. A response for another conversation is refused, so a
     * crossed reply can never clear a different thread's badge.
     */
    markConversationRead: async (
      conversationId: string,
      messageId: string,
      context: MobileHermesRequestContext = {},
    ) => {
      const response = await client.markConversationRead(conversationId, {
        messageId,
        surface: heyHermesMobileSurface,
      }, context);
      assertFullHeyConversation(response.conversation, identity.surface, conversationId);
      return mobileConversationSessionFromCanonical(response.conversation);
    },
    messages: async (
      conversationId: string,
      query: MobileHermesMessageQuery = {},
      context: MobileHermesRequestContext = {},
    ) => {
      const response = await client.messages(conversationId, {
        surface: heyHermesMobileSurface,
        before: query.before,
        limit: query.limit,
      }, context);
      assertFullHeyConversation(response.conversation, identity.surface, conversationId);
      if (response.messages.some((message) => message.conversationId !== conversationId)) {
        throw new Error("Canonical Hermes messages crossed the active conversation boundary.");
      }
      return {
        conversation: mobileConversationSessionFromCanonical(response.conversation),
        messages: response.messages.map(mobileChatMessageFromCanonical),
        nextBefore: response.nextBefore,
      };
    },
    createRun: async (
      request: CreateChatRunRequest,
      context: MobileHermesRequestContext = {},
    ) => {
      const body: CreateHermesRunRequest & Pick<CreateChatRunRequest, "attachments"> = {
        message: request.message,
        ...(request.conversationSessionId ? { conversationId: request.conversationSessionId } : {}),
        ...(!request.conversationSessionId
          ? { allowedSurfaces: identity.allowedSurfaces }
          : {}),
        ...(request.attachments ? { attachments: request.attachments } : {}),
        ...(request.connectionSetupIntent ? { connectionSetupIntent: request.connectionSetupIntent } : {}),
        surface: heyHermesMobileSurface,
        channel: heyHermesMobileChannel,
      };
      const response = await client.createRun(body, {
        signal: context.signal,
        idempotencyKey: request.idempotencyKey,
      });
      if (
        response.run.surface !== heyHermesMobileSurface ||
        response.run.channel !== heyHermesMobileChannel
      ) {
        throw new Error("Canonical Hermes run did not retain the mobile surface binding.");
      }
      return rememberRun(response.run, request.conversationSessionId);
    },
    run: async (runId: string, context: MobileHermesRequestContext = {}) => {
      const response = await client.run(runId, context);
      return rememberRun(response.run);
    },
    activeRuns: (context: MobileHermesRequestContext = {}) => activeRuns(context),
    activeRun: async (
      query: { conversationId?: string } = {},
      context: MobileHermesRequestContext = {},
    ) => {
      const response = await canonicalConversations({ limit: 100 }, context);
      const conversations = response.conversations.filter((conversation) =>
        conversation.visibility === "full" &&
        conversation.allowedSurfaces.includes(identity.surface),
      );
      const activeConversation = query.conversationId
        ? conversations.find((conversation) => conversation.id === query.conversationId && conversation.activeRunId)
        : conversations.find((conversation) => conversation.activeRunId);
      if (!activeConversation?.activeRunId) return null;
      const runResponse = await client.run(activeConversation.activeRunId, context);
      if (
        runResponse.run.conversationId !== activeConversation.id ||
        runResponse.run.messages.some((message) => message.conversationId !== activeConversation.id)
      ) {
        throw new Error("Canonical Hermes active run crossed the active conversation boundary.");
      }
      const run = rememberRun(runResponse.run, activeConversation.id);
      // A helper run is the foreground of its own sub-chat, so opening that
      // sub-chat names it; with no chat named it stays background work.
      if (mobileRunIsForeground(run, query.conversationId ?? null)) return run;
      // HPD-871: the conversation's active run is the oldest running one on the
      // plane, a scheduled job or a background delivery included. That run is
      // not the customer's reply; his own run, if any, is found among the
      // active runs of the same conversation.
      const recovery = mobileHomeChatActiveRunRecovery(await activeRuns(context), activeConversation.id);
      return recovery.primaryRun;
    },
    delegatedTasks: async (context: MobileHermesRequestContext = {}): Promise<HermesDelegatedTask[]> => {
      const response = await client.delegatedTasks({ surface: heyHermesMobileSurface }, context);
      for (const task of response.tasks) {
        if (!task.taskId || !task.name || !task.conversationId || !task.sourceRunId) {
          throw new Error("Canonical Hermes delegated task response is incomplete.");
        }
      }
      return response.tasks;
    },
    stopDelegatedTask: async (taskId: string, context: MobileHermesRequestContext = {}) => {
      const response = await client.stopDelegatedTask(taskId, { surface: heyHermesMobileSurface }, context);
      if (!response.task.taskId || !response.task.conversationId) {
        throw new Error("Canonical Hermes delegated task stop response is incomplete.");
      }
      return response.task;
    },
    // HPD-871: every stop from the chat passes here. A run that has already
    // finished is returned as read, and no stop is sent to it.
    stopRun: async (runId: string, context: MobileHermesRequestContext = {}) => {
      const outcome = await mobileStopRunUnlessFinished(runId, {
        readRun: async (id) => (await client.run(id, context)).run,
        stopRun: async (id) => (await client.stopRun(id, context)).run,
      });
      return rememberRun(outcome.run);
    },
    runEventsResponse: (runId: string, options: HermesRunEventsOptions = {}) =>
      client.runEventsResponse(runId, options),
    automations: async (context: MobileHermesRequestContext = {}) => {
      const response = await client.jobs(context);
      return mobileAutomationsViewFromCanonical(response.jobs);
    },
  };
}
