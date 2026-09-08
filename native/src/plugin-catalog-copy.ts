import type { PluginCatalogStatus, PluginConnectionStatus, PluginActionId } from "../core/plugin-catalog";

export interface PluginCatalogScreenCopy {
  title: string;
  description: string;
  searchPlaceholder: string;
  yours: string;
  all: string;
  empty: string;
  close: string;
  source: string;
  tools: string;
  skills: string;
  permissions: string;
  setup: string;
  working: string;
  partialStatus: string;
  statusLabels: Record<PluginCatalogStatus, string>;
  connectionStatusLabels: Partial<Record<PluginConnectionStatus, string>>;
  statusDetails: Record<PluginCatalogStatus, string>;
  actionLabels: Partial<Record<PluginActionId, string>>;
  items: Record<string, {
    description: string;
    setupHint: string;
    permissions: string[];
    searchTerms: string[];
  }>;
}
