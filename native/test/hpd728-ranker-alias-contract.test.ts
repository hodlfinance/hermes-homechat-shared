import assert from "node:assert/strict";
import test from "node:test";
import { rankedTaskAutomationTemplates, validateManagedAutomationSnapshot } from "../core/ranked-task-automations";

test("installed ranker uses local card alias rather than projection supersedes", () => {
  const ranker = rankedTaskAutomationTemplates.ranker;
  const prompt = ranker.defaultSnapshot.prompt;

  assert.equal(ranker.officialVersion, 13);
  assert.equal(validateManagedAutomationSnapshot(ranker.defaultSnapshot).prompt, prompt);
  assert.match(prompt, /compare all cards.*manual.*pending.*unchanged rated/i);
  assert.match(prompt, /ranked_tasks_local/);
  assert.match(prompt, /alias with \{sourceId,targetId,confirmed:true\}/);
  assert.match(prompt, /Do not automatically merge away manually rated, done or dismissed cards/);
  assert.match(prompt, /Do not stage candidates/);
  assert.doesNotMatch(prompt, /send.*card.*supersedes|only supersedes folds/i);
});
