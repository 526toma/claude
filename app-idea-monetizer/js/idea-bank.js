/**
 * Idea Bank - アイデア蓄積・進化システム
 * 過去のアイデアをlocalStorageに保存し、組み合わせて進化させる
 */
const IdeaBank = (() => {

  const STORAGE_KEY = 'idea_monetizer_bank';
  const MAX_HISTORY = 100; // 最大保存数

  /**
   * 保存されたアイデアバンクを読み込む
   */
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ideas: [], generations: 0, winners: [] };
      return JSON.parse(raw);
    } catch {
      return { ideas: [], generations: 0, winners: [] };
    }
  }

  /**
   * アイデアバンクを保存
   */
  function save(bank) {
    try {
      // 古いアイデアを削除して最大数を維持
      if (bank.ideas.length > MAX_HISTORY) {
        bank.ideas = bank.ideas.slice(-MAX_HISTORY);
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(bank));
    } catch {
      // localStorageが使えない場合は無視
    }
  }

  /**
   * 新しいアイデアをバンクに追加
   */
  function addIdeas(ideas) {
    const bank = load();
    bank.generations++;
    const timestamp = Date.now();
    ideas.forEach(idea => {
      bank.ideas.push({
        ...idea,
        generation: bank.generations,
        timestamp,
        wasWinner: false,
        evolvedFrom: idea.evolvedFrom || null,
        trendBasis: idea.trendBasis || null,
      });
    });
    save(bank);
    return bank;
  }

  /**
   * 勝者をマーク
   */
  function markWinner(ideaId) {
    const bank = load();
    const idea = bank.ideas.find(i => i.id === ideaId);
    if (idea) {
      idea.wasWinner = true;
      bank.winners.push({
        id: ideaId,
        name: idea.name,
        category: idea.category,
        type: idea.type,
        features: idea.features,
        timestamp: Date.now(),
      });
    }
    save(bank);
  }

  /**
   * 過去のアイデアから特徴を抽出
   */
  function extractInsights() {
    const bank = load();
    if (bank.ideas.length === 0) return null;

    // よく出現する特徴を集計
    const featureCount = {};
    const categoryCount = {};
    const typeCount = {};
    const winnerFeatures = {};

    bank.ideas.forEach(idea => {
      categoryCount[idea.category] = (categoryCount[idea.category] || 0) + 1;
      typeCount[idea.type] = (typeCount[idea.type] || 0) + 1;
      (idea.features || []).forEach(f => {
        featureCount[f] = (featureCount[f] || 0) + 1;
      });
    });

    // 勝者の特徴を特別にカウント
    bank.winners.forEach(w => {
      (w.features || []).forEach(f => {
        winnerFeatures[f] = (winnerFeatures[f] || 0) + 1;
      });
    });

    // 人気特徴をソート
    const popularFeatures = Object.entries(featureCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([feature, count]) => ({ feature, count }));

    // 勝利した特徴（成功パターン）
    const winningFeatures = Object.entries(winnerFeatures)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([feature, count]) => ({ feature, count }));

    return {
      totalIdeas: bank.ideas.length,
      totalGenerations: bank.generations,
      totalWinners: bank.winners.length,
      popularFeatures,
      winningFeatures,
      categoryDistribution: categoryCount,
      typeDistribution: typeCount,
      recentWinners: bank.winners.slice(-5),
    };
  }

  /**
   * 過去のアイデアを進化させる（組み合わせ・突然変異）
   */
  function evolveIdeas(categories, trends, count = 2) {
    const bank = load();
    if (bank.ideas.length < 3) return []; // 蓄積が少なければスキップ

    const evolved = [];
    const relevantIdeas = bank.ideas.filter(i => categories.includes(i.category));
    if (relevantIdeas.length < 2) return [];

    for (let i = 0; i < count && i < 10; i++) {
      const evolved_idea = createEvolution(relevantIdeas, trends, bank.winners);
      if (evolved_idea) evolved.push(evolved_idea);
    }

    return evolved;
  }

  /**
   * 2つのアイデアを交差させて新しいアイデアを生む
   */
  function createEvolution(ideas, trends, winners) {
    // 親を2つ選ぶ（勝者優先）
    const winnerIds = new Set(winners.map(w => w.id));
    const parents = selectParents(ideas, winnerIds);
    if (!parents) return null;

    const [parent1, parent2] = parents;

    // トレンドを1つ選ぶ
    const trend = trends.length > 0
      ? trends[Math.floor(Math.random() * trends.length)]
      : null;

    // 特徴を交差
    const allFeatures = [...new Set([...(parent1.features || []), ...(parent2.features || [])])];
    const mixedFeatures = allFeatures
      .sort(() => Math.random() - 0.5)
      .slice(0, 3 + Math.floor(Math.random() * 3));

    // トレンドベースの特徴を追加
    if (trend) {
      const trendFeature = trendToFeature(trend);
      if (trendFeature && !mixedFeatures.includes(trendFeature)) {
        mixedFeatures.push(trendFeature);
      }
    }

    // 名前を生成
    const evolutionPrefixes = ['ネオ', 'ウルトラ', 'ハイパー', 'メガ', 'スーパー', 'エクストリーム', 'アルティメット', 'プロ'];
    const prefix = evolutionPrefixes[Math.floor(Math.random() * evolutionPrefixes.length)];

    // typeはランダムに親のどちらかを継承
    const baseParent = Math.random() > 0.5 ? parent1 : parent2;
    const otherParent = baseParent === parent1 ? parent2 : parent1;

    return {
      id: 'evo_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6),
      name: prefix + baseParent.name.replace(/^(スーパー|メガ|ポケット|エンドレス|クレイジー|ネオ|ファンタジー|ピクセル|スマート|クイック|イージー|ウルトラ|ハイパー|エクストリーム|アルティメット|プロ)/, ''),
      category: baseParent.category,
      type: baseParent.type,
      description: `${baseParent.description}（${otherParent.name}の要素を融合）`,
      features: mixedFeatures,
      targetAudience: baseParent.targetAudience || otherParent.targetAudience,
      evolvedFrom: [parent1.id, parent2.id],
      trendBasis: trend ? trend.keyword : null,
      isEvolved: true,
    };
  }

  /**
   * 親アイデアを選択（勝者を優先）
   */
  function selectParents(ideas, winnerIds) {
    if (ideas.length < 2) return null;

    // 勝者があればそちらを優先
    const winnerPool = ideas.filter(i => winnerIds.has(i.id));
    const normalPool = ideas.filter(i => !winnerIds.has(i.id));

    let parent1, parent2;

    if (winnerPool.length > 0) {
      parent1 = winnerPool[Math.floor(Math.random() * winnerPool.length)];
      const otherPool = ideas.filter(i => i.id !== parent1.id);
      parent2 = otherPool[Math.floor(Math.random() * otherPool.length)];
    } else {
      const shuffled = [...ideas].sort(() => Math.random() - 0.5);
      parent1 = shuffled[0];
      parent2 = shuffled[1];
    }

    return [parent1, parent2];
  }

  /**
   * トレンドキーワードを具体的な特徴に変換
   */
  function trendToFeature(trend) {
    const trendFeatureMap = {
      'AI搭載': 'AI自動生成',
      'ショート動画': 'ショート動画対応',
      'ゲーミフィケーション': 'ゲーム要素付き',
      'ノーコード/ローコード': 'ノーコード対応',
      'メンタルヘルス': 'ウェルネス機能',
      'サブスク管理': 'サブスク連携',
      'ハイパーカジュアルゲーム': 'ワンタップ操作',
      'コミュニティ型': 'コミュニティ機能',
      'パーソナライズ': 'パーソナライズ機能',
      'フィンテック': 'お金の見える化',
      'Web3/ブロックチェーン': 'トークン経済',
      'AR/VR': 'AR機能',
      'クリエイターエコノミー': '収益化ツール',
      'マイクロSaaS': 'ニッチ特化機能',
      'ヘルスケア': 'ヘルスデータ連携',
    };
    return trendFeatureMap[trend.keyword] || null;
  }

  /**
   * バンクの統計情報を取得
   */
  function getStats() {
    const bank = load();
    return {
      totalIdeas: bank.ideas.length,
      generations: bank.generations,
      winners: bank.winners.length,
      hasHistory: bank.ideas.length > 0,
    };
  }

  /**
   * バンクをリセット
   */
  function reset() {
    localStorage.removeItem(STORAGE_KEY);
  }

  return {
    load,
    addIdeas,
    markWinner,
    extractInsights,
    evolveIdeas,
    getStats,
    reset,
  };
})();
