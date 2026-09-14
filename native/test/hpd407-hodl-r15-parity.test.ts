import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const paletteContext = readFileSync(new URL("../src/mobile-palette-context.tsx", import.meta.url), "utf8");
const surface = readFileSync(new URL("../src/surface.tsx", import.meta.url), "utf8");
const systemSurface = readFileSync(new URL("../src/mobile-system-surface.tsx", import.meta.url), "utf8");

test("the HODL host palette reaches the shared R15 navigation rows", () => {
  assert.match(paletteContext, /createContext<MobilePalette>\(defaultPalette\)/);
  assert.match(surface, /<MobilePaletteProvider value=\{palette\}>/);
  assert.match(systemSurface, /const palette = useMobilePalette\(\)/);
  assert.doesNotMatch(systemSurface, /import \{ palette \} from "\.\/mobile-palette"/);
  assert.match(systemSurface, /selected && \{ backgroundColor: palette\.tealSoft \}/);
});

test("the pre-snapshot HODL state uses the complete R15 drawer contract", () => {
  const opening = surface.slice(
    surface.indexOf("const renderChatOpening"),
    surface.indexOf("if (!sessionRestored)"),
  );

  assert.match(opening, /<MobileNavigationDrawer/);
  assert.match(opening, /onNewPage=\{/);
  assert.match(opening, /onOpenAutomations=\{/);
  assert.match(opening, /onOpenAiAccess=\{/);
  assert.match(opening, /onOpenDashboard=\{/);
  assert.match(opening, /showConnectGmail=\{false\}/);
  assert.doesNotMatch(opening, /<MobileSystemRow/);
});

test("the full drawer keeps the two HODL default-feature exclusions", () => {
  assert.match(surface, /item\.id !== "tasks" \|\| host\.policy\.preinstalledRanker/);
  assert.match(surface, /host\.policy\.preinstalledEmailScanner && recommendedConnection\?\.showMenuEntry/);
});

test("an external host keeps the R19 header and expandable account drawer without app-owned auth actions", () => {
  assert.match(surface, /host\.presentation\?\.centerChatTitle/);
  assert.match(surface, /host\.presentation\?\.chatTitle/);
  assert.match(surface, /host\.presentation\?\.hideChatSubtitle/);
  assert.match(surface, /host\.presentation\?\.hideDrawerPreferences/);
  assert.match(surface, /host\.presentation\?\.accountLabel\?\.trim\(\)/);
  assert.match(surface, /const \[accountMenuOpen, setAccountMenuOpen\] = useState\(false\)/);
  assert.match(surface, /host\.session\.mode === "standalone" \|\| !\["sign_out", "logout"\]\.includes\(item\.id\)/);
  assert.match(surface, /<Text style=\{styles\.mobileDrawerAccountLabel\} numberOfLines=\{1\}>\{accountLabel\}<\/Text>/);
  assert.match(surface, /host\.session\.mode === "standalone" && Platform\.OS === "ios"/);
  assert.match(surface, /host\.session\.mode === "standalone" && snapshot/);
  assert.match(surface, /accessibilityLabel=\{t\.systemPages\.account\.exportData\}/);
  assert.match(surface, /onPress=\{\(\) => void createFullArchive\(\)\}/);
  assert.match(surface, /stage="session"/);
  assert.match(surface, /sessionCopy=\{sessionFailureCopy\}/);
  assert.match(surface, /openingActivityTrail/);
});

test("the shared conversation can show the Hermes identity once without a welcome screen", () => {
  const opening = surface.slice(
    surface.indexOf("const renderChatOpening"),
    surface.indexOf("if (!sessionRestored)"),
  );
  assert.match(surface, /firstVisibleAssistantMessageId/);
  assert.match(surface, /showAssistantIdentity=\{message\.id === firstVisibleAssistantMessageId\}/);
  assert.match(surface, /assistantIdentityMark/);
  assert.match(surface, /baby-dragon-neutral\.png/);
  assert.doesNotMatch(opening, /<Text style=\{styles\.title\}>/);
});
