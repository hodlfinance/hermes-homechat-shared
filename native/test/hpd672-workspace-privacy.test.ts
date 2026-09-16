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
    workspaceMachineId: null,
    hostname: "hey-hermes-ws-test",
    workspaceId: "ws_test",
    publicIpv4: null,
    serverType: "Isolated Firecracker microVM",
    location: "Falkenstein, Germany",
    inServiceSince: null,
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
    ["Hosting provider", "Hetzner"],
    ["Location", "Falkenstein, Germany"],
    ["Allocated vCPU", "2"],
    ["Allocated memory", "4096 MiB"],
    ["Allocated persistent storage", "40 GiB"],
    ["Network", "Private, managed"],
  ]);
  const visible = JSON.stringify(workspacePrivacyRows(identity, copy));
  assert.doesNotMatch(visible, /IP address|Server ID|machine ID|nodeId|agentUrl|MAC address|CPU model|total capacity|dedicated server|\bVPM\b/i);
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
