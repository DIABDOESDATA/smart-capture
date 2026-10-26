import { useSyncExternalStore } from 'react';

interface InstallEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}
interface AppStatus {
  online: boolean;
  installed: boolean;
  installAvailable: boolean;
  offlineReady: boolean;
  updateAvailable: boolean;
  message: string;
}
let state: AppStatus = {
  online: navigator.onLine,
  installed:
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true,
  installAvailable: false,
  offlineReady: false,
  updateAvailable: false,
  message: '',
};
const listeners = new Set<() => void>();
let installEvent: InstallEvent | null = null;
let registration: ServiceWorkerRegistration | undefined;
let started = false;
let updating = false;
const patch = (value: Partial<AppStatus>) => {
  state = { ...state, ...value };
  listeners.forEach((fn) => fn());
};
export function useAppStatus() {
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    () => state
  );
}
export function initializeAppLifecycle() {
  if (started) return;
  started = true;
  window.addEventListener('online', () => patch({ online: true }));
  window.addEventListener('offline', () => patch({ online: false }));
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    installEvent = event as InstallEvent;
    patch({ installAvailable: true });
  });
  window.addEventListener('appinstalled', () => {
    installEvent = null;
    patch({ installed: true, installAvailable: false });
  });
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data?.type === 'UPDATE_BLOCKED') {
      updating = false;
      patch({ message: 'Close other Smart Capture tabs or windows, then try the update again.' });
    }
  });
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    patch({ offlineReady: true });
    if (updating) location.reload();
  });
  const register = async () => {
    try {
      registration = await navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, {
        updateViaCache: 'none',
      });
      patch({ offlineReady: !!registration.active, updateAvailable: !!registration.waiting });
      registration.addEventListener('updatefound', () => {
        const worker = registration?.installing;
        worker?.addEventListener('statechange', () => {
          if (worker.state === 'installed')
            patch({
              updateAvailable: !!navigator.serviceWorker.controller,
              offlineReady: !navigator.serviceWorker.controller || state.offlineReady,
            });
        });
      });
      void navigator.serviceWorker.ready.then(() => patch({ offlineReady: true }));
    } catch {
      patch({
        message:
          'Offline setup could not finish. Reconnect and reload before taking the app offline.',
      });
    }
  };
  if (document.readyState === 'complete') void register();
  else window.addEventListener('load', () => void register(), { once: true });
}
export async function installApp() {
  if (!installEvent) return false;
  const event = installEvent;
  installEvent = null;
  patch({ installAvailable: false });
  await event.prompt();
  const choice = await event.userChoice;
  patch({
    message:
      choice.outcome === 'accepted'
        ? 'Installation requested. Follow your browser’s confirmation.'
        : 'You can install later from your browser menu.',
  });
  return choice.outcome === 'accepted';
}
export function applyAppUpdate() {
  if (!registration?.waiting) return;
  updating = true;
  patch({ message: 'Preparing update…' });
  registration.waiting.postMessage({ type: 'SKIP_WAITING' });
}
export async function checkForUpdate() {
  if (!registration) {
    patch({ message: 'App updates are available in the installed production build.' });
    return;
  }
  try {
    await registration.update();
    patch({
      updateAvailable: !!registration.waiting,
      message: registration.waiting
        ? 'An update is ready.'
        : 'Update check completed. Any new version will appear here when downloaded.',
    });
  } catch {
    patch({ message: 'Could not check for an update. Reconnect and try again.' });
  }
}
