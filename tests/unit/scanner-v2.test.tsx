import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { VinScannerModal } from '@/components/vehicle/VinScannerModal';
const scanning = vi.hoisted(() => ({
  callback: null as null | ((r: { getText: () => string }) => void),
}));
vi.mock('@zxing/browser', () => ({
  BrowserMultiFormatReader: class {
    async decodeFromStream(
      _stream: unknown,
      _video: unknown,
      callback: (r: { getText: () => string }) => void
    ) {
      scanning.callback = callback;
      callback({ getText: () => '*1HGCM82633A004352*' });
      return { stop: vi.fn() };
    }
  },
}));
describe('VIN recognition callback', () => {
  it('recognizes a barcode, requests confirmation and connects VIN to caller', async () => {
    const stop = vi.fn();
    navigator.mediaDevices.getUserMedia = vi
      .fn()
      .mockResolvedValue({ getTracks: () => [{ stop }] });
    const scanned = vi.fn(),
      closed = vi.fn();
    const view = render(<VinScannerModal isOpen onClose={closed} onVinScanned={scanned} />);
    await waitFor(() =>
      expect(screen.getByLabelText('Scanned VIN')).toHaveValue('1HGCM82633A004352')
    );
    expect(scanned).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Use VIN' }));
    expect(scanned).toHaveBeenCalledWith('1HGCM82633A004352');
    view.unmount();
    expect(stop).toHaveBeenCalled();
  });
});

describe('Stable barcode correction', () => {
  it('does not overwrite manual corrections with repeated camera reads', async () => {
    navigator.mediaDevices.getUserMedia = vi
      .fn()
      .mockResolvedValue({ getTracks: () => [{ stop: vi.fn() }] });
    const view = render(<VinScannerModal isOpen onClose={vi.fn()} onVinScanned={vi.fn()} />);
    await waitFor(() =>
      expect(screen.getByLabelText('Scanned VIN')).toHaveValue('1HGCM82633A004352')
    );
    fireEvent.change(screen.getByLabelText('Scanned VIN'), {
      target: { value: '1HGCM82633A004353' },
    });
    expect(scanning.callback).not.toBeNull();
    scanning.callback!({ getText: () => '*1HGCM82633A004352*' });
    expect(screen.getByLabelText('Scanned VIN')).toHaveValue('1HGCM82633A004353');
    view.unmount();
  });
});
