import { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { Plus, Trash2 } from 'lucide-react';

export default function Schedule({ schedules, hishoImage }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', date: '', time: '', memo: '' });

  const today = new Date().toISOString().split('T')[0];

  const addSchedule = async () => {
    if (!form.title.trim() || !form.date) return;
    await addDoc(collection(db, 'schedules'), {
      ...form,
      title: form.title.trim(),
      createdAt: serverTimestamp(),
    });
    setForm({ title: '', date: '', time: '', memo: '' });
    setShowForm(false);
  };

  const deleteSchedule = async (id) => {
    await deleteDoc(doc(db, 'schedules', id));
  };

  const sorted = [...schedules].sort((a, b) =>
    new Date(`${a.date}T${a.time || '00:00'}`) - new Date(`${b.date}T${b.time || '00:00'}`)
  );
  const upcoming = sorted.filter(s => s.date >= today);
  const past = sorted.filter(s => s.date < today).reverse();

  const formatDate = (date, time) => {
    const d = new Date(`${date}T${time || '00:00'}`);
    return d.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'short' })
      + (time ? ` ${time}` : '');
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <img src={hishoImage} alt="秘書ちゃん" className="header-avatar" />
        <div className="header-info">
          <span className="header-name">スケジュール</span>
          <span className="header-status">{upcoming.length}件の予定</span>
        </div>
      </div>

      <div className="messages-area">
        <div className="message-row assistant-row">
          <img src={hishoImage} alt="秘書ちゃん" className="msg-avatar" />
          <div className="bubble assistant-bubble">
            スケジュール管理をお手伝いします📅<br />
            右下の＋ボタンから予定を追加できます！
          </div>
        </div>

        {upcoming.length > 0 && (
          <div className="message-row assistant-row">
            <img src={hishoImage} alt="秘書ちゃん" className="msg-avatar" />
            <div className="bubble assistant-bubble task-list-bubble">
              <div className="bubble-section-title">今後の予定 📌</div>
              {upcoming.map(s => (
                <div key={s.id} className={`schedule-bubble-item ${s.date === today ? 'today' : ''}`}>
                  <div className="schedule-bubble-body">
                    <div className="schedule-bubble-title">
                      {s.date === today && <span className="today-badge">今日</span>}
                      {s.title}
                    </div>
                    <div className="schedule-bubble-date">{formatDate(s.date, s.time)}</div>
                    {s.memo && <div className="schedule-bubble-memo">{s.memo}</div>}
                  </div>
                  <button className="task-delete small" onClick={() => deleteSchedule(s.id)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {past.length > 0 && (
          <div className="message-row assistant-row">
            <img src={hishoImage} alt="秘書ちゃん" className="msg-avatar" />
            <div className="bubble assistant-bubble task-list-bubble done-bubble">
              <div className="bubble-section-title">過去の予定</div>
              {past.map(s => (
                <div key={s.id} className="schedule-bubble-item past">
                  <div className="schedule-bubble-body">
                    <div className="schedule-bubble-title">{s.title}</div>
                    <div className="schedule-bubble-date">{formatDate(s.date, s.time)}</div>
                  </div>
                  <button className="task-delete small" onClick={() => deleteSchedule(s.id)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {schedules.length === 0 && (
          <div className="message-row assistant-row">
            <img src={hishoImage} alt="秘書ちゃん" className="msg-avatar" />
            <div className="bubble assistant-bubble">
              予定がまだないですね。<br />何か予定を追加しましょうか？📅
            </div>
          </div>
        )}
      </div>

      {/* Add form as user bubble */}
      {showForm && (
        <div className="schedule-form-overlay">
          <div className="schedule-form-card">
            <h3>予定を追加</h3>
            <input
              autoFocus
              className="add-input"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="予定名"
            />
            <div className="form-row">
              <input type="date" className="add-input" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
              <input type="time" className="add-input" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} />
            </div>
            <textarea
              className="add-input"
              value={form.memo}
              onChange={e => setForm({ ...form, memo: e.target.value })}
              placeholder="メモ（任意）"
              rows={2}
            />
            <div className="add-form-actions">
              <button className="btn-cancel" onClick={() => { setShowForm(false); setForm({ title: '', date: '', time: '', memo: '' }); }}>キャンセル</button>
              <button className="btn-primary" onClick={addSchedule}>追加</button>
            </div>
          </div>
        </div>
      )}

      <div className="input-area">
        <div className="schedule-hint">予定を追加するには右の＋ボタンを押してください</div>
        <button className="send-btn active" onClick={() => setShowForm(true)}>
          <Plus size={20} />
        </button>
      </div>
    </div>
  );
}
