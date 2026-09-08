/** Only direct Included-AI requests may carry native max or explicit omission. */
export type ManagedModelReceipt = {
  reservationId: string;
  model: string;
} & ({
  purpose?: never;
  reasoningEffort?: "low" | "medium" | "high";
  expiresAt?: string;
} | {
  purpose: "direct_included";
  reasoningEffort: "medium" | "high" | "max" | null;
  expiresAt?: never;
});

export function parseManagedModelReceipt(value: unknown): ManagedModelReceipt | undefined {
  if (value === undefined || value === null) return undefined;
  const fail = (): never => { throw new Error("Managed Included-AI receipt is invalid."); };
  if (typeof value !== "object" || Array.isArray(value)) return fail();
  const source = value as Record<string, unknown>;
  if (typeof source.reservationId !== "string" || !/^rsv_[A-Za-z0-9_-]{1,80}$/.test(source.reservationId) ||
      typeof source.model !== "string" || !/^[A-Za-z0-9][A-Za-z0-9._:/-]{0,159}$/.test(source.model)) return fail();
  const base = { reservationId: source.reservationId, model: source.model };
  if (source.purpose === "direct_included") {
    const effort = source.reasoningEffort;
    if (source.expiresAt !== undefined || (effort !== null && effort !== "medium" && effort !== "high" && effort !== "max")) return fail();
    return { ...base, purpose: "direct_included", reasoningEffort: effort };
  }
  if (source.purpose !== undefined) return fail();
  const effort = source.reasoningEffort;
  if (effort !== undefined && effort !== "low" && effort !== "medium" && effort !== "high") return fail();
  if (source.expiresAt !== undefined && (typeof source.expiresAt !== "string" || !source.expiresAt)) return fail();
  return { ...base, ...(effort !== undefined ? { reasoningEffort: effort } : {}),
    ...(typeof source.expiresAt === "string" ? { expiresAt: source.expiresAt } : {}) };
}

export function assertDirectIncludedReceiptBinding(
  receipt: ManagedModelReceipt | undefined,
  provider: { provider: string; model?: string },
  automaticModelPolicy?: unknown,
): void {
  if (receipt?.purpose !== "direct_included") return;
  if (provider.provider !== "openrouter" || provider.model !== receipt.model || automaticModelPolicy != null) {
    throw new Error("Direct Included-AI receipt does not match the request.");
  }
}
