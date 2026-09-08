import type {
  GmailConnectionStatus,
  GmailMobileOAuthCompleteRequest,
  GmailMobileOAuthStart,
  GmailMobileOAuthStartRequest,
} from "../core/index";

type MobileGmailOAuthApi = {
  startMobileGmailConnection: (body: GmailMobileOAuthStartRequest) => Promise<GmailMobileOAuthStart>;
  completeMobileGmailConnection: (body: GmailMobileOAuthCompleteRequest) => Promise<GmailConnectionStatus>;
  gmailConnectionStatus: () => Promise<GmailConnectionStatus>;
};

type MobileAuthSessionResult = { type: string; url?: string };

export type GmailOAuthDiagnostic = {
  code:
    | "gmail_callback_validation_failed"
    | "gmail_runtime_unreachable"
    | "gmail_provider_exchange_failed"
    | "gmail_credential_commit_status_unconfirmed";
  phase:
    | "callback_validation"
    | "runtime_unreachable"
    | "provider_exchange"
    | "credential_commit_status_unconfirmed";
  userMessage: string;
};

const gmailOAuthDiagnostics: Record<GmailOAuthDiagnostic["code"], GmailOAuthDiagnostic> = {
  gmail_callback_validation_failed: {
    code: "gmail_callback_validation_failed",
    phase: "callback_validation",
    userMessage: "Gmail returned to the app, but the callback was invalid or expired. Start Gmail authorization again.",
  },
  gmail_runtime_unreachable: {
    code: "gmail_runtime_unreachable",
    phase: "runtime_unreachable",
    userMessage: "Gmail returned to the app, but the private runtime could not be reached. Try again when the connection is available.",
  },
  gmail_provider_exchange_failed: {
    code: "gmail_provider_exchange_failed",
    phase: "provider_exchange",
    userMessage: "Google did not accept the Gmail authorization exchange. Start Gmail authorization again.",
  },
  gmail_credential_commit_status_unconfirmed: {
    code: "gmail_credential_commit_status_unconfirmed",
    phase: "credential_commit_status_unconfirmed",
    userMessage: "Gmail returned to the app, but the saved connection could not be confirmed. Check Connections before retrying.",
  },
};

class MobileGmailOAuthError extends Error {
  constructor(readonly diagnostic: GmailOAuthDiagnostic) {
    super(`${diagnostic.userMessage} [${diagnostic.code}]`);
    this.name = "MobileGmailOAuthError";
  }
}

export function gmailOAuthDiagnostic(error: unknown): GmailOAuthDiagnostic | null {
  if (error instanceof MobileGmailOAuthError) return error.diagnostic;
  const message = error instanceof Error ? error.message : "";
  for (const diagnostic of Object.values(gmailOAuthDiagnostics)) {
    if (message.includes(`[${diagnostic.code}]`)) return diagnostic;
  }
  return null;
}

function gmailOAuthError(code: GmailOAuthDiagnostic["code"]) {
  return new MobileGmailOAuthError(gmailOAuthDiagnostics[code]);
}

export async function runMobileGmailOAuth(input: {
  api: MobileGmailOAuthApi;
  expectedRedirectUri?: string;
  createPkce: () => Promise<{ codeVerifier: string; codeChallenge: string }>;
  openAuthSession: (authorizationUrl: string, redirectUri: string) => Promise<MobileAuthSessionResult>;
}) {
  const pkce = await input.createPkce();
  const started = await input.api.startMobileGmailConnection({ codeChallenge: pkce.codeChallenge });
  const expectedRedirectUri = input.expectedRedirectUri ?? "app.heyhermes.hodl:/oauth2redirect";
  if (started.redirectUri !== expectedRedirectUri) throw gmailOAuthError("gmail_callback_validation_failed");
  const result = await input.openAuthSession(started.authorizationUrl, started.redirectUri);
  if (result.type !== "success" || !result.url) throw gmailOAuthError("gmail_callback_validation_failed");
  let callback: URL;
  try {
    callback = new URL(result.url);
  } catch {
    throw gmailOAuthError("gmail_callback_validation_failed");
  }
  if (callback.hostname || callback.hash || `${callback.protocol}${callback.pathname}` !== expectedRedirectUri) {
    throw gmailOAuthError("gmail_callback_validation_failed");
  }
  if (callback.searchParams.get("state") !== started.state) throw gmailOAuthError("gmail_callback_validation_failed");
  if (callback.searchParams.get("error")) throw gmailOAuthError("gmail_callback_validation_failed");
  const authorizationCode = callback.searchParams.get("code")?.trim() || "";
  if (!authorizationCode) throw gmailOAuthError("gmail_callback_validation_failed");
  try {
    return await input.api.completeMobileGmailConnection({
      authorizationCode,
      codeVerifier: pkce.codeVerifier,
      state: started.state,
    });
  } catch (completionError) {
    const diagnostic = gmailOAuthDiagnostic(completionError);
    // A definitive provider rejection must not be hidden by an older connected status.
    if (diagnostic?.phase === "provider_exchange") throw new MobileGmailOAuthError(diagnostic);
    // The one-time code may have been consumed by the private runtime even when the
    // completion response is lost. A fresh authoritative status is safe to read and
    // is the only way to treat that ambiguous result as connected without replaying it.
    try {
      const status = await input.api.gmailConnectionStatus();
      if (status.state === "connected") return status;
    } catch {
      // Preserve the original completion error when status cannot settle it.
    }
    throw diagnostic
      ? new MobileGmailOAuthError(diagnostic)
      : gmailOAuthError("gmail_credential_commit_status_unconfirmed");
  }
}
