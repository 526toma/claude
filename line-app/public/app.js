import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  onSnapshot,
  addDoc,
  query,
  orderBy,
  serverTimestamp,
  updateDoc,
  limit,
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

const firebaseConfig = {
  apiKey: "AIzaSyDBXAHJ0XOxM0Hp633izVu59BRvIwkxoLI",
  authDomain: "grumpy-5ebb2.firebaseapp.com",
  projectId: "grumpy-5ebb2",
  storageBucket: "grumpy-5ebb2.firebasestorage.app",
  messagingSenderId: "130090012669",
  appId: "1:130090012669:web:d27d76ca7b18c07fa71394",
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

// ===== State =====
let myId    = localStorage.getItem('chatUserId');
let myName  = localStorage.getItem('chatUserName');
let myColor = localStorage.getItem('chatUserColor');
let activeContact = null;
let unsubscribeMessages = null;
let unreadCounts = {};
let lastMsgCache = {};

const COLORS = ['#FF6B6B','#4ECDC4','#45B7D1','#96CEB4','#FF8C42','#A78BFA','#F59E0B','#10B981'];

function randomColor() { return COLORS[Math.floor(Math.random() * COLORS.length)]; }
function generateId()  { return Math.random().toString(36).slice(2,9) + Date.now().toString(36); }
function chatId(a, b)  { return [a, b].sort().join('__'); }
function initials(name){ return name.slice(0, 2); }
function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function formatTime(ts) {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
}

// ===== Login =====
const loginModal = document.getElementById('loginModal');
const mainApp    = document.getElementById('mainApp');
const nameInput  = document.getElementById('nameInput');
const startBtn   = document.getElementById('startBtn');

if (myId && myName) {
  showApp();
} else {
  loginModal.style.display = 'flex';
}

startBtn.addEventListener('click', login);
nameInput.addEventListener('keydown', e => { if (e.key === 'Enter') login(); });

async function login() {
  const name = nameInput.value.trim();
  if (!name) { nameInput.focus(); return; }

  myId    = generateId();
  myName  = name;
  myColor = randomColor();

  localStorage.setItem('chatUserId',    myId);
  localStorage.setItem('chatUserName',  myName);
  localStorage.setItem('chatUserColor', myColor);

  await setDoc(doc(db, 'users', myId), {
    name: myName, color: myColor, lastSeen: serverTimestamp(), online: true,
  });
  showApp();
}

function showApp() {
  loginModal.style.display = 'none';
  mainApp.style.display    = 'flex';

  document.getElementById('myName').textContent = myName;

  setDoc(doc(db, 'users', myId), {
    name: myName, color: myColor, lastSeen: serverTimestamp(), online: true,
  }, { merge: true });

  window.addEventListener('beforeunload', () => {
    updateDoc(doc(db, 'users', myId), { online: false }).catch(() => {});
  });

  listenUsers();
  setupSearch();
}

// ===== User list =====
function listenUsers() {
  onSnapshot(collection(db, 'users'), (snap) => {
    const users = [];
    snap.forEach(d => { if (d.id !== myId) users.push({ id: d.id, ...d.data() }); });
    renderContacts(users);
  });
}

function renderContacts(users) {
  const list = document.getElementById('contactList');
  if (users.length === 0) {
    list.innerHTML = '<li class="contact-empty">他のユーザーがいません</li>';
    return;
  }
  list.innerHTML = '';
  users.forEach(u => {
    const lastMsg = lastMsgCache[u.id] || {};
    const unread  = unreadCounts[u.id] || 0;
    const isActive = activeContact?.id === u.id;

    const li = document.createElement('li');
    li.className = 'contact-item' + (isActive ? ' active' : '');
    li.dataset.id = u.id;
    li.innerHTML = `
      <div class="contact-avatar-wrap">
        <div class="avatar" style="background:${u.color || '#888'}">${initials(u.name)}</div>
        <span class="status-dot ${u.online ? 'online' : 'offline'}"></span>
      </div>
      <div class="contact-info">
        <div class="contact-name">${escapeHtml(u.name)}</div>
        <div class="contact-last-msg">${lastMsg.text ? escapeHtml(lastMsg.text) : 'トークを始めよう'}</div>
      </div>
      <div class="contact-meta">
        <span class="contact-time">${formatTime(lastMsg.ts) || ''}</span>
        ${unread ? `<span class="unread-badge">${unread}</span>` : ''}
      </div>
    `;
    li.addEventListener('click', () => openChat(u));
    list.appendChild(li);
  });
}

// ===== Open chat =====
function openChat(contact) {
  activeContact = contact;
  unreadCounts[contact.id] = 0;

  if (unsubscribeMessages) { unsubscribeMessages(); unsubscribeMessages = null; }

  document.querySelectorAll('.contact-item').forEach(el => el.classList.remove('active'));
  const li = document.querySelector(`.contact-item[data-id="${contact.id}"]`);
  if (li) li.classList.add('active');

  // Mobile: slide to chat view
  mainApp.classList.add('chat-open');

  const chatArea = document.getElementById('chatArea');
  chatArea.innerHTML = `
    <div class="chat-header">
      <button class="back-btn icon-btn" id="backBtn">‹</button>
      <div class="avatar" style="background:${contact.color || '#888'}">${initials(contact.name)}</div>
      <div class="chat-header-info">
        <div class="chat-header-name">${escapeHtml(contact.name)}</div>
        <div class="chat-header-status ${contact.online ? 'online' : 'offline'}">${contact.online ? 'オンライン' : 'オフライン'}</div>
      </div>
    </div>
    <div class="messages" id="messages">
      <div class="date-divider">今日</div>
    </div>
    <div class="chat-input-area">
      <button class="input-btn">😊</button>
      <textarea class="msg-input" id="msgInput" placeholder="メッセージを入力..." rows="1"></textarea>
      <button class="send-btn" id="sendBtn" disabled>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
        </svg>
      </button>
    </div>
  `;

  // Back button (mobile)
  document.getElementById('backBtn').addEventListener('click', () => {
    mainApp.classList.remove('chat-open');
    activeContact = null;
    if (unsubscribeMessages) { unsubscribeMessages(); unsubscribeMessages = null; }
    chatArea.innerHTML = `<div class="no-chat-selected"><div class="no-chat-icon">💬</div><p>トークを選択してください</p></div>`;
    document.querySelectorAll('.contact-item').forEach(el => el.classList.remove('active'));
  });

  // Keep references in closure to avoid getElementById timing issues
  const input   = document.getElementById('msgInput');
  const sendBtn = document.getElementById('sendBtn');

  // Send handler defined here using closure references
  function doSend() {
    const text = input.value.trim();
    if (!text) return;

    // Clear input immediately
    input.value = '';
    input.style.height = 'auto';
    sendBtn.disabled = true;

    const cid = chatId(myId, contact.id);
    addDoc(collection(db, 'chats', cid, 'messages'), {
      from: myId,
      fromName: myName,
      text,
      timestamp: serverTimestamp(),
    });
  }

  input.addEventListener('input', () => {
    sendBtn.disabled = !input.value.trim();
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 120) + 'px';
  });

  let isComposing = false;
  input.addEventListener('compositionstart', () => { isComposing = true; });
  input.addEventListener('compositionend',   () => { isComposing = false; });
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey && !isComposing) { e.preventDefault(); doSend(); }
  });

  sendBtn.addEventListener('click', doSend);

  // Listen to messages
  const cid = chatId(myId, contact.id);
  const q = query(collection(db, 'chats', cid, 'messages'), orderBy('timestamp'), limit(100));

  unsubscribeMessages = onSnapshot(q, (snap) => {
    const messagesEl = document.getElementById('messages');
    if (!messagesEl) return;
    snap.docChanges().forEach(change => {
      if (change.type === 'added') {
        const data = change.doc.data();
        appendMessage(data, contact);
        lastMsgCache[contact.id] = { text: data.text, ts: data.timestamp };
      }
    });
    scrollToBottom();
  });

  input.focus();
}

