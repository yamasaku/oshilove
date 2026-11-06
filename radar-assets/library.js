export const LABELS = { goods: '周邊', schedule: 'Schedule', tickets: 'チケ発', mv: 'MV / Video', other: '其他' };
export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}
export function safeLink(value) {
  try { const u = new URL(value); return u.protocol === 'https:' && !u.username && !u.password ? u.href : '#'; } catch { return '#'; }
}
export function safeImage(value) {
  const url = safeLink(value);
  return url !== '#' && ['pbs.twimg.com', 'abs.twimg.com', 'img.youtube.com', 'i.ytimg.com'].includes(new URL(url).hostname) ? url : '';
}
export function todayJst(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const get = type => parts.find(p => p.type === type).value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}
export function mergePosts(existing, incoming) {
  const map = new Map(existing.map(p => [p.id, p]));
  incoming.forEach(p => map.set(p.id, p));
  return [...map.values()].sort((a, b) => Date.parse(b.postedAt) - Date.parse(a.postedAt));
}
export function relevantDates(post, category) {
  return post.dates.filter(d => category === 'tickets' ? d.kind === 'ticket' : category === 'schedule' ? d.kind === 'event' : true);
}
export function filterPosts(posts, { category, query, reposts, upcoming, sort, today = todayJst() }) {
  const selected = posts.filter(p => (category === 'all' || (category === 'video' ? p.hasVideo || p.photos?.some(m=>m.type==='video') : p.categories.includes(category))) &&
    (reposts || !p.repost) && (!query || `${p.text} ${p.quote?.text || ''}`.toLocaleLowerCase().includes(query.toLocaleLowerCase())) &&
    (!upcoming || relevantDates(p, category).some(d => d.date >= today)));
  if (sort === 'date') {
    const next = p => {
      const dates = relevantDates(p, category).map(d => d.date).sort();
      const future = dates.find(d => d >= today);
      return future ? `0${future}` : dates.length ? `1${String(99999999 - Number(dates.at(-1).replaceAll('-', '')))}` : '2';
    };
    selected.sort((a, b) => next(a).localeCompare(next(b)) || Date.parse(b.postedAt) - Date.parse(a.postedAt));
  } else selected.sort((a, b) => Date.parse(b.postedAt) - Date.parse(a.postedAt));
  return selected;
}
function icsEscape(value) { return String(value).replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;'); }
function foldLine(line) {
  const encoder = new TextEncoder();
  let folded = '', count = 0;
  for (const char of line) {
    const bytes = encoder.encode(char).length;
    if (count + bytes > 74) { folded += '\r\n '; count = 1; }
    folded += char; count += bytes;
  }
  return folded;
}
export function calendarFile(post, date, note = '本文から抽出した日付です。年・時刻は原文でご確認ください。この予定は終日リマインダーです。') {
  const next = new Date(`${date}T00:00:00Z`);
  next.setUTCDate(next.getUTCDate() + 1);
  const summary = post.text.split('\n').find(line => line.trim() && !/^[◤◥◢◣￣＿\s]+$/.test(line)) || `@${post.author} 活動`;
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Oshi Radar//Events//ZH-HK', 'CALSCALE:GREGORIAN', 'BEGIN:VEVENT',
    `UID:${post.id}-${date}@oshi-radar`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}`,
    `DTSTART;VALUE=DATE:${date.replaceAll('-', '')}`, `DTEND;VALUE=DATE:${next.toISOString().slice(0, 10).replaceAll('-', '')}`,
    `SUMMARY:${icsEscape(summary.slice(0, 150))}`,
    `DESCRIPTION:${icsEscape(`${note}\n${post.url}\n\n${post.text}`)}`,
    `URL:${post.url}`, 'END:VEVENT', 'END:VCALENDAR'];
  return lines.map(foldLine).join('\r\n') + '\r\n';
}
