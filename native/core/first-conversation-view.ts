import type { GuidedSetupState } from "./guided-setup";

export interface FirstConversationOffer {
  provider: string;
  choice: "declined" | "connected" | null;
}

export interface FirstConversationSnapshot {
  phase: "greeting" | "conversing" | "connections";
  exchanges: number;
  connections: FirstConversationOffer[];
}

export interface FirstConversationView {
  showGreeting: boolean;
  showConnectionCard: boolean;
}

export function firstConversationView(
  snapshot: FirstConversationSnapshot,
  visibleMessageCount: number,
  guidedSetup: GuidedSetupState | null = null,
): FirstConversationView {
  return {
    // The greeting is a canonical persisted assistant message. Clients must
    // never draw a second local greeting card in the empty state.
    showGreeting: false,
    showConnectionCard: snapshot.phase === "connections" && visibleMessageCount === 0 && (guidedSetup
      ? !guidedSetup.skipped && guidedSetup.connections.some((connection) => connection.choice === "undecided")
      : snapshot.connections.some((offer) => offer.choice === null)),
  };
}
