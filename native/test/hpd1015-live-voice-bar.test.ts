import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

type Element = { type: unknown; props: Record<string, any> };

function render(phase: string, reduceMotion: boolean | null, onEnd = () => {}) {
  const effects: Array<() => (() => void) | undefined> = [];
  const animation = { starts: 0, stops: 0 };
  const jsx = (type: unknown, props: Record<string, unknown>) => ({ type, props });
  const exports: Record<string, any> = {};
  const source = readFileSync(new URL("../src/mobile-live-voice-bar.tsx", import.meta.url), "utf8");
  const code = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022,
  } }).outputText;
  vm.runInNewContext(code, { exports, require(name: string) {
    if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
    if (name === "react") return { useRef: (current: unknown) => ({ current }), useEffect: (effect: () => undefined) => effects.push(effect) };
    if (name === "react-native") return {
      View: "View", Pressable: "Pressable", StyleSheet: { create: (styles: unknown) => styles },
      Animated: { View: "AnimatedView", Value: class { setValue() {} interpolate(config: unknown) { return config; } },
        timing: (_value: unknown, options: { useNativeDriver: boolean }) => { assert.equal(options.useNativeDriver, true); return {}; },
        loop: () => ({ start() { animation.starts++; }, stop() { animation.stops++; } }) },
      Easing: { quad: {}, inOut: () => ({}) },
    };
    if (name === "lucide-react-native") return { X: "X" };
    if (name === "./mobile-palette-context") return { useMobilePalette: () => ({}) };
    throw new Error(`Unexpected native dependency: ${name}`);
  } });
  const element = exports.MobileLiveVoiceBar({ phase, reduceMotion, onEnd, brand: "Hermes", statusLabel: phase, endLabel: "End Voice" }) as Element;
  return { element, effects, animation };
}

test("the active bar has three elements and keeps an accessible close control during connection, listening and work", () => {
  for (const phase of ["connecting", "listening", "speaking", "waiting", "ending"]) {
    let ended = 0;
    const { element } = render(phase, false, () => { ended++; });
    const children = element.props.children as Element[];
    assert.equal(children.length, 3);
    assert.equal(children[0]!.props.children, "Hermes");
    assert.equal(children[1]!.props.testID, "live-voice-wave");
    assert.equal(children[1]!.props.accessibilityLabel, phase);
    const close = children[2]!;
    assert.equal(close.props.testID, "live-voice-end");
    assert.equal(close.props.accessibilityLabel, "End Voice");
    assert.equal(close.props.disabled, phase === "ending");
    if (!close.props.disabled) { close.props.onPress(); assert.equal(ended, 1); }
  }
});

test("the wave stops on cleanup and stays still while waiting or when reduced motion is enabled or unread", () => {
  for (const [phase, reduced, expected] of [
    ["listening", false, 1], ["speaking", false, 1], ["waiting", false, 0],
    ["connecting", false, 0], ["ending", false, 0], ["listening", true, 0], ["listening", null, 0],
  ] as const) {
    const { effects, animation } = render(phase, reduced);
    const cleanups = effects.map(effect => effect());
    assert.equal(animation.starts, expected);
    cleanups.forEach(cleanup => cleanup?.());
    assert.equal(animation.stops, expected);
  }
});

test("the bar is inside the active composer and its visibility does not depend on draft text", () => {
  const source = readFileSync(new URL("../src/surface.tsx", import.meta.url), "utf8");
  const file = ts.createSourceFile("surface.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const bars: ts.JsxSelfClosingElement[] = [];
  const visit = (node: ts.Node) => { if (ts.isJsxSelfClosingElement(node) && node.tagName.getText(file) === "MobileLiveVoiceBar") bars.push(node); ts.forEachChild(node, visit); };
  visit(file);
  assert.equal(bars.length, 1);
  const bar = bars[0]!;
  let visibility: ts.Node = bar.parent;
  while (!ts.isConditionalExpression(visibility)) visibility = visibility.parent;
  assert.equal(visibility.condition.getText(file), "liveVoiceConnected");
  let parent: ts.Node | undefined = bar.parent;
  while (parent && !(ts.isJsxElement(parent) && parent.openingElement.attributes.getText(file).includes("styles.chatComposerDock"))) parent = parent.parent;
  assert.ok(parent, "End Voice must stay beside the input, not in the header notice stack.");
  assert.equal(bar.attributes.properties.find(p => ts.isJsxAttribute(p) && p.name.getText(file) === "onEnd")?.getText(file),
    "onEnd={() => void liveVoiceController.end()}");
});
