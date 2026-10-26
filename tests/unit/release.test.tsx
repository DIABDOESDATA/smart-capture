import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { Modal } from '@/components/ui/Modal';
import { ExportModal } from '@/components/gallery/ExportModal';
import { safeExportName, canShareFile } from '@/services/export/share';
import { loadWorkspace, saveWorkspace, WORKSPACE_ID } from '@/services/workspace';
import { VehicleCaptureSession } from '@/types/capture';
const mocks = vi.hoisted(() => ({ get: vi.fn(), put: vi.fn(), zip: vi.fn(), download: vi.fn() }));
vi.mock('@/services/storage/indexedDb', () => ({ getSetting: mocks.get, putSetting: mocks.put }));
vi.mock('@/services/export/zipExporter', () => ({
  generateSessionZip: mocks.zip,
  triggerFileDownload: mocks.download,
  buildManifest: () => ({ missingRequired: [] }),
}));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});
describe('Release reliability', () => {
  it('retains the existing data partition while validating a public studio name', async () => {
    expect(WORKSPACE_ID).toBe('dealership-ddrive-01');
    mocks.get.mockResolvedValue({ name: '  Hilltop Cars  ', aiGuidance: true });
    expect(await loadWorkspace()).toEqual({ name: 'Hilltop Cars', aiGuidance: true });
    await expect(saveWorkspace({ name: '  ', aiGuidance: false })).rejects.toThrow('1–60');
    expect(mocks.put).not.toHaveBeenCalled();
    await saveWorkspace({ name: '  Hilltop Cars ', aiGuidance: false });
    expect(mocks.put).toHaveBeenCalledWith('workspace:preferences', {
      name: 'Hilltop Cars',
      aiGuidance: false,
    });
  });
  it('does not turn corrupt stored settings into AI opt-in', async () => {
    mocks.get.mockResolvedValue({ name: 123, aiGuidance: 'yes' });
    expect(await loadWorkspace()).toEqual({ name: 'My photo studio', aiGuidance: false });
  });
  it('cleans user-entered export filenames', () => {
    expect(safeExportName('../vehicle:123\\test')).toBe('___vehicle_123_test');
    expect(safeExportName('')).toBe('VEHICLE');
    expect(safeExportName('x'.repeat(200))).toHaveLength(80);
  });
  it('handles unsupported and throwing native share implementations', () => {
    const file = new File(['photo'], 'photo.jpg', { type: 'image/jpeg' });
    expect(canShareFile(file)).toBe(false);
    vi.stubGlobal('navigator', {
      share: vi.fn(),
      canShare: () => {
        throw new Error('Unsupported');
      },
    });
    expect(canShareFile(file)).toBe(false);
  });
  it('prevents Escape dismissal during a save and restores dismissal afterward', () => {
    const close = vi.fn();
    const { rerender } = render(
      <Modal open title="Review" busy onClose={close}>
        <p>Photo</p>
      </Modal>
    );
    fireEvent(
      screen.getByRole('dialog'),
      new Event('cancel', { bubbles: false, cancelable: true })
    );
    expect(close).not.toHaveBeenCalled();
    rerender(
      <Modal open title="Review" onClose={close}>
        <p>Photo</p>
      </Modal>
    );
    fireEvent(
      screen.getByRole('dialog'),
      new Event('cancel', { bubbles: false, cancelable: true })
    );
    expect(close).toHaveBeenCalledOnce();
  });
  it('prepares a file before enabling the synchronous download action', async () => {
    let resolve!: (blob: Blob) => void;
    mocks.zip.mockReturnValue(
      new Promise<Blob>((r) => {
        resolve = r;
      })
    );
    const session = { shots: [{}] } as VehicleCaptureSession;
    render(
      <ExportModal session={session} vehicle={{ stockNumber: 'A/123' }} isOpen onClose={vi.fn()} />
    );
    const button = screen.getByRole('button', { name: 'Download ZIP Package' });
    expect(button).toBeDisabled();
    resolve(new Blob(['zip'], { type: 'application/zip' }));
    await waitFor(() => expect(button).toBeEnabled());
    fireEvent.click(button);
    expect(mocks.download).toHaveBeenCalledOnce();
    expect(mocks.download.mock.calls[0][1]).toBe('A_123_GALLERY.zip');
    expect(screen.getByText(/Download requested/)).toBeInTheDocument();
  });
  it('keeps download disabled on preparation errors', async () => {
    mocks.zip.mockRejectedValue(new Error('Photo missing'));
    render(
      <ExportModal
        session={{ shots: [{}] } as VehicleCaptureSession}
        vehicle={{}}
        isOpen
        onClose={vi.fn()}
      />
    );
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Photo missing'));
    expect(screen.getByRole('button', { name: 'Download ZIP Package' })).toBeDisabled();
  });
});
