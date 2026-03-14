/**
 * Auto Builder
 * 選ばれたアイデアに基づいて完全なHTMLアプリを生成
 */
const Builder = (() => {

  // 共通HTMLヘッダー
  function htmlHead(title, extraCSS = '') {
    return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<style>
*, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
body {
  font-family: 'Segoe UI', -apple-system, 'Noto Sans JP', sans-serif;
  min-height: 100vh;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
  color: #e8eaf0;
  padding: 20px;
}
h1 { font-size: 1.8rem; margin-bottom: 8px; text-align: center; }
.subtitle { color: #9ea3b5; font-size: 0.9rem; margin-bottom: 24px; text-align: center; }
.container { max-width: 600px; width: 100%; }
button {
  background: linear-gradient(135deg, #6c5ce7, #845ef7);
  color: white; border: none; border-radius: 10px;
  padding: 12px 24px; font-size: 1rem; font-weight: 600; cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
}
button:hover { transform: translateY(-2px); box-shadow: 0 4px 20px rgba(108,92,231,0.4); }
button:active { transform: translateY(0); }
.card {
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 16px;
  backdrop-filter: blur(8px);
}
input, textarea, select {
  width: 100%;
  padding: 10px 14px;
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.15);
  background: rgba(255,255,255,0.06);
  color: #e8eaf0;
  font-size: 0.95rem;
  font-family: inherit;
  outline: none;
  transition: border-color 0.2s;
}
input:focus, textarea:focus { border-color: #6c5ce7; }
.score { font-size: 3rem; font-weight: 800; text-align: center; }
.badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 99px;
  font-size: 0.75rem;
  font-weight: 600;
}
/* Ad placeholder */
.ad-banner {
  background: rgba(255,255,255,0.03);
  border: 1px dashed rgba(255,255,255,0.1);
  border-radius: 8px;
  padding: 12px;
  text-align: center;
  color: #6b7085;
  font-size: 0.75rem;
  margin: 16px 0;
}
${extraCSS}
</style>
</head>
<body>`;
  }

  const htmlFoot = `
<!-- Ad Banner Placeholder -->
<div class="ad-banner">Sponsored - Ad Space</div>
</body>
</html>`;

  // === テンプレート集 ===

  const appTemplates = {
    // --- ゲーム系 ---
    clicker: (idea) => htmlHead(idea.name, `
.click-area { width: 200px; height: 200px; border-radius: 50%; background: linear-gradient(135deg, #6c5ce7, #fd79a8); display: flex; align-items: center; justify-content: center; font-size: 2.5rem; cursor: pointer; transition: transform 0.1s; user-select: none; margin: 20px auto; }
.click-area:active { transform: scale(0.92); }
.stats { display: flex; gap: 24px; justify-content: center; margin: 16px 0; }
.stat-box { text-align: center; }
.stat-val { font-size: 1.8rem; font-weight: 800; color: #a29bfe; }
.stat-label { font-size: 0.75rem; color: #9ea3b5; }
.upgrades { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 16px; }
.upgrades button { font-size: 0.85rem; padding: 8px; }
.upgrades button:disabled { opacity: 0.4; cursor: not-allowed; }
.float-num { position: fixed; pointer-events: none; font-weight: 700; color: #ffd700; font-size: 1.2rem; animation: floatUp 0.8s ease-out forwards; }
@keyframes floatUp { 0%{opacity:1;transform:translateY(0)} 100%{opacity:0;transform:translateY(-60px)} }
`) + `
<div class="container">
  <h1>${idea.name}</h1>
  <p class="subtitle">${idea.description}</p>
  <div class="stats">
    <div class="stat-box"><div class="stat-val" id="count">0</div><div class="stat-label">クリック数</div></div>
    <div class="stat-box"><div class="stat-val" id="cps">0</div><div class="stat-label">毎秒</div></div>
    <div class="stat-box"><div class="stat-val" id="multi">x1</div><div class="stat-label">倍率</div></div>
  </div>
  <div class="click-area" id="clicker">&#9889;</div>
  <div class="card">
    <div class="upgrades">
      <button onclick="buyUpgrade('auto',10)">&#129302; オートクリック<br><small>10 pts</small></button>
      <button onclick="buyUpgrade('multi',50)">&#128640; 倍率UP<br><small>50 pts</small></button>
      <button onclick="buyUpgrade('super',200)">&#11088; スーパー<br><small>200 pts</small></button>
      <button onclick="buyUpgrade('mega',1000)">&#127775; メガ<br><small>1000 pts</small></button>
    </div>
  </div>
</div>
<script>
let count=0, cps=0, multi=1, autoRate=0;
const el={count:document.getElementById('count'),cps:document.getElementById('cps'),multi:document.getElementById('multi')};
document.getElementById('clicker').addEventListener('click',function(e){
  count+=multi;
  el.count.textContent=formatNum(count);
  const f=document.createElement('div');
  f.className='float-num';
  f.textContent='+'+multi;
  f.style.left=e.clientX+'px';
  f.style.top=e.clientY+'px';
  document.body.appendChild(f);
  setTimeout(()=>f.remove(),800);
});
function buyUpgrade(type,cost){
  if(count<cost)return;
  count-=cost;
  if(type==='auto'){autoRate++;cps=autoRate*multi;}
  else if(type==='multi'){multi++;el.multi.textContent='x'+multi;cps=autoRate*multi;}
  else if(type==='super'){multi+=5;el.multi.textContent='x'+multi;cps=autoRate*multi;}
  else if(type==='mega'){autoRate+=10;cps=autoRate*multi;}
  el.count.textContent=formatNum(count);
  el.cps.textContent=formatNum(cps);
}
setInterval(()=>{count+=autoRate*multi;el.count.textContent=formatNum(count);},1000);
function formatNum(n){if(n>=1e6)return(n/1e6).toFixed(1)+'M';if(n>=1e3)return(n/1e3).toFixed(1)+'K';return n;}
</script>` + htmlFoot,

    puzzle: (idea) => htmlHead(idea.name, `
.grid { display: grid; grid-template-columns: repeat(4,60px); gap: 4px; margin: 20px auto; width: fit-content; }
.cell { width: 60px; height: 60px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; font-weight: 700; cursor: pointer; transition: transform 0.15s, background 0.2s; }
.cell:hover { transform: scale(1.08); }
.cell.matched { opacity: 0.3; pointer-events: none; }
.colors-0{background:#6c5ce7} .colors-1{background:#00cec9} .colors-2{background:#fd79a8}
.colors-3{background:#fdcb6e} .colors-4{background:#e17055} .colors-5{background:#74b9ff}
.colors-6{background:#55efc4} .colors-7{background:#a29bfe}
.info { display: flex; gap: 24px; justify-content: center; margin: 16px 0; }
`) + `
<div class="container">
  <h1>${idea.name}</h1>
  <p class="subtitle">${idea.description}</p>
  <div class="info">
    <span>&#9201; <span id="timer">0</span>秒</span>
    <span>&#127922; <span id="moves">0</span>手</span>
    <span>&#11088; <span id="pairs">0</span>/8ペア</span>
  </div>
  <div class="grid" id="grid"></div>
  <button onclick="initGame()" style="margin-top:12px">&#128260; リセット</button>
</div>
<script>
const emojis=['&#127912;','&#127752;','&#127774;','&#127800;','&#128142;','&#128640;','&#11088;','&#129412;'];
let cards=[],flipped=[],matched=0,moves=0,timer=0,timerID=null,locked=false;
function initGame(){
  cards=[];matched=0;moves=0;timer=0;flipped=[];locked=false;
  document.getElementById('moves').textContent=0;
  document.getElementById('timer').textContent=0;
  document.getElementById('pairs').textContent=0;
  clearInterval(timerID);
  timerID=setInterval(()=>{timer++;document.getElementById('timer').textContent=timer;},1000);
  const pairs=[...Array(8).keys(),...Array(8).keys()];
  pairs.sort(()=>Math.random()-0.5);
  const grid=document.getElementById('grid');
  grid.innerHTML='';
  pairs.forEach((v,i)=>{
    const d=document.createElement('div');
    d.className='cell colors-'+v;
    d.dataset.value=v;
    d.dataset.index=i;
    d.textContent='?';
    d.style.background='rgba(255,255,255,0.08)';
    d.addEventListener('click',()=>flipCard(d,v));
    grid.appendChild(d);
    cards.push(d);
  });
}
function flipCard(el,v){
  if(locked||flipped.includes(el)||el.classList.contains('matched'))return;
  el.innerHTML=emojis[v];
  el.className='cell colors-'+v;
  flipped.push(el);
  if(flipped.length===2){
    moves++;document.getElementById('moves').textContent=moves;
    locked=true;
    const[a,b]=flipped;
    if(a.dataset.value===b.dataset.value){
      a.classList.add('matched');b.classList.add('matched');
      matched++;document.getElementById('pairs').textContent=matched;
      flipped=[];locked=false;
      if(matched===8){clearInterval(timerID);setTimeout(()=>alert('クリア! '+moves+'手 / '+timer+'秒'),300);}
    }else{
      setTimeout(()=>{
        a.textContent='?';a.style.background='rgba(255,255,255,0.08)';a.className='cell';
        b.textContent='?';b.style.background='rgba(255,255,255,0.08)';b.className='cell';
        flipped=[];locked=false;
      },700);
    }
  }
}
initGame();
</script>` + htmlFoot,

    quiz: (idea) => htmlHead(idea.name, `
.quiz-option { display: block; width: 100%; padding: 14px; margin: 8px 0; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; color: #e8eaf0; font-size: 1rem; cursor: pointer; text-align: left; transition: all 0.2s; }
.quiz-option:hover { border-color: #6c5ce7; background: rgba(108,92,231,0.1); }
.quiz-option.correct { border-color: #00cec9; background: rgba(0,206,201,0.15); }
.quiz-option.wrong { border-color: #e17055; background: rgba(225,112,85,0.15); }
.progress-bar { height: 6px; background: rgba(255,255,255,0.06); border-radius: 99px; margin-bottom: 20px; }
.progress-fill { height: 100%; background: linear-gradient(90deg, #6c5ce7, #00cec9); border-radius: 99px; transition: width 0.3s; }
.result { text-align: center; }
`) + `
<div class="container">
  <h1>${idea.name}</h1>
  <p class="subtitle">${idea.description}</p>
  <div class="card">
    <div class="progress-bar"><div class="progress-fill" id="prog" style="width:0%"></div></div>
    <div id="quiz-area"></div>
    <div id="result-area" class="result" style="display:none"></div>
  </div>
</div>
<script>
const quizData=[
  {q:"日本で一番高い山は？",o:["富士山","北岳","奥穂高岳","間ノ岳"],a:0},
  {q:"光の速さは秒速何km？",o:["約30万km","約15万km","約100万km","約3万km"],a:0},
  {q:"水の化学式は？",o:["H2O","CO2","NaCl","O2"],a:0},
  {q:"地球から月までの距離は？",o:["約38万km","約150万km","約10万km","約1万km"],a:0},
  {q:"人間の骨の数は約何本？",o:["206本","106本","306本","150本"],a:0},
  {q:"1年は何秒？(概算)",o:["約3150万秒","約100万秒","約1億秒","約500万秒"],a:0},
  {q:"日本の都道府県の数は？",o:["47","46","48","50"],a:0},
  {q:"太陽系で最大の惑星は？",o:["木星","土星","天王星","海王星"],a:0},
  {q:"プログラミング言語Pythonの由来は？",o:["モンティ・パイソン","蛇のパイソン","パイの計算","人名"],a:0},
  {q:"「emoji」は何語が起源？",o:["日本語","英語","中国語","韓国語"],a:0}
];
let current=0,score=0;
function showQ(){
  if(current>=quizData.length){showResult();return;}
  const q=quizData[current];
  document.getElementById('prog').style.width=(current/quizData.length*100)+'%';
  let html='<p style="font-size:1.1rem;font-weight:600;margin-bottom:16px">Q'+(current+1)+'. '+q.q+'</p>';
  q.o.forEach((o,i)=>{html+='<button class="quiz-option" onclick="answer('+i+')">'+o+'</button>';});
  document.getElementById('quiz-area').innerHTML=html;
}
function answer(i){
  const btns=document.querySelectorAll('.quiz-option');
  btns.forEach((b,j)=>{b.disabled=true;if(j===quizData[current].a)b.classList.add('correct');});
  if(i===quizData[current].a)score++;
  else btns[i].classList.add('wrong');
  setTimeout(()=>{current++;showQ();},800);
}
function showResult(){
  document.getElementById('prog').style.width='100%';
  document.getElementById('quiz-area').style.display='none';
  const r=document.getElementById('result-area');r.style.display='block';
  const pct=Math.round(score/quizData.length*100);
  r.innerHTML='<div class="score">'+score+'/'+quizData.length+'</div><p style="font-size:1.2rem;margin:12px 0">正答率 '+pct+'%</p><p style="color:#9ea3b5">'+(pct>=80?'素晴らしい！':pct>=50?'なかなか！':'もう一度挑戦！')+'</p><button onclick="current=0;score=0;document.getElementById(\\'result-area\\').style.display=\\'none\\';document.getElementById(\\'quiz-area\\').style.display=\\'block\\';showQ();" style="margin-top:16px">もう一度</button>';
}
showQ();
</script>` + htmlFoot,

    memory: (idea) => appTemplates.puzzle(idea),

    rhythm: (idea) => htmlHead(idea.name, `
.lane { display: flex; gap: 12px; justify-content: center; margin: 20px 0; }
.key-btn { width: 70px; height: 70px; border-radius: 12px; font-size: 1.5rem; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.1s; }
.key-btn.hit { transform: scale(0.9); box-shadow: 0 0 20px rgba(108,92,231,0.5); }
.note { position: absolute; width: 50px; height: 50px; border-radius: 10px; animation: fall 2s linear forwards; pointer-events: none; display: flex; align-items: center; justify-content: center; font-size: 1.3rem; }
@keyframes fall { 0%{top:-50px;opacity:1} 90%{opacity:1} 100%{top:calc(100vh - 120px);opacity:0} }
.game-area { position: relative; height: 60vh; overflow: hidden; border-radius: 16px; background: rgba(0,0,0,0.2); margin-bottom: 16px; }
`) + `
<div class="container">
  <h1>${idea.name}</h1>
  <p class="subtitle">${idea.description}</p>
  <div style="text-align:center;margin:12px"><span id="rscore" class="score" style="font-size:2rem">0</span><br><small style="color:#9ea3b5">スコア</small></div>
  <div class="game-area" id="gameArea"></div>
  <div class="lane">
    <button class="key-btn" style="background:#6c5ce7" onclick="hitKey(0)" data-key="0">D</button>
    <button class="key-btn" style="background:#00cec9" onclick="hitKey(1)" data-key="1">F</button>
    <button class="key-btn" style="background:#fd79a8" onclick="hitKey(2)" data-key="2">J</button>
    <button class="key-btn" style="background:#fdcb6e;color:#333" onclick="hitKey(3)" data-key="3">K</button>
  </div>
  <div style="text-align:center"><button onclick="startGame()">&#9654; スタート</button></div>
</div>
<script>
const colors=['#6c5ce7','#00cec9','#fd79a8','#fdcb6e'];
const keys=['d','f','j','k'];
let sc=0,gameOn=false,intv;
function startGame(){if(gameOn)return;gameOn=true;sc=0;document.getElementById('rscore').textContent=0;
  intv=setInterval(()=>{spawnNote(Math.floor(Math.random()*4))},800);}
function spawnNote(lane){
  const n=document.createElement('div');n.className='note';
  n.style.background=colors[lane];n.style.left=(lane*82+30)+'px';
  n.dataset.lane=lane;n.textContent='&#9733;';
  document.getElementById('gameArea').appendChild(n);
  setTimeout(()=>n.remove(),2100);
}
function hitKey(lane){
  const btn=document.querySelectorAll('.key-btn')[lane];
  btn.classList.add('hit');setTimeout(()=>btn.classList.remove('hit'),100);
  const notes=document.querySelectorAll('.note[data-lane="'+lane+'"]');
  notes.forEach(n=>{const r=n.getBoundingClientRect(),a=document.getElementById('gameArea').getBoundingClientRect();
    if(r.top>a.bottom-150){sc+=10;document.getElementById('rscore').textContent=sc;n.remove();}});
}
document.addEventListener('keydown',e=>{const i=keys.indexOf(e.key.toLowerCase());if(i>=0)hitKey(i);});
</script>` + htmlFoot,

    word: (idea) => htmlHead(idea.name, `
.word-grid { display: grid; grid-template-columns: repeat(5,48px); gap: 6px; margin: 16px auto; width: fit-content; }
.letter { width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; border-radius: 8px; font-size: 1.2rem; font-weight: 700; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); transition: all 0.3s; }
.letter.correct { background: #00cec9; border-color: #00cec9; }
.letter.present { background: #fdcb6e; border-color: #fdcb6e; color: #333; }
.letter.absent { background: rgba(255,255,255,0.03); border-color: rgba(255,255,255,0.05); color: #6b7085; }
.keyboard { display: flex; flex-wrap: wrap; gap: 4px; justify-content: center; max-width: 400px; margin: 16px auto; }
.kb-key { padding: 8px 12px; border-radius: 6px; background: rgba(255,255,255,0.08); border: none; color: #e8eaf0; font-size: 0.85rem; cursor: pointer; }
.kb-key:hover { background: rgba(255,255,255,0.15); }
`) + `
<div class="container">
  <h1>${idea.name}</h1>
  <p class="subtitle">5文字の英単語を当てよう</p>
  <div id="board" class="word-grid"></div>
  <p id="msg" style="text-align:center;margin:8px;min-height:1.5em;color:#a29bfe"></p>
  <div class="keyboard" id="kb"></div>
</div>
<script>
const WORDS=["apple","happy","world","music","light","dream","cloud","smile","brave","magic"];
let answer=WORDS[Math.floor(Math.random()*WORDS.length)].toUpperCase();
let row=0,col=0,maxRow=6;
const board=document.getElementById('board');
for(let i=0;i<30;i++){const d=document.createElement('div');d.className='letter';board.appendChild(d);}
const cells=board.querySelectorAll('.letter');
const kbLayout='QWERTYUIOPASDFGHJKLZXCVBNM';
const kb=document.getElementById('kb');
kbLayout.split('').forEach(c=>{const b=document.createElement('button');b.className='kb-key';b.textContent=c;b.onclick=()=>input(c);kb.appendChild(b);});
const enterB=document.createElement('button');enterB.className='kb-key';enterB.textContent='Enter';enterB.onclick=submit;kb.appendChild(enterB);
const delB=document.createElement('button');delB.className='kb-key';delB.textContent='Del';delB.onclick=del;kb.appendChild(delB);
function input(c){if(col<5&&row<maxRow){cells[row*5+col].textContent=c;col++;}}
function del(){if(col>0){col--;cells[row*5+col].textContent='';}}
function submit(){
  if(col<5)return;
  let guess='';for(let i=0;i<5;i++)guess+=cells[row*5+i].textContent;
  for(let i=0;i<5;i++){
    const c=cells[row*5+i];
    if(guess[i]===answer[i])c.classList.add('correct');
    else if(answer.includes(guess[i]))c.classList.add('present');
    else c.classList.add('absent');
  }
  if(guess===answer){document.getElementById('msg').textContent='正解！すごい！';return;}
  row++;col=0;
  if(row>=maxRow)document.getElementById('msg').textContent='答えは '+answer+' でした';
}
document.addEventListener('keydown',e=>{
  if(e.key==='Enter')submit();
  else if(e.key==='Backspace')del();
  else if(/^[a-zA-Z]$/.test(e.key))input(e.key.toUpperCase());
});
</script>` + htmlFoot,

    tower: (idea) => appTemplates.clicker(idea),
    slider: (idea) => appTemplates.puzzle(idea),

    // --- ツール系 ---
    qr: (idea) => htmlHead(idea.name, `
.qr-output { background: white; border-radius: 16px; padding: 24px; display: flex; align-items: center; justify-content: center; margin: 16px auto; width: 220px; height: 220px; }
.qr-output canvas { max-width: 100%; }
`) + `
<div class="container">
  <h1>${idea.name}</h1>
  <p class="subtitle">${idea.description}</p>
  <div class="card">
    <input type="text" id="qr-input" placeholder="URLやテキストを入力..." value="https://example.com" oninput="genQR()">
    <div class="qr-output"><canvas id="qr-canvas" width="180" height="180"></canvas></div>
    <div style="text-align:center"><button onclick="downloadQR()">&#11015; ダウンロード</button></div>
  </div>
</div>
<script>
function genQR(){
  const t=document.getElementById('qr-input').value||'Hello';
  const c=document.getElementById('qr-canvas');
  const ctx=c.getContext('2d');
  const s=180,m=10,cs=Math.floor((s-m*2)/21);
  ctx.fillStyle='white';ctx.fillRect(0,0,s,s);
  ctx.fillStyle='#333';
  // Simplified QR-like pattern (decorative)
  let hash=0;for(let i=0;i<t.length;i++){hash=((hash<<5)-hash)+t.charCodeAt(i);hash|=0;}
  // Position patterns
  function drawFinder(x,y){for(let i=0;i<7;i++)for(let j=0;j<7;j++){
    const on=(i===0||i===6||j===0||j===6||(i>=2&&i<=4&&j>=2&&j<=4));
    if(on){ctx.fillRect(m+(x+j)*cs,m+(y+i)*cs,cs,cs);}}}
  drawFinder(0,0);drawFinder(14,0);drawFinder(0,14);
  // Data modules
  const rng=(s)=>{s^=s<<13;s^=s>>17;s^=s<<5;return s;};
  let seed=hash;
  for(let r=0;r<21;r++)for(let c2=0;c2<21;c2++){
    if((r<8&&c2<8)||(r<8&&c2>12)||(r>12&&c2<8))continue;
    seed=rng(seed);if((seed&3)===0)ctx.fillRect(m+c2*cs,m+r*cs,cs,cs);
  }
}
function downloadQR(){const a=document.createElement('a');a.download='qrcode.png';a.href=document.getElementById('qr-canvas').toDataURL();a.click();}
genQR();
</script>` + htmlFoot,

    pomodoro: (idea) => htmlHead(idea.name, `
.timer-display { font-size: 5rem; font-weight: 800; text-align: center; font-variant-numeric: tabular-nums; margin: 20px 0; }
.timer-display.break-mode { color: #00cec9; }
.controls { display: flex; gap: 12px; justify-content: center; margin: 16px 0; }
.session-info { text-align: center; color: #9ea3b5; margin: 8px 0; }
.sessions { display: flex; gap: 8px; justify-content: center; margin: 12px 0; }
.session-dot { width: 12px; height: 12px; border-radius: 50%; background: rgba(255,255,255,0.1); }
.session-dot.done { background: #6c5ce7; }
`) + `
<div class="container">
  <h1>${idea.name}</h1>
  <p class="subtitle">${idea.description}</p>
  <div class="card">
    <p class="session-info" id="mode">ワークタイム</p>
    <div class="timer-display" id="timer">25:00</div>
    <div class="sessions" id="dots"></div>
    <div class="controls">
      <button onclick="toggleTimer()" id="toggleBtn">&#9654; スタート</button>
      <button onclick="resetTimer()" style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.1)">&#128260; リセット</button>
    </div>
    <div style="margin-top:16px">
      <label style="font-size:0.85rem;color:#9ea3b5">作業時間(分):</label>
      <input type="number" id="workMin" value="25" min="1" max="60" style="width:80px;margin:4px 0" onchange="resetTimer()">
    </div>
  </div>
</div>
<script>
let workTime=25*60,breakTime=5*60,timeLeft=workTime,running=false,isBreak=false,sessions=0,interval;
function updateDisplay(){const m=Math.floor(timeLeft/60),s=timeLeft%60;
  document.getElementById('timer').textContent=String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');
  document.getElementById('timer').className='timer-display'+(isBreak?' break-mode':'');}
function toggleTimer(){
  if(running){clearInterval(interval);running=false;document.getElementById('toggleBtn').innerHTML='&#9654; スタート';}
  else{running=true;document.getElementById('toggleBtn').innerHTML='&#9646;&#9646; 一時停止';
    interval=setInterval(()=>{timeLeft--;updateDisplay();
      if(timeLeft<=0){clearInterval(interval);running=false;
        if(!isBreak){sessions++;updateDots();isBreak=true;timeLeft=breakTime;document.getElementById('mode').textContent='ブレイクタイム';}
        else{isBreak=false;timeLeft=workTime;document.getElementById('mode').textContent='ワークタイム';}
        updateDisplay();document.getElementById('toggleBtn').innerHTML='&#9654; スタート';
      }},1000);}}
function resetTimer(){workTime=parseInt(document.getElementById('workMin').value||25)*60;timeLeft=workTime;isBreak=false;running=false;clearInterval(interval);
  document.getElementById('mode').textContent='ワークタイム';document.getElementById('toggleBtn').innerHTML='&#9654; スタート';updateDisplay();}
function updateDots(){const d=document.getElementById('dots');d.innerHTML='';for(let i=0;i<Math.max(sessions,4);i++){const s=document.createElement('div');s.className='session-dot'+(i<sessions?' done':'');d.appendChild(s);}}
updateDots();updateDisplay();
</script>` + htmlFoot,

    password: (idea) => htmlHead(idea.name, `
.pw-display { font-family: 'Fira Code', monospace; font-size: 1.3rem; background: rgba(0,0,0,0.3); padding: 16px; border-radius: 10px; text-align: center; word-break: break-all; letter-spacing: 2px; margin: 16px 0; user-select: all; }
.strength { height: 6px; border-radius: 99px; margin: 8px 0; transition: all 0.3s; }
.slider-group { margin: 12px 0; }
.slider-group label { display: flex; justify-content: space-between; font-size: 0.85rem; color: #9ea3b5; }
input[type="range"] { width: 100%; accent-color: #6c5ce7; }
.check-group { display: flex; flex-wrap: wrap; gap: 12px; margin: 12px 0; }
.check-group label { font-size: 0.85rem; color: #9ea3b5; cursor: pointer; }
.check-group input { accent-color: #6c5ce7; }
`) + `
<div class="container">
  <h1>${idea.name}</h1>
  <p class="subtitle">${idea.description}</p>
  <div class="card">
    <div class="pw-display" id="pw">generating...</div>
    <div class="strength" id="str"></div>
    <p id="str-label" style="text-align:center;font-size:0.85rem;color:#9ea3b5"></p>
    <div class="slider-group">
      <label>文字数: <span id="lenVal">16</span></label>
      <input type="range" id="len" min="6" max="64" value="16" oninput="gen()">
    </div>
    <div class="check-group">
      <label><input type="checkbox" id="upper" checked onchange="gen()"> 大文字</label>
      <label><input type="checkbox" id="lower" checked onchange="gen()"> 小文字</label>
      <label><input type="checkbox" id="nums" checked onchange="gen()"> 数字</label>
      <label><input type="checkbox" id="syms" checked onchange="gen()"> 記号</label>
    </div>
    <div style="display:flex;gap:8px">
      <button onclick="gen()" style="flex:1">&#128260; 再生成</button>
      <button onclick="navigator.clipboard.writeText(document.getElementById('pw').textContent)" style="flex:1;background:rgba(0,206,201,0.2);border:1px solid rgba(0,206,201,0.3);color:#00cec9">&#128203; コピー</button>
    </div>
  </div>
</div>
<script>
function gen(){
  const len=parseInt(document.getElementById('len').value);
  document.getElementById('lenVal').textContent=len;
  let chars='';
  if(document.getElementById('upper').checked)chars+='ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if(document.getElementById('lower').checked)chars+='abcdefghijklmnopqrstuvwxyz';
  if(document.getElementById('nums').checked)chars+='0123456789';
  if(document.getElementById('syms').checked)chars+='!@#$%^&*()_+-=[]{}|;:,.<>?';
  if(!chars)chars='abcdefghijklmnopqrstuvwxyz';
  let pw='';const arr=new Uint32Array(len);crypto.getRandomValues(arr);
  for(let i=0;i<len;i++)pw+=chars[arr[i]%chars.length];
  document.getElementById('pw').textContent=pw;
  // Strength
  let s=0;if(len>=12)s++;if(len>=20)s++;if(/[A-Z]/.test(pw))s++;if(/[0-9]/.test(pw))s++;if(/[^a-zA-Z0-9]/.test(pw))s++;
  const colors=['#e17055','#e17055','#fdcb6e','#74b9ff','#00cec9','#00cec9'];
  const labels=['非常に弱い','弱い','普通','強い','非常に強い','最強'];
  document.getElementById('str').style.background=colors[s];
  document.getElementById('str').style.width=(s/5*100)+'%';
  document.getElementById('str-label').textContent=labels[s];
}
gen();
</script>` + htmlFoot,

    notepad: (idea) => htmlHead(idea.name, `
#editor { width: 100%; min-height: 300px; padding: 16px; font-family: inherit; font-size: 0.95rem; line-height: 1.8; resize: vertical; }
.toolbar { display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap; }
.toolbar button { padding: 6px 12px; font-size: 0.8rem; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; color: #e8eaf0; cursor: pointer; }
.toolbar button:hover { background: rgba(108,92,231,0.2); border-color: #6c5ce7; }
.char-count { text-align: right; font-size: 0.75rem; color: #6b7085; margin-top: 4px; }
`) + `
<div class="container">
  <h1>${idea.name}</h1>
  <p class="subtitle">${idea.description}</p>
  <div class="card">
    <div class="toolbar">
      <button onclick="download()">&#128190; 保存</button>
      <button onclick="clearAll()">&#128465; クリア</button>
      <button onclick="copyAll()">&#128203; コピー</button>
    </div>
    <textarea id="editor" placeholder="ここにメモを書く...">${idea.name}へようこそ！

自由にメモを書いてください。
データはブラウザに自動保存されます。</textarea>
    <div class="char-count"><span id="cc">0</span> 文字</div>
  </div>
</div>
<script>
const ed=document.getElementById('editor'),cc=document.getElementById('cc');
ed.value=localStorage.getItem('notepad_data')||ed.value;
function update(){cc.textContent=ed.value.length;localStorage.setItem('notepad_data',ed.value);}
ed.addEventListener('input',update);update();
function download(){const b=new Blob([ed.value],{type:'text/plain'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='memo.txt';a.click();}
function clearAll(){if(confirm('クリアしますか？')){ed.value='';update();}}
function copyAll(){navigator.clipboard.writeText(ed.value);}
</script>` + htmlFoot,

    image_resize: (idea) => appTemplates.notepad(idea),
    color: (idea) => appTemplates.notepad(idea),
    text_convert: (idea) => appTemplates.notepad(idea),
    json: (idea) => appTemplates.notepad(idea),

    // --- SNS系 ---
    diary: (idea) => htmlHead(idea.name, `
.entries { max-height: 400px; overflow-y: auto; }
.entry { padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.06); }
.entry-date { font-size: 0.75rem; color: #6b7085; }
.entry-text { margin-top: 4px; font-size: 0.9rem; }
.compose { display: flex; gap: 8px; margin-bottom: 16px; }
.compose input { flex: 1; }
.counter { font-size: 0.75rem; color: #6b7085; text-align: right; }
`) + `
<div class="container">
  <h1>${idea.name}</h1>
  <p class="subtitle">${idea.description}</p>
  <div class="card">
    <div class="compose">
      <input type="text" id="input" placeholder="今日のひとこと..." maxlength="140" oninput="document.getElementById('cnt').textContent=this.value.length+'/140'">
      <button onclick="post()">投稿</button>
    </div>
    <div class="counter" id="cnt">0/140</div>
    <div class="entries" id="entries"></div>
  </div>
</div>
<script>
let entries=JSON.parse(localStorage.getItem('diary_entries')||'[]');
function render(){
  const el=document.getElementById('entries');
  el.innerHTML=entries.map(e=>'<div class="entry"><div class="entry-date">'+e.date+'</div><div class="entry-text">'+e.text+'</div></div>').join('');
}
function post(){
  const inp=document.getElementById('input');
  if(!inp.value.trim())return;
  entries.unshift({text:inp.value.trim(),date:new Date().toLocaleString('ja-JP')});
  localStorage.setItem('diary_entries',JSON.stringify(entries));
  inp.value='';document.getElementById('cnt').textContent='0/140';render();
}
render();
</script>` + htmlFoot,

    photo_wall: (idea) => appTemplates.diary(idea),
    question: (idea) => appTemplates.diary(idea),
    mood: (idea) => appTemplates.diary(idea),
    bookshelf: (idea) => appTemplates.diary(idea),
    skill_share: (idea) => appTemplates.diary(idea),

    // --- ライフスタイル系 ---
    habit: (idea) => htmlHead(idea.name, `
.habits { margin-top: 16px; }
.habit-row { display: flex; align-items: center; gap: 12px; padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.06); }
.habit-name { flex: 1; font-weight: 600; }
.streak { font-size: 0.8rem; color: #fdcb6e; }
.day-dots { display: flex; gap: 4px; }
.day-dot { width: 24px; height: 24px; border-radius: 6px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); cursor: pointer; font-size: 0.7rem; display: flex; align-items: center; justify-content: center; color: #6b7085; transition: all 0.15s; }
.day-dot.done { background: #6c5ce7; border-color: #6c5ce7; color: white; }
.day-dot:hover { border-color: #a29bfe; }
.add-row { display: flex; gap: 8px; margin-top: 16px; }
.add-row input { flex: 1; }
`) + `
<div class="container">
  <h1>${idea.name}</h1>
  <p class="subtitle">${idea.description}</p>
  <div class="card">
    <div style="display:flex;justify-content:space-between;align-items:center">
      <span style="font-size:0.85rem;color:#9ea3b5">今週の記録</span>
      <span style="font-size:0.85rem;color:#9ea3b5">月 火 水 木 金 土 日</span>
    </div>
    <div class="habits" id="habits"></div>
    <div class="add-row">
      <input type="text" id="newHabit" placeholder="新しい習慣を追加...">
      <button onclick="addHabit()">追加</button>
    </div>
  </div>
</div>
<script>
const days=['月','火','水','木','金','土','日'];
let habits=JSON.parse(localStorage.getItem('habits_data')||'[{"name":"運動","days":[false,false,false,false,false,false,false]},{"name":"読書","days":[false,false,false,false,false,false,false]},{"name":"瞑想","days":[false,false,false,false,false,false,false]}]');
function render(){
  const el=document.getElementById('habits');
  el.innerHTML=habits.map((h,hi)=>{
    const streak=h.days.filter(d=>d).length;
    return '<div class="habit-row"><span class="habit-name">'+h.name+'</span><span class="streak">'+streak+'日</span><div class="day-dots">'+
      h.days.map((d,di)=>'<div class="day-dot'+(d?' done':'')+'" onclick="toggle('+hi+','+di+')">'+days[di]+'</div>').join('')+
      '</div></div>';
  }).join('');
}
function toggle(hi,di){habits[hi].days[di]=!habits[hi].days[di];save();render();}
function addHabit(){const inp=document.getElementById('newHabit');if(!inp.value.trim())return;
  habits.push({name:inp.value.trim(),days:[false,false,false,false,false,false,false]});inp.value='';save();render();}
function save(){localStorage.setItem('habits_data',JSON.stringify(habits));}
render();
</script>` + htmlFoot,

    expense: (idea) => appTemplates.habit(idea),
    meal_log: (idea) => appTemplates.diary(idea),
    water: (idea) => appTemplates.habit(idea),
    declutter: (idea) => appTemplates.habit(idea),
    recipe: (idea) => appTemplates.diary(idea),

    // --- 教育系 ---
    flashcard: (idea) => htmlHead(idea.name, `
.flashcard { perspective: 1000px; width: 100%; max-width: 400px; height: 250px; margin: 20px auto; cursor: pointer; }
.flashcard-inner { position: relative; width: 100%; height: 100%; transition: transform 0.6s; transform-style: preserve-3d; }
.flashcard.flipped .flashcard-inner { transform: rotateY(180deg); }
.flashcard-face { position: absolute; width: 100%; height: 100%; backface-visibility: hidden; border-radius: 16px; display: flex; align-items: center; justify-content: center; padding: 24px; font-size: 1.3rem; text-align: center; }
.flashcard-front { background: linear-gradient(135deg, #6c5ce7, #845ef7); }
.flashcard-back { background: linear-gradient(135deg, #00cec9, #55efc4); color: #333; transform: rotateY(180deg); }
.nav-btns { display: flex; gap: 12px; justify-content: center; margin-top: 16px; }
`) + `
<div class="container">
  <h1>${idea.name}</h1>
  <p class="subtitle">${idea.description}</p>
  <div class="card">
    <p style="text-align:center;color:#9ea3b5;font-size:0.85rem"><span id="cur">1</span> / <span id="total">0</span></p>
    <div class="flashcard" id="fc" onclick="this.classList.toggle('flipped')">
      <div class="flashcard-inner">
        <div class="flashcard-face flashcard-front" id="front">読み込み中...</div>
        <div class="flashcard-face flashcard-back" id="back">...</div>
      </div>
    </div>
    <div class="nav-btns">
      <button onclick="prev()">&#9664; 前へ</button>
      <button onclick="next()">次へ &#9654;</button>
    </div>
  </div>
</div>
<script>
const cards=[
  {q:"HTML",a:"HyperText Markup Language - Webページの構造を定義"},
  {q:"CSS",a:"Cascading Style Sheets - Webページのスタイルを定義"},
  {q:"JavaScript",a:"Webブラウザで動作するプログラミング言語"},
  {q:"API",a:"Application Programming Interface - ソフトウェア間の通信インターフェース"},
  {q:"HTTP",a:"HyperText Transfer Protocol - Web通信のプロトコル"},
  {q:"DOM",a:"Document Object Model - HTMLをオブジェクトとして扱う仕組み"},
  {q:"JSON",a:"JavaScript Object Notation - データ交換フォーマット"},
  {q:"SQL",a:"Structured Query Language - データベース操作言語"},
  {q:"Git",a:"分散型バージョン管理システム"},
  {q:"npm",a:"Node Package Manager - JavaScriptパッケージ管理ツール"},
];
let idx=0;
document.getElementById('total').textContent=cards.length;
function show(){
  document.getElementById('fc').classList.remove('flipped');
  document.getElementById('front').textContent=cards[idx].q;
  document.getElementById('back').textContent=cards[idx].a;
  document.getElementById('cur').textContent=idx+1;
}
function next(){idx=(idx+1)%cards.length;show();}
function prev(){idx=(idx-1+cards.length)%cards.length;show();}
show();
</script>` + htmlFoot,

    typing: (idea) => appTemplates.quiz(idea),
    kanji: (idea) => appTemplates.quiz(idea),
    coding: (idea) => appTemplates.flashcard(idea),
    math: (idea) => appTemplates.quiz(idea),
    vocab: (idea) => appTemplates.flashcard(idea),

    // --- エンタメ系 ---
    fortune: (idea) => htmlHead(idea.name, `
.fortune-card { text-align: center; padding: 32px; }
.fortune-icon { font-size: 5rem; margin: 16px 0; animation: float 3s ease-in-out infinite; }
@keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
.fortune-result { font-size: 2rem; font-weight: 800; margin: 16px 0; }
.fortune-msg { color: #9ea3b5; font-size: 1rem; line-height: 1.8; margin: 16px 0; }
.fortune-detail { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 20px; }
.fortune-item { background: rgba(255,255,255,0.04); border-radius: 10px; padding: 12px; text-align: center; }
.fortune-item-label { font-size: 0.75rem; color: #6b7085; }
.fortune-item-value { font-size: 1rem; font-weight: 600; margin-top: 4px; }
`) + `
<div class="container">
  <h1>${idea.name}</h1>
  <p class="subtitle">${idea.description}</p>
  <div class="card fortune-card" id="fortune">
    <button onclick="divine()" style="font-size:1.1rem;padding:16px 40px">&#128302; 今日の運勢を占う</button>
  </div>
</div>
<script>
const fortunes=[
  {rank:'大吉',icon:'&#127775;',color:'#ffd700',msg:'最高の一日！何をやってもうまくいく。'},
  {rank:'吉',icon:'&#11088;',color:'#00cec9',msg:'良い運気が流れています。チャンスを掴もう。'},
  {rank:'中吉',icon:'&#127808;',color:'#55efc4',msg:'穏やかな一日。小さな幸せを見つけて。'},
  {rank:'小吉',icon:'&#127800;',color:'#74b9ff',msg:'ゆっくりと運気が上昇中。焦らずに。'},
  {rank:'末吉',icon:'&#127772;',color:'#a29bfe',msg:'可能性を秘めた一日。信じる心が大事。'},
  {rank:'凶',icon:'&#127783;',color:'#e17055',msg:'慎重に行動を。でも学びの多い一日。'},
];
const luckItems=['恋愛運','仕事運','金運','健康運'];
const stars=['&#9733;','&#9733;&#9733;','&#9733;&#9733;&#9733;','&#9733;&#9733;&#9733;&#9733;','&#9733;&#9733;&#9733;&#9733;&#9733;'];
const colors=['&#128308;','&#128993;','&#128994;','&#128309;','&#128995;','&#9898;','&#129002;','&#11035;'];
const luckyColors=['赤','黄色','緑','青','紫','白','オレンジ','ピンク'];
function divine(){
  const f=fortunes[Math.floor(Math.random()*fortunes.length)];
  const el=document.getElementById('fortune');
  let details='';
  luckItems.forEach(item=>{
    const s=Math.floor(Math.random()*5);
    details+='<div class="fortune-item"><div class="fortune-item-label">'+item+'</div><div class="fortune-item-value" style="color:'+f.color+'">'+stars[s]+'</div></div>';
  });
  const lc=Math.floor(Math.random()*luckyColors.length);
  el.innerHTML=
    '<div class="fortune-icon">'+f.icon+'</div>'+
    '<div class="fortune-result" style="color:'+f.color+'">'+f.rank+'</div>'+
    '<div class="fortune-msg">'+f.msg+'</div>'+
    '<div class="fortune-detail">'+details+'</div>'+
    '<p style="margin-top:16px;font-size:0.9rem">ラッキーカラー: <span style="color:'+f.color+'">'+luckyColors[lc]+'</span></p>'+
    '<button onclick="divine()" style="margin-top:16px">&#128260; もう一度占う</button>';
}
</script>` + htmlFoot,

    meme: (idea) => appTemplates.fortune(idea),
    nickname: (idea) => htmlHead(idea.name, `
.result-name { font-size: 2.5rem; font-weight: 800; text-align: center; margin: 24px 0; background: linear-gradient(135deg, #a29bfe, #fd79a8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
.name-list { margin-top: 16px; }
.name-item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.06); }
`) + `
<div class="container">
  <h1>${idea.name}</h1>
  <p class="subtitle">${idea.description}</p>
  <div class="card">
    <input type="text" id="nameInput" placeholder="名前を入力..." oninput="generate()">
    <div class="result-name" id="result">ここに表示</div>
    <div class="name-list" id="list"></div>
    <div style="text-align:center;margin-top:16px">
      <button onclick="generate()">&#128260; 再生成</button>
    </div>
  </div>
</div>
<script>
const pre=['スーパー','ミラクル','キング','マスター','レジェンド','シャイニング','ダーク','グレート','ワイルド','エターナル'];
const suf=['マスター','キング','マン','ハンター','ウォーカー','ナイト','スター','セイバー','ブレイカー','ファイター'];
const adj=['最強の','伝説の','光の','闇の','炎の','氷の','雷の','風の','大地の','天空の'];
function hash(s){let h=0;for(let i=0;i<s.length;i++){h=((h<<5)-h)+s.charCodeAt(i);h|=0;}return Math.abs(h);}
function generate(){
  const name=document.getElementById('nameInput').value.trim()||'名無し';
  const h=hash(name);
  const names=[];
  for(let i=0;i<5;i++){
    const seed=h+i*7919;
    const p=pre[(seed)%pre.length];
    const s=suf[(seed*3+i)%suf.length];
    const a=adj[(seed*7+i)%adj.length];
    names.push(i%2===0?p+name+s:a+name);
  }
  document.getElementById('result').textContent=names[0];
  document.getElementById('list').innerHTML=names.slice(1).map((n,i)=>
    '<div class="name-item"><span>候補'+(i+2)+'</span><span style="color:#a29bfe">'+n+'</span></div>'
  ).join('');
}
</script>` + htmlFoot,

    compatibility: (idea) => htmlHead(idea.name, `
.compat-score { font-size: 5rem; font-weight: 800; text-align: center; margin: 20px 0; }
.meter { height: 12px; background: rgba(255,255,255,0.06); border-radius: 99px; overflow: hidden; margin: 16px 0; }
.meter-fill { height: 100%; border-radius: 99px; transition: width 1s cubic-bezier(0.4,0,0.2,1); }
.input-group { display: flex; gap: 12px; margin: 12px 0; align-items: center; }
.input-group input { flex: 1; }
.heart { text-align: center; font-size: 3rem; }
`) + `
<div class="container">
  <h1>${idea.name}</h1>
  <p class="subtitle">${idea.description}</p>
  <div class="card">
    <div class="input-group">
      <input type="text" id="name1" placeholder="名前1">
      <span class="heart">&#10084;</span>
      <input type="text" id="name2" placeholder="名前2">
    </div>
    <div style="text-align:center;margin:16px 0">
      <button onclick="check()">&#128302; 相性を診断</button>
    </div>
    <div id="result" style="display:none">
      <div class="compat-score" id="score"></div>
      <div class="meter"><div class="meter-fill" id="meter" style="width:0"></div></div>
      <p id="msg" style="text-align:center;color:#9ea3b5;font-size:1rem;line-height:1.8"></p>
    </div>
  </div>
</div>
<script>
const msgs={90:'運命的な相性！二人は最高のパートナー。',70:'とても良い相性。お互いを高め合える関係。',50:'良い相性。もう少し歩み寄れば最高に。',30:'まあまあの相性。コミュニケーションが鍵。',0:'正反対だからこそ惹かれ合うかも？'};
function check(){
  const a=document.getElementById('name1').value.trim()||'A';
  const b=document.getElementById('name2').value.trim()||'B';
  let h=0;const s=a+b;
  for(let i=0;i<s.length;i++){h=((h<<5)-h)+s.charCodeAt(i);h|=0;}
  const score=Math.abs(h)%61+40; // 40-100
  document.getElementById('result').style.display='block';
  document.getElementById('score').textContent=score+'%';
  document.getElementById('score').style.color=score>=80?'#00cec9':score>=60?'#a29bfe':'#fdcb6e';
  const m=document.getElementById('meter');
  m.style.width='0';m.style.background='linear-gradient(90deg,#6c5ce7,#fd79a8)';
  setTimeout(()=>{m.style.width=score+'%';},100);
  const key=Object.keys(msgs).reverse().find(k=>score>=parseInt(k));
  document.getElementById('msg').textContent=msgs[key];
}
</script>` + htmlFoot,

    soundboard: (idea) => appTemplates.fortune(idea),
    roulette: (idea) => htmlHead(idea.name, `
.wheel-wrap { position: relative; width: 300px; height: 300px; margin: 20px auto; }
.wheel { width: 100%; height: 100%; border-radius: 50%; border: 4px solid rgba(255,255,255,0.15); transition: transform 3s cubic-bezier(0.17,0.67,0.12,0.99); position: relative; overflow: hidden; }
.slice { position: absolute; width: 50%; height: 50%; left: 50%; top: 50%; transform-origin: 0 0; display: flex; align-items: center; padding-left: 20px; font-size: 0.7rem; font-weight: 600; color: white; }
.pointer { position: absolute; top: -12px; left: 50%; transform: translateX(-50%); font-size: 2rem; z-index: 2; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3)); }
.items-input { margin-top: 16px; }
.items-input textarea { min-height: 80px; }
`) + `
<div class="container">
  <h1>${idea.name}</h1>
  <p class="subtitle">${idea.description}</p>
  <div class="card">
    <div class="pointer">&#9660;</div>
    <div class="wheel-wrap">
      <div class="wheel" id="wheel"></div>
    </div>
    <div id="winner" style="text-align:center;font-size:1.3rem;font-weight:700;margin:12px 0;min-height:2em;color:#ffd700"></div>
    <div style="text-align:center"><button onclick="spin()">&#127922; 回す！</button></div>
    <div class="items-input">
      <label style="font-size:0.85rem;color:#9ea3b5">選択肢（1行ずつ入力）:</label>
      <textarea id="items" oninput="buildWheel()">ラーメン
カレー
寿司
パスタ
焼肉
ピザ</textarea>
    </div>
  </div>
</div>
<script>
const wColors=['#6c5ce7','#00cec9','#fd79a8','#fdcb6e','#e17055','#74b9ff','#55efc4','#a29bfe'];
let rotation=0,spinning=false;
function buildWheel(){
  const items=document.getElementById('items').value.trim().split('\\n').filter(s=>s.trim());
  const w=document.getElementById('wheel');
  w.innerHTML='';
  const angle=360/items.length;
  items.forEach((item,i)=>{
    const d=document.createElement('div');
    d.className='slice';
    d.style.background=wColors[i%wColors.length];
    d.style.transform='rotate('+(-90+angle*i)+'deg) skewY('+(-(90-angle))+'deg)';
    d.textContent=item.trim();
    w.appendChild(d);
  });
}
function spin(){
  if(spinning)return;spinning=true;
  const items=document.getElementById('items').value.trim().split('\\n').filter(s=>s.trim());
  if(items.length<2){spinning=false;return;}
  const extra=1440+Math.floor(Math.random()*720);
  rotation+=extra;
  document.getElementById('wheel').style.transform='rotate('+rotation+'deg)';
  document.getElementById('winner').textContent='...';
  setTimeout(()=>{
    const deg=rotation%360;
    const angle=360/items.length;
    const idx=Math.floor((360-deg)/angle)%items.length;
    document.getElementById('winner').textContent='&#127881; '+items[idx].trim()+' &#127881;';
    spinning=false;
  },3200);
}
buildWheel();
</script>` + htmlFoot,

    // --- ビジネス系 ---
    kanban: (idea) => htmlHead(idea.name, `
.board { display: grid; grid-template-columns: repeat(3,1fr); gap: 12px; }
.column { background: rgba(255,255,255,0.03); border-radius: 12px; padding: 12px; min-height: 300px; }
.column-title { font-size: 0.85rem; font-weight: 700; padding: 8px; border-radius: 8px; text-align: center; margin-bottom: 12px; }
.col-todo .column-title { background: rgba(108,92,231,0.15); color: #a29bfe; }
.col-doing .column-title { background: rgba(253,203,110,0.15); color: #fdcb6e; }
.col-done .column-title { background: rgba(0,206,201,0.15); color: #00cec9; }
.task-card { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 10px; margin-bottom: 8px; font-size: 0.85rem; cursor: grab; transition: all 0.15s; }
.task-card:hover { border-color: #6c5ce7; transform: translateY(-1px); }
.task-card .task-actions { display: flex; gap: 4px; margin-top: 8px; }
.task-card .task-actions button { padding: 2px 8px; font-size: 0.7rem; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; color: #9ea3b5; cursor: pointer; }
.add-task { display: flex; gap: 6px; margin-top: 8px; }
.add-task input { flex: 1; padding: 6px 8px; font-size: 0.8rem; }
.add-task button { padding: 6px 10px; font-size: 0.8rem; }
@media(max-width:600px){ .board{grid-template-columns:1fr;} }
`) + `
<div class="container" style="max-width:800px">
  <h1>${idea.name}</h1>
  <p class="subtitle">${idea.description}</p>
  <div class="board" id="board">
    <div class="column col-todo" data-col="todo">
      <div class="column-title">TODO</div>
      <div class="tasks" id="todo-tasks"></div>
      <div class="add-task"><input id="todo-input" placeholder="新しいタスク..."><button onclick="addTask('todo')">+</button></div>
    </div>
    <div class="column col-doing" data-col="doing">
      <div class="column-title">作業中</div>
      <div class="tasks" id="doing-tasks"></div>
    </div>
    <div class="column col-done" data-col="done">
      <div class="column-title">完了</div>
      <div class="tasks" id="done-tasks"></div>
    </div>
  </div>
</div>
<script>
let tasks=JSON.parse(localStorage.getItem('kanban_tasks')||'{"todo":["企画書を書く","デザインを作成"],"doing":["プロトタイプ開発"],"done":["要件定義"]}');
function render(){
  ['todo','doing','done'].forEach(col=>{
    const el=document.getElementById(col+'-tasks');
    el.innerHTML=(tasks[col]||[]).map((t,i)=>{
      const prev=col==='doing'?'todo':col==='done'?'doing':null;
      const next=col==='todo'?'doing':col==='doing'?'done':null;
      return '<div class="task-card">'+t+'<div class="task-actions">'+
        (next?'<button onclick="move(\\''+col+'\\','+i+',\\''+next+'\\')">&#9654;</button>':'')+
        (prev?'<button onclick="move(\\''+col+'\\','+i+',\\''+prev+'\\')">&#9664;</button>':'')+
        '<button onclick="del(\\''+col+'\\','+i+')">&#128465;</button></div></div>';
    }).join('');
  });
}
function addTask(col){const inp=document.getElementById(col+'-input');if(!inp.value.trim())return;
  tasks[col].push(inp.value.trim());inp.value='';save();render();}
function move(from,idx,to){const t=tasks[from].splice(idx,1)[0];tasks[to].push(t);save();render();}
function del(col,idx){tasks[col].splice(idx,1);save();render();}
function save(){localStorage.setItem('kanban_tasks',JSON.stringify(tasks));}
render();
</script>` + htmlFoot,

    invoice: (idea) => appTemplates.kanban(idea),
    card_reader: (idea) => appTemplates.notepad(idea),
    minutes: (idea) => appTemplates.notepad(idea),
    time_track: (idea) => appTemplates.pomodoro(idea),
    kpi: (idea) => appTemplates.kanban(idea),
  };

  /**
   * アイデアからHTMLアプリコードを生成
   */
  function buildApp(idea) {
    const generator = appTemplates[idea.type];
    if (!generator) {
      // フォールバック: シンプルなランディングページ
      return buildFallback(idea);
    }
    return generator(idea);
  }

  function buildFallback(idea) {
    return htmlHead(idea.name) + `
<div class="container">
  <h1>${idea.name}</h1>
  <p class="subtitle">${idea.description}</p>
  <div class="card">
    <p style="text-align:center;font-size:1.1rem">Coming Soon</p>
    <p style="text-align:center;color:#9ea3b5;margin-top:8px">このアプリは現在開発中です。</p>
    <ul style="margin-top:16px;list-style:none">
      ${idea.features.map(f => `<li style="padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.06);color:#9ea3b5">&#10003; ${f}</li>`).join('')}
    </ul>
  </div>
</div>` + htmlFoot;
  }

  return { buildApp };
})();
