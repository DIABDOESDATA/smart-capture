import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
const source = readFileSync('public/sw.js', 'utf8')
  .replace('__BUILD_ID__', 'test')
  .replace(
    'const ASSETS = [];',
    'const ASSETS = ' + JSON.stringify(['./index.html', './assets/camera.js']) + ';'
  );
function worker() {
  const handlers = new Map<string, (event: Record<string, unknown>) => void>();
  const entries = new Map<string, unknown>();
  const skipWaiting = vi.fn(),
    claim = vi.fn(),
    fetcher = vi.fn(),
    remove = vi.fn();
  const clients = [{ url: 'https://studio.test/app/' }];
  const match = vi.fn(async (request: string | { url: string }) =>
    entries.get(typeof request === 'string' ? request : request.url)
  );
  const cache = {
    addAll: vi.fn(async (paths: string[]) => {
      paths.forEach((url) => entries.set(url, { cached: url }));
    }),
    match,
  };
  runInNewContext(source, {
    self: {
      registration: { scope: 'https://studio.test/app/' },
      location: { origin: 'https://studio.test' },
      addEventListener: (type: string, fn: (event: Record<string, unknown>) => void) =>
        handlers.set(type, fn),
      clients: { claim, matchAll: async () => clients },
      skipWaiting,
    },
    caches: {
      open: async () => cache,
      keys: async () => [
        'smart-capture-ai-v1',
        'smart-capture-shell-old1',
        'smart-capture-shell-old2',
        'smart-capture-shell-test',
      ],
      delete: remove,
    },
    URL,
    fetch: fetcher,
    Response: { error: () => ({ networkError: true }) },
  });
  const dispatch = async (name: string, data: Record<string, unknown> = {}) => {
    let promise: Promise<unknown> | undefined;
    handlers.get(name)!({
      ...data,
      waitUntil: (value: Promise<unknown>) => {
        promise = value;
      },
      respondWith: (value: Promise<unknown>) => {
        promise = value;
      },
    });
    return promise;
  };
  return { dispatch, entries, skipWaiting, fetcher, cache, clients, remove, claim };
}
describe('Version-safe offline worker', () => {
  it('prepares every shell asset without interrupting active clients', async () => {
    const w = worker();
    await w.dispatch('install');
    expect(w.cache.addAll).toHaveBeenCalledWith([
      'https://studio.test/app/index.html',
      'https://studio.test/app/assets/camera.js',
    ]);
    expect(w.skipWaiting).not.toHaveBeenCalled();
  });
  it('serves the installed shell and lazy chunks offline without a network dependency', async () => {
    const w = worker();
    await w.dispatch('install');
    expect(
      await w.dispatch('fetch', {
        request: { method: 'GET', url: 'https://studio.test/app/?open=studio', mode: 'navigate' },
      })
    ).toEqual({ cached: 'https://studio.test/app/index.html' });
    expect(
      await w.dispatch('fetch', {
        request: { method: 'GET', url: 'https://studio.test/app/assets/camera.js', mode: 'cors' },
      })
    ).toEqual({ cached: 'https://studio.test/app/assets/camera.js' });
    expect(w.fetcher).not.toHaveBeenCalled();
  });
  it('does not intercept external VIN or private API requests', async () => {
    const w = worker();
    expect(
      await w.dispatch('fetch', {
        request: { method: 'GET', url: 'https://vpic.nhtsa.dot.gov/api/vehicles', mode: 'cors' },
      })
    ).toBeUndefined();
    expect(
      await w.dispatch('fetch', {
        request: { method: 'GET', url: 'https://studio.test/api/account', mode: 'cors' },
      })
    ).toBeUndefined();
    expect(w.cache.match).not.toHaveBeenCalled();
  });
  it('blocks an update while another app window is open', async () => {
    const w = worker();
    w.clients.push({ url: 'https://studio.test/app/#camera' });
    const postMessage = vi.fn();
    await w.dispatch('message', { data: { type: 'SKIP_WAITING' }, source: { postMessage } });
    expect(w.skipWaiting).not.toHaveBeenCalled();
    expect(postMessage).toHaveBeenCalledWith({ type: 'UPDATE_BLOCKED' });
  });
  it('activates an explicitly requested update in a single window', async () => {
    const w = worker();
    await w.dispatch('message', { data: { type: 'SKIP_WAITING' } });
    expect(w.skipWaiting).toHaveBeenCalledOnce();
  });
  it('keeps the AI pack and previous shell while retiring older shells', async () => {
    const w = worker();
    await w.dispatch('activate');
    expect(w.remove).toHaveBeenCalledWith('smart-capture-shell-old1');
    expect(w.remove).not.toHaveBeenCalledWith('smart-capture-ai-v1');
    expect(w.remove).not.toHaveBeenCalledWith('smart-capture-shell-old2');
    expect(w.claim).toHaveBeenCalledOnce();
  });
});
