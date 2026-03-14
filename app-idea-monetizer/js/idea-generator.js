/**
 * Idea Generator Engine
 * カテゴリ別テンプレートを組み合わせてユニークなアプリアイデアを生成
 */
const IdeaGenerator = (() => {
  // --- データベース ---

  const templates = {
    game: {
      prefixes: ['スーパー', 'メガ', 'ポケット', 'エンドレス', 'クレイジー', 'ネオ', 'ファンタジー', 'ピクセル'],
      cores: [
        { name: 'クリッカー', type: 'clicker', desc: 'タップするだけで楽しめるインクリメンタルゲーム' },
        { name: 'パズル', type: 'puzzle', desc: 'ブロックを組み合わせて消すパズルゲーム' },
        { name: 'クイズ', type: 'quiz', desc: '知識を試すクイズゲーム' },
        { name: 'メモリー', type: 'memory', desc: 'カードをめくって記憶力を鍛えるゲーム' },
        { name: 'リズム', type: 'rhythm', desc: '音に合わせてタイミングよくタップするゲーム' },
        { name: 'タワーディフェンス', type: 'tower', desc: '敵の侵攻を防ぐ戦略ゲーム' },
        { name: 'ワードハント', type: 'word', desc: '隠された言葉を見つける文字探しゲーム' },
        { name: 'スライダー', type: 'slider', desc: 'パネルをスライドして正しい配置にするゲーム' },
      ],
      suffixes: ['バトル', 'チャレンジ', 'アドベンチャー', 'マスター', 'キング', 'ラッシュ', 'ワールド', 'フィーバー'],
      features: ['ランキング機能', 'デイリーチャレンジ', 'アチーブメント', 'シェア機能', 'ダークモード', 'サウンド効果', 'レベルシステム', 'コイン収集'],
    },
    tool: {
      prefixes: ['スマート', 'クイック', 'イージー', 'ワンタッチ', 'プロ', 'シンプル', 'マルチ', 'インスタント'],
      cores: [
        { name: 'QRコードメーカー', type: 'qr', desc: 'テキストやURLからQRコードを即座に生成・ダウンロード' },
        { name: '画像リサイザー', type: 'image_resize', desc: 'ドラッグ&ドロップで画像をリサイズ・変換' },
        { name: 'カラーパレット', type: 'color', desc: '写真からカラーパレットを抽出、コードをコピー' },
        { name: 'テキスト変換ツール', type: 'text_convert', desc: 'テキストの変換（大文字小文字、半角全角、暗号化等）' },
        { name: 'パスワードジェネレーター', type: 'password', desc: '安全なパスワードを条件に合わせて生成' },
        { name: 'ポモドーロタイマー', type: 'pomodoro', desc: '集中と休憩を管理するタイマーアプリ' },
        { name: 'メモ帳', type: 'notepad', desc: 'マークダウン対応のシンプルなメモアプリ' },
        { name: 'JSON整形ツール', type: 'json', desc: 'JSONデータの整形・バリデーション・変換' },
      ],
      suffixes: [''],
      features: ['オフライン対応', 'データ保存', 'ダークモード', 'コピー機能', 'エクスポート', 'ドラッグ&ドロップ', 'キーボードショートカット', 'レスポンシブ'],
    },
    sns: {
      prefixes: ['マイ', 'みんなの', 'トレンド', 'バズ', 'デイリー', 'シェア'],
      cores: [
        { name: '一言日記', type: 'diary', desc: '140字以内で日々を記録するミニ日記SNS' },
        { name: 'フォトウォール', type: 'photo_wall', desc: '写真をタイル状に並べるビジュアルボード' },
        { name: '匿名質問箱', type: 'question', desc: '匿名で質問を送り合えるQ&Aプラットフォーム' },
        { name: 'ムードトラッカー', type: 'mood', desc: '毎日の気分を記録・共有するソーシャルアプリ' },
        { name: 'ブックシェルフ', type: 'bookshelf', desc: '読んだ本を共有しレビューするコミュニティ' },
        { name: 'スキルシェア', type: 'skill_share', desc: 'スキルを教え合うマッチングプラットフォーム' },
      ],
      suffixes: [''],
      features: ['プロフィール', 'フォロー機能', 'いいね', 'コメント', 'ハッシュタグ', 'シェア', '通知', 'タイムライン'],
    },
    lifestyle: {
      prefixes: ['デイリー', 'ライフ', 'ヘルシー', 'グッド', 'マイ', 'ハッピー'],
      cores: [
        { name: '習慣トラッカー', type: 'habit', desc: '毎日の習慣を追跡してストリークを記録' },
        { name: '家計簿', type: 'expense', desc: '収入と支出を簡単に記録・グラフ化' },
        { name: '食事ログ', type: 'meal_log', desc: '食事を写真で記録しカロリーを管理' },
        { name: 'ウォーターリマインダー', type: 'water', desc: '水分摂取を記録しリマインダーで通知' },
        { name: '断捨離リスト', type: 'declutter', desc: '持ち物を整理して断捨離を進めるアプリ' },
        { name: 'レシピブック', type: 'recipe', desc: 'お気に入りレシピを保存・検索・共有' },
      ],
      suffixes: [''],
      features: ['カレンダー', '統計グラフ', 'リマインダー', 'データエクスポート', 'ダークモード', 'カテゴリ分け', 'ウィジェット対応', '目標設定'],
    },
    education: {
      prefixes: ['学べる', 'わかる', 'はじめての', 'チャレンジ', 'ステップ', 'マスター'],
      cores: [
        { name: 'フラッシュカード', type: 'flashcard', desc: '暗記カードで効率的に学習する' },
        { name: 'タイピング練習', type: 'typing', desc: 'タイピングスピードと正確性を向上させる' },
        { name: '漢字クイズ', type: 'kanji', desc: '漢字の読み書きをクイズ形式で学ぶ' },
        { name: 'プログラミング入門', type: 'coding', desc: 'インタラクティブにコードの基礎を学ぶ' },
        { name: '暗算トレーニング', type: 'math', desc: '計算力を鍛えるドリル式トレーニング' },
        { name: '英単語チャレンジ', type: 'vocab', desc: 'レベル別に英単語を覚えるアプリ' },
      ],
      suffixes: [''],
      features: ['進捗追跡', 'レベルシステム', 'デイリー目標', 'ランキング', '復習機能', 'オフライン対応', '統計ダッシュボード', 'バッジ獲得'],
    },
    entertainment: {
      prefixes: ['ランダム', 'おもしろ', 'ミラクル', 'ファニー', 'マジカル', 'ドキドキ'],
      cores: [
        { name: '運勢占い', type: 'fortune', desc: '毎日の運勢を占い結果とアドバイスで表示' },
        { name: 'ミーム生成器', type: 'meme', desc: 'テンプレートからオリジナルミームを作成' },
        { name: 'あだ名メーカー', type: 'nickname', desc: '名前からユニークなあだ名を生成' },
        { name: '相性診断', type: 'compatibility', desc: '名前や誕生日から相性スコアを算出' },
        { name: 'サウンドボード', type: 'soundboard', desc: '面白い効果音をワンタップで再生' },
        { name: 'ルーレットメーカー', type: 'roulette', desc: 'カスタマイズ可能なルーレットで決断' },
      ],
      suffixes: [''],
      features: ['シェア機能', 'アニメーション', 'サウンド', '日替わりコンテンツ', 'カスタマイズ', '履歴保存', 'お気に入り', 'ランキング'],
    },
    business: {
      prefixes: ['ビジネス', 'ワーク', 'チーム', 'プロジェクト', 'タスク', 'スマート'],
      cores: [
        { name: 'カンバンボード', type: 'kanban', desc: 'タスクをカード形式で管理するプロジェクト管理' },
        { name: '請求書メーカー', type: 'invoice', desc: 'プロフェッショナルな請求書を即座に作成' },
        { name: '名刺リーダー', type: 'card_reader', desc: '名刺情報をデジタル化して管理' },
        { name: '議事録テンプレート', type: 'minutes', desc: '会議の議事録を構造化して記録' },
        { name: 'タイムトラッカー', type: 'time_track', desc: 'プロジェクトごとの作業時間を記録' },
        { name: 'KPIダッシュボード', type: 'kpi', desc: '重要指標をビジュアルに表示するダッシュボード' },
      ],
      suffixes: [''],
      features: ['データ保存', 'PDF出力', 'チーム共有', 'テンプレート', 'グラフ表示', 'フィルタ', '検索機能', 'カテゴリ管理'],
    },
  };

  const targetAudiences = {
    game: ['カジュアルゲーマー', '暇つぶしユーザー', '学生', 'パズル好き'],
    tool: ['ウェブ開発者', 'デザイナー', 'ビジネスパーソン', '一般ユーザー'],
    sns: ['10代〜20代', 'コミュニティ愛好家', 'クリエイター', '友達グループ'],
    lifestyle: ['健康志向の人', '自己管理したい人', '主婦・主夫', '社会人'],
    education: ['学生', '資格取得者', '子供', '生涯学習者'],
    entertainment: ['SNSユーザー', '友達グループ', '暇つぶしユーザー', 'パーティー参加者'],
    business: ['フリーランサー', 'スタートアップ', '中小企業', 'リモートワーカー'],
  };

  // --- ユーティリティ ---

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function pickN(arr, n) {
    const shuffled = [...arr].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(n, arr.length));
  }

  function generateId() {
    return 'idea_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);
  }

  // --- 生成ロジック ---

  function generateIdea(category) {
    const t = templates[category];
    if (!t) return null;

    const core = pick(t.cores);
    const prefix = pick(t.prefixes);
    const suffix = t.suffixes.length > 0 && t.suffixes[0] !== '' ? ' ' + pick(t.suffixes) : '';
    const name = prefix + core.name + suffix;
    const features = pickN(t.features, 3 + Math.floor(Math.random() * 3));
    const audience = pick(targetAudiences[category]);

    return {
      id: generateId(),
      name,
      category,
      type: core.type,
      description: core.desc,
      features,
      targetAudience: audience,
    };
  }

  function generateIdeas(categories, count = 5) {
    const ideas = [];
    const usedTypes = new Set();

    // 各カテゴリから最低1つ、残りはランダム
    const pool = [...categories];
    let attempts = 0;

    while (ideas.length < count && attempts < 100) {
      const cat = ideas.length < pool.length ? pool[ideas.length] : pick(categories);
      const idea = generateIdea(cat);
      attempts++;

      if (idea && !usedTypes.has(idea.type)) {
        usedTypes.add(idea.type);
        ideas.push(idea);
      }
    }

    return ideas;
  }

  // --- Public API ---
  return { generateIdeas, generateIdea };
})();
