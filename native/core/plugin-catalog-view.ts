import type { AppLocale } from "./types";
import { connectionUiMessage } from "./connection-ui-copy";
import { filterPluginCatalog, type PluginCatalogItem, type PluginCatalogView } from "./plugin-catalog";

export interface PluginCatalogSection {
  id: "yours" | "catalog";
  title: string;
  items: PluginCatalogItem[];
}

export interface PluginCatalogCopy {
  yours: string;
  catalog: string;
}

export type PluginCatalogSearchResult =
  | { kind: "connection"; item: PluginCatalogItem }
  | {
      kind: "ask_hermes";
      id: "ask-hermes";
      query: string;
      label: string;
      prefilledMessage: string;
    };

function visibleSearchQuery(query: string) {
  return query.replace(/\s+/g, " ").trim().slice(0, 80).trim();
}

export function pluginCatalogSearchResults(
  view: PluginCatalogView,
  query: string,
  locale: AppLocale = "en",
): PluginCatalogSearchResult[] {
  const visibleQuery = visibleSearchQuery(query);
  const matches = filterPluginCatalog(view, visibleQuery);
  if (!visibleQuery || matches.length > 0) {
    return matches.map((item) => ({ kind: "connection", item }));
  }
  return [{
    kind: "ask_hermes",
    id: "ask-hermes",
    query: visibleQuery,
    label: connectionUiMessage(locale, "Ask Hermes about {query}", { query: visibleQuery }),
    prefilledMessage: connectionUiMessage(locale, "Help me connect {query} to this Hey Hermes workspace. Show me the safest currently supported setup path. Do not ask me to paste secrets into chat, and do not make external changes without my confirmation.", { query: visibleQuery }),
  }];
}

export function pluginCatalogSections(
  view: PluginCatalogView,
  query: string,
  copy: PluginCatalogCopy = { yours: "Yours", catalog: "Connections" },
): PluginCatalogSection[] {
  const matches = filterPluginCatalog(view, query);
  const yours = matches.filter((item) => item.inYours);
  const catalog = matches.filter((item) => !item.inYours);
  // An empty group is not a group. Keeping one would put a bare heading and a
  // "nothing matches" line next to the connections the user can plainly see.
  const sections: PluginCatalogSection[] = [
    { id: "yours", title: copy.yours, items: yours },
    { id: "catalog", title: copy.catalog, items: catalog },
  ];
  return sections.filter((section) => section.items.length > 0);
}

export function pluginCatalogItemById(view: PluginCatalogView, itemId: string) {
  return view.items.find((item) => item.id === itemId) ?? null;
}

/**
 * What the connections screen calls things. Both clients carried this list
 * separately; the twelve entries they shared were word for word the same, and
 * the app had seven more. One list means a word changed once, not twice.
 */
export const pluginCatalogLabels = Object.freeze({
  title: "Connections",
  description: "Connect tools and services to this workspace.",
  searchPlaceholder: "Search connections",
  yours: "Your connections",
  all: "All connections",
  empty: "No connections match this search.",
  close: "Close",
  source: "Official source",
  tools: "Tools",
  skills: "Skills",
  permissions: "Permissions",
  setup: "Setup",
  working: "Working…",
  partialStatus: "Some plugin statuses could not be refreshed. Available results are shown; affected setup actions stay unavailable until the catalog recovers.",
  statusLabels: { available: "Add", authorization_required: "Authorize", setup_incomplete: "Finish setup", added: "Added", attention: "Needs attention" },
  // The server resolves one connection state per item and names it in English.
  // The surface says it in the customer's language instead of showing a German
  // page with English states in it.
  connectionStatusLabels: {},
  statusDetails: { available: "Available for this workspace.", authorization_required: "Authorization is still required.", setup_incomplete: "Setup is not complete yet.", added: "Available in this workspace.", attention: "The current evidence needs attention." },
  actionLabels: {},
  items: {},
} as const);
