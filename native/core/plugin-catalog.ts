import {
  connectionSetupMetadataForCatalogItem,
  type PluginConnectionSetupMetadata,
} from "./connection-setup";
export { connectionSetupMetadataForCatalogItem } from "./connection-setup";

export const pluginSetupModes = [
  "oauth",
  "protected_secret",
  "guided_messaging",
  "manual_external",
  "skill_install",
  "local_plugin",
  "built_in_toolset",
  "webhook",
  "chat_fallback",
] as const;

export type PluginSetupMode = (typeof pluginSetupModes)[number];

export const pluginCatalogStatuses = [
  "available",
  "authorization_required",
  "setup_incomplete",
  "added",
  "attention",
] as const;

export type PluginCatalogStatus = (typeof pluginCatalogStatuses)[number];

export const pluginConnectionStatuses = [
  "available",
  "authorization_required",
  "setup_incomplete",
  "unknown",
  "unavailable",
  "connected",
  "attention",
] as const;

export type PluginConnectionStatus = (typeof pluginConnectionStatuses)[number];

export type PluginSecretCustody =
  | "none"
  | "provider_oauth"
  | "protected_runtime"
  | "encrypted_control_plane";

export type PluginMechanism =
  | "hey_connector"
  | "mcp"
  | "hermes_plugin"
  | "hermes_skill"
  | "messaging_adapter"
  | "built_in_toolset"
  | "webhook"
  | "guided_chat";

export type PluginActionId =
  | "add"
  | "authorize"
  | "manage"
  | "finish_setup"
  | "probe"
  | "disconnect"
  | "repair"
  | "review_source"
  | "confirm_review"
  | "install"
  | "activate"
  | "enable"
  | "send_setup_request";

export type PluginActionKind =
  | "navigate"
  | "oauth"
  | "protected_form"
  | "operation"
  | "external_steps"
  | "chat_fallback";

export interface PluginCatalogAction {
  id: PluginActionId;
  kind: PluginActionKind;
  label: string;
  operationId: string;
  requiresConfirmation: boolean;
}

export interface PluginCatalogSource {
  label: string;
  url: string;
  ref: string | null;
}

export interface PluginCatalogItem {
  id: string;
  name: string;
  iconKey: string;
  description: string;
  searchTerms: string[];
  source: PluginCatalogSource;
  mechanism: PluginMechanism;
  includedTools: string[];
  includedSkills: string[];
  permissions: string[];
  setupHint: string;
  setupMode: PluginSetupMode;
  secretCustody: PluginSecretCustody;
  /** Authoritative Connections truth; legacy status remains for existing guided-setup consumers. */
  connectionStatus: PluginConnectionStatus;
  status: PluginCatalogStatus;
  statusLabel: string;
  statusDetail: string;
  statusEvidenceAt: string | null;
  inYours: boolean;
  actions: PluginCatalogAction[];
  /** Fixed server-owned recipe identity used only by validated named Connection runs. */
  connectionSetup?: PluginConnectionSetupMetadata | null;
}

export interface PluginCatalogView {
  workspaceId: string;
  generatedAt: string;
  items: PluginCatalogItem[];
  /** Present on aggregated API responses. Omitted only by legacy/local pure catalog builders. */
  availability?: "complete" | "partial";
  /** Fixed source classes only; never provider errors, identifiers, or secret-bearing details. */
  unavailableSources?: PluginCatalogUnavailableSource[];
}

export type PluginCatalogUnavailableSource =
  | "gmail_status"
  | "google_status"
  | "connection_reach"
  | "integrations"
  | "setup_requests"
  | "runtime_evidence";

export type PluginCatalogOperationEffect =
  | "refresh_catalog"
  | "open_gmail_setup"
  | "open_existing_connection"
  | "start_guided_chat"
  | "open_runtime_management"
  | "open_source_review"
  | "create_setup_request"
  | "send_chat_setup_request";

export interface PluginCatalogOperationResult {
  workspaceId: string;
  itemId: string;
  operationId: string;
  effect: PluginCatalogOperationEffect;
  provider: "gmail" | "google_workspace" | "telegram" | "whatsapp" | "webhook" | "slack" | "discord" | "stripe" | null;
  sourceUrl: string | null;
  prefilledMessage: string | null;
  message: string;
}

export type PluginConfigurationEvidence = "missing" | "saved" | "malformed" | "foreign";
export type PluginActivationEvidence = "missing" | "enabled" | "disabled" | "foreign";
export type PluginProbeEvidence = "missing" | "success" | "failed" | "stale" | "unavailable" | "foreign";
export type PluginAuthorizationEvidence = "not_required" | "missing" | "valid" | "revoked" | "foreign";
export type PluginExternalStepEvidence = "not_required" | "missing" | "complete" | "foreign";
export type PluginTrustReviewEvidence =
  | "not_required"
  | "not_reviewed"
  | "allowed"
  | "ask"
  | "blocked"
  | "changed"
  | "unavailable"
  | "foreign";

