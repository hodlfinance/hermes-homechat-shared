import type { ChatRoutePreference, ModelOptionsView } from "./types";

const nanoUsdPerCent = 10_000_000n;

function nonNegativeNanoUsd(value: string | undefined) {
  if (!value || !/^\d+$/.test(value)) return null;
  try {
    return BigInt(value);
  } catch {
    return null;
  }
}

export function includedAllowanceRemainingPercent(options: ModelOptionsView | null) {
  const spend = options?.spend;
  if (!spend) return null;
  if (spend.cycleCapCents <= 0) return 0;
  const cycleUsedNanoUsd = nonNegativeNanoUsd(spend.cycleUsedNanoUsd);
  if (cycleUsedNanoUsd !== null) {
    const capNanoUsd = BigInt(Math.trunc(spend.cycleCapCents)) * nanoUsdPerCent;
    if (capNanoUsd <= 0n) return 0;
    const remainingNanoUsd = capNanoUsd > cycleUsedNanoUsd
      ? capNanoUsd - cycleUsedNanoUsd
      : 0n;
    // This is customer-facing settled consumption, not the admission-control
    // balance. Reservations still protect the hard cap in the budget/store
    // paths, but must not look like money already spent while a turn is live.
    // Percentage is the explicit display boundary. Round the aggregate once,
    // never each provider call or settlement row.
    return Number((remainingNanoUsd * 100n + capNanoUsd / 2n) / capNanoUsd);
  }
  return Math.max(0, Math.min(100, Math.floor(
    ((spend.cycleCapCents - spend.cycleUsedCents) / spend.cycleCapCents) * 100,
  )));
}

/**
 * The graphical symbol an AI Access option carries. A name, not an asset: the
 * surface picks its own icon for each. Deputized decision D9 -- a consistent
 * symbol set, never a licensed provider logo.
 */
export type AiAccessSymbol = ChatRoutePreference;

export type ChatRouteAutomationFollowState = "followed" | "failed" | "unknown";

/**
 * A saved route and the two Hey-managed automations have separate outcomes.
 * Older or malformed servers must never be treated as proof that the
 * automations followed the route.
 */
export function chatRouteAutomationFollowState(response: unknown): ChatRouteAutomationFollowState {
  if (!response || typeof response !== "object") return "unknown";
  const value = (response as { automationsFollowedRoute?: unknown }).automationsFollowedRoute;
  if (value === true) return "followed";
  if (value === false) return "failed";
  return "unknown";
}

/**
 * Which AI Access routes exist, and what the server currently knows about each.
 *
 * HPD-350: this used to carry a label, a description and a status word per
 * route, all of them German literals. Only the web ever rendered them, so an
 * English account read "Primär ChatGPT. Nur bei eindeutigem Kontingentende…"
 * under an otherwise English screen. Both clients say these things in the
 * customer's language from their own copy tables now — the app always did — so
 * what is shared is the shape of the answer, not one language's wording.
 */
export function aiAccessChoices(input: {
  options: ModelOptionsView | null;
  chatGptConnected: boolean;
  claudeState: "connected" | "not_connected" | "unavailable";
}) {
  const remainingPercent = includedAllowanceRemainingPercent(input.options);
  return [
    {
      value: "chatgpt_account" as const,
      symbol: "chatgpt_account" as const,
      connection: input.chatGptConnected ? ("connected" as const) : ("not_connected" as const),
    },
    {
      value: "claude_account" as const,
      symbol: "claude_account" as const,
      connection: input.claudeState === "connected"
        ? ("connected" as const)
        : input.claudeState === "unavailable"
          ? ("unknown" as const)
          : ("not_connected" as const),
    },
    {
      value: "included_ai" as const,
      symbol: "included_ai" as const,
      connection: "included" as const,
      managedModelName: input.options?.managedModelName ?? null,
      remainingPercent,
    },
  ] satisfies Array<{
    value: ChatRoutePreference;
    symbol: AiAccessSymbol;
    connection: "connected" | "not_connected" | "unknown" | "included";
    managedModelName?: string | null;
    remainingPercent?: number | null;
  }>;
}
