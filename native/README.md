# Native R8 surface (HPD-407)

`@hodlfinance/hermes-homechat-shared/native` is the common React Native screen
used by Hey and HODL. Its starting point is the accepted Hey Internal R8,
Build 89, source `53b5e7d69c66c9525d0ad94a227bc6b49359322e`.
`r8-source.json` records the original files and source hashes. The native
core/UI dependency closure is included so a consumer does not install Hey's
Expo SDK, workspace packages, authentication or purchase SDK.

`createNativeR8Surface(host)` preserves the R8 screen, controls, panels and
interaction helpers. Create the component once per host session; remount it
when that session changes. Both products render this component. Hey's former
local native modules re-export this package. A consumer must not implement a
parallel replacement screen.

The host supplies product copy/icon, optional colors, private preference
storage, session custody, an authenticated transport and native services.
`createNativeR8Transport` sends every request through the supplied fetch,
including status truth, support and canonical streaming. Canonical requests
retain an explicit surface/channel and validate returned conversation/run
bindings. The host may pass a deliberate conversation navigation request;
only successful canonical hydration acknowledges it.

An external account host has no standalone login, account destination,
sign-out, RevenueCat binding, entitlement modal, global appearance mutation or
Expo push registration. Its surrounding application owns these functions.
Connections, Support and Privacy remain available. Native recording,
attachments, read-aloud, home chat, history, Stop, tools, Pages, Automations,
AI Access and dashboard use the same R8 implementations.

HODL disables the preinstalled ranker and email scanner. Their routes are
absent from the finite native API policy, their UI/data loads are skipped and
ranker task suggestions are excluded. The existing canonical jobs API removes
managed default job IDs while retaining user jobs. A route/language change
must not reinstall or repin the excluded defaults. No user job is removed by
matching its title or prompt.

`native/policy` is a pure server/mobile capability allowlist. It is not an
authenticator. The Finance BFF must resolve the exact HODL broker session,
recheck the canonical account/workspace/runtime, and forward only the scoped
Finance OAuth credential. Hey must enforce that credential's immutable
Finance policy on each permitted R8 route. The BFF translates its local
`hodl_mobile` channel to its registered upstream `finhermes_web` channel, then
projects response/event channel fields back. HODL credentials never reach Hey.
LiveQuote iOS (HPD-1226) is a second host of the same `finhermes` surface with
its own local channel `livequote_mobile`. The BFF has to admit that channel
and project it back in run, conversation and approval fields, as it does for
`hodl_mobile`. This client accepts a finance approval only when its channel
equals the channel the surface is bound to; which app an upstream approval is
projected to is decided by the BFF.
Preview sessions must remain limited to the selected private page and expire
or fail immediately when the broker authority is revoked.

Native support is React 18.3/19, React Native 0.77–0.81 and SVG 15.12–15.x.
Type checks and source tests do not establish an iOS artifact, deployment,
provider configuration or device acceptance.

The native API client omits the unused server-side browser-result producer
method. Private runtime-producer authority is not part of a UI host.

Native SDK dependency ranges are declared in `host-dependencies.json` and
installed by each native host. They are not root package peers: even optional
React Native peers make npm include mobile SDK dependencies in server-only
workspace production/audit graphs. Core and server policy consumers must not
acquire the native SDK through this package.

## Live voice (HPD-1015, HPD-1041)

`host.liveVoice` is optional. `native/live-voice` (also exported from
`native`) provides the Expo-free client: `createLiveVoicePort({ baseUrl,
fetchImpl, platform, binding })` with `createWebRtcLiveVoicePlatform(modules)`.
The host injects react-native-webrtc, its microphone permission request, a
UUIDv4 source and optional audio-route steps; this package imports none of
them. HODL uses the binding `{ surface: "finhermes", channel: "hodl_mobile" }`
through its BFF; `native/policy` permits only `POST /voice/realtime/calls` and
`GET`/`DELETE /voice/realtime/calls/<uuidv4>`. The Plane owns the provider
call, the delegated Hermes runs and the voice time limit; the client shows
`endedReason` (`call_limit`, `daily_limit`) as a notice under the composer.

## Home prewarm (HPD-1121, HPD-1191)

`native/policy` permits `POST /hermes/home/prewarm`. The HODL host sends it,
through its BFF, when the Fin chat comes into view (body `{ trigger:
"app_foreground", surface: "finhermes", channel: "hodl_mobile" }`). The Plane
answers 202 at once, accepts it only for the finance principal of this account
and workspace, and owns every limit; a failure changes nothing for the next
message.

Host parity (HPD-1220). Every `NativeR8Host` option and every API call the
surface makes carries a recorded Fin verdict in
`native/test/hpd1220-host-parity.test.ts`: wired in the HODL host, exempt
with a reason, or pending with an issue. A new option or call without one
fails CI. A route Fin needs is permitted here and in the Finance BFF
(`hodl-hermes-web` `native-r8.ts`); the Plane reads this policy through its
own pin of this package, so it needs the same pin bump.

## Hey Hermes on Android (HPD-1243)

One switch opens the store side of the Hey surface on Android:
`host.policy.heyAndroidLaunchEnabled`. Absent or false, an Android build is what
it was before: sign-in by email link only (the request names the surface
`ios`, as it always did), no paywall, no RevenueCat binding, no Google button,
no sales status. True, on Android only:

- the paywall and the account's purchase block are shown, with every purchase
  text re-worded for Google Play by `heyStoreWording` (`src/hey-store-platform.ts`).
  `src/ios-paywall.ts` is not changed and iOS texts pass through untouched;
- RevenueCat is bound to the Hey account before a plan is read or bought. The
  host builds its `MobilePurchasesController` with
  `{ store: "play_store", personalMonthlyProductId }`; the product id has the
  form `<subscription_id>:<base_plan_id>` and the free week is read from the
  offer Google returns, because RevenueCat's eligibility check is iOS only;
- sign-in requests name the surface `android`. Google signs in through the
  optional port `platform.GoogleNative.signIn({ serverClientId, nonce })`; the
  id token's audience is the client id the Plane publishes for `android`.
  Without the port no Google button is shown;
- the sales status is read, so the paywall closes when the host has no room.

Not on Android: Sign in with Apple (the native module is iOS only; a web
sign-in needs a redirect address the Plane does not publish), and Google
re-authentication before account deletion (the email link covers it).

The Account page and the account deletion screen name the store the plan is
managed in (`personalAccessStore`, read from `webBilling.management` of the
subscription state): the App Store sentences as before, Google Play for a Play
plan, and no store name for a web trial.

On Android with the switch on, a plan managed on the web names no store in
the two deletion sentences (`heyAccountDeletionStoreCopy`), as the trial
sentence does for a web trial.

"Report this reply" (Google Play, AI-generated content policy): on Android
with the switch on, a long-press on a finished Hermes reply, or the bubble's
accessibility action, opens a report sheet (reason, optional note). It is sent
through the existing support client as an ordinary support case. The text
names the message, conversation, run and reply time; it never contains the
reply or any other chat content. iOS never shows it.

The paywall colours and its drawing follow the scheme the Android palette was
built for at load, with the switch on or off.
