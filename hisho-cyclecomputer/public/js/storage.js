/* ============================================================
 * storage.js — IndexedDB によるローカル永続化
 *   - settings : ユーザー設定
 *   - rides    : ライド履歴サマリー
 *   - tracks   : GPSログ（rideIdで紐付け）
 * ============================================================ */
(function (global) {
  const DB_NAME = 'hisho-cyclecomputer';
  const DB_VERSION = 1;

  let dbPromise = null;

  function openDB() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
        if (!db.objectStoreNames.contains('rides')) {
          const s = db.createObjectStore('rides', { keyPath: 'id' });
          s.createIndex('startedAt', 'startedAt');
        }
        if (!db.objectStoreNames.contains('tracks')) {
          const s = db.createObjectStore('tracks', { keyPath: 'id', autoIncrement: true });
          s.createIndex('rideId', 'rideId');
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return dbPromise;
  }

  async function tx(store, mode = 'readonly') {
    const db = await openDB();
    return db.transaction(store, mode).objectStore(store);
  }

  // ===== 設定 =====
  async function getSetting(key, fallback = null) {
    try {
      const s = await tx('settings');
      return new Promise((resolve) => {
        const r = s.get(key);
        r.onsuccess = () => resolve(r.result ? r.result.value : fallback);
        r.onerror   = () => resolve(fallback);
      });
    } catch (e) { return fallback; }
  }
  async function setSetting(key, value) {
    const s = await tx('settings', 'readwrite');
    s.put({ key, value });
  }

  // ===== ライド =====
  async function saveRide(ride) {
    const s = await tx('rides', 'readwrite');
    s.put(ride);
    return ride.id;
  }
  async function listRides() {
    const s = await tx('rides');
    return new Promise((resolve) => {
      const out = [];
      const r = s.openCursor(null, 'prev');
      r.onsuccess = (e) => {
        const c = e.target.result;
        if (c) { out.push(c.value); c.continue(); } else { resolve(out); }
      };
      r.onerror = () => resolve([]);
    });
  }

  // ===== トラックポイント =====
  async function appendTrackPoint(rideId, point) {
    const s = await tx('tracks', 'readwrite');
    s.put({ rideId, ...point });
  }
  async function getTrackPoints(rideId) {
    const s = await tx('tracks');
    return new Promise((resolve) => {
      const idx = s.index('rideId');
      const r = idx.getAll(rideId);
      r.onsuccess = () => resolve(r.result || []);
      r.onerror   = () => resolve([]);
    });
  }

  global.HishoStorage = {
    getSetting, setSetting,
    saveRide, listRides,
    appendTrackPoint, getTrackPoints
  };
})(window);
