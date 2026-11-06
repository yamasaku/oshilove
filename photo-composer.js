import {clamp,outputSize,photoPlacement} from "./composer-core.mjs";

const copy = {
  ja:{start:"写真を選ぶ",change:"写真を変更",privacy:"写真はこの端末内で処理され、アップロードされません。",hint:"写真をドラッグして位置を調整。拡大はスライダーで。",keyboard:"写真の位置。矢印キーでも移動できます。",zoom:"拡大",reset:"位置をリセット",back:"素材に戻る",colour:"フレームの色",download:"画像を保存",preparing:"画像を準備中…",loading:"読み込み中…",ready:"保存できます",choose:"写真を選ぶとプレビューできます",photoError:"この写真を読み込めませんでした。JPEG・PNG・WebP など、ブラウザで表示できる写真を選んでください。",large:"30 MB 以下の写真を選んでください。",frameError:"フレームを読み込めませんでした。色を選び直すか、もう一度お試しください。",exportError:"画像を作成できませんでした。小さな写真でお試しください。",white:"白",pink:"ピンク",red:"赤",orange:"オレンジ",yellow:"黄色",green:"緑",blue:"青",purple:"紫",black:"黒"},
  "zh-tw":{start:"選擇相片",change:"更換相片",privacy:"相片只在此裝置處理，不會上傳。",hint:"拖曳相片調整位置，使用滑桿放大。",keyboard:"相片位置，也可使用方向鍵調整。",zoom:"放大",reset:"重設位置",back:"返回素材",colour:"相框顏色",download:"下載成品 PNG",preparing:"正在準備圖片…",loading:"正在載入…",ready:"可以下載",choose:"選擇相片即可預覽",photoError:"無法讀取這張相片，請選擇瀏覽器可顯示的 JPEG、PNG 或 WebP 等圖片。",large:"請選擇 30 MB 以下的相片。",frameError:"無法載入相框，請重新選擇顏色或再試一次。",exportError:"無法產生圖片，請改用較小的相片再試。",white:"白色",pink:"粉紅",red:"紅色",orange:"橙色",yellow:"黃色",green:"綠色",blue:"藍色",purple:"紫色",black:"黑色"},
  en:{start:"Choose photo",change:"Change photo",privacy:"Your photo stays on this device and is never uploaded.",hint:"Drag your photo to position it. Use the slider to zoom.",keyboard:"Photo position. Use the arrow keys to move it.",zoom:"Zoom",reset:"Reset position",back:"Back to resources",colour:"Frame colour",download:"Download finished PNG",preparing:"Preparing image…",loading:"Loading…",ready:"Ready to download",choose:"Choose a photo to preview",photoError:"This photo could not be opened. Choose a browser-supported image such as JPEG, PNG or WebP.",large:"Choose a photo under 30 MB.",frameError:"The frame could not be loaded. Select its colour again or try again.",exportError:"The image could not be created. Try a smaller photo.",white:"White",pink:"Pink",red:"Red",orange:"Orange",yellow:"Yellow",green:"Green",blue:"Blue",purple:"Purple",black:"Black"}
};

function element(tag,className) {
  const node = document.createElement(tag);
  node.className = className || "";
  return node;
}

async function decodeImage(blob,signal) {
  const url = URL.createObjectURL(blob);
  const image = new Image();
  try {
    await new Promise((resolve,reject)=>{
      const abort = () => {image.src="";reject(new DOMException("Aborted","AbortError"));};
      const clean = () => signal?.removeEventListener("abort",abort);
      image.onload = () => {clean();resolve();};
      image.onerror = () => {clean();reject(Error("Image could not be decoded"));};
      if (signal?.aborted) return abort();
      signal?.addEventListener("abort",abort,{once:true});
      image.src = url;
    });
    return image;
  } finally { URL.revokeObjectURL(url); }
}

