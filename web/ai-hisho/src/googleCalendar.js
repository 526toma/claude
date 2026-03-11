import { gFetch } from './googleAuth';

export async function fetchCalendarEvents() {
  const now = new Date().toISOString();
  const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days ahead

  const data = await gFetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
    new URLSearchParams({
      timeMin: now,
      timeMax: future,
      singleEvents: 'true',
      orderBy: 'startTime',
      maxResults: '20',
    })
  );

  return (data.items || []).map(event => ({
    id: event.id,
    title: event.summary || '（タイトルなし）',
    date: (event.start.dateTime || event.start.date).split('T')[0],
    time: event.start.dateTime
      ? new Date(event.start.dateTime).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
      : '',
    allDay: !!event.start.date,
    location: event.location || '',
    description: event.description || '',
    htmlLink: event.htmlLink,
    source: 'google',
  }));
}
