import assert from "node:assert/strict";
import test from "node:test";
import {
  currentRankedTaskAutomationName,
  legacyRankedTaskAutomationNames,
  rankedTaskAutomationLabels,
  rankedTaskAutomationTemplates,
  withCurrentRankedTaskAutomationName,
} from "../core/ranked-task-automations";

// HPD-1012: "Ranked Tasks email scanner" is now "E-Mail-Scanner" and
// "Ranked Tasks ranker" is now "Tasks Ranker", in Hey and in Fin.
test("HPD-1012 standard automations carry the new names", () => {
  assert.equal(rankedTaskAutomationTemplates.emailScanner.defaultSnapshot.name, "E-Mail-Scanner");
  assert.equal(rankedTaskAutomationTemplates.ranker.defaultSnapshot.name, "Tasks Ranker");
  assert.equal(rankedTaskAutomationLabels.scanner, "E-Mail-Scanner");
  assert.equal(rankedTaskAutomationLabels.ranker, "Tasks Ranker");
  assert.doesNotMatch(JSON.stringify(rankedTaskAutomationLabels), /Ranked Tasks (email scanner|ranker)|Email scanner/);
});

test("HPD-1012 maps only the exact old default name", () => {
  assert.deepEqual(legacyRankedTaskAutomationNames, { email_scanner: "Ranked Tasks email scanner", ranker: "Ranked Tasks ranker" });
  assert.equal(currentRankedTaskAutomationName("Ranked Tasks email scanner"), "E-Mail-Scanner");
  assert.equal(currentRankedTaskAutomationName("Ranked Tasks ranker"), "Tasks Ranker");
  assert.equal(currentRankedTaskAutomationName("Mein Ranker"), "Mein Ranker");
  assert.equal(currentRankedTaskAutomationName("ranked tasks ranker"), "ranked tasks ranker");
  const legacy = { ...rankedTaskAutomationTemplates.ranker.defaultSnapshot, name: "Ranked Tasks ranker" };
  assert.deepEqual(withCurrentRankedTaskAutomationName(legacy), rankedTaskAutomationTemplates.ranker.defaultSnapshot);
  const own = { ...legacy, name: "Mein Ranker" };
  assert.equal(withCurrentRankedTaskAutomationName(own), own);
});