export interface PluginStatusEvidence {
  workspaceId: string;
  configuration: PluginConfigurationEvidence;
  activation: PluginActivationEvidence;
  probe: PluginProbeEvidence;
  authorization?: PluginAuthorizationEvidence;
  externalStep?: PluginExternalStepEvidence;
  trustReview?: PluginTrustReviewEvidence;
  observedAt?: string | null;
}

export interface ResolvedPluginStatus {
  status: PluginCatalogStatus;
  connectionStatus: PluginConnectionStatus;
  statusLabel: string;
  inYours: boolean;
}

const statusLabels: Record<PluginConnectionStatus, string> = {
  available: "Available",
  authorization_required: "Authorization required",
  setup_incomplete: "Setup incomplete",
  unknown: "Unknown",
  unavailable: "Unavailable",
  connected: "Connected",
  attention: "Needs attention",
};

function hasExistingConnectionState(evidence: PluginStatusEvidence) {
  return (
    evidence.configuration !== "missing" ||
    evidence.activation !== "missing" ||
    evidence.authorization === "valid" ||
    evidence.authorization === "revoked" ||
    evidence.authorization === "foreign" ||
    evidence.externalStep === "complete" ||
    evidence.externalStep === "foreign" ||
    (evidence.trustReview !== undefined &&
      evidence.trustReview !== "not_required" &&
      evidence.trustReview !== "not_reviewed" &&
      evidence.trustReview !== "unavailable")
  );
}

function hasStartedSetupState(evidence: PluginStatusEvidence) {
  return hasExistingConnectionState(evidence) || evidence.externalStep === "missing";
}

function hasInvalidOrFailedEvidence(evidence: PluginStatusEvidence) {
  return (
    evidence.configuration === "malformed" ||
    evidence.configuration === "foreign" ||
    evidence.activation === "foreign" ||
    evidence.authorization === "revoked" ||
    evidence.authorization === "foreign" ||
    evidence.externalStep === "foreign" ||
    evidence.trustReview === "ask" ||
    evidence.trustReview === "blocked" ||
    evidence.trustReview === "changed" ||
    evidence.trustReview === "foreign" ||
    evidence.probe === "failed" ||
    evidence.probe === "stale" ||
    evidence.probe === "foreign"
  );
}

function hasUnavailableEvidence(evidence: PluginStatusEvidence) {
  return evidence.probe === "unavailable" || evidence.trustReview === "unavailable";
}

export function resolvePluginStatus(evidence: PluginStatusEvidence): ResolvedPluginStatus {
  const existingConnection = hasExistingConnectionState(evidence);
  let connectionStatus: PluginConnectionStatus;

  if (existingConnection && hasInvalidOrFailedEvidence(evidence)) {
    connectionStatus = "attention";
  } else if (
    evidence.configuration === "saved" &&
    evidence.activation === "enabled" &&
    evidence.probe === "success" &&
    (evidence.authorization === undefined ||
      evidence.authorization === "not_required" ||
      evidence.authorization === "valid") &&
    (evidence.externalStep === undefined ||
      evidence.externalStep === "not_required" ||
      evidence.externalStep === "complete") &&
    (evidence.trustReview === undefined ||
      evidence.trustReview === "not_required" ||
      evidence.trustReview === "allowed")
  ) {
    connectionStatus = "connected";
  } else if (hasUnavailableEvidence(evidence)) {
    connectionStatus = "unavailable";
  } else if (evidence.authorization === "missing") {
    connectionStatus = "authorization_required";
  } else if (
    evidence.configuration === "saved" &&
    evidence.activation === "enabled" &&
    evidence.probe === "missing"
  ) {
    connectionStatus = "unknown";
  } else if (hasStartedSetupState(evidence)) {
    connectionStatus = "setup_incomplete";
  } else {
    connectionStatus = "available";
  }

  const status: PluginCatalogStatus = connectionStatus === "connected"
    ? "added"
    : connectionStatus === "unknown" || connectionStatus === "unavailable"
      ? "attention"
      : connectionStatus;
  return {
    status,
    connectionStatus,
    statusLabel: statusLabels[connectionStatus],
    inYours: connectionStatus === "connected",
  };
}

export function pluginCatalogYours(view: PluginCatalogView) {
  return view.items.filter((item) => item.inYours);
}

function normalizedSearchValue(value: string) {
  return value.trim().toLocaleLowerCase();
}

export function filterPluginCatalog(view: PluginCatalogView, query: string) {
  const needle = normalizedSearchValue(query);
  if (!needle) return view.items;
  return view.items.filter((item) =>
    [item.name, item.description, item.source.label, ...item.searchTerms, ...item.includedTools, ...item.includedSkills]
      .some((value) => normalizedSearchValue(value).includes(needle)),
  );
}

export function pluginStatusLabel(status: PluginConnectionStatus) {
  return statusLabels[status];
}
