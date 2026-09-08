/** Versioned, finite API capability set for the HODL host of native R8.
 * Account, billing mutations, admin, runtime lifecycle and preinstalled task
 * automations are deliberately absent. Canonical handlers still enforce the
 * authenticated account, workspace, surface, channel and object permissions.
 */
const routes: ReadonlyArray<readonly [string, RegExp]> = [
  ["GET", /^\/(?:snapshot(?:\/startup)?|entitlement|billing\/subscription-state|bookmarks|plugins|suggestions|chat\/suggestions)$/],
  ["GET", /^\/workspace\/(?:status-truth|server-identity|native-capabilities|model-options|hermes-dashboard-route|connection-reach|first-conversation|guided-setup|security-access\/audit-receipt)$/],
  ["POST", /^\/workspace\/(?:model-preference|chat-route-preference|public-routes|preview-routes|guided-setup\/skip)$/],
  ["PATCH", /^\/workspace\/guided-setup\/(?:ai_access|gmail|telegram|gmail-recommendation\/action)$/],
  ["PATCH", /^\/me\/preferences$/],
  ["DELETE", /^\/bookmarks\/[^/]+$/],
  ["GET", /^\/hermes\/(?:conversations(?:\/[^/]+(?:\/messages)?)?|runs(?:\/[^/]+(?:\/events)?)?|jobs(?:\/[^/]+(?:\/history)?)?|delegated-tasks(?:\/[^/]+)?)$/],
  ["POST", /^\/hermes\/(?:conversations|runs|runs\/[^/]+\/(?:stop|latency)|jobs|jobs\/[^/]+\/(?:pause|resume|run))$/],
  ["PATCH", /^\/hermes\/(?:conversations|jobs)\/[^/]+$/],
  ["DELETE", /^\/hermes\/jobs\/[^/]+$/],
  ["POST", /^\/voice\/(?:transcriptions|speech)$/],
  ["GET", /^\/ai-connection\/claude$/],
  ["POST", /^\/ai-connection\/(?:chatgpt|claude)\/(?:start|complete)$/],
  ["POST", /^\/plugins\/[^/]+\/operations\/[^/]+$/],
  ["POST", /^\/integrations\/[^/]+\/(?:start|check)$/],
  ["PUT", /^\/integrations\/[^/]+\/settings$/],
  ["DELETE", /^\/integrations\/[^/]+\/settings$/],
  ["POST", /^\/integrations\/telegram\/pairing\/approve$/],
  ["POST", /^\/connections\/(?:google\/authorize|setup-requests|gmail\/(?:mobile\/start|mobile\/complete|complete))$/],
  ["GET", /^\/connections\/(?:setup-requests|gmail\/(?:config|status))$/],
  ["DELETE", /^\/connections\/gmail$/],
  ["GET", /^\/secure-secrets\/(?:requests|requests\/[^/]+)$/],
  ["POST", /^\/secure-secrets\/requests\/[^/]+\/(?:complete|cancel)$/],
  ["GET", /^\/support\/(?:request-context|grants)$/],
  ["POST", /^\/support\/(?:requests|grants)$/],
  ["DELETE", /^\/support\/grants\/[^/]+$/],
  ["GET", /^\/approvals$/],
  ["PATCH", /^\/approvals\/[^/]+\/decision$/],
  ["POST", /^\/suggestions\/home-nudge$/],
  ["POST", /^\/suggestions\/[^/]+\/state$/],
  ["POST", /^\/chat\/suggestions\/[^/]+\/use$/],
  ["GET", /^\/workspace\/preview\/\d+(?:\/.*)?$/],
  ["HEAD", /^\/workspace\/preview\/\d+(?:\/.*)?$/],
];

export function permitsHodlNativeR8Request(method: string, path: string): boolean {
  if (!path.startsWith("/") || path.startsWith("//") || /[\\?#\u0000-\u001f]/.test(path)) return false;
  let decoded: string;
  try { decoded = decodeURIComponent(path); } catch { return false; }
  if (/[\\%\u0000-\u001f]/.test(decoded) || decoded.split("/").some((part) => part === "." || part === "..")) return false;
  if (decoded.split("/").length !== path.split("/").length) return false;
  return routes.some(([verb, pattern]) => verb === method && pattern.test(path));
}

export function isPreinstalledR8Suggestion(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const item = value as { id?: string; templateId?: string; target?: { capabilityId?: string; templateId?: string } };
  return item.target?.capabilityId === "tasks" || [item.id, item.templateId, item.target?.templateId].some((id) =>
    id === "hey.ranked-tasks.ranker" || id === "hey.ranked-tasks.email-scanner");
}
