export type MobileAiAccessOauthProvider = "chatgpt" | "claude";

export type MobileAiAccessOauthStartFailure = {
  kind: "start_failed";
  provider: MobileAiAccessOauthProvider;
  failureClass: "runtime_paused" | "start_unavailable";
  nextAction: "resume_runtime" | "retry_start";
};

export type MobileAiAccessOauthLinkFailure<TConnection> = {
  kind: "link_failed";
  provider: MobileAiAccessOauthProvider;
  failureClass: "ios_link_failed";
  nextAction: "open_authorization_again";
  connection: TConnection;
  authorizationUrl: string;
};

export type MobileAiAccessOauthOpened<TConnection> = {
  kind: "opened";
  provider: MobileAiAccessOauthProvider;
  connection: TConnection;
  authorizationUrl: string;
};

export type MobileAiAccessOauthStartOutcome<TConnection> =
  | MobileAiAccessOauthStartFailure
  | MobileAiAccessOauthLinkFailure<TConnection>
  | MobileAiAccessOauthOpened<TConnection>;

type MobileAiAccessOauthStartInput<TConnection> = {
  provider: MobileAiAccessOauthProvider;
  start: () => Promise<TConnection>;
  authorizationUrl: (connection: TConnection) => string;
  preserveConnection: (connection: TConnection) => Promise<void> | void;
  openUrl: (url: string) => Promise<unknown>;
};

/**
 * Starts one provider-owned OAuth flow without consulting Included AI or the
 * aggregate AI status truth. A successful start is preserved before iOS is
 * asked to open the exact provider URL, so a link failure remains retryable.
 */
export async function startMobileAiAccessOauth<TConnection>({
  provider,
  start,
  authorizationUrl,
  preserveConnection,
  openUrl,
}: MobileAiAccessOauthStartInput<TConnection>): Promise<MobileAiAccessOauthStartOutcome<TConnection>> {
  let connection: TConnection;
  try {
    connection = await start();
  } catch (error) {
    if (runtimeIsPaused(error)) {
      return {
        kind: "start_failed",
        provider,
        failureClass: "runtime_paused",
        nextAction: "resume_runtime",
      };
    }
    return {
      kind: "start_failed",
      provider,
      failureClass: "start_unavailable",
      nextAction: "retry_start",
    };
  }

  const url = authorizationUrl(connection);
  await preserveConnection(connection);

  try {
    await openUrl(url);
    return { kind: "opened", provider, connection, authorizationUrl: url };
  } catch {
    return {
      kind: "link_failed",
      provider,
      failureClass: "ios_link_failed",
      nextAction: "open_authorization_again",
      connection,
      authorizationUrl: url,
    };
  }
}

function runtimeIsPaused(error: unknown) {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return message.includes("runtime is paused") || message.includes("resume access");
}
