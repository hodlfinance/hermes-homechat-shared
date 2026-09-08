import type { ChatRoutePreference, CuratedModelTruthItem } from "../core/index";

export type MobileAiAccessLogoKey =
  | "openai"
  | "anthropic"
  | "openrouter"
  | "google"
  | "minimax"
  | "deepseek"
  | "qwen"
  | "glm"
  | "generic";

export function mobileAiAccessRouteLogoKey(
  route: ChatRoutePreference,
  canonicalProviderIds: readonly string[] = [],
): MobileAiAccessLogoKey {
  if (route === "chatgpt_account") return "openai";
  if (route === "claude_account") return "anthropic";
  return canonicalProviderIds.includes("openrouter_managed") ? "openrouter" : "generic";
}

export function mobileCuratedModelLogoKey(
  model: Pick<CuratedModelTruthItem, "providerModelId" | "canonicalProviderModelId">,
): MobileAiAccessLogoKey {
  const providerIdentities = new Set(
    [model.providerModelId, model.canonicalProviderModelId]
      .map((identifier) => identifier.trim().split("/", 1)[0]?.toLowerCase())
      .filter((identifier): identifier is string => Boolean(identifier)),
  );
  if (providerIdentities.has("anthropic")) return "anthropic";
  if (providerIdentities.has("openai")) return "openai";
  if (providerIdentities.has("google")) return "google";
  if (providerIdentities.has("minimax")) return "minimax";
  // HPD-449: the offer changed under the ranking and three models arrived with
  // no mark at all. Justus saw the gap in build 64 within a minute.
  if (providerIdentities.has("deepseek")) return "deepseek";
  if (providerIdentities.has("qwen") || providerIdentities.has("alibaba")) return "qwen";
  if (providerIdentities.has("z-ai") || providerIdentities.has("zhipu")) return "glm";
  return "generic";
}
