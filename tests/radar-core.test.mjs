import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { parseHandle, classify, extractDates, normalizeTimeline, normalizeProfile, safeUrl, imageUrl } from '../radar-server/core.js';
import { filterPosts, mergePosts, calendarFile, todayJst, escapeHtml, safeLink } from '../radar-assets/library.js';

const timeline = JSON.parse(fs.readFileSync(new URL('./fixtures/evol-timeline.json', import.meta.url)));
const profile = JSON.parse(fs.readFileSync(new URL('./fixtures/evol-profile.json', import.meta.url)));
const posts = normalizeTimeline(timeline.results, 'evol__official');
const post = id => posts.find(p => p.id === id);

test('profile inputs accept handles and real profile URLs only', () => {
  for (const input of ['@EVOL__official', 'https://x.com/EVOL__official?s=21', 'twitter.com/EVOL__official/', 'EVOL__official']) assert.equal(parseHandle(input), 'evol__official');
  for (const input of ['https://evil.test/evol', 'https://x.com.evil.test/evol', 'https://x.com/evol/status/123', 'https://x.com/home', 'javascript:alert(1)', 'a'.repeat(16), 'a/b', 'https://x.com/user@evil.test/a', null]) assert.equal(parseHandle(input), null, input);
});
test('real EVOL: an archival live video is video, not an upcoming concert', () => {
  assert.deepEqual(post('2109211223183282590').categories, ['mv']);
  assert.deepEqual(post('2109211223183282590').dates, []);
});
test('real EVOL: next-live after a thank-you post gets the correct event date', () => {
  assert.equal(post('2108930689269948566').dates[0].date, '2026-10-14');
  assert.equal(post('2108930689269948566').dates[0].kind, 'event');
});
test('real EVOL: separate performance and sale dates on one line', () => {
  const dates = post('2105694356158181497').dates;
  assert.ok(dates.some(d => d.kind === 'event' && d.date === '2026-10-27'));
  assert.ok(dates.some(d => d.kind === 'event' && d.date === '2026-10-28'));
  assert.deepEqual(dates.filter(d => d.kind === 'ticket').map(d => [d.date, d.time]), [['2026-10-21', '23:05'], ['2026-10-21', '23:15']]);
});
test('real EVOL: a tour contains both dates and sales do not change event date type', () => {
  assert.deepEqual(post('2105694231868371366').dates.map(d => [d.date, d.kind]), [['2026-10-27', 'event'], ['2026-10-28', 'event']]);
});
test('real EVOL: repost attribution and independent ticket sale date', () => {
  const p = post('2108150117274705931');
  assert.equal(p.repost, true); assert.equal(p.author, 'REKISEN_event');
  assert.equal(p.dates.find(d => d.kind === 'event').date, '2026-10-18');
  assert.equal(p.dates.find(d => d.kind === 'ticket').date, '2026-10-11');
});
test('year rollover uses original post time; invalid dates and URLs are rejected', () => {
  const dates = extractDates('日程: 1/5\n2/30\nhttps://example.com/10/20\nOPEN/START 11:40/12:00', '2026-12-20T12:00:00Z');
  assert.deepEqual(dates.map(d => d.date), ['2027-01-05']);
  assert.equal(dates[0].inferredYear, true);
  assert.equal(extractDates('2028年2月29日', '2027-12-01')[0].inferredYear, false);
});
test('unknown or image-only content remains other; no invented dates', () => {
  assert.deepEqual(classify('詳細は画像をご覧ください！', '2026-10-13'), { categories: ['other'], dates: [], uncertainMerch: false });
});
test('normalization rejects malformed entries and unsafe media URLs', () => {
  assert.equal(normalizeProfile(profile.user).handle, 'evol__official');
  assert.equal(normalizeTimeline([{ id: 'oops', text: 'hello' }], 'a').length, 0);
  assert.equal(safeUrl('javascript:alert(1)'), null);
  assert.equal(imageUrl('https://evil.test/image.jpg'), null);
  assert.equal(safeLink('data:text/html,x'), '#');
  assert.equal(escapeHtml('<script>'), '&lt;script&gt;');
});
test('upcoming ticket filter never matches an event date; old ticket dates excluded', () => {
  const filtered = filterPosts(posts, { category: 'tickets', query: '', reposts: true, upcoming: true, sort: 'date', today: '2026-10-13' });
  assert.ok(filtered.some(p => p.id === '2105694356158181497'));
  assert.ok(!filtered.some(p => p.id === '2108150117274705931'));
});
test('repost filtering, search and pagination deduplicate predictably', () => {
  const selected = filterPosts(posts, { category: 'all', query: '東西ツアー', reposts: false, upcoming: false, sort: 'latest' });
  assert.equal(selected.length, 2); // Announcement plus ticket post quoting that announcement.
  assert.ok(selected.every(p => !p.repost));
  assert.equal(mergePosts(posts, posts).length, posts.length);
});
test('JST date is correct near UTC midnight', () => {
  assert.equal(todayJst(new Date('2026-10-12T16:00:00Z')), '2026-10-13');
});
test('calendar files use all-day dates, stable IDs, escaped text and UTF-8 line folding', () => {
  const p = post('2105694231868371366');
  const ics = calendarFile(p, '2026-10-27');
  assert.ok(ics.includes('DTSTART;VALUE=DATE:20261027'));
  assert.ok(ics.includes('DTEND;VALUE=DATE:20261028'));
  assert.ok(!ics.includes('DTSTART;TZID'));
  for (const line of ics.split('\r\n')) assert.ok(Buffer.byteLength(line) <= 75);
});

 test('ticket emoji dates and corrected sale times remain distinct from event dates', () => {
  const emoji=classify('2026.10.20\n🎫ADV ¥2,500\n❯❯❯10/16(金)22:50~ ※URLは1分前に公開','2026-10-13T10:00:00Z');
  assert.ok(emoji.categories.includes('tickets'));
  assert.equal(emoji.dates.find(d=>d.date==='2026-10-16').kind,'ticket');
  const corrected=extractDates('チケ発のお時間に変更\n10/27🎫 10/21 23:05▶︎10/21 23:15\n10/28🎫 10/21 23:15▶︎10/21 23:25','2026-10-13T16:00:00Z');
  assert.deepEqual(corrected.filter(d=>d.kind==='ticket').map(d=>d.time),['23:15','23:25']);
  assert.deepEqual(corrected.filter(d=>d.kind==='event').map(d=>d.date),['2026-10-27','2026-10-28']);
});

