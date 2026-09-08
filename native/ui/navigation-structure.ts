export type HeyPrivatePageCandidate = {
  id: string;
  title: string;
  href: string;
  status: "active" | "archived";
  visibility: "private_page" | "public_page" | "saved_link";
};

export type HeyPrimaryNavigationItem =
  | {
      id: "home_chat" | "plugins" | "tasks";
      kind: "product_surface";
      label: string;
    }
  | {
      id: `private_page:${string}`;
      kind: "private_page";
      label: string;
      href: string;
    };

/**
 * Chat and Tasks, and then whatever the customer pinned. HPD-350: the accepted
 * app has exactly two destinations in its menu, Chat and Tasks, and reaches
 * Connections from the account row instead. Connections was a first-class
 * destination only on the web, and only the web ever drew this list.
 *
 * HPD-409: Tasks stands here because it is a built-in screen. It used to reach
 * the menu only through a bookmark on `hey://tasks`, so a customer who tidied
 * that bookmark away lost the whole Tasks screen, and an archived bookmark
 * appears nowhere again. A built-in screen is not a bookmark. The app has
 * always built these same two destinations itself (`MobileApp.tsx`), and never
 * read this list.
 */
export const heyFixedPrimaryNavigation = [
  { id: "home_chat", kind: "product_surface", label: "Chat" },
  { id: "tasks", kind: "product_surface", label: "Tasks" },
] as const satisfies readonly HeyPrimaryNavigationItem[];

export const heyAccountMenuNavigation = [
  { id: "ai_access", label: "AI Access" },
  { id: "automations", label: "Automations" },
  { id: "account", label: "Account" },
  { id: "dashboard", label: "Hermes dashboard" },
  { id: "sign_out", label: "Sign out" },
] as const;

/** Stable bookmark target for the built-in Tasks page. */
export const HEY_TASKS_PAGE_HREF = "hey://tasks" as const;

/**
 * HPD-289 keeps the primary menu small and direct: fixed product destinations
 * first, followed by every distinct active private Page. Public Pages, saved
 * links, archived Pages, chat utilities, and empty grouping containers are not
 * primary destinations.
 */
export function buildHeyPrimaryNavigation(
  pages: readonly HeyPrivatePageCandidate[],
  labels: Partial<Record<"home_chat" | "plugins" | "tasks", string>> = {},
): HeyPrimaryNavigationItem[] {
  const seenHrefs = new Set<string>();
  const productSurfaces: HeyPrimaryNavigationItem[] = heyFixedPrimaryNavigation.map((item) => ({
    ...item,
    label: labels[item.id] ?? item.label,
  }));
  const privatePages: HeyPrimaryNavigationItem[] = [];

  for (const page of pages) {
    const href = page.href.trim();
    if (page.status !== "active" || !href || seenHrefs.has(href)) continue;
    seenHrefs.add(href);
    // The built-in Tasks screen is a fixed destination above. A bookmark on the
    // same address is not a second entry for it, and above all not the thing
    // that decides whether the destination exists at all.
    if (href === HEY_TASKS_PAGE_HREF) continue;
    if (page.visibility !== "private_page") continue;
    privatePages.push({
      id: `private_page:${page.id}`,
      kind: "private_page",
      label: page.title.trim() || "Untitled Page",
      href,
    });
  }

  return [...productSurfaces, ...privatePages];
}
