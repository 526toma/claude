/* ============================================================
 * ride.js — 走行ロジック
 *   - GPS / デバッグGPS で位置取得
 *   - 距離・速度・時間・標高を計算
 *   - 30秒ごとに状態判定 → 声かけ
 *   - 大きい数字パネルを更新
 * ============================================================ */
(function (global) {
  // 状態
  const r = {
    rideId: null,
    plan: null,
    startedAt: 0,
    elapsedSec: 0,
    distanceKm: 0,
    currentSpeedKmh: 0,
    avgSpeedKmh: 0,
    maxSpeedKmh: 0,
    elevationGainM: 0,
    elevationLossM: 0,
    recentClimbM: 0,
    lastPos: null,
    lastElev: null,
    lastTickAt: 0,
    zeroSpeedSec: 0,
    track: [],            // GPS軌跡（メモリ上）
    paused: false,
    finished: false,
    // ローカル判定の進行管理
    lastMilestoneKm: 0,
    passedHalf: false,
    passedFinal10: false,
    lastSpokeAt: 0
  };

  let watchId = null;
  let tickHandle = null;
  let speakHandle = null;
  let wakeLock = null;
  let debugTimer = null;

  // ===== 公開API =====
  async function startRide(plan) {
    r.rideId = `ride-${Date.now()}`;
    r.plan = plan || {};
    r.startedAt = Date.now();
    r.elapsedSec = 0;
    r.distanceKm = 0;
    r.currentSpeedKmh = 0;
    r.maxSpeedKmh = 0;
    r.elevationGainM = 0;
    r.elevationLossM = 0;
    r.recentClimbM = 0;
    r.lastPos = null;
    r.lastElev = null;
    r.lastTickAt = Date.now();
    r.zeroSpeedSec = 0;
    r.track = [];
    r.paused = false;
    r.finished = false;
    r.lastMilestoneKm = 0;
    r.passedHalf = false;
    r.passedFinal10 = false;
    r.lastSpokeAt = 0;

    setBubble('準備OK！いってきましょう！', 4000);
    setMood('cheer');

    await acquireWakeLock();

    const debug = await HishoStorage.getSetting('debugGps', false);
    if (debug) startDebugGps();
    else       startRealGps();

    tickHandle  = setInterval(onTick, 1000);
    speakHandle = setInterval(onSpeakCheck, 1000); // 1秒粒度でチェック・しゃべるかは内部で判定
  }

  function pauseRide() {
    r.paused = !r.paused;
    setBubble(r.paused ? '一時停止中' : '走行再開！', 2000);
  }

  async function finishRide() {
    if (r.finished) return;
    r.finished = true;

    if (watchId != null && navigator.geolocation) navigator.geolocation.clearWatch(watchId);
    if (tickHandle) clearInterval(tickHandle);
    if (speakHandle) clearInterval(speakHandle);
    if (debugTimer) clearInterval(debugTimer);
    releaseWakeLock();

    r.avgSpeedKmh = r.elapsedSec > 0 ? (r.distanceKm / (r.elapsedSec / 3600)) : 0;

    const summary = {
      id: r.rideId,
      startedAt: r.startedAt,
      finishedAt: Date.now(),
      durationSec: r.elapsedSec,
      distanceKm: r.distanceKm,
      avgSpeedKmh: r.avgSpeedKmh,
      maxSpeedKmh: r.maxSpeedKmh,
      elevationGainM: r.elevationGainM,
      plan: r.plan
    };
    await HishoStorage.saveRide(summary);
    return summary;
  }

  function getSnapshot() {
    return {
      ...r,
      plannedDistanceKm: r.plan && r.plan.distanceKm,
      plannedDurationMin: r.plan && r.plan.durationMin
    };
  }

  // ===== GPS =====
  function startRealGps() {
    if (!navigator.geolocation) {
      setBubble('GPSが使えません。デバッグGPSをお試しください。', 5000);
      return;
    }
    watchId = navigator.geolocation.watchPosition(
      onPosition,
      (err) => { console.warn('gps err', err); },
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 }
    );
  }

  // 屋内テスト用：1秒ごとにダミー位置を進める（広島駅周辺をぐるぐる）
  function startDebugGps() {
    let t = 0;
    const baseLat = 34.3974, baseLon = 132.4754;
    debugTimer = setInterval(() => {
      t += 1;
      // 直径500mの円周上を時速25kmで進むイメージ
      const r0 = 0.0025; // ≒280m
      const lat = baseLat + r0 * Math.cos(t / 50);
      const lon = baseLon + r0 * Math.sin(t / 50);
      const speedMs = 25 / 3.6;
      onPosition({
        coords: {
          latitude: lat, longitude: lon,
          altitude: 30 + 10 * Math.sin(t / 80),
          speed: speedMs, accuracy: 5
        },
        timestamp: Date.now()
      });
    }, 1000);
  }

  function onPosition(pos) {
    if (r.paused || r.finished) return;
    const c = pos.coords;
    const now = pos.timestamp || Date.now();

    // 距離
    if (r.lastPos) {
      const dKm = HishoState.haversineKm(
        r.lastPos.lat, r.lastPos.lon, c.latitude, c.longitude
      );
      // GPSのジッター対策：移動速度が極端に低い場合は無視
      const dt = (now - r.lastPos.t) / 1000;
      if (dt > 0 && dKm / dt < 0.05) {
        // ほぼ止まっている → 距離加算しない
      } else {
        r.distanceKm += dKm;
      }
    }

    // 速度
    let v = 0;
    if (typeof c.speed === 'number' && c.speed >= 0) {
      v = c.speed * 3.6; // m/s -> km/h
    }
    r.currentSpeedKmh = v;
    if (v > r.maxSpeedKmh) r.maxSpeedKmh = v;

    // 標高
    if (typeof c.altitude === 'number') {
      if (r.lastElev != null) {
        const d = c.altitude - r.lastElev;
        if (d > 0) r.elevationGainM += d;
        else       r.elevationLossM -= d;
        r.recentClimbM = 0.7 * r.recentClimbM + 0.3 * d * 30; // 雑な平均
      }
      r.lastElev = c.altitude;
    }

    r.lastPos = { lat: c.latitude, lon: c.longitude, t: now };
    r.track.push({ lat: c.latitude, lon: c.longitude, alt: c.altitude || null, t: now });

    // IndexedDBに逐次保存（10ポイントごと）
    if (r.track.length % 10 === 0) {
      HishoStorage.appendTrackPoint(r.rideId, r.track[r.track.length - 1]);
    }
  }

  // ===== 1秒tick：UI更新 =====
  function onTick() {
    if (r.paused || r.finished) return;
    const now = Date.now();
    r.elapsedSec = Math.floor((now - r.startedAt) / 1000);

    // 停止時間カウント
    if (r.currentSpeedKmh < 1) r.zeroSpeedSec += 1;
    else                       r.zeroSpeedSec = 0;

    // 数字パネル
    setText('m-distance', r.distanceKm.toFixed(2));
    setText('m-time',     fmtTime(r.elapsedSec));
    setText('m-speed',    r.currentSpeedKmh.toFixed(1));
  }

  // ===== 状態判定＆声かけ =====
  function onSpeakCheck() {
    if (r.paused || r.finished) return;
    const interval = (window.HishoApp && window.HishoApp.speakIntervalSec) || 30;
    if (Date.now() - r.lastSpokeAt < interval * 1000) return;

    const snap = getSnapshot();
    const s = HishoState.analyzeState(snap);

    // マイルストーンの進行を更新
    if (s.milestone) {
      if (s.milestone === 'half') r.passedHalf = true;
      else if (s.milestone === 'final_10km') r.passedFinal10 = true;
      else if (/^\d+km$/.test(s.milestone)) r.lastMilestoneKm = parseInt(s.milestone, 10);
    }

    // 表情更新
    if (s.mood) setMood(s.mood);

    // ローカル定型文
    const phrase = HishoState.localPhrase(s, snap);
    if (phrase) {
      setBubble(phrase.text, 5000);
      r.lastSpokeAt = Date.now();
    }
  }

  // ===== UIヘルパー =====
  function setText(id, v) {
    const el = document.getElementById(id);
    if (el && el.textContent !== String(v)) el.textContent = v;
  }
  function fmtTime(s) {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const ss = s % 60;
    return `${h}:${String(m).padStart(2,'0')}:${String(ss).padStart(2,'0')}`;
  }
  function setBubble(text, ms = 4000) {
    const b = document.getElementById('bubble');
    const t = document.getElementById('bubble-text');
    if (!b || !t) return;
    t.textContent = text;
    b.classList.remove('bubble--hidden');
    if (HishoVoice) HishoVoice.speak(text);
    clearTimeout(setBubble._h);
    setBubble._h = setTimeout(() => b.classList.add('bubble--hidden'), ms);
  }
  function setMood(mood) {
    const bg = document.getElementById('hisho-bg');
    if (!bg) return;
    if (bg.dataset.mood === mood) return;
    bg.dataset.mood = mood;
    bg.style.backgroundImage = `url('images/hisho/${mood}.svg')`;
  }

  // ===== Wake Lock =====
  async function acquireWakeLock() {
    try {
      if ('wakeLock' in navigator) {
        wakeLock = await navigator.wakeLock.request('screen');
        wakeLock.addEventListener('release', () => { /* released */ });
        document.addEventListener('visibilitychange', reAcquireWakeLock);
      }
    } catch (e) { console.warn('wake lock failed', e); }
  }
  async function reAcquireWakeLock() {
    if (document.visibilityState === 'visible' && !r.finished) {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await navigator.wakeLock.request('screen');
        }
      } catch (e) { /* noop */ }
    }
  }
  function releaseWakeLock() {
    document.removeEventListener('visibilitychange', reAcquireWakeLock);
    if (wakeLock && wakeLock.release) wakeLock.release().catch(() => {});
    wakeLock = null;
  }

  global.HishoRide = {
    startRide, pauseRide, finishRide, getSnapshot, setBubble, setMood
  };
})(window);
