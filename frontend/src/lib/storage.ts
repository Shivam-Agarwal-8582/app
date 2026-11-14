import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

/**
 * Platform-aware storage adapter:
 * - On Native Android/iOS: Uses Capacitor Preferences (Android SharedPreferences in private sandbox)
 * - On Web Browser: Uses standard localStorage
 * Sensitive tokens are never logged or exposed.
 */

// In-memory synchronous cache for instantaneous state hydration
const memoryCache = new Map<string, string>();
let isHydrated = false;

export const storage = {
  /**
   * Pre-hydrates critical auth keys into memory during application bootstrap.
   */
  async init(): Promise<void> {
    if (isHydrated) return;
    try {
      if (Capacitor.isNativePlatform()) {
        const [tokenRes, refreshRes, userRes, themeRes] = await Promise.all([
          Preferences.get({ key: 'access_token' }),
          Preferences.get({ key: 'refresh_token' }),
          Preferences.get({ key: 'user_data' }),
          Preferences.get({ key: 'splitwise_theme' }),
        ]);

        if (tokenRes.value) memoryCache.set('access_token', tokenRes.value);
        if (refreshRes.value) memoryCache.set('refresh_token', refreshRes.value);
        if (userRes.value) memoryCache.set('user_data', userRes.value);
        if (themeRes.value) memoryCache.set('splitwise_theme', themeRes.value);
      } else if (typeof window !== 'undefined' && window.localStorage) {
        ['access_token', 'refresh_token', 'user_data', 'splitwise_theme'].forEach((key) => {
          const val = localStorage.getItem(key);
          if (val) memoryCache.set(key, val);
        });
      }
    } catch {
      // Fallback silently without leaking details
    } finally {
      isHydrated = true;
    }
  },

  /**
   * Synchronous get from cache (ideal for initial React state hooks)
   */
  getSync(key: string): string | null {
    if (memoryCache.has(key)) {
      return memoryCache.get(key) || null;
    }
    if (typeof window !== 'undefined' && window.localStorage) {
      const val = localStorage.getItem(key);
      if (val) {
        memoryCache.set(key, val);
        return val;
      }
    }
    return null;
  },

  /**
   * Asynchronous get with native preference fallback
   */
  async getItem(key: string): Promise<string | null> {
    if (memoryCache.has(key)) {
      return memoryCache.get(key) || null;
    }

    if (Capacitor.isNativePlatform()) {
      try {
        const { value } = await Preferences.get({ key });
        if (value !== null && value !== undefined) {
          memoryCache.set(key, value);
          return value;
        }
      } catch {
        return null;
      }
    }

    if (typeof window !== 'undefined' && window.localStorage) {
      const val = localStorage.getItem(key);
      if (val) memoryCache.set(key, val);
      return val;
    }

    return null;
  },

  /**
   * Sets item in native storage and in-memory cache
   */
  async setItem(key: string, value: string): Promise<void> {
    memoryCache.set(key, value);

    if (Capacitor.isNativePlatform()) {
      try {
        await Preferences.set({ key, value });
        return;
      } catch {
        // Fallback to localStorage if native bridge fails
      }
    }

    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(key, value);
    }
  },

  /**
   * Removes item from native storage and cache
   */
  async removeItem(key: string): Promise<void> {
    memoryCache.delete(key);

    if (Capacitor.isNativePlatform()) {
      try {
        await Preferences.remove({ key });
      } catch {
        // Continue to localStorage
      }
    }

    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(key);
    }
  },

  /**
   * Clears all auth data securely
   */
  async clear(): Promise<void> {
    memoryCache.clear();

    if (Capacitor.isNativePlatform()) {
      try {
        await Preferences.clear();
      } catch {
        // Fallback
      }
    }

    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.clear();
    }
  },
};

