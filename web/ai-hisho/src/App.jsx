import { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import Chat from './components/Chat';
import Tasks from './components/Tasks';
import Schedule from './components/Schedule';
import Memos from './components/Memos';
import { MessageCircle, CheckSquare, Calendar, FileText } from 'lucide-react';
import './App.css';

// Inline SVG secretary avatar
const HISHO_SVG = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="50" fill="#FFB6C1"/>
  <circle cx="50" cy="35" r="18" fill="#FFDDE1"/>
  <ellipse cx="50" cy="80" rx="25" ry="22" fill="#FFDDE1"/>
  <circle cx="43" cy="33" r="3" fill="#555"/>
  <circle cx="57" cy="33" r="3" fill="#555"/>
  <path d="M44 42 Q50 48 56 42" stroke="#FF6B9D" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M35 25 Q50 10 65 25" stroke="#FF6B9D" stroke-width="3" fill="none" stroke-linecap="round"/>
</svg>`)}`;

const TABS = [
  { id: 'chat', label: 'チャット', Icon: MessageCircle },
  { id: 'tasks', label: 'タスク', Icon: CheckSquare },
  { id: 'schedule', label: '予定', Icon: Calendar },
  { id: 'memos', label: 'メモ', Icon: FileText },
];

export default function App() {
  const [tab, setTab] = useState('chat');
  const [tasks, setTasks] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [memos, setMemos] = useState([]);

  useEffect(() => {
    const unsubs = [
      onSnapshot(query(collection(db, 'tasks'), orderBy('createdAt', 'desc')), snap =>
        setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() })))),
      onSnapshot(query(collection(db, 'schedules'), orderBy('createdAt', 'desc')), snap =>
        setSchedules(snap.docs.map(d => ({ id: d.id, ...d.data() })))),
      onSnapshot(query(collection(db, 'memos'), orderBy('createdAt', 'desc')), snap =>
        setMemos(snap.docs.map(d => ({ id: d.id, ...d.data() })))),
    ];
    return () => unsubs.forEach(u => u());
  }, []);

  return (
    <div className="app">
      <div className="screen">
        {tab === 'chat' && <Chat tasks={tasks} schedules={schedules} memos={memos} hishoImage={HISHO_SVG} />}
        {tab === 'tasks' && <Tasks tasks={tasks} hishoImage={HISHO_SVG} />}
        {tab === 'schedule' && <Schedule schedules={schedules} hishoImage={HISHO_SVG} />}
        {tab === 'memos' && <Memos memos={memos} hishoImage={HISHO_SVG} />}
      </div>

      <nav className="bottom-nav">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            className={`nav-item ${tab === id ? 'active' : ''}`}
            onClick={() => setTab(id)}
          >
            <Icon size={22} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
