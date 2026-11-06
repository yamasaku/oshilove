import { LABELS, escapeHtml as e, safeLink, safeImage, todayJst, mergePosts, filterPosts, calendarFile } from './library.js';
import { t, getLanguage, setLanguage, applyLanguage, categoryLabel } from './i18n.js';
import { initCalendar, renderCalendar, resetCalendar } from './calendar.js';

const $ = id => document.getElementById(id);
const STORAGE_KEY = 'oshi-radar-v1';
let storage;
try { storage = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); } catch { storage = null; }
if (!storage || !Array.isArray(storage.following) || !storage.snapshots || !storage.seen) storage = { following: [], snapshots: {}, seen: {} };
storage.following = storage.following.filter(p => p && /^[a-z0-9_]{1,15}$/.test(p.handle)).slice(0, 50);
// Treat browser data as untrusted and avoid special object-key setters.
storage.snapshots = Object.assign(Object.create(null), typeof storage.snapshots === 'object' ? storage.snapshots : {});
storage.seen = Object.assign(Object.create(null), typeof storage.seen === 'object' ? storage.seen : {});
for (const key of Object.keys(storage.seen)) if (!Array.isArray(storage.seen[key])) delete storage.seen[key];
let current = null, category = 'all', busy = false, controller, generation = 0, pages = 1, isStale = false;
let baseline = new Set(), newIds = new Set(), toastTimer;

