const activeUserKey = "cologne-os-active-user-v1";
const legacyOwnerKey = "cologne-os-legacy-storage-owner-v1";

export function setActiveStorageUser(userId: string | null) {
  if (typeof window === "undefined") return;
  if (userId) window.localStorage.setItem(activeUserKey, userId);
  else window.localStorage.removeItem(activeUserKey);
}

export function getActiveStorageUser() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(activeUserKey) || "";
}

export function scopedStorageKey(baseKey: string) {
  const userId = getActiveStorageUser();
  return `${baseKey}:user:${userId || "anonymous"}`;
}

export function readScopedStorage<T>(baseKey: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;

  try {
    const scopedKey = scopedStorageKey(baseKey);
    const scopedValue = window.localStorage.getItem(scopedKey);
    if (scopedValue) return JSON.parse(scopedValue) as T;

    const userId = getActiveStorageUser();
    if (!userId) return fallback;

    const legacyOwner = window.localStorage.getItem(legacyOwnerKey);
    if (legacyOwner !== userId) return fallback;

    const legacyValue = window.localStorage.getItem(baseKey);
    if (!legacyValue) return fallback;

    window.localStorage.setItem(scopedKey, legacyValue);
    return JSON.parse(legacyValue) as T;
  } catch {
    return fallback;
  }
}

export function writeScopedStorage(baseKey: string, value: unknown) {
  if (typeof window === "undefined") return false;

  try {
    window.localStorage.setItem(scopedStorageKey(baseKey), JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
