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

test("the deletion section reveals provider sign-in actions only for that stable code", () => {
  const section = readFileSync(new URL("../src/AccountDeletionSection.tsx", import.meta.url), "utf8");
  const surface = readFileSync(new URL("../src/surface.tsx", import.meta.url), "utf8");
  assert.match(section, /needsAccountDeletionNativeReauthentication\(error\)/);
  assert.match(section, /showReauthenticationActions \? reauthenticationActions : null/);
  assert.match(surface, /reauthenticationActions=\{/);
  assert.match(surface, /signInWithGoogle\("link"\)/);
  assert.match(surface, /signInWithApple\("link"\)/);
});
