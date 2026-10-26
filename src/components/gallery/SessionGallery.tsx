import { useState, useEffect, useRef } from 'react';
import { VehicleCaptureSession, CapturedShot } from '@/types/capture';
import { CaptureTemplate } from '@/types/template';
import { Vehicle } from '@/types/vehicle';
import { missingRequired } from '@/services/capture/sequence';
import { getPhotoBlob, getMediaBlob } from '@/services/storage/indexedDb';
import { triggerFileDownload } from '@/services/export/zipExporter';
import { ExportModal } from './ExportModal';
import { PhotoEditor } from './PhotoEditor';
import { Modal } from '../ui/Modal';
import { canShareFile, shareFile } from '@/services/export/share';
interface Props {
  session: VehicleCaptureSession;
  template: CaptureTemplate;
  vehicle: Vehicle;
  onRetakeShot: (index: number) => void;
  onUpdateShots: (s: CapturedShot[]) => Promise<void>;
  onBackToDashboard: () => void;
  onResume?: () => void;
}
export function SessionGallery({
  session,
  template,
  vehicle,
  onRetakeShot,
  onUpdateShots,
  onBackToDashboard,
  onResume,
}: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null),
    [exporting, setExporting] = useState(false),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [previous, setPrevious] = useState(''),
    [editing, setEditing] = useState(false),
    [editorBusy, setEditorBusy] = useState(false),
    [selectedFile, setSelectedFile] = useState<File | null>(null);
  const touch = useRef(0);
  const sorted = [...session.shots].sort((a, b) => a.sequenceOrder - b.sequenceOrder),
    selected = sorted.find((s) => s.shotId === selectedId),
    missing = missingRequired(template, session.shots);
  useEffect(() => {
    let live = true;
    setSelectedFile(null);
    if (selected)
      void getPhotoBlob(selected)
        .then((blob) => {
          if (live)
            setSelectedFile(new File([blob], `${selected.shotCode}.jpg`, { type: 'image/jpeg' }));
        })
        .catch(() => {
          if (live) setError('Photo could not be prepared for download. Reopen it to retry.');
        });
    return () => {
      live = false;
    };
  }, [selected]);
  useEffect(() => {
    let live = true,
      u = '';
    setPrevious('');
    if (selected?.previousImageId)
      void getMediaBlob(selected.previousImageId)
        .then((b) => {
          if (live) {
            u = URL.createObjectURL(b);
            setPrevious(u);
          }
        })
        .catch(() => {});
    return () => {
      live = false;
      if (u) URL.revokeObjectURL(u);
    };
  }, [selected?.previousImageId]);
  const update = async (shots: CapturedShot[]) => {
    setBusy(true);
    setError('');
    try {
      await onUpdateShots(shots);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gallery could not be saved.');
      throw e;
    } finally {
      setBusy(false);
    }
  };
  const move = async (id: string, direction: number) => {
    const list = [...sorted],
      i = list.findIndex((s) => s.shotId === id),
      j = i + direction;
    if (j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    await update(list.map((s, n) => ({ ...s, sequenceOrder: n + 1 })));
  };
  const navigate = (d: number) => {
    if (!selected) return;
    const i = sorted.findIndex((s) => s.shotId === selected.shotId);
    setSelectedId(sorted[(i + d + sorted.length) % sorted.length].shotId);
  };
  return (
    <div className="gallery-page">
      <header className="gallery-header">
        <button onClick={onBackToDashboard}>← Sessions</button>
        <div>
          <h1>
            {[vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(' ') ||
              'Vehicle Gallery'}
          </h1>
          <p>
            VIN {vehicle.vin || 'unknown'} · Stock {vehicle.stockNumber || 'unassigned'}
          </p>
        </div>
        <button className="primary" onClick={() => setExporting(true)}>
          Export gallery
        </button>
      </header>
      <main className="gallery-content">
        <section className="panel gallery-progress">
          <div>
            <span className="eyebrow">Capture Progress</span>
            <h2>
              {session.shots.length} / {template.shots.length} saved
            </h2>
            <p>
              {missing.length
                ? `${missing.length} required shots remaining`
                : 'All required shots saved'}
            </p>
            <p>
              {session.status === 'paused' ? 'Session paused · safe to resume' : session.status} ·{' '}
              {template.name}
            </p>
          </div>
          <button onClick={onResume}>
            {missing.length ? 'Resume next missing shot' : 'Review capture angles'}
          </button>
        </section>
        {session.shots.some((s) => s.source === 'sample') && (
          <p className="warning">SAMPLE gallery — contains generated test photographs.</p>
        )}
        {error && <p role="alert">{error}</p>}
        <div className="photo-grid">
          {sorted.map((s, i) => (
            <article key={s.shotId} className="photo-card">
              <button className="photo-tile" onClick={() => setSelectedId(s.shotId)}>
                <img src={s.thumbnailUrl || s.imageDataUrl} alt={s.shotName} loading="lazy" />
                <span className="photo-order">
                  {i + 1} {s.isHero ? '· HERO' : ''}
                </span>
                {s.source !== 'camera' && (
                  <span className="photo-source">
                    {s.source === 'sample' ? 'SAMPLE' : 'SOURCE UNKNOWN'}
                  </span>
                )}
              </button>
              <h3>{s.shotName}</h3>
              <p>
                {s.quality.warnings.length
                  ? `${s.quality.warnings.length} quality advisories`
                  : 'No quality warnings'}{' '}
                · {new Date(s.capturedAt).toLocaleTimeString()}
              </p>
              <div className="toggle-row">
                <button
                  aria-label={`Move ${s.shotCode} earlier`}
                  disabled={busy || i === 0}
                  onClick={() => void move(s.shotId, -1).catch(() => {})}
                >
                  ←
                </button>
                <button
                  aria-label={`Move ${s.shotCode} later`}
                  disabled={busy || i === sorted.length - 1}
                  onClick={() => void move(s.shotId, 1).catch(() => {})}
                >
                  →
                </button>
                <button
                  disabled={busy}
                  aria-pressed={s.isHero}
                  onClick={() =>
                    void update(sorted.map((p) => ({ ...p, isHero: p.shotId === s.shotId }))).catch(
                      () => {}
                    )
                  }
                >
                  Hero
                </button>
              </div>
            </article>
          ))}
        </div>
        <h2>Checklist</h2>
        <div className="checklist-grid">
          {template.shots.map((s, i) => {
            const captured = session.shots.find((p) => p.shotCode === s.code);
            return (
              <button
                key={s.code}
                className={captured ? 'checklist-saved' : 'checklist-missing'}
                onClick={() => onRetakeShot(i)}
              >
                {captured ? '✓' : '○'} {s.name}
                <small>{captured ? 'Retake' : s.isRequired ? 'Required' : 'Optional'}</small>
              </button>
            );
          })}
        </div>
      </main>
      {selected && (
        <Modal
          open={!!selected}
          title={selected.shotName}
          closeLabel="Close photo review"
          className="photo-review-dialog"
          busy={busy || editorBusy}
          onClose={() => {
            setSelectedId(null);
            setEditing(false);
          }}
        >
          {error && (
            <p role="alert" className="warning">
              {error}
            </p>
          )}
          {editing ? (
            <PhotoEditor
              shot={selected}
              onBusyChange={setEditorBusy}
              onCancel={() => setEditing(false)}
              onSaved={async (s) => {
                await update(sorted.map((p) => (p.shotId === s.shotId ? s : p)));
                setEditing(false);
              }}
            />
          ) : (
            <>
              <img
                className="review-image"
                src={selected.imageDataUrl}
                alt={selected.shotName}
                onTouchStart={(e) => {
                  touch.current = e.touches[0].clientX;
                }}
                onTouchEnd={(e) => {
                  const dx = e.changedTouches[0].clientX - touch.current;
                  if (Math.abs(dx) > 45) navigate(dx < 0 ? 1 : -1);
                }}
              />
              <div className="toggle-row">
                <button aria-label="Previous photo" onClick={() => navigate(-1)}>
                  ← Previous
                </button>
                <button aria-label="Next photo" onClick={() => navigate(1)}>
                  Next →
                </button>
              </div>
              <p>
                {new Date(selected.capturedAt).toLocaleString()} · {selected.quality.width} ×{' '}
                {selected.quality.height} · Horizon{' '}
                {selected.quality.tiltDegrees === null
                  ? 'unavailable'
                  : `${selected.quality.tiltDegrees}°`}{' '}
                · Source {selected.source || 'legacy unknown'}
              </p>
              <p>
                Sharpness {selected.quality.blurScore} · Exposure {selected.quality.exposure}
              </p>
              {selected.quality.warnings.map((w) => (
                <p className="warning" key={w}>
                  {w}
                </p>
              ))}
              {previous && (
                <details>
                  <summary>Before / after retake comparison</summary>
                  <div className="comparison-pair">
                    <img src={previous} alt="Previous capture" />
                    <img src={selected.imageDataUrl} alt="Current capture" />
                  </div>
                </details>
              )}
              <div className="toggle-row">
                <button
                  onClick={() => {
                    setSelectedId(null);
                    onRetakeShot(template.shots.findIndex((s) => s.code === selected.shotCode));
                  }}
                >
                  Retake This Photo
                </button>
                <button onClick={() => setEditing(true)}>Adjust photo</button>
                <button
                  disabled={!selectedFile}
                  onClick={() => {
                    if (selectedFile) triggerFileDownload(selectedFile, selectedFile.name);
                  }}
                >
                  Download photo
                </button>
                {selectedFile && canShareFile(selectedFile) && (
                  <button
                    onClick={() => {
                      void shareFile(selectedFile).catch((e) => {
                        if (!(e instanceof Error && e.name === 'AbortError'))
                          setError('Sharing did not finish. Download the photo instead.');
                      });
                    }}
                  >
                    Share photo…
                  </button>
                )}
              </div>
            </>
          )}
        </Modal>
      )}
      <ExportModal
        session={session}
        vehicle={vehicle}
        isOpen={exporting}
        onClose={() => setExporting(false)}
      />
    </div>
  );
}
