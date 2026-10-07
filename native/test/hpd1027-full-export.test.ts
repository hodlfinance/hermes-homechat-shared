import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { appLocales, type ServerFullExportStatus } from "../core/index";
import { isPrivateMobileBrowserHref } from "../src/mobile-browser-session";
import {
  SERVER_FULL_EXPORT_DOWNLOAD_HREF,
  formatArchiveBytes,
  serverFullExportCopy,
  serverFullExportErrorMessage,
  serverFullExportModel,
  serverFullExportVisible,
} from "../src/server-full-export";

// HPD-1027 S5: the Owner's full server archive row, shared by app and web.

const date = (iso: string) => iso.slice(0, 10);
const base: ServerFullExportStatus = { serverOwner: true, eligible: true, linkDays: 7, request: null };
const request = {
  id: "sfx_1",
  requestedAt: "2026-10-07T12:00:00.000Z",
  completedAt: null,
  bytes: null,
  sha256: null,
  expiresAt: null,
  failureCode: null,
  recipientFingerprints: [`SHA256:${"A".repeat(43)}`],
};

test("shows only for the Owner while the archive is switched on (never set for Fin)", () => {
  assert.equal(serverFullExportVisible({ serverOwner: true, fullExportAvailable: true }), true);
  assert.equal(serverFullExportVisible({ serverOwner: true, fullExportAvailable: false }), false);
  assert.equal(serverFullExportVisible({ serverOwner: false, fullExportAvailable: true }), false);
  assert.equal(serverFullExportVisible({ serverOwner: true }), false);
  assert.equal(serverFullExportVisible(null), false);
});

test("without an ed25519 or RSA key the row explains and offers nothing", () => {
  const en = serverFullExportCopy("en");
  const model = serverFullExportModel({ ...base, eligible: false }, en, "en", date);
  assert.deepEqual(model, { status: en.noKey, tone: "muted", action: "none", actionLabel: null, hint: null });
});

test("walks create, requested, running, ready (download) and failed", () => {
  const en = serverFullExportCopy("en");
  assert.equal(serverFullExportModel(base, en, "en", date).action, "create");
  assert.equal(serverFullExportModel(base, en, "en", date).actionLabel, "Create full archive");
  for (const state of ["requested", "running"] as const) {
    const model = serverFullExportModel({ ...base, request: { ...request, state } }, en, "en", date);
    assert.equal(model.action, "none");
    assert.equal(model.tone, "amber");
  }
  const ready = serverFullExportModel({
    ...base,
    request: { ...request, state: "ready", bytes: 3 * 1024 * 1024 * 1024, sha256: "a".repeat(64), completedAt: "2026-10-07T13:00:00.000Z", expiresAt: "2026-10-14T13:00:00.000Z" },
  }, en, "en", date);
  assert.equal(ready.action, "download");
  assert.equal(ready.status, "Ready: 3 GB, download until 2026-10-14.");
  assert.match(ready.hint!, /^Open it with: age -d -i /);
  // A ready archive stays downloadable even if the Owner removed the key since.
  assert.equal(serverFullExportModel({ ...base, eligible: false, request: { ...request, state: "ready", bytes: 10, expiresAt: "2026-10-14T13:00:00.000Z" } }, en, "en", date).action, "download");
  const failed = serverFullExportModel({ ...base, request: { ...request, state: "failed", failureCode: "operator_key_unreachable" } }, en, "en", date);
  assert.equal(failed.action, "create");
  assert.equal(failed.status, en.failures.operator_key_unreachable);
  assert.equal(serverFullExportModel({ ...base, request: { ...request, state: "failed", failureCode: "export_failed" } }, en, "en", date).status, en.failed);
  assert.equal(serverFullExportModel({ ...base, request: { ...request, state: "expired" } }, en, "en", date).status, en.expired);
});

test("every app language has its own complete copy, clearly naming the full archive", () => {
  const en = serverFullExportCopy("en");
  assert.equal(en.title, "Full server archive (encrypted to your SSH key)");
  const keys = Object.keys(en).sort();
  for (const locale of appLocales) {
    const copy = serverFullExportCopy(locale);
    assert.deepEqual(Object.keys(copy).sort(), keys, locale);
    assert.deepEqual(Object.keys(copy.errors).sort(), Object.keys(en.errors).sort(), locale);
    assert.deepEqual(Object.keys(copy.failures).sort(), Object.keys(en.failures).sort(), locale);
    if (locale !== "en") assert.notEqual(copy.title, en.title, locale);
    assert.match(copy.title, /SSH/, locale);
    assert.match(copy.intro(7), /7/, locale);
  }
  assert.equal(serverFullExportCopy("de").create, "Komplettarchiv erstellen");
});

test("error codes map to copy, unknown ones to the generic line", () => {
  const de = serverFullExportCopy("de");
  assert.equal(serverFullExportErrorMessage("full_export_in_progress", de), de.errors.full_export_in_progress);
  assert.equal(serverFullExportErrorMessage("something_new", de), de.errors.generic);
  assert.equal(serverFullExportErrorMessage(null, de), de.errors.generic);
});

test("sizes read in the Owner's language", () => {
  assert.equal(formatArchiveBytes(512, "en"), "512 B");
  assert.equal(formatArchiveBytes(1536 * 1024 * 1024, "de"), "1,5 GB");
});

test("the download goes through the private browser handoff, exactly that path", () => {
  assert.equal(SERVER_FULL_EXPORT_DOWNLOAD_HREF, "/api/workspace/server/export/download");
  assert.equal(isPrivateMobileBrowserHref(SERVER_FULL_EXPORT_DOWNLOAD_HREF), true);
  assert.equal(isPrivateMobileBrowserHref(`${SERVER_FULL_EXPORT_DOWNLOAD_HREF}?x=1`), false);
});

test("the app keeps the partial export and adds the full archive only for the Owner", () => {
  const surface = readFileSync(new URL("../src/surface.tsx", import.meta.url), "utf8");
  assert.match(surface, /downloadWorkspaceExport\(\)/);
  assert.match(surface, /serverFullExportVisible\(serverIdentity\) \? \(\s*<ServerFullExportSection/);
  const section = readFileSync(new URL("../src/ServerFullExportSection.tsx", import.meta.url), "utf8");
  for (const call of ["serverFullExport", "createServerFullExport"]) assert.match(section, new RegExp(`client\\.${call}\\(`), call);
});
