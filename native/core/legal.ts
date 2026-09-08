export const HERMES_LEGAL_PACK_VERSION = "2026-08-03.1";
export const HERMES_LEGAL_PACK_STATUS = "PUBLISHED";
/** hodlfinance/hodl-coordination master merge that published pack 2026-08-03.1. */
export const HERMES_LEGAL_PACK_PUBLICATION_COMMIT = "d5d2030d9e26bb7402e6a82f8a1c80cb4fbf3cac";
export const HERMES_LEGAL_PACK_SHA256 = "37c0d7d7b759069756afb94191efbb88e590087d68e1d33edad80fc4ef8a32fc";
export const HERMES_LEGAL_PUBLIC_COPY_SHA256 = "35ae3dbfc1582958f4e12dde3756a4e3e7c52181f7cc9f5332c5aa69a004a777";
export const HERMES_LEGAL_SOURCE_MANIFEST_SHA256 = "dd9f5aeb42ec7f53265ae7ab58c370848a422c96f0dd68ac9ef63b2e91f55090";
export const HERMES_COMPANY_PROFILE_VERSION = "2026-08-03.2";
export const HERMES_COMPANY_PROFILE_SEMANTIC_SHA256 = "5ba68487e485429425a756e739457d2eb9dbb0ace278e97f10e9214dc9db288f";

/**
 * Operator identity exactly as published in the canonical pack. Every Hey
 * surface renders these; no page states its own operator, address or country.
 */
export const HERMES_OPERATOR_NAME = "HODL Media Inc.";
export const HERMES_OPERATOR_ADDRESS_LINES = ["1052 High Street", "Palo Alto, CA 94301", "United States"] as const;
export const HERMES_OPERATOR_ADDRESS = HERMES_OPERATOR_ADDRESS_LINES.join(" · ");
export const HERMES_OPERATOR_INCORPORATION = "Delaware, USA";

export const HEY_SUPPORT_EMAIL = "support@heyhermes.app";
export const HEY_SUPPORT_MAILTO = "mailto:support@heyhermes.app?subject=Hey%20Hermes%20support";

export const HEY_LEGAL_LINKS = {
  privacy: "https://heyhermes.app/privacy#privacy-3-standalone-hey-hermes",
  terms: "https://heyhermes.app/terms#terms-5-standalone-hey-hermes-schedule",
  support: "https://heyhermes.app/support#contact-hey-hermes",
  supportEmail: HEY_SUPPORT_MAILTO,
} as const;

const allowedHeyLegalHrefs = new Set<string>(Object.values(HEY_LEGAL_LINKS));

/** Exact allowlist for links opened from the signed-in native app. */
export function isAllowedHeyLegalHref(href: string): boolean {
  return allowedHeyLegalHrefs.has(href);
}
