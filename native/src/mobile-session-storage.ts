export type NativeSessionSecureStore = {
  deleteItemAsync(key: string): Promise<void>;
  getItemAsync(key: string): Promise<string | null>;
  isAvailableAsync(): Promise<boolean>;
  setItemAsync(key: string, value: string): Promise<void>;
};

async function requireNativeSecureSessionStorage(store: NativeSessionSecureStore) {
  let available = false;
  try {
    available = await store.isAvailableAsync();
  } catch {
    // The same fail-closed error below covers availability probe failures.
  }
  if (!available) {
    throw new Error("Secure session storage is unavailable on this device.");
  }
}

export async function persistNativeSessionToken(
  store: NativeSessionSecureStore,
  tokenKey: string,
  legacyTokenKey: string,
  token: string,
) {
  await requireNativeSecureSessionStorage(store);
  try {
    await store.setItemAsync(tokenKey, token);
  } catch {
    throw new Error("Could not save the secure session on this device.");
  }

  let readback: string | null;
  try {
    readback = await store.getItemAsync(tokenKey);
  } catch {
    await store.deleteItemAsync(tokenKey).catch(() => undefined);
    throw new Error("Could not verify the saved secure session on this device.");
  }
  if (readback !== token) {
    await store.deleteItemAsync(tokenKey).catch(() => undefined);
    throw new Error("Could not verify the saved secure session on this device.");
  }

  try {
    await store.deleteItemAsync(legacyTokenKey);
  } catch {
    throw new Error("Could not finish securing the saved session on this device.");
  }
}

export async function readNativeSessionToken(
  store: NativeSessionSecureStore,
  tokenKey: string,
  legacyTokenKey: string,
) {
  await requireNativeSecureSessionStorage(store);
  let token: string | null;
  let legacyToken: string | null;
  try {
    token = await store.getItemAsync(tokenKey);
    legacyToken = token ? null : await store.getItemAsync(legacyTokenKey);
  } catch {
    throw new Error("Could not read the saved secure session on this device.");
  }
  if (token || !legacyToken) return token;

  try {
    await store.setItemAsync(tokenKey, legacyToken);
  } catch {
    throw new Error("Could not migrate the saved secure session on this device.");
  }
  let readback: string | null;
  try {
    readback = await store.getItemAsync(tokenKey);
  } catch {
    await store.deleteItemAsync(tokenKey).catch(() => undefined);
    throw new Error("Could not verify the migrated secure session on this device.");
  }
  if (readback !== legacyToken) {
    await store.deleteItemAsync(tokenKey).catch(() => undefined);
    throw new Error("Could not verify the migrated secure session on this device.");
  }
  try {
    await store.deleteItemAsync(legacyTokenKey);
  } catch {
    throw new Error("Could not finish migrating the saved secure session on this device.");
  }
  return readback;
}
