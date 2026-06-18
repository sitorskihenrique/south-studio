"use client";

export type CloudTableName = "budgets" | "film_plans" | "tasks" | "projects";

export type CloudOutboxOperation = {
  key: string;
  table: CloudTableName;
  type: "upsert" | "delete";
  id: string;
  item?: { id: string };
  title?: string;
  createdAt: string;
  version: string;
};

const outboxKey = "south-studio-cloud-outbox-v1";

function storageKey(userId: string) {
  return `${outboxKey}:user:${userId}`;
}

export function readCloudOutbox(userId: string): CloudOutboxOperation[] {
  if (typeof window === "undefined" || !userId) return [];
  try {
    const value = window.localStorage.getItem(storageKey(userId));
    if (!value) return [];
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter(isValidOperation) : [];
  } catch {
    return [];
  }
}

export function enqueueCloudOperation(
  userId: string,
  operation: Omit<CloudOutboxOperation, "key" | "createdAt" | "version">,
) {
  if (typeof window === "undefined" || !userId) return false;
  const key = `${operation.table}:${operation.id}`;
  const next = [
    ...readCloudOutbox(userId).filter((item) => item.key !== key),
    { ...operation, key, createdAt: new Date().toISOString(), version: crypto.randomUUID() },
  ];
  return writeCloudOutbox(userId, next);
}

export function removeCloudOperations(userId: string, keys: string[]) {
  if (!keys.length) return true;
  const removed = new Set(keys);
  return writeCloudOutbox(userId, readCloudOutbox(userId).filter((item) => !removed.has(item.key)));
}

export function acknowledgeCloudOperations(userId: string, completed: CloudOutboxOperation[]) {
  if (!completed.length) return true;
  const versions = new Map(completed.map((operation) => [operation.key, operation.version]));
  return writeCloudOutbox(userId, readCloudOutbox(userId).filter((operation) => {
    return versions.get(operation.key) !== operation.version;
  }));
}

export function clearCloudOperation(userId: string, table: CloudTableName, id: string) {
  return removeCloudOperations(userId, [`${table}:${id}`]);
}

export function applyCloudOutbox<T extends { id: string }>(
  userId: string,
  table: CloudTableName,
  cloudItems: T[],
) {
  const items = new Map(cloudItems.map((item) => [item.id, item]));
  for (const operation of readCloudOutbox(userId)) {
    if (operation.table !== table) continue;
    if (operation.type === "delete") items.delete(operation.id);
    else if (operation.item) items.set(operation.id, operation.item as T);
  }
  return Array.from(items.values());
}

function writeCloudOutbox(userId: string, operations: CloudOutboxOperation[]) {
  if (typeof window === "undefined" || !userId) return false;
  try {
    if (operations.length) {
      window.localStorage.setItem(storageKey(userId), JSON.stringify(operations));
    } else {
      window.localStorage.removeItem(storageKey(userId));
    }
    return true;
  } catch {
    return false;
  }
}

function isValidOperation(value: unknown): value is CloudOutboxOperation {
  if (!value || typeof value !== "object") return false;
  const operation = value as Partial<CloudOutboxOperation>;
  return Boolean(
    typeof operation.key === "string" &&
    typeof operation.version === "string" &&
    typeof operation.id === "string" &&
    typeof operation.table === "string" &&
    (operation.type === "upsert" || operation.type === "delete"),
  );
}
