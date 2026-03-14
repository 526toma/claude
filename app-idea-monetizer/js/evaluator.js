/**
 * Idea Evaluator
 * 各アイデアを複数の軸でスコアリングし、ランキングする
 */
const Evaluator = (() => {
  // カテゴリ別の基礎スコア重み
  const categoryWeights = {
    game:          { market: 0.85, feasibility: 0.90, monetize: 0.80, viral: 0.85 },
    tool:          { market: 0.80, feasibility: 0.95, monetize: 0.75, viral: 0.60 },
    sns:           { market: 0.70, feasibility: 0.60, monetize: 0.65, viral: 0.95 },
    lifestyle:     { market: 0.75, feasibility: 0.85, monetize: 0.70, viral: 0.65 },
    education:     { market: 0.70, feasibility: 0.85, monetize: 0.65, viral: 0.55 },
    entertainment: { market: 0.80, feasibility: 0.90, monetize: 0.70, viral: 0.90 },
    business:      { market: 0.65, feasibility: 0.75, monetize: 0.85, viral: 0.40 },
  };

  // タイプ別ボーナス（特に収益化しやすいもの）
  const typeBonus = {
    clicker:     { market: 5, monetize: 10, viral: 5 },
    quiz:        { market: 5, viral: 10 },
    qr:          { market: 10, feasibility: 5 },
    pomodoro:    { market: 8, feasibility: 5 },
    fortune:     { viral: 15 },
    meme:        { viral: 15, market: 5 },
    roulette:    { viral: 10, feasibility: 5 },
    habit:       { market: 10, monetize: 5 },
    flashcard:   { market: 8, monetize: 5 },
    kanban:      { monetize: 10, market: 5 },
    password:    { market: 8, feasibility: 10 },
    compatibility: { viral: 15, market: 5 },
    nickname:    { viral: 12, feasibility: 8 },
    expense:     { market: 10, monetize: 8 },
    typing:      { market: 8, viral: 5 },
    memory:      { market: 5, viral: 5, feasibility: 5 },
    puzzle:      { market: 8, monetize: 8, viral: 5 },
    color:       { market: 5, feasibility: 8 },
    invoice:     { monetize: 12, market: 5 },
  };

  // フィーチャー数によるボーナス
  function featureBonus(count) {
    if (count >= 5) return 5;
    if (count >= 4) return 3;
    return 0;
  }

  // ランダムなばらつき（±range）
  function jitter(range) {
    return Math.floor(Math.random() * (range * 2 + 1)) - range;
  }

  /**
   * 単一のアイデアを評価
   * @returns {{ market, feasibility, monetize, viral, total }}
   */
  function evaluateIdea(idea) {
    const base = categoryWeights[idea.category] || categoryWeights.tool;
    const bonus = typeBonus[idea.type] || {};
    const featBonus = featureBonus(idea.features.length);

    const calc = (key) => {
      const raw = Math.round(base[key] * 100) + (bonus[key] || 0) + featBonus + jitter(5);
      return Math.max(10, Math.min(100, raw));
    };

    const market      = calc('market');
    const feasibility = calc('feasibility');
    const monetize    = calc('monetize');
    const viral       = calc('viral');

    // 重み付き合計（100点満点）
    const total = Math.round(
      market * 0.25 +
      feasibility * 0.20 +
      monetize * 0.30 +
      viral * 0.25
    );

    return { market, feasibility, monetize, viral, total };
  }

  /**
   * 複数アイデアを評価してランキング順に返す
   * @returns {Array<{ idea, scores }>} 総合スコア降順
   */
  function evaluateAndRank(ideas) {
    const results = ideas.map(idea => ({
      idea,
      scores: evaluateIdea(idea),
    }));

    results.sort((a, b) => b.scores.total - a.scores.total);
    return results;
  }

  return { evaluateIdea, evaluateAndRank };
})();
