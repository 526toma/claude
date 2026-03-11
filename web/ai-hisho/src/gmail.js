import { gFetch } from './googleAuth';

// Fetch recent unread emails
export async function fetchUnreadEmails(maxResults = 10) {
  const listData = await gFetch(
    `https://www.googleapis.com/gmail/v1/users/me/messages?` +
    new URLSearchParams({
      q: 'is:unread in:inbox',
      maxResults: String(maxResults),
    })
  );

  if (!listData.messages || listData.messages.length === 0) return [];

  const emails = await Promise.all(
    listData.messages.map(m => fetchEmailDetail(m.id))
  );

  return emails.filter(Boolean);
}

export async function fetchEmailDetail(id) {
  try {
    const msg = await gFetch(
      `https://www.googleapis.com/gmail/v1/users/me/messages/${id}?format=full`
    );

    const headers = msg.payload?.headers || [];
    const getHeader = (name) =>
      headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || '';

    const subject = getHeader('Subject') || '（件名なし）';
    const from = getHeader('From');
    const to = getHeader('To');
    const date = getHeader('Date');
    const messageId = getHeader('Message-ID');
    const replyTo = getHeader('Reply-To') || from;

    const body = extractBody(msg.payload);

    return {
      id: msg.id,
      threadId: msg.threadId,
      subject,
      from,
      to,
      date,
      messageId,
      replyTo,
      body: body.slice(0, 2000), // limit
      snippet: msg.snippet || '',
      labelIds: msg.labelIds || [],
    };
  } catch {
    return null;
  }
}

function extractBody(payload) {
  if (!payload) return '';

  // Plain text preferred
  if (payload.mimeType === 'text/plain' && payload.body?.data) {
    return atob(payload.body.data.replace(/-/g, '+').replace(/_/g, '/'));
  }

  // Multipart: search recursively
  if (payload.parts) {
    const plain = payload.parts.find(p => p.mimeType === 'text/plain');
    if (plain?.body?.data) {
      return atob(plain.body.data.replace(/-/g, '+').replace(/_/g, '/'));
    }
    // Try HTML as fallback
    const html = payload.parts.find(p => p.mimeType === 'text/html');
    if (html?.body?.data) {
      const decoded = atob(html.body.data.replace(/-/g, '+').replace(/_/g, '/'));
      return decoded.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    }
    // Recurse into nested multipart
    for (const part of payload.parts) {
      const text = extractBody(part);
      if (text) return text;
    }
  }

  return '';
}

// Mark email as read
export async function markAsRead(emailId) {
  await gFetch(
    `https://www.googleapis.com/gmail/v1/users/me/messages/${emailId}/modify`,
    {
      method: 'POST',
      body: JSON.stringify({ removeLabelIds: ['UNREAD'] }),
    }
  );
}

// Send a reply email
export async function sendReply({ to, subject, body, threadId, inReplyTo }) {
  const replySubject = subject.startsWith('Re:') ? subject : `Re: ${subject}`;

  const emailLines = [
    `To: ${to}`,
    `Subject: ${replySubject}`,
    `In-Reply-To: ${inReplyTo}`,
    `References: ${inReplyTo}`,
    `Content-Type: text/plain; charset=UTF-8`,
    ``,
    body,
  ];

  const rawEmail = emailLines.join('\r\n');
  const encoded = btoa(unescape(encodeURIComponent(rawEmail)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  await gFetch(
    `https://www.googleapis.com/gmail/v1/users/me/messages/send`,
    {
      method: 'POST',
      body: JSON.stringify({ raw: encoded, threadId }),
    }
  );
}
