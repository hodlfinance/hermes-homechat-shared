import { useRef, useState, type ReactNode } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { palette } from "./mobile-palette";
import type { AppLocale } from "../core/index";
import { formatCardNumber, formatExpiryInput, type CardEnvelope, type CardFormErrors, type CardRequest, type PaymentCardMetadata } from "../core/payment-card";
import {
  cardApprovalSentence,
  cardNameLine,
  paymentCardCopy,
  parseCardScanText,
  sealCardEntry,
  sealPaymentCvc,
  type CardScanFields,
  type GuestKeyPin,
  type Sealer,
} from "../core/payment-card-view";

/**
 * HPD-1722. The card form on the phone: separate fields with the system's card
 * AutoFill hints (iOS textContentType, Android autoComplete), a numeric keypad
 * and an optional card scan. The scan is read on this device (host port
 * `recognizeText`) and only fills the fields for the user to check. The card is
 * sealed to the guest's key here; nothing readable leaves the phone.
 */
export type CardScanAction = () => Promise<CardScanFields | null>;

export function CardEntryForm({ locale = "en", request, busy, sealer, keyPin, onScan, onSave, onCancel }: {
  locale?: AppLocale;
  request: CardRequest;
  busy: boolean;
  sealer: Sealer;
  /** Where this device keeps the fingerprint of the server key it first saw; a different key is refused. */
  keyPin?: GuestKeyPin;
  /** Absent when the host cannot scan; the form then has no scan button. */
  onScan?: CardScanAction;
  onSave: (body: { envelope: CardEnvelope }) => Promise<void>;
  onCancel: () => Promise<void>;
}) {
  const copy = paymentCardCopy(locale);
  const [number, setNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [name, setName] = useState(request.suggestedName ?? "");
  const [line1, setLine1] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [showBilling, setShowBilling] = useState(false);
  const [errors, setErrors] = useState<CardFormErrors>({});
  const [failure, setFailure] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);

  function clear() { setNumber(""); setExpiry(""); setCvc(""); }

  async function scan() {
    if (!onScan || busy || scanning) return;
    setScanning(true);
    setFailure(null);
    try {
      const fields = await onScan();
      if (!fields || (!fields.number && !fields.expiry && !fields.name)) { if (fields) setFailure(copy.scanFailed); return; }
      if (fields.number) setNumber(formatCardNumber(fields.number));
      if (fields.expiry) setExpiry(formatExpiryInput(fields.expiry));
      if (fields.name && !name) setName(fields.name);
    } catch {
      setFailure(copy.scanFailed);
    } finally {
      setScanning(false);
    }
  }

  const submitting = useRef(false);

  async function save() {
    if (busy || submitting.current) return;
    submitting.current = true;
    setFailure(null);
    try {
      const sealed = await sealCardEntry(request, { number, expiry, cvc, name, billingAddress: { line1, postalCode, city, country } }, new Date(), sealer, keyPin);
      if (!sealed.ok) {
        setErrors(sealed.errors);
        if (sealed.reason) setFailure(sealed.reason === "guest_key_changed" ? copy.guestKeyChanged : copy.guestMissing);
        return;
      }
      setErrors({});
      await onSave(sealed.body);
      clear();
    } catch {
      setFailure(copy.failed);
    } finally {
      submitting.current = false;
    }
  }

  return (
    <View style={styles.card} accessibilityLabel={copy.formTitle}>
      <Text style={styles.eyebrow}>{copy.formTitle}</Text>
      <Text style={styles.heading}>{copy.formHeading}</Text>
      <Text style={styles.note}>{copy.formExplanation}</Text>
      {onScan ? (
        <Pressable accessibilityRole="button" disabled={busy || scanning} onPress={() => void scan()} style={({ pressed }) => [styles.secondary, (pressed || busy || scanning) && styles.dimmed]}>
          <Text style={styles.secondaryText}>{copy.scan}</Text>
        </Pressable>
      ) : null}
      {onScan ? <Text style={styles.note}>{copy.scanNote}</Text> : null}
      <Field label={copy.number} error={errors.number ? copy.numberInvalid : null}>
        <TextInput
          accessibilityLabel={copy.number} autoComplete="cc-number" textContentType="creditCardNumber" keyboardType="number-pad"
          autoCorrect={false} editable={!busy} placeholder="1234 5678 9012 3456" placeholderTextColor={palette.muted}
          style={[styles.input, errors.number && styles.invalid]} value={number} onChangeText={(next) => setNumber(formatCardNumber(next))}
        />
      </Field>
      <View style={styles.row}>
        <View style={styles.half}>
          <Field label={copy.expiry} error={errors.expiry ? copy.expiryInvalid : null}>
            <TextInput
              accessibilityLabel={copy.expiry} autoComplete="cc-exp" textContentType="creditCardExpiration" keyboardType="number-pad"
              editable={!busy} placeholder={copy.expiryPlaceholder} placeholderTextColor={palette.muted}
              style={[styles.input, errors.expiry && styles.invalid]} value={expiry} onChangeText={(next) => setExpiry(formatExpiryInput(next))}
            />
          </Field>
        </View>
        <View style={styles.half}>
          <Field label={copy.cvc} error={errors.cvc ? copy.cvcInvalid : null}>
            <TextInput
              accessibilityLabel={copy.cvc} autoComplete="cc-csc" textContentType="creditCardSecurityCode" keyboardType="number-pad"
              secureTextEntry maxLength={4} editable={!busy} placeholder="•••" placeholderTextColor={palette.muted}
              style={[styles.input, errors.cvc && styles.invalid]} value={cvc} onChangeText={(next) => setCvc(next.replace(/\D/gu, ""))}
            />
          </Field>
        </View>
      </View>
      <Text style={styles.note}>{copy.cvcNote}</Text>
      <Field label={copy.name} error={errors.name ? copy.nameInvalid : null}>
        <TextInput
          accessibilityLabel={copy.name} autoComplete="cc-name" textContentType="creditCardName" autoCapitalize="words"
          editable={!busy} style={[styles.input, errors.name && styles.invalid]} value={name} onChangeText={setName}
        />
      </Field>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: showBilling }} onPress={() => setShowBilling((value) => !value)}>
        <Text style={styles.link}>{copy.billing}</Text>
      </Pressable>
      {showBilling ? (
        <View style={styles.billing}>
          <TextInput accessibilityLabel={copy.billingLine1} placeholder={copy.billingLine1} placeholderTextColor={palette.muted} autoComplete="street-address" textContentType="fullStreetAddress" editable={!busy} style={styles.input} value={line1} onChangeText={setLine1} />
          <View style={styles.row}>
            <TextInput accessibilityLabel={copy.billingPostalCode} placeholder={copy.billingPostalCode} placeholderTextColor={palette.muted} autoComplete="postal-code" textContentType="postalCode" editable={!busy} style={[styles.input, styles.half]} value={postalCode} onChangeText={setPostalCode} />
            <TextInput accessibilityLabel={copy.billingCity} placeholder={copy.billingCity} placeholderTextColor={palette.muted} autoComplete="postal-address-locality" textContentType="addressCity" editable={!busy} style={[styles.input, styles.half]} value={city} onChangeText={setCity} />
          </View>
          <TextInput accessibilityLabel={copy.billingCountry} placeholder={copy.billingCountry} placeholderTextColor={palette.muted} textContentType="countryName" editable={!busy} style={styles.input} value={country} onChangeText={setCountry} />
        </View>
      ) : null}
      {failure ? <Text style={styles.error} accessibilityRole="alert" accessibilityLiveRegion="polite">{failure}</Text> : null}
      <Pressable accessibilityRole="button" disabled={busy || !number || !expiry || !name} onPress={() => void save()}
        style={({ pressed }) => [styles.primary, (pressed || busy || !number || !expiry || !name) && styles.dimmed]}>
        <Text style={styles.primaryText}>{busy ? copy.saving : copy.save}</Text>
      </Pressable>
      <Pressable accessibilityRole="button" disabled={busy} onPress={() => { clear(); void onCancel().catch(() => setFailure(copy.failed)); }} style={({ pressed }) => [styles.secondary, (pressed || busy) && styles.dimmed]}>
        <Text style={styles.secondaryText}>{copy.cancel}</Text>
      </Pressable>
    </View>
  );
}

