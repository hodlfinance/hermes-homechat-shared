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
Preview sessions must remain limited to the selected private page and expire
or fail immediately when the broker authority is revoked.

Native support is React 18.3/19, React Native 0.77–0.81 and SVG 15.12–15.x.
Type checks and source tests do not establish an iOS artifact, deployment,
provider configuration or device acceptance.
