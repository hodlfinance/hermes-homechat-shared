import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const pageRow = readFileSync(new URL("../src/mobile-page-menu-row.tsx", import.meta.url), "utf8");
const systemRows = readFileSync(new URL("../src/mobile-system-surface.tsx", import.meta.url), "utf8");

test("custom Page rows reuse the built-in navigation icon and text columns", () => {
  const metrics = Object.fromEntries(
    [...systemRows.matchAll(/^  (columnGap|horizontalInset|iconColumnWidth|minimumTouchTarget): (\d+),$/gm)]
      .map((match) => [match[1], Number(match[2])]),
  );
  assert.deepEqual(metrics, { columnGap: 12, horizontalInset: 16, iconColumnWidth: 28, minimumTouchTarget: 48 });
  assert.equal(metrics.horizontalInset + metrics.iconColumnWidth + metrics.columnGap, 56);
  assert.match(pageRow, /import \{ mobileSystemSurfaceMetrics \} from "\.\/mobile-system-surface"/);
  assert.match(pageRow, /<View style=\{styles\.iconColumn\}[\s\S]*?\{icon\}[\s\S]*?<Text style=\{\[styles\.label/);
  assert.match(pageRow, /paddingLeft: mobileSystemSurfaceMetrics\.horizontalInset/);
  assert.match(pageRow, /marginRight: mobileSystemSurfaceMetrics\.columnGap/);
  assert.match(pageRow, /width: mobileSystemSurfaceMetrics\.iconColumnWidth/);
  assert.match(pageRow, /label: \{ flex: 1, fontSize: 17 \}/);
});
