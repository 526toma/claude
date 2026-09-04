"use strict";

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

/* ══════════════ Firebase 初期化 ══════════════ */
const firebaseConfig = {
  apiKey: "AIzaSyDBXAHJ0XOxM0Hp633izVu59BRvIwkxoLI",
  authDomain: "grumpy-5ebb2.firebaseapp.com",
  projectId: "grumpy-5ebb2",
  storageBucket: "grumpy-5ebb2.firebasestorage.app",
  messagingSenderId: "130090012669",
  appId: "1:130090012669:web:d27d76ca7b18c07fa71394",
  measurementId: "G-54WY262X3S"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

/* ══════════════ 状態 ══════════════ */
let me = null;                 // { uid, name, email }
let chats = [];                // 参加中のトーク一覧
let unsubChats = null;         // トーク一覧の購読解除
let unsubMessages = null;      // メッセージの購読解除
let unsubRoomDoc = null;       // トークルーム本体の購読解除
let room = null;               // { chatId, partner: {uid, name} , lastRead: {} }

const $ = (id) => document.getElementById(id);

/* ══════════════ 小さなユーティリティ ══════════════ */
const AVATAR_COLORS = ["#06c755", "#3aa3ff", "#ff9500", "#f0629b", "#7c6cff", "#00b8b8", "#ef5350", "#5c8a5c"];

function colorOf(key = "") {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function initialOf(name = "") {
  const s = name.trim();
  return s ? [...s][0].toUpperCase() : "?";
}

function paintAvatar(el, name, uid) {
  el.textContent = initialOf(name);
  el.style.background = colorOf(uid || name);
}

function avatarHTML(name, uid, cls = "avatar") {
  return `<div class="${cls}" style="background:${colorOf(uid || name)}">${esc(initialOf(name))}</div>`;
}

function esc(s = "") {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function toDate(ts) {
  if (!ts) return null;
  return typeof ts.toDate === "function" ? ts.toDate() : new Date(ts);
}

function hhmm(d) {
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** 一覧に出す時刻表記（今日なら時刻、昨日なら「昨日」、それ以前は日付） */
function listTime(d) {
  if (!d) return "";
  const now = new Date();
  const day = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = (day(now) - day(d)) / 86400000;
  if (diff === 0) return hhmm(d);
  if (diff === 1) return "昨日";
  if (diff < 365) return `${d.getMonth() + 1}/${d.getDate()}`;
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}

/** 日付区切りのラベル */
function dateLabel(d) {
  const now = new Date();
  const day = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = (day(now) - day(d)) / 86400000;
  if (diff === 0) return "今日";
  if (diff === 1) return "昨日";
  const w = "日月火水木金土"[d.getDay()];
  return `${d.getMonth() + 1}/${d.getDate()}(${w})`;
}

function showToast(msg) {
  const el = $("toast");
  el.textContent = msg;
  el.classList.remove("hidden");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => el.classList.add("hidden"), 2000);
}

function showScreen(id) {
  document.querySelectorAll(".screen").forEach((s) => s.classList.toggle("active", s.id === id));
}

/* ══════════════ 認証 ══════════════ */
document.querySelectorAll(".seg-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const mode = btn.dataset.mode;
    document.querySelectorAll(".seg-btn").forEach((b) => b.classList.toggle("active", b === btn));
    $("form-login").classList.toggle("hidden", mode !== "login");
    $("form-register").classList.toggle("hidden", mode !== "register");
    $("auth-error").textContent = "";
  });
});

function authError(code) {
  const map = {
    "auth/invalid-email": "メールアドレスの形式が正しくありません",
    "auth/user-not-found": "ユーザーが見つかりません",
    "auth/wrong-password": "パスワードが違います",
    "auth/invalid-credential": "メールアドレスまたはパスワードが違います",
    "auth/email-already-in-use": "このメールアドレスは登録済みです",
    "auth/weak-password": "パスワードは6文字以上にしてください",
    "auth/too-many-requests": "試行回数が多すぎます。少し待ってからお試しください",
    "auth/network-request-failed": "ネットワークエラーです",
    "auth/operation-not-allowed": "メール/パスワード認証が Firebase で有効になっていません"
  };
  return map[code] || "エラーが発生しました";
}

$("form-login").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = $("login-email").value.trim();
  const password = $("login-password").value;
  if (!email || !password) return ($("auth-error").textContent = "メールとパスワードを入力してください");
  const btn = e.target.querySelector("button");
  btn.disabled = true;
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (err) {
    $("auth-error").textContent = authError(err.code);
  } finally {
    btn.disabled = false;
  }
});

