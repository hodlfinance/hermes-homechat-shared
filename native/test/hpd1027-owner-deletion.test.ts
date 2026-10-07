import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { appLocales, type ServerOwnerDeletionConfirmation, type ServerOwnerDeletionStatus } from "../core/index";
import {
  SERVER_OWNER_DELETION_HIDDEN_CODES,
  newServerOwnerDeletionOperationId,
  serverOwnerDeletionConfirmed,
  serverOwnerDeletionCopy,
  serverOwnerDeletionErrorMessage,
  serverOwnerDeletionModel,
  serverOwnerDeletionVisible,
} from "../src/server-owner-deletion";

// HPD-1027 S6a: the Owner's server deletion section, shared by app and web.

const date = (iso: string) => iso.slice(0, 10);
const SERVER_ID = "9a7b6c5d-4e3f-4a2b-9c1d-0e8f7a6b5c44";
// The Plane's answer, as hey-hermes SERVER_OWNER_DELETION_CONSEQUENCES sends it.
const base: ServerOwnerDeletionStatus = {
  serverOwner: true,
  serverId: SERVER_ID,
  consequences: {
    deleted: ["system_disk", "private_data_disk", "disk_snapshots", "host_backups", "server_export_copies", "runtime_binding"],
    kept: ["account", "subscription", "billing_records", "app_conversations", "honcho_memory"],
    backupRetention: "host_copies_removed_at_deletion",
    offHostBackups: "none_for_customer_servers",
    separateActions: ["cancel_subscription", "delete_account"],
    irreversible: true,
  },
  request: null,
};
const request = { operationId: "sod_AAAAAAAAAAAAAAAAAAAAAAAA", requestedAt: "2026-10-08T10:00:00.000Z", completedAt: null, failureCode: null };

test("shows only while the Plane offers it (switch on, not Fin, not protected)", () => {
  assert.equal(serverOwnerDeletionVisible({ serverDeletionAvailable: true }), true);
  assert.equal(serverOwnerDeletionVisible({ serverDeletionAvailable: false }), false);
  assert.equal(serverOwnerDeletionVisible({}), false);
  assert.equal(serverOwnerDeletionVisible(null), false);
  for (const code of ["server_deletion_unavailable", "server_deletion_protected", "server_owner_required", "firecracker_server_required"]) {
    assert.equal(SERVER_OWNER_DELETION_HIDDEN_CODES.has(code), true, code);
  }
});

test("the preview lists what goes and what stays, in order, and offers the form", () => {
  const en = serverOwnerDeletionCopy("en");
  const model = serverOwnerDeletionModel(base, en, date);
  assert.equal(model.phase, "preview");
  assert.equal(model.showForm, true);
  assert.equal(model.status, null);
  assert.deepEqual(model.deleted.map((item) => item.key), base.consequences.deleted);
  assert.deepEqual(model.kept.map((item) => item.key), base.consequences.kept);
  assert.equal(model.deleted[0]!.label, "System disk");
  // An item the Plane does not send is not shown.
  const fewer = serverOwnerDeletionModel({ ...base, consequences: { ...base.consequences, deleted: ["system_disk"] } }, en, date);
  assert.deepEqual(fewer.deleted.map((item) => item.key), ["system_disk"]);
  assert.equal(serverOwnerDeletionModel(null, en, date).phase, "loading");
  assert.equal(serverOwnerDeletionModel(null, en, date).showForm, false);
});

test("both confirmations are needed: the exact server id and the acknowledgement", () => {
  assert.equal(serverOwnerDeletionConfirmed(SERVER_ID, SERVER_ID, true), true);
  assert.equal(serverOwnerDeletionConfirmed(SERVER_ID, ` ${SERVER_ID} `, true), true);
  assert.equal(serverOwnerDeletionConfirmed(SERVER_ID, SERVER_ID, false), false);
  assert.equal(serverOwnerDeletionConfirmed(SERVER_ID, SERVER_ID.toUpperCase(), true), false);
  assert.equal(serverOwnerDeletionConfirmed(SERVER_ID, "", true), false);
  assert.equal(serverOwnerDeletionConfirmed("", "", true), false);
});

test("operation ids fit the Plane's pattern", () => {
  for (let i = 0; i < 20; i += 1) assert.match(newServerOwnerDeletionOperationId(), /^[A-Za-z0-9_-]{16,80}$/);
  assert.notEqual(newServerOwnerDeletionOperationId(), newServerOwnerDeletionOperationId());
});

test("walks requested, running (polling), deleted (receipt) and failed (form again)", () => {
  const en = serverOwnerDeletionCopy("en");
  for (const state of ["requested", "running"] as const) {
    const model = serverOwnerDeletionModel({ ...base, request: { ...request, state } }, en, date);
    assert.equal(model.phase, state);
    assert.equal(model.tone, "amber");
    assert.equal(model.poll, true);
    assert.equal(model.showForm, false);
  }
  const deleted = serverOwnerDeletionModel({
    ...base,
    request: {
      ...request,
      state: "deleted",
      completedAt: "2026-10-08T10:05:00.000Z",
      receipt: { removedVolumes: 4, removedFiles: 3, remainingVolumes: 0, remainingFiles: 0, offHostCopiesChecked: false },
    },
  }, en, date);
  assert.equal(deleted.phase, "deleted");
  assert.equal(deleted.status, "Your server was deleted on 2026-10-08.");
  assert.equal(deleted.poll, false);
  assert.equal(deleted.showForm, false);
  assert.deepEqual(deleted.receipt, [
    "Receipt: 4 disks and snapshots and 3 backup and export files removed.",
    en.receiptClean,
    en.deletedNext,
  ]);
  const failed = serverOwnerDeletionModel({ ...base, request: { ...request, state: "failed", failureCode: "volumes_remain" } }, en, date);
  assert.equal(failed.phase, "failed");
  assert.equal(failed.status, en.failures.volumes_remain);
  assert.equal(failed.showForm, true);
  assert.equal(serverOwnerDeletionModel({ ...base, request: { ...request, state: "failed", failureCode: "delete_failed" } }, en, date).status, en.failed);
  // Support gave a returning buyer a new server: the preview again.
  assert.equal(serverOwnerDeletionModel({ ...base, request: { ...request, state: "superseded" } }, en, date).phase, "preview");
});

