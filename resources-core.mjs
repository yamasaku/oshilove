export function matches(item, filters) {
  const normalized = text => String(text).normalize("NFKC").toLocaleLowerCase();
  const words = normalized(filters.query || "").trim().split(/\s+/).filter(Boolean);
  const aliases = {
    frame: "frame frames フレーム 相框 邊框 story stories",
    stamp: "stamp stamps スタンプ 貼圖 文字 文字貼圖",
    anniversary: "anniversary 記念日 紀念日",
    halloween: "halloween ハロウィン 萬聖節",
    daily: "daily 日常 everyday"
  };
  const searchable = normalized([item.title, ...Object.values(item.titles || {}), item.eventDate, item.eventDate?.replace("-", "/"), item.eventDate?.replace("-", "."), aliases[item.type], aliases[item.theme], ...item.variants.map(v=>v.label)].join(" "));
  return words.every(word => searchable.includes(word))
    && (!filters.type || item.type === filters.type)
    && (!filters.theme || item.theme === filters.theme)
    && (!filters.color || item.variants.some(v => v.color === filters.color))
    && (!filters.date || item.eventDate === filters.date);
}

export function matchingVariants(item, color) {
  return item.variants.filter(variant => !color || variant.color === color);
}

export function preferredVariant(variants, coverVariantId) {
  return variants.find(variant => variant.id && variant.id === coverVariantId)
    || variants.find(variant => variant.color === "white")
    || variants.find(variant => variant.color === "pink")
    || variants[0];
}
