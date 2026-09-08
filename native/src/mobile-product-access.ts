import type { AppSnapshot, Entitlement } from "../core/index";
import type { WorkspaceStatusTruthView } from "../core/status-truth";

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
