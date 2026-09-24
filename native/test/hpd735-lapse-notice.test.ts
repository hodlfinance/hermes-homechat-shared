import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { mobileLapseNotice } from "../src/mobile-lapse-notice";
import type { NotificationRecord } from "../core/types";

// HPD-735: Fin/hodl accounts have no deliverable mail address, so the in-app
// notice is the only way the day-30 export link and the "deleted" notice reach
// them. The plane already sends both in `snapshot.notifications`; the surface
// must show them.

const NOW = new Date("2026-10-01T12:00:00.000Z");

function notice(overrides: Partial<NotificationRecord> = {}): NotificationRecord {
  return {
    id: "ntf_export",
    workspaceId: "ws_synthetic",
    accountId: "acct_synthetic",
    channel: "in_app",
    kind: "account_lifecycle",
    severity: "warning",
    status: "unread",
    title: "Dein Export liegt bereit",
    body: "Dein Export liegt bereit: https://heyhermes.app/api/lapse-export/abc",
    actionUrl: "https://heyhermes.app/api/lapse-export/abc",
    emailDeliveryId: null,
    metadata: { source: "hpd-735-firecracker-lapse-export", expiresAt: "2026-10-05T00:00:00.000Z" },
    createdAt: "2026-09-28T00:00:00.000Z",
    readAt: null,
    dismissedAt: null,
    ...overrides,
  };
}

test("shows the export notice with its link while the link is valid", () => {
  assert.deepEqual(mobileLapseNotice([notice()], NOW, []), {
    id: "ntf_export",
    title: "Dein Export liegt bereit",
    body: "Dein Export liegt bereit: https://heyhermes.app/api/lapse-export/abc",
    actionUrl: "https://heyhermes.app/api/lapse-export/abc",
  });
});

test("hides the export notice once its link has expired", () => {
  assert.equal(mobileLapseNotice([notice()], new Date("2026-10-06T00:00:00.000Z"), []), null);
});

test("shows the deletion notice, which has no link", () => {
  const deleted = notice({
    id: "ntf_deleted",
    title: "Neuer Arbeitsbereich",
    body: "Dein früherer Arbeitsbereich wurde am 06.11.2026 gelöscht. Das hier ist ein neuer, leerer Arbeitsbereich.",
    actionUrl: null,
    metadata: { source: "hpd-735-firecracker-lapse" },
  });
  assert.equal(mobileLapseNotice([deleted], NOW, [])?.actionUrl, null);
  assert.equal(mobileLapseNotice([deleted], NOW, [])?.id, "ntf_deleted");
});

test("never shows a notice that was dismissed, read, is not a lapse notice, or is mail", () => {
  assert.equal(mobileLapseNotice([notice()], NOW, ["ntf_export"]), null);
  assert.equal(mobileLapseNotice([notice({ status: "read" })], NOW, []), null);
  assert.equal(mobileLapseNotice([notice({ dismissedAt: "2026-09-29T00:00:00.000Z" })], NOW, []), null);
  assert.equal(mobileLapseNotice([notice({ metadata: { source: "something-else" } })], NOW, []), null);
  assert.equal(mobileLapseNotice([notice({ kind: "usage_warning" })], NOW, []), null);
  assert.equal(mobileLapseNotice([notice({ channel: "email" })], NOW, []), null);
});

test("opens only an https link", () => {
  assert.equal(mobileLapseNotice([notice({ actionUrl: "javascript:alert(1)" })], NOW, [])?.actionUrl, null);
});

test("picks the newest of several and tolerates a snapshot without notifications", () => {
  const older = notice({ id: "ntf_old", createdAt: "2026-09-20T00:00:00.000Z" });
  assert.equal(mobileLapseNotice([older, notice()], NOW, [])?.id, "ntf_export");
  assert.equal(mobileLapseNotice(undefined, NOW, []), null);
});

test("the surface renders the notice from the snapshot and opens its link", () => {
  const surface = readFileSync(new URL("../src/surface.tsx", import.meta.url), "utf8");
  assert.match(surface, /mobileLapseNotice\(snapshot\?\.notifications/);
  assert.match(surface, /<MobileLapseNoticeBanner/);
  assert.match(surface, /WebBrowser\.openBrowserAsync\(lapseNotice\.actionUrl\)/);
});
