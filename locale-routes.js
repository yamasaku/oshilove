export const pages = ['', 'resources', 'radar', 'privacy', 'support'];
export const languages = ['ja', 'zh-tw', 'en'];
export function pagePath(page, lang) { return lang === 'ja' ? (page ? '/' + page : '/') : '/' + lang + (page ? '/' + page : ''); }
export function identify(path) {
  const clean=path.replace(/\.html$/, '').replace(/\/$/, '') || '/';
  for(const lang of languages)for(const page of pages)if(clean===pagePath(page,lang).replace(/\/$/,'') || (clean==='/' && !page && lang==='ja'))return {page,lang};
  if(['/index','/ja'].includes(clean))return {page:'',lang:'ja'};
  return null;
}
export function redirectFor(input) {
  const url=new URL(input), route=identify(url.pathname); if(!route)return null;
  const requested=url.searchParams.get('lang');
  const aliases=new Map([['zh-TW','zh-tw'],['zh-HK','zh-tw'],['zh-CN','zh-tw']]);
  const lang=languages.includes(requested)?requested:aliases.get(requested)||route.lang;
  const path=pagePath(route.page,lang);
  if(path===url.pathname&&!url.searchParams.has('lang'))return null;
  url.pathname=path;url.searchParams.delete('lang');return url;
}
