export type MobileAiAccessRoute = "chatgpt_account" | "claude_account" | "included_ai";
export type MobileAiAccessProviderRoute = Exclude<MobileAiAccessRoute, "included_ai">;

export type MobileAiAccessProviderConnectionTruth = "connected" | "not_connected" | "unknown";
export type MobileAiAccessIncludedTruth = "confirmed" | "unavailable" | "unknown";

/**
 * Server-observed facts stay independent: selecting a route does not connect a
 * provider, and an Included-AI preference is not usable until the refreshed
 * server contract confirms it.
 */
export type MobileAiAccessTruth = {
  readonly selectedRoute: MobileAiAccessRoute | null;
  readonly providers: Readonly<Record<MobileAiAccessProviderRoute, MobileAiAccessProviderConnectionTruth>>;
  readonly included: MobileAiAccessIncludedTruth;
};

export type MobileAiAccessActionOutcome =
  | "prepared"
  | "connected"
  | "preference_only"
  | "cancelled"
  | "provider_error"
  | "link_error"
  | "unknown";

export type MobileAiAccessActionResult = {
  readonly kind: "success" | "cancelled" | "provider_error" | "link_error" | "unknown";
  readonly route: MobileAiAccessRoute;
};

export type MobileAiAccessState = {
  readonly busyRoute: MobileAiAccessRoute | null;
  readonly result: MobileAiAccessActionResult | null;
};

export const initialMobileAiAccessState: MobileAiAccessState = Object.freeze({
  busyRoute: null,
  result: null,
});

export function mobileAiAccessBegin(
  _state: MobileAiAccessState,
  route: MobileAiAccessRoute,
): MobileAiAccessState {
  return { busyRoute: route, result: null };
}

export function mobileAiAccessSettled(
  state: MobileAiAccessState,
  result: MobileAiAccessActionResult,
): MobileAiAccessState {
  // A newer tap owns the single busy row. A late result from the prior row may
  // not clear or replace it.
  if (state.busyRoute !== result.route) return state;
  return { busyRoute: null, result };
}

function providerConnected(truth: MobileAiAccessTruth, route: MobileAiAccessProviderRoute) {
  return truth.providers[route] === "connected";
}

export function mobileAiAccessRowState(
  state: MobileAiAccessState,
  truth: MobileAiAccessTruth,
  route: MobileAiAccessRoute,
) {
  const connected = route === "included_ai" ? false : providerConnected(truth, route);
  const confirmed = route === "included_ai" ? truth.included === "confirmed" : connected;
  return {
    active: truth.selectedRoute === route && confirmed,
    busy: state.busyRoute === route,
    connected,
  };
}

/**
 * Whether independent authoritative truth permits the route-persistence step.
 * The outcome never supplies connection truth by itself. In particular,
 * opening OAuth is only a prepared authorization and a preference response is
 * useful only when refreshed server truth independently confirms the route.
 */
export function mobileAiAccessCanPersistPreference(
  route: MobileAiAccessRoute,
  outcome: MobileAiAccessActionOutcome,
  truth: MobileAiAccessTruth,
) {
  if (outcome !== "connected" && outcome !== "preference_only") return false;
  if (route === "included_ai") {
    return outcome === "preference_only" && truth.included === "confirmed";
  }
  return providerConnected(truth, route);
}

export function mobileAiAccessActionResult(
  route: MobileAiAccessRoute,
  outcome: MobileAiAccessActionOutcome,
  refreshedTruth: MobileAiAccessTruth,
): MobileAiAccessActionResult {
  if (outcome === "cancelled" || outcome === "provider_error" || outcome === "link_error") {
    return { kind: outcome, route };
  }
  if (outcome === "connected" && route !== "included_ai" && providerConnected(refreshedTruth, route)) {
    return { kind: "success", route };
  }
  if (
    outcome === "preference_only" &&
    mobileAiAccessRowState(initialMobileAiAccessState, refreshedTruth, route).active
  ) {
    return { kind: "success", route };
  }
  return { kind: "unknown", route };
}
