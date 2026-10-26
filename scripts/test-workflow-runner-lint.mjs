import assert from "node:assert/strict";
import { lintWorkflowText } from "./lint-workflow-runners.mjs";

const wf = (runsOn) => `name: x\njobs:\n  a:\n    runs-on: ${runsOn}\n    steps: []\n`;
assert.deepEqual(lintWorkflowText(wf("[self-hosted, hodl-ci]")), []);
assert.deepEqual(lintWorkflowText(`name: x\njobs:\n  a:\n    runs-on:\n      - self-hosted\n      - hodl-ci\n    steps: []\n`), []);
for (const bad of ["ubuntu-24.04", "ubuntu-latest", "macos-14", "[self-hosted, hey-hermes-ci]", "[self-hosted]", "[self-hosted, hodl-ci, extra]", "${{ vars.RUNNER }}"]) {
  assert.equal(lintWorkflowText(wf(bad)).length, 1, bad);
}
assert.equal(lintWorkflowText("name: x\njobs:\n  a:\n    steps: []\n").length, 1);
assert.equal(lintWorkflowText(wf("[self-hosted, hodl-ci]") + "  b:\n    runs-on: ubuntu-24.04\n").length, 1);
console.log("workflow runner lint tests ok");
