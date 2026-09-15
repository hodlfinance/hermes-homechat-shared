import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

type Node = { type: unknown; props: Record<string, unknown> };

const hodlPalette = {
  accent: "#2AB7D6",
  accentText: "#021929",
  coral: "#D63D3D",
  ink: "#FFFFFF",
  lineStrong: "#25435B",
  secondary: "#8C9DAA",
  text: "#FFFFFF",
  userTint: "#032136",
};

function allNodes(value: unknown): Node[] {
  if (!value || typeof value !== "object") return [];
  if (Array.isArray(value)) return value.flatMap(allNodes);
  const node = value as Node;
  return [node, ...allNodes(node.props?.children)];
}

function styleOf(node: Node): Record<string, unknown> {
  const styles = typeof node.props.style === "function"
    ? (node.props.style as (state: { pressed: boolean }) => unknown)({ pressed: false })
    : node.props.style;
  if (Array.isArray(styles)) return Object.assign({}, ...styles.filter((style) => style && typeof style === "object"));
  return styles && typeof styles === "object" ? styles as Record<string, unknown> : {};
}

function renderSignedInForm(): Node[] {
  const code = ts.transpileModule(
    readFileSync(new URL("../src/SupportRequestForm.tsx", import.meta.url), "utf8"),
    { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } },
  ).outputText;
  const exports: Record<string, unknown> = {};
  const jsx = (type: unknown, props: Record<string, unknown>) => ({ type, props });
  const state = [
    { status: "ready", projection: {
      accountDisplay: "Hey account •••• TEST",
      replyChannel: { kind: "verified_product_email", display: "t•••@example.invalid" },
    } },
    "", "", null, null, false, false, false,
  ];
  vm.runInNewContext(code, {
    exports,
    require(name: string) {
      if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
      if (name === "react") return {
        useCallback: (callback: unknown) => callback,
        useEffect: () => undefined,
        useRef: (initial: unknown) => ({ current: initial }),
        useState: () => [state.shift(), () => undefined],
      };
      if (name === "react-native") return {
        ActivityIndicator: "ActivityIndicator", Clipboard: {}, Linking: {}, Pressable: "Pressable",
        StyleSheet: { create: (styles: unknown) => styles }, Text: "Text", TextInput: "TextInput",
        useColorScheme: () => "light", View: "View",
      };
      if (name.includes("support-request")) return {
        UNAVAILABLE_SUPPORT_REQUEST_CLIENT: {},
        supportRequestCopy: () => ({
          title: "Contact support", subtitle: "Support guidance", account: "Hey account",
          sessionSource: "From the signed-in session", verifiedEmail: "Verified reply email",
          alternateEmail: "Optional alternate reply email", problem: "What happened?",
          problemLabel: "What happened?", boundary: "Privacy guidance",
          sendRequest: "Send support request", email: "Email", copy: "Copy",
        }),
      };
      if (name.includes("mobile-system-surface")) return {
        MobileSystemRow: "MobileSystemRow", MobileSystemSection: "MobileSystemSection",
        mobileSystemSurfaceMetrics: { horizontalInset: 16, minimumTouchTarget: 48 },
      };
      if (name.includes("mobile-palette-context")) return { useMobilePalette: () => hodlPalette };
      throw new Error(`Unexpected dependency: ${name}`);
    },
  });
  const component = exports.MobileSupportRequestForm as (props: Record<string, unknown>) => unknown;
  return allNodes(component({ mode: "signed_in", locale: "en" }));
}

test("the signed-in Support form keeps HODL host colours when iOS reports Light", () => {
  const nodes = renderSignedInForm();
  const label = nodes.find((node) => node.type === "Text" && node.props.children === "Hey account");
  const guidance = nodes.find((node) => node.type === "Text" && node.props.children === "Support guidance");
  const fields = nodes.filter((node) => node.type === "TextInput");
  const button = nodes.find((node) => node.type === "Pressable" && node.props.accessibilityLabel === "Send support request");
  assert.ok(label && guidance && button);
  assert.equal(styleOf(label).color, hodlPalette.ink);
  assert.equal(styleOf(guidance).color, hodlPalette.secondary);
  assert.equal(fields.length, 2);
  for (const field of fields) {
    assert.equal(styleOf(field).backgroundColor, hodlPalette.userTint);
    assert.equal(styleOf(field).color, hodlPalette.ink);
    assert.equal(styleOf(field).borderColor, hodlPalette.lineStrong);
  }
  assert.equal(styleOf(button).backgroundColor, hodlPalette.accent);
  const buttonLabel = allNodes(button).find((node) => node.type === "Text" && node.props.children === "Send support request");
  assert.ok(buttonLabel);
  assert.equal(styleOf(buttonLabel).color, hodlPalette.accentText);
});
