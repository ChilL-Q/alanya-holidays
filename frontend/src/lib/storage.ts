/**
 * Safe LocalStorage wrapper with schema versioning and exception resilience
 * for private browsing, quota limits, and SSR safety.
 */

export interface StorageOptions<T> {
  version?: number;
  migrate?: (oldVersion: number, oldData: unknown) => T;
}

interface StoredEnvelope<T> {
  version: number;
  data: T;
  timestamp: number;
}

export class SafeStorage {
  private isAvailable(): boolean {
    try {
      if (typeof window === "undefined" || !window.localStorage) {
        return false;
      }
      const testKey = "__storage_test__";
      window.localStorage.setItem(testKey, testKey);
      window.localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  get<T>(key: string, fallback: T, options?: StorageOptions<T>): T {
    if (!this.isAvailable()) return fallback;

    try {
      const raw = window.localStorage.getItem(key);
      if (raw === null) return fallback;

      const parsed = JSON.parse(raw);

      // Check if wrapped in envelope
      if (
        parsed &&
        typeof parsed === "object" &&
        "version" in parsed &&
        "data" in parsed &&
        "timestamp" in parsed
      ) {
        const envelope = parsed as StoredEnvelope<T>;
        const currentVersion = options?.version ?? 1;

        if (envelope.version !== currentVersion && options?.migrate) {
          try {
            const migrated = options.migrate(envelope.version, envelope.data);
            this.set(key, migrated, options);
            return migrated;
          } catch {
            return fallback;
          }
        }
        return envelope.data;
      }

      // Legacy direct values (unwrapped)
      return parsed as T;
    } catch {
      return fallback;
    }
  }

  set<T>(key: string, value: T, options?: StorageOptions<T>): boolean {
    if (!this.isAvailable()) return false;

    try {
      const envelope: StoredEnvelope<T> = {
        version: options?.version ?? 1,
        data: value,
        timestamp: Date.now(),
      };
      window.localStorage.setItem(key, JSON.stringify(envelope));
      return true;
    } catch {
      return false;
    }
  }

  remove(key: string): boolean {
    if (!this.isAvailable()) return false;

    try {
      window.localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  }

  clear(): boolean {
    if (!this.isAvailable()) return false;

    try {
      window.localStorage.clear();
      return true;
    } catch {
      return false;
    }
  }
}

export const safeStorage = new SafeStorage();
