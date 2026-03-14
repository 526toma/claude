/**
 * App Orchestrator
 * パイプライン全体の制御・UI更新・ZIPダウンロード
 */
(function () {
  'use strict';

  // --- State ---
  let state = {
    step: 0,
    ideas: [],
    ranked: [],
    winner: null,
    winnerCode: '',
    marketingKit: null,
    monetizePlan: null,
  };

  // --- DOM References ---
  const sections = {
    start: document.getElementById('section-start'),
    ideas: document.getElementById('section-ideas'),
    evaluation: document.getElementById('section-evaluation'),
    build: document.getElementById('section-build'),
    preview: document.getElementById('section-preview'),
    marketing: document.getElementById('section-marketing'),
    monetize: document.getElementById('section-monetize'),
    download: document.getElementById('section-download'),
  };

  const pipelineSteps = document.querySelectorAll('.pipeline__step');

  // --- Helpers ---

  function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  function showSection(name) {
    Object.values(sections).forEach(s => s.classList.remove('active'));
    if (sections[name]) sections[name].classList.add('active');
  }

  function updatePipeline(activeStep) {
    pipelineSteps.forEach(step => {
      const n = parseInt(step.dataset.step);
      step.classList.remove('active', 'completed');
      if (n < activeStep) step.classList.add('completed');
      if (n === activeStep) step.classList.add('active');
    });
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function formatNumber(n) {
    return n.toLocaleString('ja-JP');
  }

  // --- Pipeline Steps ---

  async function runPipeline() {
    const selectedCategories = getSelectedCategories();
    if (selectedCategories.length === 0) {
      alert('少なくとも1つのカテゴリを選択してください。');
      return;
    }

    document.getElementById('btn-start').disabled = true;

    // Step 1: アイデア生成
    await stepGenerateIdeas(selectedCategories);

    // Step 2: 評価
    await stepEvaluate();

    // Step 3: 自動開発
    await stepBuild();

    // Step 4: プレビュー
    await stepPreview();

    // Step 5: マーケティング
    await stepMarketing();

    // Step 6: マネタイズ
    await stepMonetize();

    // 完了: ダウンロード
    await stepComplete();
  }

  function getSelectedCategories() {
    const checkboxes = document.querySelectorAll('input[name="category"]:checked');
    return Array.from(checkboxes).map(cb => cb.value);
  }

  // --- Step 1: アイデア生成 ---
  async function stepGenerateIdeas(categories) {
    updatePipeline(1);
    showSection('ideas');
    await sleep(400);

    state.ideas = IdeaGenerator.generateIdeas(categories, 5);

    const grid = document.getElementById('ideas-grid');
    grid.innerHTML = '';

    state.ideas.forEach(idea => {
      const card = document.createElement('div');
      card.className = 'idea-card';
      card.innerHTML = `
        <span class="idea-card__category idea-card__category--${idea.category}">${getCategoryLabel(idea.category)}</span>
        <h3 class="idea-card__name">${escapeHtml(idea.name)}</h3>
        <p class="idea-card__desc">${escapeHtml(idea.description)}</p>
        <p style="font-size:0.8rem;color:var(--text-muted);margin-bottom:8px">&#127919; ${escapeHtml(idea.targetAudience)}</p>
        <ul class="idea-card__features">
          ${idea.features.map(f => `<li class="idea-card__feature">${escapeHtml(f)}</li>`).join('')}
        </ul>
      `;
      grid.appendChild(card);
    });

    await sleep(1500);
  }

  // --- Step 2: 評価 ---
  async function stepEvaluate() {
    updatePipeline(2);
    showSection('evaluation');
    await sleep(400);

    state.ranked = Evaluator.evaluateAndRank(state.ideas);
    state.winner = state.ranked[0];

    const list = document.getElementById('evaluation-list');
    list.innerHTML = '';

    state.ranked.forEach((item, index) => {
      const card = document.createElement('div');
      card.className = 'eval-card' + (index === 0 ? ' eval-card--winner' : '');
      card.innerHTML = `
        <div class="eval-card__rank">${index + 1}</div>
        <div class="eval-card__info">
          <div class="eval-card__name">${escapeHtml(item.idea.name)}</div>
          <div class="eval-card__bars">
            <div class="eval-bar">
              <div class="eval-bar__label"><span>市場性</span><span>${item.scores.market}</span></div>
              <div class="eval-bar__track"><div class="eval-bar__fill eval-bar__fill--market" data-width="${item.scores.market}"></div></div>
            </div>
            <div class="eval-bar">
              <div class="eval-bar__label"><span>実現性</span><span>${item.scores.feasibility}</span></div>
              <div class="eval-bar__track"><div class="eval-bar__fill eval-bar__fill--feasibility" data-width="${item.scores.feasibility}"></div></div>
            </div>
            <div class="eval-bar">
              <div class="eval-bar__label"><span>収益性</span><span>${item.scores.monetize}</span></div>
              <div class="eval-bar__track"><div class="eval-bar__fill eval-bar__fill--monetize" data-width="${item.scores.monetize}"></div></div>
            </div>
            <div class="eval-bar">
              <div class="eval-bar__label"><span>拡散力</span><span>${item.scores.viral}</span></div>
              <div class="eval-bar__track"><div class="eval-bar__fill eval-bar__fill--viral" data-width="${item.scores.viral}"></div></div>
            </div>
          </div>
        </div>
        <div class="eval-card__total">
          <div class="eval-card__score">${item.scores.total}</div>
          <div class="eval-card__score-label">総合スコア</div>
        </div>
      `;
      list.appendChild(card);
    });

    // バーのアニメーション
    await sleep(200);
    document.querySelectorAll('.eval-bar__fill').forEach(fill => {
      fill.style.width = fill.dataset.width + '%';
    });

    // 勝者発表
    const winner = document.getElementById('winner-announce');
    winner.innerHTML = `&#127942; 第1位: <strong>${escapeHtml(state.winner.idea.name)}</strong> (スコア: ${state.winner.scores.total}) - この案で開発を進めます！`;

    await sleep(2500);
  }

  // --- Step 3: 自動開発 ---
  async function stepBuild() {
    updatePipeline(3);
    showSection('build');
    await sleep(400);

    const fill = document.getElementById('build-fill');
    const status = document.getElementById('build-status');
    const codeOutput = document.getElementById('code-output');

    const buildSteps = [
      { progress: 10, text: 'プロジェクト構造を作成中...' },
      { progress: 25, text: 'HTMLテンプレートを選定中...' },
      { progress: 40, text: 'UIコンポーネントを構築中...' },
      { progress: 55, text: 'インタラクションを実装中...' },
      { progress: 70, text: 'スタイリングを適用中...' },
      { progress: 85, text: '広告スペースを配置中...' },
      { progress: 95, text: 'コードを最適化中...' },
      { progress: 100, text: '完了！' },
    ];

    // コード生成
    state.winnerCode = Builder.buildApp(state.winner.idea);

    // プログレスアニメーション
    for (const step of buildSteps) {
      fill.style.width = step.progress + '%';
      status.textContent = step.text;

      // コードを段階的に表示
      const displayLength = Math.floor(state.winnerCode.length * (step.progress / 100));
      codeOutput.textContent = state.winnerCode.substring(0, displayLength);

      await sleep(400);
    }

    codeOutput.textContent = state.winnerCode;
    document.getElementById('code-filename').textContent = 'index.html - ' + state.winner.idea.name;

    await sleep(1000);
  }

  // --- Step 4: プレビュー ---
  async function stepPreview() {
    updatePipeline(4);
    showSection('preview');
    await sleep(400);

    const iframe = document.getElementById('preview-iframe');
    const blob = new Blob([state.winnerCode], { type: 'text/html' });
    iframe.src = URL.createObjectURL(blob);

    const appUrl = state.winner.idea.name.replace(/\s+/g, '-').toLowerCase();
    document.getElementById('preview-url').textContent = 'https://' + appUrl + '.app';

    await sleep(3000);
  }

  // --- Step 5: マーケティング ---
  async function stepMarketing() {
    updatePipeline(5);
    showSection('marketing');
    await sleep(400);

    state.marketingKit = Marketing.generateKit(state.winner.idea);
    const kit = state.marketingKit;

    const grid = document.getElementById('marketing-grid');
    grid.innerHTML = '';

    const cards = [
      {
        icon: '&#128172;',
        title: 'キャッチコピー',
        body: `<div class="marketing-card__copy">${escapeHtml(kit.tagline)}</div>`,
      },
      {
        icon: '&#128038;',
        title: 'X (Twitter) 投稿文',
        body: `<div class="marketing-card__copy"><button class="marketing-card__copy-btn" onclick="copyText(this)">コピー</button>${escapeHtml(kit.twitter)}</div>`,
      },
      {
        icon: '&#128247;',
        title: 'Instagram 投稿文',
        body: `<div class="marketing-card__copy"><button class="marketing-card__copy-btn" onclick="copyText(this)">コピー</button>${escapeHtml(kit.instagram)}</div>`,
      },
      {
        icon: '&#128240;',
        title: 'プレスリリース',
        body: `<div class="marketing-card__copy" style="max-height:200px;overflow-y:auto"><button class="marketing-card__copy-btn" onclick="copyText(this)">コピー</button>${escapeHtml(kit.press)}</div>`,
      },
      {
        icon: '&#127991;',
        title: 'ハッシュタグ',
        body: `<div class="marketing-card__tags">${kit.hashTags.map(t => `<span class="marketing-card__tag">#${escapeHtml(t)}</span>`).join('')}</div>`,
      },
      {
        icon: '&#128270;',
        title: 'SEOキーワード',
        body: `<div class="marketing-card__tags">${kit.seoKeywords.map(k => `<span class="marketing-card__tag">${escapeHtml(k)}</span>`).join('')}</div>`,
      },
    ];

    cards.forEach(c => {
      const card = document.createElement('div');
      card.className = 'marketing-card';
      card.innerHTML = `
        <div class="marketing-card__header">
          <span class="marketing-card__icon">${c.icon}</span>
          ${c.title}
        </div>
        <div class="marketing-card__body">${c.body}</div>
      `;
      grid.appendChild(card);
    });

    await sleep(2000);
  }

  // --- Step 6: マネタイズ ---
  async function stepMonetize() {
    updatePipeline(6);
    showSection('monetize');
    await sleep(400);

    state.monetizePlan = Monetization.generatePlan(state.winner.idea);
    const plan = state.monetizePlan;

    const content = document.getElementById('monetize-content');
    content.innerHTML = '';

    plan.strategies.forEach(strategy => {
      const card = document.createElement('div');
      card.className = 'monetize-card';
      card.innerHTML = `
        <div class="monetize-card__header">
          <span class="monetize-card__icon">${strategy.icon}</span>
          <span class="monetize-card__title">${strategy.name}</span>
          ${strategy.recommended ? '<span class="monetize-card__badge monetize-card__badge--recommended">推奨</span>' : ''}
        </div>
        <div class="monetize-card__body">${strategy.description}</div>
        <ul class="monetize-card__list">
          ${strategy.steps.map(s => `<li>${escapeHtml(s)}</li>`).join('')}
        </ul>
        <div class="monetize-card__revenue">
          <div class="monetize-card__revenue-amount">
            ${formatNumber(strategy.revenueEstimate.min)} 〜 ${formatNumber(strategy.revenueEstimate.max)} ${strategy.revenueEstimate.unit}
          </div>
          <div class="monetize-card__revenue-label">${strategy.revenueEstimate.basis}</div>
        </div>
      `;
      content.appendChild(card);
    });

    // ロードマップカード
    const roadmapCard = document.createElement('div');
    roadmapCard.className = 'monetize-card';
    roadmapCard.style.gridColumn = '1 / -1';
    roadmapCard.innerHTML = `
      <div class="monetize-card__header">
        <span class="monetize-card__icon">&#128197;</span>
        <span class="monetize-card__title">実行ロードマップ</span>
      </div>
      <div class="monetize-card__body">
        ${plan.roadmap.map(phase => `
          <div style="margin-bottom:16px">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
              <span class="badge" style="background:rgba(108,92,231,0.15);color:var(--accent-light);padding:2px 10px;border-radius:99px;font-size:0.75rem">${phase.phase}</span>
              <strong>${escapeHtml(phase.title)}</strong>
            </div>
            <ul style="list-style:none;padding-left:16px">
              ${phase.tasks.map(t => `<li style="color:var(--text-secondary);font-size:0.85rem;padding:2px 0">&#8226; ${escapeHtml(t)}</li>`).join('')}
            </ul>
          </div>
        `).join('')}
      </div>
      <div class="monetize-card__revenue">
        <div class="monetize-card__revenue-label">合計推定月間収益</div>
        <div class="monetize-card__revenue-amount">
          ${formatNumber(plan.combinedRevenue.min)} 〜 ${formatNumber(plan.combinedRevenue.max)} ${plan.combinedRevenue.unit}
        </div>
      </div>
    `;
    content.appendChild(roadmapCard);

    await sleep(2000);
  }

  // --- Complete ---
  async function stepComplete() {
    showSection('download');
    // 全ステップ完了
    pipelineSteps.forEach(step => {
      step.classList.remove('active');
      step.classList.add('completed');
    });
  }

  // --- ZIP Download ---
  async function downloadZip() {
    if (typeof JSZip === 'undefined') {
      alert('ZIPライブラリの読み込みに失敗しました。ページをリロードしてください。');
      return;
    }

    const zip = new JSZip();
    const folder = zip.folder(state.winner.idea.name.replace(/\s+/g, '_'));

    // アプリコード
    folder.file('index.html', state.winnerCode);

    // マーケティングキット
    const kit = state.marketingKit;
    const marketingText = [
      '=== マーケティングキット ===',
      '',
      '【キャッチコピー】',
      kit.tagline,
      '',
      '【X (Twitter) 投稿文】',
      kit.twitter,
      '',
      '【Instagram 投稿文】',
      kit.instagram,
      '',
      '【プレスリリース】',
      kit.press,
      '',
      '【ハッシュタグ】',
      kit.hashTags.map(t => '#' + t).join(' '),
      '',
      '【SEOキーワード】',
      kit.seoKeywords.join(', '),
    ].join('\n');
    folder.file('marketing-kit.txt', marketingText);

    // マネタイズプラン
    const plan = state.monetizePlan;
    const monetizeText = [
      '=== マネタイズプラン ===',
      '',
      ...plan.strategies.map(s => [
        `【${s.name}】${s.recommended ? ' ★推奨' : ''}`,
        s.description,
        '',
        'ステップ:',
        ...s.steps.map((step, i) => `  ${i + 1}. ${step}`),
        '',
        `推定収益: ${formatNumber(s.revenueEstimate.min)} 〜 ${formatNumber(s.revenueEstimate.max)} ${s.revenueEstimate.unit}`,
        '',
      ]).flat(),
      '【ロードマップ】',
      ...plan.roadmap.map(p => [
        `${p.phase} - ${p.title}`,
        ...p.tasks.map(t => `  - ${t}`),
        '',
      ]).flat(),
      `合計推定月間収益: ${formatNumber(plan.combinedRevenue.min)} 〜 ${formatNumber(plan.combinedRevenue.max)} ${plan.combinedRevenue.unit}`,
    ].join('\n');
    folder.file('monetize-plan.txt', monetizeText);

    // 広告コード
    folder.file('ad-code-sample.html', plan.adCode);

    // README
    const readme = [
      `# ${state.winner.idea.name}`,
      '',
      state.winner.idea.description,
      '',
      `ターゲット: ${state.winner.idea.targetAudience}`,
      `カテゴリ: ${getCategoryLabel(state.winner.idea.category)}`,
      '',
      '## 機能',
      ...state.winner.idea.features.map(f => `- ${f}`),
      '',
      '## 使い方',
      '1. index.html をブラウザで開く',
      '2. またはWebサーバーにデプロイする',
      '',
      '## マネタイズ',
      `推奨モデル: ${plan.strategies[0].name}`,
      `推定月間収益: ${formatNumber(plan.combinedRevenue.min)} 〜 ${formatNumber(plan.combinedRevenue.max)} ${plan.combinedRevenue.unit}`,
      '',
      '詳細は monetize-plan.txt を参照。',
      '',
      '---',
      'Generated by Idea Monetizer',
    ].join('\n');
    folder.file('README.md', readme);

    // 生成 & ダウンロード
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = state.winner.idea.name.replace(/\s+/g, '_') + '.zip';
    a.click();
    URL.revokeObjectURL(url);
  }

  // --- Restart ---
  function restart() {
    state = {
      step: 0,
      ideas: [],
      ranked: [],
      winner: null,
      winnerCode: '',
      marketingKit: null,
      monetizePlan: null,
    };
    pipelineSteps.forEach(s => s.classList.remove('active', 'completed'));
    document.getElementById('btn-start').disabled = false;
    showSection('start');
  }

  // --- Utility ---
  function getCategoryLabel(cat) {
    const labels = {
      game: 'ゲーム',
      tool: 'ツール',
      sns: 'SNS',
      lifestyle: 'ライフスタイル',
      education: '教育',
      entertainment: 'エンタメ',
      business: 'ビジネス',
    };
    return labels[cat] || cat;
  }

  // --- Global copy function (used in marketing cards) ---
  window.copyText = function (btn) {
    const copyEl = btn.parentElement;
    const text = copyEl.textContent.replace('コピー', '').trim();
    navigator.clipboard.writeText(text).then(() => {
      const originalText = btn.textContent;
      btn.textContent = 'コピー済!';
      setTimeout(() => { btn.textContent = originalText; }, 1500);
    });
  };

  // --- Event Listeners ---
  document.getElementById('btn-start').addEventListener('click', runPipeline);
  document.getElementById('btn-download').addEventListener('click', downloadZip);
  document.getElementById('btn-restart').addEventListener('click', restart);

})();
