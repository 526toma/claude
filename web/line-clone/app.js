"use strict";

// ── Prevent zoom on double-tap & input focus ──
document.addEventListener("touchstart", (e) => {
  if (e.touches.length > 1) e.preventDefault();
}, { passive: false });

let lastTap = 0;
document.addEventListener("touchend", (e) => {
  const now = Date.now();
  if (now - lastTap < 300) e.preventDefault();
  lastTap = now;
}, { passive: false });

// ── Dummy Data ──
const DUMMY_CHATS = [
  {
    id: "1",
    name: "メモ",
    preview: "ダミーテキストです。メモの内容がここに表示されます。",
    time: "18:51",
    unread: 1,
    color: "#8B4513",
    icon: "🐻",
    mute: false,
    messages: [
      { type: "mine", text: "ダミーテキストです。メモの内容がここに表示されます。", time: "18:51" }
    ]
  },
  {
    id: "2",
    name: "山田 花子",
    preview: "了解です！またよろしくね",
    time: "16:04",
    unread: 0,
    color: "#c0c0c0",
    icon: "🐦",
    mute: false,
    messages: [
      { date: "2/23(月)" },
      { type: "theirs", text: "今日の予定どうする？", time: "16:52" },
      { type: "mine", text: "夕方なら大丈夫だよ", time: "16:55", read: true },
      { date: "3/4(水)" },
      { type: "mine", text: "先週の件、確認できた？", time: "14:20", read: true },
      { date: "昨日" },
      { type: "mine", text: "もし時間あれば教えてね", time: "10:57", read: true },
      { type: "mine", text: "急がないから大丈夫だよ", time: "10:57", read: true },
      { type: "theirs", text: "明日確認してみます！", time: "11:48" },
      { date: "今日" },
      { type: "mine", isFile: true, fileName: "資料_20260306.pdf", fileMeta: "有効期間：〜3/13 16:03　サイズ：104.58 kB", time: "16:03", read: true },
      { type: "mine", text: "これ見ておいてもらえると助かります", time: "16:04", read: true },
      { type: "mine", text: "了解です！またよろしくね", time: "16:04", read: true }
    ]
  },
  {
    id: "3",
    name: "〇〇市 公式",
    preview: "【お知らせ】春のイベントを開催します。詳細はこちらをご確認ください…",
    time: "15:00",
    unread: 0,
    color: "#1a5fb4",
    icon: "🏙",
    mute: true,
    messages: [
      { date: "今日" },
      { type: "theirs", text: "【お知らせ】春のイベントを開催します。【開催日時】2026年3月20日(土)〜21日(日) 10:00〜20:00。詳細はホームページをご覧ください。", time: "15:00" }
    ]
  },
  {
    id: "4",
    name: "△△商店街グループ",
    preview: "田中さんが写真を送信しました",
    time: "13:50",
    unread: 148,
    color: "#e74c3c",
    icon: "🎭",
    mute: false,
    messages: [
      { date: "今日" },
      { type: "theirs", senderName: "田中さん", text: "写真を送信しました", time: "13:50" }
    ]
  },
  {
    id: "5",
    name: "鈴木 さん",
    preview: "今日は朝から雨だね。 明日は晴れるといいな。 また連絡します。…",
    time: "13:39",
    unread: 0,
    color: "#7f8c8d",
    icon: "🚐",
    mute: true,
    messages: [
      { date: "今日" },
      { type: "theirs", text: "今日は朝から雨だね。\n明日は晴れるといいな。\nまた連絡します。", time: "13:39" }
    ]
  },
  {
    id: "6",
    name: "〇〇スポーツクラブ",
    preview: "〇〇スポーツクラブが写真を送信しました",
    time: "7:30",
    unread: 0,
    color: "#2d5a1b",
    icon: "⛰",
    mute: false,
    messages: [
      { date: "今日" },
      { type: "theirs", text: "〇〇スポーツクラブが写真を送信しました", time: "7:30" }
    ]
  },
  {
    id: "7",
    name: "友人A",
    preview: "また今度ゆっくり話そうね！",
    time: "昨日",
    unread: 0,
    color: "#27ae60",
    icon: "🏡",
    mute: true,
    messages: [
      { date: "昨日" },
      { type: "theirs", text: "また今度ゆっくり話そうね！", time: "20:00" }
    ]
  },
  {
    id: "8",
    name: "佐藤 太郎",
    preview: "",
    time: "昨日",
    unread: 0,
    color: "#8e44ad",
    icon: "👟",
    mute: false,
    messages: [
      { date: "昨日" },
      { type: "mine", text: "よろしく！", time: "18:00", read: true }
    ]
  }
];

