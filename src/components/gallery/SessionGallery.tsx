import React, { useState } from 'react';
import {
  Camera,
  Star,
  RefreshCw,
  Download,
  CheckCircle2,
  AlertCircle,
  Trash2,
  ChevronLeft,
} from 'lucide-react';
import { VehicleCaptureSession, CapturedShot } from '@/types/capture';
import { CaptureTemplate } from '@/types/template';
import { Vehicle } from '@/types/vehicle';
import { ExportModal } from './ExportModal';

interface SessionGalleryProps {
  session: VehicleCaptureSession;
  template: CaptureTemplate;
  vehicle: Vehicle;
  onRetakeShot: (shotIndex: number) => void;
  onUpdateShots: (shots: CapturedShot[]) => void;
  onBackToDashboard: () => void;
}

export const SessionGallery: React.FC<SessionGalleryProps> = ({
  session,
  template,
  vehicle,
  onRetakeShot,
  onUpdateShots,
  onBackToDashboard,
}) => {
  const [selectedShot, setSelectedShot] = useState<CapturedShot | null>(null);
  const [isExportOpen, setIsExportOpen] = useState(false);

  // Map template shots with captured shots
  const capturedMap = new Map(session.shots.map((s) => [s.shotCode, s]));

  const completedCount = session.shots.length;
  const missingRequired = template.shots.filter((t) => t.isRequired && !capturedMap.has(t.code));

  const handleSetHero = (shotCode: string) => {
    const updated = session.shots.map((s) => ({
      ...s,
      isHero: s.shotCode === shotCode,
    }));
    onUpdateShots(updated);
  };

  const handleDeleteShot = (shotId: string) => {
    if (confirm('Are you sure you want to delete this captured photograph?')) {
      const updated = session.shots.filter((s) => s.shotId !== shotId);
      onUpdateShots(updated);
      setSelectedShot(null);
    }
  };

  return (
    <div className="min-h-screen bg-charcoal-950 text-slate-100 pb-16">
      {/* Top Header */}
      <div className="sticky top-0 z-40 bg-charcoal-950/90 backdrop-blur-md border-b border-charcoal-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToDashboard}
            className="p-2 rounded-xl bg-charcoal-900 border border-charcoal-750 text-slate-300 hover:text-white active:scale-95 transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white tracking-wide">
                {[vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(' ') ||
                  'Vehicle Gallery'}
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-brand-cyan/20 text-brand-cyan text-[10px] font-mono font-bold">
                {vehicle.stockNumber || 'STK'}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              VIN: {vehicle.vin || 'Not specified'} • {template.name}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExportOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-brand-cyan hover:bg-cyan-400 text-charcoal-950 font-bold text-xs flex items-center gap-1.5 shadow-glow-cyan active:scale-95 transition-all"
          >
            <Download className="w-4 h-4" />
            Export & Sync
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pt-6 space-y-6">
        {/* Progress & Quality Status Card */}
        <div className="bg-charcoal-900 border border-charcoal-800 rounded-3xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white">Capture Progress</span>
              <span className="px-2 py-0.5 rounded-full bg-charcoal-800 text-slate-300 text-xs font-mono">
                {completedCount} / {template.shots.length} Completed
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {missingRequired.length === 0 ? (
                <span className="text-hud-green flex items-center gap-1 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" /> All required template angles completed!
                </span>
              ) : (
                <span className="text-brand-amber flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {missingRequired.length} required shots
                  remaining
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              onClick={() => onRetakeShot(0)}
              className="flex-1 md:flex-initial px-4 py-2.5 rounded-xl bg-charcoal-800 hover:bg-charcoal-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 border border-charcoal-700 active:scale-95 transition-all"
            >
              <Camera className="w-4 h-4 text-brand-cyan" />
              Open Camera Studio
            </button>
          </div>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {template.shots.map((shotDef, index) => {
            const captured = capturedMap.get(shotDef.code);

            if (captured) {
              return (
                <div
                  key={shotDef.id}
                  onClick={() => setSelectedShot(captured)}
                  className="group relative aspect-[4/3] rounded-2xl overflow-hidden bg-charcoal-900 border border-charcoal-800 hover:border-brand-cyan/60 transition-all cursor-pointer shadow-lg"
                >
                  <img
                    src={captured.imageDataUrl}
                    alt={captured.shotName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />

                  {/* Gradient Vignette */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />

                  {/* Badges: Hero & Sequence */}
                  <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-sm text-[10px] font-mono text-slate-200 border border-white/10">
                      #{index + 1}
                    </span>
                    {captured.isHero && (
                      <span className="px-2 py-0.5 rounded-full bg-brand-amber text-charcoal-950 text-[10px] font-bold flex items-center gap-1 shadow-glow-amber">
                        <Star className="w-3 h-3 fill-current" />
                        HERO
                      </span>
                    )}
                  </div>

                  {/* Shot Name & Quality review */}
                  <div className="absolute bottom-2.5 inset-x-2.5">
                    <p className="text-xs font-semibold text-white truncate">{shotDef.name}</p>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-300">
                      <span className="font-mono">Sharp: {captured.quality.blurScore}</span>
                      {captured.quality.isBlurry && (
                        <span className="text-brand-amber font-bold">Blur</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            }

            // Missing / Placeholder slot
            return (
              <div
                key={shotDef.id}
                onClick={() => onRetakeShot(index)}
                className={`group relative aspect-[4/3] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-4 text-center cursor-pointer transition-all ${
                  shotDef.isRequired
                    ? 'border-charcoal-700 bg-charcoal-900/40 hover:border-brand-cyan/70 hover:bg-charcoal-900'
                    : 'border-charcoal-800 bg-charcoal-950/40 hover:border-charcoal-700'
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-charcoal-800 group-hover:bg-brand-cyan/20 group-hover:text-brand-cyan text-slate-400 flex items-center justify-center transition-colors">
                  <Camera className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono text-slate-500 mt-2">#{index + 1}</span>
                <p className="text-xs font-medium text-slate-300 mt-0.5 line-clamp-1">
                  {shotDef.name}
                </p>
                {shotDef.isRequired ? (
                  <span className="mt-1 text-[9px] uppercase font-bold text-brand-amber tracking-wider">
                    Required
                  </span>
                ) : (
                  <span className="mt-1 text-[9px] uppercase text-slate-500">Optional</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Shot Detail Inspection & Hero Selector Modal */}
      {selectedShot && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-charcoal-900 border border-charcoal-750 rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="relative aspect-[4/3] bg-black">
              <img
                src={selectedShot.imageDataUrl}
                alt={selectedShot.shotName}
                className="w-full h-full object-contain"
              />
              <button
                onClick={() => setSelectedShot(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/60 text-white hover:bg-black/90"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">{selectedShot.shotName}</h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    Code: {selectedShot.shotCode} • Captured{' '}
                    {new Date(selectedShot.capturedAt).toLocaleTimeString()}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSetHero(selectedShot.shotCode)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
                      selectedShot.isHero
                        ? 'bg-brand-amber text-charcoal-950 border-brand-amber'
                        : 'bg-charcoal-800 text-slate-300 border-charcoal-700 hover:border-brand-amber'
                    }`}
                  >
                    <Star className="w-3.5 h-3.5 fill-current" />
                    {selectedShot.isHero ? 'Hero Photo' : 'Set as Hero'}
                  </button>

                  <button
                    onClick={() => handleDeleteShot(selectedShot.shotId)}
                    className="p-2 rounded-xl bg-charcoal-800 text-hud-red hover:bg-hud-red/20 border border-charcoal-750"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Quality Diagnostics Bar */}
              <div className="mt-4 p-3 rounded-2xl bg-charcoal-950 border border-charcoal-800 grid grid-cols-3 gap-2 text-center text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block">Sharpness Score</span>
                  <span className="font-mono font-bold text-slate-200">
                    {selectedShot.quality.blurScore}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Exposure</span>
                  <span className="font-mono font-bold text-slate-200 capitalize">
                    {selectedShot.quality.exposure}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Horizon Tilt</span>
                  <span className="font-mono font-bold text-slate-200">
                    {selectedShot.quality.tiltDegrees}°
                  </span>
                </div>
              </div>

              {/* Retake Button */}
              <div className="mt-5 flex gap-2">
                <button
                  onClick={() => {
                    const idx = template.shots.findIndex((s) => s.code === selectedShot.shotCode);
                    setSelectedShot(null);
                    onRetakeShot(idx >= 0 ? idx : 0);
                  }}
                  className="flex-1 py-3 rounded-xl bg-charcoal-800 hover:bg-charcoal-700 text-slate-100 font-semibold text-xs flex items-center justify-center gap-2 border border-charcoal-700 active:scale-95 transition-all"
                >
                  <RefreshCw className="w-4 h-4 text-brand-amber" />
                  Retake This Photo
                </button>
                <button
                  onClick={() => setSelectedShot(null)}
                  className="px-6 py-3 rounded-xl bg-brand-cyan hover:bg-cyan-400 text-charcoal-950 font-bold text-xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      <ExportModal
        session={session}
        vehicle={vehicle}
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
      />
    </div>
  );
};
