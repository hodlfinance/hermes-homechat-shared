import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, Text } from "react-native";
import type { AppLocale } from "../core/index";
import type { CardEnvelope, CardRequest, GuestCardPublicKey, PaymentCardMetadata } from "../core/payment-card";
import { sealerWithRandom } from "../core/payment-card-js";
import { checkGuestKey, paymentCardCopy, parseCardScanText, type GuestKeyCheck } from "../core/payment-card-view";
import type { NativeCardsPort } from "../host";
import { palette } from "./mobile-palette";
import { CardEntryForm, CardList, CardPaymentApproval } from "./CardForms";

export type CardRequestsClient = {
  pendingCardRequests: (conversationSessionId: string) => Promise<CardRequest[]>;
  cardRequest: (requestId: string) => Promise<CardRequest>;
  completeCardRequest: (requestId: string, body: { envelope: CardEnvelope }) => Promise<unknown>;
  cancelCardRequest: (requestId: string) => Promise<unknown>;
  paymentCards: () => Promise<PaymentCardMetadata[]>;
  setDefaultPaymentCard: (cardId: string) => Promise<unknown>;
  deletePaymentCard: (cardId: string) => Promise<unknown>;
  paymentCardGuestKey: () => Promise<GuestCardPublicKey>;
};

const FALLBACK_POLL_MS = 20_000;

