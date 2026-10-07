/**
 * GramSaathi Offline Storage & Sync Queue
 * Stores screenings and referrals locally in LocalStorage / IndexedDB when offline,
 * and maintains an upload queue to sync with the central server when network returns.
 */

const STORAGE_KEYS = {
  OFFLINE_MODE: "gramsaathi_simulated_offline",
  PENDING_SCREENINGS: "gramsaathi_pending_screenings",
  PENDING_REFERRALS: "gramsaathi_pending_referrals",
  LOCAL_SCREENINGS: "gramsaathi_local_screenings",
  CACHED_VILLAGES: "gramsaathi_cached_villages",
  CACHED_PATIENTS: "gramsaathi_cached_patients",
  USER_LANG: "gramsaathi_lang",
  USER_ROLE: "gramsaathi_role"
};

export const offlineStorage = {
  // Simulated Airplane Mode toggle
  isOfflineSimulated() {
    return localStorage.getItem(STORAGE_KEYS.OFFLINE_MODE) === "true";
  },

  setOfflineSimulated(val) {
    localStorage.setItem(STORAGE_KEYS.OFFLINE_MODE, val ? "true" : "false");
    window.dispatchEvent(new CustomEvent("gramsaathi_network_change", { detail: { offline: val } }));
  },

  // Language & Role preferences
  getLang() {
    return localStorage.getItem(STORAGE_KEYS.USER_LANG) || "en";
  },

  setLang(lang) {
    localStorage.setItem(STORAGE_KEYS.USER_LANG, lang);
  },

  getRole() {
    return localStorage.getItem(STORAGE_KEYS.USER_ROLE) || "worker";
  },

  setRole(role) {
    localStorage.setItem(STORAGE_KEYS.USER_ROLE, role);
  },

  // Sync Queue Operations
  getPendingScreenings() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PENDING_SCREENINGS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  addPendingScreening(screening) {
    const list = this.getPendingScreenings();
    list.unshift({ ...screening, syncStatus: "PENDING_OFFLINE", queuedAt: new Date().toISOString() });
    localStorage.setItem(STORAGE_KEYS.PENDING_SCREENINGS, JSON.stringify(list));
    
    // Also save in local screening history
    const allLocal = this.getLocalScreenings();
    allLocal.unshift(screening);
    localStorage.setItem(STORAGE_KEYS.LOCAL_SCREENINGS, JSON.stringify(allLocal.slice(0, 100)));
    
    window.dispatchEvent(new CustomEvent("gramsaathi_sync_queue_change", { detail: { count: list.length } }));
  },

  getPendingReferrals() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PENDING_REFERRALS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  addPendingReferral(referral) {
    const list = this.getPendingReferrals();
    list.unshift({ ...referral, syncStatus: "PENDING_OFFLINE", queuedAt: new Date().toISOString() });
    localStorage.setItem(STORAGE_KEYS.PENDING_REFERRALS, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent("gramsaathi_sync_queue_change"));
  },

  getLocalScreenings() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.LOCAL_SCREENINGS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  clearPendingSync() {
    localStorage.setItem(STORAGE_KEYS.PENDING_SCREENINGS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.PENDING_REFERRALS, JSON.stringify([]));
    window.dispatchEvent(new CustomEvent("gramsaathi_sync_queue_change", { detail: { count: 0 } }));
  },

  getPendingCount() {
    return this.getPendingScreenings().length + this.getPendingReferrals().length;
  }
};
