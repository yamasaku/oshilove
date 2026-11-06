import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {parse,attr,all,one,tag} from '../tools/html.mjs';
import {pagePath,redirectFor,pages,languages} from '../locale-routes.js';
import {normalizePost} from '../radar-server/core.js';
import {filterPosts} from '../radar-assets/library.js';

test('legacy locale links redirect once, retaining account and material filters',()=>{
 for(const [old,next] of [['/ja.html','/'],['/privacy?lang=zh-tw','/zh-tw/privacy'],['/radar?lang=en&account=evol__official','/en/radar?account=evol__official'],['/resources?lang=ja&series=magic','/resources?series=magic']])assert.equal(redirectFor('https://oshilovepocket.com'+old)?.href,'https://oshilovepocket.com'+next);
 assert.equal(redirectFor('https://oshilovepocket.com/en/radar?account=a'),null);
 assert.equal(redirectFor('https://oshilovepocket.com/materials/file.png'),null);
});
test('every locale is pre-rendered with reciprocal alternates and a canonical matching the sitemap',()=>{
 const sitemap=fs.readFileSync(new URL('../.dist/sitemap.xml',import.meta.url),'utf8');
 for(const page of pages)for(const lang of languages){
  const route=pagePath(page,lang),html=fs.readFileSync(new URL('../.dist/'+(route==='/'?'index.html':route.slice(1)+'.html'),import.meta.url),'utf8'),doc=parse(html);
  assert.equal(attr(tag(doc,'html'),'data-fixed-language'),lang);
  assert.equal(attr(one(doc,n=>attr(n,'rel')==='canonical'),'href'),'https://oshilovepocket.com'+route);
  assert.equal(all(doc,n=>attr(n,'hreflang')!==undefined).length,4);
  for(const n of all(doc,n=>attr(n,'data-lang')!==undefined))assert.equal(attr(n,'data-lang'),lang);
  assert.ok(sitemap.includes('<loc>https://oshilovepocket.com'+route+'</loc>'));
  for(const n of all(doc,n=>attr(n,'type')==='application/ld+json'))assert.doesNotThrow(()=>JSON.parse(n.childNodes[0].value));
 }
 const resources=parse(fs.readFileSync(new URL('../.dist/en/resources.html',import.meta.url),'utf8'));
 const catalog=JSON.parse(fs.readFileSync(new URL('../resources-data.json',import.meta.url),'utf8'));
 assert.equal(all(resources,n=>attr(n,'class')==='catalog-card').length,catalog.items.length);
});
test('video filter detects attached video without requiring MV keywords, including quoted video',()=>{
 const make=(id,media,quote)=>normalizePost({id,text:'New update',created_at:'2026-11-07T00:00:00Z',author:{screen_name:'example',name:'Example'},media,quote},'example');
 const video=make('1',{all:[{type:'video',thumbnail_url:'https://pbs.twimg.com/media/test.jpg'}]});
 const photo=make('2',{all:[{type:'photo',url:'https://pbs.twimg.com/media/test.jpg'}]});
 const quoted=make('3',null,{text:'Look',media:{all:[{type:'video'}]},author:{screen_name:'other'}});
 assert.ok(video.hasVideo);assert.ok(quoted.hasVideo);assert.ok(!photo.hasVideo);
 assert.deepEqual(filterPosts([photo,video,quoted],{category:'video',query:'',reposts:true,upcoming:false,sort:'latest'}).map(p=>p.id).sort(),['1','3']);
});
