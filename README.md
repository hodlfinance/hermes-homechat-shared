# Hermes Homechat Shared

Shared, product-neutral Homechat core and React primitives used by Hey Hermes and ready for FinanceHermes.

This package intentionally contains no application secrets, endpoint paths, Finance data access, runtime credentials, themes, navigation, or product CSS. Products inject their own transports and renderers.

Current version: `0.4.0`.

## Exports

- `@hodlfinance/hermes-homechat-shared/core`: canonical events, client reducer/state, transcript/message helpers, composer state, run/SSE/history/job/voice controllers, and typed product slots.
- `@hodlfinance/hermes-homechat-shared/react`: unstyled transcript, message frame, composer chrome, and voice meter primitives.
- `@hodlfinance/hermes-homechat-shared`: product-neutral core entry point.

Published exports are compiled ESM JavaScript and declarations under `dist/`. TypeScript source is not part of the tarball.

## Boundary

Shared here:

- discriminated canonical run-event normalization and standards-compliant SSE frame parsing
- headless client reducer/state, durable message completion, and streaming text reconciliation
- transcript filtering and message/history merging
- composer intent and complete create/send/stream/poll/stop/reconnect controllers
- injectable polling and SSE transports with cursor, reconnect, timeout, and abort semantics
- detached `follow: false` sends that continue through one shared background follower, exposed through `waitForBackgroundFollow()`
- paged conversation/message controllers and full job CRUD/run/history controllers
- adapter-driven browser/native permission, recording, and transcription lifecycle
- typed source, artifact, and action renderer slots keyed by canonical run/message ids
- generic transcript, message frame, composer chrome, and voice meter React components
- versioned Suggestions catalog/state validation, two independent progress/promotion axes,
  deterministic 24-hour/14-day Nudge selection, and mechanical destination descriptors

Not shared here:

- Hey Hermes account/runtime ownership
- FinanceHermes HODL/CapChat tools
- product-specific CSS, copy, source cards, action proposals, or backend clients
- Suggestions catalog content, identity lookup, user state storage, navigation, setup logic,
  completion facts, eligibility facts, or Nudge reservation/locking

## Suggestions boundary

The `0.4.0` core validates stable product-local catalog IDs and the exact
`productId`/immutable product-local `accountId`/`workspaceId` state scope. Progress
(`new`, `shown`, `tried`, `completed`) and promotion (`eligible`, `dismissed`) are
independent axes. Direct manual start can move `new` to `tried` without inventing a
Top placement; only an authoritative product success moves an item to `completed`.

`selectSharedSuggestion()` is pure and deterministic. Product adapters provide their
own eligibility/relevance facts and transactionally persist the returned `nextState`.
The selector enforces at most one Nudge per session and rolling 24 hours, a 14-day
same-ID cooldown, completed/dismissed exclusion, and active-run/high-priority-notice
suppression. Connection, AI Access, Capability, and editable-draft targets contain
only stable registry IDs; products resolve them through their existing setup or
draft routes. No target executes work.

## Transport Boundary

The package never constructs a URL. Products implement `SharedHomechatRunTransport`, `SharedHomechatConversationTransport`, `SharedHomechatHistoryTransport`, and `SharedHomechatJobTransport` against their canonical backend contract. An SSE transport receives the latest cursor and an `AbortSignal`, reports cursor advances, and emits raw events for canonical normalization.

`parseHomechatEventStream` accepts LF or CRLF frames, honors standard `id:`, `event:`, and multiline `data:` fields, attaches the frame id to normalized events, and returns the latest `cursor` for the next `Last-Event-ID` request. `message.completed` is a terminal event and the reducer persists its assistant message before clearing the streaming draft.

```ts
import { createHomechatClientController } from "@hodlfinance/hermes-homechat-shared/core";

const homechat = createHomechatClientController({
  transport: {
    createRun: (request, { signal }) => productClient.createRun(request, { signal }),
    getRun: (runId, { signal }) => productClient.getRun(runId, { signal }),
    stopRun: (runId, { signal }) => productClient.stopRun(runId, { signal }),
    streamRun: (runId, stream) => productClient.streamRun(runId, stream),
  },
});
```

Canonical normalized events keep the Finance contract fields flat: `run.status.state`, `message.delta.text`, `message.completed.messageId/text`, `tool.status.toolCallId/label/state`, `sources.update.items`, `action.proposal.action`, `usage.update.used/limit`, and `error.code/message`. Nested `payload` inputs and existing Hey event-name aliases are accepted at the transport edge.

## Finance Integration

Finance owns the final product surface value `finhermes` in its transport metadata. The shared package does not define product-surface identities.

1. Point the Finance superproject at the reviewed `0.3.1` package commit and pin all local consumers to `0.3.1`.
2. Implement the transport interfaces with Finance's canonical client. Do not add Finance endpoints to this package.
3. Feed API/SSE payloads through `parseHomechatEventStream`, `normalizeHomechatRunEvent`, and `reduceHomechatClientState`; send the returned cursor as `Last-Event-ID` on reconnect.
4. Use `HomechatTranscript` with `SharedHomechatKeyedProductSlots`; render Finance cards, market panels, portfolio context, and confirmations in Finance-owned renderers.
5. Keep Finance navigation, theme, responsive shell, and CSS in the Finance repo.
6. Run package contract tests plus Finance desktop/mobile browser QA before updating the package pointer.