$("form-register").addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = $("reg-name").value.trim();
  const email = $("reg-email").value.trim();
  const password = $("reg-password").value;
  if (!name || !email || !password) return ($("auth-error").textContent = "すべての項目を入力してください");
  const btn = e.target.querySelector("button");
  btn.disabled = true;
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });
    await setDoc(doc(db, "users", cred.user.uid), {
      uid: cred.user.uid,
      name,
      email,
      createdAt: serverTimestamp()
    });
  } catch (err) {
    $("auth-error").textContent = authError(err.code);
  } finally {
    btn.disabled = false;
  }
});

$("btn-logout").addEventListener("click", async () => {
  cleanup();
  await signOut(auth);
});

function cleanup() {
  if (unsubChats) unsubChats(), (unsubChats = null);
  if (unsubMessages) unsubMessages(), (unsubMessages = null);
  if (unsubRoomDoc) unsubRoomDoc(), (unsubRoomDoc = null);
  chats = [];
  room = null;
}

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    cleanup();
    me = null;
    showScreen("screen-auth");
    return;
  }
  // プロフィールを取得（未作成なら作る）
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    me = { uid: user.uid, ...snap.data() };
  } else {
    me = { uid: user.uid, name: user.displayName || (user.email || "").split("@")[0], email: user.email };
    await setDoc(ref, { ...me, createdAt: serverTimestamp() });
  }
  renderMe();
  watchChats();
  switchTab("chats");
  showScreen("screen-main");
});

/* ══════════════ タブ切り替え ══════════════ */
const TAB_TITLE = { friends: "友だち", chats: "トーク", me: "設定" };

function switchTab(name) {
  document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("active", t.dataset.tab === name));
  $("view-friends").classList.toggle("hidden", name !== "friends");
  $("view-chats").classList.toggle("hidden", name !== "chats");
  $("view-me").classList.toggle("hidden", name !== "me");
  $("main-title").textContent = TAB_TITLE[name];
  if (name === "friends") loadFriends();
}

document.querySelectorAll(".tab").forEach((t) => {
  t.addEventListener("click", () => switchTab(t.dataset.tab));
});

/* ══════════════ 設定タブ ══════════════ */
function renderMe() {
  paintAvatar($("me-avatar"), me.name, me.uid);
  $("me-name").textContent = me.name;
  $("me-email").textContent = me.email || "";
  $("edit-name").value = me.name;
}

$("btn-save-name").addEventListener("click", async () => {
  const name = $("edit-name").value.trim();
  if (!name) return showToast("名前を入力してください");
  if (name === me.name) return;
  await updateDoc(doc(db, "users", me.uid), { name });
  if (auth.currentUser) await updateProfile(auth.currentUser, { displayName: name });
  me.name = name;
  renderMe();
  showToast("表示名を変更しました");
});

/* ══════════════ 友だち（全ユーザー）一覧 ══════════════ */
let friendCache = [];

async function loadFriends() {
  const list = $("friend-list");
  if (!friendCache.length) list.innerHTML = `<div class="empty">読み込み中…</div>`;
  const snap = await getDocs(query(collection(db, "users"), orderBy("createdAt", "desc"), limit(200)));
  friendCache = snap.docs.map((d) => d.data()).filter((u) => u.uid !== me.uid);
  renderFriends();
}

function renderFriends() {
  const kw = $("friend-search").value.trim().toLowerCase();
  const items = kw
    ? friendCache.filter((u) => (u.name || "").toLowerCase().includes(kw) || (u.email || "").toLowerCase().includes(kw))
    : friendCache;

  const list = $("friend-list");
  if (!items.length) {
    list.innerHTML = `<div class="empty"><p>${kw ? "見つかりませんでした" : "ほかのユーザーがいません"}</p><p class="empty-sub">別の端末で新規登録すると、ここに表示されます</p></div>`;
    return;
  }
  list.innerHTML = items
    .map(
      (u) => `
      <div class="row" data-uid="${esc(u.uid)}" data-name="${esc(u.name || "")}">
        ${avatarHTML(u.name, u.uid)}
        <div class="row-body">
          <div class="row-top"><span class="row-name">${esc(u.name || "名前なし")}</span></div>
          <div class="row-sub">${esc(u.email || "")}</div>
        </div>
      </div>`
    )
    .join("");
  list.querySelectorAll(".row").forEach((el) => {
    el.addEventListener("click", () => openRoom(el.dataset.uid, el.dataset.name));
  });
}

$("friend-search").addEventListener("input", renderFriends);

/* ══════════════ トーク一覧 ══════════════ */
function chatIdFor(a, b) {
  return [a, b].sort().join("__");
}

