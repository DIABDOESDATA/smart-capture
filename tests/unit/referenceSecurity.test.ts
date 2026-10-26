import { describe, it, expect } from 'vitest';
import { prepareReferenceRaster } from '@/services/references/prepareRaster';
describe('Raster-only reference previews', () => {
  it.each([
    '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
    '<!doctype html><html><script>alert(1)</script></html>',
    'not a PNG',
  ])('rejects active or mislabeled content before creating a preview', async (text) => {
    const blob = new Blob([text], { type: 'image/png' });
    Object.defineProperty(blob, 'slice', {
      value: () => ({
        arrayBuffer: async () => new TextEncoder().encode(text.slice(0, 12)).buffer,
      }),
    });
    await expect(prepareReferenceRaster(blob)).rejects.toThrow('real PNG');
  });
  it('rejects oversized uploads before decoding', async () => {
    const blob = new Blob(['x']);
    Object.defineProperty(blob, 'size', { value: 26000000 });
    await expect(prepareReferenceRaster(blob)).rejects.toThrow('25 MB');
  });
});
