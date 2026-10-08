import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import type { WorkspaceServerIdentity } from "../core/types";
import { appLocales } from "../core/types";
import { mobileText } from "../src/appI18n";
import { formatServerMemoryMib, workspaceServerDetailRows } from "../src/workspace-server-details";

// HPD-1027: the Account screen's server section shows Server ID, vCPU, RAM,
// disk and region next to the rows it showed before, in the app and the web.

const en = mobileText("en").systemPages.security;
const formatDate = (value: string) => `date(${value})`;

const firecracker: WorkspaceServerIdentity = {
  confirmed: true,
  hostingKind: "firecracker_microvm",
  provider: null,
  serverId: null,
  workspaceMachineId: "wm_test_machine_1",
  hostname: "hey-hermes-ws-test-1",
  workspaceId: "ws_test_1",
  publicIpv4: null,
  serverType: "Firecracker microVM",
  location: "Falkenstein, Germany (EU)",
  inServiceSince: "2026-10-01T08:00:00.000Z",
  allocatedVcpu: 2,
  allocatedMemoryMib: 4096,
  allocatedPersistentStorageGib: 40,
  network: "private_managed",
};

test("a Firecracker identity yields every row in the fixed order", () => {
  assert.deepEqual(
    workspaceServerDetailRows(firecracker, en, formatDate).map((row) => [row.label, row.detail]),
    [
      ["Workspace", "ws_test_1"],
      ["Server ID", "wm_test_machine_1"],
      ["Server", "Firecracker microVM"],
      ["Region", "Falkenstein, Germany (EU)"],
      ["vCPU", "2"],
      ["RAM", "4 GiB"],
      ["Disk", "40 GiB"],
      ["In service since", "date(2026-10-01T08:00:00.000Z)"],
    ],
  );
});

test("a VPS identity shows its provider server id and public IPv4", () => {
  const vps: WorkspaceServerIdentity = {
    ...firecracker,
    hostingKind: "dedicated_vps",
    provider: "hetzner",
    serverId: "12345678",
    workspaceMachineId: null,
    publicIpv4: "203.0.113.7",
    serverType: "cx22",
    allocatedMemoryMib: 1536,
  };
  assert.deepEqual(
    workspaceServerDetailRows(vps, en, formatDate).map((row) => [row.key, row.detail]),
    [
      ["workspace", "ws_test_1"],
      ["serverId", "12345678"],
      ["ipv4", "203.0.113.7"],
      ["serverType", "cx22"],
      ["region", "Falkenstein, Germany (EU)"],
      ["cpu", "2"],
      ["memory", "1536 MiB"],
      ["disk", "40 GiB"],
      ["since", "date(2026-10-01T08:00:00.000Z)"],
    ],
  );
});

test("facts the plane does not know are left out", () => {
  const sparse: WorkspaceServerIdentity = {
    ...firecracker,
    workspaceMachineId: null,
    serverType: null,
    location: null,
    inServiceSince: null,
    allocatedVcpu: null,
    allocatedMemoryMib: null,
    allocatedPersistentStorageGib: null,
  };
  assert.deepEqual(
    workspaceServerDetailRows(sparse, en, formatDate).map((row) => row.key),
    ["workspace"],
  );
});

test("memory is GiB when whole, MiB otherwise", () => {
  assert.equal(formatServerMemoryMib(4096), "4 GiB");
  assert.equal(formatServerMemoryMib(1024), "1 GiB");
  assert.equal(formatServerMemoryMib(1536), "1536 MiB");
});

test("every locale names the new server rows", () => {
  for (const locale of appLocales) {
    const copy = mobileText(locale).systemPages.security;
    for (const key of ["serverId", "serverRegion", "serverCpu", "serverMemory", "serverDisk"] as const) {
      assert.ok(copy[key].trim().length > 0, `${locale}.${key}`);
    }
  }
  assert.equal(mobileText("de").systemPages.security.serverMemory, "Arbeitsspeicher");
});

test("the app renders the shared row model and no longer joins type and location", () => {
  const surface = readFileSync(new URL("../src/surface.tsx", import.meta.url), "utf8");
  assert.match(surface, /workspaceServerDetailRows\(serverIdentity, copy, formatDate\)/);
  assert.doesNotMatch(surface, /serverIdentity\.serverType, serverIdentity\.location/);
});
