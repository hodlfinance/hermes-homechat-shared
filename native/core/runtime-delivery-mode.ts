import { createHash } from "node:crypto";

export const runtimeDeliveryModes = ["PRE_LAUNCH", "PRODUCTION"] as const;
export type RuntimeDeliveryMode = (typeof runtimeDeliveryModes)[number];

export type ProductionPromotionReceipt = Readonly<{
  schemaVersion: "heyhermes.production-promotion-receipt/v1";
  approvedBy: "Justus";
  receiptId: string;
  approvedAt: string;
  receiptSha256: string;
}>;

export type RuntimeTargetClassificationReceipt = Readonly<{
  schemaVersion: "heyhermes.runtime-target-classification/v1";
  workspaceId: string;
  provider: string;
  serverId: number;
  mode: RuntimeDeliveryMode;
  revision: number;
  classifiedAt: string;
  productionPromotion: ProductionPromotionReceipt | null;
  receiptSha256: string;
}>;

type RuntimeTargetClassificationInput = Omit<RuntimeTargetClassificationReceipt, "receiptSha256">;

export function createRuntimeTargetClassificationReceipt(
  input: RuntimeTargetClassificationInput,
): RuntimeTargetClassificationReceipt {
  assertClassificationBody(input);
  const receiptSha256 = createHash("sha256")
    .update(canonicalRuntimeClassificationJson(input))
    .digest("hex");
  return Object.freeze({ ...input, receiptSha256 });
}

export function requireRuntimeTargetClassificationReceipt(
  value: unknown,
  expected: Readonly<{ workspaceId: string; provider?: string; serverId?: number }>,
): RuntimeTargetClassificationReceipt {
  if (!recordValue(value)) throw new Error("Runtime target classification receipt is required.");
  const input = {
    schemaVersion: value.schemaVersion,
    workspaceId: value.workspaceId,
    provider: value.provider,
    serverId: value.serverId,
    mode: value.mode,
    revision: value.revision,
    classifiedAt: value.classifiedAt,
    productionPromotion: value.productionPromotion,
  } as RuntimeTargetClassificationInput;
  assertClassificationBody(input);
  if (value.workspaceId !== expected.workspaceId) throw new Error("Runtime target classification workspace does not match.");
  if (expected.provider !== undefined && value.provider !== expected.provider) {
    throw new Error("Runtime target classification provider does not match.");
  }
  if (expected.serverId !== undefined && value.serverId !== expected.serverId) {
    throw new Error("Runtime target classification server does not match.");
  }
  const expectedSha256 = createHash("sha256")
    .update(canonicalRuntimeClassificationJson(input))
    .digest("hex");
  if (value.receiptSha256 !== expectedSha256) throw new Error("Runtime target classification receipt hash does not match.");
  return Object.freeze({ ...input, receiptSha256: expectedSha256 });
}

export function canonicalRuntimeClassificationJson(value: unknown): string {
  return JSON.stringify(canonicalValue(value));
}

function assertClassificationBody(value: RuntimeTargetClassificationInput): void {
  if (value.schemaVersion !== "heyhermes.runtime-target-classification/v1") throw new Error("Runtime target classification schema is invalid.");
  if (typeof value.workspaceId !== "string" || !value.workspaceId.trim()) throw new Error("Runtime target classification workspace is invalid.");
  if (typeof value.provider !== "string" || !/^[a-z0-9][a-z0-9_-]{1,63}$/.test(value.provider)) {
    throw new Error("Runtime target classification provider is invalid.");
  }
  if (!Number.isSafeInteger(value.serverId) || value.serverId <= 0) throw new Error("Runtime target classification server is invalid.");
  if (!runtimeDeliveryModes.includes(value.mode)) throw new Error("Runtime target classification mode is invalid.");
  if (!Number.isSafeInteger(value.revision) || value.revision < 1) throw new Error("Runtime target classification revision is invalid.");
  if (typeof value.classifiedAt !== "string" || !Number.isFinite(Date.parse(value.classifiedAt))) {
    throw new Error("Runtime target classification time is invalid.");
  }
  if (value.mode === "PRE_LAUNCH" && value.productionPromotion !== null) {
    throw new Error("PRE_LAUNCH targets cannot carry a production promotion receipt.");
  }
  if (value.mode === "PRODUCTION") assertProductionPromotion(value.productionPromotion);
}

function assertProductionPromotion(value: unknown): asserts value is ProductionPromotionReceipt {
  if (!recordValue(value) || value.schemaVersion !== "heyhermes.production-promotion-receipt/v1") {
    throw new Error("PRODUCTION requires an explicit Justus promotion receipt.");
  }
  if (value.approvedBy !== "Justus") throw new Error("PRODUCTION promotion must be approved by Justus.");
  if (typeof value.receiptId !== "string" || !/^[A-Za-z0-9][A-Za-z0-9._:/-]{7,199}$/.test(value.receiptId)) {
    throw new Error("Production promotion receipt id is invalid.");
  }
  if (typeof value.approvedAt !== "string" || !Number.isFinite(Date.parse(value.approvedAt))) {
    throw new Error("Production promotion receipt time is invalid.");
  }
  if (typeof value.receiptSha256 !== "string" || !/^[a-f0-9]{64}$/.test(value.receiptSha256)) {
    throw new Error("Production promotion receipt digest is invalid.");
  }
}

function canonicalValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalValue);
  if (!recordValue(value)) return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalValue(value[key])]));
}

function recordValue(value: unknown): value is Record<string, any> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
