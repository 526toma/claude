const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

const PORT = 3001;

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
};

const server = http.createServer((req, res) => {
  let filePath = path.join(__dirname, 'public', req.url === '/' ? 'index.html' : req.url);
  const ext = path.extname(filePath);
  const contentType = MIME_TYPES[ext] || 'text/plain';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

const wss = new WebSocket.Server({ server });

// Store connected clients with their info
const clients = new Map();

// Predefined contacts (bot users)
const contacts = [
  { id: 'tanaka', name: '田中 花子', avatar: 'T', color: '#FF6B6B', status: 'online' },
  { id: 'suzuki', name: '鈴木 太郎', avatar: 'S', color: '#4ECDC4', status: 'online' },
  { id: 'yamada', name: '山田 次郎', avatar: 'Y', color: '#45B7D1', status: 'away' },
  { id: 'sato',   name: '佐藤 美咲', avatar: 'M', color: '#96CEB4', status: 'offline' },
];

// Bot auto-reply messages
const botReplies = {
  tanaka: ['こんにちは！', 'そうですね〜', 'わかった！', 'ありがとう😊', 'いいね！', 'えー、ほんとに？', 'また連絡するね'],
  suzuki: ['おっす！', 'なるほどね', 'オッケー👍', 'マジで？', 'それいいな', 'あとで確認するよ', '了解〜'],
  yamada: ['どうも', 'うん', 'そっか', 'ちょっと待って', '後で返事するね', 'わかった', 'ありがとう'],
  sato:   ['やあ！', 'そうなんだ〜', '素敵✨', 'いいね！', 'ほんとそれ', 'わかる〜', 'たしかに！'],
};

let clientIdCounter = 1;

wss.on('connection', (ws) => {
  const clientId = `user_${clientIdCounter++}`;
  clients.set(ws, { id: clientId });

  // Send initial data to new client
  ws.send(JSON.stringify({
    type: 'init',
    clientId,
    contacts,
  }));

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data);

      if (msg.type === 'chat') {
        // Broadcast to all clients in same "room"
        const payload = JSON.stringify({
          type: 'chat',
          from: clientId,
          to: msg.to,
          text: msg.text,
          timestamp: Date.now(),
        });

        // Send to all other clients
        wss.clients.forEach((client) => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(payload);
          }
        });

        // Bot auto-reply after 1-2 seconds
        if (contacts.find(c => c.id === msg.to)) {
          const replies = botReplies[msg.to] || ['...'];
          const reply = replies[Math.floor(Math.random() * replies.length)];
          setTimeout(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({
                type: 'chat',
                from: msg.to,
                to: clientId,
                text: reply,
                timestamp: Date.now(),
                isBot: true,
              }));
            }
          }, 800 + Math.random() * 1200);
        }
      }
    } catch (e) {
      // ignore parse errors
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
  });
});

server.listen(PORT, () => {
  console.log(`LINE-like app running at http://localhost:${PORT}`);
});
