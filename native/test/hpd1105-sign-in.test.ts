import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { appLocales } from "../core/index";
import { appLocaleFromDeviceTag, heySignInCopy, heySignInHeadline } from "../src/hey-sign-in";

test("HPD-1105: the sign-in copy is complete in all eight languages and every accent sits in its title", () => {
  const english = heySignInCopy("en");
  for (const locale of appLocales) {
    const copy = heySignInCopy(locale);
    assert.deepEqual(Object.keys(copy).sort(), Object.keys(english).sort(), locale);
    for (const [key, value] of Object.entries(copy)) assert.ok(value.trim(), `${locale}: ${key}`);
    for (const mode of ["sign_in", "create_account"] as const) {
      const headline = heySignInHeadline(locale, mode);
      assert.ok(headline.title.includes(headline.titleAccent), `${locale} ${mode}: accent in title`);
    }
    // The product name never splits across two lines.
    assert.doesNotMatch(copy.title, /Hey Hermes/, `${locale}: no-break space in the product name`);
  }
  assert.equal(heySignInCopy("de").title, "Willkommen bei Hey\u00a0Hermes");
  assert.equal(heySignInCopy("de").createTitle, "Konto erstellen");
  assert.equal(heySignInCopy("de").sendLink, "Anmeldelink senden");
});

test("HPD-1105: before sign-in the screen follows the device language", () => {
  assert.equal(appLocaleFromDeviceTag("de-DE"), "de");
  assert.equal(appLocaleFromDeviceTag("de_CH"), "de");
  assert.equal(appLocaleFromDeviceTag("pt-PT"), "pt-BR");
  assert.equal(appLocaleFromDeviceTag("pt-BR"), "pt-BR");
  assert.equal(appLocaleFromDeviceTag("ja-JP"), "ja");
  assert.equal(appLocaleFromDeviceTag("ko"), "ko");
  assert.equal(appLocaleFromDeviceTag("nl-NL"), "en");
  assert.equal(appLocaleFromDeviceTag(""), "en");
  assert.equal(appLocaleFromDeviceTag(undefined), "en");
  const source = readFileSync(new URL("../src/surface.tsx", import.meta.url), "utf8");
  assert.match(source, /useState<AppLocale>\(\(\) => hostAppLocale \?\? deviceAppLocale\(\)\)/);
  assert.match(source, /setAppLocale\(hostAppLocale \?\? deviceAppLocale\(\)\)/);
  assert.doesNotMatch(source, /setAppLocale\("en"\)/);
});

test("HPD-1105: Apple and Google share one look; the switch is one quiet line", () => {
  const source = readFileSync(new URL("../src/surface.tsx", import.meta.url), "utf8");
  const start = source.indexOf("HPD-1105: the signed-out screen in the HPD-1085 paywall design.");
  assert.ok(start > 0);
  const screen = source.slice(start, source.indexOf("</KeyboardAvoidingView>", start));
  assert.match(screen, /AppleAuthenticationButtonStyle\.BLACK/);
  // Dark mode: Google's own dark variant, no white boxes.
  assert.doesNotMatch(screen, /AppleAuthenticationButtonStyle\.WHITE/);
  assert.match(source, /authProviderGoogleDark: \{\s*backgroundColor: "#131314"/);
  assert.match(screen, /<MobileGoogleMark/);
  assert.match(screen, /styles\.paywallCta/);
  assert.match(screen, /signInCopy\.newHere : signInCopy\.haveAccount/);
  assert.doesNotMatch(screen, /styles\.authModeSwitch/);
});

test("HPD-1085/HPD-1090: paywall, offer and preparing screens use the transparent dark dragon in dark mode", () => {
  const source = readFileSync(new URL("../src/surface.tsx", import.meta.url), "utf8");
  assert.match(source, /function PaywallArt\(\)[\s\S]*?Platform\.OS === "ios" && scheme === "dark"[\s\S]*?paywallIllustrationDark : paywallIllustration/);
  assert.equal(source.match(/<PaywallArt \/>/g)?.length, 3);
  assert.doesNotMatch(source, /<View style=\{styles\.paywallArt\}>/);
});

test("HPD-1105 v2 (B1): sign-in keeps the ink dragon, dark mode uses the filled variant, headline centered", () => {
  const source = readFileSync(new URL("../src/surface.tsx", import.meta.url), "utf8");
  const start = source.indexOf("HPD-1105: the signed-out screen in the HPD-1085 paywall design.");
  const screen = source.slice(start, source.indexOf("</KeyboardAvoidingView>", start));
  assert.match(screen, /resolvedColorScheme === "dark" \? paywallIllustrationDark : paywallIllustration/);
  assert.match(screen, /styles\.paywallArtDark/);
  assert.doesNotMatch(screen, /<MobileWorkingDragon/);
  assert.match(source, /const paywallIllustrationDark = require\("\.\.\/assets\/paywall-ink-key-dark\.png"\)/);
  assert.match(screen, /\[styles\.paywallEyebrow, styles\.authCentered\]/);
  assert.match(screen, /\[styles\.paywallOfferTitle, styles\.authCentered\]/);
  assert.match(screen, /\[styles\.authBenefit, styles\.authCentered\]/);
  assert.match(source, /authCentered: \{\s*textAlign: "center"/);
  // The paywall, offer, preparing and deleted screens share one component.
  assert.equal(source.match(/<PaywallArt \/>/g)?.length, 3);
});

test("HPD-1105 v2 (B1): the dark dragon is the filled drawing, transparent around the figure", () => {
  const png = readFileSync(new URL("../assets/paywall-ink-key-dark.png", import.meta.url));
  assert.equal(png.readUInt32BE(16), 720);
  assert.equal(png.readUInt32BE(20), 480);
  assert.equal(png[25], 6, "RGBA");
});
