const ws = new WebSocket(`ws://${location.host}`);

let myId = null;
let contacts = [];
let activeContact = null;
const chatHistory = {}; // contactId -> [{from, text, timestamp}]
const unreadCounts = {};

// ===== WebSocket =====
ws.addEventListener('message', (e) => {
  const msg = JSON.parse(e.data);

  if (msg.type === 'init') {
    myId = msg.clientId;
    contacts = msg.contacts;
    contacts.forEach(c => {
      chatHistory[c.id] = [];
      unreadCounts[c.id] = 0;
    });
    renderContactList();
    return;
  }

  if (msg.type === 'chat') {
    const contactId = msg.isBot ? msg.from : msg.from;
    if (!chatHistory[contactId]) chatHistory[contactId] = [];
    chatHistory[contactId].push({ from: msg.from, text: msg.text, timestamp: msg.timestamp });

    // Remove typing indicator
    removeTypingIndicator();

    if (activeContact && activeContact.id === contactId) {
      appendMessage({ from: msg.from, text: msg.text, timestamp: msg.timestamp });
      scrollToBottom();
    } else {
      unreadCounts[contactId] = (unreadCounts[contactId] || 0) + 1;
    }
    updateContactLastMsg(contactId, msg.text, msg.timestamp);
  }
});

// ===== Render contact list =====
function renderContactList() {
  const list = document.getElementById('contactList');
  list.innerHTML = '';
  contacts.forEach(c => {
    const li = document.createElement('li');
    li.className = 'contact-item' + (activeContact?.id === c.id ? ' active' : '');
    li.dataset.id = c.id;
    li.innerHTML = `
      <div class="contact-avatar-wrap">
        <div class="avatar" style="background:${c.color}">${c.avatar}</div>
        <span class="status-dot ${c.status}"></span>
      </div>
      <div class="contact-info">
        <div class="contact-name">${c.name}</div>
        <div class="contact-last-msg" id="last-${c.id}">${getLastMsg(c.id)}</div>
      </div>
      <div class="contact-meta">
        <span class="contact-time" id="time-${c.id}">${getLastTime(c.id)}</span>
        ${unreadCounts[c.id] ? `<span class="unread-badge" id="badge-${c.id}">${unreadCounts[c.id]}</span>` : `<span id="badge-${c.id}"></span>`}
      </div>
    `;
    li.addEventListener('click', () => openChat(c));
    list.appendChild(li);
  });
}

function getLastMsg(id) {
  const msgs = chatHistory[id];
  if (!msgs || msgs.length === 0) return 'トークを始めよう';
  return msgs[msgs.length - 1].text;
}

function getLastTime(id) {
  const msgs = chatHistory[id];
  if (!msgs || msgs.length === 0) return '';
  return formatTime(msgs[msgs.length - 1].timestamp);
}

function updateContactLastMsg(contactId, text, timestamp) {
  const el = document.getElementById(`last-${contactId}`);
  const te = document.getElementById(`time-${contactId}`);
  const badge = document.getElementById(`badge-${contactId}`);
  if (el) el.textContent = text;
  if (te) te.textContent = formatTime(timestamp);
  if (badge && activeContact?.id !== contactId) {
    const count = unreadCounts[contactId] || 0;
    badge.textContent = count > 0 ? count : '';
    badge.className = count > 0 ? 'unread-badge' : '';
  }
}

