import { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { Plus, Trash2, Pencil, X, Check } from 'lucide-react';

export default function Memos({ memos, hishoImage }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', content: '' });
  const [editing, setEditing] = useState(null);

  const addMemo = async () => {
    if (!form.title.trim()) return;
    await addDoc(collection(db, 'memos'), {
      title: form.title.trim(),
      content: form.content.trim(),
      createdAt: serverTimestamp(),
    });
    setForm({ title: '', content: '' });
    setShowForm(false);
  };

  const saveMemo = async (id) => {
    await updateDoc(doc(db, 'memos', id), {
      title: editing.title,
      content: editing.content,
    });
    setEditing(null);
  };

  const deleteMemo = async (id) => {
    await deleteDoc(doc(db, 'memos', id));
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <img src={hishoImage} alt="秘書ちゃん" className="header-avatar" />
        <div className="header-info">
          <span className="header-name">メモ</span>
          <span className="header-status">{memos.length}件のメモ</span>
        </div>
      </div>

      <div className="messages-area">
        <div className="message-row assistant-row">
          <img src={hishoImage} alt="秘書ちゃん" className="msg-avatar" />
          <div className="bubble assistant-bubble">
            メモを管理します📝<br />
            右下の＋ボタンから追加できます！
          </div>
        </div>

        {memos.map(memo => (
          <div key={memo.id} className="message-row assistant-row">
            <img src={hishoImage} alt="秘書ちゃん" className="msg-avatar" />
            <div className="bubble assistant-bubble memo-bubble">
              {editing?.id === memo.id ? (
                <>
                  <input
                    className="add-input"
                    value={editing.title}
                    onChange={e => setEditing({ ...editing, title: e.target.value })}
                  />
                  <textarea
                    className="add-input"
                    value={editing.content}
                    onChange={e => setEditing({ ...editing, content: e.target.value })}
                    rows={3}
                  />
                  <div className="memo-edit-actions">
                    <button className="icon-btn cancel" onClick={() => setEditing(null)}><X size={14} /></button>
                    <button className="icon-btn save" onClick={() => saveMemo(memo.id)}><Check size={14} /></button>
                  </div>
                </>
              ) : (
                <>
                  <div className="memo-bubble-title">{memo.title}</div>
                  {memo.content && <div className="memo-bubble-content">{memo.content}</div>}
                  <div className="memo-bubble-actions">
                    <button className="icon-btn edit" onClick={() => setEditing({ id: memo.id, title: memo.title, content: memo.content })}>
                      <Pencil size={13} />
                    </button>
                    <button className="icon-btn delete" onClick={() => deleteMemo(memo.id)}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        ))}

        {memos.length === 0 && (
          <div className="message-row assistant-row">
            <img src={hishoImage} alt="秘書ちゃん" className="msg-avatar" />
            <div className="bubble assistant-bubble">
              メモがまだないですね。<br />何でも書き留めておきましょう📝
            </div>
          </div>
        )}
      </div>

      {showForm && (
        <div className="schedule-form-overlay">
          <div className="schedule-form-card">
            <h3>メモを追加</h3>
            <input
              autoFocus
              className="add-input"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="タイトル"
            />
            <textarea
              className="add-input"
              value={form.content}
              onChange={e => setForm({ ...form, content: e.target.value })}
              placeholder="内容..."
              rows={4}
            />
            <div className="add-form-actions">
              <button className="btn-cancel" onClick={() => { setShowForm(false); setForm({ title: '', content: '' }); }}>キャンセル</button>
              <button className="btn-primary" onClick={addMemo}>保存</button>
            </div>
          </div>
        </div>
      )}

      <div className="input-area">
        <div className="schedule-hint">メモを追加するには右の＋ボタンを押してください</div>
        <button className="send-btn active" onClick={() => setShowForm(true)}>
          <Plus size={20} />
        </button>
      </div>
    </div>
  );
}
