import assert from "node:assert/strict";
import test from "node:test";
import type { HermesApiJob } from "../core/index";
import { mobileText } from "../src/appI18n";
import { mobileAutomationsViewFromCanonical } from "../src/hermes-canonical";
import { automationCardFromJob, automationPrivacyRouteLine } from "../src/mobile-automation-card";

const approved = { reason: "google_user_data", modelName: "DeepSeek V4 Flash" } as const;

/**
 * One job as `GET /hermes/jobs` answers it for an automation the customer
 * made himself (hey-hermes `canonicalJobFromNative`). Its `native` record is
 * the server's allowlist of the stored Hermes job, which names no model and no
 * provider, so the route can only arrive in the server's own `privacyRoute`.
 */
function canonicalJob(id: string, name: string, extra: Record<string, unknown> = {}): HermesApiJob {
  const schedule = { kind: "cron", expr: "0 9 * * *", display: "0 9 * * *" };
  return {
    id,
    name,
    visibility: "full",
    prompt: "Check my Gmail for unread mail and tell me how many there are.",
    schedule,
    scheduleDisplay: "0 9 * * *",
    enabled: true,
    state: "scheduled",
    deliver: "origin",
    nextRunAt: "2026-10-15T09:00:00+00:00",
    lastRunAt: null,
    lastStatus: null,
    lastError: null,
    policy: null,
    native: {
      id,
      name,
      prompt: "Check my Gmail for unread mail and tell me how many there are.",
      schedule,
      schedule_display: "0 9 * * *",
      enabled: true,
      state: "scheduled",
      deliver: "origin",
      next_run_at: "2026-10-15T09:00:00+00:00",
      last_run_at: null,
      last_status: null,
      last_error: null,
      skills: ["hey-hermes-gmail"],
      repeat: { times: null, completed: 0 },
      created_at: "2026-10-14T08:00:00+00:00",
    },
    ...extra,
  } as HermesApiJob;
}

test("HPD-1246: a self-made Gmail automation keeps the server's route on its way to the card", () => {
  const view = mobileAutomationsViewFromCanonical([
    canonicalJob("b565409bac14", "Inbox radar", { privacyRoute: approved }),
    canonicalJob("7dd62e93b6d0", "Date at nine", { privacyRoute: null }),
  ]);
  assert.deepEqual(view.jobs[0]?.privacyRoute, approved);
  assert.equal(view.jobs[1]?.privacyRoute, null);

  const template = mobileText("en").systemPages.automations.privacyRoute;
  assert.equal(
    automationPrivacyRouteLine(automationCardFromJob(view.jobs[0]!), template),
    "Runs on the privacy-approved model (DeepSeek V4 Flash) because it uses your Gmail.",
  );
  assert.equal(automationPrivacyRouteLine(automationCardFromJob(view.jobs[1]!), template), null);
});

test("HPD-1246: nothing is inferred when the server says nothing", () => {
  // A server older than HPD-1246 sends no key, although the job declares the Gmail skill.
  const [older] = mobileAutomationsViewFromCanonical([canonicalJob("old", "Inbox radar")]).jobs;
  assert.equal(older?.privacyRoute, null);
  assert.equal(automationCardFromJob(older!).privacyRoute, null);
});

test("HPD-1246: a malformed route from the wire never reaches the card", () => {
  for (const value of [
    true, "google_user_data", [], { reason: "google_user_data" },
    { reason: "google_user_data", modelName: " " }, { reason: "something_else", modelName: "X" },
  ]) {
    const [job] = mobileAutomationsViewFromCanonical([canonicalJob("bad", "Inbox radar", { privacyRoute: value })]).jobs;
    assert.equal(job?.privacyRoute, null, JSON.stringify(value));
  }
});
