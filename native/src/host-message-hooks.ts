import type { ReactNode } from "react";
import type { ChatArtifactReference, ChatMessage } from "../core/index";
import type {
  NativeR8ApprovalCardLabels,
  NativeR8ArtifactRenderContext,
  NativeR8MessageRenderContext,
} from "../host";
import { uniqueMobileFinanceArtifactReferences } from "./mobile-finance-artifacts";

/**
 * HPD-2263 (HODL Bots engine branch only): three optional host options that
 * let the HODL app draw its own cards, a line under a finished reply and its
 * own words on the approval card. Every helper here returns exactly what the
 * surface did before when the host passes none of them.
 */

export const DEFAULT_APPROVAL_CARD_LABELS: Readonly<Required<NativeR8ApprovalCardLabels>> = {
  eyebrow: "FIN HERMES",
  confirm: "Confirm",
  cancel: "Cancel",
};

/** The approval card's words: the host's where given and not blank, today's otherwise. */
export function approvalCardLabels(labels?: NativeR8ApprovalCardLabels | null): Required<NativeR8ApprovalCardLabels> {
  const pick = (value: string | undefined, fallback: string) =>
    typeof value === "string" && value.trim() ? value : fallback;
  return {
    eyebrow: pick(labels?.eyebrow, DEFAULT_APPROVAL_CARD_LABELS.eyebrow),
    confirm: pick(labels?.confirm, DEFAULT_APPROVAL_CARD_LABELS.confirm),
    cancel: pick(labels?.cancel, DEFAULT_APPROVAL_CARD_LABELS.cancel),
  };
}

export type HostArtifactSlot =
  | { key: string; kind: "host"; reference: ChatArtifactReference; node: ReactNode }
  | { key: string; kind: "finance"; reference: ChatArtifactReference };

/**
 * The cards under an assistant reply, in order. Without `renderArtifact` this
 * is one "finance" slot per Fin Hermes reference, as before. With it, every
 * reference except the user's own uploads reaches the hook (also
 * `source: "bots-engine"`); a non-null answer is drawn in place of the Fin
 * card, a null answer leaves a Fin Hermes reference on its Fin card and drops
 * any other reference, as before.
 */
export function hostArtifactSlots(
  references: readonly ChatArtifactReference[] | undefined,
  renderArtifact: ((artifact: ChatArtifactReference, context: NativeR8ArtifactRenderContext) => ReactNode | null) | undefined,
  context: NativeR8ArtifactRenderContext,
): HostArtifactSlot[] {
  if (!renderArtifact) {
    return uniqueMobileFinanceArtifactReferences(references).map((reference) => ({
      key: `${reference.id}:${reference.version}`,
      kind: "finance",
      reference,
    }));
  }
  const unique = new Map<string, ChatArtifactReference>();
  for (const reference of references ?? []) {
    if (reference.source === "upload") continue;
    unique.set(`${reference.source}:${reference.id}:${reference.version}`, reference);
  }
  const slots: HostArtifactSlot[] = [];
  for (const [key, reference] of unique) {
    const node = renderArtifact(reference, context);
    if (node !== null && node !== undefined && node !== false) {
      slots.push({ key, kind: "host", reference, node });
    } else if (reference.source === "finhermes") {
      slots.push({ key: `${reference.id}:${reference.version}`, kind: "finance", reference });
    }
  }
  return slots;
}

/**
 * The host's line under an assistant reply: only for a finished reply (not
 * the user's message, not an optimistic copy, not an interim reply of a run
 * that is still working), and only when the host passes the option.
 */
export function hostMessageFooter(
  message: ChatMessage,
  interimMark: "working" | "stopped" | "interrupted" | null | undefined,
  renderMessageFooter: ((message: ChatMessage, context: NativeR8MessageRenderContext) => ReactNode | null) | undefined,
  context: NativeR8MessageRenderContext,
): ReactNode | null {
  if (!renderMessageFooter) return null;
  if (message.role !== "assistant" || message.optimistic === true || interimMark === "working") return null;
  const node = renderMessageFooter(message, context);
  return node === undefined || node === false ? null : node;
}
