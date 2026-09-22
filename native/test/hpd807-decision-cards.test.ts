import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

// HPD-807: the clarify card looked dead on device. Its answer field used the
// row-oriented `styles.input` (flex: 1) inside a column, grew over the whole
// card and pushed "Send answer" and the expiry notice off screen; and a tap
// that could not be delivered returned without a word. The approval card had
// the same field above Approve/Reject whenever a typed confirmation is needed.

const surface = readFileSync(new URL("../src/surface.tsx", import.meta.url), "utf8");

function slice(startMarker: string, endMarker: string): string {
  const start = surface.indexOf(startMarker);
  const end = surface.indexOf(endMarker, start + startMarker.length);
  assert.ok(start >= 0, `missing ${startMarker}`);
  assert.ok(end > start, `missing ${endMarker} after ${startMarker}`);
  return surface.slice(start, end);
}

const approvalCard = slice("function MobileChatApprovalCard(", "function MobileChatClarifyCard(");
const clarifyCard = slice("function MobileChatClarifyCard(", "const reduceMotionStore");
const submitClarify = slice("async function submitMobileClarify(", "async function decideFinanceActionApproval(");
const submitApproval = slice("async function submitMobileConfirmation(", "async function submitMobileClarify(");

test("card fields do not grow over the card", () => {
  for (const [name, card] of [["approval", approvalCard], ["clarify", clarifyCard]] as const) {
    assert.match(card, /style=\{\[styles\.input, styles\.cardInput\]\}/, `${name} card field must use cardInput`);
    assert.doesNotMatch(card, /style=\{styles\.input\}/, `${name} card must not use the bare row style`);
  }
});

test("cardInput stops growth while the shared row style keeps it for the composer", () => {
  const cardInput = slice("  cardInput: {", "  },");
  assert.match(cardInput, /flex: 0/);
  assert.match(cardInput, /flexGrow: 0/);
  assert.doesNotMatch(cardInput, /flex: 1/);
  const input = slice("  input: {", "  },");
  assert.match(input, /flex: 1/, "the composer row still needs flex: 1");
});

test("expired and pending are stated above the choices, not hidden below the field", () => {
  const notice = clarifyCard.indexOf("This question has expired.");
  const sending = clarifyCard.indexOf("Sending your answer");
  const choices = clarifyCard.indexOf("clarify.choices.map");
  const field = clarifyCard.indexOf('placeholder="Other answer"');
  assert.ok(notice > 0 && sending > 0 && choices > 0 && field > 0);
  assert.ok(notice < choices && sending < choices, "state must precede the choices");
  assert.ok(notice < field, "state must precede the answer field");
  assert.equal(clarifyCard.split("This question has expired.").length - 1, 1, "stated exactly once");
});

test("a clarify tap that cannot be delivered says why", () => {
  assert.doesNotMatch(submitClarify, /!== "waiting_for_approval" \|\| !response\.trim\(\)\) return;/);
  assert.doesNotMatch(submitClarify, /confirmationDecisionGate\.claim\(runId\)\) return;/);
  assert.match(submitClarify, /This question is no longer open/);
  assert.match(submitClarify, /Your previous answer is still being sent/);
  // the single-call guard still precedes the only network call
  assert.ok(
    submitClarify.indexOf("confirmationDecisionGate.claim(runId)") <
      submitClarify.indexOf("api.resolveChatClarify("),
  );
  assert.equal(submitClarify.split("api.resolveChatClarify(").length - 1, 1);
});

test("an approval tap that cannot be delivered says why", () => {
  assert.doesNotMatch(submitApproval, /activeConversationSessionIdRef\.current\) return;/);
  assert.doesNotMatch(submitApproval, /!== "waiting_for_approval"\) return;/);
  assert.doesNotMatch(submitApproval, /confirmationDecisionGate\.claim\(runId\)\) return;/);
  assert.match(submitApproval, /belongs to another conversation/);
  assert.match(submitApproval, /This approval is no longer open/);
  assert.match(submitApproval, /Your previous decision is still being sent/);
  assert.ok(
    submitApproval.indexOf("confirmationDecisionGate.claim(runId)") <
      submitApproval.indexOf("api.decideApproval("),
  );
});
