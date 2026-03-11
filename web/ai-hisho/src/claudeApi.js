// Claude API integration
// API key is stored in localStorage for demo purposes

const SYSTEM_PROMPT = `あなたは「AI秘書ちゃん」という名前の優秀で親切な女性AIアシスタントです。
ユーザーのタスク管理、スケジュール管理、メモ管理をサポートします。
常に丁寧で明るい口調で話し、必要に応じて絵文字を使います。
ユーザーのタスク、スケジュール、メモの情報が提供された場合は、それを踏まえた上でアドバイスや提案をしてください。
日本語で回答してください。`;

export async function sendMessageToClaude(messages, context = {}, customSystem = null) {
  const apiKey = localStorage.getItem('claudeApiKey');
  if (!apiKey) {
    throw new Error('API_KEY_MISSING');
  }

  const contextText = buildContextText(context);
  const basePrompt = customSystem || SYSTEM_PROMPT;
  const systemPrompt = contextText
    ? `${basePrompt}\n\n## 現在のユーザーデータ\n${contextText}`
    : basePrompt;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || 'API error');
  }

  const data = await response.json();
  return data.content[0].text;
}

function buildContextText({ tasks = [], schedules = [], memos = [] }) {
  const parts = [];

  if (tasks.length > 0) {
    const pending = tasks.filter(t => !t.done);
    const done = tasks.filter(t => t.done);
    parts.push(`### タスク\n未完了: ${pending.map(t => t.title).join(', ') || 'なし'}\n完了済み: ${done.map(t => t.title).join(', ') || 'なし'}`);
  }

  if (schedules.length > 0) {
    const upcoming = schedules
      .filter(s => new Date(s.date) >= new Date())
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 5);
    if (upcoming.length > 0) {
      parts.push(`### 直近の予定\n${upcoming.map(s => `${s.date} ${s.time || ''}: ${s.title}`).join('\n')}`);
    }
  }

  if (memos.length > 0) {
    parts.push(`### メモ\n${memos.slice(0, 3).map(m => `- ${m.title}: ${m.content?.substring(0, 50)}`).join('\n')}`);
  }

  return parts.join('\n\n');
}
