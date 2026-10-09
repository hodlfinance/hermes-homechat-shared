import type { AppSnapshot, Entitlement } from "../core/index";
import { workspaceStatusTruthCapacityRefusal, type WorkspaceStatusTruthView } from "../core/status-truth";

const accessStatuses = new Set<Entitlement["status"]>([
  "active",
  "trialing",
  "grace_period",
]);

export function hasValidMobileProductAccess(
  entitlement: Pick<Entitlement, "status" | "comped">,
) {
  return entitlement.comped === true || accessStatuses.has(entitlement.status);
}

export function isMobileAccountFullyReady(
  snapshot: Pick<AppSnapshot, "me" | "workspace" | "entitlement">,
  status: WorkspaceStatusTruthView | null,
) {
  return Boolean(
    hasValidMobileProductAccess(snapshot.entitlement) &&
      status?.account.availability === "available" &&
      status.account.id === snapshot.me.id &&
      status.plan.availability === "available" &&
      status.server.availability === "available" &&
      status.server.id &&
      status.server.state === "ready" &&
      status.server.readiness === "ready" &&
      status.server.ready === true,
  );
}

export function mobileProductAccessScreen(input: {
  standalone: boolean;
  ios: boolean;
  showPaywallOnboarding: boolean;
  snapshot: Pick<AppSnapshot, "me" | "workspace" | "entitlement" | "serverDeletion">;
  status: WorkspaceStatusTruthView | null;
}): "purchase" | "no_access" | "deleted" | "preparing" | "home" {
  if (!input.standalone) return "home";
  // HPD-1106: the Owner deleted the server. Nothing is being set up (the deletion fences
  // provisioning), so neither the preparing screen nor the paywall: the deleted screen, which
  // offers a fresh server while the subscription runs and the account entry once it has ended.
  if (input.snapshot.serverDeletion?.state === "deleted") return "deleted";
  // Buying access must remain possible before the private runtime is ready.
  if (input.ios && input.showPaywallOnboarding) return "purchase";
  // HPD-1090: an account that never paid has nothing being prepared (Android,
  // or iOS without the paywall). It must not see the preparing screen and its
  // ready-email promise.
  if (!hasValidMobileProductAccess(input.snapshot.entitlement)) return "no_access";
  return isMobileAccountFullyReady(input.snapshot, input.status) ? "home" : "preparing";
}

/**
 * HPD-823: which copy the pending-access modal shows. "capacity" only while
 * the status truth carries `server.capacityRefusal`; otherwise the unchanged
 * pending copy.
 */
export function mobilePendingAccessVariant(
  status: WorkspaceStatusTruthView | null,
): "pending" | "capacity" {
  return workspaceStatusTruthCapacityRefusal(status) ? "capacity" : "pending";
}
