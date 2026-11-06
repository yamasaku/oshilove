import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import sharp from "sharp";
import {unzipSync} from "fflate";
import {scanPngs, detectColour, validateMetadata, prepareSeries} from "../tools/materials-lib.mjs";
import {renderHomeMaterials} from "../tools/home-materials.mjs";

const root = new URL("../.material-work/",import.meta.url);
fs.mkdirSync(root,{recursive:true});
const temp = () => fs.mkdtempSync(path.join(fileURLToPath(root),"test-"));
const metadata = {id:"test-series",title:"測試素材",type:"stamp",theme:"daily",eventDate:null};

test("import skips oshideco files and directories before opening them",()=>{
  const folder = temp();
  fs.mkdirSync(path.join(folder,"nested-oshideco"));
  fs.writeFileSync(path.join(folder,"nested-oshideco","white.png"),"ignored");
  fs.writeFileSync(path.join(folder,"pink-oshideco.png"),"ignored");
  fs.writeFileSync(path.join(folder,"blue.PNG"),"png");
  fs.writeFileSync(path.join(folder,"author.stamp"),"ignored");
  const result = scanPngs(folder);
  assert.deepEqual(result.files.map(file=>path.basename(file)),["blue.PNG"]);
  assert.equal(result.ignored,2);
  assert.equal(detectColour("粉紅.png"),"pink");
  assert.equal(detectColour("outline_WHITE.png"),"white");
  assert.equal(detectColour("untitled.png"),undefined);
});

test("invalid calendar dates and unsafe series names are rejected",()=>{
  assert.throws(()=>validateMetadata({...metadata,id:"../outside"}));
  assert.throws(()=>validateMetadata({...metadata,eventDate:"02-30"}));
  assert.doesNotThrow(()=>validateMetadata({...metadata,eventDate:"02-29"}));
});

test("import preserves original PNG bytes, existing variants and stable download paths",async()=>{
  const folder = temp(), work = temp();
  const png = await sharp({create:{width:12,height:16,channels:4,background:{r:255,g:255,b:255,alpha:0.5}}}).png().toBuffer();
  const source = path.join(folder,"white.png");
  fs.writeFileSync(source,png);
  const first = await prepareSeries({folder,metadata,work});
  assert.ok(fs.readFileSync(source).equals(png));
  assert.ok(fs.readFileSync(first.jobs.find(j=>j.type==="image/png").file).equals(png));
  const zip = unzipSync(fs.readFileSync(first.jobs.find(j=>j.type==="application/zip").file));
  assert.deepEqual(Object.keys(zip),[first.item.variants[0].downloadName]);
  assert.ok(Buffer.from(Object.values(zip)[0]).equals(png));
  first.item.variants[0].label = "搜尋關鍵字";
  const reimported = await prepareSeries({folder,metadata,previous:first.item,work:temp()});
  assert.equal(reimported.item.variants[0].label,"搜尋關鍵字");
  assert.equal(reimported.newCount,0);
  const extra = await sharp({create:{width:10,height:10,channels:4,background:"pink"}}).png().toBuffer();
  const folder2 = temp();
  fs.writeFileSync(path.join(folder2,"pink.png"),extra);
  const second = await prepareSeries({folder:folder2,metadata,previous:first.item,work:temp(),fetchOriginal:async()=>png});
  assert.equal(second.item.variants.length,2);
  assert.equal(second.item.variants[0].url,first.item.variants[0].url);
  assert.equal(second.newCount,1);
  const repeated = await prepareSeries({folder:folder2,metadata,previous:second.item,work:temp(),fetchOriginal:async()=>png});
  assert.equal(repeated.newCount,0);
  assert.equal(repeated.item.zip.url,second.item.zip.url);
});

test("homepage previews escape titles and prefer the white then pink covers",()=>{
  const variants = [{color:"blue",preview:"/blue.webp",width:12,height:16},{color:"pink",preview:"/pink.webp",width:12,height:16},{color:"white",preview:"/white.webp",width:12,height:16}];
  const html = renderHomeMaterials({featured:["one"],items:[{id:"one",title:'<script>alert("x")</script>',variants}]});
  assert.ok(html.includes('src="/white.webp"'));
  assert.ok(!html.includes("<script>"));
  assert.ok(renderHomeMaterials({items:[{id:"two",title:"Two",variants:variants.slice(0,2)}]}).includes('src="/pink.webp"'));
});
