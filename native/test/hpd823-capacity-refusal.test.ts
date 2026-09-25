import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  parseWorkspaceStatusTruth,
  workspaceStatusTruthCapacityRefusal,
  workspaceStatusTruthRequest,
  workspaceStatusTruthSchemaVersion,
  type WorkspaceStatusTruthView,
} from "../core/status-truth";
import { appLocales } from "../core/types";
import { mobilePendingAccessCopy } from "../src/appI18n";
import { mobilePendingAccessVariant } from "../src/mobile-product-access";

// HPD-823: when the Firecracker host is at capacity the plane adds an optional
// `server.capacityRefusal` to /workspace/status-truth. The app must show an
// honest capacity state instead of "access is being prepared" forever, while
// payloads without the field behave exactly as before.

const NOW = "2026-09-25T10:00:00.000Z";

function statusTruth(server: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    schemaVersion: workspaceStatusTruthSchemaVersion,
    generatedAt: NOW,
    account: {
      availability: "available",
      observedAt: NOW,
      id: "acct_synthetic",
      name: null,
      email: null,
      role: "owner",
      status: "active",
      createdAt: null,
      lastLoginAt: null,
    },
    plan: {
      availability: "available",
      observedAt: NOW,
      status: "active",
      plan: "personal",
      usagePoolPlan: "personal",
      comped: false,
      provider: "app_store",
      trialEndsAt: null,
      renewsAt: null,
      gracePeriodEndsAt: null,
      cancelledAt: null,
      expiresAt: null,
    },
    aiAccess: {
      availability: "available",
      observedAt: NOW,
      selectedRoute: null,
      activeProviderId: null,
      routingMode: null,
      selectedModelId: null,
      selectedModelName: null,
      managedModelName: null,
      modelChoices: [],
      remainingIncludedPercent: null,
      cycleResetAt: null,
      providers: [],
    },
    server: {
      availability: "available",
      observedAt: NOW,
      id: null,
      kind: "unresolved",
      provider: null,
      state: "provisioning",
      readiness: "setting_up",
      ready: false,
      statusLabel: "Setting up",
      message: "Your workspace is being prepared.",
      region: null,
      serverType: null,
      backupsEnabled: null,
      ...server,
    },
    security: {
      availability: "available",
      observedAt: NOW,
      runtimeAccess: null,
      adminHandoverStatus: null,
      standingAccessStatus: null,
      activeSupportGrantCount: null,
      infrastructureStatus: null,
      latestAuditSealedAt: null,
    },
    capabilities: {
      availability: "available",
      observedAt: NOW,
      hostingMode: null,
      runtimeAccess: null,
      items: [],
    },
  };
}

const refusal = { reason: "host_at_capacity", recordedAt: NOW };

test("a payload without capacityRefusal parses unchanged", () => {
  const payload = statusTruth();
  const view = parseWorkspaceStatusTruth(payload);
  assert.ok(view);
  assert.deepEqual(view, payload);
  assert.equal("capacityRefusal" in view.server, false);
  assert.equal(workspaceStatusTruthCapacityRefusal(view), null);
});

test("a well-formed capacityRefusal is kept and read", () => {
  const view = parseWorkspaceStatusTruth(statusTruth({ capacityRefusal: refusal }));
  assert.ok(view);
  assert.deepEqual(view.server.capacityRefusal, refusal);
  assert.deepEqual(workspaceStatusTruthCapacityRefusal(view), refusal);
});

test("a malformed capacityRefusal is dropped and the rest still parses", () => {
  for (const malformed of [null, "full", 1, [], {}, { reason: "host_at_capacity" }, { reason: 1, recordedAt: NOW }, { recordedAt: NOW }]) {
    const view = parseWorkspaceStatusTruth(statusTruth({ capacityRefusal: malformed }));
    assert.ok(view, JSON.stringify(malformed));
    assert.equal("capacityRefusal" in view.server, false, JSON.stringify(malformed));
    assert.equal(workspaceStatusTruthCapacityRefusal(view), null);
    assert.equal(view.server.state, "provisioning");
  }
});

test("unknown extra fields stay tolerated and enums stay as strict as before", () => {
  const extra = statusTruth({ capacityRefusal: { ...refusal, slotsFree: 0 }, futureField: true });
  const view = parseWorkspaceStatusTruth({ ...extra, futureSection: {} });
  assert.ok(view);
  assert.deepEqual(workspaceStatusTruthCapacityRefusal(view), refusal);
  // No new enum value was introduced: an unknown server state still fails as before.
  assert.equal(parseWorkspaceStatusTruth(statusTruth({ state: "at_capacity" })), null);
});

test("the status request drops a malformed refusal instead of failing", async () => {
  const bodies = [statusTruth({ capacityRefusal: "full" }), statusTruth({ capacityRefusal: refusal })];
  const client = {
    baseUrl: "https://heyhermes.test/api",
    token: "test-session",
    fetchImpl: (async () => new Response(JSON.stringify(bodies.shift()), { headers: { "content-type": "application/json" } })) as typeof fetch,
  };
  const malformed = await workspaceStatusTruthRequest(client);
  assert.equal("capacityRefusal" in malformed.server, false);
  const refused = await workspaceStatusTruthRequest(client);
  assert.deepEqual(refused.server.capacityRefusal, refusal);
});

test("the modal chooses the capacity copy only when the refusal is present", () => {
  const plain = parseWorkspaceStatusTruth(statusTruth()) as WorkspaceStatusTruthView;
  const refused = parseWorkspaceStatusTruth(statusTruth({ capacityRefusal: refusal })) as WorkspaceStatusTruthView;
  assert.equal(mobilePendingAccessVariant(null), "pending");
  assert.equal(mobilePendingAccessVariant(plain), "pending");
  assert.equal(mobilePendingAccessVariant(refused), "capacity");

  assert.deepEqual(mobilePendingAccessCopy("en", mobilePendingAccessVariant(plain)), mobilePendingAccessCopy("en"));
  assert.equal(mobilePendingAccessCopy("en").title, "Your access is being prepared");
  assert.equal(mobilePendingAccessCopy("de").title, "Dein Zugang wird vorbereitet");

  const en = mobilePendingAccessCopy("en", mobilePendingAccessVariant(refused));
  assert.equal(`${en.title} – ${en.body}`, "We’re at capacity – Hermes will be ready as soon as a place is free.");
  assert.equal(en.checkAgain, "Check again");
  const de = mobilePendingAccessCopy("de", "capacity");
  assert.equal(`${de.title} – ${de.body}`, "Kapazität erreicht – Hermes ist bereit, sobald ein Platz frei ist.");
  assert.equal(de.signOut, "Abmelden");

  for (const locale of appLocales) {
    const pending = mobilePendingAccessCopy(locale);
    const capacity = mobilePendingAccessCopy(locale, "capacity");
    assert.ok(capacity.title && capacity.body, locale);
    assert.notEqual(capacity.title, pending.title, locale);
    assert.equal(capacity.checkAgain, pending.checkAgain, locale);
    assert.equal(capacity.signOut, pending.signOut, locale);
  }
});

test("the surface feeds the status truth into the pending modal copy", () => {
  const surface = readFileSync(new URL("../src/surface.tsx", import.meta.url), "utf8");
  assert.match(
    surface,
    /const pendingAccessCopy = mobilePendingAccessCopy\(appLocale, mobilePendingAccessVariant\(workspaceStatusTruth\)\);/,
  );
  assert.match(surface, /<PendingProductAccessModal[\s\S]*?copy=\{pendingAccessCopy\}/);
});
