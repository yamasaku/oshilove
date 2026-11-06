import { normalizeProfile, normalizeTimeline, parseHandle } from './core.js';

const PROVIDER = 'https://api.fxtwitter.com';
const CACHE_SECONDS = 900;
const MAX_BODY = 3 * 1024 * 1024;

class SourceError extends Error {
  code: string;
  status: number;
  constructor(code: string, status: number, message: string) { super(message); this.code = code; this.status = status; }
}

async function boundedJson(response: Response): Promise<Record<string, unknown>> {
  if (!response.body) throw new SourceError('SOURCE_UNAVAILABLE', 502, '資料來源暫時未有回應。');
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY) { await reader.cancel(); throw new SourceError('SOURCE_TOO_LARGE', 502, '資料過大，請稍後再試。'); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const joined = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { joined.set(chunk, offset); offset += chunk.byteLength; }
  const value: unknown = JSON.parse(new TextDecoder().decode(joined));
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new SourceError('SOURCE_UNAVAILABLE', 502, '資料來源格式已改變。');
  return value as Record<string, unknown>;
}

async function getSource(path: string) {
  const response = await fetch(`${PROVIDER}${path}`, {
    headers: { Accept: 'application/json', 'User-Agent': 'OshiRadar/0.1 (public-profile organizer)' },
    signal: AbortSignal.timeout(15000), redirect: 'manual',
  });
  if (response.status >= 300 && response.status < 400) throw new SourceError('SOURCE_UNAVAILABLE', 502, '資料來源回應不符預期，請稍後再試。');
  if (response.status === 429) throw new SourceError('RATE_LIMITED', 429, '免費資料來源暫時繁忙，請一分鐘後再試。');
  if (response.status >= 500) throw new SourceError('SOURCE_UNAVAILABLE', 502, '免費資料來源暫時無法連接，請稍後再試。');
  const body = await boundedJson(response);
  const code = typeof body.code === 'number' ? body.code : response.status;
  if (code === 429) throw new SourceError('RATE_LIMITED', 429, '免費資料來源暫時繁忙，請一分鐘後再試。');
  if (![200, 404].includes(code)) throw new SourceError('SOURCE_UNAVAILABLE', 502, '暫時讀取唔到呢個帳戶，請稍後再試。');
  return { code, body };
}

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: {
    'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer', ...(status === 429 ? { 'Retry-After': '60' } : {}),
  } });
}

export default {
  async fetch(request, env, ctx): Promise<Response> {
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/api/radar/')) return env.ASSETS.fetch(request);
    // Cloudflare supplies this header; never trust a client-provided X-Forwarded-For.
    const clientIp = request.headers.get('CF-Connecting-IP');
    if (clientIp) {
      try {
        const { success } = await env.API_LIMITER.limit({ key: `oshi-api:${clientIp}` });
        if (!success) return json({ code: 'LOCAL_RATE_LIMITED', error: '查詢太頻密，請一分鐘後再試。' }, 429);
      } catch { return json({ code: 'SOURCE_UNAVAILABLE', error: '暫時未能處理查詢。' }, 503); }
    }
    if (request.method !== 'GET') return json({ error: '只接受 GET 請求。' }, 405);
    if (url.pathname === '/api/radar/health') return json({ ok: true, provider: 'FxEmbed', cacheSeconds: CACHE_SECONDS, rateLimitApplied: !!clientIp });
    if (url.pathname !== '/api/radar/profile') return json({ error: '搵唔到呢個端點。' }, 404);
    const handle = parseHandle(url.searchParams.get('handle'));
    if (!handle) return json({ code: 'INVALID_HANDLE', error: '請輸入有效嘅 X 帳戶網址或 @帳戶名稱。' }, 400);
    const cursor = url.searchParams.get('cursor') || '';
    if (cursor.length > 1500 || (cursor && !/^[\w=+\-/]+$/.test(cursor))) return json({ code: 'INVALID_CURSOR', error: '分頁資料無效，請重新搜尋。' }, 400);
    const keyUrl = new URL(`/api/radar/cache/v5/${handle}`, url.origin);
    if (cursor) keyUrl.searchParams.set('cursor', cursor);
    const cacheKey = new Request(keyUrl);
    const cache = caches.default;
    const cached = await cache.match(cacheKey);
    if (cached) {
      const response = new Response(cached.body, cached);
      response.headers.set('X-Oshi-Cache', 'HIT');
      response.headers.set('Cache-Control', 'no-store');
      return response;
    }
    try {
      const [profileResult, timelineResult] = await Promise.all([
        getSource(`/2/profile/${handle}`),
        getSource(`/2/profile/${handle}/statuses?count=40${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`),
      ]);
      if (profileResult.code === 404 || !profileResult.body.user) throw new SourceError('NOT_FOUND', 404, '搵唔到呢個公開帳戶，請檢查名稱。');
      const user = profileResult.body.user as Record<string, unknown>;
      if (user.protected === true) throw new SourceError('PRIVATE_ACCOUNT', 403, '呢個係私人帳戶，只支援公開帳戶。');
      if (timelineResult.code === 404 && !cursor && user.statuses !== 0) throw new SourceError('TIMELINE_UNAVAILABLE', 502, '已找到帳戶，但暫時讀取唔到時間線。請稍後再試。');
      const results = timelineResult.code === 404 ? [] : timelineResult.body.results;
      const posts = normalizeTimeline(results, handle);
      const profile = normalizeProfile(user);
      if (profile.handle !== handle) throw new SourceError('PROFILE_MISMATCH', 502, '資料來源回傳嘅帳戶不符，請稍後再試。');
      const pagination = timelineResult.body.cursor as { bottom?: unknown } | undefined;
      const nextCursor = posts.length && typeof pagination?.bottom === 'string' && pagination.bottom !== cursor ? pagination.bottom : null;
      const response = json({ profile, posts, nextCursor, fetchedAt: new Date().toISOString(), cacheSeconds: CACHE_SECONDS, source: 'FxEmbed' });
      const toCache = response.clone();
      toCache.headers.set('Cache-Control', `public, max-age=${CACHE_SECONDS}`);
      ctx.waitUntil(cache.put(cacheKey, toCache).catch(() => console.warn(JSON.stringify({ event: 'cache_write_failed' }))));
      response.headers.set('X-Oshi-Cache', 'MISS');
      return response;
    } catch (error) {
      const known = error instanceof SourceError;
      const status = known ? error.status : 502;
      const code = known ? error.code : 'SOURCE_UNAVAILABLE';
      console.warn(JSON.stringify({ event: 'source_failed', code, status }));
      const response = json({ code, error: known ? error.message : '免費資料來源暫時無法回應，請稍後再試。' }, status);
      // Brief negative caching prevents repeated requests from hammering an unavailable source.
      const backoff = response.clone();
      backoff.headers.set('Cache-Control', 'public, max-age=60');
      ctx.waitUntil(cache.put(cacheKey, backoff).catch(() => {}));
      return response;
    }
  },
} satisfies ExportedHandler<Env>;
