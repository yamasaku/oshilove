import {matches, matchingVariants} from "./resources-core.mjs";
import {createPhotoComposer} from "./photo-composer.js";

const text = {
  ja: {
    all:"すべて", frame:"フレーム", stamp:"スタンプ", anniversary:"記念日", halloween:"ハロウィン", daily:"日常",
    pink:"ピンク", red:"赤", orange:"オレンジ", yellow:"黄色", green:"緑", blue:"青", purple:"紫", white:"白", black:"黒",
    search:"名前・キーワード・11/04 など", prev:"前の月", next:"次の月", days:["日","月","火","水","木","金","土"],
    count:n=>n+" シリーズ", files:n=>n+" 枚", browse:"素材を見る", download:"PNG を保存", zip:"全 PNG を ZIP で保存", variant:"素材", colors:"カラー",
    dateClear:"日付を解除", empty:"条件に合う素材がありません。キーワードや条件を変更してください。",
    error:"素材を読み込めませんでした。もう一度お試しください。", retry:"再読み込み", close:"閉じる", light:"明るい背景", dark:"暗い背景",
    found:n=>n+" シリーズの素材", downloadLabel:title=>title+" を PNG で保存", zipLabel:title=>title+" の全 PNG を ZIP で保存",
    size:"原寸 PNG", preview:"プレビュー背景", recurrence:"記念日", anyday:"いつでも",compose:"写真を入れて作る"
  },
  "zh-tw": {
    all:"全部", frame:"相框", stamp:"貼圖", anniversary:"紀念日", halloween:"萬聖節", daily:"日常",
    pink:"粉紅", red:"紅色", orange:"橙色", yellow:"黃色", green:"綠色", blue:"藍色", purple:"紫色", white:"白色", black:"黑色",
    search:"名稱、關鍵字、11/04 等", prev:"上一個月", next:"下一個月", days:["日","一","二","三","四","五","六"],
    count:n=>n+" 個系列", files:n=>n+" 張", browse:"查看素材", download:"下載 PNG", zip:"下載整套 PNG ZIP", variant:"素材", colors:"顏色",
    dateClear:"清除日期", empty:"沒有符合條件的素材，請調整關鍵字或篩選條件。",
    error:"無法載入素材，請再試一次。", retry:"重新載入", close:"關閉", light:"淺色背景", dark:"深色背景",
    found:n=>n+" 個系列的素材", downloadLabel:title=>"下載 "+title+" PNG", zipLabel:title=>"下載 "+title+" 整套 PNG ZIP",
    size:"原尺寸 PNG", preview:"預覽背景", recurrence:"紀念日", anyday:"日常使用",compose:"放入相片製作"
  },
  en: {
    all:"All", frame:"Frames", stamp:"Stamps", anniversary:"Anniversaries", halloween:"Halloween", daily:"Everyday",
    pink:"Pink", red:"Red", orange:"Orange", yellow:"Yellow", green:"Green", blue:"Blue", purple:"Purple", white:"White", black:"Black",
    search:"Name, keyword or 11/04", prev:"Previous month", next:"Next month", days:["S","M","T","W","T","F","S"],
    count:n=>n+" series", files:n=>n+" files", browse:"View resources", download:"Download PNG", zip:"Download all PNGs as ZIP", variant:"File", colors:"Colour",
    dateClear:"Clear date", empty:"No resources match. Try another keyword or filter.",
    error:"Resources could not be loaded. Please try again.", retry:"Try again", close:"Close", light:"Light background", dark:"Dark background",
    found:n=>n+" resource series", downloadLabel:title=>"Download "+title+" PNG", zipLabel:title=>"Download all "+title+" PNGs as ZIP",
    size:"Original PNG", preview:"Preview background", recurrence:"Occasion", anyday:"Everyday",compose:"Add your photo"
  }
};
const $ = selector => document.querySelector(selector);
const query = $("#material-query");
const controls = {type:$("#filter-type"),theme:$("#filter-theme"),color:$("#filter-color")};
const result = $("#material-results");
const dialog = $("#material-dialog");
const now = new Date();
const state = {query:"",type:"",theme:"",color:"",date:"",year:now.getFullYear(),month:now.getMonth(),series:"",variant:""};
let items = [];
let dataLoaded = false;
let trigger;
let composer;

