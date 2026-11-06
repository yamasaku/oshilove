import {parse, parseFragment, serialize} from 'parse5';
export {parse, serialize};
export const attr=(n,k)=>n.attrs?.find(a=>a.name===k)?.value;
export function set(n,k,v){n.attrs ||= []; const a=n.attrs.find(a=>a.name===k); if(a)a.value=String(v);else n.attrs.push({name:k,value:String(v)});}
export function all(n,test){const out=[];function visit(p){if(test(p))out.push(p);for(const c of p.childNodes||[])visit(c);}visit(n);return out;}
export const one=(n,test)=>all(n,test)[0];
export const tag=(n,name)=>one(n,x=>x.tagName===name);
export function remove(n){n.parentNode.childNodes=n.parentNode.childNodes.filter(c=>c!==n);}
export function inner(n,html){n.childNodes=parseFragment(html).childNodes;for(const c of n.childNodes)c.parentNode=n;}
export function append(n,html){const children=parseFragment(html).childNodes;for(const c of children){c.parentNode=n;n.childNodes.push(c);}}
export const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
