import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import type { SelfManagedView } from "../core/types";
import { HermesApiClientError } from "../core/hermes-api-client";
import {
  dailyCheckInCopy,
  dailyCheckInLineVisible,
  isDailyCheckInError,
  selfManagedBadgeVisible,
  selfManagedCopy,
  selfManagedSectionVisible,
  selfManagedSwitchEnabled,
  selfManagedTurnOnEnabled,
} from "../src/self-managed";

// HPD-1196 / HPD-1197: the switch under Account and the daily check-in card.

const base: SelfManagedView = {
  available: true,
  unavailableReason: null,
  selfManaged: false,
  changedAt: null,
  dailyCheckIn: { afterMessages: 80, audience: "included_ai_only" },
};

test("shows the switch to the Owner with SSH, greyed without SSH, never for Fin or a protected server", () => {
  assert.equal(selfManagedSectionVisible(base), true);
  assert.equal(selfManagedSwitchEnabled(base), true);
  const noSsh = { ...base, available: false, unavailableReason: "server_access_required" as const };
  assert.equal(selfManagedSectionVisible(noSsh), true);
  assert.equal(selfManagedSwitchEnabled(noSsh), false);
  for (const reason of ["managed_fin_workspace", "protected_workspace", "server_owner_required"] as const) {
    assert.equal(selfManagedSectionVisible({ ...base, available: false, unavailableReason: reason }), false);
  }
  // A customer who lost SSH after switching on keeps the section, to restore.
  assert.equal(selfManagedSectionVisible({ ...noSsh, selfManaged: true }), true);
  assert.equal(selfManagedSectionVisible(null), false);
});

test("Turn on waits for the checkbox", () => {
  assert.equal(selfManagedTurnOnEnabled(false, false), false);
  assert.equal(selfManagedTurnOnEnabled(true, true), false);
  assert.equal(selfManagedTurnOnEnabled(true, false), true);
});

test("the badge follows the mode", () => {
  assert.equal(selfManagedBadgeVisible(base), false);
  assert.equal(selfManagedBadgeVisible({ ...base, selfManaged: true }), true);
});

test("the wording is the proposal's, in English and German", () => {
  const en = selfManagedCopy("en");
  assert.equal(en.switchLabel, "Manage model and memory myself");
  assert.equal(en.confirmTitle, "Manage model and memory yourself?");
  assert.equal(en.confirmCheckbox, "I understand that I may cause errors and fix them myself over SSH.");
  assert.equal(en.restore, "Restore Hey Hermes defaults");
  assert.equal(en.needsSsh, "Needs server access (SSH).");
  assert.equal(selfManagedCopy("de").switchLabel, "Modell und Gedächtnis selbst verwalten");
  assert.equal(selfManagedCopy("fr").switchLabel, en.switchLabel);
  const card = dailyCheckInCopy("en");
  assert.equal(card.title(80), "That's 80 messages today");
  assert.equal(card.continueAnyway, "Continue anyway");
  assert.equal(card.notNow, "Not now");
  assert.equal(dailyCheckInCopy("de").title(80), "Das sind heute 80 Nachrichten");
});

test("recognises the Plane's daily check-in answer and nothing else", () => {
  assert.equal(isDailyCheckInError(new HermesApiClientError("x", { status: 409, code: "daily_check_in" })), true);
  assert.equal(isDailyCheckInError(new Error("That's 80 messages today. Hey Hermes checks in here once a day.")), true);
  assert.equal(isDailyCheckInError(new HermesApiClientError("Conflict", { status: 409, code: "self_managed" })), false);
  assert.equal(isDailyCheckInError(new Error("Hermes could not finish that reply.")), false);
  assert.equal(new HermesApiClientError("x", { status: 409 }).retryable, false);
});

test("the AI Access line shows only to the included AI (Justus, 2026-10-12, option b)", () => {
  assert.equal(dailyCheckInLineVisible(base, true), true);
  assert.equal(dailyCheckInLineVisible(base, false), false);
  assert.equal(dailyCheckInLineVisible({ ...base, dailyCheckIn: { afterMessages: 80, audience: "all_customers" } }, false), true);
});

test("the switch sits under Account right next to server access, and the card in the chat", () => {
  const surface = readFileSync(new URL("../src/surface.tsx", import.meta.url), "utf8");
  const server = surface.indexOf("<ServerAccessSection client={api}");
  const selfManaged = surface.indexOf("<SelfManagedSection client={api}");
  assert.ok(server > 0 && selfManaged > server && selfManaged - server < 1200);
  assert.ok(surface.includes("<DailyCheckInCard"));
});
