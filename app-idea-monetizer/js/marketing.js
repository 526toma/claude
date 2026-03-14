/**
 * Marketing Kit Generator
 * アイデアに基づいて宣伝素材を自動生成
 */
const Marketing = (() => {

  // --- テンプレートデータ ---

  const taglines = {
    game: [
      '暇つぶしの新定番、ここに誕生。',
      '一度始めたら止まらない。',
      'あなたの記録、世界に挑め。',
      '指先ひとつで始まるアドベンチャー。',
    ],
    tool: [
      'もう面倒な作業とはサヨナラ。',
      'プロの仕事を、ワンクリックで。',
      'シンプルだから、すぐ使える。',
      '作業効率が劇的に変わる。',
    ],
    sns: [
      'つながる、シェアする、楽しむ。',
      'あなたの声が、世界を動かす。',
      'いつでもどこでも、みんなと一緒。',
      '新しいコミュニティが、ここに。',
    ],
    lifestyle: [
      '毎日をもっと豊かに。',
      '習慣が変われば、人生が変わる。',
      'あなたの生活をスマートにアップグレード。',
      '今日から始める、新しい自分。',
    ],
    education: [
      '学びを、もっと楽しく。',
      '知識は最高の投資。',
      '遊びながら身につく、本物の力。',
      'いつでもどこでも、自分のペースで。',
    ],
    entertainment: [
      '笑いと驚きをあなたに。',
      '退屈な時間を最高の時間に。',
      '友達と一緒にもっと楽しく。',
      '毎日のちょっとした楽しみに。',
    ],
    business: [
      'ビジネスをもっとスマートに。',
      'チームの生産性を最大化。',
      'プロフェッショナルのためのツール。',
      '仕事のやり方が変わる。',
    ],
  };

  const twitterTemplates = [
    '🚀 新サービス「{name}」をリリースしました！\n\n{desc}\n\n✅ 完全無料\n✅ 登録不要\n✅ すぐ使える\n\n{tags}\n\n試してみてください👇\n{url}',
    '💡 {desc}\n\nそんな{audience}のために「{name}」を作りました！\n\n{features}\n\n{tags}',
    '🎉 {name} がついに公開！\n\n{tagline}\n\n特徴：\n{features}\n\n無料で使えます → {url}\n\n{tags}',
  ];

  const instagramTemplates = [
    '✨ {name} ✨\n\n{tagline}\n\n{desc}\n\n【主な機能】\n{features}\n\n📱 プロフィールのリンクからアクセス\n\n{tags}',
  ];

  const pressTemplates = [
    '【プレスリリース】\n\n{name} - {tagline}\n\n■ 概要\n{desc}\n{audience}向けの新しいWebアプリケーション「{name}」を本日リリースいたしました。\n\n■ 主な機能\n{featuresList}\n\n■ 特徴\n・完全無料で利用可能\n・アカウント登録不要\n・スマートフォン・PC対応\n・オフライン対応\n\n■ 利用方法\nWebブラウザから以下のURLにアクセスするだけでご利用いただけます。\n{url}\n\n■ 今後の展開\nユーザーのフィードバックを基に、継続的な機能改善を予定しています。',
  ];

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  /**
   * マーケティングキットを生成
   */
  function generateKit(idea) {
    const tagline = pick(taglines[idea.category] || taglines.tool);
    const url = 'https://' + idea.name.replace(/\s+/g, '-').toLowerCase() + '.app';

    const hashTags = generateHashTags(idea);
    const featuresText = idea.features.map(f => '✅ ' + f).join('\n');
    const featuresList = idea.features.map(f => '・' + f).join('\n');

    const vars = {
      name: idea.name,
      desc: idea.description,
      tagline,
      audience: idea.targetAudience,
      url,
      tags: hashTags.map(t => '#' + t).join(' '),
      features: featuresText,
      featuresList,
    };

    const fillTemplate = (tpl) => {
      return tpl.replace(/\{(\w+)\}/g, (_, key) => vars[key] || '');
    };

    return {
      tagline,
      appName: idea.name,

      twitter: fillTemplate(pick(twitterTemplates)),
      instagram: fillTemplate(pick(instagramTemplates)),
      press: fillTemplate(pick(pressTemplates)),

      hashTags,

      seoKeywords: generateSEOKeywords(idea),

      ogp: {
        title: idea.name + ' - ' + tagline,
        description: idea.description,
        url,
      },
    };
  }

  function generateHashTags(idea) {
    const base = ['Webアプリ', '無料', '新サービス'];
    const categoryTags = {
      game: ['ゲーム', 'ブラウザゲーム', 'カジュアルゲーム', 'インディーゲーム'],
      tool: ['便利ツール', 'Webツール', '効率化', 'プロダクティビティ'],
      sns: ['SNS', 'コミュニティ', 'ソーシャル', 'つながり'],
      lifestyle: ['ライフスタイル', '自己管理', '生活改善', 'ヘルスケア'],
      education: ['学習アプリ', '教育', 'EdTech', '勉強'],
      entertainment: ['エンタメ', '暇つぶし', '面白い', 'ネタ'],
      business: ['ビジネスツール', 'SaaS', '生産性向上', 'リモートワーク'],
    };
    return [...base, ...(categoryTags[idea.category] || []).slice(0, 3)];
  }

  function generateSEOKeywords(idea) {
    const base = [idea.name, '無料', 'Webアプリ', 'ブラウザ'];
    const categoryKW = {
      game: ['ゲーム', 'オンラインゲーム', '無料ゲーム', '暇つぶし'],
      tool: ['ツール', 'オンラインツール', '無料ツール', '便利'],
      sns: ['SNS', 'ソーシャル', 'コミュニティ'],
      lifestyle: ['ライフスタイル', '習慣', '健康'],
      education: ['学習', '勉強', '教育アプリ'],
      entertainment: ['エンタメ', '面白い', '診断'],
      business: ['ビジネス', '業務効率化', '管理ツール'],
    };
    return [...base, ...(categoryKW[idea.category] || [])];
  }

  return { generateKit };
})();
