import { useEffect, useState } from 'react';
import { Camera } from 'lucide-react';
import { VehicleCaptureSession } from '@/types/capture';
import { Vehicle } from '@/types/vehicle';
import { getSession, releaseSession } from '@/services/storage/indexedDb';
import { MASTER_24_SHOT_SEQUENCE } from '@/services/templates/defaultTemplates';
interface Props {
  sessions: VehicleCaptureSession[];
  vehicles: Vehicle[];
  onStartNewSession: () => void;
  onOpenSession: (s: VehicleCaptureSession) => void;
  onDeleteSession?: (s: VehicleCaptureSession) => Promise<void>;
}
export function Dashboard({
  sessions,
  vehicles,
  onStartNewSession,
  onOpenSession,
  onDeleteSession,
}: Props) {
  const [query, setQuery] = useState(''),
    [filter, setFilter] = useState('all'),
    [compare, setCompare] = useState(false),
    [code, setCode] = useState('FRONT_3Q_DRIVER'),
    [usage, setUsage] = useState<StorageEstimate | null>(null),
    [persisted, setPersisted] = useState<boolean | null>(null),
    [comparison, setComparison] = useState<VehicleCaptureSession[]>([]);
  useEffect(() => {
    void navigator.storage?.estimate?.().then(setUsage);
    void navigator.storage?.persisted?.().then(setPersisted);
  }, [sessions]);
  useEffect(() => {
    let live = true;
    const loaded: VehicleCaptureSession[] = [];
    if (compare)
      void (async () => {
        for (const s of sessions
          .filter((s) => s.shots.some((p) => p.shotCode === code))
          .slice(0, 5)) {
          const full = await getSession(s.id);
          if (full) loaded.push(full);
        }
        if (live) setComparison(loaded);
        else loaded.forEach(releaseSession);
      })();
    return () => {
      live = false;
      loaded.forEach(releaseSession);
    };
  }, [compare, sessions, code]);
  const map = new Map(vehicles.map((v) => [v.id, v]));
  const completed = sessions.filter((s) => s.status === 'completed');
  const durations = completed
    .filter((s) => s.completedAt)
    .map((s) => (new Date(s.completedAt!).getTime() - new Date(s.startedAt).getTime()) / 60000);
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
          .includes(query.toLowerCase())
      );
    })
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return (
    <main className="dashboard-content">
      <section className="dashboard-hero">
        <span className="eyebrow">SMART CAPTURE V2 · STANDALONE PILOT</span>
        <h1>Ready to photograph inventory?</h1>
        <p>
          A consistent angle. An honest photograph.
          <br />
          Guided capture, saved securely on this device.
        </p>
        <button className="primary" onClick={onStartNewSession}>
          <Camera size={20} />
          New Photo Session
        </button>
      </section>
      <div className="stats-grid">
        {[
          ['Real photos', total],
          ['Sessions', sessions.length],
          [
            'Completed',
            sessions.length ? `${Math.round((completed.length / sessions.length) * 100)}%` : '—',
          ],
          [
            'Session elapsed time',
            durations.length
              ? `${(durations.reduce((a, b) => a + b, 0) / durations.length).toFixed(1)} min`
              : '—',
          ],
        ].map(([k, v]) => (
          <div className="panel" key={k}>
            <span>{k}</span>
            <strong>{v}</strong>
          </div>
        ))}
      </div>
      <section className="storage-strip">
        <div>
          <strong>Device storage</strong>
          <p>
            {usage?.quota
              ? `${((usage.usage || 0) / 1048576).toFixed(1)} MB used / ${(usage.quota / 1073741824).toFixed(1)} GB available quota`
              : 'Browser storage estimate unavailable'}{' '}
            ·{' '}
            {persisted
              ? 'Persistent storage granted'
              : 'Browser may evict local data; export regularly.'}
          </p>
          {usage?.quota && (usage.usage || 0) / usage.quota > 0.8 && (
            <p className="warning">Storage is over 80% full. Export galleries before continuing.</p>
          )}
        </div>
        <button onClick={async () => setPersisted((await navigator.storage?.persist?.()) || false)}>
          Protect local storage
        </button>
      </section>
      <section className="panel">
        <header>
          <h2>Vehicle Photo Sessions</h2>
          <button onClick={() => setCompare(!compare)}>
            {compare ? 'Close comparison' : 'Compare same shot'}
          </button>
        </header>
        <div className="search-row">
          <input
            aria-label="Search sessions"
            placeholder="Search VIN, stock, make or model"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
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
        {!visible.length && (
          <p className="empty-state">
            No capture sessions yet. Start a new session to build a gallery.
          </p>
        )}
        <div className="session-list">
          {visible.map((s) => {
            const v = map.get(s.vehicleId),
              hero = s.shots.find((p) => p.isHero) || s.shots[0];
            return (
              <div key={s.id}>
                <button className="session-row" onClick={() => onOpenSession(s)}>
                  {hero ? (
                    <img src={hero.thumbnailUrl || hero.imageDataUrl} alt="Session thumbnail" />
                  ) : (
                    <Camera />
                  )}
                  <div>
                    <h3>
                      {[v?.year, v?.make, v?.model].filter(Boolean).join(' ') ||
                        'Vehicle — specifications unknown'}
                    </h3>
                    <p>
                      {v?.vin || 'VIN unknown'} · {v?.stockNumber || 'No stock number'}
                    </p>
                    <small>
                      {s.shots.length} photos ·{' '}
                      {s.shots.some((p) => p.source === 'sample') ? 'SAMPLE · ' : ''}
                      {s.status.replace('_', ' ')}
                    </small>
                  </div>
                  <span>→</span>
                </button>
                {onDeleteSession && (
                  <button
                    className="delete-session"
                    onClick={() => {
                      if (
                        confirm(
                          'Delete this local session and its photos? Export it first. This cannot be undone.'
                        )
                      )
                        void onDeleteSession(s);
                    }}
                  >
                    Delete local session
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>
      {compare && (
        <section className="panel">
          <h2>Batch composition review</h2>
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
            Compare scale, center and tilt visually. Framing measurements appear only when detection
            was available; no consistency percentage is inferred.
          </p>
          <div className="batch-grid">
            {comparison.map((s) => {
              const p = s.shots.find((p) => p.shotCode === code)!;
              return (
                <figure key={s.id}>
                  <img src={p.imageDataUrl} alt={p.shotName} />
                  <figcaption>
                    {map.get(s.vehicleId)?.stockNumber || s.vehicleId}
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
        </section>
      )}
    </main>
  );
}
