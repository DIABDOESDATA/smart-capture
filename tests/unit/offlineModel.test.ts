import { afterEach, describe, expect, it, vi } from 'vitest';
import { webcrypto } from 'node:crypto';
import { downloadDetector, hasOfflineDetector } from '@/services/camera/offlineModel';
vi.mock('@/services/camera/modelAssets', () => ({
  MODEL_FILES: [
    {
      name: 'model.json',
      bytes: 1,
      sha256: '2d711642b726b04401627ca9fbac32f5c8530fb1903cc4db02258717921a4881',
    },
  ],
}));
afterEach(() => vi.unstubAllGlobals());
function setup() {
  const records = new Map<string, Response>();
  const put = vi.fn(async (url: string, response: Response) => {
    records.set(url, response);
  });
  vi.stubGlobal('isSecureContext', true);
  vi.stubGlobal('crypto', webcrypto);
  vi.stubGlobal('caches', {
    open: async () => ({ match: async (url: string) => records.get(url), put }),
  });
  const fetcher = vi.fn(async () => new Response('x'));
  vi.stubGlobal('fetch', fetcher);
  return { records, put, fetcher };
}
describe('Verified offline AI pack', () => {
  it('verifies the model and resumes without downloading valid cached files', async () => {
    const { put, fetcher } = setup();
    expect(await hasOfflineDetector()).toBe(false);
    const progress = vi.fn();
    await downloadDetector(progress, new AbortController().signal);
    expect(put).toHaveBeenCalledOnce();
    expect(progress).toHaveBeenLastCalledWith(1);
    expect(await hasOfflineDetector()).toBe(true);
    await downloadDetector(progress, new AbortController().signal);
    expect(fetcher).toHaveBeenCalledOnce();
  });
  it('rejects wrong bytes of the expected size before caching', async () => {
    const { put, fetcher } = setup();
    fetcher.mockResolvedValue(new Response('y'));
    await expect(downloadDetector(vi.fn(), new AbortController().signal)).rejects.toThrow(
      'integrity'
    );
    expect(put).not.toHaveBeenCalled();
    expect(await hasOfflineDetector()).toBe(false);
  });
  it('rejects truncated downloads', async () => {
    const { put, fetcher } = setup();
    fetcher.mockResolvedValue(new Response(''));
    await expect(downloadDetector(vi.fn(), new AbortController().signal)).rejects.toThrow(
      'incomplete'
    );
    expect(put).not.toHaveBeenCalled();
  });
  it('honors cancellation before starting network work', async () => {
    const { fetcher } = setup();
    const controller = new AbortController();
    controller.abort();
    await expect(downloadDetector(vi.fn(), controller.signal)).rejects.toThrow();
    expect(fetcher).not.toHaveBeenCalled();
  });
});