function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(storage)); }
  catch { toast(t('storageError')); }
}
function toast(message) {
  $('toast').textContent = message; $('toast').hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { $('toast').hidden = true; }, 4000);
}
function notice(message = '') { $('notice').textContent = message; $('notice').hidden = !message; }
function isFollowing(handle) { return storage.following.some(p => p.handle === handle); }
function renderFollowing() {
  $('follow-count').textContent = storage.following.length;
  $('following').innerHTML = storage.following.length ? storage.following.map(p => {
    const img = safeImage(p.avatar);
    return `<a class="follow-item ${current?.profile.handle === p.handle ? 'selected' : ''}" href="${location.pathname}?account=${e(p.handle)}" data-handle="${e(p.handle)}">${img ? `<img src="${e(img)}" alt="" loading="lazy">` : '<span class="follow-fallback">✳</span>'}<div><strong>${e(p.name)}</strong><small>@${e(p.handle)}</small></div></a>`;
  }).join('') : `<p class="follow-empty">${e(t('emptyFollowing'))}</p>`;
  if (current) {
    const followed = isFollowing(current.profile.handle);
    $('follow').textContent = t(followed ? 'unfollow' : 'follow');
    $('follow').classList.toggle('is-following', followed);
    $('follow').setAttribute('aria-pressed', String(followed));
  }
}
function displayTime(value) {
  return new Intl.DateTimeFormat(getLanguage(), { timeZone: 'Asia/Tokyo', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(value));
}
function friendlyDate(value) { const [, month, day] = value.split('-'); return `${Number(month)}/${Number(day)}`; }
function renderProfile() {
  const p = current.profile;
  document.querySelector('.radar-app').classList.add('has-account'); $('account').hidden = false; $('welcome').hidden = true;
  $('profile-name').textContent = p.name;
  $('profile-handle').textContent = `@${p.handle} ↗`; $('profile-handle').href = safeLink(p.url);
  $('profile-description').textContent = p.description;
  const avatar = safeImage(p.avatar);
  $('avatar').hidden = !avatar; if (avatar) $('avatar').src = avatar;
  $('follower-label').textContent = t('followerCount', { n: Number(p.followers).toLocaleString('en') });
  $('profile-links').innerHTML = p.links.map(link => `<a href="${e(safeLink(link))}" target="_blank" rel="noopener noreferrer">${e(new URL(link).hostname.replace('www.', ''))} ↗</a>`).join('');
  $('sync-time').textContent = `${t(isStale ? 'saved' : 'fetched')}：${displayTime(current.fetchedAt)} JST · ${t('cached')}`;
  $('new-count').textContent = newIds.size ? t('newCount', { n: newIds.size }) : '';

  renderFollowing(); renderFeed();
}

function renderHighlights() {
  const today = todayJst();
  const nowJst = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Tokyo', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date());
  const options = current.posts.filter(p => $('reposts').checked || !p.repost).flatMap(p => p.dates.map(d => ({ p, d }))).filter(({ d }) => d.date >= today && !(d.date === today && d.time && d.time < nowJst));
  const render = (kind, title, empty) => {
    const result = options.filter(({ d }) => d.kind === kind).sort((a, b) => `${a.d.date}${a.d.time || '00:00'}`.localeCompare(`${b.d.date}${b.d.time || '00:00'}`))[0];
    return `<article class="highlight ${kind === 'ticket' ? 'ticket-highlight' : ''}"><span class="eyebrow">${title}</span>${result ? `<a href="${e(safeLink(result.p.url))}" target="_blank" rel="noopener noreferrer" class="highlight-body"><div class="highlight-date">${friendlyDate(result.d.date)}<small>${e(result.d.time || 'JST')}${result.d.inferredYear ? ` · ${t('inferred')}` : ''}</small></div><div class="highlight-detail"><strong>${e(result.d.context)}</strong><span>${t('verify')}</span></div></a>` : `<div class="highlight-body"><div class="highlight-detail"><strong>${empty}</strong><span>${t('loadedDates')}</span></div></div>`}</article>`;
  };
  $('highlights').innerHTML = render('event', t('next'), t('noEvent')) + render('ticket', t('ticketWatch'), t('noTicket'));
}

function postMarkup(p) {
  const photo = p.photos?.[0], image = safeImage(photo?.url);
  const links = p.links.filter(link => safeLink(link) !== '#').slice(0, 4);
  const dates = p.dates.filter(d => category === 'tickets' ? d.kind === 'ticket' : category === 'schedule' ? d.kind === 'event' : true);
  return `<article class="post" data-id="${e(p.id)}">
    ${image ? `<a class="post-media" href="${e(safeLink(p.url))}" target="_blank" rel="noopener noreferrer" tabindex="-1" aria-hidden="true"><img class="post-image" src="${e(image)}" alt="" loading="lazy" decoding="async"><span class="media-count">${photo.type === 'video' ? '▷ VIDEO' : p.photos.length > 1 ? t('images', { n: p.photos.length }) : t('image')}</span></a>` : ''}
    <div class="post-body"><div class="post-top"><div class="tags">${p.categories.map(c => `<span class="tag ${e(c)}">${e(categoryLabel(c))}</span>`).join('')}${p.uncertainMerch ? `<span class="tag uncertain">${e(t('uncertainMerch'))}</span>` : ''}${newIds.has(p.id) ? '<span class="tag new">NEW</span>' : ''}</div><time class="post-date" datetime="${e(p.postedAt)}">${displayTime(p.postedAt).split(' ')[0]}</time></div>
    ${p.repost ? `<div class="repost-label">${e(t('repostBy', { name: p.author }))}</div>` : ''}
    <p class="post-text">${e(p.text)}</p>${p.text.length > 140 || p.text.split('\n').length > 5 ? `<button class="expand-button" data-action="expand" aria-expanded="false">${t('expand')}</button>` : ''}
    ${p.quote ? `<details class="quote"><summary>${e(t('quote', { name: p.quote.author }))}</summary><p>${e(p.quote.text)}</p><a class="text-button" href="${e(safeLink(p.quote.url))}" target="_blank" rel="noopener noreferrer">${t('original')}</a></details>` : ''}
    ${dates.length ? `<div class="date-list">${dates.slice(0, 5).map(d => `<div class="date-row"><span class="date-kind">${e(d.kind === 'event' ? t('eventDate') : d.label === '售票／抽選截止' ? t('deadline') : 'チケ発')}</span><time datetime="${e(d.date)}">${e(d.date)}${d.time ? ` ${e(d.time)}` : ''}</time>${d.inferredYear ? `<small>${t('inferred')}</small>` : ''}${d.kind === 'event' ? `<button class="calendar-button" data-action="calendar" data-date="${e(d.date)}" title="${t('calendarExport')}">${t('addCalendar')}</button>` : '<small>JST</small>'}</div>`).join('')}${dates.length > 5 ? `<small class="small">${t('moreDates')}</small>` : ''}</div>` : ''}
    ${links.length ? `<div class="post-links">${links.map(link => `<a href="${e(safeLink(link))}" target="_blank" rel="noopener noreferrer">${/youtu/.test(new URL(link).hostname) ? t('watch') : /livepocket|tiget|pia\.jp|t-dv/.test(new URL(link).hostname) ? t('buy') : `↗ ${e(new URL(link).hostname.replace('www.', ''))}`}</a>`).join('')}</div>` : ''}
    <div class="post-footer"><span>@${e(p.author)}</span><a href="${e(safeLink(p.url))}" target="_blank" rel="noopener noreferrer">${t('original')}</a></div></div></article>`;
}

function renderFeed() {
  if (!current) return;
  const reposts = $('reposts').checked; $('calendar-reposts').checked = reposts;
  const counted = current.posts.filter(p => reposts || !p.repost);
  document.querySelectorAll('[data-category]').forEach(tab => {
    const c = tab.dataset.category;
    tab.childNodes[0].textContent = `${c === 'all' ? t('all') : c === 'mv' ? 'MV' : categoryLabel(c)} `;
    tab.setAttribute('aria-selected', String(category === c));
    tab.tabIndex = category === c ? 0 : -1;
    tab.querySelector('span').textContent = c === 'all' ? counted.length : counted.filter(p => c==='video' ? p.hasVideo || p.photos?.some(m=>m.type==='video') : p.categories.includes(c)).length;
  });
  $('upcoming-label').hidden = !['schedule', 'tickets'].includes(category);
  const posts = filterPosts(current.posts, { category, query: $('filter').value.trim(), reposts, upcoming: !$('upcoming-label').hidden && $('upcoming').checked, sort: $('sort').value });
  $('feed').innerHTML = posts.map(postMarkup).join('');
  $('empty').hidden = !!posts.length;
  $('load-more').hidden = !current.nextCursor || pages >= 5;
  $('load-more').disabled = busy;
  $('feed-count').textContent = t('count', { shown: posts.length, total: current.posts.length }) + (pages >= 5 ? t('pageLimit') : '');
  renderHighlights(); renderCalendar(current.posts);
}

function setBusy(value) {
  busy = value; $('loading').hidden = !value;
  $('search-submit').disabled = value; $('refresh').disabled = value; $('load-more').disabled = value;
  $('account').setAttribute('aria-busy', String(value));
}
function remember(data) {
  const h = data.profile.handle;
  storage.snapshots[h] = { ...data, posts: data.posts.slice(0, 60), nextCursor: null };
  const keys = Object.keys(storage.snapshots).sort((a, b) => Date.parse(storage.snapshots[b].fetchedAt) - Date.parse(storage.snapshots[a].fetchedAt));
  keys.slice(8).forEach(key => delete storage.snapshots[key]);
  storage.seen[h] = [...new Set([...(storage.seen[h] || []), ...data.posts.map(p => p.id)])].slice(-500);
  const tracked = storage.following.find(p => p.handle === h);
  if (tracked) Object.assign(tracked, { name: data.profile.name, avatar: data.profile.avatar });
  save();
}
function validSnapshot(data) {
  return data && data.profile && /^[a-z0-9_]{1,15}$/.test(data.profile.handle) &&
    Array.isArray(data.profile.links) && data.profile.links.every(link => safeLink(link) !== '#') &&
    Array.isArray(data.posts) && data.posts.length <= 500 && !Number.isNaN(Date.parse(data.fetchedAt)) &&
    data.posts.every(p => p && /^\d{1,25}$/.test(p.id) && safeLink(p.url) !== '#' &&
      !Number.isNaN(Date.parse(p.postedAt)) && typeof p.text === 'string' && p.text.length <= 16000 &&
      Array.isArray(p.categories) && p.categories.every(c => ['schedule','tickets','mv','goods','other'].includes(c)) &&
      Array.isArray(p.dates) && p.dates.every(d => d && /^\d{4}-\d{2}-\d{2}$/.test(d.date) && ['event','ticket'].includes(d.kind) && typeof d.context === 'string') &&
      Array.isArray(p.links) && p.links.every(link => safeLink(link) !== '#'));
}
async function loadAccount(input, { more = false, refresh = false, navigate = true } = {}) {
  controller?.abort(); controller = new AbortController();
  const run = ++generation;
  notice();
  if (!more && !refresh) {
    current = null; category = 'all'; pages = 1; newIds = new Set(); resetCalendar();
    $('filter').value = ''; $('sort').value = 'latest'; $('upcoming').checked = false;
    const localHandle = input.replace(/^@/, '').toLowerCase();
    baseline = new Set(storage.seen[localHandle] || []);
    const snapshot = storage.snapshots[localHandle];
    if (validSnapshot(snapshot)) { current = snapshot; isStale = true; renderProfile(); }
    else { $('account').hidden = true; $('welcome').hidden = true; }
  }
  setBusy(true);
  try {
    const params = new URLSearchParams({ handle: input });
    const requestedCursor = more ? current?.nextCursor : null;
    if (requestedCursor) params.set('cursor', requestedCursor);
    const response = await fetch(`/api/radar/profile?${params}`, { signal: controller.signal, cache: 'no-store' });
    const data = await response.json();
    if (run !== generation) return;
    if (!response.ok) throw Object.assign(new Error(t(data.code || 'SOURCE_UNAVAILABLE')), { code: data.code });
    if (!validSnapshot(data)) throw new Error(t('SOURCE_UNAVAILABLE'));
    const oldData = current;
    if (!more) {
      if (!refresh) baseline = new Set(storage.seen[data.profile.handle] || []);
      newIds = new Set(baseline.size ? data.posts.filter(p => !baseline.has(p.id)).map(p => p.id) : []);
      // Fresh timelines are authoritative. Keep older pages only after deliberate pagination.
      current = data; pages = 1;
    } else {
      current = { ...oldData, posts: mergePosts(oldData.posts, data.posts), nextCursor: data.nextCursor === requestedCursor ? null : data.nextCursor };
      pages++;
    }
    isStale = false;
    $('account-input').value = `@${current.profile.handle}`;
    if (navigate && !more && !refresh) {
      const path = `${location.pathname}?account=${encodeURIComponent(current.profile.handle)}`;
      if (`${location.pathname}${location.search}` !== path) history.pushState(null, '', path);
    }
    remember(current); renderProfile();
    if (refresh && oldData?.fetchedAt === data.fetchedAt) toast(t('cacheToast'));
    else if (refresh) toast(t('refreshed'));
  } catch (error) {
    if (error.name === 'AbortError' || run !== generation) return;
    isStale = !!current;
    notice(`${error.code ? t(error.code) : t('SOURCE_UNAVAILABLE')}${current ? t('stale') : ''}`);
    if (current) renderProfile(); else $('welcome').hidden = false;
  } finally {
    if (run === generation) { setBusy(false); if (current) renderFeed(); }
  }
}
function goHome() {
  controller?.abort(); generation++; current = null; newIds.clear(); setBusy(false);
  document.querySelector('.radar-app').classList.remove('has-account'); $('account').hidden = true; $('welcome').hidden = false;
  $('account-input').value = ''; notice(); renderFollowing();
}

$('search-form').addEventListener('submit', event => { event.preventDefault(); const input = $('account-input').value.trim(); if (input) void loadAccount(input); });
$('example').addEventListener('click', () => { $('account-input').value = '@EVOL__official'; void loadAccount('evol__official'); });
$('following').addEventListener('click', event => { const link = event.target.closest('[data-handle]'); if (!link || event.ctrlKey || event.metaKey) return; event.preventDefault(); void loadAccount(link.dataset.handle); });
$('refresh').addEventListener('click', () => { if (current && !busy) void loadAccount(current.profile.handle, { refresh: true }); });
$('load-more').addEventListener('click', () => { if (current && !busy) void loadAccount(current.profile.handle, { more: true }); });
$('follow').addEventListener('click', () => {
  if (!current) return;
  const p = current.profile;
  if (isFollowing(p.handle)) { storage.following = storage.following.filter(x => x.handle !== p.handle); toast(t('unfollowed')); }
  else {
    if (storage.following.length >= 50) { toast(t('maxFollows')); return; }
    storage.following.push({ handle: p.handle, name: p.name, avatar: p.avatar }); toast(t('followed'));
  }
  save(); renderFollowing();
});
function selectCategory(value) { category = value; $('sort').value = ['schedule', 'tickets'].includes(category) ? 'date' : 'latest'; renderFeed(); }
$('tabs').addEventListener('click', event => { const tab = event.target.closest('[data-category]'); if (tab) selectCategory(tab.dataset.category); });
$('tabs').addEventListener('keydown', event => {
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
  event.preventDefault(); const tabs = [...$('tabs').querySelectorAll('button')]; const i = tabs.indexOf(document.activeElement);
  const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (i + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
  selectCategory(tabs[next].dataset.category); tabs[next].focus();
});
['filter', 'reposts', 'upcoming', 'sort'].forEach(id => $(id).addEventListener(id === 'filter' ? 'input' : 'change', renderFeed));
$('feed').addEventListener('click', event => {
  const button = event.target.closest('[data-action]'); if (!button) return;
  const article = button.closest('.post');
  if (button.dataset.action === 'expand') { const expanded = article.classList.toggle('expanded'); button.textContent = t(expanded ? 'collapse' : 'expand'); button.setAttribute('aria-expanded', String(expanded)); }
  if (button.dataset.action === 'calendar') {
    const post = current.posts.find(p => p.id === article.dataset.id);
    const url = URL.createObjectURL(new Blob([calendarFile(post, button.dataset.date, t('icsNote'))], { type: 'text/calendar;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = `oshi-${post.id}-${button.dataset.date}.ics`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast(t('calendarSaved'));
  }
});
['about-open', 'privacy-open', 'menu-privacy'].forEach(id => $(id).addEventListener('click', () => { $('site-menu').open = false; $('about').showModal(); }));
$('about').querySelector('.dialog-close').addEventListener('click', () => $('about').close());
$('about').addEventListener('click', event => { if (event.target === $('about')) { const rect = $('about').getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) $('about').close(); } });
$('clear-local').addEventListener('click', () => {
  if (!confirm(t('clearConfirm'))) return;
  storage = { following: [], snapshots: {}, seen: {} }; save(); baseline.clear(); newIds.clear(); renderFollowing(); if (current) renderProfile();
  localStorage.removeItem('oshi-language');
  document.dispatchEvent(new Event('oshi-clear-local'));
  $('storage-message').textContent = t('cleared');
});
window.addEventListener('popstate', () => { const handle = new URLSearchParams(location.search).get('account'); if (handle) void loadAccount(handle, { navigate: false }); else goHome(); });
document.addEventListener('error', event => { if (event.target instanceof HTMLImageElement) event.target.hidden = true; }, true);
applyLanguage(); initCalendar();
$('language').addEventListener('change', () => { setLanguage($('language').value); applyLanguage(); $('site-menu').open = false; notice(); renderFollowing(); if (current) renderProfile(); });
renderFollowing();
const initial = new URLSearchParams(location.search).get('account');
if (initial) { $('account-input').value = initial; void loadAccount(initial, { navigate: false }); }

for (const view of ['posts','calendar']) $('view-'+view).addEventListener('click', () => {
  for (const name of ['posts','calendar']) { $(name+'-panel').hidden=name!==view; $('view-'+name).setAttribute('aria-pressed',String(name===view)); }
});
document.addEventListener('click', event => { if (!$('site-menu').contains(event.target)) $('site-menu').open=false; });
document.addEventListener('keydown', event => { if(event.key==='Escape' && $('site-menu').open){ $('site-menu').open=false; $('site-menu').querySelector('summary').focus(); } });
$('export-following').addEventListener('click', () => {
  const url=URL.createObjectURL(new Blob([JSON.stringify({version:1,following:storage.following})],{type:'application/json'}));
  const link=document.createElement('a'); link.href=url; link.download='oshi-following.json'; link.click(); setTimeout(()=>URL.revokeObjectURL(url),1000); $('site-menu').open=false;
});
$('import-following').addEventListener('click', () => $('import-file').click());
$('import-file').addEventListener('change',async () => {
  const file=$('import-file').files[0]; if(!file)return;
  try {
    if(file.size>100000) throw new Error();
    const data=JSON.parse(await file.text());
    if(data.version!==1 || !Array.isArray(data.following) || !data.following.every(p=>p && typeof p.handle==='string' && /^[a-z0-9_]{1,15}$/.test(p.handle)))throw new Error();
    for(const p of data.following){if(storage.following.length>=50)break; if(!isFollowing(p.handle)) storage.following.push({handle:p.handle,name:typeof p.name==='string'?p.name.slice(0,100):p.handle,avatar:safeImage(p.avatar)});}
    save(); renderFollowing(); toast(t('imported')); $('site-menu').open=false;
  } catch {toast(t('invalidImport'));} finally {$('import-file').value='';}
});

$('calendar-reposts').addEventListener('change', () => { $('reposts').checked = $('calendar-reposts').checked; renderFeed(); });



const topButton = $('back-to-top');
function updateTopButton() { topButton.hidden = window.scrollY < 400; }
window.addEventListener('scroll', updateTopButton, { passive: true });
topButton.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  document.querySelector('.landing-brand')?.focus({ preventScroll: true });
});
updateTopButton();
