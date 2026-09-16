import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import type { WorkspaceServerIdentity } from "../core/index";
import { workspacePrivacyCopy, workspacePrivacyHasServer, workspacePrivacyRows } from "../ui/workspace-privacy-copy";

test("a valid Firecracker binding is a confirmed isolated workspace machine without host details", () => {
  const identity: WorkspaceServerIdentity = {
    confirmed: true,
    hostingKind: "firecracker_microvm",
    provider: "Hetzner",
    serverId: null,
    workspaceMachineId: "9a7b6c5d-4e3f-4a2b-9c1d-0e8f7a6b5c44",
    hostname: "hey-hermes-ws-test",
    workspaceId: "ws_test",
    publicIpv4: null,
    serverType: "Isolated Firecracker microVM",
    location: "Falkenstein, Germany",
    inServiceSince: "2026-09-13T00:00:00.000Z",
    allocatedVcpu: 2,
    allocatedMemoryMib: 4096,
    allocatedPersistentStorageGib: 40,
    network: "private_managed",
  };
  const copy = workspacePrivacyCopy("en", identity.hostingKind);
  assert.equal(workspacePrivacyHasServer(identity, "ws_test"), true);
  assert.equal(copy.body, "Your personal content is protected inside its own isolated virtual machine.");
  assert.deepEqual(workspacePrivacyRows(identity, copy), [
    ["Environment type", "Isolated Firecracker microVM"],
    ["Workspace machine ID", "9a7b6c5d-4e3f-4a2b-9c1d-0e8f7a6b5c44"],
    ["In service since", "2026-09-13T00:00:00.000Z"],
    ["Allocated memory", "4096 MiB"],
    ["Allocated persistent storage", "40 GiB"],
    ["Hosting provider", "Hetzner"],
    ["Location", "Falkenstein, Germany"],
  ]);
  const visible = JSON.stringify(workspacePrivacyRows(identity, copy));
  assert.doesNotMatch(visible, /IP address|Server ID|nodeId|agentUrl|MAC address|CPU model|total capacity|dedicated server|\bVPM\b/i);
  assert.deepEqual(workspacePrivacyRows({ ...identity, provider: null, location: null, allocatedMemoryMib: undefined, allocatedPersistentStorageGib: undefined } as unknown as WorkspaceServerIdentity, copy), [
    ["Environment type", "Isolated Firecracker microVM"],
    ["Workspace machine ID", "9a7b6c5d-4e3f-4a2b-9c1d-0e8f7a6b5c44"],
    ["In service since", "2026-09-13T00:00:00.000Z"],
  ]);
});

test("the native privacy sheet renders only the rows selected by the safe projection", () => {
  const source = readFileSync(new URL("../src/MobilePrivacySheet.tsx", import.meta.url), "utf8");
  assert.match(source, /workspacePrivacyRows\(server, copy\)/);
  assert.match(source, /server\?\.hostingKind \?\? "unconfirmed"/);
  assert.doesNotMatch(source, /server\?\.(nodeId|agentUrl|publicIpv4|serverId)/);
});

test("the native privacy sheet follows the palette supplied by its host app", () => {
  const source = readFileSync(new URL("../src/MobilePrivacySheet.tsx", import.meta.url), "utf8");
  assert.match(source, /import \{ useMobilePalette \} from "\.\/mobile-palette-context"/);
  assert.match(source, /const palette = useMobilePalette\(\)/);
  assert.doesNotMatch(source, /import \{ palette \} from "\.\/mobile-palette"/);
});
