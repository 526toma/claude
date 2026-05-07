/* ============================================================
 * Firebase Functions — Claude API プロキシ
 * フェーズ2で本格稼働。フェーズ1ではフロントのモックでも動く。
 *
 * 環境変数:
 *   CLAUDE_API_KEY  ... Anthropic APIキー
 *
 * 使い方:
 *   POST /api/claude
 *   body: { kind, context, history }
 *   resp: { text }
 * ============================================================ */
const functions = require('firebase-functions');
const Anthropic = require('@anthropic-ai/sdk').default;

const SYSTEM_PROMPT = [
  'あなたは「秘書ちゃん」です。',
  'ユーザーは自転車に乗って走っているので、短く声をかけてください。',
  '30文字以内、敬語、明るく親しみやすく。',
  'データを羅列せず、感情のこもった一言を返してください。',
  '走行中は安全のため余計な質問をしないでください。'
].join(' ');

exports.claudeProxy = functions
  .runWith({ timeoutSeconds: 30, memory: '256MB' })
  .https.onRequest(async (req, res) => {
    // CORS
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(204).send('');
    if (req.method !== 'POST')    return res.status(405).json({ error: 'method not allowed' });

    const apiKey = process.env.CLAUDE_API_KEY || functions.config().claude?.key;
    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    try {
      const { kind, context, history } = req.body || {};
      const userText = buildUserPrompt(kind, context, history);

      const client = new Anthropic({ apiKey });
      const msg = await client.messages.create({
        model: 'claude-sonnet-4-5',
        max_tokens: 200,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userText }]
      });

      const text = (msg.content || []).map(b => b.text || '').join('').trim();
      return res.json({ text });
    } catch (e) {
      console.error('claude proxy error', e);
      return res.status(500).json({ error: String(e.message || e) });
    }
  });

function buildUserPrompt(kind, context, history) {
  const ctxStr = context ? JSON.stringify(context, null, 2) : '{}';
  const hist   = Array.isArray(history) ? history.map(h => `- ${h}`).join('\n') : '';
  return [
    `イベント種別: ${kind || 'general'}`,
    `状態:\n${ctxStr}`,
    hist ? `直近の会話:\n${hist}` : '',
    '上記を踏まえ、秘書ちゃんとして一言（30文字以内）。'
  ].filter(Boolean).join('\n\n');
}
