import { useEffect, useState } from 'react';
import {
  Camera,
  ArrowUpRight,
  ArrowRight,
  Images,
  Check,
  Search,
  Trash2,
  ScanLine,
  Sparkles,
  ShieldCheck,
  Smartphone,
  SlidersHorizontal,
} from 'lucide-react';
import { VehicleCaptureSession } from '@/types/capture';
import { Vehicle } from '@/types/vehicle';
import { getSession, releaseSession } from '@/services/storage/indexedDb';
import { MASTER_24_SHOT_SEQUENCE } from '@/services/templates/defaultTemplates';
import { useAppStatus } from '@/services/appLifecycle';
import { Modal } from '../ui/Modal';
interface Props {
  sessions: VehicleCaptureSession[];
  vehicles: Vehicle[];
  onStartNewSession: () => void;
  onOpenSession: (s: VehicleCaptureSession) => void;
  onResumeSession: (s: VehicleCaptureSession) => void;
  onDeleteSession?: (s: VehicleCaptureSession) => Promise<void>;
  onSettings: () => void;
}
const title = (v?: Vehicle) =>
  [v?.year, v?.make, v?.model].filter(Boolean).join(' ') || v?.stockNumber || 'Untitled vehicle';
export function Dashboard({
  sessions,
  vehicles,
  onStartNewSession,
  onOpenSession,
  onResumeSession,
  onDeleteSession,
  onSettings,
}: Props) {
  const [query, setQuery] = useState(''),
    [filter, setFilter] = useState('all'),
    [compare, setCompare] = useState(false),
    [code, setCode] = useState('FRONT_3Q_DRIVER'),
    [usage, setUsage] = useState<StorageEstimate | null>(null),
    [comparison, setComparison] = useState<VehicleCaptureSession[]>([]),
    [deleting, setDeleting] = useState<VehicleCaptureSession | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const status = useAppStatus();
  useEffect(() => {
    void navigator.storage
      ?.estimate?.()
      .then(setUsage)
      .catch(() => {});
  }, [sessions]);
  useEffect(() => {
    let live = true;
    const loaded: VehicleCaptureSession[] = [];
    if (compare)
      void (async () => {
        try {
          for (const session of sessions
            .filter((s) => s.shots.some((p) => p.shotCode === code))
            .slice(0, 5)) {
            const full = await getSession(session.id);
            if (!live) {
              if (full) releaseSession(full);
              return;
            }
            if (full) loaded.push(full);
          }
          if (live) setComparison([...loaded]);
        } catch {
          if (live) setError('Comparison could not load. Your saved sessions remain available.');
        }
      })();
    return () => {
      live = false;
      loaded.forEach(releaseSession);
    };
  }, [compare, sessions, code]);
  const map = new Map(vehicles.map((v) => [v.id, v]));
  const completed = sessions.filter((s) => s.status === 'completed');
  const unfinished = sessions
    .filter((s) => s.status !== 'completed')
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const total = sessions.reduce(
    (n, s) => n + s.shots.filter((p) => p.source === 'camera').length,
    0
  );
  const visible = sessions
    .filter((s) => {
      const v = map.get(s.vehicleId);
      return (
        (filter === 'all' || s.status === filter) &&
        [v?.vin, v?.stockNumber, v?.make, v?.model, v?.year]
          .join(' ')
          .toLowerCase()
          .includes(query.trim().toLowerCase())
      );
    })
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const recent = unfinished[0];
  return (
    <div className="dashboard-content release-dashboard">
      <section className="studio-hero">
        <div className="hero-copy">
          <span className="eyebrow">
            <span className="tiny-line" />
            THE AUTOMOTIVE PHOTO STUDIO
          </span>
          <h1>
            A better angle.
            <br />
            <span>Every time.</span>
          </h1>
          <p>
            From the first frame to the final gallery.
            <br className="desktop-break" /> Consistent vehicle photography, guided by you.
          </p>
          <div className="hero-actions">
            <button className="primary" onClick={onStartNewSession}>
              <Camera size={20} />
              New Photo Session
              <ArrowUpRight size={18} />
            </button>
            {!status.installed && (
              <button className="text-button" onClick={onSettings}>
                <Smartphone size={17} />
                Install app
              </button>
            )}
          </div>
          <div className="hero-benefits">
            <span>
              <ShieldCheck size={14} />
              Photos stay on device
            </span>
            <span>
              <Sparkles size={14} />
              Optional local AI
            </span>
          </div>
        </div>
        <div className="hero-visual" aria-label="Example of a vehicle framing reference">
          <div className="example-label">
            <span className="status-dot ready" />
            GUIDED COMPOSITION<span>01 / 20</span>
          </div>
          <div className="composition-preview">
            <span className="frame-corner tl" />
            <span className="frame-corner tr" />
            <span className="frame-corner bl" />
            <span className="frame-corner br" />
            <svg viewBox="0 300 465 270" role="img" aria-label="Sedan body-style reference example">
              <image
                href={`${import.meta.env.BASE_URL}references/sedan.png`}
                width="1254"
                height="1254"
              />
            </svg>
            <div className="preview-ground" />
          </div>
          <div className="example-footer">
            <span>Front three-quarter</span>
            <span>Reference example · 4:3</span>
          </div>
        </div>
      </section>
      {recent && (
        <button className="resume-card" onClick={() => onResumeSession(recent)}>
          <span className="resume-icon">
            <Camera size={23} />
          </span>
          <span>
            <small>PICK UP WHERE YOU LEFT OFF</small>
            <strong>{title(map.get(recent.vehicleId))}</strong>
            <span>{recent.shots.length} photos saved · Continue your checklist</span>
          </span>
          <ArrowRight size={23} />
        </button>
      )}
      <div className="studio-metrics" aria-label="Studio activity">
        {[
          { label: 'Real photos captured', value: total, icon: Camera },
          { label: 'Sessions to finish', value: unfinished.length, icon: Images },
          { label: 'Completed galleries', value: completed.length, icon: Check },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label}>
            <Icon size={19} />
            <strong>{value}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>
      <section className="session-section">
        <header className="section-heading">
          <div>
            <span className="eyebrow">YOUR WORK</span>
            <h2>
              Vehicle Photo Sessions<span className="count-badge">{sessions.length}</span>
            </h2>
          </div>
          <button
            className="secondary"
            disabled={!sessions.some((s) => s.shots.length)}
            onClick={() => setCompare(!compare)}
          >
            <SlidersHorizontal size={17} />
            {compare ? 'Close comparison' : 'Compare same shot'}
          </button>
        </header>
        {sessions.length > 0 && (
          <div className="search-row">
            <label className="search-field">
              <Search size={18} />
              <input
                aria-label="Search sessions"
                placeholder="Search VIN, stock, make or model"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            <select
              aria-label="Session status filter"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All sessions</option>
              <option value="in_progress">In progress</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        )}
        {!visible.length &&
          (sessions.length ? (
            <div className="studio-empty">
              <Search size={30} />
              <h3>No sessions match your search.</h3>
              <p>Try a different VIN, stock number, or filter.</p>
              <button
                className="secondary"
                onClick={() => {
                  setQuery('');
                  setFilter('all');
                }}
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="studio-empty first-session-empty">
              <div className="empty-icon">
                <Images size={28} />
              </div>
              <h3>Your next great listing starts here.</h3>
              <p>
                Start with a VIN or enter vehicle details.
                <br />
                We’ll guide you through every photo.
              </p>
              <div className="workflow-steps">
                <span>
                  <ScanLine size={18} />
                  Identify vehicle
                </span>
                <ArrowRight size={14} />
                <span>
                  <Camera size={18} />
                  Follow the guide
                </span>
                <ArrowRight size={14} />
                <span>
                  <Images size={18} />
                  Export your gallery
                </span>
              </div>
            </div>
          ))}
        <div className="session-list">
          {visible.map((s) => {
            const v = map.get(s.vehicleId),
              hero = s.shots.find((p) => p.isHero) || s.shots[0],
              expected = s.templateSnapshot?.shots.length;
            return (
              <article className="studio-session" key={s.id}>
                <button className="session-row" onClick={() => onOpenSession(s)}>
                  <div className="session-thumbnail">
                    {hero ? (
                      <img src={hero.thumbnailUrl || hero.imageDataUrl} alt="" loading="lazy" />
                    ) : (
                      <Camera size={26} />
                    )}
                  </div>
                  <div className="session-description">
                    <h3>{title(v)}</h3>
                    <p>
                      {v?.stockNumber || 'No stock number'} · {v?.vin || 'VIN not entered'}
                    </p>
                    <div className="session-meta">
                      <span className={s.status === 'completed' ? 'tag complete' : 'tag'}>
                        {s.status === 'completed'
                          ? 'Complete'
                          : s.status === 'paused'
                            ? 'Paused'
                            : 'In progress'}
                      </span>
                      <span>
                        {s.shots.length}
                        {expected ? ` / ${expected}` : ''} photos
                      </span>
                      {s.shots.some((p) => p.source === 'sample') && (
                        <span className="sample-tag">SAMPLE</span>
                      )}
                    </div>
                  </div>
                  <ArrowUpRight size={19} />
                </button>
                {onDeleteSession && (
                  <button
                    className="icon-button delete-session"
                    aria-label={`Delete ${title(v)} session`}
                    onClick={() => {
                      setDeleting(s);
                      setError('');
                    }}
                  >
                    <Trash2 size={17} />
                  </button>
                )}
              </article>
            );
          })}
        </div>
      </section>
      {compare && (
        <section className="panel">
          <header>
            <h2>Batch composition review</h2>
          </header>
          <label>
            Compare shot
            <select
              aria-label="Compare shot"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            >
              {MASTER_24_SHOT_SEQUENCE.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <p>
            Compare the same angle across up to five vehicles. Measurements appear only where
            detection was available.
          </p>
          <div className="batch-grid">
            {comparison.map((s) => {
              const p = s.shots.find((p) => p.shotCode === code);
              if (!p) return null;
              return (
                <figure key={s.id}>
                  <img src={p.imageDataUrl} alt={p.shotName} />
                  <figcaption>
                    {title(map.get(s.vehicleId))}
                    <br />
                    Tilt {p.quality.tiltDegrees ?? 'unavailable'}
                    {p.metadata?.alignment && (
                      <>
                        <br />
                        Center deviation {p.metadata.alignment.centerDeviation.toFixed(3)} ·
                        Coverage deviation {p.metadata.alignment.coverageDeviation.toFixed(3)} ·
                        Confidence {p.metadata.alignment.confidence.toFixed(2)}
                      </>
                    )}
                  </figcaption>
                </figure>
              );
            })}
          </div>
          {!comparison.length && <p>No saved photos for this angle yet.</p>}
        </section>
      )}
      <footer className="studio-storage">
        <ShieldCheck size={19} />
        <div>
          <strong>Local by design.</strong>
          <span>
            {usage?.quota
              ? `${((usage.usage || 0) / 1048576).toFixed(1)} MB used on this device.`
              : 'Your photos are saved in this browser.'}{' '}
            Export galleries to keep a backup.
          </span>
          {usage?.quota && (usage.usage || 0) / usage.quota > 0.8 && (
            <p className="warning">Storage is over 80% full. Export galleries before continuing.</p>
          )}
        </div>
        <button className="text-button" onClick={onSettings}>
          Manage
          <ArrowUpRight size={16} />
        </button>
      </footer>
      {error && !deleting && (
        <p role="alert" className="warning">
          {error}
        </p>
      )}
      <Modal
        open={!!deleting}
        title="Delete local session?"
        onClose={() => setDeleting(null)}
        busy={busy}
      >
        <p className="dialog-copy">
          This permanently removes the session and its photos from this device. Export the gallery
          first if you need to keep it.
        </p>
        {error && <p role="alert">{error}</p>}
        <div className="dialog-actions">
          <button className="secondary" disabled={busy} onClick={() => setDeleting(null)}>
            Keep session
          </button>
          <button
            className="danger-button"
            disabled={busy}
            onClick={async () => {
              if (!deleting || !onDeleteSession) return;
              setBusy(true);
              try {
                await onDeleteSession(deleting);
                setDeleting(null);
              } catch {
                setError('Session could not be deleted. Please try again.');
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? 'Deleting…' : 'Delete permanently'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
