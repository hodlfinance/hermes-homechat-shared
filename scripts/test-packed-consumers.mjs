import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const temporaryRoot = mkdtempSync(join(tmpdir(), "hermes-homechat-packed-"));
let tarballPath = "";

function run(command, args, cwd) {
  return execFileSync(command, args, {
    cwd,
    encoding: "utf8",
    env: { ...process.env, npm_config_update_notifier: "false" },
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function writeJson(path, value) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

try {
  const packed = JSON.parse(run("npm", ["pack", "--json", "--workspaces=false"], packageRoot));
  assert.equal(packed.length, 1);
  tarballPath = join(packageRoot, packed[0].filename);
  const packedFiles = new Set(packed[0].files.map((file) => file.path));
  for (const required of [
    "LICENSE",
    "README.md",
    "dist/index.d.ts",
    "dist/index.js",
    "dist/react.d.ts",
    "dist/react.js",
  ]) {
    assert.ok(packedFiles.has(required), `Packed package is missing ${required}`);
  }
  assert.ok(![...packedFiles].some((path) => path.startsWith("src/")), "Packed package must not expose source files");

  const coreConsumer = join(temporaryRoot, "core-consumer");
  run("mkdir", ["-p", coreConsumer], temporaryRoot);
  writeJson(join(coreConsumer, "package.json"), { name: "core-consumer", private: true, type: "module" });
  run("npm", ["install", "--ignore-scripts", "--no-package-lock", "--omit=peer", tarballPath], coreConsumer);
  run(
    process.execPath,
    [
      "--input-type=module",
      "--eval",
      "const core = await import('@hodlfinance/hermes-homechat-shared/core'); if (typeof core.createHomechatClientController !== 'function') throw new Error('core export missing');",
    ],
    coreConsumer,
  );
  const coreManifest = JSON.parse(readFileSync(join(coreConsumer, "node_modules/@hodlfinance/hermes-homechat-shared/package.json"), "utf8"));
  assert.equal(coreManifest.exports["./core"].import, "./dist/index.js");

  const reactConsumer = join(temporaryRoot, "react-consumer");
  run("mkdir", ["-p", reactConsumer], temporaryRoot);
  writeJson(join(reactConsumer, "package.json"), { name: "react-consumer", private: true, type: "module" });
  run(
    "npm",
    [
      "install",
      "--ignore-scripts",
      "--no-package-lock",
      tarballPath,
      "react@^19.0.0",
      "react-dom@^19.0.0",
      "@types/react@^19.0.0",
      "@types/react-dom@^19.0.0",
      "typescript@^5.9.0",
    ],
    reactConsumer,
  );
  writeJson(join(reactConsumer, "tsconfig.json"), {
    compilerOptions: {
      jsx: "react-jsx",
      module: "NodeNext",
      moduleResolution: "NodeNext",
      noEmit: true,
      strict: true,
      target: "ES2022",
    },
    include: ["consumer.tsx"],
  });
  writeFileSync(join(reactConsumer, "consumer.tsx"), `import { HomechatTranscript } from "@hodlfinance/hermes-homechat-shared/react";
import type { SharedHomechatKeyedProductSlots, SharedHomechatMessage } from "@hodlfinance/hermes-homechat-shared/core";

const messages: SharedHomechatMessage[] = [{ id: "message-1", runId: "run-1", role: "assistant", content: "Ready" }];
const slots: SharedHomechatKeyedProductSlots = { byMessageId: {}, byRunId: {} };
export const transcript = <HomechatTranscript messages={messages} slots={slots} renderers={{ message: (message) => message.content }} />;
`);
  run(process.execPath, ["node_modules/typescript/bin/tsc", "--noEmit"], reactConsumer);

  process.stdout.write(`Packed consumer smoke passed for ${basename(tarballPath)}\n`);
} finally {
  if (tarballPath) rmSync(tarballPath, { force: true });
  rmSync(temporaryRoot, { force: true, recursive: true });
}
