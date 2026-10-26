import { useState } from 'react';
import { VehicleCaptureSession } from '@/types/capture';
import { Vehicle } from '@/types/vehicle';
import {
  generateSessionZip,
  triggerFileDownload,
  buildManifest,
} from '@/services/export/zipExporter';
interface Props {
  session: VehicleCaptureSession;
  vehicle: Partial<Vehicle>;
  isOpen: boolean;
  onClose: () => void;
}
export function ExportModal({ session, vehicle, isOpen, onClose }: Props) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  if (!isOpen) return null;
  const m = buildManifest(session, vehicle);
  return (
    <div className="modal-backdrop">
      <section
        className="panel modal"
        role="dialog"
        aria-modal="true"
        aria-label="Export Vehicle Gallery"
      >
        <header>
          <h2>Export Vehicle Gallery</h2>
          <button aria-label="Close export" onClick={onClose}>
            ×
          </button>
        </header>
        <h3>Standardized Dealership ZIP Package</h3>
        <p>
          {session.shots.length} images in gallery order, manifest.json and manifest.csv. Works
          offline. Adjusted photos include originals.
        </p>
        {m.missingRequired && m.missingRequired.length > 0 && (
          <p className="warning">
            Incomplete checklist: {m.missingRequired.length} required shots missing. This export
            remains labeled incomplete.
          </p>
        )}
        {m.containsSampleMedia && (
          <p className="warning">
            Contains SAMPLE media. Do not use this gallery as real inventory photography.
          </p>
        )}
        {m.containsUnverifiedLegacyMedia && (
          <p className="warning">Legacy photo source is unknown. Review before publishing.</p>
        )}
        <button
          className="primary"
          disabled={busy || !session.shots.length}
          onClick={async () => {
            setBusy(true);
            setError('');
            try {
              triggerFileDownload(
                await generateSessionZip(session, vehicle),
                `${vehicle.vin || vehicle.stockNumber || 'VEHICLE'}_GALLERY.zip`
              );
            } catch (e) {
              setError(e instanceof Error ? e.message : 'Export failed.');
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? 'Packaging…' : 'Download ZIP Package'}
        </button>
        {error && <p role="alert">{error}</p>}
        <p>
          D Drive Photo Studio integration is disabled for standalone pilot review. No uploads or
          synchronization are performed.
        </p>
      </section>
    </div>
  );
}
