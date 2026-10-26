import {
  Camera,
  Grid2X2,
  Plus,
  Settings2,
  SlidersHorizontal,
  WifiOff,
  Check,
  Download,
} from 'lucide-react';
import { Dealership } from '@/types/dealership';
import { useAppStatus } from '@/services/appLifecycle';
export type AppView = 'dashboard' | 'new-session' | 'camera' | 'gallery' | 'templates';
interface Props {
  currentDealership: Dealership;
  currentView: AppView;
  onNavigate: (view: 'dashboard' | 'new-session' | 'templates') => void;
  onSettings: () => void;
}
export function Navbar({ currentDealership, currentView, onNavigate, onSettings }: Props) {
  const status = useAppStatus();
  if (currentView === 'camera') return null;
  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <header className="studio-header">
        <div className="studio-header-inner">
          <button
            className="studio-brand"
            aria-label="Smart Capture home"
            onClick={() => onNavigate('dashboard')}
          >
            <span className="brand-mark">
              <Camera size={22} strokeWidth={1.7} />
            </span>
            <span>
              <strong>
                Smart Capture<span className="brand-period">.</span>
              </strong>
              <small>{currentDealership.name}</small>
            </span>
          </button>
          <nav className="desktop-navigation" aria-label="Main navigation">
            <button
              aria-current={
                currentView === 'dashboard' || currentView === 'gallery' ? 'page' : undefined
              }
              onClick={() => onNavigate('dashboard')}
            >
              Sessions
            </button>
            <button
              aria-label="Dealership Templates"
              aria-current={currentView === 'templates' ? 'page' : undefined}
              onClick={() => onNavigate('templates')}
            >
              Standards
            </button>
            <button className="secondary" onClick={() => onNavigate('new-session')}>
              <Plus size={18} />
              New Session
            </button>
          </nav>
          <div className="header-tools">
            <span
              className="connection-status"
              title={
                status.online
                  ? 'Photos are saved on this device'
                  : 'Offline: saved photos remain on this device'
              }
            >
              {status.online ? <Check size={14} /> : <WifiOff size={16} />}
              <span>{status.online ? 'On-device storage' : 'Offline'}</span>
            </span>
            <button
              className="icon-button settings-trigger"
              onClick={onSettings}
              aria-label="Studio settings"
              title="Install, AI and studio settings"
            >
              {status.updateAvailable ? <Download size={21} /> : <Settings2 size={21} />}
              {status.updateAvailable && <span className="notification-dot" />}
            </button>
          </div>
        </div>
      </header>
      <nav className="mobile-navigation" aria-label="Mobile navigation">
        <button
          aria-label="Dashboard"
          aria-current={
            currentView === 'dashboard' || currentView === 'gallery' ? 'page' : undefined
          }
          onClick={() => onNavigate('dashboard')}
        >
          <Grid2X2 size={21} />
          <span>Sessions</span>
        </button>
        <button
          className="mobile-capture"
          aria-label="New Session"
          aria-current={currentView === 'new-session' ? 'page' : undefined}
          onClick={() => onNavigate('new-session')}
        >
          <span>
            <Camera size={23} />
          </span>
          <span>Capture</span>
        </button>
        <button
          aria-label="Dealership Templates"
          aria-current={currentView === 'templates' ? 'page' : undefined}
          onClick={() => onNavigate('templates')}
        >
          <SlidersHorizontal size={21} />
          <span>Standards</span>
        </button>
      </nav>
    </>
  );
}
