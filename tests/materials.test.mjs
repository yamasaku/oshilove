import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {matches, matchingVariants} from "../resources-core.mjs";

const catalog=JSON.parse(fs.readFileSync(new URL("../resources-data.json",import.meta.url)));
const frames=catalog.items.find(i=>i.id==="oshi-day-frames");
test("search normalizes full-width dates and combines filters",()=>{
  assert.equal(matches(frames,{query:"１１／０４ 相框",type:"frame",color:"green",date:"11-04"}),true);
  assert.equal(matches(frames,{query:"11/04",type:"stamp"}),false);
  assert.equal(matches(frames,{query:"",date:"10-31"}),false);
});
test("colour filtering selects only matching download variants",()=>{
  const selected=matchingVariants(frames,"green");
  assert.equal(selected.length,1);
  assert.match(selected[0].url,/^\/materials\/oshi-day-frames\/.+\.png$/);
  assert.equal(matches(frames,{query:"nonexistent"}),false);
});
test("catalogue points to prepared PNG and ZIP originals",()=>{
  for(const item of catalog.items){
    assert.ok(item.variants.length);
    assert.match(item.zip.url,/\.zip$/);
    for(const v of item.variants){assert.ok(v.width>0&&v.height>0&&v.bytes>0);assert.ok(v.preview.startsWith("/material-previews/"));}
  }
});

const source=fs.readFileSync(new URL("../materials-worker.js",import.meta.url),"utf8")
  .replace('import catalog from "./resources-data.json";',"const catalog="+JSON.stringify(catalog)+";");
const {default:worker}=await import("data:text/javascript;base64,"+Buffer.from(source).toString("base64"));
const variant=frames.variants[0];
function env(object) {
  return {
    ASSETS:{fetch:()=>new Response("asset")},
    MATERIALS:{get:async()=>object,head:async()=>object}
  };
}
test("download streams original bytes and declares attachment",async()=>{
  const response=await worker.fetch(new Request("https://example.com"+variant.url),env({body:new Uint8Array([1,2,3]),size:3,httpEtag:'"abc"'}));
  assert.equal(response.status,200);
  assert.equal(response.headers.get("Content-Type"),"image/png");
  assert.match(response.headers.get("Content-Disposition"),/^attachment;/);
  assert.deepEqual(new Uint8Array(await response.arrayBuffer()),new Uint8Array([1,2,3]));
});
test("only catalogued public files are accessible",async()=>{
  for(const path of ["/materials/private.stamp","/materials/unlisted.png"]){
    assert.equal((await worker.fetch(new Request("https://example.com"+path),env(null))).status,404);
  }
  assert.equal((await worker.fetch(new Request("https://example.com"+variant.url,{method:"POST"}),env(null))).status,405);
  assert.equal((await worker.fetch(new Request("https://example.com"+variant.url),env(null))).status,404);
});
test("HEAD and conditional requests return no body",async()=>{
  const object={size:3,httpEtag:'"abc"'};
  const head=await worker.fetch(new Request("https://example.com"+variant.url,{method:"HEAD"}),env(object));
  assert.equal(head.headers.get("Content-Length"),"3");
  assert.equal(await head.text(),"");
  const cached=await worker.fetch(new Request("https://example.com"+variant.url,{headers:{"If-None-Match":'"abc"'}}),env(object));
  assert.equal(cached.status,304);
});
test("storage errors have a retryable response and do not expose internals",async()=>{
  const broken={MATERIALS:{get:async()=>{throw Error("secret");}}};
  const response=await worker.fetch(new Request("https://example.com"+variant.url),broken);
  assert.equal(response.status,503);
  assert.doesNotMatch(await response.text(),/secret/);
});
