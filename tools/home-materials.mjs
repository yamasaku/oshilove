const escape = value => String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);

export function renderHomeMaterials(catalog) {
  const ids = [...new Set([...(catalog.featured || []), ...catalog.items.map(item=>item.id)])].slice(0,3);
  return ids.map(id=>catalog.items.find(item=>item.id===id)).filter(Boolean).map(item=>{
    const cover = item.variants.find(v=>v.color==="white") || item.variants.find(v=>v.color==="pink") || item.variants[0];
    const title = ["ja","zh-tw","en"].map(lang=>`<span data-lang="${lang}">${escape(item.titles?.[lang] || item.title)}</span>`).join("");
    return `<a class="home-material" data-site-lang href="/resources?series=${encodeURIComponent(item.id)}"><span class="home-material-cover"><img src="${escape(cover.preview)}" width="${cover.width}" height="${cover.height}" alt="" loading="lazy"></span><span class="home-material-title">${title}<span aria-hidden="true">↗</span></span></a>`;
  }).join("\n");
}
