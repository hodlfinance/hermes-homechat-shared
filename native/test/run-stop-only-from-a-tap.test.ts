import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

// Justus' Fin chat, Build 89, 2026-09-27 10:34:34Z: run_QuAjbhlJV1zavf was
// stopped twelve seconds after the HODL access gate had remounted the chat.
// Every request that stops a run has to start at a control the customer
// pressed. No effect, cleanup, reconnect, session change or remount may reach
// one: on unmount the screen detaches from the run and the run keeps working.

const surface = readFileSync(new URL("../src/surface.tsx", import.meta.url), "utf8");
const lines = surface.split("\n");

// The functions that send a stop, and the only places allowed to call them.
const STOPPERS = ["stopReply", "cancelQueuedFollowUp", "closeDelegatedTask", "stopDelegatedTaskFromComposer"];
const STOP_CALLS = [/hermesApi\.stopRun\(/, /hermesApi\.stopDelegatedTask\(/, /\bsession\.stop\(/];

function enclosingFunction(index: number): string | null {
  for (let i = index; i >= 0; i -= 1) {
    const line = lines[i] ?? "";
    const match = /^ {2}(?:async )?function (\w+)\(/.exec(line);
    if (match) return match[1] ?? null;
    if (/^ {2}\S/.test(line) && !/^ {2}\}/.test(line) && i !== index) {
      // a top-level statement of the component (a hook, a const) ends the search
      if (!/^ {2}(?:\/\/|\*|\/\*)/.test(line)) return null;
    }
  }
  return null;
}

test("every run stop request sits inside a stop function", () => {
  const offenders: string[] = [];
  lines.forEach((line, index) => {
    if (!STOP_CALLS.some((pattern) => pattern.test(line))) return;
    // The run session's transport: it is called only through session.stop,
    // whose callers this test checks.
    if (/^\s*stopRun: \(runId: string, context/.test(line)) return;
    const owner = enclosingFunction(index);
    if (!owner || !STOPPERS.includes(owner)) offenders.push(`${index + 1}: ${line.trim()} (in ${owner ?? "component body"})`);
  });
  assert.deepEqual(offenders, []);
});

test("the stop functions are reached only from a press, never from an effect, a cleanup or a reconnect", () => {
  const offenders: string[] = [];
  lines.forEach((line, index) => {
    for (const name of STOPPERS) {
      if (!new RegExp(`\\b${name}\\(`).test(line)) continue;
      if (new RegExp(`function ${name}\\(`).test(line)) continue;
      const owner = enclosingFunction(index);
      if (owner && STOPPERS.includes(owner)) continue;
      const handler = lines.slice(Math.max(0, index - 6), index + 1).join("\n");
      if (/\b(onPress|onCancel|onCloseTask)=\{/.test(handler) && !/useEffect|return \(\) =>/.test(handler)) continue;
      offenders.push(`${index + 1}: ${line.trim()}`);
    }
  });
  assert.deepEqual(offenders, []);
});
