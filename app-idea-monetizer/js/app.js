/**
 * App Orchestrator
 * パイプライン全体の制御・UI更新・ZIPダウンロード
 * トレンド分析 + アイデア蓄積 + AI連携対応
 */
(function () {
  'use strict';

  // --- State ---
  let state = {
    step: 0,
    maxStep: 0,
    ideas: [],
    ranked: [],
    winner: null,
    winnerCode: '',
    marketingKit: null,
    monetizePlan: null,
    running: false,
    trends: [],
  };

  // ステップとセクションの対応
  const stepSections = {
    0: 'trends',
    1: 'ideas',
    2: 'evaluation',
    3: 'build',
    4: 'preview',
    5: 'marketing',
    6: 'monetize',
  };

  const stepTitles = {
    0: 'Step 0: トレンド分析中...',
    1: 'Step 1: アイデアを生成中...',
    2: 'Step 2: 評価・ランキング中...',
    3: 'Step 3: コードを自動生成中...',
    4: 'Step 4: アプリをプレビュー中...',
    5: 'Step 5: 宣伝素材を作成中...',
    6: 'Step 6: マネタイズ設計中...',
  };

  const stepDoneTitles = {
    0: 'Step 0: トレンド分析 完了',
    1: 'Step 1: アイデア生成 完了',
    2: 'Step 2: 評価・選定 完了',
    3: 'Step 3: 自動開発 完了',
    4: 'Step 4: プレビュー 完了',
    5: 'Step 5: 宣伝キット 完了',
    6: 'Step 6: マネタイズ 完了',
  };

  // --- DOM References ---
  const sections = {
    start: document.getElementById('section-start'),
    trends: document.getElementById('section-trends'),
    ideas: document.getElementById('section-ideas'),
    evaluation: document.getElementById('section-evaluation'),
    build: document.getElementById('section-build'),
    preview: document.getElementById('section-preview'),
    marketing: document.getElementById('section-marketing'),
    monetize: document.getElementById('section-monetize'),
    download: document.getElementById('section-download'),
  };

  const pipelineSteps = document.querySelectorAll('.pipeline__step');
  const pipelineCurrentEl = document.getElementById('pipeline-current');

  // --- Helpers ---

  function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  function showSection(name) {
    Object.values(sections).forEach(s => { if (s) s.classList.remove('active'); });
    if (sections[name]) sections[name].classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function updatePipelineTitle(text) {
    if (pipelineCurrentEl) pipelineCurrentEl.textContent = text;
  }

  function updatePipeline(activeStep) {
    state.step = activeStep;
    if (activeStep > state.maxStep) state.maxStep = activeStep;
    pipelineSteps.forEach(step => {
      const n = parseInt(step.dataset.step);
      step.classList.remove('active', 'completed', 'viewing');
      if (n < activeStep) step.classList.add('completed');
      if (n === activeStep) step.classList.add('active');
    });
    updatePipelineTitle(stepTitles[activeStep] || '');
  }

  function markStepDone(stepNum) {
    pipelineSteps.forEach(step => {
      const n = parseInt(step.dataset.step);
      if (n === stepNum) {
        step.classList.remove('active');
        step.classList.add('completed');
      }
    });
  }

  function navigateToStep(stepNum) {
    if (state.running) return;
    const sectionName = stepSections[stepNum];
    if (!sectionName) return;
    showSection(sectionName);
    pipelineSteps.forEach(step => {
      step.classList.remove('viewing');
      const n = parseInt(step.dataset.step);
      if (n === stepNum) step.classList.add('viewing');
    });
    updatePipelineTitle(stepDoneTitles[stepNum]);
  }

  // クリックイベント: 完了済みステップに戻る
  pipelineSteps.forEach(step => {
    step.addEventListener('click', () => {
      if (step.classList.contains('completed')) {
        navigateToStep(parseInt(step.dataset.step));
      }
    });
  });

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function formatNumber(n) {
    return n.toLocaleString('ja-JP');
  }

  // --- AI Settings Modal ---
  function initSettingsModal() {
    const modal = document.getElementById('ai-settings-modal');
    const btnOpen = document.getElementById('btn-settings');
    const btnClose = document.getElementById('btn-close-settings');
    const overlay = modal.querySelector('.modal__overlay');
    const aiEnabled = document.getElementById('ai-enabled');
    const apiKeyInput = document.getElementById('ai-api-key');
    const modelSelect = document.getElementById('ai-model');
    const statusText = document.getElementById('ai-status-text');
    const btnTest = document.getElementById('btn-test-ai');
    const testResult = document.getElementById('ai-test-result');
    const btnResetBank = document.getElementById('btn-reset-bank');

    function openModal() {
      const settings = AIEngine.loadSettings();
      aiEnabled.checked = settings.enabled;
      apiKeyInput.value = settings.apiKey;
      modelSelect.value = settings.model;
      statusText.textContent = settings.enabled ? 'ON（AI生成モード）' : 'OFF（テンプレートモード）';
      updateBankStats();
      modal.hidden = false;
    }

    function closeModal() {
      // Save on close
      const settings = {
        enabled: aiEnabled.checked,
        apiKey: apiKeyInput.value.trim(),
        model: modelSelect.value,
      };
      AIEngine.saveSettings(settings);
      updateAIModeBadge();
      modal.hidden = true;
    }

    btnOpen.addEventListener('click', openModal);
    btnClose.addEventListener('click', closeModal);
    overlay.addEventListener('click', closeModal);

    aiEnabled.addEventListener('change', () => {
      statusText.textContent = aiEnabled.checked ? 'ON（AI生成モード）' : 'OFF（テンプレートモード）';
    });

    btnTest.addEventListener('click', async () => {
      // Save settings first
      AIEngine.saveSettings({
        enabled: true,
        apiKey: apiKeyInput.value.trim(),
        model: modelSelect.value,
      });
      testResult.textContent = 'テスト中...';
      testResult.style.color = 'var(--text-secondary)';
      const result = await AIEngine.testConnection();
      if (result.success) {
        testResult.textContent = '接続成功! ' + result.message;
        testResult.style.color = '#00ff88';
      } else {
        testResult.textContent = '接続失敗: ' + result.message;
        testResult.style.color = '#ff6b6b';
      }
    });

    btnResetBank.addEventListener('click', () => {
      if (confirm('アイデアの履歴をすべて削除しますか？')) {
        IdeaBank.reset();
        updateBankStats();
        updateBankSummary();
      }
    });
  }

  function updateBankStats() {
    const el = document.getElementById('idea-bank-stats');
    if (!el) return;
    const stats = IdeaBank.getStats();
    if (stats.totalIdeas === 0) {
      el.innerHTML = 'まだアイデアの蓄積がありません。パイプラインを実行するとアイデアが蓄積されます。';
    } else {
      el.innerHTML = `<strong>${stats.totalIdeas}</strong>個のアイデアを蓄積済み（${stats.generations}世代、${stats.winners}回の勝者）`;
    }
  }

  function updateAIModeBadge() {
    const badge = document.getElementById('ai-mode-badge');
    const icon = document.getElementById('ai-mode-icon');
    const label = document.getElementById('ai-mode-label');
    if (!badge) return;

    if (AIEngine.isAvailable()) {
      badge.className = 'ai-mode-badge ai-mode-badge--on';
      icon.innerHTML = '&#9889;';
      label.textContent = 'AI生成モード';
    } else {
      badge.className = 'ai-mode-badge ai-mode-badge--off';
      icon.innerHTML = '&#9888;';
      label.textContent = 'テンプレートモード（設定でAIを有効化）';
    }
  }

  function updateBankSummary() {
    const container = document.getElementById('bank-summary');
    const content = document.getElementById('bank-summary-content');
    if (!container || !content) return;

    const stats = IdeaBank.getStats();
    if (!stats.hasHistory) {
      container.hidden = true;
      return;
    }

    container.hidden = false;
    const insights = IdeaBank.extractInsights();
    if (!insights) return;

    let html = `<div>${insights.totalIdeas}個のアイデアを蓄積中（${insights.totalGenerations}世代目）</div>`;
    if (insights.winningFeatures.length > 0) {
      html += `<div style="margin-top:4px">勝ちパターン: ${insights.winningFeatures.map(f => f.feature).join('、')}</div>`;
    }
    if (insights.recentWinners.length > 0) {
      html += `<div style="margin-top:4px">前回の勝者: ${escapeHtml(insights.recentWinners[insights.recentWinners.length - 1].name)}</div>`;
    }
    content.innerHTML = html;
  }

  // --- Pipeline Steps ---

  async function runPipeline() {
    const selectedCategories = getSelectedCategories();
    if (selectedCategories.length === 0) {
      alert('少なくとも1つのカテゴリを選択してください。');
      return;
    }
    state.running = true;
    document.getElementById('btn-start').disabled = true;

    // Step 0: トレンド分析
    await stepAnalyzeTrends(selectedCategories);

    // Step 1: アイデア生成（トレンド + 蓄積 + AI）
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

  // --- Step 0: トレンド分析 ---
  async function stepAnalyzeTrends(categories) {
    updatePipelineTitle('Step 0: トレンドを分析中...');
    showSection('trends');
    await sleep(300);

    const trends = Trends.getTrendsForCategories(categories);
    state.trends = trends;

    const content = document.getElementById('trends-content');
    content.innerHTML = '';

    // トレンドカードを順番に表示
    for (let i = 0; i < Math.min(trends.length, 8); i++) {
      const t = trends[i];
      const card = document.createElement('div');
      card.className = 'trend-card';
      card.style.animationDelay = (i * 0.1) + 's';
      card.innerHTML = `
        <div class="trend-card__hotness">${t.hotness}</div>
        <div class="trend-card__info">
          <div class="trend-card__keyword">${escapeHtml(t.keyword)}</div>
          <div class="trend-card__desc">${escapeHtml(t.description)}</div>
          <div class="trend-card__examples">${t.examples.join(' / ')}</div>
        </div>
      `;
      content.appendChild(card);
      await sleep(150);
    }

    // トレンド組み合わせ提案
    const combos = Trends.suggestCombinations(2);
    if (combos.length > 0) {
      const comboSection = document.createElement('div');
      comboSection.style.cssText = 'margin-top:12px;padding:12px;background:rgba(108,92,231,0.1);border-radius:8px;border:1px solid rgba(108,92,231,0.2)';
      comboSection.innerHTML = `
        <div style="font-size:0.85rem;font-weight:700;color:var(--accent-light);margin-bottom:6px">&#128161; トレンド掛け合わせアイデア</div>
        ${combos.map(c => `<div style="font-size:0.8rem;color:var(--text-secondary);padding:4px 0">
          <strong>${c.trends.join(' × ')}</strong>: ${escapeHtml(c.suggestion)}
        </div>`).join('')}
      `;
      content.appendChild(comboSection);
    }

    await sleep(1500);
    updatePipelineTitle('Step 0: トレンド分析 完了');
  }

  // --- Step 1: アイデア生成 ---
  async function stepGenerateIdeas(categories) {
    updatePipeline(1);
    showSection('ideas');
    await sleep(400);

    const sourceInfo = document.getElementById('ideas-source-info');
    const insights = IdeaBank.extractInsights();
    const useAI = AIEngine.isAvailable();

    let newIdeas = [];
    let evolvedIdeas = [];
    let aiIdeas = [];

    // 1. 蓄積からの進化アイデア（過去データがあれば）
    if (insights && insights.totalIdeas >= 3) {
      updatePipelineTitle('Step 1: 過去のアイデアを進化させ中...');
      evolvedIdeas = IdeaBank.evolveIdeas(categories, state.trends, 2);
      await sleep(500);
    }

    // 2. AI生成（APIキーがあれば）
    if (useAI) {
      updatePipelineTitle('Step 1: AIがトレンドを分析してアイデアを生成中...');
      try {
        aiIdeas = await AIEngine.generateTrendBasedIdeas(
          categories, state.trends, insights, 3
        );
      } catch (err) {
        console.error('AI generation failed, falling back to template:', err);
        sourceInfo.innerHTML = '&#9888; AI生成に失敗しました。テンプレートモードで生成します。';
      }
    }

    // 3. テンプレートベースの生成（残り枠を埋める）
    const needed = 5 - evolvedIdeas.length - aiIdeas.length;
    if (needed > 0) {
      updatePipelineTitle('Step 1: テンプレートからアイデアを生成中...');
      newIdeas = IdeaGenerator.generateIdeas(categories, needed);
      // トレンドに基づく特徴を追加
      newIdeas = newIdeas.map(idea => {
        const hints = Trends.getEnhancementHints(idea);
        if (hints.trends.length > 0) {
          const trendFeature = hints.trends[0].keyword + '対応';
          if (!idea.features.includes(trendFeature)) {
            idea.features.push(trendFeature);
          }
          idea.trendBasis = hints.trends[0].keyword;
        }
        return idea;
      });
    }

    // 全アイデアを合体
    state.ideas = [...evolvedIdeas, ...aiIdeas, ...newIdeas].slice(0, 5);

    // ソース情報を表示
    const parts = [];
    if (evolvedIdeas.length > 0) parts.push(`${evolvedIdeas.length}個は過去のアイデアから進化`);
    if (aiIdeas.length > 0) parts.push(`${aiIdeas.length}個はAIが生成`);
    if (newIdeas.length > 0) parts.push(`${newIdeas.length}個はテンプレート＋トレンド`);
    if (insights) parts.push(`累計${insights.totalIdeas}個のアイデアを蓄積中`);
    sourceInfo.innerHTML = parts.join(' / ');

    // アイデアをバンクに保存
    IdeaBank.addIdeas(state.ideas);

    // カードを表示
    const grid = document.getElementById('ideas-grid');
    grid.innerHTML = '';

    state.ideas.forEach(idea => {
      const card = document.createElement('div');
      card.className = 'idea-card';

      let badges = '';
      if (idea.isEvolved) badges += '<span class="idea-card__badge idea-card__badge--evolved">進化</span>';
      if (idea.isAIGenerated) badges += '<span class="idea-card__badge idea-card__badge--ai">AI</span>';
      if (idea.trendBasis) badges += `<span class="idea-card__badge idea-card__badge--trend">${escapeHtml(idea.trendBasis)}</span>`;

      card.innerHTML = `
        <span class="idea-card__category idea-card__category--${idea.category}">${getCategoryLabel(idea.category)}</span>
        ${badges}
        <h3 class="idea-card__name">${escapeHtml(idea.name)}</h3>
        <p class="idea-card__desc">${escapeHtml(idea.description)}</p>
        <p style="font-size:0.8rem;color:var(--text-muted);margin-bottom:8px">&#127919; ${escapeHtml(idea.targetAudience || '')}</p>
        <ul class="idea-card__features">
          ${(idea.features || []).map(f => `<li class="idea-card__feature">${escapeHtml(f)}</li>`).join('')}
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

    // 勝者をバンクに記録
    IdeaBank.markWinner(state.winner.idea.id);

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

    const useAI = AIEngine.isAvailable();

    if (useAI) {
      // AI生成モード
      const buildSteps = [
        { progress: 15, text: 'AIがアプリ設計を分析中...' },
        { progress: 30, text: 'AIがUIコンポーネントを設計中...' },
        { progress: 50, text: 'AIがコードを書いています...' },
        { progress: 70, text: 'AIがスタイリングを適用中...' },
        { progress: 85, text: 'AIがインタラクションを実装中...' },
      ];

      for (const step of buildSteps) {
        fill.style.width = step.progress + '%';
        status.textContent = step.text;
        await sleep(800);
      }

      try {
        state.winnerCode = await AIEngine.generateCode(state.winner.idea, state.trends);
        fill.style.width = '100%';
        status.textContent = 'AI生成完了！';
      } catch (err) {
        console.error('AI code gen failed, using template:', err);
        status.textContent = 'AI生成失敗、テンプレートを使用...';
        await sleep(500);
        state.winnerCode = Builder.buildApp(state.winner.idea);
        fill.style.width = '100%';
        status.textContent = 'テンプレート生成完了！';
      }
    } else {
      // テンプレートモード
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

      state.winnerCode = Builder.buildApp(state.winner.idea);

      for (const step of buildSteps) {
        fill.style.width = step.progress + '%';
        status.textContent = step.text;
        const displayLength = Math.floor(state.winnerCode.length * (step.progress / 100));
        codeOutput.textContent = state.winnerCode.substring(0, displayLength);
        await sleep(400);
      }
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

    const useAI = AIEngine.isAvailable();

    if (useAI) {
      updatePipelineTitle('Step 5: AIが宣伝素材を作成中...');
      try {
        state.marketingKit = await AIEngine.generateMarketing(state.winner.idea);
      } catch (err) {
        console.error('AI marketing failed, using template:', err);
        state.marketingKit = Marketing.generateKit(state.winner.idea);
      }
    } else {
      state.marketingKit = Marketing.generateKit(state.winner.idea);
    }

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
        body: `<div class="marketing-card__tags">${(kit.hashTags || []).map(t => `<span class="marketing-card__tag">#${escapeHtml(t)}</span>`).join('')}</div>`,
      },
      {
        icon: '&#128270;',
        title: 'SEOキーワード',
        body: `<div class="marketing-card__tags">${(kit.seoKeywords || []).map(k => `<span class="marketing-card__tag">${escapeHtml(k)}</span>`).join('')}</div>`,
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
    state.running = false;
    showSection('download');
    updatePipelineTitle('全ステップ完了！各ステップをタップで確認できます');
    pipelineSteps.forEach(step => {
      step.classList.remove('active', 'viewing');
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

    folder.file('index.html', state.winnerCode);

    const kit = state.marketingKit;
    const marketingText = [
      '=== マーケティングキット ===',
      '',
      '【キャッチコピー】', kit.tagline, '',
      '【X (Twitter) 投稿文】', kit.twitter, '',
      '【Instagram 投稿文】', kit.instagram, '',
      '【プレスリリース】', kit.press, '',
      '【ハッシュタグ】', (kit.hashTags || []).map(t => '#' + t).join(' '), '',
      '【SEOキーワード】', (kit.seoKeywords || []).join(', '),
    ].join('\n');
    folder.file('marketing-kit.txt', marketingText);

    const plan = state.monetizePlan;
    const monetizeText = [
      '=== マネタイズプラン ===', '',
      ...plan.strategies.map(s => [
        `【${s.name}】${s.recommended ? ' ★推奨' : ''}`,
        s.description, '',
        'ステップ:',
        ...s.steps.map((step, i) => `  ${i + 1}. ${step}`), '',
        `推定収益: ${formatNumber(s.revenueEstimate.min)} 〜 ${formatNumber(s.revenueEstimate.max)} ${s.revenueEstimate.unit}`, '',
      ]).flat(),
      '【ロードマップ】',
      ...plan.roadmap.map(p => [
        `${p.phase} - ${p.title}`,
        ...p.tasks.map(t => `  - ${t}`), '',
      ]).flat(),
      `合計推定月間収益: ${formatNumber(plan.combinedRevenue.min)} 〜 ${formatNumber(plan.combinedRevenue.max)} ${plan.combinedRevenue.unit}`,
    ].join('\n');
    folder.file('monetize-plan.txt', monetizeText);

    folder.file('ad-code-sample.html', plan.adCode);

    const readme = [
      `# ${state.winner.idea.name}`, '',
      state.winner.idea.description, '',
      `ターゲット: ${state.winner.idea.targetAudience}`,
      `カテゴリ: ${getCategoryLabel(state.winner.idea.category)}`, '',
      '## 機能',
      ...(state.winner.idea.features || []).map(f => `- ${f}`), '',
      '## 使い方',
      '1. index.html をブラウザで開く',
      '2. またはWebサーバーにデプロイする', '',
      '## マネタイズ',
      `推奨モデル: ${plan.strategies[0].name}`,
      `推定月間収益: ${formatNumber(plan.combinedRevenue.min)} 〜 ${formatNumber(plan.combinedRevenue.max)} ${plan.combinedRevenue.unit}`, '',
      '詳細は monetize-plan.txt を参照。', '',
      '---',
      'Generated by Idea Monetizer',
    ].join('\n');
    folder.file('README.md', readme);

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
      maxStep: 0,
      ideas: [],
      ranked: [],
      winner: null,
      winnerCode: '',
      marketingKit: null,
      monetizePlan: null,
      running: false,
      trends: [],
    };
    pipelineSteps.forEach(s => s.classList.remove('active', 'completed', 'viewing'));
    document.getElementById('btn-start').disabled = false;
    updatePipelineTitle('カテゴリを選んでスタート');
    updateBankSummary();
    showSection('start');
  }

  // --- Utility ---
  function getCategoryLabel(cat) {
    const labels = {
      game: 'ゲーム', tool: 'ツール', sns: 'SNS',
      lifestyle: 'ライフスタイル', education: '教育',
      entertainment: 'エンタメ', business: 'ビジネス',
    };
    return labels[cat] || cat;
  }

  // --- Global copy function ---
  window.copyText = function (btn) {
    const copyEl = btn.parentElement;
    const text = copyEl.textContent.replace('コピー', '').trim();
    navigator.clipboard.writeText(text).then(() => {
      const originalText = btn.textContent;
      btn.textContent = 'コピー済!';
      setTimeout(() => { btn.textContent = originalText; }, 1500);
    });
  };

  // --- Init ---
  function init() {
    initSettingsModal();
    updateAIModeBadge();
    updateBankSummary();

    document.getElementById('btn-start').addEventListener('click', runPipeline);
    document.getElementById('btn-download').addEventListener('click', downloadZip);
    document.getElementById('btn-restart').addEventListener('click', restart);
  }

  init();

})();
