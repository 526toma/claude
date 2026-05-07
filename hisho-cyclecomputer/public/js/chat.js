/* ============================================================
 * chat.js — スタート前チャットUI
 *   フェーズ1ではスクリプテッドな会話フロー。
 *   秘書ちゃんの返答は HishoApi（モック）から取得。
 * ============================================================ */
(function (global) {
  const log    = () => document.getElementById('chat-log');
  const quick  = () => document.getElementById('chat-quick');
  const input  = () => document.getElementById('chat-input');
  const send   = () => document.getElementById('chat-send');

  const state = {
    step: 0,                 // 会話ステップ
    plan: {                  // ユーザーが選んだ計画
      durationMin: null,
      distanceKm: null,
      routeName: null
    }
  };

  // ===== 表示ヘルパー =====
  function pushHisho(text) {
    const el = document.createElement('div');
    el.className = 'chat-msg chat-msg--hisho';
    el.textContent = text;
    log().appendChild(el);
    scroll();
    if (global.HishoVoice) global.HishoVoice.speak(text);
  }
  function pushUser(text) {
    const el = document.createElement('div');
    el.className = 'chat-msg chat-msg--user';
    el.textContent = text;
    log().appendChild(el);
    scroll();
  }
  function pushSystem(text) {
    const el = document.createElement('div');
    el.className = 'chat-msg chat-msg--system';
    el.textContent = text;
    log().appendChild(el);
    scroll();
  }
  function scroll() { log().scrollTop = log().scrollHeight; }

  function setQuick(items) {
    const q = quick();
    q.innerHTML = '';
    items.forEach((it) => {
      const b = document.createElement('button');
      b.className = 'quick-btn' + (it.primary ? ' quick-btn--primary' : '');
      b.textContent = it.label;
      b.addEventListener('click', () => it.onClick(it.label));
      q.appendChild(b);
    });
  }
  function clearQuick() { quick().innerHTML = ''; }

  // ===== 会話フロー =====
  async function start() {
    log().innerHTML = '';
    state.step = 0;
    setMood('wink');

    const intro = await global.HishoApi.callClaude({ kind: 'chat_intro' });
    pushHisho(intro);

    setTimeout(() => askDuration(), 600);
  }

  async function askDuration() {
    const t = await global.HishoApi.callClaude({ kind: 'chat_duration' });
    pushHisho(t);
    setQuick([
      { label: '30分くらい', onClick: () => chooseDuration(30, 10) },
      { label: '1時間',     onClick: () => chooseDuration(60, 20) },
      { label: '2時間',     onClick: () => chooseDuration(120, 40) },
      { label: '3時間以上', onClick: () => chooseDuration(180, 60) }
    ]);
  }

  function chooseDuration(min, km) {
    state.plan.durationMin = min;
    state.plan.distanceKm  = km;
    pushUser(`${min}分くらい走りたい`);
    clearQuick();
    setTimeout(() => askRoute(), 400);
  }

  async function askRoute() {
    const t = await global.HishoApi.callClaude({ kind: 'chat_route' });
    pushHisho(t);

    // フェーズ1：固定ルート3パターン（後で天気APIや履歴と連携）
    const km = state.plan.distanceKm;
    const routes = [
      { name: '太田川沿い往復',     km: km,    note: '平坦' },
      { name: '比治山ぐるり',       km: km,    note: '小さな登り' },
      { name: '安佐方面ヒルクライム', km: km,   note: '登りあり' }
    ];

    pushSystem('コース候補:');
    routes.forEach((r, i) => {
      pushSystem(`${i+1}. ${r.name}（約${r.km}km・${r.note}）`);
    });

    setQuick(routes.map((r) => ({
      label: r.name,
      onClick: () => chooseRoute(r)
    })));
  }

  function chooseRoute(r) {
    state.plan.routeName = r.name;
    pushUser(`${r.name}で！`);
    clearQuick();
    setTimeout(() => askChecklist(), 400);
  }

  async function askChecklist() {
    const t = await global.HishoApi.callClaude({ kind: 'chat_checklist' });
    pushHisho(t);
    setQuick([
      { label: 'OK！準備できた', primary: true, onClick: () => readyToGo() },
      { label: 'まだ準備中',     onClick: () => pushHisho('ゆっくり準備してくださいね。') }
    ]);
  }

  async function readyToGo() {
    pushUser('OK、準備できた！');
    clearQuick();

    const t = await global.HishoApi.callClaude({ kind: 'chat_go' });
    pushHisho(t);

    setQuick([
      { label: '🚴 スタート', primary: true, onClick: () => beginRide() }
    ]);
  }

  function beginRide() {
    // 音声アンロック（iOS Safari対策）
    if (global.HishoVoice) global.HishoVoice.unlock();
    clearQuick();
    if (global.HishoApp && global.HishoApp.startRide) {
      global.HishoApp.startRide(state.plan);
    }
  }

  function setMood(m) {
    const bg = document.getElementById('hisho-bg');
    if (!bg) return;
    bg.dataset.mood = m;
    bg.style.backgroundImage = `url('images/hisho/${m}.svg')`;
  }

  // テキスト入力サポート（自由会話はフェーズ2でLLM接続）
  function bindInput() {
    send().addEventListener('click', sendInput);
    input().addEventListener('keydown', (e) => {
      if (e.key === 'Enter') sendInput();
    });
  }
  function sendInput() {
    const v = input().value.trim();
    if (!v) return;
    pushUser(v);
    input().value = '';
    setTimeout(() => {
      pushHisho('（自由会話はもうすぐ対応します。クイックボタンから選んでください）');
    }, 300);
  }

  global.HishoChat = { start, bindInput, setMood, pushHisho, pushUser, pushSystem };
})(window);
