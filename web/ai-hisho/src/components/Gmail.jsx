import { useState, useEffect, useCallback } from 'react';
import { fetchUnreadEmails, markAsRead, sendReply } from '../gmail';
import { sendMessageToClaude } from '../claudeApi';
import { RefreshCw, Send, X, ChevronDown, ChevronUp, Mail } from 'lucide-react';

const DRAFT_SYSTEM = `あなたはAI秘書ちゃんです。ユーザーの代わりにメールの返信文を日本語で作成します。
以下のメールに対する丁寧でプロフェッショナルな返信を作成してください。
返信文のみを出力してください（件名や宛名は不要、本文のみ）。`;

export default function Gmail({ hishoImage, isAuthenticated }) {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // emailStates: { [id]: 'idle' | 'drafting' | 'draft_ready' | 'editing' | 'sending' | 'sent' | 'dismissed' }
  const [emailStates, setEmailStates] = useState({});
  const [drafts, setDrafts] = useState({});
  const [expanded, setExpanded] = useState({});
  const [lastChecked, setLastChecked] = useState(null);

  const loadEmails = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError('');
    try {
      const mails = await fetchUnreadEmails(8);
      setEmails(mails);
      setLastChecked(new Date());
    } catch (e) {
      if (e.message === 'NOT_AUTHENTICATED' || e.message === 'TOKEN_EXPIRED') {
        setError('Googleアカウントと再接続してください。');
      } else {
        setError(`メール取得エラー: ${e.message}`);
      }
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) loadEmails();
  }, [isAuthenticated, loadEmails]);

  // Auto-poll every 2 minutes
  useEffect(() => {
    if (!isAuthenticated) return;
    const timer = setInterval(loadEmails, 2 * 60 * 1000);
    return () => clearInterval(timer);
  }, [isAuthenticated, loadEmails]);

  const setEmailState = (id, state) =>
    setEmailStates(prev => ({ ...prev, [id]: state }));

  const draftReply = async (email) => {
    setEmailState(email.id, 'drafting');
    try {
      const prompt = `以下のメールへの返信を作成してください。

差出人: ${email.from}
件名: ${email.subject}
本文:
${email.body || email.snippet}`;

      const reply = await sendMessageToClaude(
        [{ role: 'user', content: prompt }],
        {},
        DRAFT_SYSTEM
      );
      setDrafts(prev => ({ ...prev, [email.id]: reply }));
      setEmailState(email.id, 'editing');
    } catch {
      setEmailState(email.id, 'idle');
    }
  };

  const sendDraft = async (email) => {
    setEmailState(email.id, 'sending');
    try {
      await sendReply({
        to: email.replyTo || email.from,
        subject: email.subject,
        body: drafts[email.id],
        threadId: email.threadId,
        inReplyTo: email.messageId,
      });
      await markAsRead(email.id);
      setEmailState(email.id, 'sent');
    } catch (e) {
      setEmailState(email.id, 'idle');
      alert(`送信失敗: ${e.message}`);
    }
  };

  const dismiss = async (email) => {
    await markAsRead(email.id).catch(() => {});
    setEmailState(email.id, 'dismissed');
  };

  const toggleExpand = (id) =>
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  const visibleEmails = emails.filter(e => emailStates[e.id] !== 'dismissed');

  return (
    <div className="chat-container">
      <div className="chat-header">
        <img src={hishoImage} alt="秘書ちゃん" className="header-avatar" />
        <div className="header-info">
          <span className="header-name">Gmail</span>
          <span className="header-status">
            {lastChecked
              ? `最終確認: ${lastChecked.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}`
              : '未確認'}
          </span>
        </div>
        <button className={`api-key-btn ${loading ? 'spinning' : ''}`} onClick={loadEmails} title="更新">
          <RefreshCw size={18} />
        </button>
      </div>

      <div className="messages-area">
        {!isAuthenticated && (
          <div className="message-row assistant-row">
            <img src={hishoImage} alt="秘書ちゃん" className="msg-avatar" />
            <div className="bubble assistant-bubble">
              Googleアカウントと連携すると<br />
              Gmailの確認ができます📧<br />
              上の「Googleでログイン」ボタンから接続してください！
            </div>
          </div>
        )}

        {isAuthenticated && !loading && visibleEmails.length === 0 && (
          <div className="message-row assistant-row">
            <img src={hishoImage} alt="秘書ちゃん" className="msg-avatar" />
            <div className="bubble assistant-bubble">
              {error || '未読メールはありません✨\nまた新しいメールが届いたらお知らせします！'}
            </div>
          </div>
        )}

        {isAuthenticated && loading && emails.length === 0 && (
          <div className="message-row assistant-row">
            <img src={hishoImage} alt="秘書ちゃん" className="msg-avatar" />
            <div className="bubble assistant-bubble typing-bubble">
              <span className="dot" /><span className="dot" /><span className="dot" />
            </div>
          </div>
        )}

        {visibleEmails.map(email => {
          const state = emailStates[email.id] || 'idle';
          const isExpanded = expanded[email.id];

          return (
            <div key={email.id} className="email-thread">
              {/* Secretary announces the email */}
              <div className="message-row assistant-row">
                <img src={hishoImage} alt="秘書ちゃん" className="msg-avatar" />
                <div className="bubble assistant-bubble email-bubble">
                  <div className="email-bubble-header">
                    <Mail size={14} className="email-icon" />
                    <span className="email-label">新着メール</span>
                  </div>
                  <div className="email-from">📨 {formatSender(email.from)}</div>
                  <div className="email-subject">📋 {email.subject}</div>

                  {/* Expandable body */}
                  <button className="email-expand-btn" onClick={() => toggleExpand(email.id)}>
                    {isExpanded ? <><ChevronUp size={13} /> 閉じる</> : <><ChevronDown size={13} /> 本文を見る</>}
                  </button>
                  {isExpanded && (
                    <div className="email-body-preview">{email.body || email.snippet}</div>
                  )}

                  {state === 'idle' && (
                    <div className="email-actions">
                      <p className="email-question">返信しますか？</p>
                      <div className="email-action-btns">
                        <button className="btn-email-reply" onClick={() => draftReply(email)}>
                          AIで返信文を作成
                        </button>
                        <button className="btn-email-dismiss" onClick={() => dismiss(email)}>
                          後で
                        </button>
                      </div>
                    </div>
                  )}

                  {state === 'drafting' && (
                    <div className="email-drafting">
                      <span className="dot" /><span className="dot" /><span className="dot" />
                      <span style={{ marginLeft: 8, fontSize: 12, color: '#888' }}>返信文を作成中...</span>
                    </div>
                  )}

                  {state === 'sent' && (
                    <div className="email-sent-badge">✅ 送信しました</div>
                  )}
                </div>
              </div>

              {/* Draft editing as user bubble */}
              {(state === 'editing' || state === 'sending') && (
                <div className="message-row user-row">
                  <div className="bubble user-bubble draft-bubble">
                    <div className="draft-label">返信文（編集可）</div>
                    <textarea
                      className="draft-textarea"
                      value={drafts[email.id] || ''}
                      onChange={e => setDrafts(prev => ({ ...prev, [email.id]: e.target.value }))}
                      rows={6}
                    />
                    <div className="draft-actions">
                      <button
                        className="draft-cancel-btn"
                        onClick={() => setEmailState(email.id, 'idle')}
                        disabled={state === 'sending'}
                      >
                        <X size={14} /> キャンセル
                      </button>
                      <button
                        className="draft-send-btn"
                        onClick={() => sendDraft(email)}
                        disabled={state === 'sending'}
                      >
                        {state === 'sending' ? '送信中...' : <><Send size={14} /> 送信</>}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="input-area">
        <div className="schedule-hint">
          {visibleEmails.length > 0 ? `未読 ${visibleEmails.length}件` : 'メールは2分ごとに自動更新されます'}
        </div>
        <button className="send-btn active" onClick={loadEmails}>
          <RefreshCw size={18} />
        </button>
      </div>
    </div>
  );
}

function formatSender(from) {
  const match = from.match(/^"?([^"<]+)"?\s*<?/);
  const name = match?.[1]?.trim();
  const emailMatch = from.match(/<([^>]+)>/);
  const email = emailMatch?.[1] || from;
  return name && name !== email ? `${name} <${email}>` : email;
}
