import type { WorkspaceServerIdentity } from "../core/types";
import type { MobileSystemPagesCopy } from "./appI18n";

/**
 * HPD-1027: the rows of the Account screen's server section, shared by the app
 * and the web so both show the same facts in the same order.
 *
 * Only facts the control plane returns appear; a fact it does not know (null)
 * is left out rather than shown as a placeholder. The region is host-provided
 * display text (e.g. "Falkenstein, Germany (EU)") and is shown verbatim.
 */

export type WorkspaceServerDetailCopy = Pick<
  MobileSystemPagesCopy["security"],
  | "serverWorkspace"
  | "serverId"
  | "serverIpv4"
  | "serverType"
  | "serverRegion"
  | "serverCpu"
  | "serverMemory"
  | "serverDisk"
  | "serverSince"
>;

export type WorkspaceServerDetailKey =
  | "workspace"
  | "serverId"
  | "ipv4"
  | "serverType"
  | "region"
  | "cpu"
  | "memory"
  | "disk"
  | "since";

export interface WorkspaceServerDetailRow {
  key: WorkspaceServerDetailKey;
  label: string;
  detail: string;
}

/** MiB as GiB when it divides evenly, otherwise as MiB. */
export function formatServerMemoryMib(mib: number): string {
  return mib % 1024 === 0 ? `${mib / 1024} GiB` : `${mib} MiB`;
}

function presentNumber(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function presentText(value: string | null | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function workspaceServerDetailRows(
  identity: WorkspaceServerIdentity,
  copy: WorkspaceServerDetailCopy,
  formatDate: (value: string) => string,
): WorkspaceServerDetailRow[] {
  const machineId = identity.hostingKind === "dedicated_vps" ? identity.serverId : identity.workspaceMachineId;
  const rows: Array<[WorkspaceServerDetailKey, string, string | null]> = [
    ["workspace", copy.serverWorkspace, presentText(identity.workspaceId) ? identity.workspaceId : null],
    ["serverId", copy.serverId, presentText(machineId) ? machineId : null],
    ["ipv4", copy.serverIpv4, presentText(identity.publicIpv4) ? identity.publicIpv4 : null],
    ["serverType", copy.serverType, presentText(identity.serverType) ? identity.serverType : null],
    ["region", copy.serverRegion, presentText(identity.location) ? identity.location : null],
    ["cpu", copy.serverCpu, presentNumber(identity.allocatedVcpu) ? String(identity.allocatedVcpu) : null],
    [
      "memory",
      copy.serverMemory,
      presentNumber(identity.allocatedMemoryMib) ? formatServerMemoryMib(identity.allocatedMemoryMib) : null,
    ],
    [
      "disk",
      copy.serverDisk,
      presentNumber(identity.allocatedPersistentStorageGib) ? `${identity.allocatedPersistentStorageGib} GiB` : null,
    ],
    ["since", copy.serverSince, presentText(identity.inServiceSince) ? formatDate(identity.inServiceSince) : null],
  ];
  return rows.flatMap(([key, label, detail]) => (detail === null ? [] : [{ key, label, detail }]));
}
