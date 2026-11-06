// Shared, dependency-free parsing. No model calls or paid services.
const RESERVED = new Set(['home', 'explore', 'search', 'settings', 'messages', 'i', 'intent', 'compose', 'notifications']);

export function parseHandle(input) {
  if (typeof input !== 'string' || input.length > 300) return null;
  let value = input.trim();
  if (/^(?:https?:\/\/)?(?:www\.|mobile\.)?(?:x\.com|twitter\.com)\//i.test(value)) {
    try {
      const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
      if (!['x.com', 'www.x.com', 'mobile.x.com', 'twitter.com', 'www.twitter.com', 'mobile.twitter.com'].includes(url.hostname.toLowerCase())) return null;
      const parts = url.pathname.split('/').filter(Boolean);
      if (parts.length !== 1 || url.username || url.password) return null;
      value = parts[0];
    } catch { return null; }
  } else value = value.replace(/^@/, '');
  return /^[a-zA-Z0-9_]{1,15}$/.test(value) && !RESERVED.has(value.toLowerCase()) ? value.toLowerCase() : null;
}

export function safeUrl(value) {
  if (typeof value !== 'string' || value.length > 2500) return null;
  try { const u = new URL(value); return u.protocol === 'https:' && !u.username && !u.password ? u.href : null; } catch { return null; }
}

export function imageUrl(value) {
  const url = safeUrl(value);
  return url && ['pbs.twimg.com', 'abs.twimg.com', 'img.youtube.com', 'i.ytimg.com'].includes(new URL(url).hostname) ? url : null;
}

export function getLinks(text) {
  return [...new Set((text.match(/https:\/\/[^\s<>「」『』【】]+/g) || []).map(x => safeUrl(x.replace(/[)、。！!]+$/, ''))).filter(Boolean))].slice(0, 15);
}

const TICKET = /🎫|🎟|チケット|チケ発|一般発売|前売|售票|開售|購票|ticket|livepocket|tiget\.net|t-dv\.com|w\.pia\.jp/i;
const VIDEO = /\bMV\b|music\s*video|ミュージックビデオ|映像公開|LIVE映像|youtu\.be|youtube\.com|teaser|ティザー/i;
const GOODS = /グッズ|通販|オンラインショップ|オンラインストア|通信販売|受注販売|予約販売|新商品|商品情報|アクスタ|アクリルスタンド|アクキー|アクリルキーホルダー|缶バッジ|ブロマイド|タオル|Tシャツ|ペンライト|ラバーバンド|生写真|周邊|周边|\bmerch(?:andise)?\b|\bgoods\b|チェキ(?:郵送|通販)|(?:通販|郵送|発送|配送|ランダム|サイン入り|デコ|落書き)チェキ/i;
const BENEFIT = /特典会|特典會|特典会|終演後物販|並行物販|前物販|後物販|物販時間|物販タイム|チェキ列|チェキ会|チェキ撮影|撮影券|サイン会|握手会|お渡し会|お見送り会|交流会|交流會|囲み撮影|囲みチェキ|ツーショット撮影|2ショット撮影|個別撮影|写メ会/i;
const EVENT = /スケジュール|日程|開催|会場|開場|開演|OPEN\s*[:/]|START\s*[:\d]|N[ΣE]XT\s*LiV[ΣE]|出演|生誕|公演|撮影会|撮影會|攝影會|摄影会|寫真會|写真会|schedule|演出|演唱會/i;
const DATE_PATTERN = /(?:(20\d{2})[年/.\-])?(\d{1,2})[月/.\-](\d{1,2})(?:日)?/g;

