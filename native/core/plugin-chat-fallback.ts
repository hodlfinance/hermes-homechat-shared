import { chatSendIdempotencyKey, classifyChatSendOutcome, shouldRetryWithSameIdempotencyKey } from "./chat-send-reliability";

export const pluginChatFallbackProviders = ["slack", "stripe"] as const;
export type PluginChatFallbackProvider = (typeof pluginChatFallbackProviders)[number];

const fixedPrompts: Record<PluginChatFallbackProvider, string> = {
  slack: "Help me connect Slack to this Hey Hermes workspace. Start with the smallest supported setup path, explain the permissions before any change, and do not ask me to paste secrets into chat.",
  stripe: "Help me prepare a bounded Stripe connection for this Hey Hermes workspace. Do not move money or change billing, explain the permissions before any change, and do not ask me to paste secrets into chat.",
};

export interface PluginChatFallbackSend {
  (input: { message: string; idempotencyKey: string }): Promise<{ runId: string }>;
}

export interface PluginChatFallbackResult {
  runId: string;
  idempotencyKey: string;
}

export interface PluginChatFallbackController {
  send(provider: PluginChatFallbackProvider): Promise<PluginChatFallbackResult>;
  retry(): Promise<PluginChatFallbackResult>;
  pending(): { provider: PluginChatFallbackProvider; idempotencyKey: string } | null;
}

export class PluginChatFallbackProviderBusyError extends Error {
  readonly pendingProvider: PluginChatFallbackProvider;
  readonly requestedProvider: PluginChatFallbackProvider;

  constructor(pendingProvider: PluginChatFallbackProvider, requestedProvider: PluginChatFallbackProvider) {
    super(`A ${pendingProvider} setup request is still unconfirmed. Resolve or retry it before starting ${requestedProvider}.`);
    this.name = "PluginChatFallbackProviderBusyError";
    this.pendingProvider = pendingProvider;
    this.requestedProvider = requestedProvider;
  }
}

export function pluginChatFallbackPrompt(provider: PluginChatFallbackProvider) {
  return fixedPrompts[provider];
}

export function createPluginChatFallbackController(input: {
  randomUUID: () => string;
  send: PluginChatFallbackSend;
}): PluginChatFallbackController {
  let pendingAttempt: {
    provider: PluginChatFallbackProvider;
    idempotencyKey: string;
    request: Promise<PluginChatFallbackResult> | null;
  } | null = null;

  function execute(attempt: NonNullable<typeof pendingAttempt>) {
    if (attempt.request) return attempt.request;
    const request = input.send({
      message: pluginChatFallbackPrompt(attempt.provider),
      idempotencyKey: attempt.idempotencyKey,
    }).then((result) => {
      if (pendingAttempt === attempt) pendingAttempt = null;
      return { runId: result.runId, idempotencyKey: attempt.idempotencyKey };
    }).catch((error: unknown) => {
      const outcome = classifyChatSendOutcome({ error });
      attempt.request = null;
      if (!shouldRetryWithSameIdempotencyKey(outcome) && pendingAttempt === attempt) pendingAttempt = null;
      throw error;
    });
    attempt.request = request;
    return request;
  }

  return {
    send(provider) {
      if (pendingAttempt) {
        if (pendingAttempt.provider !== provider) {
          return Promise.reject(new PluginChatFallbackProviderBusyError(pendingAttempt.provider, provider));
        }
        return execute(pendingAttempt);
      }
      pendingAttempt = {
        provider,
        idempotencyKey: chatSendIdempotencyKey(input.randomUUID),
        request: null,
      };
      return execute(pendingAttempt);
    },
    retry() {
      if (!pendingAttempt) return Promise.reject(new Error("There is no unconfirmed plugin setup request to retry."));
      return execute(pendingAttempt);
    },
    pending() {
      return pendingAttempt
        ? { provider: pendingAttempt.provider, idempotencyKey: pendingAttempt.idempotencyKey }
        : null;
    },
  };
}