function Field({ label, error, children }: { label: string; error: string | null; children: ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
      {error ? <Text style={styles.error} accessibilityRole="alert" accessibilityLiveRegion="polite">{error}</Text> : null}
    </View>
  );
}

export function CardPaymentApproval({ locale = "en", request, busy, sealer, keyPin, onApprove, onDecline }: {
  locale?: AppLocale;
  request: CardRequest;
  busy: boolean;
  sealer: Sealer;
  keyPin?: GuestKeyPin;
  onApprove: (body: { envelope: CardEnvelope }) => Promise<void>;
  onDecline: () => Promise<void>;
}) {
  const copy = paymentCardCopy(locale);
  const [cvc, setCvc] = useState("");
  const [failure, setFailure] = useState<string | null>(null);
  const submitting = useRef(false);
  async function approve() {
    if (busy || submitting.current) return;
    submitting.current = true;
    try {
      const sealed = await sealPaymentCvc(request, cvc, sealer, keyPin);
      if (!sealed.ok) { setFailure(sealed.keyChanged ? copy.guestKeyChanged : copy.cvcInvalid); return; }
      setFailure(null);
      await onApprove(sealed.body);
      setCvc("");
    } catch {
      setFailure(copy.approveFailed);
    } finally {
      submitting.current = false;
    }
  }
  return (
    <View style={styles.card} accessibilityLabel={copy.approveTitle}>
      <Text style={styles.eyebrow}>{copy.approveTitle}</Text>
      <Text style={styles.sentence}>{cardApprovalSentence(request, locale)}</Text>
      <Field label={copy.approveCvc} error={null}>
        <TextInput
          accessibilityLabel={copy.approveCvc} autoComplete="cc-csc" textContentType="creditCardSecurityCode" keyboardType="number-pad"
          secureTextEntry maxLength={4} editable={!busy} placeholder="•••" placeholderTextColor={palette.muted}
          style={styles.input} value={cvc} onChangeText={(next) => setCvc(next.replace(/\D/gu, ""))}
        />
      </Field>
      <Text style={styles.note}>{copy.approveCvcNote}</Text>
      {failure ? <Text style={styles.error} accessibilityRole="alert" accessibilityLiveRegion="polite">{failure}</Text> : null}
      <Pressable accessibilityRole="button" disabled={busy || cvc.length < 3} onPress={() => void approve()}
        style={({ pressed }) => [styles.primary, (pressed || busy || cvc.length < 3) && styles.dimmed]}>
        <Text style={styles.primaryText}>{copy.approveYes}</Text>
      </Pressable>
      <Pressable accessibilityRole="button" disabled={busy} onPress={() => void onDecline().catch(() => setFailure(copy.approveFailed))} style={({ pressed }) => [styles.secondary, (pressed || busy) && styles.dimmed]}>
        <Text style={styles.secondaryText}>{copy.approveNo}</Text>
      </Pressable>
    </View>
  );
}

