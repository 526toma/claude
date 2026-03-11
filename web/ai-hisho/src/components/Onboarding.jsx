import { useState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';

const STEPS = [
  {
    id: 'greeting',
    message: 'はじめまして！AI秘書ちゃんです✨\nあなたのタスク・スケジュール・メール管理をお手伝いします！\n\nまず簡単に登録をしましょう。お名前を教えてください😊',
    field: null,
    inputPlaceholder: null,
  },
  {
    id: 'name',
    message: null, // dynamic
    field: 'name',
    inputPlaceholder: '例）山田 太郎',
  },
  {
    id: 'email',
    message: null,
    field: 'email',
    inputPlaceholder: '例）taro@example.com',
  },
  {
    id: 'role',
    message: null,
    field: 'role',
    inputPlaceholder: '例）営業部マネージャー、フリーランスデザイナーなど',
  },
  {
    id: 'done',
    message: null,
    field: null,
    inputPlaceholder: null,
  },
];

const QUESTIONS = {
  name: (prev) => `${prev.name}さん、素敵なお名前ですね！\nメールアドレスを教えてください📧`,
  email: (prev) => `ありがとうございます！\nお仕事の役職や職種を教えてください（AIがより適切にサポートするために使います）`,
  role: (prev) => `${prev.name}さんの秘書として、全力でサポートします！\n\n登録完了です🎉\n\n・お名前: ${prev.name}\n・メール: ${prev.email}\n・役職: ${prev.role}\n\nさっそく使い始めましょう！`,
};

export default function Onboarding({ hishoImage, onComplete }) {
  const [messages, setMessages] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [input, setInput] = useState('');
  const [profile, setProfile] = useState({ name: '', email: '', role: '' });
  const [completed, setCompleted] = useState(false);
  const bottomRef = useRef(null);

  // Add initial greeting bubble
  useEffect(() => {
    setTimeout(() => {
      setMessages([{
        id: 'greeting',
        role: 'assistant',
        content: STEPS[0].message,
      }]);
      setCurrentStep(1); // move to 'name' step
    }, 400);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || completed) return;
    setInput('');

    const step = STEPS[currentStep];
    if (!step) return;

    // Add user bubble
    const userMsg = { id: `user-${currentStep}`, role: 'user', content: text };
    const newProfile = { ...profile, [step.field]: text };
    setProfile(newProfile);

    const nextStep = currentStep + 1;
    const nextStepDef = STEPS[nextStep];

    // Get the next assistant message
    const nextMessage = QUESTIONS[step.field]?.(newProfile);

    setMessages(prev => [
      ...prev,
      userMsg,
      ...(nextMessage ? [{ id: `assistant-${currentStep}`, role: 'assistant', content: nextMessage }] : []),
    ]);

    if (nextStepDef?.id === 'done' || !nextStepDef) {
      setCompleted(true);
      // Save profile
      localStorage.setItem('hishoProfile', JSON.stringify(newProfile));
      setTimeout(() => onComplete(newProfile), 1800);
    } else {
      setCurrentStep(nextStep);
    }
  };

  const isWaitingForInput = !completed && currentStep < STEPS.length && STEPS[currentStep]?.field;

  return (
    <div className="chat-container onboarding-container">
      {/* Header */}
      <div className="chat-header">
        <img src={hishoImage} alt="秘書ちゃん" className="header-avatar" />
        <div className="header-info">
          <span className="header-name">AI秘書ちゃん</span>
          <span className="header-status">初回セットアップ</span>
        </div>
      </div>

      {/* Messages */}
      <div className="messages-area">
        <div className="welcome-wrapper">
          <img src={hishoImage} alt="秘書ちゃん" className="welcome-avatar" />
        </div>

        {messages.map(msg => (
          <div key={msg.id} className={`message-row ${msg.role === 'user' ? 'user-row' : 'assistant-row'}`}>
            {msg.role === 'assistant' && (
              <img src={hishoImage} alt="秘書ちゃん" className="msg-avatar" />
            )}
            <div className={`bubble ${msg.role === 'user' ? 'user-bubble' : 'assistant-bubble'}`}>
              {msg.content}
            </div>
          </div>
        ))}

        {completed && (
          <div className="message-row">
            <div className="onboarding-complete-msg">アプリを起動しています...</div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="input-area">
        {isWaitingForInput ? (
          <>
            <input
              autoFocus
              className="chat-input single-line"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={STEPS[currentStep]?.inputPlaceholder || '入力してください'}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              type={STEPS[currentStep]?.field === 'email' ? 'email' : 'text'}
            />
            <button
              className={`send-btn ${input.trim() ? 'active' : ''}`}
              onClick={handleSend}
              disabled={!input.trim()}
            >
              <Send size={20} />
            </button>
          </>
        ) : (
          <div className="schedule-hint" style={{ textAlign: 'center', width: '100%' }}>
            {completed ? '準備中...' : 'しばらくお待ちください...'}
          </div>
        )}
      </div>
    </div>
  );
}
