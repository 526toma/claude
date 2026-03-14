/**
 * Monetization Plan Generator
 * アイデアに基づいてマネタイズ戦略を自動設計
 */
const Monetization = (() => {

  const strategies = {
    ads: {
      name: '広告収入モデル',
      icon: '&#128230;',
      description: 'バナー広告やインタースティシャル広告を表示して収益を得るモデル。ユーザーは無料で利用でき、アクセス数に比例して収益が増加します。',
      steps: [
        'Google AdSenseに登録し、広告コードを取得',
        'アプリのヘッダー・フッターにバナー広告を配置',
        '機能切り替え時にインタースティシャル広告を挿入',
        'ユーザー体験を損なわない頻度に調整',
        'A/Bテストで最適な配置を検証',
      ],
      revenueEstimate: { min: 500, max: 5000, unit: '円/月', basis: '1000 DAU想定' },
      fit: { game: 9, tool: 6, sns: 7, lifestyle: 6, education: 5, entertainment: 9, business: 3 },
    },
    freemium: {
      name: 'フリーミアムモデル',
      icon: '&#11088;',
      description: '基本機能は無料で提供し、高度な機能やプレミアムコンテンツを有料で販売するモデル。',
      steps: [
        '基本機能と有料機能を明確に分ける',
        '無料版でも十分価値のある体験を提供',
        'プレミアム機能のアップグレード導線を設計',
        'Stripe/PAY.JPなどの決済を統合',
        '月額プラン: ¥300/月、年額プラン: ¥2,980/年 を設定',
      ],
      revenueEstimate: { min: 3000, max: 30000, unit: '円/月', basis: '変換率3%想定' },
      fit: { game: 7, tool: 9, sns: 6, lifestyle: 8, education: 8, entertainment: 5, business: 9 },
    },
    donation: {
      name: '投げ銭・サポートモデル',
      icon: '&#9749;',
      description: 'Buy Me a CoffeeやPatreonのような投げ銭サービスを通じて、ユーザーの善意で収益を得るモデル。',
      steps: [
        'Buy Me a Coffee / KO-FIのアカウントを作成',
        'アプリ内にサポートボタンを設置',
        '定期的にアップデートして支持者に還元',
        'サポーター限定の機能やコンテンツを用意',
        'SNSでの活動で支持者コミュニティを拡大',
      ],
      revenueEstimate: { min: 100, max: 10000, unit: '円/月', basis: 'サポーター数次第' },
      fit: { game: 5, tool: 8, sns: 4, lifestyle: 6, education: 7, entertainment: 6, business: 4 },
    },
    affiliate: {
      name: 'アフィリエイトモデル',
      icon: '&#128279;',
      description: '関連商品やサービスのアフィリエイトリンクを設置して、成約に応じた報酬を得るモデル。',
      steps: [
        'Amazonアソシエイトなどのプログラムに登録',
        'アプリの文脈に合った商品を厳選',
        '自然な形でレコメンドリンクを配置',
        '効果測定してコンバージョンを最適化',
        '季節やトレンドに合わせて商品を更新',
      ],
      revenueEstimate: { min: 500, max: 15000, unit: '円/月', basis: 'クリック率1%想定' },
      fit: { game: 3, tool: 5, sns: 4, lifestyle: 9, education: 7, entertainment: 4, business: 6 },
    },
    data: {
      name: 'データ収益化モデル',
      icon: '&#128202;',
      description: '匿名化された利用データやトレンドレポートを企業向けに提供するモデル（個人情報は含まない）。',
      steps: [
        'プライバシーポリシーを明記',
        '匿名化されたアクセスデータを集計',
        'トレンドレポートを作成',
        '企業・メディア向けにデータを提供',
        'データの信頼性と透明性を維持',
      ],
      revenueEstimate: { min: 0, max: 50000, unit: '円/月', basis: '大規模トラフィック必要' },
      fit: { game: 4, tool: 3, sns: 8, lifestyle: 7, education: 5, entertainment: 6, business: 7 },
    },
    licensing: {
      name: 'ライセンス・ホワイトラベルモデル',
      icon: '&#128188;',
      description: 'アプリの技術やデザインをライセンスとして他企業に販売。ブランドをカスタマイズして提供するモデル。',
      steps: [
        'アプリをカスタマイズ可能な形に設計',
        'ホワイトラベル版のテンプレートを用意',
        'ライセンス契約書を準備',
        '企業向けのカスタマイズオプションを設定',
        '¥50,000〜/案件のライセンス料を設定',
      ],
      revenueEstimate: { min: 0, max: 100000, unit: '円/案件', basis: 'B2B案件ベース' },
      fit: { game: 2, tool: 7, sns: 3, lifestyle: 4, education: 6, entertainment: 2, business: 9 },
    },
  };

  /**
   * アイデアに最適なマネタイズプランを生成
   */
  function generatePlan(idea) {
    const category = idea.category;

    // 全戦略のフィットスコアを計算してソート
    const ranked = Object.entries(strategies)
      .map(([key, strategy]) => ({
        key,
        ...strategy,
        fitScore: strategy.fit[category] || 5,
      }))
      .sort((a, b) => b.fitScore - a.fitScore);

    // 上位3つを返す
    const topStrategies = ranked.slice(0, 3);

    // 推定月間収益の合計
    const combinedMin = topStrategies.reduce((sum, s) => sum + s.revenueEstimate.min, 0);
    const combinedMax = topStrategies.reduce((sum, s) => sum + s.revenueEstimate.max, 0);

    return {
      strategies: topStrategies.map((s, i) => ({
        ...s,
        recommended: i === 0,
        rank: i + 1,
      })),
      combinedRevenue: {
        min: combinedMin,
        max: combinedMax,
        unit: '円/月',
      },
      roadmap: generateRoadmap(idea, topStrategies[0]),
      adCode: generateAdPlaceholder(idea),
    };
  }

  function generateRoadmap(idea, primary) {
    return [
      { phase: 'Week 1-2', title: 'ローンチ準備', tasks: ['アプリの最終テスト', 'ランディングページ作成', 'SNSアカウント開設'] },
      { phase: 'Week 3-4', title: '初期ユーザー獲得', tasks: ['SNSでの告知開始', 'Product Huntに掲載', 'テックブログに投稿'] },
      { phase: 'Month 2', title: primary.name + '導入', tasks: primary.steps.slice(0, 3) },
      { phase: 'Month 3', title: 'グロース', tasks: ['ユーザーフィードバック収集', '機能改善', 'SEO最適化'] },
      { phase: 'Month 4+', title: 'スケール', tasks: ['追加マネタイズの導入', 'マーケティング拡大', 'パートナーシップ構築'] },
    ];
  }

  function generateAdPlaceholder(idea) {
    return `<!-- Google AdSense -->
<ins class="adsbygoogle"
  style="display:block"
  data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
  data-ad-slot="XXXXXXXXXX"
  data-ad-format="auto"
  data-full-width-responsive="true"></ins>
<script>(adsbygoogle = window.adsbygoogle || []).push({});</script>`;
  }

  return { generatePlan };
})();