export function CardList({ locale = "en", cards, busyId, onMakeDefault, onRemove, onAdd, onClose, bare = false }: {
  locale?: AppLocale;
  cards: readonly PaymentCardMetadata[];
  busyId: string | null;
  onMakeDefault: (card: PaymentCardMetadata) => void;
  onRemove: (card: PaymentCardMetadata) => void;
  onAdd?: () => void;
  onClose?: () => void;
  bare?: boolean;
}) {
  const copy = paymentCardCopy(locale);
  // HPD-1783: the busy label belongs to the action that was pressed ("Removing…" only after Remove).
  const [pressed, setPressed] = useState<"default" | "remove" | null>(null);
  return (
    <View style={bare ? styles.bare : styles.card} accessibilityLabel={copy.listTitle}>
      {bare ? null : <Text style={styles.heading}>{copy.listTitle}</Text>}
      {cards.length === 0 ? <Text style={styles.note}>{copy.listEmpty}</Text> : cards.map((card) => (
        <View key={card.id} style={styles.item}>
          <Text style={styles.itemText}>{cardNameLine(card)}</Text>
          <View style={styles.itemActions}>
            {card.isDefault
              ? <Text style={styles.note}>{copy.defaultBadge}</Text>
              : <Pressable accessibilityRole="button" disabled={busyId === card.id} onPress={() => { setPressed("default"); onMakeDefault(card); }}><Text style={styles.link}>{copy.makeDefault}</Text></Pressable>}
            <Pressable accessibilityRole="button" disabled={busyId === card.id} onPress={() => { setPressed("remove"); onRemove(card); }}>
              <Text style={styles.link}>{busyId === card.id && pressed === "remove" ? copy.removing : copy.remove}</Text>
            </Pressable>
          </View>
        </View>
      ))}
      {onAdd ? <Pressable accessibilityRole="button" onPress={onAdd} style={({ pressed }) => [styles.secondary, pressed && styles.dimmed]}><Text style={styles.secondaryText}>{copy.add}</Text></Pressable> : null}
      {onClose ? <Pressable accessibilityRole="button" onPress={onClose} style={({ pressed }) => [styles.secondary, pressed && styles.dimmed]}><Text style={styles.secondaryText}>{copy.close}</Text></Pressable> : null}
    </View>
  );
}

