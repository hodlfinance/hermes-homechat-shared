import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

// HPD-1094, device test on Hey iOS build 128: after adding a key, tapping the trash icon showed
// no confirmation and the key stayed. Reproduced on the iOS simulator: while the software keyboard
// is up, the Account page ScrollView (keyboardShouldPersistTaps left at its default "never")
// spends the tap on closing the keyboard, so the key row's onPress (and its Alert) never runs.
// The key form also kept its focus after a successful add, so the keyboard was still up when the
// Owner reached for the trash icon.

const surface = readFileSync(new URL("../src/surface.tsx", import.meta.url), "utf8");
const section = readFileSync(new URL("../src/ServerAccessSection.tsx", import.meta.url), "utf8");

test("a tap on a row of the Account page reaches the row while the keyboard is up", () => {
  const scroll = surface.match(/<ScrollView style=\{styles\.content\} contentContainerStyle=\{styles\.contentInner\}[^>]*>/);
  assert.ok(scroll, "the Account/system page ScrollView is still found");
  assert.match(scroll[0], /keyboardShouldPersistTaps="handled"/);
});

test("adding a key closes the keyboard so the next tap goes to the trash icon", () => {
  assert.match(section, /import \{[^}]*\bKeyboard\b[^}]*\} from "react-native";/);
  const add = section.slice(section.indexOf("const add = async"), section.indexOf("const revoke = async"));
  assert.match(add, /setKeys\(await client\.addServerOwnerSshKey\([\s\S]*?Keyboard\.dismiss\(\);/);
});

test("removing a key still asks first with a native Alert (Cancel / Remove, destructive)", () => {
  assert.match(section, /onPress=\{\(\) => confirmRevoke\(key\.id\)\}/);
  assert.match(section, /Alert\.alert\(copy\.revokeConfirm, undefined, \[\s*\{ text: copy\.revokeConfirmCancel, style: "cancel" \},\s*\{ text: copy\.revoke, style: "destructive", onPress: \(\) => void revoke\(keyId\) \}/);
  assert.doesNotMatch(section, /window\.confirm/);
});
