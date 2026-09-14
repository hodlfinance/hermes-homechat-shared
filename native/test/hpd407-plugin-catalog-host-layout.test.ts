import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("../src/PluginCatalogScreen.tsx", import.meta.url), "utf8");

test("the Connections catalog consumes the host palette", () => {
  assert.match(source, /import \{ useMobilePalette \} from "\.\/mobile-palette-context"/);
  assert.match(source, /const palette = useMobilePalette\(\)/);
  assert.match(source, /createPluginCatalogStyles\(palette\)/);
  assert.doesNotMatch(source, /import \{ palette \} from "\.\/mobile-palette"/);
});

test("compact phone rows keep one bounded trailing column", () => {
  assert.match(source, /<View style=\{styles\.trailingCell\}>/);
  assert.match(source, /rowMain:\s*\{[^}]*flex: 1[^}]*minWidth: 0/);
  assert.match(source, /rowCopy:\s*\{[^}]*flex: 1[^}]*minWidth: 0/);
  assert.match(source, /trailingCell:\s*\{[^}]*flexShrink: 0/);
  assert.doesNotMatch(source, /statusCell:\s*\{[^}]*width:/);
  assert.doesNotMatch(source, /actionCell:\s*\{[^}]*width:/);
  assert.match(source, /featuredConnectionOrder = \["gmail", "telegram", "calendar", "google_drive", "whatsapp"\]/);
});
