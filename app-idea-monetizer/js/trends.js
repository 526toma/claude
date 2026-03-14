/**
 * Trends Database
 * 現在のアプリ市場トレンドと過去のヒット事例
 */
const Trends = (() => {

  // 2024-2026年のアプリ市場トレンド
  const currentTrends = [
    {
      keyword: 'AI搭載',
      description: 'AI機能を組み込んだアプリが急増。チャットbot、画像生成、文章要約など',
      hotness: 10,
      categories: ['tool', 'business', 'education'],
      examples: ['ChatGPT', 'Midjourney', 'Notion AI'],
    },
    {
      keyword: 'ショート動画',
      description: '短尺動画コンテンツの消費が急増。TikTok型のUIが標準化',
      hotness: 9,
      categories: ['sns', 'entertainment'],
      examples: ['TikTok', 'YouTube Shorts', 'Instagram Reels'],
    },
    {
      keyword: 'ゲーミフィケーション',
      description: '非ゲームアプリにゲーム要素を導入。ストリーク、バッジ、ランキング',
      hotness: 8,
      categories: ['education', 'lifestyle', 'tool'],
      examples: ['Duolingo', 'Habitica', 'Forest'],
    },
    {
      keyword: 'ノーコード/ローコード',
      description: 'プログラミング不要でアプリや自動化を作れるツール',
      hotness: 9,
      categories: ['tool', 'business'],
      examples: ['Notion', 'Airtable', 'Zapier'],
    },
    {
      keyword: 'メンタルヘルス',
      description: '瞑想、ストレス管理、睡眠改善アプリの需要増',
      hotness: 8,
      categories: ['lifestyle', 'education'],
      examples: ['Calm', 'Headspace', 'Meditopia'],
    },
    {
      keyword: 'サブスク管理',
      description: 'サブスクリプション管理や節約系アプリが人気',
      hotness: 7,
      categories: ['tool', 'lifestyle', 'business'],
      examples: ['Subscriptions', 'Bobby', 'Truebill'],
    },
    {
      keyword: 'ハイパーカジュアルゲーム',
      description: 'シンプルで中毒性の高いカジュアルゲーム。広告収入モデル',
      hotness: 8,
      categories: ['game', 'entertainment'],
      examples: ['Flappy Bird', '2048', 'Wordle'],
    },
    {
      keyword: 'コミュニティ型',
      description: '同じ趣味・目的を持つ人のコミュニティプラットフォーム',
      hotness: 7,
      categories: ['sns', 'lifestyle', 'education'],
      examples: ['Discord', 'Reddit', 'Clubhouse'],
    },
    {
      keyword: 'パーソナライズ',
      description: 'ユーザーの行動に基づくパーソナライズされた体験',
      hotness: 9,
      categories: ['entertainment', 'education', 'lifestyle'],
      examples: ['Spotify', 'Netflix', 'Pinterest'],
    },
    {
      keyword: 'フィンテック',
      description: '家計管理、投資、決済の簡素化アプリ',
      hotness: 8,
      categories: ['business', 'lifestyle', 'tool'],
      examples: ['PayPay', 'Moneytree', 'Revolut'],
    },
    {
      keyword: 'Web3/ブロックチェーン',
      description: 'NFT、トークン経済、分散型アプリ',
      hotness: 5,
      categories: ['business', 'entertainment', 'game'],
      examples: ['OpenSea', 'Axie Infinity', 'StepN'],
    },
    {
      keyword: 'AR/VR',
      description: '拡張現実・仮想現実を活用した没入型体験',
      hotness: 7,
      categories: ['game', 'education', 'entertainment'],
      examples: ['Pokemon GO', 'IKEA Place', 'Beat Saber'],
    },
    {
      keyword: 'クリエイターエコノミー',
      description: '個人クリエイターが収益化できるプラットフォーム',
      hotness: 9,
      categories: ['sns', 'business', 'entertainment'],
      examples: ['YouTube', 'Patreon', 'Substack'],
    },
    {
      keyword: 'マイクロSaaS',
      description: '特定のニッチな問題を解決する小さなSaaSアプリ',
      hotness: 8,
      categories: ['tool', 'business'],
      examples: ['Plausible', 'Buttondown', 'Carrd'],
    },
    {
      keyword: 'ヘルスケア',
      description: '運動記録、食事管理、バイタルトラッキング',
      hotness: 8,
      categories: ['lifestyle', 'tool'],
      examples: ['Nike Run Club', 'MyFitnessPal', 'Oura'],
    },
  ];

  // 過去の大ヒットアプリのパターン
  const hitPatterns = [
    { pattern: 'シンプル操作 + 中毒性', examples: ['Flappy Bird', '2048', 'Wordle'], factor: '操作は1つだけ、でもやめられない' },
    { pattern: '日常の小さな不便を解消', examples: ['Shazam', 'Google翻訳', 'CamScanner'], factor: '「あったらいいな」を実現' },
    { pattern: 'ソーシャル × ゲーム', examples: ['Among Us', 'Pokemon GO', 'クイズノック'], factor: '友達と一緒に遊べる' },
    { pattern: 'データの可視化', examples: ['Spotify Wrapped', 'スクリーンタイム', 'GitHub Contributions'], factor: '自分のデータを美しく見せる' },
    { pattern: 'ストリーク・習慣化', examples: ['Duolingo', 'Snapchat', 'GitHub'], factor: '連続記録が途切れたくない心理' },
    { pattern: 'ユーザー生成コンテンツ', examples: ['TikTok', 'Minecraft', 'Roblox'], factor: 'ユーザーが作ったものが価値になる' },
    { pattern: '制限が生む創造性', examples: ['Twitter (140字)', 'Vine (6秒)', 'BeReal (1日1回)'], factor: '制約があるから面白い' },
    { pattern: 'リアルタイム体験', examples: ['Clubhouse', 'Twitch', 'Among Us'], factor: '今この瞬間を共有' },
    { pattern: '自動化・時短', examples: ['IFTTT', 'Zapier', 'Shortcuts'], factor: '面倒なことを自動でやる' },
    { pattern: 'パーソナル分析', examples: ['23andMe', 'MBTI診断', '動物占い'], factor: '自分を知りたい欲求' },
  ];

  // トレンドの組み合わせ提案
  const trendCombinations = [
    { trends: ['AI搭載', 'ゲーミフィケーション'], suggestion: 'AIが問題を自動生成し、ゲーム感覚で学べるアプリ' },
    { trends: ['ショート動画', 'クリエイターエコノミー'], suggestion: '短い動画で稼げるマイクロコンテンツプラットフォーム' },
    { trends: ['パーソナライズ', 'メンタルヘルス'], suggestion: '個人の状態に合わせたAIカウンセリングアプリ' },
    { trends: ['ハイパーカジュアルゲーム', 'AI搭載'], suggestion: 'AIが毎回違うステージを生成する無限パズルゲーム' },
    { trends: ['ノーコード/ローコード', 'マイクロSaaS'], suggestion: '5分で自分だけのWebツールを作れるビルダー' },
    { trends: ['コミュニティ型', 'ゲーミフィケーション'], suggestion: '学習コミュニティで競い合えるソーシャル学習アプリ' },
    { trends: ['フィンテック', 'ゲーミフィケーション'], suggestion: '貯金をゲーム化して楽しく資産を増やすアプリ' },
    { trends: ['ヘルスケア', 'AI搭載'], suggestion: 'AIが食事写真から栄養素を分析するヘルスアプリ' },
    { trends: ['サブスク管理', '自動化・時短'], suggestion: '不要なサブスクを自動で検出し解約を提案するアプリ' },
    { trends: ['クリエイターエコノミー', 'AI搭載'], suggestion: 'AIがコンテンツを分析して最適な投稿タイミングを提案' },
  ];

  /**
   * 指定カテゴリに関連するトレンドを取得
   */
  function getTrendsForCategories(categories) {
    return currentTrends
      .filter(t => t.categories.some(c => categories.includes(c)))
      .sort((a, b) => b.hotness - a.hotness);
  }

  /**
   * ランダムにトレンドの組み合わせを提案
   */
  function suggestCombinations(count = 3) {
    const shuffled = [...trendCombinations].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  /**
   * ヒットパターンを取得
   */
  function getHitPatterns() {
    return hitPatterns;
  }

  /**
   * トレンドベースのアイデア強化ヒントを生成
   */
  function getEnhancementHints(idea) {
    const relevantTrends = currentTrends
      .filter(t => t.categories.includes(idea.category))
      .sort((a, b) => b.hotness - a.hotness)
      .slice(0, 3);

    const relevantPatterns = hitPatterns
      .sort(() => Math.random() - 0.5)
      .slice(0, 2);

    return {
      trends: relevantTrends,
      patterns: relevantPatterns,
      suggestions: relevantTrends.map(t =>
        `「${t.keyword}」の要素を取り入れて、${t.examples[0]}のような体験を加える`
      ),
    };
  }

  return {
    currentTrends,
    hitPatterns,
    getTrendsForCategories,
    suggestCombinations,
    getHitPatterns,
    getEnhancementHints,
  };
})();
