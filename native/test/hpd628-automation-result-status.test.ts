import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { appLocales } from "../core/index";
import { mobileText } from "../src/appI18n";
import { automationCardFromManaged, automationCardNotice } from "../src/mobile-automation-card";

const modelSource = readFileSync(new URL("../src/mobile-automation-card.ts", import.meta.url), "utf8");
const cardSource = readFileSync(new URL("../src/AutomationCard.tsx", import.meta.url), "utf8");

test("managed automation result truth reaches the visible native card", () => {
  assert.match(modelSource, /resultStatus: automation\.resultStatus/);
  assert.doesNotMatch(modelSource, /automation\.lastStatus/);
  assert.match(cardSource, /copy\.result\[automation\.resultStatus\]/);
  assert.match(cardSource, /automationCardNotice\(automation, copy\.storedResultFailure\)/);
});

test("every native locale names every structured automation result state", () => {
  for (const locale of appLocales) {
    const result = mobileText(locale).systemPages.automations.result;
    assert.deepEqual(Object.keys(result).sort(), ["failed", "never", "not_stored", "pending", "stored"]);
    assert.ok(Object.values(result).every((value) => value.trim().length > 0), locale);
  }
});

test("a stored result keeps a later run failure visible without claiming that nothing was saved", () => {
  const staleFailure = "The last run did not go through, so nothing was updated from it.";
  for (const locale of appLocales) {
    const copy = mobileText(locale).systemPages.automations;
    assert.equal(
      automationCardNotice({ nativeFailureAfterStoredResult: true, notice: staleFailure }, copy.storedResultFailure),
      copy.storedResultFailure,
    );
    assert.ok(copy.storedResultFailure.trim().length > 0, locale);
  }
  assert.equal(
    automationCardNotice({ nativeFailureAfterStoredResult: false, notice: staleFailure }, "A saved result remains available."),
    staleFailure,
  );
  assert.equal(
    automationCardNotice({ nativeFailureAfterStoredResult: true, notice: null }, "A saved result remains available."),
    null,
  );
});

test("stored results do not rewrite missing or not-storing notices", () => {
  for (const notice of [
    "This automation is missing.",
    "This automation is paused.",
    "The last run stored no result.",
  ]) {
    assert.equal(
      automationCardNotice({ nativeFailureAfterStoredResult: false, notice }, "Separate delivery failure."),
      notice,
    );
  }
  assert.match(
    modelSource,
    /automation\.stalled === "failing"/,
  );
  assert.doesNotMatch(modelSource, /notice\.(?:includes|match)/);
});


test("a stored result preserves the actionable AI Access notice", () => {
  const fixture = {
    metadata: { role: "email_scanner", nativeJobId: "scanner", activeUserVersion: 1 },
    snapshot: { name: "Scanner", schedule: "0 8 * * *", delivery: "chat" },
    versions: [], enabled: true, resultStatus: "stored", stalled: "ai_route",
  } as unknown as Parameters<typeof automationCardFromManaged>[0];
  const card = automationCardFromManaged(fixture);
  const notice = automationCardNotice(card, mobileText("en").systemPages.automations.storedResultFailure);
  assert.equal(card.resultStatus, "stored");
  assert.equal(notice, card.notice);
  assert.match(notice ?? "", /Open AI Access, choose your route again/);
  assert.equal(card.nativeFailureAfterStoredResult, false);
});
