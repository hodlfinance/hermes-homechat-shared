import type { BackupJob } from "../core/index";

export type WorkspaceExportApi = {
  exportSettings: () => Promise<BackupJob>;
  backupJob: (id: string) => Promise<BackupJob>;
};

export function backupJobDownloadHref(jobId: string) {
  return `/api/backup-jobs/${jobId}/download`;
}

export class WorkspaceExportError extends Error {}

/**
 * Asks the server for a fresh export and returns the href to download it from.
 * The server usually finishes the archive inside the create call; the poll is
 * there for the runs that do not.
 */
export async function prepareWorkspaceExportDownload(input: {
  api: WorkspaceExportApi;
  attempts?: number;
  sleep?: (ms: number) => Promise<void>;
  delayMs?: number;
}) {
  const attempts = input.attempts ?? 12;
  const delayMs = input.delayMs ?? 2_000;
  const sleep = input.sleep ?? ((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)));

  let job = await input.api.exportSettings();
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    if (job.status === "completed") {
      return { jobId: job.id, href: backupJobDownloadHref(job.id), sizeBytes: job.sizeBytes };
    }
    if (job.status === "failed") {
      throw new WorkspaceExportError(job.errorMessage?.trim() || "Your export could not be prepared.");
    }
    await sleep(delayMs);
    job = await input.api.backupJob(job.id);
  }
  throw new WorkspaceExportError("Your export is taking longer than expected. Try again in a few minutes.");
}
