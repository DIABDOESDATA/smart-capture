import { useEffect, useRef, useState } from 'react';
import {
  Check,
  Download,
  Smartphone,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  WifiOff,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { applyAppUpdate, checkForUpdate, installApp, useAppStatus } from '@/services/appLifecycle';
import { downloadDetector, hasOfflineDetector, MODEL_BYTES } from '@/services/camera/offlineModel';
import { WorkspacePreferences } from '@/services/workspace';

export function StudioSettings({
  open,
  onClose,
  preferences,
  onSave,
  canUpdate,
}: {
  open: boolean;
  onClose: () => void;
  preferences: WorkspacePreferences;
  onSave: (value: WorkspacePreferences) => Promise<void>;
  canUpdate: boolean;
}) {
  const status = useAppStatus();
  const [name, setName] = useState(preferences.name),
    [saving, setSaving] = useState(false),
    [message, setMessage] = useState(''),
    [modelReady, setModelReady] = useState(false),
    [progress, setProgress] = useState<number | null>(null),
    [persistent, setPersistent] = useState(false);
  const abort = useRef<AbortController | null>(null);
  const apple =
    /iPhone|iPad|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  useEffect(() => {
    if (open) setName(preferences.name);
  }, [open, preferences.name]);
  useEffect(() => {
    if (!open) return;
    let live = true;
    setMessage('');
    void hasOfflineDetector()
      .then((value) => {
        if (live) setModelReady(value);
      })
      .catch(() => {});
    void navigator.storage
      ?.persisted?.()
      .then((value) => {
        if (live) setPersistent(value);
      })
      .catch(() => {});
    return () => {
      live = false;
      abort.current?.abort();
    };
  }, [open]);
  const close = () => {
    abort.current?.abort();
    onClose();
  };
  return (
    <Modal open={open} title="Studio settings" onClose={close} busy={saving}>
      <section className="settings-section install-section">
        <div className="section-icon">
          <Smartphone size={24} />
        </div>
        <span className="eyebrow">YOUR STUDIO. IN YOUR POCKET.</span>
        <h3>
          {status.installed ? 'You’re using the installed app.' : 'Make room on your home screen.'}
        </h3>
        <p>
          Open straight into your photo studio. Capture and export offline once setup is complete.
        </p>
        <div className="readiness-row">
          <span className={status.offlineReady ? 'status-dot ready' : 'status-dot'} />
          {status.offlineReady
            ? 'App ready for offline use'
            : import.meta.env.PROD
              ? 'Offline setup is preparing or unavailable'
              : 'Offline setup is available in the production build'}
        </div>
        {!status.installed && (
          <>
            {status.installAvailable ? (
              <button
                className="primary"
                onClick={() => {
                  void installApp().catch(() =>
                    setMessage('Installation could not open. Use your browser’s install menu.')
                  );
                }}
              >
                <Download size={18} />
                Install Smart Capture
              </button>
            ) : (
              <div className="install-steps">
                <strong>{apple ? 'Install on iPhone or iPad' : 'Install on your device'}</strong>
                <ol>
                  {apple ? (
                    <>
                      <li>
                        Open this site in Safari and tap Share (it may be inside the page menu).
                      </li>
                      <li>Choose Add to Home Screen.</li>
                      <li>Enable Open as Web App if shown, then tap Add.</li>
                    </>
                  ) : (
                    <>
                      <li>Open this site in Chrome on Android, or a supported desktop browser.</li>
                      <li>Choose Install app or Add to Home screen from the browser menu.</li>
                      <li>Confirm installation, then open Smart Capture from its icon.</li>
                    </>
                  )}
                </ol>
                <p className="muted">
                  On a phone, use the published HTTPS address. A computer’s localhost address does
                  not open on another device.
                </p>
              </div>
            )}
          </>
        )}
      </section>
      <section className="settings-section">
        <div className="section-title">
          <Sparkles size={20} />
          <h3>AI framing assistant</h3>
          <span className="tag">BETA</span>
        </div>
        <p>
          On-device vehicle detection gives center and framing suggestions. Photos stay on your
          device. It can miss vehicles and does not measure exact viewing angles.
        </p>
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={preferences.aiGuidance}
            disabled={saving}
            onChange={async (e) => {
              setSaving(true);
              setMessage('');
              try {
                await onSave({ ...preferences, aiGuidance: e.target.checked });
              } catch {
                setMessage('Preference could not be saved.');
              } finally {
                setSaving(false);
              }
            }}
          />
          Use AI guidance for exterior photos
        </label>
        <div className="download-card">
          <WifiOff size={22} />
          <div>
            <strong>
              {modelReady ? 'AI pack saved for offline use' : 'Take AI guidance offline'}
            </strong>
            <p>{(MODEL_BYTES / 1048576).toFixed(1)} MB · download once on this device</p>
          </div>
          {modelReady ? (
            <Check size={20} aria-label="AI pack ready" />
          ) : (
            <button
              className="secondary"
              disabled={progress !== null}
              onClick={async () => {
                const controller = new AbortController();
                abort.current = controller;
                setProgress(0);
                setMessage('');
                try {
                  await downloadDetector(setProgress, controller.signal);
                  setModelReady(true);
                  setMessage('AI pack verified and saved.');
                } catch (e) {
                  setMessage(
                    controller.signal.aborted
                      ? 'Download paused. Download again to resume.'
                      : e instanceof Error
                        ? e.message
                        : 'Download failed.'
                  );
                } finally {
                  setProgress(null);
                }
              }}
            >
              <Download size={17} />
              {progress === null ? 'Download AI pack' : 'Downloading…'}
            </button>
          )}
        </div>
        {progress !== null && (
          <div className="download-progress">
            <progress aria-label="AI download progress" max={1} value={progress} />
            <span>{Math.round(progress * 100)}%</span>
            <button onClick={() => abort.current?.abort()}>Pause</button>
          </div>
        )}
      </section>
      <section className="settings-section">
        <div className="section-title">
          <ShieldCheck size={20} />
          <h3>Your workspace</h3>
        </div>
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            setSaving(true);
            setMessage('');
            try {
              await onSave({ ...preferences, name });
              setMessage('Studio name saved.');
            } catch (e) {
              setMessage(e instanceof Error ? e.message : 'Unable to save.');
            } finally {
              setSaving(false);
            }
          }}
        >
          <label>
            Studio name
            <input
              aria-label="Studio name"
              value={name}
              maxLength={60}
              required
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <button
            className="secondary"
            disabled={saving || name.trim() === preferences.name}
            type="submit"
          >
            {saving ? 'Saving…' : 'Save studio name'}
          </button>
        </form>
        <p>
          Photos and sessions are stored in this browser on this device. Export completed galleries
          regularly. Clearing site data or uninstalling can remove them.
        </p>
        <button
          className="secondary"
          disabled={persistent || !navigator.storage?.persist}
          onClick={async () => {
            try {
              const granted = await navigator.storage.persist();
              setPersistent(granted);
              setMessage(
                granted
                  ? 'Persistent storage granted. Keep exporting galleries as a backup.'
                  : 'Your browser did not grant persistent storage. Regular exports are your backup.'
              );
            } catch {
              setMessage('Storage protection is unavailable in this browser.');
            }
          }}
        >
          {persistent ? 'Storage protection granted' : 'Request storage protection'}
        </button>
      </section>
      <section className="settings-section">
        <div className="section-title">
          <RefreshCw size={20} />
          <h3>App updates</h3>
        </div>
        <p>
          {status.updateAvailable
            ? 'A new version is ready. Your saved sessions will remain on this device.'
            : 'Updates are applied between sessions so capture is not interrupted.'}
        </p>
        {status.updateAvailable ? (
          <button className="primary" disabled={!canUpdate} onClick={applyAppUpdate}>
            Update and reopen
          </button>
        ) : (
          <button className="secondary" onClick={() => void checkForUpdate()}>
            Check for updates
          </button>
        )}
        {status.updateAvailable && !canUpdate && (
          <p>Return to the Sessions screen before applying this update.</p>
        )}
        {status.message && <p role="status">{status.message}</p>}
      </section>
      <details className="privacy-details">
        <summary>Privacy &amp; data</summary>
        <p>
          Camera access is used only for photography and VIN scanning. AI analyzes frames locally.
          VIN lookup sends the entered VIN to the U.S. NHTSA service when you choose Decode. No
          cloud photo upload, user analytics, or account synchronization is enabled. Gallery exports
          are saved or shared only when you request them.
        </p>
      </details>
      {message && (
        <p className="settings-message" role="status">
          {message}
        </p>
      )}
    </Modal>
  );
}
