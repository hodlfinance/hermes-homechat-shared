/**
 * HPD-1722. The same sealed envelope as `sealCardEnvelope` in payment-card.ts
 * (ECDH P-256, HKDF-SHA256, AES-256-GCM, context as AAD), built from audited
 * pure-JS primitives (@noble) for React Native, whose JavaScript engine has no
 * WebCrypto. The caller supplies the random bytes from the device's secure
 * random source (expo-crypto getRandomBytes), because these libraries must not
 * fall back to a weak source. A test opens its output with the WebCrypto
 * opener the guest uses.
 */
import { gcm } from "@noble/ciphers/aes";
import { p256 } from "@noble/curves/p256";
import { hkdf } from "@noble/hashes/hkdf";
import { sha256 } from "@noble/hashes/sha256";
import { fromBase64Url, guestCardPublicKeyFrom, toBase64Url, type CardEnvelope, type GuestCardPublicKey } from "./payment-card";

export type RandomBytes = (length: number) => Uint8Array;

const encoder = new TextEncoder();

export function sealerWithRandom(randomBytes: RandomBytes) {
  return async function sealCardEnvelopeJs(payload: unknown, guestPublicKey: GuestCardPublicKey, context: string): Promise<CardEnvelope> {
    const guest = guestCardPublicKeyFrom(guestPublicKey);
    const x = fromBase64Url(guest.x);
    const y = fromBase64Url(guest.y);
    if (x.length !== 32 || y.length !== 32) throw new Error("The guest key is invalid.");
    const guestPoint = new Uint8Array(65);
    guestPoint[0] = 4;
    guestPoint.set(x, 1);
    guestPoint.set(y, 33);
    let privateKey = randomBytes(32);
    while (!p256.utils.isValidPrivateKey(privateKey)) privateKey = randomBytes(32);
    const shared = p256.getSharedSecret(privateKey, guestPoint, true).slice(1); // x coordinate only, as WebCrypto deriveBits
    const key = hkdf(sha256, shared, new Uint8Array(0), encoder.encode(`hey-hermes-card-v1|${context}`), 32);
    const iv = randomBytes(12);
    const ciphertext = gcm(key, iv, encoder.encode(context)).encrypt(encoder.encode(JSON.stringify(payload)));
    const ephemeral = p256.getPublicKey(privateKey, false);
    return {
      v: 1,
      epk: { kty: "EC", crv: "P-256", x: toBase64Url(ephemeral.slice(1, 33)), y: toBase64Url(ephemeral.slice(33, 65)) },
      iv: toBase64Url(iv),
      ct: toBase64Url(ciphertext),
    };
  };
}
