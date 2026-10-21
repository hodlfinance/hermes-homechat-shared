import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

/**
 * HPD-1442: HODL and LiveQuote draw Hermes as a round bot figure in the colour
 * of the thread; Hey keeps its dragon and brand icon. The host option is
 * optional, so a host without it (Hey) must render exactly what it did before.
 */
const surface = readFileSync(new URL("../src/surface.tsx", import.meta.url), "utf8");
const host = readFileSync(new URL("../host.ts", import.meta.url), "utf8");

test("the host option is optional and typed", () => {
  assert.match(host, /assistantAvatar\?: ComponentType<NativeR8AssistantAvatarProps>;/);
  for (const field of ["size: number;", "conversationId: string | null;", "home: boolean;", "animated: boolean;", "working: boolean;", "accessibilityLabel?: string;"]) {
    assert.ok(host.includes(field), field);
  }
});

test("without a host figure every mark falls back to the dragon or brand icon", () => {
  assert.match(surface, /const HostAssistantAvatar = host\.presentation\?\.assistantAvatar \?\? null;/);
  // The working mark: dragon unless the host draws one.
  assert.match(surface, /if \(HostAssistantAvatar\) \{\s*return <HostAssistantFigure[^]*?return <MobileWorkingDragon animated=\{animated\} accessibilityLabel=\{accessibilityLabel\} size=\{size\} tintColor=\{tintColor\} \/>;/);
  // The name mark above a reply and the logo: brand icon unless the host draws one.
  assert.match(surface, /HostAssistantAvatar \? \(\s*<HostIdentityFigure size=\{28\} \/>\s*\) : \(\s*<Image source=\{brandIcon\} style=\{styles\.assistantIdentityMark as ImageStyle\}/);
  assert.match(surface, /if \(HostAssistantAvatar\) return <HostIdentityFigure size=\{36\} thread=\{thread\} \/>;\s*return <Image source=\{brandIcon\} style=\{styles\.brandMark as ImageStyle\}/);
  // The background-task bar keeps its one blue dragon column for Hey.
  assert.match(surface, /HostAssistantAvatar \? null : \(\s*<View style=\{styles\.delegatedTasksDragon\}>\s*<MobileWorkingDragon/);
  // No working mark is drawn as a bare dragon anymore except the fallbacks.
  assert.equal((surface.match(/<MobileWorkingDragon/g) ?? []).length, 2);
});

test("each background task row gets a figure for its own thread", () => {
  assert.match(surface, /<HostAssistantFigure\s+size=\{18\}[^]*?thread=\{\{ conversationId: task\.conversationId, home: false \}\}/);
});

test("the chat tells the figure which thread is on screen", () => {
  assert.match(surface, /const activeAssistantThread = assistantThreadFor\(activeConversationSessionId, activeChatSession\?\.role === "home"\);/);
  assert.match(surface, /<AssistantThreadContext\.Provider value=\{activeAssistantThread\}>/);
  assert.match(surface, /<\/AssistantThreadContext\.Provider>/);
  // The drawer's brand mark stands for Hermes himself, the Home thread.
  assert.match(surface, /<LogoMark thread=\{HOME_ASSISTANT_THREAD\} \/>/);
});
