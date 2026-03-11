import { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { CheckCircle2, Circle, Trash2, Plus } from 'lucide-react';

export default function Tasks({ tasks, hishoImage }) {
  const [input, setInput] = useState('');

  const addTask = async () => {
    const title = input.trim();
    if (!title) return;
    setInput('');
    await addDoc(collection(db, 'tasks'), {
      title,
      done: false,
      createdAt: serverTimestamp(),
    });
  };

  const toggleTask = async (task) => {
    await updateDoc(doc(db, 'tasks', task.id), { done: !task.done });
  };

  const deleteTask = async (id) => {
    await deleteDoc(doc(db, 'tasks', id));
  };

  const pending = tasks.filter(t => !t.done);
  const done = tasks.filter(t => t.done);

  return (
    <div className="chat-container">
      <div className="chat-header">
        <img src={hishoImage} alt="秘書ちゃん" className="header-avatar" />
        <div className="header-info">
          <span className="header-name">タスク管理</span>
          <span className="header-status">{pending.length}件が未完了</span>
        </div>
      </div>

      <div className="messages-area">
        {/* Welcome bubble */}
        <div className="message-row assistant-row">
          <img src={hishoImage} alt="秘書ちゃん" className="msg-avatar" />
          <div className="bubble assistant-bubble">
            タスクを管理します📋<br />
            下のフォームから追加してください！
          </div>
        </div>

        {/* Pending tasks */}
        {pending.length > 0 && (
          <div className="message-row assistant-row">
            <img src={hishoImage} alt="秘書ちゃん" className="msg-avatar" />
            <div className="bubble assistant-bubble task-list-bubble">
              <div className="bubble-section-title">未完了のタスク ✏️</div>
              {pending.map(task => (
                <div key={task.id} className="task-bubble-item">
                  <button className="task-check" onClick={() => toggleTask(task)}>
                    <Circle size={20} className="circle-icon" />
                  </button>
                  <span className="task-bubble-title">{task.title}</span>
                  <button className="task-delete small" onClick={() => deleteTask(task.id)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Done tasks */}
        {done.length > 0 && (
          <div className="message-row assistant-row">
            <img src={hishoImage} alt="秘書ちゃん" className="msg-avatar" />
            <div className="bubble assistant-bubble task-list-bubble done-bubble">
              <div className="bubble-section-title">完了済み ✅</div>
              {done.map(task => (
                <div key={task.id} className="task-bubble-item done">
                  <button className="task-check" onClick={() => toggleTask(task)}>
                    <CheckCircle2 size={20} className="check-icon" />
                  </button>
                  <span className="task-bubble-title done-title">{task.title}</span>
                  <button className="task-delete small" onClick={() => deleteTask(task.id)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {tasks.length === 0 && (
          <div className="message-row assistant-row">
            <img src={hishoImage} alt="秘書ちゃん" className="msg-avatar" />
            <div className="bubble assistant-bubble">
              まだタスクがないですね。<br />何から始めますか？😊
            </div>
          </div>
        )}
      </div>

      <div className="input-area">
        <input
          className="chat-input single-line"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="タスクを追加..."
          onKeyDown={e => e.key === 'Enter' && addTask()}
        />
        <button
          className={`send-btn ${input.trim() ? 'active' : ''}`}
          onClick={addTask}
          disabled={!input.trim()}
        >
          <Plus size={20} />
        </button>
      </div>
    </div>
  );
}