// ── Avatar colors ──
const AVATAR_COLORS = ["#e74c3c","#e67e22","#f1c40f","#2ecc71","#1abc9c","#3498db","#9b59b6","#e91e63","#00bcd4","#8bc34a"];
function strColor(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

// ── Render chat list ──
function renderChatList() {
  const el = document.getElementById("chat-list");
  el.innerHTML = "";
  DUMMY_CHATS.forEach(chat => {
    const row = document.createElement("div");
    row.className = "chat-row";
    row.onclick = () => openChat(chat.id);

    const bg = chat.color || strColor(chat.name);
    const initial = chat.name[0];
    const unreadHTML = chat.unread > 0
      ? `<div class="unread-badge">${chat.unread > 99 ? "99+" : chat.unread}</div>` : "";
    const muteHTML = chat.mute
      ? `<span class="chat-mute"><svg viewBox="0 0 24 24" fill="none"><path d="M11 5L6 9H2v6h4l5 4V5zM23 9l-6 6M17 9l6 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span>` : "";

    row.innerHTML = `
      <div class="chat-avatar-wrap">
        <div class="chat-avatar" style="background:${bg}">${initial}</div>
        ${unreadHTML}
      </div>
      <div class="chat-body">
        <div class="chat-name-row">
          <span class="chat-name">${chat.name}</span>${muteHTML}
        </div>
        <div class="chat-preview">${chat.preview}</div>
      </div>
      <div class="chat-time">${chat.time}</div>
    `;
    el.appendChild(row);
  });
}

// ── Open chat ──
let currentChatId = null;

window.openChat = (id) => {
  currentChatId = id;
  const chat = DUMMY_CHATS.find(c => c.id === id);
  if (!chat) return;

  document.getElementById("chat-header-name").textContent = chat.name;
  renderMessages(chat);

  // リスト画面を左にずらしながらチャットを開く（LINEライクなアニメーション）
  const listScreen = document.getElementById("screen-list");
  listScreen.classList.add("push-left");
  listScreen.style.visibility = "hidden";
  document.getElementById("screen-chat").classList.add("open");
  // Scroll to bottom
  setTimeout(() => {
    const area = document.getElementById("messages-area");
    area.scrollTop = area.scrollHeight;
  }, 50);
};

window.closeChat = () => {
  // 閉じる前にリスト画面を元の位置に戻す（アニメーションと同期）
  const listScreen = document.getElementById("screen-list");
  listScreen.style.visibility = "";
  listScreen.classList.remove("push-left");
  document.getElementById("screen-chat").classList.remove("open");
  currentChatId = null;
};

// ── Render messages ──
function renderMessages(chat) {
  const area = document.getElementById("messages-area");
  area.innerHTML = "";
  const bg = chat.color || strColor(chat.name);
  const initial = chat.name[0];

  chat.messages.forEach(msg => {
    if (msg.date) {
      const sep = document.createElement("div");
      sep.className = "date-sep";
      sep.innerHTML = `<span>${msg.date}</span>`;
      area.appendChild(sep);
      return;
    }

    const row = document.createElement("div");
    row.className = `msg-row ${msg.type}`;

    const readHTML = (msg.type === "mine" && msg.read) ? `<span class="msg-read">既読</span>` : "";
    const timeHTML = `<span>${msg.time || ""}</span>`;
    const metaHTML = `<div class="msg-meta">${readHTML}${timeHTML}</div>`;

    if (msg.type === "theirs") {
      // Show avatar only if no senderName grouping needed (simplified)
      const avatarHTML = `<div class="msg-sender-avatar" style="background:${bg}">${initial}</div>`;
      const senderNameHTML = msg.senderName ? `<div class="msg-sender-name">${msg.senderName}</div>` : "";

      let bubbleHTML;
      if (msg.isFile) {
        bubbleHTML = `
          <div class="msg-bubble">
            <div class="msg-file">
              <div class="msg-file-icon">
                <svg viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" stroke-width="1.8"/><path d="M14 2v6h6" stroke="currentColor" stroke-width="1.8"/></svg>
              </div>
              <div class="msg-file-info">
                <span class="msg-file-name">${msg.fileName}</span>
                <span class="msg-file-meta">${msg.fileMeta || ""}</span>
              </div>
            </div>
          </div>`;
      } else {
        bubbleHTML = `<div class="msg-bubble">${escHtml(msg.text || "")}</div>`;
      }
      row.innerHTML = `${avatarHTML}<div class="msg-content">${senderNameHTML}${bubbleHTML}${metaHTML}</div>`;
    } else {
      // mine
      let bubbleHTML;
      if (msg.isFile) {
        bubbleHTML = `
          <div class="msg-bubble">
            <div class="msg-file">
              <div class="msg-file-icon">
                <svg viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="red" stroke-width="1.8"/><path d="M14 2v6h6" stroke="red" stroke-width="1.8"/></svg>
              </div>
              <div class="msg-file-info">
                <span class="msg-file-name">${msg.fileName}</span>
                <span class="msg-file-meta">${msg.fileMeta || ""}</span>
              </div>
            </div>
          </div>`;
      } else {
        bubbleHTML = `<div class="msg-bubble">${escHtml(msg.text || "").replace(/\n/g, "<br>")}</div>`;
      }
      row.innerHTML = `<div class="msg-content">${bubbleHTML}${metaHTML}</div>`;
    }

    area.appendChild(row);
  });
}

// ── Send message (dummy) ──
window.sendMessage = () => {
  const input = document.getElementById("input-text");
  const text = input.innerText.trim();
  if (!text || !currentChatId) return;

  const chat = DUMMY_CHATS.find(c => c.id === currentChatId);
  if (!chat) return;

  const now = new Date();
  const time = `${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}`;
  chat.messages.push({ type: "mine", text, time, read: false });
  chat.preview = text;
  chat.time = time;

  input.innerText = "";
  renderMessages(chat);
  renderChatList();

  setTimeout(() => {
    const area = document.getElementById("messages-area");
    area.scrollTop = area.scrollHeight;
  }, 30);
};

// Enter to send
document.getElementById("input-text").addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

// ── Nav switch (stub) ──
window.switchNav = (tab) => {
  document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
  event.currentTarget.classList.add("active");
};

// ── Utility ──
function escHtml(s) {
  return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

// ── Visual Viewport (iOS keyboard fix) ──
// iOSでキーボードが開くと visual viewport が縮小するため、
// チャット画面の top/height を visual viewport に合わせて動的に調整する
(function () {
  const vv = window.visualViewport;
  if (!vv) return;

  const chatScreen = document.getElementById("screen-chat");

  function adjust() {
    chatScreen.style.top = vv.offsetTop + "px";
    chatScreen.style.height = vv.height + "px";
    chatScreen.style.bottom = "auto";
    const area = document.getElementById("messages-area");
    area.scrollTop = area.scrollHeight;
  }

  function reset() {
    chatScreen.style.top = "";
    chatScreen.style.height = "";
    chatScreen.style.bottom = "";
  }

  vv.addEventListener("resize", () => {
    if (chatScreen.classList.contains("open")) adjust();
    else reset();
  });
  vv.addEventListener("scroll", () => {
    if (chatScreen.classList.contains("open")) adjust();
  });
})();

// ── Init ──
renderChatList();
