export const googleConnectionScopes = [
  "openid",
  "email",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/drive.readonly",
  "https://www.googleapis.com/auth/drive.file",
] as const;

// HPD-100 deliberately does not reuse the combined Google grant above. A self-service Gmail
// connection can identify the consenting account, read mail, manage drafts and send only through
// the product's approval-gated action. It cannot delete mail or reach Calendar/Drive.
export const gmailConnectionScopes = [
  "openid",
  "email",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.compose",
] as const;

// Existing combined Google connections can carry this legacy all-mail scope. Gmail self-service
// never requests it, but recognizes it while migrating those already-connected workspaces.
export const legacyGmailConnectionScope = "https://mail.google.com/";

export function googleConsentUrl(clientId: string, redirectUri: string) {
  const normalizedClientId = clientId.trim();
  const normalizedRedirectUri = redirectUri.trim();
  if (!normalizedClientId || !normalizedRedirectUri || !/^https?:\/\//i.test(normalizedRedirectUri)) return null;
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", normalizedClientId);
  url.searchParams.set("redirect_uri", normalizedRedirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("include_granted_scopes", "true");
  url.searchParams.set("scope", googleConnectionScopes.join(" "));
  return url.toString();
}
