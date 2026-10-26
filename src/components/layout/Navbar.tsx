import React, { useState, useEffect } from 'react';
import { Camera, Wifi, WifiOff, CloudUpload, Sliders, Home, PlusCircle } from 'lucide-react';
import { Dealership, UserRole } from '@/types/dealership';
import { getPendingUploadCount } from '@/services/storage/indexedDb';
interface NavbarProps {
  currentDealership: Dealership;
  userRole: UserRole;
  currentView: 'landing' | 'dashboard' | 'new-session' | 'templates';
  onNavigate: (view: 'landing' | 'dashboard' | 'new-session' | 'templates') => void;
}
export const Navbar: React.FC<NavbarProps> = ({
  currentDealership,
  userRole,
  currentView,
  onNavigate,
}) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingUploads, setPendingUploads] = useState<number>(0);
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    const checkUploads = async () => {
      try {
        const count = await getPendingUploadCount();
        setPendingUploads(count);
      } catch {
        // IDB not yet initialized
      }
    };
    checkUploads();
    const interval = setInterval(checkUploads, 5000);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);
  return (
    <header className="sticky top-0 z-40 bg-charcoal-950/90 backdrop-blur-md border-b border-charcoal-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Brand & Dealership Selector */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-2 group text-left"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-cyan to-brand-blue flex items-center justify-center text-charcoal-950 shadow-glow-cyan">
              <Camera className="w-4 h-4 font-bold" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-wide text-white block">
                SMART CAPTURE
              </span>
              <span className="text-[10px] text-slate-400 font-mono block -mt-1">
                {currentDealership.name}
              </span>
            </div>
          </button>
        </div>
        {/* Navigation Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => onNavigate('dashboard')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              currentView === 'dashboard'
                ? 'bg-charcoal-800 text-white border border-charcoal-700'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Dashboard</span>
          </button>
          <button
            onClick={() => onNavigate('new-session')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              currentView === 'new-session'
                ? 'bg-brand-cyan text-charcoal-950 shadow-glow-cyan'
                : 'bg-brand-cyan/20 text-brand-cyan hover:bg-brand-cyan/30'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>New Session</span>
          </button>
          <button
            onClick={() => onNavigate('templates')}
            className={`p-2 rounded-xl text-xs font-semibold transition-all ${
              currentView === 'templates'
                ? 'bg-charcoal-800 text-white border border-charcoal-700'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Dealership Templates"
            aria-label="Dealership Templates"
          >
            <Sliders className="w-4 h-4" />
          </button>
          {/* Pending Upload Queue Counter */}
          {pendingUploads > 0 && (
            <div
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-brand-amber/20 border border-brand-amber/40 text-brand-amber text-[11px] font-mono"
              title="Photos queued locally for upload"
            >
              <CloudUpload className="w-3.5 h-3.5 animate-pulse" />
              <span>{pendingUploads} queued</span>
            </div>
          )}
          {/* Network Indicator */}
          <div
            className={`p-1.5 rounded-full ${
              isOnline ? 'text-hud-green' : 'text-hud-red bg-hud-red/20'
            }`}
            title={isOnline ? 'Online · Local photos only' : 'Offline • Local Storage Mode'}
          >
            {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
          </div>
          {/* User Role Badge */}
          <span className="hidden md:inline px-2 py-0.5 rounded-md bg-charcoal-800 border border-charcoal-700 text-[10px] font-mono text-slate-300 uppercase">
            {userRole}
          </span>
        </div>
      </div>
    </header>
  );
};