function dateValue(year, month, day) {
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function extractDates(text, postedAt) {
  const reference = new Date(postedAt);
  if (Number.isNaN(reference.getTime())) return [];
  // Japanese announcements: infer omitted years from the post, never from today's date.
  const refYear = Number(new Intl.DateTimeFormat('en', { timeZone: 'Asia/Tokyo', year: 'numeric' }).format(reference));
  const refMonth = Number(new Intl.DateTimeFormat('en', { timeZone: 'Asia/Tokyo', month: 'numeric' }).format(reference));
  const lines = text.normalize('NFKC').split('\n');
  const dates = [];
  let section = 'event';
  const archivalVideo = VIDEO.test(text) && !/スケジュール|日程|開催|開場|開演|N[ΣE]XT\s*LiV[ΣE]/i.test(text);
  for (const line of lines) {
    if (/https?:\/\//.test(line) && !line.replace(/https?:\/\/\S+/g, '').trim()) continue;
    if (/日程|開催|スケジュール|N[ΣE]XT\s*LiV[ΣE]/i.test(line)) section = 'event';
    if (/🎫|🎟|チケット発売|チケ発|販売|先行抽選|受付|開售|售票|on sale/i.test(line)) section = 'ticket';
    const matches = [...line.matchAll(DATE_PATTERN)];
    for (let index = 0; index < matches.length; index++) {
      const match = matches[index];
      const prefix = line.slice(0, match.index);
      // Don't interpret numeric substrings, times or prices as dates.
      if (/(?:\d|\d[/:])$/.test(prefix) || /https?:\/\/\S*$/.test(prefix)) continue;
      if (!match[1] && match[0].includes('-')) continue; // “1-2枚取り” is a quantity, not January 2.
      const month = Number(match[2]);
      const day = Number(match[3]);
      let year = Number(match[1]) || refYear;
      if (!match[1] && refMonth >= 10 && month <= 3) year++;
      if (!match[1] && refMonth <= 3 && month >= 10) year--;
      const date = dateValue(year, month, day);
      if (!date) continue;
      const tail = line.slice(match.index + match[0].length, matches[index + 1]?.index ?? line.length);
      // A correction's left-hand date/time is superseded by the right-hand value.
      if (matches[index + 1] && /(?:▶︎?|→|⇒|➡)\s*$/.test(tail)) continue;
      // “10/27前売 10/21 23:05-”: first is performance day, second is ticket sale.
      const kind = /^(?:\([^)]*\))?\s*(?:前売|🎫|🎟)/.test(tail) && matches.length > 1 ? 'event' : section;
      if (archivalVideo && kind === 'event') continue;
      const timeMatch = tail.match(/(?:^|[^\d])(\d{1,2}):(\d{2})/);
      const time = timeMatch && Number(timeMatch[1]) < 24 && Number(timeMatch[2]) < 60 ? `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}` : null;
      const deadline = kind === 'ticket' && /締切|〆切|截止|まで|受付終了/.test(line);
      dates.push({ date, time: kind === 'ticket' ? time : null, kind, label: kind === 'ticket' ? (deadline ? '售票／抽選截止' : 'チケ発') : '活動日期', inferredYear: !match[1], context: line.trim().slice(0, 250) });
    }
  }
  return dates.filter((d, i, a) => a.findIndex(x => x.date === d.date && x.time === d.time && x.kind === d.kind) === i).slice(0, 30);
}

export function classify(text, postedAt) {
  const dates = extractDates(text, postedAt);
  const categories = [];
  if (EVENT.test(text) || BENEFIT.test(text) || dates.some(d => d.kind === 'event')) categories.push('schedule');
  if (TICKET.test(text)) categories.push('tickets');
  if (VIDEO.test(text)) categories.push('mv');
  if (GOODS.test(text)) categories.push('goods');
  if (!categories.length) categories.push('other');
  const uncertainMerch = /物販|チェキ/i.test(text) && !GOODS.test(text) && !BENEFIT.test(text);
  return { categories, dates, uncertainMerch };
}

export function normalizeProfile(user) {
  const handle = parseHandle(user?.screen_name);
  if (!handle) throw new Error('Invalid profile response');
  return {
    handle, name: String(user.name || user.screen_name).slice(0, 120),
    description: String(user.description || '').slice(0, 2000),
    avatar: imageUrl(user.avatar_url), banner: imageUrl(user.banner_url),
    followers: Math.max(0, Number(user.followers) || 0),
    url: `https://x.com/${user.screen_name}`,
    links: getLinks(String(user.description || '')),
  };
}

export function normalizePost(post, handle) {
  if (!post || !/^\d{1,25}$/.test(post.id) || typeof post.text !== 'string' || !parseHandle(post.author?.screen_name)) return null;
  const text = post.text.slice(0, 16000);
  const stamp = typeof post.created_timestamp === 'number' ? post.created_timestamp * 1000 : Date.parse(post.created_at);
  if (!Number.isFinite(stamp)) return null;
  const postedAt = new Date(stamp).toISOString();
  const quote = post.quote && typeof post.quote.text === 'string' && /^\d{1,25}$/.test(post.quote.id) && parseHandle(post.quote.author?.screen_name)
    ? { text: post.quote.text.slice(0, 16000), author: post.quote.author.screen_name, url: `https://x.com/${post.quote.author.screen_name}/status/${post.quote.id}` } : null;
  const combined = `${text}${quote ? `\n${quote.text}` : ''}`;
  const mainClassification = classify(text, postedAt);
  const quoteClassification = quote ? classify(quote.text, post.quote.created_at || postedAt) : { categories: [], dates: [] };
  const categories = [...new Set([...mainClassification.categories, ...quoteClassification.categories])];
  const correction = /変更|訂正|修正|改期|更改/.test(text) && /▶|→|⇒|➡/.test(text);
  const dates = [...mainClassification.dates, ...quoteClassification.dates.filter(d => !(correction && d.kind === 'ticket' && mainClassification.dates.some(x => x.kind === 'ticket' && x.date === d.date)))].filter((d, i, a) => a.findIndex(x => x.date === d.date && x.time === d.time && x.kind === d.kind) === i);
  const photos = (post.media?.all || []).slice(0, 4).map(m => ({
    url: imageUrl(m.type === 'photo' ? m.url : m.thumbnail_url), type: m.type === 'photo' ? 'photo' : 'video'
  })).filter(m => m.url);
  const author = post.author.screen_name;
  const links = getLinks(combined).filter(url => !/^https:\/\/(?:x|twitter)\.com\/.*\/status\//.test(url));
  return {
    id: post.id, text, postedAt, url: `https://x.com/${author}/status/${post.id}`,
    author, authorName: String(post.author.name || author).slice(0, 120),
    hasVideo: (post.media?.all || []).some(m=>m.type==='video'||m.type==='gif') || (post.quote?.media?.all || []).some(m=>m.type==='video'||m.type==='gif'),
    repost: author.toLowerCase() !== handle.toLowerCase(), quote, photos, links,
    categories: categories.length > 1 ? categories.filter(c => c !== 'other') : categories, dates,
    uncertainMerch: mainClassification.uncertainMerch || quoteClassification.uncertainMerch || false,
  };
}

export function normalizeTimeline(results, handle) {
  if (!Array.isArray(results)) throw new Error('Invalid timeline response');
  const posts = results.slice(0, 100).map(p => normalizePost(p, handle)).filter(Boolean);
  return posts.filter((p, i) => posts.findIndex(x => x.id === p.id) === i);
}
