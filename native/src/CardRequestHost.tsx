import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Text } from "react-native";
import type { AppLocale } from "../core/index";
import type { CardEnvelope, CardRequest, PaymentCardMetadata } from "../core/payment-card";
import { sealerWithRandom } from "../core/payment-card-js";
import { paymentCardCopy, parseCardScanText } from "../core/payment-card-view";
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
  useEffect(() => () => { mounted.current = false; }, []);

  const refresh = useCallback(async () => {
    if (!conversationSessionId) { setRequest(null); return; }
    try {
      const pending = await client.pendingCardRequests(conversationSessionId);
      const first = pending[0] ?? null;
      if (!first) { if (mounted.current) setRequest(null); return; }
      const full = first.kind === "manage" ? first : await client.cardRequest(first.id);
      const list = full.kind === "manage" ? await client.paymentCards() : null;
      if (!mounted.current) return;
      setRequest(full.status === "pending" ? full : null);
      if (list) setCards(list);
    } catch {
      // Stays invisible; the next event or poll tries again.
    }
  }, [client, conversationSessionId]);

  useEffect(() => { void refresh(); }, [refresh, refreshKey]);
  useEffect(() => {
    const timer = setInterval(() => { void refresh(); }, FALLBACK_POLL_MS);
    return () => clearInterval(timer);
  }, [refresh]);

  async function finish(task: () => Promise<unknown>, success: string | null) {
    setBusy(true);
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
      <CardEntryForm key={request.id} locale={locale} request={request} busy={busy} sealer={sealer} onScan={onScan}
        onSave={(body) => finish(() => client.completeCardRequest(request.id, body), copy.saved)}
        onCancel={() => finish(() => client.cancelCardRequest(request.id), null)} />
    );
  }
  if (request.kind === "payment") {
    return (
      <CardPaymentApproval key={request.id} locale={locale} request={request} busy={busy} sealer={sealer}
        onApprove={(body) => finish(() => client.completeCardRequest(request.id, body), copy.approved)}
        onDecline={() => finish(() => client.cancelCardRequest(request.id), null)} />
    );
  }
  const act = (card: PaymentCardMetadata, task: () => Promise<unknown>) => {
    setBusyCardId(card.id);
    void task().then(async () => { if (mounted.current) setCards(await client.paymentCards()); }).finally(() => { if (mounted.current) setBusyCardId(null); });
  };
  return (
    <CardList key={request.id} locale={locale} cards={cards} busyId={busyCardId}
      onMakeDefault={(card) => act(card, () => client.setDefaultPaymentCard(card.id))}
      onRemove={(card) => act(card, () => client.deletePaymentCard(card.id))}
      onClose={() => void finish(() => client.cancelCardRequest(request.id), null)} />
  );
}

/** Settings > Cards. Adding a card starts in the chat, because only Hermes opens the form. */
export function CardsSettings({ client, locale = "en", onAddViaChat }: { client: Pick<CardRequestsClient, "paymentCards" | "setDefaultPaymentCard" | "deletePaymentCard">; locale?: AppLocale; onAddViaChat: () => void }) {
  const [cards, setCards] = useState<PaymentCardMetadata[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const load = useCallback(async () => { try { setCards(await client.paymentCards()); } catch { setCards([]); } }, [client]);
  useEffect(() => { void load(); }, [load]);
  const act = (card: PaymentCardMetadata, task: () => Promise<unknown>) => {
    setBusyId(card.id);
    void task().then(load).finally(() => setBusyId(null));
  };
  return (
    <CardList bare locale={locale} cards={cards} busyId={busyId} onAdd={onAddViaChat}
      onMakeDefault={(card) => act(card, () => client.setDefaultPaymentCard(card.id))}
      onRemove={(card) => act(card, () => client.deletePaymentCard(card.id))} />
  );
}
