import React from 'react';
import { Camera, Car, ChevronRight, TrendingUp, Plus } from 'lucide-react';
import { VehicleCaptureSession } from '@/types/capture';
import { Vehicle } from '@/types/vehicle';

interface DashboardProps {
  sessions: VehicleCaptureSession[];
  vehicles: Vehicle[];
  onStartNewSession: () => void;
  onOpenSession: (session: VehicleCaptureSession) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  sessions,
  vehicles,
  onStartNewSession,
  onOpenSession,
}) => {
  const vehicleMap = new Map(vehicles.map((v) => [v.id, v]));

  const totalPhotos = sessions.reduce((acc, s) => acc + s.shots.length, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* 1. HERO CALLOUT */}
      <div className="bg-gradient-to-r from-charcoal-900 to-charcoal-850 border border-charcoal-800 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-2xl">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-cyan/20 border border-brand-cyan/40 text-brand-cyan text-xs font-semibold">
            <Camera className="w-3.5 h-3.5" /> Lot Photography Hub
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Ready to photograph inventory?
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Scan a VIN, align the vehicle through our transparent body silhouettes, and create a
            standardized, ready-to-syndicate showroom gallery.
          </p>
        </div>

        <button
          onClick={onStartNewSession}
          className="w-full sm:w-auto py-3.5 px-6 rounded-2xl bg-brand-cyan hover:bg-cyan-400 text-charcoal-950 font-bold text-sm tracking-wide shadow-glow-cyan active:scale-95 transition-all flex items-center justify-center gap-2 shrink-0"
        >
          <Camera className="w-4 h-4" />
          New Photo Session
        </button>
      </div>

      {/* 2. STATS ROW */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-charcoal-900 border border-charcoal-800">
          <span className="text-xs font-medium text-slate-400 block">Total Vehicles</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white">{sessions.length}</span>
            <span className="text-[10px] text-hud-green flex items-center font-semibold">
              <TrendingUp className="w-3 h-3 mr-0.5" /> +100%
            </span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-charcoal-900 border border-charcoal-800">
          <span className="text-xs font-medium text-slate-400 block">Photos Captured</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-brand-cyan">{totalPhotos}</span>
            <span className="text-[10px] text-slate-400">HQ Originals</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-charcoal-900 border border-charcoal-800">
          <span className="text-xs font-medium text-slate-400 block">Required Consistency</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-brand-amber">98.4%</span>
            <span className="text-[10px] text-slate-400">Template Match</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-charcoal-900 border border-charcoal-800">
          <span className="text-xs font-medium text-slate-400 block">Average Capture Time</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white">4.2 min</span>
            <span className="text-[10px] text-hud-green font-semibold">Fast Turn</span>
          </div>
        </div>
      </div>

      {/* 3. RECENT VEHICLE SESSIONS */}
      <div className="bg-charcoal-900 border border-charcoal-800 rounded-3xl p-6 shadow-xl">
        <div className="flex items-center justify-between pb-4 border-b border-charcoal-800">
          <div>
            <h2 className="text-base font-bold text-white tracking-wide">Vehicle Photo Sessions</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Review completed vehicle galleries, retake missing shots, and export packages.
            </p>
          </div>
          <button
            onClick={onStartNewSession}
            className="p-2 rounded-xl bg-charcoal-800 text-brand-cyan hover:bg-charcoal-700 text-xs font-semibold flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Vehicle</span>
          </button>
        </div>

        {sessions.length === 0 ? (
          <div className="py-12 text-center text-slate-500 space-y-3">
            <Car className="w-12 h-12 mx-auto stroke-[1.5] text-slate-600" />
            <p className="text-sm font-medium">No capture sessions yet</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Start your first session to photograph vehicle inventory with guided silhouette
              overlays.
            </p>
            <button
              onClick={onStartNewSession}
              className="mt-2 px-4 py-2 rounded-xl bg-brand-cyan text-charcoal-950 font-bold text-xs shadow-glow-cyan"
            >
              Start First Capture
            </button>
          </div>
        ) : (
          <div className="divide-y divide-charcoal-800 mt-2">
            {sessions.map((sess) => {
              const veh = vehicleMap.get(sess.vehicleId);
              const heroShot = sess.shots.find((s) => s.isHero) || sess.shots[0];

              return (
                <div
                  key={sess.id}
                  onClick={() => onOpenSession(sess)}
                  className="py-4 flex items-center justify-between gap-4 hover:bg-charcoal-850/50 px-2 rounded-2xl cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Thumbnail preview */}
                    <div className="w-16 h-12 rounded-xl bg-charcoal-950 border border-charcoal-750 overflow-hidden shrink-0 flex items-center justify-center">
                      {heroShot ? (
                        <img
                          src={heroShot.imageDataUrl}
                          alt="Hero"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Car className="w-6 h-6 text-slate-600" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-white truncate">
                          {[veh?.year, veh?.make, veh?.model].filter(Boolean).join(' ') ||
                            'Vehicle Inventory'}
                        </h3>
                        <span className="px-1.5 py-0.5 rounded bg-charcoal-800 text-slate-300 text-[10px] font-mono">
                          {veh?.stockNumber || 'STK'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 font-mono mt-0.5 truncate">
                        VIN: {veh?.vin || 'N/A'} • {sess.shots.length} Photos Captured
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`hidden sm:inline px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        sess.status === 'completed'
                          ? 'bg-hud-green/20 text-hud-green'
                          : 'bg-brand-amber/20 text-brand-amber'
                      }`}
                    >
                      {sess.status === 'completed' ? 'Completed' : 'In Progress'}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
