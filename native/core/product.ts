import type { BillingCheckoutPlan, PlanTier, ProductPrice, Region, WorkspaceServer } from "./types";

export type PaidPlanTier = Exclude<PlanTier, "trial">;

export interface SelfServePlanConfig {
  plan: PaidPlanTier;
  checkoutPlan: BillingCheckoutPlan;
  publicName: "Personal" | "Pro" | "Business";
  monthlyPriceCents: number;
  billingCurrency: "USD";
  includedAiCreditsCents: number;
  dayCeilingCents: number;
  serverType: "cx23" | "cx33" | "cx43";
  vcpu: number;
  memoryMb: number;
  diskMb: number;
  defaultModelSlot: "value" | "fast" | "cheap";
  maxReasoningDefault: boolean;
  parallelAgents: number;
  prioritySupport: boolean;
}

export const selfServePlans = {
  personal: {
    plan: "personal",
    checkoutPlan: "personal",
    publicName: "Personal",
    monthlyPriceCents: 2900,
    billingCurrency: "USD",
    includedAiCreditsCents: 500,
    dayCeilingCents: 125,
    serverType: "cx23",
    vcpu: 2,
    memoryMb: 4096,
    diskMb: 40960,
    defaultModelSlot: "value",
    maxReasoningDefault: false,
    parallelAgents: 1,
    prioritySupport: false,
  },
  plus: {
    plan: "plus",
    checkoutPlan: "pro",
    publicName: "Pro",
    monthlyPriceCents: 4900,
    billingCurrency: "USD",
    includedAiCreditsCents: 1500,
    dayCeilingCents: 375,
    serverType: "cx33",
    vcpu: 4,
    memoryMb: 8192,
    diskMb: 81920,
    defaultModelSlot: "value",
    maxReasoningDefault: false,
    parallelAgents: 2,
    prioritySupport: false,
  },
  business: {
    plan: "business",
    checkoutPlan: "business",
    publicName: "Business",
    monthlyPriceCents: 12900,
    billingCurrency: "USD",
    includedAiCreditsCents: 3000,
    dayCeilingCents: 750,
    serverType: "cx43",
    vcpu: 8,
    memoryMb: 16384,
    diskMb: 163840,
    defaultModelSlot: "fast",
    maxReasoningDefault: true,
    parallelAgents: 4,
    prioritySupport: true,
  },
} satisfies Record<PaidPlanTier, SelfServePlanConfig>;

export const selfServePlansByCheckoutPlan = {
  personal: selfServePlans.personal,
  pro: selfServePlans.plus,
  business: selfServePlans.business,
} satisfies Record<BillingCheckoutPlan, SelfServePlanConfig>;

export function paidPlanFromCheckoutPlan(plan: BillingCheckoutPlan): PaidPlanTier {
  return selfServePlansByCheckoutPlan[plan].plan;
}

export function checkoutPlanForPaidPlan(plan: PlanTier): BillingCheckoutPlan {
  if (plan === "business") return "business";
  if (plan === "plus") return "pro";
  return "personal";
}

export function selfServePlanForPlan(plan: PlanTier): SelfServePlanConfig | null {
  if (plan === "trial") return null;
  return selfServePlans[plan];
}

export const productPrices: ProductPrice[] = [
  {
    plan: "personal",
    monthlyPriceCents: selfServePlans.personal.monthlyPriceCents,
    currency: "USD",
    includedAiCreditsCents: selfServePlans.personal.includedAiCreditsCents,
    description: "Personal workspace on a managed CX23 EU VPS with automatic AI routing, daily backups, and BYOK support.",
  },
  {
    plan: "plus",
    monthlyPriceCents: selfServePlans.plus.monthlyPriceCents,
    currency: "USD",
    includedAiCreditsCents: selfServePlans.plus.includedAiCreditsCents,
    description: "Pro workspace on a managed CX33 EU VPS with the same automatic AI quality policy, more included usage, daily backups, and BYOK support.",
  },
  {
    plan: "business",
    monthlyPriceCents: selfServePlans.business.monthlyPriceCents,
    currency: "USD",
    includedAiCreditsCents: selfServePlans.business.includedAiCreditsCents,
    description: "Business workspace on a managed shared-vCPU CX43 EU VPS with frontier AI, higher parallel-agent concurrency, priority support, daily backups, and BYOK support.",
  },
];

export const regionLabels: Record<Region, string> = {
  eu: "Europe, Germany",
  us: "United States",
};

export const defaultPaidServer: Pick<
  WorkspaceServer,
  "region" | "displayRegion" | "serverType" | "monthlyInfraEstimateCents" | "backupsEnabled"
> = {
  region: "eu",
  displayRegion: regionLabels.eu,
  serverType: selfServePlans.personal.serverType,
  monthlyInfraEstimateCents: 599,
  backupsEnabled: true,
};

export const fairUseCopy = {
  healthy: "Usage is comfortably inside the included fair-use allowance.",
  approaching_limit: "Usage is getting close to the included allowance. ChatGPT OAuth and BYOK keep working outside that allowance.",
  paused: "Included managed AI is paused to avoid surprise costs. ChatGPT OAuth and BYOK keep working.",
} as const;

export function formatMoney(cents: number, currency = "USD") {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

export function usagePercent(used: number, included: number) {
  if (included <= 0) return 0;
  return Math.min(100, Math.round((used / included) * 100));
}
