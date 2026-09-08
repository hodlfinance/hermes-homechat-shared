import { localizedUiMessage } from "./localized-ui-message";
import { adminUiCopy } from "../core/admin-ui-copy";
import { connectionUiCopy } from "../core/connection-ui-copy";
import { interactionUiCopy } from "../core/interaction-ui-copy";
import { authUiCopy } from "../core/auth-ui-copy";
import { appLocales, type AppLocale, accountPageCopy } from "../core/index";
import { supportRequestCopy, supportAccessCopy } from "../core/support-request";
import { capabilityCopy } from "../core/capability-copy";
import { statusPanelCopy } from "../core/status-truth";
import { mobileText } from "./appI18n";
import { secureConnectionCredentialCopy } from "./secure-connection-copy";

// Reuse accepted catalog entries at the remaining static call sites.
function copyFor(locale: AppLocale) {
 return {
"Ready": locale === "en" ? "Ready" : statusPanelCopy(locale).ready,
"Checking...": statusPanelCopy(locale).checking,
"Needs attention": mobileText(locale).firstConversation.guidedSetup.statuses.attention,
"Getting ready": mobileText(locale).chat.activity.gettingReady,
"Dismiss this notice": mobileText(locale).systemPages.common.dismiss,
"Included models": statusPanelCopy(locale).includedModels,
"Connect ChatGPT": mobileText(locale).systemPages.aiAccess.connectChatGpt,
"The optional setup choice could not be saved.": mobileText(locale).firstConversation.guidedSetup.choiceSaveError,
"The optional setup guidance could not be dismissed.": mobileText(locale).firstConversation.guidedSetup.skipError,
"Reply needs attention": mobileText(locale).chat.activity.needsAttention,
"Reply stopped": mobileText(locale).chat.activity.stopped,
"Confirm that you reviewed the exact pinned source, permissions, and trust information for this workspace.": mobileText(locale).systemPages.plugins.confirmBody,
"Admin key could not be saved.": mobileText(locale).systemPages.security.adminKeyFailed,
"Handover check could not run.": mobileText(locale).systemPages.security.handoverFailed,
"Ask Hermes": mobileText(locale).chat.placeholder,
"AI model": statusPanelCopy(locale).aiModel,
"Status unavailable": mobileText(locale).systemPages.aiAccess.statusUnavailable,
"The current AI route could not be confirmed.": locale === "en" ? "The current AI route could not be confirmed." : mobileText(locale).systemPages.aiAccess.currentUnavailable,
"I need help with a Hey Hermes restore request. Please ask which export, archive, or date I mean, explain what can be restored safely, and do not overwrite live data until I explicitly approve the exact restore plan.": mobileText(locale).systemPages.account.restorePrompt,
 ...authUiCopy(locale),
 ...interactionUiCopy(locale),
 ...connectionUiCopy(locale),
 ...adminUiCopy(locale),
"Unavailable": statusPanelCopy(locale).unavailable,
"Not connected": statusPanelCopy(locale).notConnected,
"Disconnect": mobileText(locale).systemPages.plugins.actionLabels.disconnect,
"Back": mobileText(locale).nav.back,
"Email": mobileText(locale).systemPages.account.email,
"Sign out": mobileText(locale).nav.signOut,
"Open": mobileText(locale).firstConversation.guidedSetup.open,
"Dismiss": mobileText(locale).chat.failedDismiss,
"Restore": mobileText(locale).systemPages.automations.restore,
"Connections": mobileText(locale).nav.plugins,
"Service reach": capabilityCopy(locale).serviceReachTitle,
"Diagnostics": mobileText(locale).settings.diagnostics,
"Copy": mobileText(locale).chat.copyMessage,
"Workspace": mobileText(locale).systemPages.security.serverWorkspace,
"Account": mobileText(locale).nav.account,
"Copy the ChatGPT code": mobileText(locale).systemPages.aiAccess.copyChatGptCode,
"Name": mobileText(locale).systemPages.account.name,
"Privacy": mobileText(locale).settings.privacy,
"Support": mobileText(locale).nav.support,
"Cancel": mobileText(locale).nav.removeCancel,
"Try again": mobileText(locale).chat.failedRetry,
"Pairing code from the bot": secureConnectionCredentialCopy(locale).pairingTitle,
"Write to your bot on Telegram. It answers with a code. Enter that code here and the bot will talk to you. A typo does not use the code up, so correct it and send the same code again rather than asking the bot for another one. Wrong codes add up, and enough of them stop Hermes from accepting codes for an hour.": secureConnectionCredentialCopy(locale).pairingBody,
"Eight letters and digits": secureConnectionCredentialCopy(locale).pairingPlaceholder,
"Approve this code": secureConnectionCredentialCopy(locale).approve,
"Check": mobileText(locale).systemPages.plugins.actionLabels.probe,
"Open sign-in": mobileText(locale).systemPages.aiAccess.openSignIn,
"Connected": mobileText(locale).systemPages.aiAccess.connected,
"Expires": mobileText(locale).systemPages.security.grantExpires,
"Your account": mobileText(locale).systemPages.account.memberTitle,
"Last sign-in": mobileText(locale).systemPages.account.lastSignIn,
"Workspace access": statusPanelCopy(locale).workspaceAccess,
"Provider": statusPanelCopy(locale).provider,
"Plan": statusPanelCopy(locale).plan,
"Server": mobileText(locale).systemPages.security.serverType,
"ready": statusPanelCopy(locale).ready,
"Download": mobileText(locale).systemPages.account.download,
"Active": mobileText(locale).systemPages.automations.active,
"Disabled": mobileText(locale).systemPages.account.statusDisabled,
 };
}
const catalog = Object.fromEntries(appLocales.map(locale => [locale, copyFor(locale)])) as Record<AppLocale, ReturnType<typeof copyFor>>;
export function staticUiCopy(locale: AppLocale) { return catalog[locale]; }

// Translate only recognized product copy at presentation time. Error classification
// and server/customer text remain in their original form in state.
export function staticUiMessage(locale: AppLocale, message: string): string {
  return localizedUiMessage(staticUiCopy(locale), message);
}
