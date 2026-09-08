import type { RuntimeReadiness } from "./types";

/** Shared Web/Mobile projection for a provider route bound to canonical runtime readiness. */
export function runtimeBoundAccessView(
  runtime: RuntimeReadiness,
  providerReady: boolean,
  providerWaitingHint: string,
) {
  const ready = providerReady && runtime.canChat;
  return {
    ready,
    waitingHint: runtime.canChat ? providerWaitingHint : runtime.message,
    statusValue: ready ? "Ready" : runtime.canChat ? "Setting up" : runtime.statusLabel,
  };
}
