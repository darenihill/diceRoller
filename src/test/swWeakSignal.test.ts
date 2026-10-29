import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { runInNewContext } from 'node:vm';

// Runs public/sw.js against a small fake service-worker world and opens the app
const SW = readFileSync(resolve(__dirname, '../../public/sw.js'), 'utf8');

type Res = { status: number; body: string; clone: () => Res };
const res = (body: string, status = 200): Res => ({ status, body, clone: () => res(body, status) });

function openApp(fetchImpl: () => Promise<Res>, saved?: Res) {
  const store = new Map<string, Res>();
  if (saved) store.set('/index.html', saved);
  const listeners: Record<string, (e: unknown) => void> = {};
  const cache = { put: (_req: unknown, r: Res) => { store.set('/index.html', r); return Promise.resolve(); } };
  const ctx = {
    self: { addEventListener: (t: string, fn: (e: unknown) => void) => { listeners[t] = fn; }, location: { origin: 'https://customdiceroller.com' } },
    caches: { open: () => Promise.resolve(cache), match: () => Promise.resolve(store.get('/index.html')), keys: () => Promise.resolve([]) },
    fetch: fetchImpl,
    URL, Promise, setTimeout, console
  };
  runInNewContext(SW, ctx);
  let response: Promise<Res> | undefined;
  listeners.fetch({
    request: { method: 'GET', url: 'https://customdiceroller.com/', mode: 'navigate', destination: 'document' },
    respondWith: (p: Promise<Res>) => { response = p; },
    waitUntil: () => {}
  });
  return { response: response!, store };
}

describe('Opening the app on a weak signal', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('a good signal opens the fresh page and saves it, as today', async () => {
    const { response, store } = openApp(() => Promise.resolve(res('fresh')), res('saved'));
    await vi.advanceTimersByTimeAsync(100);
    expect((await response).body).toBe('fresh');
    expect(store.get('/index.html')!.body).toBe('fresh');
  });

  it('a weak signal opens the saved copy after 3 seconds', async () => {
    const { response } = openApp(() => new Promise(r => setTimeout(() => r(res('fresh')), 20000)), res('saved'));
    let done = false; response.then(() => { done = true; });
    await vi.advanceTimersByTimeAsync(2900);
    expect(done).toBe(false);
    await vi.advanceTimersByTimeAsync(200);
    expect((await response).body).toBe('saved');
  });

  it('the slow fresh page is still saved, so the newer version opens next time', async () => {
    const { response, store } = openApp(() => new Promise(r => setTimeout(() => r(res('fresh')), 20000)), res('saved'));
    await vi.advanceTimersByTimeAsync(3100);
    expect((await response).body).toBe('saved');
    await vi.advanceTimersByTimeAsync(20000);
    expect(store.get('/index.html')!.body).toBe('fresh');
  });

  it('with no saved copy yet, it keeps waiting for the network', async () => {
    const { response } = openApp(() => new Promise(r => setTimeout(() => r(res('fresh')), 8000)));
    await vi.advanceTimersByTimeAsync(8100);
    expect((await response).body).toBe('fresh');
  });

  it('with no network at all, it opens the saved copy at once', async () => {
    const { response } = openApp(() => Promise.reject(new Error('offline')), res('saved'));
    await vi.advanceTimersByTimeAsync(10);
    expect((await response).body).toBe('saved');
  });
});
