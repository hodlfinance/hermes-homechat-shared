import type { BrowserSessionHandoffRequest, BrowserSessionHandoffResponse } from "../core/index";

type BrowserSessionHandoffApi = {
  browserSessionHandoff: (body: BrowserSessionHandoffRequest) => Promise<BrowserSessionHandoffResponse>;
};

export function mobileBrowserUrl(apiBase: string, href: string) {
  if (/^https?:\/\//i.test(href)) return href;
  const appBase = apiBase.replace(/\/api\/?$/i, "");
  const path = href.startsWith("/") ? href : `/${href}`;
  return `${appBase}${path}`;
}

export function isPrivateMobileBrowserHref(href: string) {
  return (
    href === "/app?connection=gmail" ||
    /^\/api\/workspace\/preview\/\d+(?:[/?#]|$)/i.test(href) ||
    /^\/api\/backup-jobs\/bak_[A-Za-z0-9_-]{14}\/download$/.test(href)
  );
}

export async function openMobileBrowserHref(input: {
  api: BrowserSessionHandoffApi;
  apiBase: string;
  href: string;
  openUrl: (url: string) => Promise<unknown>;
  openPrivateUrl?: (url: string) => Promise<unknown>;
}) {
  const handoff = isPrivateMobileBrowserHref(input.href)
    ? await input.api.browserSessionHandoff({ href: input.href })
    : null;
  const url = mobileBrowserUrl(input.apiBase, handoff?.href ?? input.href);
  await (handoff && input.openPrivateUrl ? input.openPrivateUrl(url) : input.openUrl(url));
  return {
    mode: handoff ? "authenticated_handoff" as const : "direct" as const,
    url,
  };
}
