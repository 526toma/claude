import { useState, useEffect, useCallback } from 'react';
import { fetchCalendarEvents } from '../googleCalendar';
import { RefreshCw, ExternalLink } from 'lucide-react';

export default function Schedule({ hishoImage, isAuthenticated }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const today = new Date().toISOString().split('T')[0];

  const load = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError('');
    try {
      const evs = await fetchCalendarEvents();
      setEvents(evs);
    } catch (e) {
      if (e.message === 'NOT_AUTHENTICATED' || e.message === 'TOKEN_EXPIRED') {
        setError('Googleアカウントと再接続してください。');
      } else {
        setError(`カレンダー取得エラー: ${e.message}`);
      }
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => { if (isAuthenticated) load(); }, [isAuthenticated, load]);

  const upcoming = events.filter(e => e.date >= today);
  const todayEvents = events.filter(e => e.date === today);

  const formatDate = (date, time, allDay) => {
    const d = new Date(`${date}T00:00:00`);
    const dateStr = d.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'short' });
    if (allDay) return `${dateStr}（終日）`;
    return time ? `${dateStr} ${time}` : dateStr;
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <img src={hishoImage} alt="秘書ちゃん" className="header-avatar" />
        <div className="header-info">
          <span className="header-name">スケジュール</span>
          <span className="header-status">
            {isAuthenticated ? `${upcoming.length}件の予定` : 'Googleカレンダー'}
          </span>
        </div>
        {isAuthenticated && (
          <button className={`api-key-btn ${loading ? 'spinning' : ''}`} onClick={load} title="更新">
            <RefreshCw size={18} />
          </button>
        )}
      </div>

      <div className="messages-area">
        {!isAuthenticated && (
          <div className="message-row assistant-row">
            <img src={hishoImage} alt="秘書ちゃん" className="msg-avatar" />
            <div className="bubble assistant-bubble">
              Googleアカウントと連携すると<br />
              Googleカレンダーの予定を確認できます📅<br />
              上の「Googleでログイン」ボタンから接続してください！
            </div>
          </div>
        )}

        {isAuthenticated && loading && events.length === 0 && (
          <div className="message-row assistant-row">
            <img src={hishoImage} alt="秘書ちゃん" className="msg-avatar" />
            <div className="bubble assistant-bubble typing-bubble">
              <span className="dot" /><span className="dot" /><span className="dot" />
            </div>
          </div>
        )}

        {isAuthenticated && !loading && events.length === 0 && (
          <div className="message-row assistant-row">
            <img src={hishoImage} alt="秘書ちゃん" className="msg-avatar" />
            <div className="bubble assistant-bubble">
              {error || '今後30日間の予定はありません✨\nGoogleカレンダーに予定を追加してください！'}
            </div>
          </div>
        )}

        {todayEvents.length > 0 && (
          <div className="message-row assistant-row">
            <img src={hishoImage} alt="秘書ちゃん" className="msg-avatar" />
            <div className="bubble assistant-bubble task-list-bubble">
              <div className="bubble-section-title">今日の予定 🌟</div>
              {todayEvents.map(ev => (
                <EventItem key={ev.id} event={ev} formatDate={formatDate} />
              ))}
            </div>
          </div>
        )}

        {upcoming.filter(e => e.date !== today).length > 0 && (
          <div className="message-row assistant-row">
            <img src={hishoImage} alt="秘書ちゃん" className="msg-avatar" />
            <div className="bubble assistant-bubble task-list-bubble">
              <div className="bubble-section-title">今後の予定 📌</div>
              {upcoming.filter(e => e.date !== today).map(ev => (
                <EventItem key={ev.id} event={ev} formatDate={formatDate} />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="input-area">
        <div className="schedule-hint">
          Googleカレンダーと同期中。予定の追加はGoogleカレンダーで行ってください。
        </div>
        {isAuthenticated && (
          <button className="send-btn active" onClick={load}>
            <RefreshCw size={18} />
          </button>
        )}
      </div>
    </div>
  );
}

function EventItem({ event, formatDate }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="schedule-bubble-item">
      <div className="schedule-bubble-body">
        <div className="schedule-bubble-title">
          {event.date === new Date().toISOString().split('T')[0] && (
            <span className="today-badge">今日</span>
          )}
          {event.title}
          {event.htmlLink && (
            <a href={event.htmlLink} target="_blank" rel="noreferrer" className="cal-link">
              <ExternalLink size={12} />
            </a>
          )}
        </div>
        <div className="schedule-bubble-date">
          {formatDate(event.date, event.time, event.allDay)}
        </div>
        {event.location && (
          <div className="schedule-bubble-memo">📍 {event.location}</div>
        )}
        {event.description && (
          <button className="email-expand-btn" onClick={() => setExpanded(e => !e)}>
            {expanded ? '▲ 閉じる' : '▼ 詳細'}
          </button>
        )}
        {expanded && event.description && (
          <div className="email-body-preview">{event.description}</div>
        )}
      </div>
    </div>
  );
}
