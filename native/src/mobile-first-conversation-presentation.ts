import {
  firstConversationView,
  type FirstConversationSnapshot,
} from "../core/index";

export interface MobileFirstConversationPresentation {
  alignMessagesToTop: boolean;
  autoScrollToEnd: boolean;
  showConnectionCard: boolean;
  showGreeting: boolean;
}

export function mobileFirstConversationPresentation(
  snapshot: FirstConversationSnapshot | null,
  visibleMessageCount: number,
  isHomeChatActive: boolean,
): MobileFirstConversationPresentation {
  if (!snapshot || !isHomeChatActive) {
    return {
      alignMessagesToTop: false,
      autoScrollToEnd: true,
      showConnectionCard: false,
      showGreeting: false,
    };
  }

  const view = firstConversationView(snapshot, visibleMessageCount);
  return {
    ...view,
    alignMessagesToTop: view.showGreeting,
    autoScrollToEnd: !view.showGreeting,
  };
}
