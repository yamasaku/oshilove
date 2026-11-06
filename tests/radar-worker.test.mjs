import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import worker from '../radar-server/worker.ts';

const profile = JSON.parse(fs.readFileSync(new URL('./fixtures/evol-profile.json', import.meta.url)));
const timeline = JSON.parse(fs.readFileSync(new URL('./fixtures/evol-timeline.json', import.meta.url)));
const originalFetch = globalThis.fetch;
let requests, cache, pending;
const ctx = { waitUntil: promise => pending.push(promise) };
const env = { ASSETS: { fetch: () => new Response('asset') } };
function setup(responder) {
  requests = []; cache = new Map(); pending = [];
  globalThis.caches = { default: { match: async key => cache.get(key.url)?.clone(), put: async (key, response) => { cache.set(key.url, response.clone()); } } };
  globalThis.fetch = async (url, options) => { requests.push(String(url)); return responder(String(url), options); };
}
const call = query => worker.fetch(new Request(`https://test.example/api/radar/profile?${query}`), env, ctx);

test.after(() => { globalThis.fetch = originalFetch; });
test('invalid account URLs never reach upstream', async () => {
  setup(() => { throw new Error('unexpected fetch'); });
  const r = await call('handle=https://evil.test/a'); assert.equal(r.status, 400); assert.equal(requests.length, 0);
});
test('successful live-shaped response is normalized and cached across input aliases', async () => {
  setup(url => Response.json(url.includes('/statuses') ? timeline : profile));
  const first = await call('handle=EVOL__official');
  assert.equal(first.status, 200); const data = await first.json();
  assert.equal(data.profile.handle, 'evol__official'); assert.equal(data.posts.length, 18);
  assert.equal(data.source, 'FxEmbed'); assert.ok(data.nextCursor);
  await Promise.all(pending);
  const second = await call('handle=%40evol__official');
  assert.equal(second.headers.get('X-Oshi-Cache'), 'HIT'); assert.equal(requests.length, 2);
});
test('upstream 429 is exposed honestly and briefly cached', async () => {
  setup(() => new Response('Rate limit exceeded', { status: 429 }));
  const r = await call('handle=evol__official');
  assert.equal(r.status, 429); assert.equal(r.headers.get('Retry-After'), '60');
  assert.equal((await r.json()).code, 'RATE_LIMITED'); await Promise.all(pending);
  assert.equal((await call('handle=evol__official')).status, 429); assert.equal(requests.length, 2);
});
test('a known profile with unavailable timeline is not presented as zero posts', async () => {
  setup(url => Response.json(url.includes('/statuses') ? { code: 404, results: [] } : profile));
  const r = await call('handle=evol__official'); assert.equal(r.status, 502); assert.equal((await r.json()).code, 'TIMELINE_UNAVAILABLE');
});
test('private profiles are not exposed', async () => {
  setup(url => Response.json(url.includes('/statuses') ? timeline : { ...profile, user: { ...profile.user, protected: true } }));
  const r = await call('handle=evol__official'); assert.equal(r.status, 403);
});
test('upstream logical errors in HTTP 200 are respected', async () => {
  setup(() => Response.json({ code: 500, results: [] }));
  assert.equal((await call('handle=evol__official')).status, 502);
});
test('malformed source responses never manufacture a successful timeline', async () => {
  setup(() => new Response('<html>maintenance</html>'));
  assert.equal((await call('handle=evol__official')).status, 502);
});
test('oversized source payloads are bounded', async () => {
  setup(() => new Response('x'.repeat(3 * 1024 * 1024 + 1)));
  const r = await call('handle=evol__official'); assert.equal(r.status, 502); assert.equal((await r.json()).code, 'SOURCE_TOO_LARGE');
});
test('invalid cursors never reach upstream; POST is rejected', async () => {
  setup(() => { throw new Error('unexpected'); });
  assert.equal((await call('handle=evol__official&cursor=%3Cscript%3E')).status, 400);
  assert.equal((await worker.fetch(new Request('https://test.example/api/radar/profile', { method: 'POST' }), env, ctx)).status, 405);
  assert.equal(requests.length, 0);
});

test('local throttling blocks before cache and upstream and gives retry guidance', async () => {
  setup(() => {throw new Error('must not call upstream');});
  let key;
  const response=await worker.fetch(new Request('https://test.example/api/radar/profile?handle=evol__official',{headers:{'CF-Connecting-IP':'192.0.2.1'}}),{...env,API_LIMITER:{limit:async options=>{key=options.key;return {success:false};}}},ctx);
  assert.equal(response.status,429);assert.equal(response.headers.get('Retry-After'),'60');assert.equal((await response.json()).code,'LOCAL_RATE_LIMITED');assert.equal(key,'oshi-api:192.0.2.1');assert.equal(requests.length,0);
});
