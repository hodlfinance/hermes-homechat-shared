import type { AppLocale } from "../core/index";
import { secureConnectionCredentialCopy } from "./secure-connection-copy";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { palette } from "./mobile-palette";

export type SecureConnectionCredentialKind = "telegram" | "whatsapp";

/**
 * HPD-499. The code Hermes' bot sends back, entered where the token was.
 *
 * Once the global allow-all is gone (HPD-486) Hermes refuses a Telegram sender
 * it does not recognise and DMs that sender a pairing code with the command
 * `hermes pairing approve telegram <code>` (gateway/run.py:10053-10080). The
 * bot owner is the customer and has no command line, so the same card that took
 * the bot token takes the code back.
 *
 * The block is passed in rather than always shown: before a bot token is saved
 * there is no bot, so there is no code Hermes could have issued, and an empty
 * field would only ask the customer for something that cannot exist yet.
 */
export type SecureConnectionPairing = {
  code: string;
  notice: string | null;
  onCodeChange: (value: string) => void;
  onApprove: () => void;
};

export function secureConnectionAskHermesPrefill(kind: SecureConnectionCredentialKind) {
  const service = kind === "telegram" ? "Telegram" : "WhatsApp";
  return `Help me set up ${service} for this Hey Hermes workspace and stay in this named setup conversation. First read its current workspace-bound connection state. When a token or ID is needed, request the product's secure credential-entry action and wait for its saved status before continuing. Never ask me to paste a secret into chat, and do not redirect me to the Account or Connections page.`;
}

export function SecureConnectionCredentialForm({
  locale = "en",
  kind,
  busy,
  telegramBotToken,
  whatsappAccessToken,
  whatsappPhoneNumberId,
  telegramPairing,
  onTelegramTokenChange,
  onWhatsappAccessTokenChange,
  onWhatsappPhoneNumberIdChange,
  onSave,
  onAskHermes,
  showAskHermes = true,
}: {
  locale?: AppLocale;
  kind: SecureConnectionCredentialKind;
  busy: boolean;
  telegramBotToken: string;
  whatsappAccessToken: string;
  whatsappPhoneNumberId: string;
  telegramPairing?: SecureConnectionPairing | null;
  onTelegramTokenChange: (value: string) => void;
  onWhatsappAccessTokenChange: (value: string) => void;
  onWhatsappPhoneNumberIdChange: (value: string) => void;
  onSave: () => void;
  onAskHermes?: () => void;
  showAskHermes?: boolean;
}) {
  const copy = secureConnectionCredentialCopy(locale);
  const canSave = kind === "telegram"
    ? Boolean(telegramBotToken.trim())
    : Boolean(whatsappAccessToken.trim() && whatsappPhoneNumberId.trim());

  return (
    <View style={styles.surface}>
      <Text style={styles.heading}>{copy.title}</Text>
      <Text style={styles.explanation}>{copy.explanation}</Text>
      {kind === "telegram" ? (
        <View style={styles.fields}>
          <Text style={styles.label}>{copy.telegramToken}</Text>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            editable={!busy}
            onChangeText={onTelegramTokenChange}
            placeholder={copy.placeholder}
            secureTextEntry
            style={styles.input}
            value={telegramBotToken}
          />
        </View>
      ) : (
        <View style={styles.fields}>
          <Text style={styles.label}>{copy.whatsappPhoneId}</Text>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            editable={!busy}
            onChangeText={onWhatsappPhoneNumberIdChange}
            placeholder={copy.phoneIdPlaceholder}
            style={styles.input}
            value={whatsappPhoneNumberId}
          />
          <Text style={styles.label}>{copy.whatsappToken}</Text>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            editable={!busy}
            onChangeText={onWhatsappAccessTokenChange}
            placeholder={copy.placeholder}
            secureTextEntry
            style={styles.input}
            value={whatsappAccessToken}
          />
        </View>
      )}
      {kind === "telegram" && telegramPairing ? (
        <View style={styles.fields}>
          <Text style={styles.label}>{copy.pairingTitle}</Text>
          {/*
            HPD-502. The last two sentences are here because a wrong code is
            expensive and the customer cannot see the price.

            Measured on the canary on 2026-08-25 against Hermes
            3ef6bbd201263d354fd83ec55b3c306ded2eb72a: a failed approval leaves
            the pending entry in place -- `approve_code` deletes it only on a
            match (gateway/pairing.py:527) -- so a typo does not spend the code,
            and the code keeps its full hour (CODE_TTL_SECONDS = 3600,
            gateway/pairing.py:47). Going back to the bot instead is the
            expensive path: the bot answers the same sender nothing for ten
            minutes (gateway/run.py:10067, RATE_LIMIT_SECONDS = 600,
            gateway/pairing.py:48), and every further approval that misses
            counts into `_failures:telegram`, a tally with no timestamp and no
            decay that only the lockout it triggers resets
            (gateway/pairing.py:611-623).

            Hermes' count and its hour are its own and stay untouched; this only
            tells the customer what they cost. Neither number is repeated here:
            a constant copied out of Hermes would go quietly wrong the day
            Hermes changes it, and this sentence carries no startup check that
            could catch that.
          */}
          <Text style={styles.explanation}>{copy.pairingBody}</Text>
          <TextInput
            autoCapitalize="characters"
            autoCorrect={false}
            editable={!busy}
            onChangeText={telegramPairing.onCodeChange}
            placeholder={copy.pairingPlaceholder}
            style={styles.input}
            value={telegramPairing.code}
          />
          <Pressable
            accessibilityRole="button"
            disabled={busy || !telegramPairing.code.trim()}
            onPress={telegramPairing.onApprove}
            style={({ pressed }) => [
              styles.secondary,
              (pressed || busy || !telegramPairing.code.trim()) && styles.dimmed,
            ]}
          >
            <Text style={styles.secondaryText}>{busy ? copy.approving : copy.approve}</Text>
          </Pressable>
          {telegramPairing.notice ? <Text style={styles.explanation}>{telegramPairing.notice}</Text> : null}
        </View>
      ) : null}
      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          disabled={busy || !canSave}
          onPress={onSave}
          style={({ pressed }) => [styles.primary, (pressed || busy || !canSave) && styles.dimmed]}
        >
          <Text style={styles.primaryText}>{busy ? copy.saving : copy.save}</Text>
        </Pressable>
        {showAskHermes && onAskHermes ? (
          <Pressable accessibilityRole="button" disabled={busy} onPress={onAskHermes} style={({ pressed }) => [styles.secondary, (pressed || busy) && styles.dimmed]}>
            <Text style={styles.secondaryText}>{copy.askHermes}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  surface: { gap: 12 },
  heading: { color: palette.ink, fontSize: 17, fontWeight: "700" },
  explanation: { color: palette.muted, fontSize: 13, lineHeight: 19 },
  fields: { gap: 8 },
  label: { color: palette.ink, fontSize: 13, fontWeight: "600" },
  input: { backgroundColor: palette.surface, borderColor: palette.line, borderRadius: 10, borderWidth: 1, color: palette.text, paddingHorizontal: 12, paddingVertical: 11 },
  actions: { flexDirection: "row", gap: 10 },
  primary: { alignItems: "center", backgroundColor: palette.accent, borderRadius: 9, paddingHorizontal: 14, paddingVertical: 10 },
  primaryText: { color: palette.accentText, fontWeight: "700" },
  secondary: { alignItems: "center", borderColor: palette.line, borderRadius: 9, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10 },
  secondaryText: { color: palette.accentStrong, fontWeight: "700" },
  dimmed: { opacity: 0.55 },
});
