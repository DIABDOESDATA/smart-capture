import { MODEL_FILES } from './modelAssets';
export const AI_CACHE = 'smart-capture-ai-v1';
export const MODEL_BYTES = MODEL_FILES.reduce((sum, file) => sum + file.bytes, 0);
const urlFor = (name: string) =>
  new URL(`${import.meta.env.BASE_URL}models/vehicle/${name}`, document.baseURI).href;
export async function hasOfflineDetector(): Promise<boolean> {
  if (!('caches' in window) || !window.isSecureContext) return false;
  const cache = await caches.open(AI_CACHE);
  return (
    await Promise.all(
      MODEL_FILES.map(async (file) => {
        const saved = await cache.match(urlFor(file.name));
        return saved?.headers.get('x-model-sha256') === file.sha256;
      })
    )
  ).every(Boolean);
}
export async function downloadDetector(
  onProgress: (fraction: number) => void,
  signal: AbortSignal
) {
  if (!('caches' in window) || !window.isSecureContext)
    throw new Error('Offline AI requires HTTPS or localhost in a supported browser.');
  const cache = await caches.open(AI_CACHE);
  let loaded = 0;
  for (const file of MODEL_FILES) {
    signal.throwIfAborted();
    const url = urlFor(file.name);
    const saved = await cache.match(url);
    if (saved?.headers.get('x-model-sha256') !== file.sha256) {
      const response = await fetch(url, { signal, cache: 'no-store' });
      if (!response.ok) throw new Error('AI download could not finish. Reconnect and try again.');
      const bytes = await response.arrayBuffer();
      if (bytes.byteLength !== file.bytes)
        throw new Error('AI download was incomplete. Retry to repair it.');
      const digest = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)))
        .map((n) => n.toString(16).padStart(2, '0'))
        .join('');
      if (digest !== file.sha256)
        throw new Error('AI download failed its integrity check. Try again.');
      signal.throwIfAborted();
      await cache.put(
        url,
        new Response(bytes, {
          headers: {
            'content-type': file.name.endsWith('.json')
              ? 'application/json'
              : 'application/octet-stream',
            'x-model-sha256': digest,
          },
        })
      );
    }
    loaded += file.bytes;
    onProgress(loaded / MODEL_BYTES);
  }
}
