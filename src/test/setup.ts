import '@testing-library/jest-dom';
// jsdom has no top-layer implementation. Real modal focus behavior is covered by browser tests.
if (!HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute('open');
  };
}
// Polyfill window.matchMedia for responsive tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});
// Polyfill MediaStream and navigator.mediaDevices if not present in jsdom
if (!navigator.mediaDevices) {
  // @ts-expect-error Mocking mediaDevices for test
  navigator.mediaDevices = {};
}
// Mock URL.createObjectURL and revokeObjectURL
if (!window.URL.createObjectURL) {
  window.URL.createObjectURL = () => 'blob:mock-url';
}
if (!window.URL.revokeObjectURL) {
  window.URL.revokeObjectURL = () => {};
}
interface Mock2DContext {
  canvas: HTMLCanvasElement;
  fillStyle: string;
  fillRect: (_x: number, _y: number, _w: number, _h: number) => void;
  drawImage: (image: unknown) => void;
  getImageData: (
    _sx: number,
    _sy: number,
    sw: number,
    sh: number
  ) => {
    data: Uint8ClampedArray;
    width: number;
    height: number;
    colorSpace: PredefinedColorSpace;
  };
}
// Mock HTMLCanvasElement.prototype.getContext for pixel testing in jsdom
const originalGetContext = HTMLCanvasElement.prototype.getContext;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(HTMLCanvasElement.prototype as any).getContext = function (contextId: string, ...args: unknown[]) {
  if (contextId === '2d') {
    const el = this as HTMLCanvasElement & { _mockContext?: Mock2DContext };
    if (!el._mockContext) {
      el._mockContext = {
        canvas: this,
        fillStyle: '#000000',
        fillRect: function () {},
        drawImage: function (image: unknown) {
          const src = image as { _mockContext?: Mock2DContext } | undefined;
          if (src?._mockContext) {
            this.fillStyle = src._mockContext.fillStyle;
          }
        },
        getImageData: function (_sx: number, _sy: number, sw: number, sh: number) {
          const total = sw * sh * 4;
          const data = new Uint8ClampedArray(total);
          const hex = String(this.fillStyle || '#000000');
          let r = 128,
            g = 128,
            b = 128;
          if (hex === '#050505') {
            r = 5;
            g = 5;
            b = 5;
          } else if (hex === '#FAFAFA') {
            r = 250;
            g = 250;
            b = 250;
          }
          for (let i = 0; i < total; i += 4) {
            data[i] = r;
            data[i + 1] = g;
            data[i + 2] = b;
            data[i + 3] = 255;
          }
          return { data, width: sw, height: sh, colorSpace: 'srgb' as PredefinedColorSpace };
        },
      };
    }
    return el._mockContext as unknown as RenderingContext;
  }
  return originalGetContext
    ? (originalGetContext as (...a: unknown[]) => RenderingContext | null).apply(this, [
        contextId,
        ...args,
      ])
    : null;
};
