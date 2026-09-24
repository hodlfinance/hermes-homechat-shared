import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import * as startup from "../src/mobile-home-chat-startup";

// HPD-871 hotfix. PR #71 removed mobileHomeChatSnapshotSessionId from
// mobile-home-chat-startup.ts while surface.tsx still imported and called it
// right after GET /snapshot/startup, before the snapshot is published. The
// bundler resolved the missing import to undefined, every startup refresh threw
// "is not a function", the snapshot stayed empty, and the app polled
// status-truth and snapshot/startup every 2.5 s without ever opening the chat
// (HODL Builds 56/57 on 2026-09-24). Neither tsx nor the Metro bundler reports
// a missing named import, so the guard below checks the source itself.

const here = dirname(fileURLToPath(import.meta.url));
const srcDir = resolve(here, "../src");

test("the startup snapshot names the conversation it belongs to", () => {
  assert.equal(typeof startup.mobileHomeChatSnapshotSessionId, "function");
  assert.equal(startup.mobileHomeChatSnapshotSessionId([]), null);
  assert.equal(
    startup.mobileHomeChatSnapshotSessionId([
      { conversationSessionId: "  " },
      { conversationSessionId: null },
      { conversationSessionId: " session_home " },
      { conversationSessionId: "session_other" },
    ]),
    "session_home",
  );
});

function exportedNames(file: string): Set<string> {
  const text = readFileSync(file, "utf8");
  const names = new Set<string>();
  for (const match of text.matchAll(/export\s+(?:declare\s+)?(?:async\s+)?(?:function\*?|const|let|var|class|enum|type|interface)\s+([A-Za-z_$][\w$]*)/g)) {
    names.add(match[1]);
  }
  for (const match of text.matchAll(/export\s+(?:type\s+)?\{([^}]*)\}/g)) {
    for (const part of match[1].split(",")) {
      const name = part.trim().replace(/^type\s+/, "").split(/\s+as\s+/).pop()?.trim();
      if (name) names.add(name);
    }
  }
  if (/export\s+\*\s+from/.test(text)) names.add("*");
  return names;
}

function resolveModule(fromFile: string, specifier: string): string | null {
  const base = resolve(dirname(fromFile), specifier);
  for (const candidate of [base, `${base}.ts`, `${base}.tsx`, join(base, "index.ts"), join(base, "index.tsx")]) {
    if (existsSync(candidate) && candidate.match(/\.tsx?$/)) return candidate;
  }
  return null;
}

test("every named import between native/src modules is exported by its source", () => {
  const missing: string[] = [];
  for (const entry of readdirSync(srcDir)) {
    if (!/\.tsx?$/.test(entry)) continue;
    const file = join(srcDir, entry);
    const text = readFileSync(file, "utf8");
    for (const match of text.matchAll(/import\s+(type\s+)?\{([^}]*)\}\s+from\s+"(\.\/[^"]+)"/g)) {
      if (match[1]) continue;
      const target = resolveModule(file, match[3]);
      if (!target) continue;
      const exported = exportedNames(target);
      if (exported.has("*")) continue;
      for (const part of match[2].split(",")) {
        const raw = part.trim();
        if (!raw || raw.startsWith("type ")) continue;
        const name = raw.split(/\s+as\s+/)[0].trim();
        if (!exported.has(name)) missing.push(`${entry}: ${name} from ${match[3]}`);
      }
    }
  }
  assert.deepEqual(missing, []);
});
