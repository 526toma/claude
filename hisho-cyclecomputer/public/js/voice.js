/* ============================================================
 * voice.js — Web Speech API ラッパー
 *   - iOS Safari は初回タップで unlock が必要
 *   - 同じセリフの連続再生を抑制
 * ============================================================ */
(function (global) {
  let unlocked = false;
  let enabled  = true;
  let lastSpoken = '';
  let lastSpokenAt = 0;

  // 利用可能な日本語音声を返す
  function pickVoice() {
    const voices = speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return null;
    // 女性らしい日本語ボイスを優先
    const prefer = voices.find(v =>
      /ja|Japanese|Kyoko|O-ren|Otoya/i.test(`${v.lang}|${v.name}`));
    return prefer || voices.find(v => v.lang && v.lang.startsWith('ja')) || null;
  }

  function unlock() {
    if (unlocked || !('speechSynthesis' in window)) return;
    try {
      const u = new SpeechSynthesisUtterance('');
      u.volume = 0;
      speechSynthesis.speak(u);
      unlocked = true;
    } catch (e) { /* noop */ }
  }

  function speak(text, opts = {}) {
    if (!enabled || !text) return;
    if (!('speechSynthesis' in window)) return;

    const now = Date.now();
    if (text === lastSpoken && now - lastSpokenAt < 5000) return;
    lastSpoken = text; lastSpokenAt = now;

    try {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'ja-JP';
      u.rate  = opts.rate  || 1.0;
      u.pitch = opts.pitch || 1.2;  // 高めで秘書ちゃんっぽく
      u.volume = opts.volume != null ? opts.volume : 1.0;
      const v = pickVoice();
      if (v) u.voice = v;
      // 進行中の発話を中断
      if (speechSynthesis.speaking) speechSynthesis.cancel();
      speechSynthesis.speak(u);
    } catch (e) { console.warn('speak failed', e); }
  }

  function setEnabled(flag) { enabled = !!flag; }
  function isEnabled() { return enabled; }

  // 一部ブラウザは voices の遅延ロードがあるので一度叩く
  if ('speechSynthesis' in window) {
    speechSynthesis.onvoiceschanged = () => { /* warm */ };
  }

  global.HishoVoice = { unlock, speak, setEnabled, isEnabled };
})(window);