function partnerOf(chat) {
  const uid = (chat.members || []).find((m) => m !== me.uid) || me.uid;
  const info = (chat.memberInfo || {})[uid] || {};
  return { uid, name: info.name || "名前なし" };
}

function isUnread(chat) {
  if (!chat.lastMessageAt || chat.lastSenderId === me.uid) return false;
  const read = toDate((chat.lastRead || {})[me.uid]);
  return !read || toDate(chat.lastMessageAt) > read;
}

function watchChats() {
  if (unsubChats) unsubChats();
  const q = query(collection(db, "chats"), where("members", "array-contains", me.uid));
  unsubChats = onSnapshot(
    q,
    (snap) => {
      chats = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((c) => c.lastMessageAt)
        .sort((a, b) => (toDate(b.lastMessageAt) || 0) - (toDate(a.lastMessageAt) || 0));
      renderChats();
    },
    (err) => {
      console.error(err);
      $("chat-list").innerHTML = `<div class="empty"><p>トークを読み込めませんでした</p><p class="empty-sub">${esc(err.message)}</p></div>`;
    }
  );
}

function renderChats() {
  const list = $("chat-list");
  $("chat-empty").classList.toggle("hidden", chats.length > 0);

  list.innerHTML = chats
    .map((c) => {
      const p = partnerOf(c);
      const unread = isUnread(c);
      const preview = c.lastSenderId === me.uid ? `あなた: ${c.lastMessage || ""}` : c.lastMessage || "";
      return `
        <div class="row" data-uid="${esc(p.uid)}" data-name="${esc(p.name)}">
          ${avatarHTML(p.name, p.uid)}
          <div class="row-body">
            <div class="row-top">
              <span class="row-name">${esc(p.name)}</span>
              <span class="row-time">${esc(listTime(toDate(c.lastMessageAt)))}</span>
            </div>
            <div class="row-sub ${unread ? "unread" : ""}">${esc(preview)}</div>
          </div>
          ${unread ? `<span class="badge"></span>` : ""}
        </div>`;
    })
    .join("");

  list.querySelectorAll(".row").forEach((el) => {
    el.addEventListener("click", () => openRoom(el.dataset.uid, el.dataset.name));
  });

  $("tab-badge").classList.toggle("hidden", !chats.some(isUnread));
}

/* ══════════════ トークルーム ══════════════ */
async function openRoom(partnerUid, partnerName) {
  const chatId = chatIdFor(me.uid, partnerUid);
  room = { chatId, partner: { uid: partnerUid, name: partnerName }, lastRead: {} };

  $("room-title").textContent = partnerName;
  paintAvatar($("room-avatar"), partnerName, partnerUid);
  $("messages").innerHTML = "";
  $("input-msg").value = "";
  autoGrow();
  updateSendState();
  showScreen("screen-room");

  // トーク本体を用意（自分の情報は毎回最新にしておく）
  await setDoc(
    doc(db, "chats", chatId),
    {
      members: [me.uid, partnerUid].sort(),
      memberInfo: {
        [me.uid]: { name: me.name, email: me.email || "" },
        [partnerUid]: { name: partnerName }
      },
      updatedAt: serverTimestamp()
    },
    { merge: true }
  ).catch((e) => console.error(e));

  watchRoomDoc(chatId);
  watchMessages(chatId);
  markRead(chatId);
}

function watchRoomDoc(chatId) {
  if (unsubRoomDoc) unsubRoomDoc();
  unsubRoomDoc = onSnapshot(doc(db, "chats", chatId), (snap) => {
    if (!room || room.chatId !== chatId || !snap.exists()) return;
    const data = snap.data();
    room.lastRead = data.lastRead || {};
    const info = (data.memberInfo || {})[room.partner.uid];
    if (info && info.name && info.name !== room.partner.name) {
      room.partner.name = info.name;
      $("room-title").textContent = info.name;
      paintAvatar($("room-avatar"), info.name, room.partner.uid);
    }
    renderMessages();
  });
}

let messageCache = [];

function watchMessages(chatId) {
  if (unsubMessages) unsubMessages();
  messageCache = [];
  const q = query(collection(db, "chats", chatId, "messages"), orderBy("createdAt", "asc"), limit(300));
  unsubMessages = onSnapshot(
    q,
    (snap) => {
      if (!room || room.chatId !== chatId) return;
      // 送信直後は createdAt が未確定（null）になるため、末尾に来るように並べ直す
      messageCache = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => {
          const ta = toDate(a.createdAt);
          const tb = toDate(b.createdAt);
          return (ta ? ta.getTime() : Infinity) - (tb ? tb.getTime() : Infinity);
        });
      renderMessages();
      scrollToBottom();
      markRead(chatId);
    },
    (err) => {
      console.error(err);
      showToast("メッセージを読み込めませんでした");
    }
  );
}

