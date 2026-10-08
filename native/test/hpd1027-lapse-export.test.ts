import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { appLocales, type LapseExportOwnerView } from "../core/index";
import { isPrivateMobileBrowserHref } from "../src/mobile-browser-session";
import {
  LAPSE_EXPORT_DOWNLOAD_HREF,
  LAPSE_EXPORT_HIDDEN_CODES,
  lapseExportCopy,
  lapseExportKeyFile,
  lapseExportModel,
} from "../src/lapse-export";

// HPD-1027 S6(b): the lapse backup and its one-time key on the account screen, shared by app and web.

const date = (iso: string) => iso.slice(0, 10);
const paused: LapseExportOwnerView = {
  schemaVersion: "heyhermes.lapse-export-owner/v1",
  state: "paused",
  exportDueAt: "2026-11-07T00:00:00.000Z",
  deleteDueAt: "2026-11-14T00:00:00.000Z",
  exportedAt: null,
  expiresAt: null,
  ready: false,
  format: null,
  bytes: null,
  sha256: null,
  keyAvailable: false,
  keyShownAt: null,
};
const ready: LapseExportOwnerView = {
  ...paused,
  state: "exported",
  exportedAt: "2026-11-07T01:00:00.000Z",
  expiresAt: "2026-11-14T01:00:00.000Z",
  ready: true,
  format: "full",
  bytes: 10,
  sha256: "a".repeat(64),
  keyAvailable: true,
};

test("while paused it says when the backup comes and when the server goes, and offers nothing", () => {
  const en = lapseExportCopy("en");
  const model = lapseExportModel(paused, en, date, false);
  assert.equal(model.status, en.paused("2026-11-07", "2026-11-14"));
  assert.equal(model.canDownload, false);
  assert.equal(model.canTakeKey, false);
});

test("ready with a fresh key: download, take the key once, then only a note", () => {
  const en = lapseExportCopy("en");
  const first = lapseExportModel(ready, en, date, false);
  assert.deepEqual([first.canDownload, first.canTakeKey, first.hint], [true, true, en.openKey]);
  const taken = lapseExportModel(ready, en, date, true);
  assert.equal(taken.canTakeKey, false);
  const later = lapseExportModel({ ...ready, keyAvailable: false, keyShownAt: "2026-11-08T00:00:00.000Z" }, en, date, false);
  assert.equal(later.canTakeKey, false);
  assert.equal(later.keyShownNote, en.keyShown("2026-11-08"));
  assert.equal(later.hint, en.openKey);
});

test("SSH-encrypted and readable backups never offer a key", () => {
  const en = lapseExportCopy("en");
  const ssh = lapseExportModel({ ...ready, keyAvailable: false }, en, date, false);
  assert.deepEqual([ssh.canTakeKey, ssh.hint], [false, en.openFull]);
  const zip = lapseExportModel({ ...ready, format: "readable", keyAvailable: false }, en, date, false);
  assert.deepEqual([zip.canDownload, zip.canTakeKey, zip.hint], [true, false, null]);
  assert.equal(lapseExportModel({ ...ready, ready: false }, en, date, false).status, en.gone);
});

test("all eight app languages carry every string", () => {
  const keys = Object.keys(lapseExportCopy("en")).sort();
  for (const locale of appLocales) {
    const copy = lapseExportCopy(locale);
    assert.deepEqual(Object.keys(copy).sort(), keys, locale);
    for (const [name, value] of Object.entries(copy)) {
      const text = typeof value === "function" ? value("A", "B") : value;
      assert.ok(typeof text === "string" && text.length > 0, `${locale}.${name}`);
    }
    if (locale !== "en") assert.notEqual(copy.title, lapseExportCopy("en").title, locale);
  }
  assert.equal(appLocales.length, 8);
});

test("the download goes through the private handoff; the key file is what age reads", () => {
  assert.equal(isPrivateMobileBrowserHref(LAPSE_EXPORT_DOWNLOAD_HREF), true);
  assert.equal(isPrivateMobileBrowserHref(`${LAPSE_EXPORT_DOWNLOAD_HREF}?x=1`), false);
  const identity = `AGE-SECRET-KEY-1${"Q".repeat(58)}`;
  assert.match(lapseExportKeyFile(identity), new RegExp(`^# .*\\n${identity}\\n$`));
  assert.ok(LAPSE_EXPORT_HIDDEN_CODES.has("lapse_export_none"));
});

test("the account screen mounts the section only in the Hey app's own session", () => {
  const surface = readFileSync(new URL("../src/surface.tsx", import.meta.url), "utf8");
  assert.match(surface, /host\.session\.mode === "standalone" \? \(\s*<LapseExportSection/);
  assert.match(surface, /href: LAPSE_EXPORT_DOWNLOAD_HREF/);
  const section = readFileSync(new URL("../src/LapseExportSection.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(section, /AsyncStorage|SecureStore|console\./);
});
