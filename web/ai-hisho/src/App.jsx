import { useState, useEffect } from 'react';
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';
import { db } from './firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { setAccessToken, clearAccessToken } from './googleAuth';
import Chat from './components/Chat';
import Tasks from './components/Tasks';
import Schedule from './components/Schedule';
import Memos from './components/Memos';
import Gmail from './components/Gmail';
import Onboarding from './components/Onboarding';
import { MessageCircle, CheckSquare, Calendar, FileText, Mail, LogOut } from 'lucide-react';
import './App.css';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

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
  { id: 'chat',     label: 'チャット', Icon: MessageCircle },
  { id: 'tasks',    label: 'タスク',   Icon: CheckSquare },
  { id: 'schedule', label: '予定',     Icon: Calendar },
  { id: 'memos',    label: 'メモ',     Icon: FileText },
  { id: 'gmail',    label: 'Gmail',    Icon: Mail },
];

function AppInner() {
  const [tab, setTab] = useState('chat');
  const [tasks, setTasks] = useState([]);
  const [memos, setMemos] = useState([]);
  const [isGoogleAuthed, setIsGoogleAuthed] = useState(false);
  const [googleUser, setGoogleUser] = useState(null);
  const [profile, setProfile] = useState(null); // null = not loaded yet
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Check if onboarding is needed
  useEffect(() => {
    const saved = localStorage.getItem('hishoProfile');
    if (saved) {
      setProfile(JSON.parse(saved));
      setShowOnboarding(false);
    } else {
      setShowOnboarding(true);
    }
  }, []);

  useEffect(() => {
    const unsubs = [
      onSnapshot(query(collection(db, 'tasks'), orderBy('createdAt', 'desc')), snap =>
        setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() })))),
      onSnapshot(query(collection(db, 'memos'), orderBy('createdAt', 'desc')), snap =>
        setMemos(snap.docs.map(d => ({ id: d.id, ...d.data() })))),
    ];
    return () => unsubs.forEach(u => u());
  }, []);

  const googleLogin = useGoogleLogin({
    scope: [
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.modify',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ].join(' '),
    onSuccess: async (tokenResponse) => {
      setAccessToken(tokenResponse.access_token);
      setIsGoogleAuthed(true);
      try {
        const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        const info = await res.json();
        setGoogleUser(info);
      } catch {}
    },
    onError: (err) => console.error('Google login failed', err),
  });

  const googleLogout = () => {
    clearAccessToken();
    setIsGoogleAuthed(false);
    setGoogleUser(null);
  };

  const handleOnboardingComplete = (newProfile) => {
    setProfile(newProfile);
    setShowOnboarding(false);
  };

  // Show onboarding until profile is set
  if (showOnboarding) {
    return (
      <div className="app">
        <div className="screen">
          <Onboarding hishoImage={HISHO_SVG} onComplete={handleOnboardingComplete} />
        </div>
      </div>
    );
  }

  // Wait until profile check is done
  if (profile === null) return null;

  return (
    <div className="app">
      {/* Google Auth Banner */}
      <div className="google-auth-bar">
        {isGoogleAuthed ? (
          <div className="google-auth-info">
            {googleUser?.picture && (
              <img src={googleUser.picture} alt="" className="google-avatar" referrerPolicy="no-referrer" />
            )}
            <span className="google-email">{googleUser?.email || 'ログイン中'}</span>
            <button className="google-logout-btn" onClick={googleLogout}>
              <LogOut size={14} /> ログアウト
            </button>
          </div>
        ) : (
          <button className="google-login-btn" onClick={() => googleLogin()}>
            <svg width="16" height="16" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            Googleでログイン（カレンダー・Gmail）
          </button>
        )}
      </div>

      <div className="screen">
        {tab === 'chat'     && <Chat tasks={tasks} schedules={[]} memos={memos} hishoImage={HISHO_SVG} profile={profile} />}
        {tab === 'tasks'    && <Tasks tasks={tasks} hishoImage={HISHO_SVG} />}
        {tab === 'schedule' && <Schedule hishoImage={HISHO_SVG} isAuthenticated={isGoogleAuthed} />}
        {tab === 'memos'    && <Memos memos={memos} hishoImage={HISHO_SVG} />}
        {tab === 'gmail'    && <Gmail hishoImage={HISHO_SVG} isAuthenticated={isGoogleAuthed} />}
      </div>

      <nav className="bottom-nav">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            className={`nav-item ${tab === id ? 'active' : ''}`}
            onClick={() => setTab(id)}
          >
            <Icon size={20} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

export default function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AppInner />
    </GoogleOAuthProvider>
  );
}
