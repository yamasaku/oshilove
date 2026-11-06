import fs from 'node:fs';
import path from 'node:path';
import {parse,serialize,attr,set,all,one,tag,remove,inner,append,escape} from './html.mjs';
import {pages,languages,pagePath,identify} from '../locale-routes.js';
import {localeRows} from '../radar-assets/i18n.js';
const origin='https://oshilovepocket.com';
const info={
 '':{
  ja:['OshiLove & Oshi Pocket｜推し活記録アプリ・素材・Xの投稿チェック','推し活の写真・日記・記念日は OshiLove、現場と支出は Oshi Pocket。背景透過 PNG 素材と、ライブやチケット情報を探せる Xの投稿チェック も使えます。'],
  'zh-tw':['OshiLove & Oshi Pocket｜追星記錄 App、素材與 X 動態追蹤','用 OshiLove 整理相片、日記及紀念日，用 Oshi Pocket 記錄活動及開支。另提供透明 PNG 素材及 X 動態追蹤，可篩選演出、售票與影片資訊。'],
  en:['OshiLove & Oshi Pocket | Oshi apps, PNG resources and X Updates','Record oshi photos, diaries and anniversaries with OshiLove, and events and expenses with Oshi Pocket. Explore transparent PNG resources and search and filter posts from public X accounts.']},
 resources:{ja:['推し活素材｜透過 PNG フレーム・スタンプ | Oshi','推し活や Instagram ストーリーに使える背景透過 PNG フレーム・スタンプ。色・テーマ・記念日で検索し、原寸画像や ZIP を直接ダウンロード。'], 'zh-tw':['推し活素材｜透明 PNG 相框與貼圖 | Oshi','下載追星及 Instagram Story 用的透明 PNG 相框與貼圖。按名稱、顏色、主題及紀念日搜尋，並可在瀏覽器內加入相片製作。'],en:['Oshi resources | Transparent PNG frames and stamps','Find transparent PNG frames and stamps for oshi posts and Instagram Stories. Search by colour, theme or anniversary, download originals or add your own photo.']},
 radar:{ja:['Xの投稿チェック｜Xのライブ・チケット・動画を整理 | Oshi','公開 X アカウントのポストからライブ、チケット発売、MV・動画、グッズ情報を整理。日付をカレンダーで確認し、フォローをブラウザに保存。X ログイン不要。'], 'zh-tw':['X 動態追蹤｜整理 X 演出、售票與影片資訊 | Oshi','搜尋公開 X 帳戶，按演出、售票、MV、影片及周邊篩選貼文，並在日曆查看相關日期。毋須登入 X，收藏只儲存在您的瀏覽器。'],en:['X Updates | Organise X events, tickets and videos','Find events, ticket sales, music videos and video posts from public X accounts. View extracted dates on a calendar and save follows in your browser. No X login needed.']},
 privacy:{ja:['プライバシーポリシー | OshiLove・Oshi Pocket','OshiLove、Oshi Pocket と本サイトのプライバシーポリシー。端末内の記録、写真の権限、購入、Xの投稿チェック、アクセス解析とお問い合わせについて。'],'zh-tw':['私隱政策 | OshiLove・Oshi Pocket','了解 OshiLove、Oshi Pocket 及本網站如何處理資料，包括裝置內記錄、相片權限、購買、X 動態追蹤、網站分析及聯絡方式。'],en:['Privacy Policy | OshiLove & Oshi Pocket','How OshiLove, Oshi Pocket and this website handle information, including on-device records, photo permissions, purchases, X Updates, analytics and contact details.']},
 support:{ja:['FAQ・サポート | OshiLove・Oshi Pocket','OshiLove と Oshi Pocket のよくある質問とサポート。使い方、写真、バックアップ、Premium 購入や復元、お問い合わせについて。'],'zh-tw':['常見問題與支援 | OshiLove・Oshi Pocket','查看 OshiLove 與 Oshi Pocket 的常見問題、使用說明、相片、備份、Premium 購買及還原資訊，或聯絡支援。'],en:['FAQ & Support | OshiLove & Oshi Pocket','Find help for OshiLove and Oshi Pocket, including photos, backups, Premium purchases and restoring access, or contact support.']}
};
const htmlLang={ja:'ja','zh-tw':'zh-Hant',en:'en'};
function meta(head,key,value,property=false){const a=property?'property':'name';let node=one(head,n=>n.tagName==='meta'&&attr(n,a)===key);if(!node){append(head,`<meta ${a}="${key}" content="">`);node=head.childNodes.at(-1);}set(node,'content',value);}
function localizeRadar(doc,lang){
 const ix={ja:0,'zh-tw':2,en:4}[lang], t=k=>localeRows[k]?.[ix]||localeRows[k]?.[0]||k;
 const byId={ 'search-submit':'search',example:'example','loading-title':'loadingTitle',refresh:'refresh','load-more':'loadMore','about-open':'how','menu-privacy':'privacy','export-following':'exportFollowing','import-following':'importFollowing','language-current':'menu','migration-link':'migration','view-posts':'postsView','view-calendar':'calendar','calendar-today':'today','clear-local':'clear'};
 for(const [id,key] of Object.entries(byId)){const n=one(doc,n=>attr(n,'id')===id);if(n)inner(n,escape(t(key)));}
 const hero=one(doc,n=>attr(n,'class')==='hero-copy');if(hero){inner(tag(hero,'h1'),escape(t('homeTitle')));inner(one(hero,n=>attr(n,'class')==='intro'),t('intro'));}
 const welcome=one(doc,n=>attr(n,'id')==='welcome');inner(tag(welcome,'h2'),escape(t('welcomeTitle')));
 const features=all(welcome,n=>attr(n,'class')==='feature');features.forEach((n,i)=>{inner(tag(n,'small'),escape(t(['featureSchedule','featureVideo','featureTicket'][i])));inner(tag(n,'p'),escape(t(['scheduleText','videoText','ticketText'][i])));});
 const input=one(doc,n=>attr(n,'id')==='account-input');set(input,'placeholder',t('input'));set(input,'aria-label',t('input'));
 const hint=one(doc,n=>attr(n,'class')==='search-hint');if(hint)inner(tag(hint,'span'),escape(t('publicHint')));
 const follow=one(doc,n=>attr(n,'id')==='following');inner(follow,`<p class="follow-empty">${escape(t('emptyFollowing'))}</p>`);
}
export function buildSEO(root,output,catalog){
 const sitemap=[];
 const templates=Object.fromEntries(pages.map(page=>[page,fs.readFileSync(path.join(output,(page||'index')+'.html'),'utf8')]));
 for(const page of pages)for(const lang of languages){
  const route=pagePath(page,lang);
  const doc=parse(templates[page]),head=tag(doc,'head');
  const html=tag(doc,'html');set(html,'lang',htmlLang[lang]);set(html,'data-language',lang);set(html,'data-fixed-language',lang);set(html,'data-page',page||'home');
  if(page==='resources'){
   const target=one(doc,n=>attr(n,'id')==='material-results');
   inner(target,catalog.items.map(item=>{
    const cover=item.variants.find(v=>v.color==='white')||item.variants.find(v=>v.color==='pink')||item.variants[0],title=item.titles?.[lang]||item.title;
    const kind=({ja:{frame:'フレーム',stamp:'スタンプ'},'zh-tw':{frame:'相框',stamp:'貼圖'},en:{frame:'Frame',stamp:'Stamp'}})[lang][item.type];
    return `<article class="catalog-card"><a class="catalog-cover" href="${route}?series=${encodeURIComponent(item.id)}"><img src="${cover.preview}" width="${cover.width}" height="${cover.height}" alt="${escape(title)}" loading="lazy"></a><div class="catalog-card-body"><h3>${escape(title)}</h3><p>${kind} · ${item.variants.length} PNG${item.eventDate?' · '+item.eventDate.replace('-','/'):''}</p><a class="pill-button" href="${item.zip.url}" download>${({ja:'全 PNG を保存','zh-tw':'下載整套 PNG',en:'Download all PNGs'})[lang]}</a></div></article>`;
   }).join(''));
   const count=one(doc,n=>attr(n,'id')==='material-count');inner(count,escape(`${catalog.items.length} ${({ja:'シリーズ','zh-tw':'個系列',en:'series'})[lang]}`));
  }
  if(page==='radar')localizeRadar(doc,lang);
  // Each locale has actual translated HTML before JavaScript runs.
  for(const n of all(doc,n=>attr(n,'data-lang')!==undefined))if(attr(n,'data-lang')!==lang&&n.parentNode)remove(n);
  for(const n of all(head,n=>n.tagName==='link'&&['canonical','alternate'].includes(attr(n,'rel'))||n.tagName==='script'&&attr(n,'type')==='application/ld+json'))remove(n);
  const [title,description]=info[page][lang];inner(tag(head,'title'),escape(title));
  for(const l of languages){set(tag(head,'title'),'data-page-title-'+l,info[page][l][0]);}
  meta(head,'description',description);const desc=one(head,n=>attr(n,'name')==='description');for(const l of languages)set(desc,'data-page-description-'+l,info[page][l][1]);
  meta(head,'robots','index,follow,max-image-preview:large');meta(head,'og:type','website',true);meta(head,'og:site_name','OshiLove & Oshi Pocket',true);meta(head,'og:title',title,true);meta(head,'og:description',description,true);meta(head,'og:url',origin+route,true);meta(head,'og:image',origin+'/social-preview.png',true);meta(head,'og:locale',({ja:'ja_JP','zh-tw':'zh_TW',en:'en_US'})[lang],true);
  for(const [key,value] of Object.entries({'twitter:card':'summary_large_image','twitter:title':title,'twitter:description':description,'twitter:image':origin+'/social-preview.png'}))meta(head,key,value);
  append(head,`<link rel="canonical" href="${origin+route}">`+languages.map(l=>`<link rel="alternate" hreflang="${htmlLang[l]}" href="${origin+pagePath(page,l)}">`).join('')+`<link rel="alternate" hreflang="x-default" href="${origin+pagePath(page,'ja')}">`);
  for(const n of all(doc,n=>n.tagName)){
   for(const key of ['src','href','poster']){
    const value=attr(n,key);if(!value||/^(?:#|[a-z]+:|\/\/)/i.test(value))continue;
    const u=new URL(value,origin+'/');
    if(key==='href'&&n.tagName==='a'){
     const target=identify(u.pathname);
     if(target){u.pathname=pagePath(target.page,lang);u.searchParams.delete('lang');}
    }
    set(n,key,u.pathname+u.search+u.hash);
   }
  }
  const form=one(doc,n=>attr(n,'data-radar-form')!==undefined);if(form)set(form,'action',pagePath('radar',lang));
  const graph=[{'@type':page==='resources'?'CollectionPage':'WebPage','@id':origin+route+'#page',url:origin+route,name:title,description,inLanguage:htmlLang[lang],isPartOf:{'@id':origin+'/#website'}}];
  if(!page){graph.push({'@type':'WebSite','@id':origin+'/#website',url:origin+'/',name:'OshiLove & Oshi Pocket',inLanguage:Object.values(htmlLang)});for(const [name,id,anchor] of [['OshiLove','6811063943','oshilove'],['Oshi Pocket','6811325536','oshipocket']])graph.push({'@type':'SoftwareApplication',name,operatingSystem:'iOS',applicationCategory:'LifestyleApplication',url:origin+route+'#'+anchor,downloadUrl:'https://apps.apple.com/app/id'+id});}
  else graph.push({'@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Oshi',item:origin+pagePath('',lang)},{'@type':'ListItem',position:2,name:title,item:origin+route}]});
  if(page==='radar')graph.push({'@type':'WebApplication',name:localeRows.homeTitle[{ja:0,'zh-tw':2,en:4}[lang]],url:origin+route,applicationCategory:'UtilitiesApplication',operatingSystem:'Web browser',description,inLanguage:htmlLang[lang]});
  append(head,`<script type="application/ld+json">${JSON.stringify({'@context':'https://schema.org','@graph':graph}).replaceAll('<','\\u003c')}</script>`);
  const destination=path.join(output,route==='/'?'index.html':route.slice(1)+'.html');fs.mkdirSync(path.dirname(destination),{recursive:true});fs.writeFileSync(destination,serialize(doc));
  sitemap.push(`<url><loc>${origin+route}</loc>${languages.map(l=>`<xhtml:link rel="alternate" hreflang="${htmlLang[l]}" href="${origin+pagePath(page,l)}"/>`).join('')}<xhtml:link rel="alternate" hreflang="x-default" href="${origin+pagePath(page,'ja')}"/></url>`);
 }
 fs.writeFileSync(path.join(output,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${sitemap.join('')}</urlset>`);
 // Legacy source files are redirects handled by the Worker, not competing landing pages.
 fs.rmSync(path.join(output,'ja.html'),{force:true});
}
