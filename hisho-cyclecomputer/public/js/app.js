/* ============================================================
 * app.js — エントリーポイント
 *   画面切り替え・設定モーダル・ボタン配線
 * ============================================================ */
(function (global) {
  const SCREENS = ['screen-chat', 'screen-ride', 'screen-summary'];

  function showScreen(id) {
    SCREENS.forEach((s) => {
      const el = document.getElementById(s);
      if (!el) return;
      el.classList.toggle('screen--active', s === id);
    });
  }

  // ===== 起動 =====
  async function init() {
    // 設定の読み込み
    const voiceOn  = await HishoStorage.getSetting('voiceEnabled', true);
    const interval = await HishoStorage.getSetting('speakInterval', 30);
    const userName = await HishoStorage.getSetting('userName', '');
    const debugGps = await HishoStorage.getSetting('debugGps', false);

    HishoVoice.setEnabled(voiceOn);
    global.HishoApp.speakIntervalSec = Number(interval) || 30;

    // 設定モーダルにバインド
    document.getElementById('cfg-voice').checked = voiceOn;
    document.getElementById('cfg-interval').value = interval;
    document.getElementById('cfg-name').value = userName || '';
    document.getElementById('cfg-debug-gps').checked = debugGps;

    bindUi();
    HishoChat.bindInput();
    HishoChat.start();

    // Service Worker登録
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('service-worker.js').catch(() => {});
    }
  }

  function bindUi() {
    // 設定モーダル
    const modal = document.getElementById('settings-modal');
    document.getElementById('btn-settings').addEventListener('click', () => {
      modal.classList.remove('modal--hidden');
    });
    document.getElementById('btn-ride-settings').addEventListener('click', () => {
      modal.classList.remove('modal--hidden');
    });
    document.getElementById('btn-settings-close').addEventListener('click', async () => {
      const voiceOn  = document.getElementById('cfg-voice').checked;
      const interval = parseInt(document.getElementById('cfg-interval').value, 10) || 30;
      const userName = document.getElementById('cfg-name').value.trim();
      const debugGps = document.getElementById('cfg-debug-gps').checked;

      await HishoStorage.setSetting('voiceEnabled', voiceOn);
      await HishoStorage.setSetting('speakInterval', interval);
      await HishoStorage.setSetting('userName', userName);
      await HishoStorage.setSetting('debugGps', debugGps);

      HishoVoice.setEnabled(voiceOn);
      global.HishoApp.speakIntervalSec = interval;
      modal.classList.add('modal--hidden');
    });

    // 走行コントロール
    document.getElementById('btn-pause').addEventListener('click', () => {
      HishoRide.pauseRide();
    });
    document.getElementById('btn-finish').addEventListener('click', async () => {
      const ok = confirm('ゴールしますか？');
      if (!ok) return;
      await endRide();
    });

    // 振り返り画面
    document.getElementById('btn-save').addEventListener('click', () => {
      HishoRide.setBubble && HishoRide.setBubble('保存しました', 1500);
      alert('ライド記録を保存しました（ローカル）');
    });
    document.getElementById('btn-back-home').addEventListener('click', () => {
      showScreen('screen-chat');
      HishoChat.start();
    });
  }

  function startRide(plan) {
    showScreen('screen-ride');
    HishoRide.startRide(plan);
  }

  async function endRide() {
    const summary = await HishoRide.finishRide();
    showScreen('screen-summary');

    document.getElementById('s-distance').textContent = `${summary.distanceKm.toFixed(2)} km`;
    document.getElementById('s-time').textContent = fmtTime(summary.durationSec);
    document.getElementById('s-avg').textContent = `${summary.avgSpeedKmh.toFixed(1)} km/h`;
    document.getElementById('s-max').textContent = `${summary.maxSpeedKmh.toFixed(1)} km/h`;
    document.getElementById('s-elev').textContent = `${Math.round(summary.elevationGainM)} m`;

    // 振り返りメッセージ（フェーズ1：モック）
    const greeting = await HishoApi.callClaude({
      kind: 'finish',
      context: { distanceKm: summary.distanceKm, durationSec: summary.durationSec }
    });
    const g = document.getElementById('summary-greeting');
    if (g) g.textContent = greeting;
    if (HishoVoice) HishoVoice.speak(greeting);

    // 表情を労いに
    const bg = document.getElementById('hisho-bg');
    if (bg) {
      bg.dataset.mood = 'celebrate';
      bg.style.backgroundImage = `url('images/hisho/celebrate.svg')`;
    }
  }

  function fmtTime(s) {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const ss = s % 60;
    return `${h}:${String(m).padStart(2,'0')}:${String(ss).padStart(2,'0')}`;
  }

  global.HishoApp = {
    init, showScreen, startRide, endRide,
    speakIntervalSec: 30
  };

  document.addEventListener('DOMContentLoaded', init);
})(window);
