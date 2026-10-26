import { useEffect, useState } from 'react';
import { Download, Share2, FileArchive, Check, Loader2 } from 'lucide-react';
import { VehicleCaptureSession } from '@/types/capture';
import { Vehicle } from '@/types/vehicle';
import {
  generateSessionZip,
  triggerFileDownload,
  buildManifest,
} from '@/services/export/zipExporter';
import { canShareFile, shareFile, safeExportName } from '@/services/export/share';
import { Modal } from '../ui/Modal';
interface Props {
  session: VehicleCaptureSession;
  vehicle: Partial<Vehicle>;
  isOpen: boolean;
  onClose: () => void;
}
export function ExportModal({ session, vehicle, isOpen, onClose }: Props) {
  const [file, setFile] = useState<File | null>(null),
    [error, setError] = useState(''),
    [retry, setRetry] = useState(0),
    [sharing, setSharing] = useState(false),
    [requested, setRequested] = useState(false);
  useEffect(() => {
    if (!isOpen || !session.shots.length) return;
    let alive = true;
    setFile(null);
    setError('');
    setRequested(false);
    void generateSessionZip(session, vehicle)
      .then((blob) => {
        if (alive)
          setFile(
            new File(
              [blob],
              `${safeExportName(vehicle.vin || vehicle.stockNumber || 'VEHICLE')}_GALLERY.zip`,
              { type: 'application/zip' }
            )
          );
      })
      .catch((e) => {
        if (alive) setError(e instanceof Error ? e.message : 'Export could not be prepared.');
      });
    return () => {
      alive = false;
    };
  }, [isOpen, session, vehicle, retry]);
  if (!isOpen) return null;
  const manifest = buildManifest(session, vehicle);
  return (
    <Modal
      open={isOpen}
      title="Export Vehicle Gallery"
      closeLabel="Close export"
      onClose={onClose}
      busy={sharing}
    >
      <div className="export-summary">
        <span className="section-icon">
          <FileArchive size={25} />
        </span>
        <div>
          <h3>{session.shots.length} photos. One complete package.</h3>
          <p>Gallery order, original files for edited images, and JSON / CSV metadata.</p>
        </div>
      </div>
      {manifest.missingRequired && manifest.missingRequired.length > 0 && (
        <p className="warning">
          Incomplete checklist: {manifest.missingRequired.length} required shots missing. This
          export remains labeled incomplete.
        </p>
      )}
      {manifest.containsSampleMedia && (
        <p className="warning">
          Contains SAMPLE media. Do not use this gallery as real inventory photography.
        </p>
      )}
      {manifest.containsUnverifiedLegacyMedia && (
        <p className="warning">Legacy photo source is unknown. Review before publishing.</p>
      )}
      <div className="export-readiness" role="status">
        {file ? (
          <>
            <Check size={18} />
            Ready · {(file.size / 1048576).toFixed(1)} MB
          </>
        ) : error ? (
          'Export needs attention'
        ) : session.shots.length ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            Preparing gallery on this device…
          </>
        ) : (
          'Capture a photo before exporting.'
        )}
      </div>
      <button
        className="primary w-full"
        disabled={!file || sharing}
        onClick={() => {
          if (file) {
            triggerFileDownload(file, file.name);
            setRequested(true);
          }
        }}
      >
        <Download size={18} />
        Download ZIP Package
      </button>
      {file && canShareFile(file) && (
        <button
          className="secondary w-full mt-3"
          disabled={sharing}
          onClick={() => {
            setSharing(true);
            void shareFile(file)
              .catch((e) => {
                if (!(e instanceof Error && e.name === 'AbortError'))
                  setError('Sharing could not finish. Use Download ZIP Package instead.');
              })
              .finally(() => setSharing(false));
          }}
        >
          <Share2 size={18} />
          {sharing ? 'Sharing…' : 'Share gallery…'}
        </button>
      )}
      {requested && (
        <p className="dialog-copy" role="status">
          Download requested. Check your browser’s downloads or Files app before removing any local
          photos.
        </p>
      )}
      {error && (
        <div role="alert">
          <p className="warning">{error}</p>
          <button className="secondary" onClick={() => setRetry((n) => n + 1)}>
            Prepare export again
          </button>
        </div>
      )}
      <p className="dialog-copy">Works offline. No photos are uploaded to a server.</p>
    </Modal>
  );
}
