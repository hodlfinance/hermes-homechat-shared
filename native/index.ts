export { createNativeR8Surface } from "./src/surface";
export { createNativeR8CanonicalController } from "./src/hermes-canonical";
export type { NativeR8ChannelIdentity } from "./src/hermes-canonical";
export type { NativeR8ApprovalCardLabels, NativeR8CopyOverrides, NativeR8ArtifactRenderContext, NativeR8MessageRenderContext, NativeR8AssistantAvatarProps, NativeR8Host, NativeR8Platform, NativeR8Transport, NativeR8SessionHost } from "./host";
export type {
  NativeFinanceActionApproval,
  NativeFinanceActionApprovalChannel,
  NativeFinanceActionApprovalField,
  NativeFinanceActionApprovalSurface,
} from "./host";
export { MobileFinanceActionApprovalCard, mobileFinanceActionApprovalCardView } from "./src/mobile-finance-action-approval";
// HPD-2263: pure helpers behind the three optional host options (renderArtifact, renderMessageFooter, approvalCardLabels).
export { DEFAULT_APPROVAL_CARD_LABELS, approvalCardLabels, hostArtifactSlots, hostMessageFooter } from "./src/host-message-hooks";
export type { HostArtifactSlot } from "./src/host-message-hooks";
export type { MobileHostHeaderMenuItem } from "./src/mobile-host-header";
export { createNativeR8Transport } from "./transport";
export type { NativeLiveVoicePort, NativeLiveVoiceHandle, NativeLiveVoiceState, NativeLiveVoicePhase, NativeLiveVoiceLimit } from "./src/mobile-live-voice";
// HPD-1041: the Expo-free live voice client and WebRTC adapter (host injects react-native-webrtc).
export { createLiveVoicePort, createWebRtcLiveVoicePlatform, startLiveVoice, createLiveVoiceLink, LiveVoiceStartError } from "./src/live-voice-client";
export type { LiveVoiceBinding, LiveVoicePlatform, LiveVoiceConnection, LiveVoiceWebRtcModules } from "./src/live-voice-client";
export {
  consumePageStarter,
  openPageStarter,
  pageStarterAfterNavigation,
  pageStarterMatches,
  pageStarterPayload,
  pageStarterTranscript,
} from "./ui/page-starter-state";
export type { PageStarterScope, PageStarterState } from "./ui/page-starter-state";
export { pageStarterCopy } from "./ui/page-starter-copy";
// HPD-1582: a host opens one Hermes settings screen directly (Surface prop screenRequest).
export { NATIVE_R8_HOST_SCREENS, nativeR8HostScreenTarget } from "./src/host-screen-request";
export type { NativeR8HostScreen, NativeR8ScreenRequest } from "./src/host-screen-request";