test("flow: preview, confirm, requested, running, deleted against a fake Plane", async () => {
  const en = serverOwnerDeletionCopy("en");
  const posted: ServerOwnerDeletionConfirmation[] = [];
  let state: ServerOwnerDeletionStatus = base;
  const plane = {
    serverOwnerDeletion: async () => state,
    requestServerOwnerDeletion: async (body: ServerOwnerDeletionConfirmation) => {
      posted.push(body);
      if (body.confirmServerId !== SERVER_ID) throw Object.assign(new Error("400"), { code: "server_deletion_confirmation_mismatch" });
      state = { ...base, request: { ...request, operationId: body.operationId, state: "requested" } };
      return state;
    },
  };
  assert.equal(serverOwnerDeletionModel(await plane.serverOwnerDeletion(), en, date).phase, "preview");
  const operationId = newServerOwnerDeletionOperationId();
  assert.equal(serverOwnerDeletionConfirmed(SERVER_ID, "wrong", true), false);
  const after = await plane.requestServerOwnerDeletion({ operationId, confirmServerId: SERVER_ID, acknowledgeIrreversible: true });
  assert.deepEqual(posted, [{ operationId, confirmServerId: SERVER_ID, acknowledgeIrreversible: true }]);
  assert.equal(serverOwnerDeletionModel(after, en, date).phase, "requested");
  state = { ...state, request: { ...state.request!, state: "running" } };
  assert.equal(serverOwnerDeletionModel(await plane.serverOwnerDeletion(), en, date).phase, "running");
  state = { ...state, request: { ...state.request!, state: "deleted", completedAt: "2026-10-08T10:05:00.000Z", receipt: { removedVolumes: 2, removedFiles: 0, remainingVolumes: 0, remainingFiles: 0, offHostCopiesChecked: false } } };
  const done = serverOwnerDeletionModel(await plane.serverOwnerDeletion(), en, date);
  assert.equal(done.phase, "deleted");
  assert.match(done.receipt[0]!, /2 disks/);
});

test("every app language has its own complete copy, export hint first", () => {
  const en = serverOwnerDeletionCopy("en");
  assert.match(en.exportFirst, /^Download your full archive before deleting/);
  const keys = Object.keys(en).sort();
  for (const locale of appLocales) {
    const copy = serverOwnerDeletionCopy(locale);
    assert.deepEqual(Object.keys(copy).sort(), keys, locale);
    assert.deepEqual(Object.keys(copy.items).sort(), Object.keys(en.items).sort(), locale);
    assert.deepEqual(Object.keys(copy.errors).sort(), Object.keys(en.errors).sort(), locale);
    assert.deepEqual(Object.keys(copy.failures).sort(), Object.keys(en.failures).sort(), locale);
    for (const item of Object.values(copy.items)) assert.ok(item.length > 1, locale);
    if (locale !== "en") {
      assert.notEqual(copy.title, en.title, locale);
      assert.notEqual(copy.exportFirst, en.exportFirst, locale);
      assert.notEqual(copy.acknowledge, en.acknowledge, locale);
    }
    assert.match(copy.receipt(3, 5), /3/, locale);
    assert.match(copy.receipt(3, 5), /5/, locale);
  }
  assert.equal(serverOwnerDeletionCopy("de").title, "Server löschen");
});

test("error codes map to copy, unknown ones to the generic line", () => {
  const de = serverOwnerDeletionCopy("de");
  assert.equal(serverOwnerDeletionErrorMessage("server_deletion_confirmation_mismatch", de), de.errors.server_deletion_confirmation_mismatch);
  assert.equal(serverOwnerDeletionErrorMessage("full_export_in_progress", de), de.errors.full_export_in_progress);
  assert.equal(serverOwnerDeletionErrorMessage("something_new", de), de.errors.generic);
  assert.equal(serverOwnerDeletionErrorMessage(null, de), de.errors.generic);
});

test("the app shows the section only when offered, above the account deletion, with both confirmations", () => {
  const surface = readFileSync(new URL("../src/surface.tsx", import.meta.url), "utf8");
  assert.match(surface, /serverOwnerDeletionVisible\(serverIdentity\) \? \(\s*<ServerOwnerDeletionSection client=\{api\}/);
  const section = surface.indexOf("<ServerOwnerDeletionSection");
  const danger = surface.indexOf("<MobileSystemSection title={mobileDangerZoneText(appLocale)}>");
  assert.ok(section > 0 && section < danger);
  const source = readFileSync(new URL("../src/ServerOwnerDeletionSection.tsx", import.meta.url), "utf8");
  for (const call of ["serverOwnerDeletion", "requestServerOwnerDeletion"]) assert.match(source, new RegExp(`client\\.${call}\\(`), call);
  assert.match(source, /acknowledgeIrreversible: true/);
  assert.match(source, /disabled=\{!confirmed\}/);
  assert.match(source, /accessibilityRole="checkbox"/);
  // The export hint is the first thing in the form.
  assert.ok(source.indexOf("copy.exportFirst") < source.indexOf("copy.intro"));
  assert.ok(source.indexOf("copy.exportFirst") < source.indexOf("copy.deletedHeading"));
  assert.match(source, /if \(hidden\) return null;/);
});
