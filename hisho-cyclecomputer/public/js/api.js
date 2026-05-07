/* ============================================================
 * api.js — Claude API プロキシ呼び出し（フェーズ2用）
 *   フェーズ1ではモック応答を返す。
 *   実APIは Firebase Functions の /api/claude にPOST。
 * ============================================================ */
(function (global) {
  const ENDPOINT = '/api/claude';

  async function callClaude(payload) {
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.text || '';
    } catch (e) {
      console.warn('claude api failed, fallback to mock', e);
      return mockReply(payload);
    }
  }

  // フェーズ1モック：会話の流れに応じた定型文
  function mockReply(payload) {
    const kind = payload && payload.kind;
    const ctx  = (payload && payload.context) || {};
    if (kind === 'chat_intro') {
      return 'おはようございます！今日も走りましょうか？';
    }
    if (kind === 'chat_duration') {
      return 'どのくらい走りましょうか？';
    }
    if (kind === 'chat_route') {
      return '今日は穏やかな日和ですね。3つのコースを考えてみました。';
    }
    if (kind === 'chat_checklist') {
      return '出発前にチェックです。ボトル・補給食・ライト・ヘルメット、大丈夫ですか？';
    }
    if (kind === 'chat_go') {
      return 'では、行ってらっしゃい！記録を始めますね。';
    }
    if (kind === 'milestone') {
      return ctx.text || 'いいペースです！';
    }
    if (kind === 'finish') {
      const km = (ctx.distanceKm || 0).toFixed(1);
      return `お疲れさまでした！${km}km、しっかり走れましたね。`;
    }
    return 'はい、わかりました。';
  }

  global.HishoApi = { callClaude };
})(window);
