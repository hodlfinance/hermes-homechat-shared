import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import { palette as sharedPalette } from "../ui/index";

/**
 * HPD-1228: the HODL Android app died while loading its JavaScript with
 * "DynamicColorIOS is not available on this platform." The palette module
 * built its iOS colours on every platform, and HODL loads it at start.
 *
 * These tests load the real module source against a react-native double that
 * behaves like React Native does: DynamicColorIOS throws anywhere but on iOS.
 */
type Scheme = "light" | "dark" | null | undefined;
type Loaded = { palette: Record<string, unknown>; dynamicCalls: number };

const fixtureUrl = new URL("./fixtures/hpd1228-ios-palette.json", import.meta.url);

function loadPalette(os: string, scheme: Scheme = "light", options: { appearance?: unknown } = {}): Loaded {
  const code = ts.transpileModule(
    readFileSync(new URL("../src/mobile-palette.ts", import.meta.url), "utf8"),
    { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
  ).outputText;
  const exports: Record<string, unknown> = {};
  const loaded: Loaded = { palette: {}, dynamicCalls: 0 };
  const reactNative = {
    Platform: { OS: os },
    Appearance: "appearance" in options ? options.appearance : { getColorScheme: () => scheme },
    DynamicColorIOS(tuple: { light: string; dark: string }) {
      // What react-native ships for every platform except iOS.
      if (os !== "ios") throw new Error("DynamicColorIOS is not available on this platform.");
      loaded.dynamicCalls += 1;
      return { dynamic: { light: tuple.light, dark: tuple.dark } };
    },
  };
  vm.runInNewContext(code, {
    exports,
    require(name: string) {
      if (name === "react-native") return reactNative;
      if (name === "../ui/index") return { palette: sharedPalette };
      throw new Error(`Unexpected dependency: ${name}`);
    },
  });
  loaded.palette = exports.palette as Record<string, unknown>;
  return loaded;
}

/** Key order is part of the snapshot, so serialise without sorting. */
function serialise(palette: Record<string, unknown>): string {
  return `${JSON.stringify(palette, null, 2)}\n`;
}

// The fixture was recorded from this module at 9c54ae5, the commit before the
// guard, with this same loader. It is the "before" of the comparison.
test("the iOS palette is byte-identical to the one recorded before the Android guard", () => {
  const actual = serialise(loadPalette("ios").palette);
  assert.ok(existsSync(fixtureUrl), "the recorded iOS palette is missing");
  assert.equal(actual, readFileSync(fixtureUrl, "utf8"));
});

test("the iOS palette does not depend on the scheme the system reports at load", () => {
  const expected = readFileSync(fixtureUrl, "utf8");
  assert.equal(serialise(loadPalette("ios", "dark").palette), expected);
  assert.equal(serialise(loadPalette("ios", null).palette), expected);
});

test("loading the palette on Android does not throw", () => {
  for (const scheme of ["light", "dark", null, undefined] as Scheme[]) {
    assert.doesNotThrow(() => loadPalette("android", scheme), `scheme ${String(scheme)}`);
  }
  assert.equal(loadPalette("android", "dark").dynamicCalls, 0);
});

test("Android gets the iOS colour values, resolved for light and for dark", () => {
  const ios = JSON.parse(readFileSync(fixtureUrl, "utf8")) as Record<string, { dynamic: { light: string; dark: string } }>;
  const light = loadPalette("android", "light").palette;
  const dark = loadPalette("android", "dark").palette;
  assert.deepEqual(Object.keys(light), Object.keys(ios));
  assert.deepEqual(Object.keys(dark), Object.keys(ios));
  for (const [key, colour] of Object.entries(ios)) {
    assert.equal(light[key], colour.dynamic.light, `light ${key}`);
    assert.equal(dark[key], colour.dynamic.dark, `dark ${key}`);
    assert.equal(typeof light[key], "string");
    assert.equal(typeof dark[key], "string");
  }
});

test("Android falls back to the light values when the system reports no scheme", () => {
  // Each load runs in its own vm context, so compare the serialised form.
  const light = serialise(loadPalette("android", "light").palette);
  assert.equal(serialise(loadPalette("android", null).palette), light);
  assert.equal(serialise(loadPalette("android", undefined).palette), light);
  assert.equal(serialise(loadPalette("android", "light", { appearance: undefined }).palette), light);
  assert.equal(serialise(loadPalette("android", "light", { appearance: {} }).palette), light);
});

test("other platforms keep the plain light palette they had", () => {
  const web = loadPalette("web", "dark");
  assert.equal(web.dynamicCalls, 0);
  assert.equal(web.palette.ink, "#0b0b0c");
  assert.equal(web.palette.text, "#2a2a30");
  assert.equal(web.palette.accentText, "#ffffff");
});
