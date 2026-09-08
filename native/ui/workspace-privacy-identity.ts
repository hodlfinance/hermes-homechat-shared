import { useEffect, useState } from "react";
import type { WorkspaceServerIdentity } from "../core/index";
export type PrivacyIdentityClient = { workspaceServerIdentity(): Promise<WorkspaceServerIdentity> };
export function useWorkspacePrivacyIdentity(client: PrivacyIdentityClient, workspaceId: string) {
  const [result, setResult] = useState<{ client: PrivacyIdentityClient; workspaceId: string; value: WorkspaceServerIdentity } | null>(null);
  useEffect(() => {
    let cancelled = false;
    setResult(null);
    void client.workspaceServerIdentity().then((value) => {
      if (!cancelled && value.workspaceId === workspaceId) setResult({ client, workspaceId, value });
    }, () => { if (!cancelled) setResult(null); });
    return () => { cancelled = true; };
  }, [client, workspaceId]);
  // A render for a different account/client cannot flash the previous result before its effect runs.
  return result?.client === client && result.workspaceId === workspaceId ? result.value : null;
}
