import type { AiConnectionSummary, ChatGptConnectionCompleteResponse, ProviderStatusView } from "./types";

type ChatGptConnectionSnapshot = {
  aiConnection: AiConnectionSummary;
  providerStatus: ProviderStatusView;
};

export function chatGptAccountConnectionView(snapshot: ChatGptConnectionSnapshot) {
  const provider = snapshot.providerStatus.providers.find((item) => item.id === "chatgpt_account");
  const ready = provider?.live === true && (provider.state === "active" || provider.state === "ready");
  const reconnectRequired = snapshot.aiConnection.configured && !ready;
  return {
    ready,
    reconnectRequired,
    action: ready ? "manage" as const : reconnectRequired ? "reconnect" as const : "connect" as const,
  };
}

export function shouldPollChatGptConnection(snapshot: ChatGptConnectionSnapshot, hasPendingConnection: boolean) {
  return hasPendingConnection && !chatGptAccountConnectionView(snapshot).ready;
}

export function chatGptConnectionCompletionOutcome(response: ChatGptConnectionCompleteResponse) {
  const connected = response.status === "approved";
  const terminal = response.status === "expired" || response.status === "error" || response.status === "blocked";
  return {
    connected,
    terminal,
    clearPollingSession: connected || terminal,
    action: connected ? "chat" as const : terminal ? "reconnect" as const : "wait" as const,
  };
}
