/**
 * AI Engine - AIを活用したアイデア生成・分析
 * OpenRouter API（CORS対応）を使用してブラウザから直接AI呼び出し
 */
const AIEngine = (() => {

  const SETTINGS_KEY = 'idea_monetizer_ai_settings';
  const API_URL = 'https://openrouter.ai/api/v1/chat/completions';

  // デフォルト設定
  const defaults = {
    apiKey: '',
    model: 'anthropic/claude-3.5-haiku',
    enabled: false,
  };

  /**
   * 設定の読み込み
   */
  function loadSettings() {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      return raw ? { ...defaults, ...JSON.parse(raw) } : { ...defaults };
    } catch {
      return { ...defaults };
    }
  }

  /**
   * 設定の保存
   */
  function saveSettings(settings) {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      // ignore
    }
  }

  /**
   * AI が使えるかチェック
   */
  function isAvailable() {
    const settings = loadSettings();
    return settings.enabled && settings.apiKey.length > 0;
  }

  /**
   * OpenRouter API を呼び出す
   */
  async function callAI(systemPrompt, userPrompt, options = {}) {
    const settings = loadSettings();
    if (!settings.apiKey) {
      throw new Error('APIキーが設定されていません');
    }

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.apiKey}`,
        'HTTP-Referer': window.location.href,
        'X-Title': 'Idea Monetizer',
      },
      body: JSON.stringify({
        model: settings.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: options.maxTokens || 2000,
        temperature: options.temperature || 0.8,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`API Error (${response.status}): ${err}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  /**
   * トレンド分析に基づくアイデア生成
   */
  async function generateTrendBasedIdeas(categories, trends, insights, count = 5) {
    const categoryLabels = {
      game: 'ゲーム', tool: 'ツール', sns: 'SNS',
      lifestyle: 'ライフスタイル', education: '教育',
      entertainment: 'エンタメ', business: 'ビジネス',
    };

    const catNames = categories.map(c => categoryLabels[c] || c).join('、');
    const trendInfo = trends.slice(0, 5).map(t =>
      `- ${t.keyword}（人気度: ${t.hotness}/10）: ${t.description}。例: ${t.examples.join(', ')}`
    ).join('\n');

    let insightInfo = '';
    if (insights) {
      insightInfo = `\n\n【過去の実績データ】
- これまで${insights.totalIdeas}個のアイデアを生成、${insights.totalWinners}回の勝者選出
- 勝利した特徴: ${insights.winningFeatures.map(f => f.feature).join(', ') || 'まだなし'}
- 人気の特徴: ${insights.popularFeatures.map(f => f.feature).join(', ') || 'まだなし'}
- 最近の勝者: ${insights.recentWinners.map(w => w.name).join(', ') || 'まだなし'}`;
    }

    const systemPrompt = `あなたはアプリアイデアの専門家です。現在のトレンドと過去の実績データを分析して、実際に開発・収益化できる具体的なWebアプリのアイデアを生成します。

以下のルールに従ってください：
1. 各アイデアはHTML/CSS/JSだけで作れるWebアプリであること
2. トレンドを取り入れつつ、独自性のあるアイデアにすること
3. 過去の勝者パターンがあれば、その成功要因を活かすこと
4. 必ずJSON配列で回答すること（説明文は不要）

typeは以下のいずれかを使ってください：
clicker, puzzle, quiz, memory, rhythm, tower, word, slider, qr, image_resize, color, text_convert, password, pomodoro, notepad, json, diary, photo_wall, question, mood, bookshelf, skill_share, habit, expense, meal_log, water, declutter, recipe, flashcard, typing, kanji, coding, math, vocab, fortune, meme, nickname, compatibility, soundboard, roulette, kanban, invoice, card_reader, minutes, time_track, kpi`;

    const userPrompt = `【対象カテゴリ】${catNames}

【現在のトレンド】
${trendInfo}
${insightInfo}

上記を踏まえて、${count}個のWebアプリアイデアをJSON配列で生成してください。

フォーマット:
[
  {
    "name": "アプリ名",
    "category": "カテゴリキー(game/tool/sns/lifestyle/education/entertainment/business)",
    "type": "タイプキー",
    "description": "30文字以内の説明",
    "features": ["特徴1", "特徴2", "特徴3"],
    "targetAudience": "ターゲット層",
    "trendBasis": "取り入れたトレンド"
  }
]`;

    try {
      const result = await callAI(systemPrompt, userPrompt, { temperature: 0.9 });

      // JSONを抽出してパース
      const jsonMatch = result.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error('JSON not found in response');

      const ideas = JSON.parse(jsonMatch[0]);
      return ideas.map(idea => ({
        ...idea,
        id: 'ai_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6),
        isAIGenerated: true,
      }));
    } catch (err) {
      console.error('AI idea generation failed:', err);
      throw err;
    }
  }

  /**
   * アイデアをAIで評価・改良提案
   */
  async function evaluateWithAI(ideas, trends) {
    const systemPrompt = `あなたはアプリ市場の分析の専門家です。与えられたアプリアイデアを現在のトレンドと市場性で評価し、具体的な改善提案をします。必ずJSON配列で回答してください。`;

    const userPrompt = `以下のアイデアを評価し、それぞれに対して改善提案をしてください。

【アイデア一覧】
${ideas.map((idea, i) => `${i + 1}. ${idea.name} (${idea.category}): ${idea.description}`).join('\n')}

【現在のトレンド】
${trends.slice(0, 5).map(t => `- ${t.keyword}: ${t.description}`).join('\n')}

フォーマット:
[
  {
    "ideaIndex": 0,
    "marketScore": 80,
    "feasibilityScore": 90,
    "monetizeScore": 70,
    "viralScore": 60,
    "improvement": "改善提案テキスト",
    "trendFit": "マッチするトレンド名"
  }
]`;

    try {
      const result = await callAI(systemPrompt, userPrompt, { temperature: 0.5 });
      const jsonMatch = result.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error('JSON not found');
      return JSON.parse(jsonMatch[0]);
    } catch (err) {
      console.error('AI evaluation failed:', err);
      return null;
    }
  }

  /**
   * AIでアプリコードを生成
   */
  async function generateCode(idea, trends) {
    const systemPrompt = `あなたはフロントエンドWebアプリ開発の専門家です。単一のHTMLファイルで動作する完全なWebアプリを生成します。

ルール：
1. HTML/CSS/JSを1つのファイルにまとめること
2. 外部ライブラリは使わない（CDNも使わない）
3. スマートフォンでも動作するレスポンシブデザイン
4. ダークテーマの美しいUI
5. 実際に動作するインタラクティブな機能
6. 日本語UI
7. コードだけを出力（説明文は不要）
8. \`\`\`html と \`\`\` で囲むこと`;

    const userPrompt = `以下のアプリを作成してください：

名前: ${idea.name}
カテゴリ: ${idea.category}
説明: ${idea.description}
特徴: ${(idea.features || []).join(', ')}
ターゲット: ${idea.targetAudience || '一般ユーザー'}

完全に動作する単一HTMLファイルを生成してください。`;

    try {
      const result = await callAI(systemPrompt, userPrompt, {
        maxTokens: 4000,
        temperature: 0.7,
      });

      // HTMLコードを抽出
      const htmlMatch = result.match(/```html\s*([\s\S]*?)```/);
      if (htmlMatch) return htmlMatch[1].trim();

      // ```なしの場合、<!DOCTYPE から始まるコードを探す
      const docMatch = result.match(/(<!DOCTYPE[\s\S]*<\/html>)/i);
      if (docMatch) return docMatch[1].trim();

      throw new Error('HTML code not found in response');
    } catch (err) {
      console.error('AI code generation failed:', err);
      throw err;
    }
  }

  /**
   * AI でマーケティングテキストを生成
   */
  async function generateMarketing(idea) {
    const systemPrompt = `あなたはアプリマーケティングの専門家です。アプリのプロモーション素材を生成します。必ずJSONで回答してください。`;

    const userPrompt = `以下のアプリの宣伝素材を生成してください：

名前: ${idea.name}
説明: ${idea.description}
特徴: ${(idea.features || []).join(', ')}

フォーマット:
{
  "tagline": "キャッチコピー（20文字以内）",
  "twitter": "X投稿文（140文字以内、ハッシュタグ含む）",
  "instagram": "Instagram投稿文（絵文字付き）",
  "press": "プレスリリース（200文字程度）",
  "hashTags": ["タグ1", "タグ2", "タグ3", "タグ4", "タグ5"],
  "seoKeywords": ["キーワード1", "キーワード2", "キーワード3", "キーワード4", "キーワード5"]
}`;

    try {
      const result = await callAI(systemPrompt, userPrompt, { temperature: 0.8 });
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('JSON not found');
      return JSON.parse(jsonMatch[0]);
    } catch (err) {
      console.error('AI marketing generation failed:', err);
      throw err;
    }
  }

  /**
   * APIキーのテスト
   */
  async function testConnection() {
    try {
      const result = await callAI(
        'テスト用です。',
        '「接続成功」とだけ答えてください。',
        { maxTokens: 20 }
      );
      return { success: true, message: result };
    } catch (err) {
      return { success: false, message: err.message };
    }
  }

  return {
    loadSettings,
    saveSettings,
    isAvailable,
    testConnection,
    generateTrendBasedIdeas,
    evaluateWithAI,
    generateCode,
    generateMarketing,
  };
})();
