import { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import {
  collection, addDoc, onSnapshot, query, orderBy, serverTimestamp,
} from 'firebase/firestore';
import { sendMessageToClaude } from '../claudeApi';
import { Send, Key } from 'lucide-react';

export default function Chat({ tasks, schedules, memos, hishoImage }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    setHasApiKey(!!localStorage.getItem('claudeApiKey'));
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'messages'), orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const saveApiKey = () => {
    if (apiKeyInput.trim()) {
      localStorage.setItem('claudeApiKey', apiKeyInput.trim());
      setHasApiKey(true);
      setShowKeyModal(false);
      setApiKeyInput('');
    }
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    if (!hasApiKey) {
      setShowKeyModal(true);
      return;
    }

    setInput('');
    setLoading(true);

    await addDoc(collection(db, 'messages'), {
      role: 'user',
      content: text,
      createdAt: serverTimestamp(),
    });

    try {
      const history = messages.slice(-10).map(m => ({
        role: m.role,
        content: m.content,
      }));
      history.push({ role: 'user', content: text });

      const reply = await sendMessageToClaude(history, { tasks, schedules, memos });

      await addDoc(collection(db, 'messages'), {
        role: 'assistant',
        content: reply,
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      if (err.message === 'API_KEY_MISSING') {
        setShowKeyModal(true);
      } else {
        await addDoc(collection(db, 'messages'), {
          role: 'assistant',
          content: `エラーが発生しました: ${err.message}`,
          createdAt: serverTimestamp(),
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="chat-container">
      {/* Header */}
      <div className="chat-header">
        <img src={hishoImage} alt="秘書ちゃん" className="header-avatar" />
        <div className="header-info">
          <span className="header-name">AI秘書ちゃん</span>
          <span className="header-status">オンライン</span>
        </div>
        <button
          className="api-key-btn"
          onClick={() => setShowKeyModal(true)}
          title="APIキー設定"
        >
          <Key size={18} />
        </button>
      </div>

      {/* Message area */}
      <div className="messages-area">
        {/* Welcome message */}
        {messages.length === 0 && (
          <div className="welcome-wrapper">
            <img src={hishoImage} alt="秘書ちゃん" className="welcome-avatar" />
            <div className="bubble assistant-bubble welcome-bubble">
              こんにちは！AI秘書ちゃんです✨<br />
              タスク・スケジュール・メモの管理をお手伝いします。<br />
              何でも気軽に話しかけてくださいね！
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`message-row ${msg.role === 'user' ? 'user-row' : 'assistant-row'}`}>
            {msg.role === 'assistant' && (
              <img src={hishoImage} alt="秘書ちゃん" className="msg-avatar" />
            )}
            <div className={`bubble ${msg.role === 'user' ? 'user-bubble' : 'assistant-bubble'}`}>
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="message-row assistant-row">
            <img src={hishoImage} alt="秘書ちゃん" className="msg-avatar" />
            <div className="bubble assistant-bubble typing-bubble">
              <span className="dot" /><span className="dot" /><span className="dot" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="input-area">
        <textarea
          className="chat-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="メッセージを入力..."
          rows={1}
        />
        <button
          className={`send-btn ${input.trim() ? 'active' : ''}`}
          onClick={sendMessage}
          disabled={!input.trim() || loading}
        >
          <Send size={20} />
        </button>
      </div>

      {/* API Key Modal */}
      {showKeyModal && (
        <div className="modal-overlay" onClick={() => setShowKeyModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Claude APIキーを設定</h3>
            <p>AIチャット機能を使うにはAnthropicのAPIキーが必要です。</p>
            <input
              type="password"
              className="modal-input"
              value={apiKeyInput}
              onChange={e => setApiKeyInput(e.target.value)}
              placeholder="sk-ant-..."
              onKeyDown={e => e.key === 'Enter' && saveApiKey()}
            />
            <div className="modal-actions">
              <button className="modal-cancel" onClick={() => setShowKeyModal(false)}>キャンセル</button>
              <button className="modal-save" onClick={saveApiKey}>保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
