#!/usr/bin/env node
// HPD-1749: every job must run on our own CI machine and nowhere else.
// Allowed: runs-on: [self-hosted, hodl-ci]  (or the block-list form of the same two labels).
// Refused: GitHub-hosted labels (ubuntu-*, windows-*, macos-*), expressions, another product's label
// (for example hey-hermes-ci), a missing runs-on, or any extra label.
import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const ALLOWED = ["self-hosted", "hodl-ci"];

export function lintWorkflowText(text, file = "workflow") {
  const problems = [];
  const lines = text.split(/\r?\n/);
  let jobs = 0;
  let inJobs = false;
  let currentJob = null;
  let sawRunsOn = false;
  const closeJob = () => {
    if (currentJob && !sawRunsOn) problems.push(`${file}: job "${currentJob}" has no runs-on (reusable-workflow jobs are not allowed here)`);
  };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^jobs:\s*$/.test(line)) { inJobs = true; continue; }
    if (inJobs && /^\S/.test(line) && !/^\s*#/.test(line)) { closeJob(); currentJob = null; inJobs = false; }
    if (!inJobs) continue;
    const job = /^  ([A-Za-z0-9_-]+):\s*$/.exec(line);
    if (job) { closeJob(); currentJob = job[1]; sawRunsOn = false; jobs++; continue; }
    const ro = /^    runs-on:\s*(.*?)\s*(#.*)?$/.exec(line);
    if (!ro) continue;
    sawRunsOn = true;
    let labels;
    const value = ro[1];
    if (value === "") {
      labels = [];
      for (let j = i + 1; j < lines.length; j++) {
        const item = /^\s{6,}-\s*(\S+)\s*$/.exec(lines[j]);
        if (!item) break;
        labels.push(item[1].replace(/^["']|["']$/g, ""));
      }
    } else if (value.startsWith("[")) {
      labels = value.replace(/^\[|\]$/g, "").split(",").map((s) => s.trim().replace(/^["']|["']$/g, "")).filter(Boolean);
    } else {
      labels = [value.replace(/^["']|["']$/g, "")];
    }
    const sorted = [...labels].sort().join(",");
    if (sorted !== [...ALLOWED].sort().join(",")) {
      problems.push(`${file}: job "${currentJob}" uses runs-on [${labels.join(", ")}]; only [${ALLOWED.join(", ")}] is allowed`);
    }
  }
  closeJob();
  if (jobs === 0) problems.push(`${file}: no jobs found`);
  return problems;
}

export function lintDirectory(dir) {
  let names = [];
  try { names = readdirSync(dir).filter((n) => /\.ya?ml$/.test(n)); } catch { return [`${dir}: workflows directory missing`]; }
  return names.flatMap((n) => lintWorkflowText(readFileSync(join(dir, n), "utf8"), n));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const dir = resolve(process.argv[2] ?? "../.github/workflows");
  const problems = lintDirectory(dir);
  if (problems.length) { console.error(problems.join("\n")); process.exit(1); }
  console.log(`workflow runners ok (${dir})`);
}