let debounce;

function lang() { return text[document.documentElement.dataset.language] || text.en; }
function locale() { return document.documentElement.dataset.language === "ja" ? "ja-JP" : document.documentElement.dataset.language === "zh-tw" ? "zh-Hant" : "en"; }
function node(tag, className, content) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (content !== undefined) element.textContent = content;
  return element;
}
function button(content, handler, className) {
  const b = node("button",className,content);
  b.type = "button";
  b.addEventListener("click",handler);
  return b;
}
function filtersWithoutDate() { return {...state,date:""}; }
function seriesTitle(item) { return item.titles?.[document.documentElement.dataset.language] || item.title; }
function preferredVariant(variants) {
  return variants.find(variant=>variant.color==="white")
    || variants.find(variant=>variant.color==="pink")
    || variants[0];
}
function readUrl() {
  const params = new URLSearchParams(location.search);
  state.query = params.get("q") || "";
  for (const key of Object.keys(controls)) {
    const value = params.get(key) || "";
    state[key] = [...controls[key].options].some(option=>option.value===value) ? value : "";
    controls[key].value = state[key];
  }
  const date = params.get("date") || "";
  state.date = /^(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/.test(date) ? date : "";
  if (state.date) state.month = Number(state.date.slice(0,2))-1;
  state.series = params.get("series") || "";
  query.value = state.query;
}
function syncUrl(replace = true) {
  const url = new URL(location.href);
  for (const [key,value] of Object.entries({q:state.query,type:state.type,theme:state.theme,color:state.color,date:state.date,series:state.series})) {
    if (value) url.searchParams.set(key,value);
    else url.searchParams.delete(key);
  }
  if (replace) history.replaceState(null,"",url);
  else history.pushState(null,"",url);
}
function renderCalendar() {
  const t = lang();
  $("#calendar-title").textContent = new Intl.DateTimeFormat(locale(),{year:"numeric",month:"long"}).format(new Date(state.year,state.month,1));
  $("#month-prev").setAttribute("aria-label",t.prev);
  $("#month-next").setAttribute("aria-label",t.next);
  const week = $(".calendar-week");
  week.replaceChildren(...t.days.map(d=>node("span","",d)));
  const grid = $(".calendar-days");
  grid.replaceChildren();
  grid.setAttribute("aria-label",$("#calendar-title").textContent);
  const counts = new Map();
  for (const item of items.filter(item=>matches(item,filtersWithoutDate()))) {
    if(item.eventDate) counts.set(item.eventDate,(counts.get(item.eventDate)||0)+1);
  }
  const first = new Date(state.year,state.month,1).getDay();
  for (let i=0;i<first;i++) grid.append(node("span",""));
  const dayCount = new Date(state.year,state.month+1,0).getDate();
  for (let day=1;day<=dayCount;day++) {
    const key = String(state.month+1).padStart(2,"0")+"-"+String(day).padStart(2,"0");
    const count = counts.get(key)||0;
    const b = button(String(day),()=>{
      state.date = state.date===key ? "" : key;
      state.series = "";
      syncUrl();
      render();
    },"calendar-day");
    b.disabled = count===0;
    b.classList.toggle("has-materials",count>0);
    b.setAttribute("aria-pressed",String(state.date===key));
    b.setAttribute("aria-label",new Intl.DateTimeFormat(locale(),{month:"long",day:"numeric"}).format(new Date(state.year,state.month,day))+" · "+t.found(count));
    if (count) b.append(node("span","calendar-dot",""));
    grid.append(b);
  }
  $("#clear-date").hidden = !state.date;
  $("#clear-date").textContent = t.dateClear+" · "+state.date.replace("-","/");
}
function openSeries(item, opener) {
  trigger = opener || trigger;
  state.series = item.id;
  state.variant = "";
  syncUrl(false);
  renderDialog(item);
  if(!dialog.open) dialog.showModal();
}
function renderResults() {
  const t = lang();
  const selected = items.filter(item=>matches(item,state));
  $("#material-count").textContent = t.count(selected.length)+(state.date?" · "+state.date.replace("-","/"):"");
  $("#materials-empty").hidden = selected.length>0;
  $("#materials-empty").textContent = t.empty;
  result.replaceChildren();
  for(const item of selected) {
    const variants = matchingVariants(item,state.color);
    const coverVariant = preferredVariant(variants);
    const card = node("article","catalog-card");
    const cover = button("",()=>openSeries(item,cover),"catalog-cover");
    cover.setAttribute("aria-label",t.browse+" · "+seriesTitle(item));
    const img = node("img");
    img.src = coverVariant.preview;
    img.alt = seriesTitle(item)+" · "+t[coverVariant.color];
    img.loading = "lazy";
    img.width = coverVariant.width;
    img.height = coverVariant.height;
    cover.append(img);
    const body = node("div","catalog-card-body");
    const title = node("h3","",seriesTitle(item));
    title.lang = item.titles ? document.documentElement.lang : "ja";
    const info = node("p","catalog-meta",[t[item.type],t.files(variants.length),item.eventDate?.replace("-","/")||t.anyday].join(" · "));
    const colors = node("div","catalog-colors");
    for(const color of [...new Set(variants.map(v=>v.color))]) {
      const dot = node("span","color-dot color-"+color);
      dot.title = t[color];
      dot.setAttribute("aria-label",t[color]);
      colors.append(dot);
    }
    body.append(title,info,colors,button(t.browse,()=>openSeries(item,cover),"pill-button"));
    card.append(cover,body);
    result.append(card);
  }
}
function renderDialog(item) {
  composer?.dispose();
  composer=null;
  dialog.classList.remove("is-photo-editor");
  const t = lang();
  const variants = matchingVariants(item,state.color);
  const variant = variants.find(v=>v.id===state.variant)||preferredVariant(variants);
  if(!variant) return;
  state.variant = variant.id;
  $("#material-dialog-title").textContent = seriesTitle(item);
  $("#close-material-dialog").setAttribute("aria-label",t.close);
  const content = $("#material-dialog-content");
  const preview = node("div","detail-preview");
  const img = node("img");
  img.src = variant.preview;
  img.alt = seriesTitle(item)+" · "+t[variant.color];
  img.width = variant.width;
  img.height = variant.height;
  preview.append(img);
  const backdrop = node("div","preview-backdrop");
  backdrop.setAttribute("role","group");
  backdrop.setAttribute("aria-label",t.preview);
  const setBackground = light => {
    preview.classList.toggle("light-preview",light);
    lightButton.setAttribute("aria-pressed",String(light));
    darkButton.setAttribute("aria-pressed",String(!light));
  };
  const lightButton = button(t.light,()=>setBackground(true));
  const darkButton = button(t.dark,()=>setBackground(false));
  backdrop.append(lightButton,darkButton);
  setBackground(false);
  const meta = node("p","detail-meta",t.size+" · "+variant.width+" × "+variant.height+" · "+new Intl.NumberFormat(locale(),{maximumFractionDigits:1}).format(variant.bytes/1024)+" KB");
  const download = node("a","pill-button",t.download);
  download.href = variant.url;
  download.download = "";
  download.setAttribute("aria-label",t.downloadLabel(seriesTitle(item)+" "+t[variant.color]));
  const zip = node("a","quiet-link",t.zip+" ("+t.files(item.variants.length)+")");
  zip.href = item.zip.url;
  zip.download = "";
  zip.setAttribute("aria-label",t.zipLabel(seriesTitle(item)));
  const links = node("div","detail-downloads");
  links.append(download,zip);
  const thumbList = node("div","detail-variants");
  thumbList.setAttribute("role","group");
  thumbList.setAttribute("aria-label",t.variant);
  for(const v of variants) {
    const thumb = button("",()=>{state.variant=v.id;renderDialog(item);dialog.querySelector('[data-variant="'+v.id+'"]')?.focus();},"detail-thumb");
    thumb.dataset.variant = v.id;
    thumb.setAttribute("aria-pressed",String(v.id===variant.id));
    thumb.setAttribute("aria-label",t[v.color]+" · "+t.variant+" "+(item.variants.indexOf(v)+1));
    const image = node("img");
    image.src = v.preview;
    image.alt = "";
    image.loading = "lazy";
    thumb.append(image,node("span","",t[v.color]));
    thumbList.append(thumb);
  }
  const actions=[];
  if(item.type==="frame") {
    const start=button(t.compose,()=>{
      dialog.classList.add("is-photo-editor");
      composer=createPhotoComposer({
        container:content,variants,initialVariant:variant,
        getLanguage:()=>document.documentElement.dataset.language,
        onVariantChange:id=>{state.variant=id;},
        onBack:()=>{renderDialog(item);dialog.querySelector(".compose-start")?.focus();}
      });
    },"pill-button compose-start");
    actions.push(start);
  }
  content.replaceChildren(preview,backdrop,meta,...actions,links,thumbList);
}
function render() {
  const t = lang();
  query.placeholder = t.search;
  for(const select of Object.values(controls)) for(const option of select.options) option.textContent = t[option.value] || t.all;
  renderCalendar();
  renderResults();
  if(composer){composer.setLanguage();return;}
  if(dialog.open) {
    const item = items.find(item=>item.id===state.series);
    if(item) renderDialog(item);
  }
}
function closeDialog() {
  dialog.close();
}
dialog.addEventListener("close",()=>{
  composer?.dispose();composer=null;
  dialog.classList.remove("is-photo-editor");
  state.series = "";
  syncUrl();
  trigger?.focus();
});
$("#close-material-dialog").addEventListener("click",closeDialog);
dialog.addEventListener("click",event=>{
  if(event.target!==dialog)return;
  const rect=dialog.getBoundingClientRect();
  if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)closeDialog();
});
$(".material-search").addEventListener("submit",event=>event.preventDefault());
query.addEventListener("input",()=>{
  state.query=query.value;
  clearTimeout(debounce);
  debounce=setTimeout(()=>{syncUrl();render();},120);
});
for(const [key,control] of Object.entries(controls)) control.addEventListener("change",()=>{
  state[key]=control.value;
  syncUrl();
  render();
});
function changeMonth(delta) {
  const date=new Date(state.year,state.month+delta,1);
  state.year=date.getFullYear();
  state.month=date.getMonth();
  renderCalendar();
}
$("#month-prev").addEventListener("click",()=>changeMonth(-1));
$("#month-next").addEventListener("click",()=>changeMonth(1));
$("#clear-date").addEventListener("click",()=>{state.date="";syncUrl();render();});
$("#reset-materials").addEventListener("click",()=>{
  Object.assign(state,{query:"",type:"",theme:"",color:"",date:""});
  query.value="";
  for(const c of Object.values(controls))c.value="";
  syncUrl();
  render();
});
new MutationObserver(()=>{
  if(dataLoaded)render();
}).observe(document.documentElement,{attributes:true,attributeFilter:["data-language"]});
window.addEventListener("popstate",()=>{

  readUrl();
  if(!state.series&&dialog.open)dialog.close();
  render();
  const item=items.find(i=>i.id===state.series);
  if(item&&!dialog.open){renderDialog(item);dialog.showModal();}

});
async function init() {
  $("#materials-empty").hidden=true;
  try {
    const response=await fetch("/resources-data.json");
    if(!response.ok)throw Error("catalog unavailable");
    ({items}=await response.json());
    dataLoaded=true;
    readUrl();
    render();
    const item=items.find(i=>i.id===state.series);
    if(item){renderDialog(item);dialog.showModal();}
  } catch {
    $("#material-count").textContent=lang().error;
    result.replaceChildren(button(lang().retry,init,"pill-button"));
  }
}
init();