function renderMessages() {
  const box = $("messages");
  if (!messageCache.length) {
    box.innerHTML = `<div class="empty"><p>まだメッセージがありません</p><p class="empty-sub">最初のメッセージを送ってみましょう</p></div>`;
    return;
  }

  const partnerRead = toDate((room.lastRead || {})[room.partner.uid]);
  let lastDay = "";
  let prevSender = null;
  let prevTime = 0;
  const html = [];

  messageCache.forEach((m) => {
    const d = toDate(m.createdAt) || new Date();
    const day = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (day !== lastDay) {
      html.push(`<div class="date-sep"><span>${esc(dateLabel(d))}</span></div>`);
      lastDay = day;
      prevSender = null;
    }

    const mine = m.senderId === me.uid;
    const sameRun = prevSender === m.senderId && d.getTime() - prevTime < 5 * 60 * 1000;
    const read = mine && partnerRead && d <= partnerRead;

    const avatar = mine
      ? ""
      : sameRun
      ? `<div class="msg-avatar spacer"></div>`
      : avatarHTML(room.partner.name, room.partner.uid, "avatar msg-avatar");

    html.push(`
      <div class="msg ${mine ? "mine" : "theirs"} ${sameRun ? "" : "gap"}">
        ${avatar}
        <div class="msg-col">
          <div class="bubble">${esc(m.text || "")}</div>
        </div>
        <div class="msg-meta">
          ${read ? `<span class="msg-read">既読</span>` : ""}
          <span class="msg-time">${esc(hhmm(d))}</span>
        </div>
      </div>`);

    prevSender = m.senderId;
    prevTime = d.getTime();
  });

  box.innerHTML = html.join("");
}

function scrollToBottom() {
  const box = $("messages");
  requestAnimationFrame(() => {
    box.scrollTop = box.scrollHeight;
  });
}

async function markRead(chatId) {
  try {
    await updateDoc(doc(db, "chats", chatId), { [`lastRead.${me.uid}`]: serverTimestamp() });
  } catch (e) {
    /* トーク未作成などは無視 */
  }
}

$("btn-back").addEventListener("click", closeRoom);

function closeRoom() {
  if (unsubMessages) unsubMessages(), (unsubMessages = null);
  if (unsubRoomDoc) unsubRoomDoc(), (unsubRoomDoc = null);
  room = null;
  messageCache = [];
  switchTab("chats");
  showScreen("screen-main");
}

/* ══════════════ 送信 ══════════════ */
const input = $("input-msg");

function autoGrow() {
  input.style.height = "auto";
  input.style.height = Math.min(input.scrollHeight, 110) + "px";
}

function updateSendState() {
  $("btn-send").disabled = !input.value.trim();
}

input.addEventListener("input", () => {
  autoGrow();
  updateSendState();
});

let composing = false;
input.addEventListener("compositionstart", () => (composing = true));
input.addEventListener("compositionend", () => (composing = false));
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey && !composing) {
    e.preventDefault();
    $("form-send").requestSubmit();
  }
});

$("form-send").addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text || !room) return;

  const { chatId, partner } = room;
  input.value = "";
  autoGrow();
  updateSendState();

  try {
    await addDoc(collection(db, "chats", chatId, "messages"), {
      text,
      senderId: me.uid,
      senderName: me.name,
      createdAt: serverTimestamp()
    });
    await setDoc(
      doc(db, "chats", chatId),
      {
        members: [me.uid, partner.uid].sort(),
        memberInfo: {
          [me.uid]: { name: me.name, email: me.email || "" },
          [partner.uid]: { name: partner.name }
        },
        lastMessage: text.length > 60 ? text.slice(0, 60) + "…" : text,
        lastSenderId: me.uid,
        lastMessageAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );
  } catch (err) {
    console.error(err);
    input.value = text;
    autoGrow();
    updateSendState();
    showToast("送信できませんでした");
  }
});

/* ══════════════ 端末まわりの微調整 ══════════════ */
// ダブルタップによる拡大を抑止
let lastTap = 0;
document.addEventListener(
  "touchend",
  (e) => {
    const now = Date.now();
    if (now - lastTap < 300) e.preventDefault();
    lastTap = now;
  },
  { passive: false }
);

// キーボード表示でレイアウトが崩れないように
if (window.visualViewport) {
  window.visualViewport.addEventListener("resize", () => {
    if (room) scrollToBottom();
  });
}