/** HPD-1722. The one open card request of this conversation: the form, the approval, or the list. */
export function CardRequestHost({ client, port, locale = "en", conversationSessionId, refreshKey }: {
  client: CardRequestsClient;
  port: NativeCardsPort;
  locale?: AppLocale;
  conversationSessionId: string | null;
  /** Changes when a card run-status event arrives, so the form shows at once. */
  refreshKey: number;
}) {
  const copy = paymentCardCopy(locale);
  const sealer = useMemo(() => sealerWithRandom(port.randomBytes), [port]);
  const [request, setRequest] = useState<CardRequest | null>(null);
  const [cards, setCards] = useState<PaymentCardMetadata[]>([]);
  const [busy, setBusy] = useState(false);
  const [busyCardId, setBusyCardId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  // Only the newest refresh may set state, so a slow answer for another conversation or an older poll never wins.
  const latest = useRef(0);

  const refresh = useCallback(async () => {
    const ticket = ++latest.current;
    const current = () => mounted.current && latest.current === ticket;
    if (!conversationSessionId) { setRequest(null); return; }
    try {
      const pending = await client.pendingCardRequests(conversationSessionId);
      const first = pending[0] ?? null;
      if (!first) { if (current()) setRequest(null); return; }
      const full = first.kind === "manage" ? first : await client.cardRequest(first.id);
      const list = full.kind === "manage" ? await client.paymentCards() : null;
      if (!current()) return;
      setRequest(full.status === "pending" ? full : null);
      if (list) setCards(list);
    } catch {
      // Stays invisible; the next event or poll tries again.
      if (current()) setRequest(null);
    }
  }, [client, conversationSessionId]);

  // A new conversation starts with nothing open and no old notice.
  useEffect(() => { latest.current += 1; setRequest(null); setNotice(null); }, [conversationSessionId]);
  useEffect(() => { void refresh(); }, [refresh, refreshKey]);
  useEffect(() => {
    const timer = setInterval(() => { void refresh(); }, FALLBACK_POLL_MS);
    return () => clearInterval(timer);
  }, [refresh]);

  async function finish(task: () => Promise<unknown>, success: string | null) {
    setBusy(true);
    latest.current += 1; // an answer already on its way must not bring the form back
    try {
      await task();
      if (mounted.current) { setNotice(success); setRequest(null); }
    } finally {
      if (mounted.current) setBusy(false);
    }
  }

  const onScan = port.scanText
    ? async () => {
      const lines = await port.scanText!();
      return lines ? parseCardScanText(lines) : null;
    }
    : undefined;

  if (!request) return notice ? <Text style={{ color: palette.muted, fontSize: 13 }}>{notice}</Text> : null;
  if (request.kind === "entry") {
    return (
      <CardEntryForm key={request.id} locale={locale} request={request} busy={busy} sealer={sealer} keyPin={port.keyPin} onScan={onScan}
        onSave={(body) => finish(() => client.completeCardRequest(request.id, body), copy.saved)}
        onCancel={() => finish(() => client.cancelCardRequest(request.id), null)} />
    );
  }
  if (request.kind === "payment") {
    return (
      <CardPaymentApproval key={request.id} locale={locale} request={request} busy={busy} sealer={sealer} keyPin={port.keyPin}
        onApprove={(body) => finish(() => client.completeCardRequest(request.id, body), copy.approved)}
        onDecline={() => finish(() => client.cancelCardRequest(request.id), null)} />
    );
  }
  const act = (card: PaymentCardMetadata, task: () => Promise<unknown>) => {
    setBusyCardId(card.id);
    void task().then(async () => { if (mounted.current) setCards(await client.paymentCards()); }).catch(() => { if (mounted.current) setNotice(copy.failed); }).finally(() => { if (mounted.current) setBusyCardId(null); });
  };
  return (
    <CardList key={request.id} locale={locale} cards={cards} busyId={busyCardId}
      onMakeDefault={(card) => act(card, () => client.setDefaultPaymentCard(card.id))}
      onRemove={(card) => act(card, () => client.deletePaymentCard(card.id))}
      onClose={() => void finish(() => client.cancelCardRequest(request.id), null).catch(() => undefined)} />
  );
}

/** Settings > Cards. Adding a card starts in the chat, because only Hermes opens the form. Shows the server key's fingerprint. */
export function CardsSettings({ client, port, locale = "en", onAddViaChat }: { client: Pick<CardRequestsClient, "paymentCards" | "setDefaultPaymentCard" | "deletePaymentCard" | "paymentCardGuestKey">; port?: Pick<NativeCardsPort, "keyPin">; locale?: AppLocale; onAddViaChat: () => void }) {
  const copy = paymentCardCopy(locale);
  const [cards, setCards] = useState<PaymentCardMetadata[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [key, setKey] = useState<GuestKeyCheck | null>(null);
  const load = useCallback(async () => {
    try { setCards(await client.paymentCards()); } catch { setCards([]); }
    try {
      const guestKey = await client.paymentCardGuestKey();
      setKey(port?.keyPin ? await checkGuestKey(guestKey, port.keyPin) : null);
    } catch { setKey(null); }
  }, [client, port]);
  useEffect(() => { void load(); }, [load]);
  const act = (card: PaymentCardMetadata, task: () => Promise<unknown>) => {
    setBusyId(card.id);
    void task().then(load).finally(() => setBusyId(null));
  };
  return (
    <>
      <CardList bare locale={locale} cards={cards} busyId={busyId} onAdd={onAddViaChat}
        onMakeDefault={(card) => act(card, () => client.setDefaultPaymentCard(card.id))}
        onRemove={(card) => act(card, () => client.deletePaymentCard(card.id))} />
      {key ? (
        <>
          <Text style={{ color: palette.ink, fontSize: 13 }} accessibilityLabel={copy.keyTitle}>{copy.keyTitle}: {key.fingerprint}</Text>
          <Text style={{ color: palette.muted, fontSize: 13 }}>{key.status === "changed" ? copy.keyChanged : key.status === "unpinned" ? copy.keyUnknown : copy.keyNote}</Text>
          {key.status === "changed" && port?.keyPin ? (
            <Pressable accessibilityRole="button" onPress={() => { void port.keyPin!.write(key.fingerprint).then(load); }}>
              <Text style={{ color: palette.ink, fontSize: 13, fontWeight: "700" }}>{copy.keyTrust}</Text>
            </Pressable>
          ) : null}
        </>
      ) : null}
    </>
  );
}
