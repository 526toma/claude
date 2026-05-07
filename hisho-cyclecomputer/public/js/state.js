/* ============================================================
 * state.js — 走行データから「意味のある状態」を導出する
 *   - phase / intensity / pace / needsAttention / milestone / mood
 *   - ローカル判定で完結（LLMは別レイヤー）
 * ============================================================ */
(function (global) {

  // ハバースイン公式で2点間距離(km)
  function haversineKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const toRad = (d) => d * Math.PI / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat/2)**2 +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLon/2)**2;
    return 2 * R * Math.asin(Math.sqrt(a));
  }

  function detectPhase(r) {
    if (r.elapsedSec < 60) return 'start';
    if (r.recentClimbM > 30) return 'climbing';
    if (r.recentClimbM < -30) return 'descending';
    if (r.currentSpeedKmh < 1 && r.zeroSpeedSec > 60) return 'resting';
    if (r.plannedDistanceKm && r.distanceKm >= r.plannedDistanceKm * 0.9) return 'final';
    return 'cruising';
  }

  function detectIntensity(r) {
    const s = r.currentSpeedKmh;
    if (s < 12) return 'easy';
    if (s < 25) return 'moderate';
    return 'hard';
  }

  function detectPace(r) {
    if (!r.plannedDistanceKm || !r.plannedDurationMin) return 'onpace';
    const expected = (r.elapsedSec / 60) / r.plannedDurationMin * r.plannedDistanceKm;
    const ratio = r.distanceKm / Math.max(expected, 0.01);
    if (ratio < 0.85) return 'underpace';
    if (ratio > 1.15) return 'overpace';
    return 'onpace';
  }

  function detectAlert(r) {
    if (r.zeroSpeedSec > 600) return 'rest_needed';
    if (r.zeroSpeedSec > 180) return 'pause';
    if (r.plannedDistanceKm && r.distanceKm >= r.plannedDistanceKm * 0.95) return 'finishing';
    return null;
  }

  function detectMilestone(r) {
    const km = Math.floor(r.distanceKm);
    const lastKm = r.lastMilestoneKm || 0;
    // 5kmごとのキリ番
    if (km >= lastKm + 5 && km % 5 === 0) return `${km}km`;
    if (r.plannedDistanceKm) {
      const half = r.plannedDistanceKm / 2;
      if (!r.passedHalf && r.distanceKm >= half) return 'half';
      const finalLeg = r.plannedDistanceKm - 10;
      if (!r.passedFinal10 && r.distanceKm >= finalLeg) return 'final_10km';
    }
    return null;
  }

  // 表情判定
  function deriveMood(r, alert, milestone) {
    if (alert === 'rest_needed') return 'worry';
    if (alert === 'finishing')   return 'celebrate';
    if (milestone === 'half' || /^\d+km$/.test(milestone || '')) {
      const km = parseInt(milestone, 10);
      if (km && km % 10 === 0) return 'celebrate';
      return 'cheer';
    }
    if (r.recentClimbM > 30) return 'effort';
    if (r.recentClimbM < -30) return 'relax';
    if (r.zeroSpeedSec > 60) return 'rest';
    if (r.elapsedSec < 60) return 'wink';
    return 'normal';
  }

  function analyzeState(r) {
    const alert     = detectAlert(r);
    const milestone = detectMilestone(r);
    return {
      phase: detectPhase(r),
      intensity: detectIntensity(r),
      pace: detectPace(r),
      needsAttention: alert,
      milestone,
      mood: deriveMood(r, alert, milestone)
    };
  }

  // ローカル定型文（LLM不要）
  function localPhrase(state, r) {
    if (state.needsAttention === 'rest_needed') {
      return { text: '大丈夫ですか？少し休みましょう。', mood: 'worry' };
    }
    if (state.needsAttention === 'pause') {
      return { text: '休憩中ですか？水分補給しましょう。', mood: 'rest' };
    }
    if (state.milestone) {
      const m = state.milestone;
      if (m === 'half') {
        return { text: '折り返し地点です！半分まで来ましたね。', mood: 'celebrate' };
      }
      if (m === 'final_10km') {
        return { text: 'あと10km！ラストスパート行きましょう！', mood: 'cheer' };
      }
      const km = parseInt(m, 10);
      if (km && km % 10 === 0) {
        return { text: `${km}km達成です！素晴らしい！`, mood: 'celebrate' };
      }
      return { text: `${m}通過です！順調ですね。`, mood: 'cheer' };
    }
    if (state.phase === 'climbing' && r.recentClimbM > 50) {
      return { text: '登り、頑張りましょう！', mood: 'effort' };
    }
    if (state.phase === 'descending') {
      return { text: '下りは安全運転で。', mood: 'normal' };
    }
    return null;
  }

  global.HishoState = { analyzeState, localPhrase, haversineKm };
})(window);
