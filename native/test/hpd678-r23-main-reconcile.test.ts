import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const surface = readFileSync(new URL("../src/surface.tsx", import.meta.url), "utf8");

test("R23 durable approvals coexist with assistant identity and Finance cards", () => {
  const messageBubble = surface.slice(
    surface.indexOf("function MessageBubble("),
    surface.indexOf("function MobileChatApprovalCard("),
  );

  assert.match(surface, /const visibleChatApprovalCards = mobileVisibleChatApprovalCards\(\{/);
  assert.match(surface, /visibleChatApprovalCards\.map\(\(card\) =>/);
  assert.match(surface, /const firstVisibleAssistantMessageId = host\.presentation\?\.showAssistantIdentity/);
  assert.match(surface, /showAssistantIdentity=\{message\.id === firstVisibleAssistantMessageId\}/);
  assert.match(messageBubble, /<LinkedMessageText text=\{assistantText\} \/>/);
  assert.match(messageBubble, /uniqueMobileFinanceArtifactReferences\(message\.artifactReferences\)/);
  assert.match(messageBubble, /<FinanceArtifactCard/);
  assert.match(surface, /<MobileFinanceActionApprovalCard/);

  // General Hermes approvals are durable API-backed cards. The old transient
  // confirmation inferred from run events must not return during reconciliation.
  assert.doesNotMatch(messageBubble, /visibleAssistantText|confirmationPending|onConfirm/);
});
