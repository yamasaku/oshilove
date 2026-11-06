import { t, getLanguage } from './i18n.js';
import { escapeHtml as e, todayJst, safeLink } from './library.js';
const $ = id => document.getElementById(id);
let selected = todayJst(), month = selected.slice(0,7), posts = [];
export function resetCalendar() { selected = todayJst(); month = selected.slice(0,7); }
export function calendarEntries(input, { events = true, tickets = true, reposts = true } = {}) {
  const entries = input.filter(p => reposts || !p.repost).flatMap(p => p.dates.filter(d => d.kind === 'event' ? events : tickets).map(d => ({ post:p, date:d })));
  // Repeated announcements stay linked, but identical date/context rows are collapsed.
  return entries.filter((entry,i) => entries.findIndex(x => x.date.date===entry.date.date && x.date.time===entry.date.time && x.date.kind===entry.date.kind && x.date.context===entry.date.context)===i)
    .sort((a,b)=>`${a.date.date}${a.date.time||''}`.localeCompare(`${b.date.date}${b.date.time||''}`));
}
export function monthCells(monthKey) {
  const [year, monthNumber] = monthKey.split('-').map(Number);
  const first = new Date(Date.UTC(year, monthNumber-1, 1));
  const offset = first.getUTCDay();
  const count = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  return Array.from({length:Math.ceil((offset+count)/7)*7},(_,i)=>{
    const d=new Date(Date.UTC(year,monthNumber-1,i-offset+1));
    return {date:d.toISOString().slice(0,10),inMonth:d.getUTCMonth()===monthNumber-1,day:d.getUTCDate()};
  });
}
export function renderCalendar(input = posts) {
  posts=input;
  const locale=getLanguage(), today=todayJst();
  $('calendar-month').textContent=new Intl.DateTimeFormat(locale,{year:'numeric',month:'long',timeZone:'UTC'}).format(new Date(`${month}-01T00:00:00Z`));
  $('calendar-grid').setAttribute('aria-label',t('calendar'));
  $('calendar-weekdays').innerHTML=Array.from({length:7},(_,i)=>`<span>${e(new Intl.DateTimeFormat(locale,{weekday:'short',timeZone:'UTC'}).format(new Date(Date.UTC(2026,0,4+i))))}</span>`).join('');
  const entries=calendarEntries(posts,{events:$('calendar-events').checked,tickets:$('calendar-tickets').checked,reposts:$('reposts').checked});
  $('calendar-grid').innerHTML=monthCells(month).map(cell=>{
    const items=entries.filter(x=>x.date.date===cell.date);
    const eventCount=items.filter(x=>x.date.kind==='event').length,ticketCount=items.length-eventCount;
    const label=`${cell.date} · ${t('events')} ${eventCount} · ${t('ticketDates')} ${ticketCount}`;
    return `<button class="calendar-day ${cell.inMonth?'':'outside'} ${cell.date===today?'today':''} ${cell.date===selected?'selected':''}" data-day="${cell.date}" aria-label="${e(label)}" aria-pressed="${cell.date===selected}"><span class="day-number">${cell.day}</span><span class="day-marks">${eventCount?`<span class="day-mark event-mark"><i></i><b>${eventCount}</b></span>`:''}${ticketCount?`<span class="day-mark ticket-mark"><i></i><b>${ticketCount}</b></span>`:''}</span>${items.length?`<span class="day-preview">${e(items[0].date.context)}</span>`:''}</button>`;
  }).join('');
  const day=entries.filter(x=>x.date.date===selected);
  $('agenda-date').textContent=new Intl.DateTimeFormat(locale,{month:'long',day:'numeric',weekday:'short',timeZone:'UTC'}).format(new Date(`${selected}T00:00:00Z`));
  $('agenda-count').textContent=t('entries',{n:day.length});
  $('agenda-items').innerHTML=day.length?day.map(({post:p,date:d})=>`<article class="agenda-item ${d.kind}"><div><span class="tag ${d.kind==='event'?'schedule':'tickets'}">${d.kind==='event'?t('eventDate'):d.label==='售票／抽選截止'?t('deadline'):'チケ発'}</span><strong>${e(d.time||'')}</strong></div><p>${e(d.context)}</p><small>@${e(p.author)}${d.inferredYear?` · ${t('inferred')}`:''}</small><a href="${e(safeLink(p.url))}" target="_blank" rel="noopener noreferrer">${t('original')}</a></article>`).join(''):`<p class="agenda-empty">${t('dayEmpty')}</p>`;
}
export function initCalendar() {
  const move=delta=>{const d=new Date(`${month}-01T00:00:00Z`);d.setUTCMonth(d.getUTCMonth()+delta);month=d.toISOString().slice(0,7);selected=`${month}-01`;renderCalendar();};
  $('calendar-prev').addEventListener('click',()=>move(-1));$('calendar-next').addEventListener('click',()=>move(1));
  $('calendar-today').addEventListener('click',()=>{resetCalendar();renderCalendar();});
  ['calendar-events','calendar-tickets'].forEach(id=>$(id).addEventListener('change',()=>renderCalendar()));
  $('calendar-grid').addEventListener('click',event=>{const button=event.target.closest('[data-day]');if(!button)return;selected=button.dataset.day;month=selected.slice(0,7);renderCalendar();$('calendar-grid').querySelector(`[data-day="${selected}"]`)?.focus({preventScroll:true});});
  $('calendar-grid').addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key))return;const target=event.target.closest('[data-day]');if(!target)return;event.preventDefault();const d=new Date(`${target.dataset.day}T00:00:00Z`);d.setUTCDate(d.getUTCDate()+({ArrowLeft:-1,ArrowRight:1,ArrowUp:-7,ArrowDown:7}[event.key]));selected=d.toISOString().slice(0,10);month=selected.slice(0,7);renderCalendar();$('calendar-grid').querySelector(`[data-day="${selected}"]`)?.focus({preventScroll:true});});
}
