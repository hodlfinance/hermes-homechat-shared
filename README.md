# Hermes Homechat Shared

Shared, product-neutral Homechat core and React primitives used by Hey Hermes and ready for FinanceHermes.

This package intentionally contains no application secrets, endpoint paths, Finance data access, runtime credentials, themes, navigation, or product CSS. Products inject their own transports and renderers.

Current version: `0.2.0`.

## Exports

- `@hodlfinance/hermes-homechat-shared/core`: canonical events, client reducer/state, transcript/message helpers, composer state, run/SSE/history/job/voice controllers, and typed product slots.
- `@hodlfinance/hermes-homechat-shared/react`: unstyled transcript, message frame, composer chrome, and voice meter primitives.
- `@hodlfinance/hermes-homechat-shared`: backward-compatible alias for `core`.

## Boundary

Shared here:

- discriminated canonical run-event normalization and standards-compliant SSE frame parsing
- headless client reducer/state, durable message completion, and streaming text reconciliation
- transcript filtering and message/history merging
- composer intent and wait/stop/reconnect controllers
- injectable polling and SSE transports with cursor, reconnect, timeout, and abort semantics
- conversation/job history and job lifecycle controllers
- adapter-driven browser/native recording and transcription controller
- typed generic source, artifact, and action renderer slots
- generic transcript, message frame, composer chrome, and voice meter React components

Not shared here:

- Hey Hermes account/runtime ownership
- FinanceHermes HODL/CapChat tools
- product-specific CSS, copy, source cards, action proposals, or backend clients

## Transport Boundary

The package never constructs a URL. Products implement `SharedHomechatRunTransport`, `SharedHomechatHistoryTransport`, and `SharedHomechatJobTransport` against their canonical backend contract. An SSE transport receives the latest cursor and an `AbortSignal`, reports cursor advances, and emits raw events for canonical normalization.

`parseHomechatEventStream` accepts LF or CRLF frames, honors standard `id:`, `event:`, and multiline `data:` fields, attaches the frame id to normalized events, and returns the latest `cursor` for the next `Last-Event-ID` request. `message.completed` is a terminal event and the reducer persists its assistant message before clearing the streaming draft.

```ts
import { createHomechatRunController } from "@hodlfinance/hermes-homechat-shared/core";

const runs = createHomechatRunController({
  getRun: (runId, { signal }) => productClient.getRun(runId, { signal }),
  stopRun: (runId, { signal }) => productClient.stopRun(runId, { signal }),
  streamRun: (runId, stream) => productClient.streamRun(runId, stream),
});
```

## Finance Integration

Finance owns the final product surface value `finhermes` in its transport metadata. The shared package does not define product-surface identities.

1. Point the Finance superproject at the reviewed `0.2.0` package commit and pin all local consumers to `0.2.0`.
2. Implement the transport interfaces with Finance's canonical client. Do not add Finance endpoints to this package.
3. Feed API/SSE payloads through `parseHomechatEventStream`, `normalizeHomechatRunEvent`, and `reduceHomechatClientState`; send the returned cursor as `Last-Event-ID` on reconnect.
4. Use `HomechatTranscript` with typed `sources`, `artifacts`, and `actions`; render Finance cards, market panels, portfolio context, and confirmations in Finance-owned renderers.
5. Keep Finance navigation, theme, responsive shell, and CSS in the Finance repo.
6. Run package contract tests plus Finance desktop/mobile browser QA before updating the package pointer.

The old `heyHomechat*` and `financeHomechat*` helpers remain deprecated compatibility aliases for staged migration. New consumers should use product-neutral helpers and supply product copy locally.