export function createPhotoComposer({container,variants,initialVariant,getLanguage,onBack,onVariantChange}) {
  const t = () => copy[getLanguage()] || copy.en;
  const lifetime = new AbortController();
  const listen = (target,name,handler) => target.addEventListener(name,handler,{signal:lifetime.signal});
  let active = true, photo, frame, variant=initialVariant, zoom=1, x=0, y=0;
  let frameRequest, photoRequest, photoBusy=false, notice="choose", exportURL, exportTimer, animationFrame, version=0, drag;
  const layout = element("div","photo-composer");
  const stage = element("div","composer-stage");
  const canvas = element("canvas","composer-canvas");
  canvas.tabIndex = 0;
  canvas.setAttribute("role","img");
  stage.append(canvas);
  const panel = element("div","composer-controls");
  const file = element("input","composer-file");
  file.type="file"; file.accept="image/*";file.hidden=true;
  const choose = element("button","pill-button composer-choose");
  choose.type="button";
  const privacy = element("p","composer-privacy");
  const hint = element("p","composer-hint");
  const colourLabel = element("label","composer-field");
  const colourTitle = element("span");
  const colour = element("select");
  colourLabel.append(colourTitle,colour);
  for (const item of variants) {
    const option = element("option"); option.value=item.id; colour.append(option);
  }
  colour.value=variant.id;
  const zoomLabel = element("label","composer-field");
  const zoomTitle = element("span");
  const range = element("input");
  range.type="range";range.min="1";range.max="3";range.step="0.01";range.value="1";
  zoomLabel.append(zoomTitle,range);
  const reset = element("button","composer-reset");reset.type="button";
  const download = element("a","pill-button composer-download");
  download.setAttribute("aria-disabled","true");
  const status = element("p","composer-status");status.setAttribute("role","status");
  const dimensions = element("p","composer-dimensions");
  const back = element("button","composer-back");back.type="button";
  panel.append(file,choose,privacy,colourLabel,zoomLabel,reset,hint,download,status,dimensions,back);
  layout.append(stage,panel);
  container.replaceChildren(layout);
  const context=canvas.getContext("2d");

  function language() {
    choose.textContent=photo ? t().change : t().start;
    privacy.textContent=t().privacy;
    hint.textContent=t().hint;
    canvas.setAttribute("aria-label",t().keyboard);
    colourTitle.textContent=t().colour;
    [...colour.options].forEach((option,index)=>option.textContent=t()[variants[index].color]+(variants.filter(v=>v.color===variants[index].color).length>1?" "+(index+1):""));
    zoomTitle.textContent=t().zoom+" · "+Math.round(zoom*100)+"%";
    range.setAttribute("aria-valuetext",Math.round(zoom*100)+"%");
    reset.textContent=t().reset;back.textContent=t().back;
    download.textContent=t().download;
    const message=t()[notice] || "";
    if(status.textContent!==message)status.textContent=message;
    dimensions.textContent=canvas.width+" × "+canvas.height+" · PNG";
    colourLabel.hidden=variants.length<2;
    range.disabled=reset.disabled=!photo || photoBusy;
  }
  function setNotice(value) {notice=value;language();}
  function invalidateExport() {
    version++;
    clearTimeout(exportTimer);
    download.setAttribute("aria-disabled","true");
    download.removeAttribute("href");
    if(exportURL){URL.revokeObjectURL(exportURL);exportURL=null;}
  }
  function paint() {
    if(!active)return;
    invalidateExport();
    if(animationFrame)return;
    animationFrame=requestAnimationFrame(()=>{animationFrame=null;draw();});
  }
  function draw() {
    if (!active || !context) return;
    context.clearRect(0,0,canvas.width,canvas.height);
    context.fillStyle=photo ? "#fff" : "#68606b";
    context.fillRect(0,0,canvas.width,canvas.height);
    if (photo) {
      const placement=photoPlacement(canvas.width,canvas.height,photo.width,photo.height,zoom,x,y);
      context.drawImage(photo,placement.left,placement.top,placement.width,placement.height);
    }
    if(frame)context.drawImage(frame,0,0,canvas.width,canvas.height);
    if (photo && frame && !photoBusy) {
      setNotice("preparing");
      const ticket=version;
      exportTimer=setTimeout(()=>{
        try {
          canvas.toBlob(blob=>{
            if (!active || version!==ticket) return;
            if (!blob) {setNotice("exportError");return;}
            exportURL=URL.createObjectURL(blob);
            download.href=exportURL;
            download.download=variant.downloadName.replace(/\.png$/i,"-photo.png");
            download.setAttribute("aria-disabled","false");
            setNotice("ready");
          },"image/png");
        } catch { if(active)setNotice("exportError"); }
      },180);
    }
    language();
  }
  async function loadFrame(next) {
    frameRequest?.abort();
    const request=frameRequest=new AbortController();
    variant=next;colour.value=next.id;onVariantChange(next.id);
    frame=null;
    const size=outputSize(next.width,next.height);
    canvas.width=size.width;canvas.height=size.height;
    stage.style.setProperty("--composer-ratio",String(size.width/size.height));
    setNotice("loading");paint();
    try {
      const response=await fetch(next.url,{signal:request.signal});
      if(!response.ok)throw Error("Frame unavailable");
      const image=await decodeImage(await response.blob(),request.signal);
      if(!active || request.signal.aborted){image.src="";return;}
      frame=image;setNotice(photo ? "preparing" : "choose");paint();
    } catch(error) {if(active && error.name!=="AbortError"){setNotice("frameError");paint();}}
  }
  async function loadPhoto() {
    const selected=file.files?.[0];
    file.value="";
    if(!selected)return;
    photoRequest?.abort();photoBusy=false;
    if(selected.size>30*1024*1024){setNotice("large");return;}
    if(!selected.type.startsWith("image/") || selected.type==="image/svg+xml"){setNotice("photoError");return;}
    const request=photoRequest=new AbortController();
    photoBusy=true;invalidateExport();setNotice("loading");
    try {
      const image=await decodeImage(selected,request.signal);
      if(!active || request.signal.aborted){image.src="";return;}
      const size=outputSize(image.naturalWidth,image.naturalHeight);
      const reduced=document.createElement("canvas");
      reduced.width=size.width;reduced.height=size.height;
      try { reduced.getContext("2d").drawImage(image,0,0,size.width,size.height); }
      finally { image.src=""; }
      if(photo){photo.width=0;photo.height=0;}
      photo=reduced;zoom=1;x=0;y=0;range.value="1";
      photoBusy=false;setNotice(frame ? "preparing" : "loading");paint();
    } catch(error) {
      if(active && !request.signal.aborted){photoBusy=false;setNotice("photoError");language();}
    }
  }
  listen(file,"change",loadPhoto);
  listen(choose,"click",()=>file.click());
  listen(colour,"change",()=>loadFrame(variants.find(item=>item.id===colour.value)));
  listen(range,"input",()=>{zoom=Number(range.value);paint();});
  listen(reset,"click",()=>{zoom=1;x=0;y=0;range.value="1";paint();});
  listen(back,"click",onBack);
  listen(download,"click",event=>{if(download.getAttribute("aria-disabled")==="true")event.preventDefault();});
  listen(canvas,"pointerdown",event=>{
    if(!photo || photoBusy || drag || event.isPrimary===false)return;
    if(event.pointerType==="mouse" && event.button!==0)return;
    drag={id:event.pointerId,x:event.clientX,y:event.clientY};
    canvas.setPointerCapture(event.pointerId);
    canvas.focus({preventScroll:true});
  });
  listen(canvas,"pointermove",event=>{
    if(!drag || event.pointerId!==drag.id || !photo)return;
    const rect=canvas.getBoundingClientRect();
    const placement=photoPlacement(canvas.width,canvas.height,photo.width,photo.height,zoom,x,y);
    if(placement.panX)x=clamp(x+(event.clientX-drag.x)*canvas.width/rect.width/placement.panX,-1,1);
    if(placement.panY)y=clamp(y+(event.clientY-drag.y)*canvas.height/rect.height/placement.panY,-1,1);
    drag.x=event.clientX;drag.y=event.clientY;
    paint();
  });
  for(const name of ["pointerup","pointercancel","lostpointercapture"])listen(canvas,name,()=>{drag=null;});
  listen(canvas,"keydown",event=>{
    if(!photo || photoBusy || !["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"].includes(event.key))return;
    event.preventDefault();
    const amount=event.shiftKey ? 0.2 : 0.05;
    if(event.key==="ArrowLeft")x=clamp(x-amount,-1,1);
    if(event.key==="ArrowRight")x=clamp(x+amount,-1,1);
    if(event.key==="ArrowUp")y=clamp(y-amount,-1,1);
    if(event.key==="ArrowDown")y=clamp(y+amount,-1,1);
    paint();
  });
  loadFrame(variant);
  choose.focus({preventScroll:true});
  return {
    setLanguage:language,
    dispose(){
      active=false;frameRequest?.abort();photoRequest?.abort();lifetime.abort();
      cancelAnimationFrame(animationFrame);
      invalidateExport();file.value="";
      if(photo){photo.width=0;photo.height=0;}
      if(frame)frame.src="";
      canvas.width=0;canvas.height=0;
      photo=frame=null;
    }
  };
}