// ===== Append message =====
function appendMessage(data, contact) {
  const messages = document.getElementById('messages');
  if (!messages) return;

  const isSent = data.from === myId;
  const color  = isSent ? myColor : (contact?.color || '#888');
  const name   = isSent ? myName  : (contact?.name || data.fromName || '?');

  const row = document.createElement('div');
  row.className = `msg-row ${isSent ? 'sent' : 'received'}`;
  row.innerHTML = `
    ${!isSent ? `<div class="msg-avatar" style="background:${color}">${initials(name)}</div>` : ''}
    <div class="msg-content">
      <div class="bubble">${escapeHtml(data.text)}</div>
      <span class="msg-time">${formatTime(data.timestamp)}</span>
    </div>
  `;
  messages.appendChild(row);
}

function scrollToBottom() {
  const m = document.getElementById('messages');
  if (m) m.scrollTop = m.scrollHeight;
}

// ===== Search =====
function setupSearch() {
  document.getElementById('searchInput').addEventListener('input', e => {
    const q = e.target.value.toLowerCase();
    document.querySelectorAll('.contact-item').forEach(el => {
      const name = el.querySelector('.contact-name')?.textContent.toLowerCase() || '';
      el.style.display = name.includes(q) ? '' : 'none';
    });
  });
}
