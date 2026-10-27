import { lazy, Suspense, useEffect, useState, useRef } from 'react';
import { Navbar, AppView } from './components/layout/Navbar';
import { Dashboard } from './components/dashboard/Dashboard';
import { VinLookupForm } from './components/vehicle/VinLookupForm';
import { StudioSettings } from './components/settings/StudioSettings';
import {
  DEFAULT_WORKSPACE,
  loadWorkspace,
  saveWorkspace,
  WORKSPACE_ID,
  WorkspacePreferences,
} from './services/workspace';
const VinScannerModal = lazy(() =>
  import('./components/vehicle/VinScannerModal').then((m) => ({ default: m.VinScannerModal }))
);
const SmartCameraView = lazy(() =>
  import('./components/camera/SmartCameraView').then((m) => ({ default: m.SmartCameraView }))
);
const SessionGallery = lazy(() =>
  import('./components/gallery/SessionGallery').then((m) => ({ default: m.SessionGallery }))
);
const TemplateManager = lazy(() =>
  import('./components/templates/TemplateManager').then((m) => ({ default: m.TemplateManager }))
);
import { Dealership } from './types/dealership';
import { Vehicle } from './types/vehicle';
import { VehicleCaptureSession, CapturedShot, PhotographyStandard } from './types/capture';
import { CaptureTemplate } from './types/template';
import { getDefaultTemplates } from './services/templates/defaultTemplates';
import { loadTemplates, adaptTemplate, standaloneTemplate } from './services/templates/repository';
import {
  saveSession,
  getSession,
  getAllSessions,
  saveVehicle,
  getAllVehicles,
  releaseSession,
  getSetting,
  storageError,
  deleteSession,
} from './services/storage/indexedDb';
import { missingRequired, nextMissing, replaceShot } from './services/capture/sequence';
import { DEFAULT_STANDARD } from './services/standards';
const DEALER: Dealership = {
  id: WORKSPACE_ID,
  name: 'My photo studio',
  slug: 'smart-capture',
  planId: 'pro',
  maxActiveTemplates: 5,
  monthlyVehicleQuota: 250,
  storageQuotaGb: 25,
  storageUsedMb: 0,
  createdAt: new Date().toISOString(),
};
export function App() {
  const [view, setView] = useState<AppView>('dashboard'),
    [settingsOpen, setSettingsOpen] = useState(false),
    [preferences, setPreferences] = useState<WorkspacePreferences>(DEFAULT_WORKSPACE),
    [scanner, setScanner] = useState(false),
    [scannedVin, setScannedVin] = useState(''),
    [vehicles, setVehicles] = useState<Vehicle[]>([]),
    [sessions, setSessions] = useState<VehicleCaptureSession[]>([]),
    [active, setActive] = useState<VehicleCaptureSession | null>(null),
    [vehicle, setVehicle] = useState<Vehicle | null>(null),
    [template, setTemplate] = useState<CaptureTemplate>(getDefaultTemplates(DEALER.id)[0]),
    [templates, setTemplates] = useState(getDefaultTemplates(DEALER.id)),
    [initial, setInitial] = useState(0),
    [error, setError] = useState(''),
    [standard, setStandard] = useState<PhotographyStandard>(DEFAULT_STANDARD),
    [ready, setReady] = useState(false);
  const activeRef = useRef(active);
  activeRef.current = active;
  const refresh = async () => {
    const [s, v, t, std, prefs] = await Promise.all([
      getAllSessions(DEALER.id),
      getAllVehicles(DEALER.id),
      loadTemplates(DEALER.id),
      getSetting<PhotographyStandard>(`standard:${DEALER.id}`),
      loadWorkspace(),
    ]);
    setSessions(s);
    setVehicles(v);
    setTemplates(t);
    setPreferences(prefs);
    if (std) setStandard(std);
  };
  useEffect(() => {
    void refresh()
      .then(() => setReady(true))
      .catch((e) => setError(storageError(e)));
  }, []);
  useEffect(() => () => sessions.forEach(releaseSession), [sessions]);
  useEffect(
    () => () => {
      if (active) releaseSession(active);
    },
    [active]
  );
  const save = async (s: VehicleCaptureSession) => {
    await saveSession(s);
    const hydrated = await getSession(s.id);
    if (!hydrated) throw new Error('Saved session could not be read.');
    setActive(hydrated);
    activeRef.current = hydrated;
    await refresh();
  };
  const selected = async (v: Vehicle) => {
    const t = adaptTemplate(
      templates.find((t) => t.id === v.templateId) || templates[0],
      v.bodyStyle,
      v.features
    );
    t.aspectRatio = t.aspectRatioOverride ? t.aspectRatio : standard.aspectRatio;
    const now = new Date().toISOString();
    const s: VehicleCaptureSession = {
      id: crypto.randomUUID(),
      dealershipId: DEALER.id,
      vehicleId: v.id,
      templateId: t.id,
      templateSnapshot: structuredClone(t),
      standardSnapshot: structuredClone({ ...standard, aspectRatio: t.aspectRatio }),
      schemaVersion: 2,
      employeeId: 'local-operator',
      employeeName: 'Local operator',
      status: 'in_progress',
      startedAt: now,
      shots: [],
      syncPendingCount: 0,
      createdAt: now,
      updatedAt: now,
    };
    await saveVehicle(v);
    await save(s);
    setVehicle(v);
    setTemplate(t);
    setInitial(0);
    setView('camera');
  };
  const openSession = async (s: VehicleCaptureSession, resume = false) => {
    try {
      const v = vehicles.find((v) => v.id === s.vehicleId);
      if (!v) throw new Error('Vehicle record is missing.');
      const full = await getSession(s.id);
      if (!full) throw new Error('Session not found.');
      let t = full.templateSnapshot;
      if (!t) {
        t = adaptTemplate(
          templates.find((t) => t.id === s.templateId) || templates[0],
          v.bodyStyle
        );
        full.templateSnapshot = structuredClone(t);
        await saveSession(full);
      }
      setActive(full);
      setVehicle(v);
      setTemplate(standaloneTemplate(t));
      setInitial(nextMissing(t, full.shots));
      setView(resume ? 'camera' : 'gallery');
    } catch (e) {
      setError(storageError(e));
    }
  };
  const updateShots = async (shots: CapturedShot[]) => {
    const current = activeRef.current;
    if (!current) return;
    const incomplete = missingRequired(template, shots).length > 0;
    await save({
      ...current,
      shots,
      status: incomplete ? 'paused' : current.status,
      completedAt: incomplete ? undefined : current.completedAt,
      updatedAt: new Date().toISOString(),
    });
  };
  const pause = async () => {
    if (activeRef.current)
      await save({ ...activeRef.current, status: 'paused', updatedAt: new Date().toISOString() });
    setView('gallery');
  };
  return (
    <div
      className={`studio-app min-h-screen bg-charcoal-950 text-slate-100 ${view === 'camera' ? 'capture-active' : ''}`}
    >
      <Navbar
        currentDealership={{ ...DEALER, name: preferences.name }}
        currentView={view}
        onSettings={() => setSettingsOpen(true)}
        onNavigate={(v) => {
          setView(v);
          window.scrollTo({ top: 0 });
          if (v === 'new-session') {
            setScannedVin('');
            void loadTemplates(DEALER.id)
              .then(setTemplates)
              .catch((e) => setError(storageError(e)));
          }
          if (v === 'dashboard') void refresh().catch((e) => setError(storageError(e)));
        }}
      />
      {error && (
        <div className="app-error" role="alert">
          {error}
          <button onClick={() => setError('')}>Dismiss</button>
        </div>
      )}
      {!ready ? (
        <section className="recovery-screen" aria-live="polite">
          <span className="brand-mark">SC</span>
          <h1>{error ? 'Your studio couldn’t open.' : 'Opening your photo studio…'}</h1>
          <p>
            {error
              ? 'Check that this browser allows local storage, then try again. Your saved data has not been cleared.'
              : 'Loading saved sessions from this device.'}
          </p>
          {error && (
            <button
              className="primary"
              onClick={() => {
                setError('');
                void refresh()
                  .then(() => setReady(true))
                  .catch((e) => setError(storageError(e)));
              }}
            >
              Try again
            </button>
          )}
        </section>
      ) : (
        <main id="main-content" tabIndex={-1}>
          <Suspense
            fallback={
              <div className="screen-loading" role="status">
                Opening studio tools…
              </div>
            }
          >
            {view === 'dashboard' && (
              <Dashboard
                sessions={sessions}
                vehicles={vehicles}
                onStartNewSession={() => setView('new-session')}
                onOpenSession={(s) => void openSession(s)}
                onResumeSession={(s) => void openSession(s, true)}
                onSettings={() => setSettingsOpen(true)}
                onDeleteSession={async (s) => {
                  try {
                    await deleteSession(s.id);
                    if (activeRef.current?.id === s.id) setActive(null);
                    await refresh();
                  } catch (e) {
                    setError(storageError(e));
                    throw e;
                  }
                }}
              />
            )}
            {view === 'new-session' && (
              <div className="new-session-page">
                <div className="new-session-intro">
                  <span className="eyebrow">NEW PHOTO SESSION</span>
                  <h1>Meet your next vehicle.</h1>
                  <p>Scan a VIN or enter details yourself. Choose a guide, then start shooting.</p>
                </div>
                <VinLookupForm
                  dealershipId={DEALER.id}
                  scannedVin={scannedVin}
                  templates={templates}
                  onVehicleSelected={selected}
                  onOpenVinScanner={() => setScanner(true)}
                />
              </div>
            )}
            {view === 'camera' && active && vehicle && (
              <SmartCameraView
                key={`${active.id}:${initial}`}
                template={template}
                bodyStyle={vehicle.bodyStyle}
                dealershipId={DEALER.id}
                standard={active.standardSnapshot || standard}
                initialAiEnabled={preferences.aiGuidance}
                initialShotIndex={initial}
                existingShots={active.shots}
                onCaptureShot={async (shot) => {
                  const s = activeRef.current;
                  if (s) await save(replaceShot(s, shot));
                }}
                onFinishSession={async () => {
                  const s = activeRef.current;
                  if (!s) return;
                  const missing = missingRequired(template, s.shots);
                  await save({
                    ...s,
                    status: missing.length ? 'paused' : 'completed',
                    completedAt: missing.length ? undefined : new Date().toISOString(),
                  });
                  setView('gallery');
                }}
                onClose={pause}
              />
            )}
            {view === 'gallery' && active && vehicle && (
              <SessionGallery
                session={active}
                template={template}
                vehicle={vehicle}
                onRetakeShot={(i) => {
                  setInitial(i);
                  setView('camera');
                }}
                onUpdateShots={updateShots}
                onBackToDashboard={() => setView('dashboard')}
                onResume={() => {
                  setInitial(nextMissing(template, active.shots));
                  setView('camera');
                }}
              />
            )}
            {view === 'templates' && (
              <TemplateManager
                dealershipId={DEALER.id}
                onBack={() => {
                  setView('dashboard');
                  void refresh().catch((e) => setError(storageError(e)));
                }}
              />
            )}
          </Suspense>
        </main>
      )}
      {scanner && (
        <Suspense fallback={<p role="status">Opening VIN scanner…</p>}>
          <VinScannerModal
            isOpen={scanner}
            onClose={() => setScanner(false)}
            onVinScanned={(v) => setScannedVin(v)}
          />
        </Suspense>
      )}
      <StudioSettings
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        preferences={preferences}
        canUpdate={view === 'dashboard'}
        onSave={async (value) => {
          await saveWorkspace(value);
          setPreferences({ ...value, name: value.name.trim() });
        }}
      />
    </div>
  );
}
export default App;