// ===== Open chat =====
function openChat(contact) {
  activeContact = contact;
  unreadCounts[contact.id] = 0;

  document.querySelectorAll('.contact-item').forEach(el => el.classList.remove('active'));
  const li = document.querySelector(`.contact-item[data-id="${contact.id}"]`);
  if (li) li.classList.add('active');

  const badge = document.getElementById(`badge-${contact.id}`);
  if (badge) { badge.textContent = ''; badge.className = ''; }

  const chatArea = document.getElementById('chatArea');
  chatArea.innerHTML = `
    <div class="chat-header">
      <div class="avatar" style="background:${contact.color}">${contact.avatar}</div>
      <div class="chat-header-info">
        <div class="chat-header-name">${contact.name}</div>
        <div class="chat-header-status ${contact.status}">${statusLabel(contact.status)}</div>
      </div>
      <div class="chat-header-actions">
        <button class="icon-btn" title="通話">📞</button>
        <button class="icon-btn" title="ビデオ">📹</button>
        <button class="icon-btn" title="メニュー">⋮</button>
      </div>
    </div>
    <div class="messages" id="messages">
      <div class="date-divider">今日</div>
    </div>
    <div class="chat-input-area">
      <button class="input-btn" title="スタンプ">😊</button>
      <button class="input-btn" title="画像">📷</button>
      <textarea class="msg-input" id="msgInput" placeholder="メッセージを入力..." rows="1"></textarea>
      <button class="send-btn" id="sendBtn" disabled>➤</button>
    </div>
  `;

  // Render history
  (chatHistory[contact.id] || []).forEach(m => appendMessage(m));
  scrollToBottom();

  // Input events
  const input = document.getElementById('msgInput');
  const sendBtn = document.getElementById('sendBtn');

  input.addEventListener('input', () => {
    sendBtn.disabled = input.value.trim() === '';
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 120) + 'px';
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  sendBtn.addEventListener('click', sendMessage);
  input.focus();
}

function statusLabel(s) {
  if (s === 'online')  return 'オンライン';
  if (s === 'away')    return '離席中';
  if (s === 'offline') return 'オフライン';
  return '';
}

// ===== Send message =====
function sendMessage() {
  const input = document.getElementById('msgInput');
  const text = input.value.trim();
  if (!text || !activeContact) return;

  const timestamp = Date.now();
  const msg = { from: myId, text, timestamp };

  if (!chatHistory[activeContact.id]) chatHistory[activeContact.id] = [];
  chatHistory[activeContact.id].push(msg);

  appendMessage(msg);
  scrollToBottom();
  updateContactLastMsg(activeContact.id, text, timestamp);

  ws.send(JSON.stringify({ type: 'chat', to: activeContact.id, text }));

  input.value = '';
  input.style.height = 'auto';
  document.getElementById('sendBtn').disabled = true;

  // Show typing indicator
  setTimeout(() => showTypingIndicator(), 600);
}

// ===== Append message bubble =====
function appendMessage({ from, text, timestamp }) {
  const messages = document.getElementById('messages');
  if (!messages) return;

  const isSent = from === myId;
  const contact = contacts.find(c => c.id === from);

  const row = document.createElement('div');
  row.className = `msg-row ${isSent ? 'sent' : 'received'}`;

  const avatarHtml = !isSent && contact
    ? `<div class="msg-avatar" style="background:${contact.color}">${contact.avatar}</div>`
    : '';

  row.innerHTML = `
    ${avatarHtml}
    <div class="msg-content">
      <div class="bubble">${escapeHtml(text)}</div>
      <span class="msg-time">${formatTime(timestamp)}</span>
    </div>
  `;

  messages.appendChild(row);
}

// ===== Typing indicator =====
function showTypingIndicator() {
  const messages = document.getElementById('messages');
  if (!messages || !activeContact) return;

  removeTypingIndicator();
  const contact = activeContact;

  const el = document.createElement('div');
  el.className = 'msg-row received';
  el.id = 'typingIndicator';
  el.innerHTML = `
    <div class="msg-avatar" style="background:${contact.color}">${contact.avatar}</div>
    <div class="msg-content">
      <div class="bubble" style="padding:12px 16px">
        <div class="typing-dots">
          <span></span><span></span><span></span>
        </div>
      </div>
    </div>
  `;
  messages.appendChild(el);
  scrollToBottom();
}

function removeTypingIndicator() {
  const el = document.getElementById('typingIndicator');
  if (el) el.remove();
}

// ===== Helpers =====
function scrollToBottom() {
  const messages = document.getElementById('messages');
  if (messages) messages.scrollTop = messages.scrollHeight;
}

function formatTime(ts) {
  const d = new Date(ts);
  return d.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
}

function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// Search filter
document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const q = searchInput.value.toLowerCase();
      document.querySelectorAll('.contact-item').forEach(el => {
        const name = el.querySelector('.contact-name').textContent.toLowerCase();
        el.style.display = name.includes(q) ? '' : 'none';
      });
    });
  }
});
