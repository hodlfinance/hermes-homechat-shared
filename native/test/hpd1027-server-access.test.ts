import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import type { ServerAccessView } from "../core/index";
import {
  formatServerUptime,
  looksLikePrivateKey,
  serverAccessCopy,
  serverAccessErrorMessage,
  serverAccessRows,
  serverAccessStatus,
  serverHermesSwitchedOff,
} from "../src/server-access";

// HPD-1027 S4: the Owner's server access screen model, shared by app and web.

const applied: ServerAccessView = {
  serverOwner: true,
  ssh: {
    delivery: "applied",
    deliveryReason: null,
    endpoint: { host: "fc1.example.test", port: 22007, command: "ssh -p 22007 root@fc1.example.test" },
    hostKeys: [{ algorithm: "ssh-ed25519", fingerprintSha256: `SHA256:${"B".repeat(43)}` }],
  },
  server: {
    operatingSystem: "Ubuntu 24.04.3 LTS",
    kernel: "6.1.155",
    bootedAt: "2026-10-05T11:00:00.000Z",
    uptimeSeconds: 93_784,
    checkedAt: "2026-10-05T12:00:00.000Z",
  },
  hermes: { state: "enabled" },
};

test("private key material is recognised before it is sent", () => {
  assert.equal(looksLikePrivateKey("-----BEGIN OPENSSH PRIVATE KEY-----\nabc"), true);
  assert.equal(looksLikePrivateKey("PuTTY-User-Key-File-3: ssh-ed25519"), true);
  assert.equal(looksLikePrivateKey("ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAI me@laptop"), false);
});

test("the status names every delivery state and the gate's reason, in German and English", () => {
  const en = serverAccessCopy("en");
  const de = serverAccessCopy("de");
  assert.deepEqual(serverAccessStatus(applied, null, en), { tone: "teal", text: en.statusApplied });
  const blocked = { ...applied, ssh: { ...applied.ssh, delivery: "blocked" as const, deliveryReason: "shared_ai_key_on_guest", endpoint: null } };
  assert.equal(serverAccessStatus(blocked, null, de).text, de.blockedReasons.shared_ai_key_on_guest);
  assert.match(serverAccessStatus(blocked, null, en).text, /shared AI key/);
  assert.equal(serverAccessStatus({ ...blocked, ssh: { ...blocked.ssh, deliveryReason: "something_new" } }, null, en).text, en.statusBlocked);
  assert.equal(serverAccessStatus(null, { delivery: "pending", deliveryReason: null }, en).tone, "amber");
  assert.equal(serverAccessStatus(null, { delivery: "no_keys", deliveryReason: null }, en).text, en.statusNoKeys);
  assert.equal(serverAccessStatus(null, { delivery: "off", deliveryReason: "customer_root_off" }, en).text, en.statusOff);
  assert.equal(serverAccessStatus(null, null, en).text, en.statusOff);
});

test("other app languages fall back to English", () => {
  assert.equal(serverAccessCopy("ja").title, serverAccessCopy("en").title);
  assert.equal(serverAccessCopy("de").title, "Serverzugang (SSH)");
});

test("facts rows: endpoint, host keys, OS, kernel, boot, uptime, last check; missing facts are left out", () => {
  const copy = serverAccessCopy("en");
  const rows = serverAccessRows(applied, copy, (iso) => `at ${iso}`);
  assert.deepEqual(rows.map((row) => row.key), ["endpoint", "hostkey-ssh-ed25519", "os", "kernel", "booted", "uptime", "checked"]);
  assert.equal(rows[0]!.detail, "ssh -p 22007 root@fc1.example.test");
  assert.equal(rows.find((row) => row.key === "uptime")!.detail, "1 d 2 h");
  const bare = { ...applied, ssh: { ...applied.ssh, endpoint: null, hostKeys: [] }, server: { operatingSystem: null, kernel: null, bootedAt: null, uptimeSeconds: null, checkedAt: null } };
  assert.deepEqual(serverAccessRows(bare, copy, String), []);
  assert.deepEqual(serverAccessRows(null, copy, String), []);
});

test("uptime and error messages", () => {
  const copy = serverAccessCopy("de");
  assert.equal(formatServerUptime(59, copy), "0 Min");
  assert.equal(formatServerUptime(3_660, copy), "1 Std 1 Min");
  assert.equal(formatServerUptime(null, copy), null);
  assert.equal(serverAccessErrorMessage("weak_rsa_key", copy), copy.errors.weak_rsa_key);
  assert.equal(serverAccessErrorMessage("unknown_code", copy), copy.errors.generic);
  assert.equal(serverAccessErrorMessage(null, copy), copy.errors.generic);
});

test("Hermes switched off by the Owner is shown", () => {
  assert.equal(serverHermesSwitchedOff({ hermes: { state: "disabled-by-owner" } }), true);
  assert.equal(serverHermesSwitchedOff(applied), false);
  assert.equal(serverHermesSwitchedOff(null), false);
});

test("the app shows the section to the server Owner only", () => {
  const surface = readFileSync(new URL("../src/surface.tsx", import.meta.url), "utf8");
  assert.match(surface, /serverIdentity\?\.serverOwner === true \? \(\s*<ServerAccessSection client=\{api\}/);
});
