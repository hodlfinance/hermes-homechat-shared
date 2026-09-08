import { statusSummaryCopy, statusServerMessage } from "./status-summary-copy";
import type { AppLocale } from "./types";
import type { WorkspaceStatusTruthView } from "./status-truth";
import { aiAccessChoices } from "./ai-access";

export interface WorkspaceStatusTruthSummary {
  account: { value: string; detail: string };
  plan: { value: string; detail: string };
  aiModel: { value: string; detail: string };
  server: { value: string; detail: string };
  security: { value: string; detail: string };
  capabilities: { value: string; detail: string };
}

const serverObservationFreshnessMs = 5 * 60_000;
const staleServerRetryMs = 60_000;

function titleCase(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

export function workspaceStatusTruthServerIsCurrent(
  view: WorkspaceStatusTruthView | null,
  nowMs = Date.now(),
) {
  if (view?.server.availability !== "available" || !view.server.observedAt) return false;
  const observedAtMs = Date.parse(view.server.observedAt);
  if (!Number.isFinite(observedAtMs)) return false;
  const ageMs = nowMs - observedAtMs;
  return ageMs >= -30_000 && ageMs <= serverObservationFreshnessMs;
}

export function workspaceStatusTruthServerRefreshDelayMs(
  view: WorkspaceStatusTruthView | null,
  nowMs = Date.now(),
) {
  if (!view?.server.observedAt) return staleServerRetryMs;
  const observedAtMs = Date.parse(view.server.observedAt);
  if (!Number.isFinite(observedAtMs)) return staleServerRetryMs;
  if (observedAtMs - nowMs > 30_000) return staleServerRetryMs;
  const expiresAtMs = observedAtMs + serverObservationFreshnessMs;
  return expiresAtMs > nowMs
    ? Math.min(serverObservationFreshnessMs, expiresAtMs - nowMs)
    : staleServerRetryMs;
}

export function statusTruthAiAccessChoices(view: WorkspaceStatusTruthView | null) {
  if (view?.aiAccess.availability !== "available") return [];
  const chatGpt = view.aiAccess.providers.find((provider) => provider.id === "chatgpt_account");
  const claude = view.aiAccess.providers.find((provider) => provider.id === "claude_account");
  const managed = view.aiAccess.providers.find((provider) => provider.id === "openrouter_managed");
  const includedAvailability = view.aiAccess.includedAvailability;
  return aiAccessChoices({
    options: null,
    chatGptConnected: Boolean(chatGpt?.configured && chatGpt.live),
    claudeState: claude?.configured && claude.live
      ? "connected"
      : claude?.state === "blocked"
        ? "unavailable"
        : "not_connected",
  }).map((choice) => {
    const selectable = choice.value === "included_ai"
      ? includedAvailability === "available" ||
        (includedAvailability === undefined && Boolean(managed?.configured && managed.live))
      : choice.value === "chatgpt_account"
        ? chatGpt?.state !== "blocked"
        : claude?.state !== "blocked";
    if (choice.value !== "included_ai") return { ...choice, selectable };
    // HPD-350: this row used to be assembled here out of German literals, on a
    // screen every language reads. The facts stay here; the sentence is the
    // surface's, in the customer's language.
    return {
      ...choice,
      selectable,
      managedModelName: view.aiAccess.managedModelName || null,
      remainingPercent: view.aiAccess.remainingIncludedPercent,
    };
  });
}

export function workspaceStatusTruthSummary(
  view: WorkspaceStatusTruthView | null,
  nowMs = Date.now(),
  language: { locale: AppLocale; word: (value: string) => string } = { locale: "en", word: titleCase },
): WorkspaceStatusTruthSummary {
  const { locale, word } = language;
  const copy = statusSummaryCopy(locale);
  const unavailable = copy.unavailable;
  const format = (template: string, values: Record<string, string | number>) => template.replace(/\{(\w+)\}/g, (_, key: string) => typeof values[key] === "number" ? values[key].toLocaleString(locale) : values[key] ?? "");
  if (!view) {
    const row = { value: unavailable, detail: copy.noEvidence };
    return { account: row, plan: row, aiModel: row, server: row, security: row, capabilities: row };
  }

  const enabledCapabilities = view.capabilities.items.filter((item) => item.state === "enabled").length;
  const approvalCapabilities = view.capabilities.items.filter((item) => item.state === "approval_required").length;
  const confirmedStandingAccessStatus = view.security.standingAccessStatus === "none_detected" ||
    view.security.standingAccessStatus === "detected"
    ? view.security.standingAccessStatus
    : null;
  const confirmedAdminHandoverStatus = view.security.adminHandoverStatus === "passed" ||
    view.security.adminHandoverStatus === "waived" ||
    view.security.adminHandoverStatus === "failed" ||
    view.security.adminHandoverStatus === "pending" ||
    view.security.adminHandoverStatus === "not_started"
    ? view.security.adminHandoverStatus
    : null;
  const confirmedInfrastructureStatus = view.security.infrastructureStatus === "green" ||
    view.security.infrastructureStatus === "yellow" ||
    view.security.infrastructureStatus === "red"
    ? view.security.infrastructureStatus
    : null;
  const securityEvidenceComplete = view.security.availability === "available" &&
    Boolean(view.security.runtimeAccess) &&
    Boolean(confirmedAdminHandoverStatus) &&
    Boolean(confirmedStandingAccessStatus) &&
    view.security.activeSupportGrantCount !== null &&
    Boolean(confirmedInfrastructureStatus);
  const securityHealthy = securityEvidenceComplete &&
    view.security.runtimeAccess === "enabled" &&
    (confirmedAdminHandoverStatus === "passed" || confirmedAdminHandoverStatus === "waived") &&
    confirmedStandingAccessStatus === "none_detected" &&
    view.security.activeSupportGrantCount === 0 &&
    confirmedInfrastructureStatus === "green";
  const aiModel = view.aiAccess.availability !== "available"
    ? { value: unavailable, detail: copy.routeUnknown }
    : view.aiAccess.selectedRoute === "chatgpt_account"
      ? {
          value: copy.chatgptAccount,
          detail: view.aiAccess.selectedModelName
            ? format(copy.accountRouteModel, { model: view.aiAccess.selectedModelName })
            : copy.accountRouteNoModel,
        }
      : view.aiAccess.selectedRoute === "claude_account"
        ? {
            value: copy.claudeAccount,
            detail: view.aiAccess.selectedModelName
              ? format(copy.accountRouteModel, { model: view.aiAccess.selectedModelName })
              : copy.accountRouteNoModel,
          }
        : view.aiAccess.selectedModelName
          ? {
              value: view.aiAccess.selectedModelName,
              detail: copy.includedSaved,
            }
          : { value: unavailable, detail: copy.includedUnknown };
  return {
    account: view.account.availability === "available" && view.account.status
      ? {
          value: word(view.account.status),
          detail: [view.account.name, view.account.email, view.account.role ? word(view.account.role) : null].filter(Boolean).join(" · "),
        }
      : { value: unavailable, detail: copy.accountUnknown },
    plan: view.plan.availability === "available" && view.plan.plan && view.plan.status
      ? {
          value: view.plan.plan === "plus" ? "Pro" : word(view.plan.plan),
          detail: `${word(view.plan.status)}${view.plan.comped ? ` · ${copy.includedWithAccount}` : ""}`,
        }
      : { value: unavailable, detail: copy.planUnknown },
    aiModel,
    server: workspaceStatusTruthServerIsCurrent(view, nowMs)
      ? {
          value: locale === "en" ? view.server.statusLabel : word(view.server.statusLabel.toLowerCase().replace(/ /g, "_")),
          detail: [view.server.serverType, view.server.region, view.server.provider].filter(Boolean).join(" · ") || statusServerMessage(locale, view.server.message),
        }
      : {
          value: unavailable,
          detail: view.server.availability === "available"
            ? copy.staleServer
            : statusServerMessage(locale, view.server.message) || copy.noServer,
        },
    security: securityEvidenceComplete
      ? {
          value: securityHealthy ? word(view.security.runtimeAccess!) : locale === "en" ? "Needs attention" : word("needs_attention"),
          detail: locale === "en" ? `${word(confirmedStandingAccessStatus!)} · ${word(confirmedAdminHandoverStatus!)} handover · ${word(confirmedInfrastructureStatus!)} infrastructure · ${view.security.activeSupportGrantCount} active support grant${view.security.activeSupportGrantCount === 1 ? "" : "s"}` : format(copy.securityDetail, { standing: word(confirmedStandingAccessStatus!), handover: word(confirmedAdminHandoverStatus!), infrastructure: word(confirmedInfrastructureStatus!), count: view.security.activeSupportGrantCount! }),
        }
      : { value: unavailable, detail: copy.securityUnknown },
    capabilities: view.capabilities.availability === "available"
      ? {
          value: format(copy.capabilityValue, { count: enabledCapabilities }),
          detail: locale === "en" ? `${view.capabilities.items.length} current server policy entries · ${approvalCapabilities} require approval` : format(copy.capabilityDetail, { count: view.capabilities.items.length, approval: approvalCapabilities }),
        }
      : { value: unavailable, detail: copy.capabilityUnknown },
  };
}
