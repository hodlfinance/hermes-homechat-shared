import type { SecurityAuditReceipt } from "../core/index";

/**
 * HPD-411: "Download receipt" on a phone.
 *
 * The browser writes the audit receipt into the download folder. iOS has no
 * download folder, so the app writes the same JSON once, hands it to the share
 * sheet, and deletes its own copy again — in a `finally`, so a share that
 * fails or is dismissed leaves nothing behind either.
 *
 * That deletion is why this writer is not a second residue owner beside the
 * audio one in `audio-residue.ts`: it keeps no file to sweep at sign-out.
 * `test/mobile-security-receipt.test.ts` measures that against a real
 * directory rather than trusting this sentence.
 *
 * The receipt carries hashes, event kinds and timestamps. It carries no secret
 * value, and nothing here adds one.
 */

export type SecurityReceiptFileSystem = {
  cacheDirectory: string | null;
  writeAsStringAsync: (fileUri: string, contents: string) => Promise<void>;
  deleteAsync: (fileUri: string, options?: { idempotent?: boolean }) => Promise<void>;
};

/**
 * Either a file or the text itself, never a half of both: React Native's own
 * `ShareContent` is that same either/or, and matching it here keeps the call
 * site honest instead of casting at it.
 */
export type SecurityReceiptSharePayload =
  | { title: string; url: string }
  | { title: string; message: string };

export type SecurityReceiptShare = (payload: SecurityReceiptSharePayload) => Promise<unknown>;

export function securityAuditReceiptFileName(workspaceId: string) {
  return `hey-hermes-security-audit-receipt-${workspaceId}.json`;
}

export async function shareSecurityAuditReceiptFile(input: {
  fileSystem: SecurityReceiptFileSystem;
  receipt: SecurityAuditReceipt;
  share: SecurityReceiptShare;
}): Promise<{ mode: "file" | "text"; fileName: string }> {
  const body = JSON.stringify(input.receipt, null, 2);
  const fileName = securityAuditReceiptFileName(input.receipt.workspaceId);
  const directory = input.fileSystem.cacheDirectory;
  if (!directory) {
    await input.share({ title: fileName, message: body });
    return { mode: "text", fileName };
  }
  const fileUri = `${directory}${fileName}`;
  try {
    await input.fileSystem.writeAsStringAsync(fileUri, body);
    await input.share({ title: fileName, url: fileUri });
    return { mode: "file", fileName };
  } finally {
    await input.fileSystem.deleteAsync(fileUri, { idempotent: true }).catch(() => undefined);
  }
}
