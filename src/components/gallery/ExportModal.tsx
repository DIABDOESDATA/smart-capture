import React, { useState } from 'react';
import { Download, FileArchive, Share2, CheckCircle2, Loader2, X, Car } from 'lucide-react';
import { VehicleCaptureSession } from '@/types/capture';
import { Vehicle } from '@/types/vehicle';
import { generateSessionZip, triggerFileDownload } from '@/services/export/zipExporter';
import { DDriveAdapter, DDriveSyncResponse } from '@/services/integrations/ddriveAdapter';
import confetti from 'canvas-confetti';

interface ExportModalProps {
  session: VehicleCaptureSession;
  vehicle: Partial<Vehicle>;
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ session, vehicle, isOpen, onClose }) => {
  const [isGeneratingZip, setIsGeneratingZip] = useState(false);
  const [isSyncingDDrive, setIsSyncingDDrive] = useState(false);
  const [dDriveResult, setDDriveResult] = useState<DDriveSyncResponse | null>(null);

  if (!isOpen) return null;

  const handleDownloadZip = async () => {
    setIsGeneratingZip(true);
    try {
      const zipBlob = await generateSessionZip(session, vehicle);
      const filename = `${vehicle.vin || 'VEHICLE'}_${vehicle.stockNumber || 'GALLERY'}.zip`;
      triggerFileDownload(zipBlob, filename);

      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.7 },
      });
    } catch (err) {
      console.error('ZIP generation failed:', err);
    } finally {
      setIsGeneratingZip(false);
    }
  };

  const handleSyncToDDrive = async () => {
    setIsSyncingDDrive(true);
    try {
      const adapter = new DDriveAdapter();
      const res = await adapter.syncSession(session, vehicle);
      setDDriveResult(res);

      if (res.success) {
        confetti({
          particleCount: 80,
          spread: 80,
          origin: { y: 0.6 },
        });
      }
    } catch (err) {
      console.error('D-Drive sync failed:', err);
    } finally {
      setIsSyncingDDrive(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-charcoal-900 border border-charcoal-750 rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between p-5 border-b border-charcoal-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-brand-cyan/20 text-brand-cyan">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Export Vehicle Gallery</h3>
              <p className="text-xs text-slate-400">
                {session.shots.length} standardized photos ready for inventory syndication
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-charcoal-800 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Option 1: Standardized Ordered ZIP Download */}
          <div className="p-4 rounded-2xl bg-charcoal-950 border border-charcoal-800 hover:border-charcoal-700 transition-all">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <FileArchive className="w-6 h-6 text-brand-amber shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm text-white">
                    Standardized Dealership ZIP Package
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Downloads an ordered archive with standardized naming (
                    <code className="text-brand-cyan font-mono text-[11px]">
                      01_FRONT_3Q_DRIVER.jpg
                    </code>
                    ), full quality images, plus{' '}
                    <code className="text-slate-300">manifest.json</code> and{' '}
                    <code className="text-slate-300">manifest.csv</code> for dealer DMS ingestion.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={handleDownloadZip}
              disabled={isGeneratingZip || session.shots.length === 0}
              className="mt-4 w-full py-2.5 px-4 rounded-xl bg-charcoal-800 hover:bg-charcoal-700 text-slate-100 font-semibold text-xs flex items-center justify-center gap-2 border border-charcoal-700 active:scale-95 transition-all disabled:opacity-40"
            >
              {isGeneratingZip ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-brand-amber" />
                  Compressing & Packaging...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-brand-amber" />
                  Download ZIP Package
                </>
              )}
            </button>
          </div>

          {/* Option 2: D-Drive Auto Direct Photo Studio Sync */}
          <div className="p-4 rounded-2xl bg-charcoal-950 border border-brand-cyan/40 hover:border-brand-cyan transition-all">
            <div className="flex items-start gap-3">
              <Car className="w-6 h-6 text-brand-cyan shrink-0 mt-0.5" />
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-sm text-white">Sync to D-Drive Auto</h4>
                  <span className="px-2 py-0.5 rounded-full bg-brand-cyan/20 text-brand-cyan text-[10px] font-bold">
                    Partner Pilot
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Automatically syncs this gallery, sets the hero photo, and updates the inventory
                  media in D-Drive Auto Photo Studio.
                </p>
              </div>
            </div>

            {dDriveResult && (
              <div className="mt-3 p-3 rounded-xl bg-charcoal-850 border border-brand-cyan/30 text-xs">
                {dDriveResult.success ? (
                  <div className="text-hud-green flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      Successfully synced {dDriveResult.uploadedPhotoCount} photos to D-Drive Photo
                      Studio!
                    </span>
                  </div>
                ) : (
                  <span className="text-hud-red">{dDriveResult.error}</span>
                )}
              </div>
            )}

            <button
              onClick={handleSyncToDDrive}
              disabled={isSyncingDDrive || session.shots.length === 0}
              className="mt-4 w-full py-2.5 px-4 rounded-xl bg-brand-cyan hover:bg-cyan-400 text-charcoal-950 font-bold text-xs flex items-center justify-center gap-2 shadow-glow-cyan active:scale-95 transition-all disabled:opacity-40"
            >
              {isSyncingDDrive ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Connecting to D-Drive Photo Studio...
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  Sync to D-Drive Photo Studio
                </>
              )}
            </button>
          </div>
        </div>

        <div className="px-6 py-4 bg-charcoal-950 border-t border-charcoal-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-charcoal-800 hover:bg-charcoal-700 text-slate-300 font-medium text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