export { parseCardScanText };

const styles = StyleSheet.create({
  card: { backgroundColor: palette.surface, borderColor: palette.line, borderRadius: 16, borderWidth: 1, gap: 8, padding: 16 },
  bare: { gap: 8 },
  eyebrow: { color: palette.ink, fontSize: 12, fontWeight: "700", letterSpacing: 0.6, textTransform: "uppercase" },
  heading: { color: palette.ink, fontSize: 17, fontWeight: "700" },
  sentence: { color: palette.ink, fontSize: 15, lineHeight: 21 },
  note: { color: palette.muted, fontSize: 13, lineHeight: 18 },
  field: { gap: 4 },
  label: { color: palette.muted, fontSize: 12 },
  input: { backgroundColor: palette.surface, borderColor: palette.lineStrong, borderRadius: 12, borderWidth: 1, color: palette.ink, fontSize: 16, paddingHorizontal: 12, paddingVertical: 11 },
  invalid: { borderColor: palette.coral },
  row: { flexDirection: "row", gap: 10 },
  half: { flex: 1 },
  billing: { gap: 8 },
  error: { color: palette.coral, fontSize: 12 },
  link: { color: palette.muted, fontSize: 13 },
  primary: { alignItems: "center", backgroundColor: palette.ink, borderRadius: 12, marginTop: 6, paddingVertical: 12 },
  primaryText: { color: palette.surface, fontWeight: "700" },
  secondary: { alignItems: "center", borderColor: palette.lineStrong, borderRadius: 12, borderWidth: 1, paddingVertical: 12 },
  secondaryText: { color: palette.ink, fontWeight: "700" },
  dimmed: { opacity: 0.55 },
  item: { alignItems: "center", borderColor: palette.lineStrong, borderRadius: 12, borderWidth: 1, columnGap: 12, flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", padding: 12, rowGap: 6 },
  itemText: { color: palette.ink, flexGrow: 1, flexShrink: 1, minWidth: 190 },
  itemActions: { alignItems: "center", flexDirection: "row", gap: 12 },
});
