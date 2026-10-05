export { createNativeR8Surface } from "./src/surface";
export { createNativeR8CanonicalController } from "./src/hermes-canonical";
export type { NativeR8ChannelIdentity } from "./src/hermes-canonical";
export type { NativeR8Host, NativeR8Platform, NativeR8Transport, NativeR8SessionHost } from "./host";
export type {
  NativeFinanceActionApproval,
  NativeFinanceActionApprovalChannel,
  NativeFinanceActionApprovalField,
  NativeFinanceActionApprovalSurface,
} from "./host";
export { MobileFinanceActionApprovalCard, mobileFinanceActionApprovalCardView } from "./src/mobile-finance-action-approval";
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
