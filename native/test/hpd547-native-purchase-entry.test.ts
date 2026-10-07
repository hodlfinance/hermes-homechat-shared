import assert from "node:assert/strict";
import test from "node:test";
import type { AppSnapshot, EntitlementStatus, WorkspaceRuntimeAccess } from "../core/index";
import type { WorkspaceStatusTruthView } from "../core/status-truth";
import { iosPaywallView } from "../src/ios-paywall";
import { mobileProductAccessScreen } from "../src/mobile-product-access";

const readyStatus = {
  account: { availability: "available", id: "account-1" },
  plan: { availability: "available" },
  server: { availability: "available", id: "guest-1", state: "ready", readiness: "ready", ready: true },
} as WorkspaceStatusTruthView;

function screen(input: {
  entitlementStatus: EntitlementStatus;
  runtimeAccess?: WorkspaceRuntimeAccess;
  comped?: boolean;
  status?: WorkspaceStatusTruthView | null;
  standalone?: boolean;
  ios?: boolean;
}) {
  const comped = input.comped ?? false;
  const paywall = iosPaywallView({
    locale: "en", plan: null, storeState: "unavailable", comped,
    entitlementStatus: input.entitlementStatus,
    runtimeAccess: input.runtimeAccess ?? "enabled",
  });
  return mobileProductAccessScreen({
    standalone: input.standalone ?? true,
    ios: input.ios ?? true,
    showPaywallOnboarding: paywall.showOnboarding,
    snapshot: {
      me: { id: "account-1" }, workspace: { id: "workspace-1" },
      entitlement: { status: input.entitlementStatus, comped },
    } as Pick<AppSnapshot, "me" | "workspace" | "entitlement">,
    status: input.status === undefined ? readyStatus : input.status,
  });
}

test("no subscription reaches purchase even with a ready guest and default enabled runtime access", () => {
  for (const entitlementStatus of ["none", "expired", "cancelled"] as const) {
    for (const runtimeAccess of ["enabled", "suspended"] as const) {
      assert.equal(screen({ entitlementStatus, runtimeAccess }), "purchase");
      assert.equal(screen({ entitlementStatus, runtimeAccess, status: null }), "purchase");
    }
  }
});

test("verified paid, trial, grace and complimentary access waits for the bound runtime", () => {
  for (const entitlement of [
    { entitlementStatus: "active" }, { entitlementStatus: "trialing" },
    { entitlementStatus: "grace_period" }, { entitlementStatus: "none", comped: true },
  ] as const) {
    assert.equal(screen(entitlement), "home");
    assert.equal(screen({ ...entitlement, status: null }), "preparing");
    assert.equal(screen({ ...entitlement, status: { ...readyStatus,
      server: { ...readyStatus.server, state: "provisioning", readiness: "setting_up", ready: false },
    } }), "preparing");
    assert.equal(screen({ ...entitlement, status: { ...readyStatus,
      account: { ...readyStatus.account, id: "other-account" },
    } }), "preparing");
  }
});

test("external hosts retain their own gate and non-iOS standalone retains its no-access state when it never paid", () => {
  assert.equal(screen({ entitlementStatus: "none", standalone: false, status: null }), "home");
  assert.equal(screen({ entitlementStatus: "active", standalone: false, status: null }), "home");
  assert.equal(screen({ entitlementStatus: "none", ios: false }), "no_access"); // HPD-1090: never paid, nothing is being prepared
  assert.equal(screen({ entitlementStatus: "active", ios: false }), "home");
});