test('goods announcements classify and filter independently, including multiple categories', () => {
  for(const text of ['新グッズ通販開始','物販情報 アクスタ','通販チェキ販売','周邊新品','New merchandise']) assert.ok(classify(text,'2026-10-14T00:00:00Z').categories.includes('goods'));
  assert.ok(!classify('LIVE映像公開 https://youtu.be/abc','2026-10-14T00:00:00Z').categories.includes('goods'));
  const data=[{id:'g',text:'新グッズ',categories:['goods'],dates:[],repost:false},{id:'m',text:'MV',categories:['mv'],dates:[],repost:false}];
  assert.deepEqual(filterPosts(data,{category:'goods',query:'',reposts:true,upcoming:false,sort:'latest'}).map(p=>p.id),['g']);
});

test('photo sessions are schedules even without a date in text', () => {
  for(const text of ['撮影会のお知らせ','撮影會公告','攝影會詳情','摄影会通知']) assert.ok(classify(text,'2026-10-14T00:00:00Z').categories.includes('schedule'));
});

test('underground idol merchandise distinguishes benefit sessions, goods and ambiguity', () => {
  const stamp='2026-10-14T00:00:00Z';
  for(const text of ['終演後物販のご案内','並行物販','特典会 チェキ撮影','撮影券のご案内','チェキ列はこちら','握手会・サイン会']) {const result=classify(text,stamp);assert.ok(result.categories.includes('schedule'),text);assert.ok(!result.categories.includes('goods'),text);assert.equal(result.uncertainMerch,false,text);}
  for(const text of ['通販チェキ販売','チェキ郵送','グッズ受注販売','新商品 アクキー','オンラインショップ 生写真']) {const result=classify(text,stamp);assert.ok(result.categories.includes('goods'),text);assert.ok(!result.categories.includes('tickets'),text);}
  for(const text of ['物販のお知らせ','チェキについて']) {const result=classify(text,stamp);assert.ok(!result.categories.includes('goods'));assert.equal(result.uncertainMerch,true);}
  const mixed=classify('終演後物販で新グッズ・アクスタを販売します',stamp);assert.ok(mixed.categories.includes('schedule'));assert.ok(mixed.categories.includes('goods'));
});
