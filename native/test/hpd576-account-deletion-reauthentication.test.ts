import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  ApiError,
  apiErrorCode,
  createApiClient,
  heyAccountDeletionProductRealm,
} from "../core/index";
import {
  accountDeletionNativeReauthenticationCopy,
  deletionErrorMessage,
  needsAccountDeletionNativeReauthentication,
} from "../src/account-deletion";
import { mobileNativeAuthChallengeRefreshDelayMs } from "../src/mobile-native-auth-challenge";

test("the native client preserves the stale social sign-in code and offers actionable copy", async () => {
  const client = createApiClient({
    baseUrl: "https://example.invalid",
    fetchImpl: async () => new Response(JSON.stringify({
      code: "account_deletion_native_reauthentication_required",
      error: "Sign in with the linked Google or Apple account again before confirming deletion.",
    }), { status: 401 }),
  });
  let caught: unknown;
  try {
    await client.reauthenticateHeyAccountDeletion({ accountId: "acct_test", productRealm: heyAccountDeletionProductRealm });
  } catch (error) {
    caught = error;
  }
  assert.ok(caught instanceof ApiError);
  assert.equal(apiErrorCode(caught), "account_deletion_native_reauthentication_required");
  assert.equal(needsAccountDeletionNativeReauthentication(caught), true);
  assert.match(deletionErrorMessage(caught), /sign-in is too old/i);
  assert.match(accountDeletionNativeReauthenticationCopy("de").message, /zu alt/);
  assert.match(accountDeletionNativeReauthenticationCopy("de").googleAction, /Google/);
});

test("the native client reads back only the account's actual deletion reauthentication methods", async () => {
  const client = createApiClient({
    baseUrl: "https://example.invalid",
    fetchImpl: async (url) => {
      assert.match(String(url), /\/account\/deletion\/reauthentication-methods$/);
      return new Response(JSON.stringify({ hasPassword: false, linkedProviders: ["google"] }), { status: 200 });
    },
  });
  assert.deepEqual(await client.heyAccountDeletionReauthenticationMethods(), {
    hasPassword: false,
    linkedProviders: ["google"],
  });
});

test("the deletion section reveals provider sign-in actions only for that stable code", () => {
  const section = readFileSync(new URL("../src/AccountDeletionSection.tsx", import.meta.url), "utf8");
  const surface = readFileSync(new URL("../src/surface.tsx", import.meta.url), "utf8");
  assert.match(section, /needsAccountDeletionNativeReauthentication\(error\)/);
  assert.match(section, /heyAccountDeletionReauthenticationMethods\(\)/);
  assert.match(section, /reauthenticationMethods\?\.linkedProviders \?\? \[\]/);
  assert.match(surface, /reauthenticationActions=\{\(linkedProviders\) =>/);
  assert.match(surface, /linkedProviders\.includes\("google"\)/);
  assert.match(surface, /reauthenticateAccountDeletionWithGoogle\(\)/);
  assert.match(surface, /linkedProviders\.includes\("apple"\)/);
  assert.match(surface, /signInWithApple\("reauthenticate"\)/);
  assert.match(surface, /!accountDeletionNativeReauthenticationRequired/);
  assert.match(surface, /mobileNativeAuthChallengeRefreshDelayMs\(/);
  assert.doesNotMatch(surface, /reauthenticationActions=\{[\s\S]*?signInWithGoogle\("link"\)/);
});

test("an on-demand Google deletion challenge refreshes before or immediately after expiry", () => {
  const now = Date.parse("2026-09-14T10:00:00.000Z");
  assert.equal(
    mobileNativeAuthChallengeRefreshDelayMs("2026-09-14T10:10:00.000Z", now, 5 * 60_000),
    5 * 60_000,
  );
  assert.equal(
    mobileNativeAuthChallengeRefreshDelayMs("2026-09-14T10:00:10.000Z", now, 5 * 60_000),
    1_000,
  );
  assert.equal(mobileNativeAuthChallengeRefreshDelayMs("invalid", now, 5 * 60_000), 5 * 60_000);
});
