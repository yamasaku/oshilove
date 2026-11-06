import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import sharp from "sharp";
import {zipSync} from "fflate";

export const hash = bytes => crypto.createHash("sha256").update(bytes).digest("hex");
export const colours = ["white","pink","red","orange","yellow","green","blue","purple","black"];

export function scanPngs(folder) {
  const files = [];
  let ignored = 0;
  function walk(current) {
    if (current.toLowerCase().includes("-oshideco")) { ignored++; return; }
    const stat = fs.lstatSync(current);
    if (stat.isSymbolicLink()) return;
    if (stat.isDirectory()) {
      for (const name of fs.readdirSync(current).sort()) walk(path.join(current,name));
    } else if (path.extname(current).toLowerCase() === ".png") files.push(current);
  }
  walk(path.resolve(folder));
  return {files,ignored};
}

export function detectColour(filename) {
  const name = path.basename(filename,path.extname(filename)).normalize("NFKC").toLowerCase();
  const aliases = {
    pink:["粉紅","ピンク"], white:["白色","ホワイト","白"], red:["紅色","レッド","赤"], orange:["橙色","オレンジ"],
    yellow:["黃色","イエロー","黄色"], green:["綠色","グリーン","緑"], blue:["藍色","ブルー","青"], purple:["紫色","パープル","紫"], black:["黑色","ブラック","黒"]
  };
  return Object.keys(aliases).find(colour=>new RegExp("(^|[^a-z])"+colour+"($|[^a-z])").test(name) || aliases[colour].some(alias=>name.includes(alias)));
}

export function validateMetadata(meta) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(meta.id)) throw Error("系列網址名稱只可包含小寫英文字、數字及連字號。");
  if (!meta.title?.trim()) throw Error("請填寫素材名稱。");
  if (!["frame","stamp"].includes(meta.type) || !["daily","anniversary","halloween"].includes(meta.theme)) throw Error("素材類型或主題不正確。");
  if (meta.eventDate) {
    const match = /^(\d{2})-(\d{2})$/.exec(meta.eventDate);
    const date = match && new Date(Date.UTC(2000,Number(match[1])-1,Number(match[2])));
    if (!match || date.getUTCMonth()+1!==Number(match[1]) || date.getUTCDate()!==Number(match[2])) throw Error("紀念日請使用有效的 MM-DD 日期，例如 11-04；日常素材請留空。");
  }
}

export async function prepareSeries({folder, metadata, previous, work, resolveColour, fetchOriginal}) {
  validateMetadata(metadata);
  const {files,ignored} = scanPngs(folder);
  if (!files.length) throw Error("資料夾內沒有可匯入的 PNG（-oshideco 檔案會略過）。");
  const variants = (previous?.variants || []).map(v=>({...v}));
  const originalBytes = new Map();
  const jobs = [], previews = [];
  let next = Math.max(0,...variants.map(v=>Number(v.id.split("-")[0]) || 0));
  for (const file of files) {
    const bytes = fs.readFileSync(file);
    const fingerprint = hash(bytes).slice(0,12);
    let variant = variants.find(v=>v.id.endsWith("-"+fingerprint));
    const colour = detectColour(file) || variant?.color || await resolveColour?.(file);
    if (!colours.includes(colour)) throw Error(path.basename(file)+" 未能辨認顏色；請在檔名加入 white、pink、blue 等顏色，或指定 --color。");
    const image = await sharp(bytes).metadata();
    if (image.format!=="png") throw Error(path.basename(file)+" 並非有效的 PNG。");
    const fresh = !variant;
    const id = variant?.id || String(++next).padStart(2,"0")+"-"+fingerprint;
    const key = metadata.id+"/"+id+".png";
    const output = path.join(work,"originals",key);
    fs.mkdirSync(path.dirname(output),{recursive:true});
    fs.writeFileSync(output,bytes);
    originalBytes.set(id,bytes);
    variant ||= {id};
    Object.assign(variant,{color:colour,label:variant.label || path.basename(file,path.extname(file)),width:image.width,height:image.height,bytes:bytes.length,preview:"/material-previews/"+metadata.id+"-"+id+".webp",url:"/materials/"+key,downloadName:metadata.id+"-"+colour+"-"+id.split("-")[0]+".png"});
    const previewFile = path.join(work,"previews",path.basename(variant.preview));
    fs.mkdirSync(path.dirname(previewFile),{recursive:true});
    await sharp(bytes).resize(560,560,{fit:"inside",withoutEnlargement:true}).webp({quality:78}).toFile(previewFile);
    previews.push({file:previewFile,name:path.basename(variant.preview)});
    if (fresh) { variants.push(variant); jobs.push({key,file:output,type:"image/png"}); }
  }
  const entries = {};
  for (const variant of variants) {
    let bytes = originalBytes.get(variant.id);
    if (!bytes) bytes = await fetchOriginal(variant);
    if (hash(bytes).slice(0,12)!==variant.id.split("-").at(-1)) throw Error("原檔驗證失敗："+variant.downloadName);
    entries[variant.downloadName] = [new Uint8Array(bytes),{level:0,mtime:new Date(2000,0,1)}];
  }
  const zip = Buffer.from(zipSync(entries));
  const key = metadata.id+"/all-"+hash(zip).slice(0,12)+".zip";
  const zipFile = path.join(work,"all.zip");
  fs.writeFileSync(zipFile,zip);
  if ("/materials/"+key!==previous?.zip?.url) jobs.push({key,file:zipFile,type:"application/zip"});
  return {item:{...previous,...metadata,variants,zip:{url:"/materials/"+key,bytes:zip.length}},jobs,previews,ignored,sourceCount:files.length,newCount:variants.length-(previous?.variants.length || 0)};
}
