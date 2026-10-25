import React, { useState, useEffect, useRef } from 'react';
import { X, ScanLine, Check, AlertCircle } from 'lucide-react';
import { validateVin } from '@/services/vin/vinValidator';

interface VinScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVinScanned: (vin: string) => void;
}

export const VinScannerModal: React.FC<VinScannerModalProps> = ({
  isOpen,
  onClose,
  onVinScanned,
}) => {
  const [manualVin, setManualVin] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    let active = true;

    async function initCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
        });
        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      } catch (err) {
        console.warn('Barcode camera access unavailable:', err);
      }
    }

    initCamera();

    return () => {
      active = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateVin(manualVin);
    if (!validation.isValid && validation.errors.length > 0) {
      setErrorMessage(validation.errors[0]);
      return;
    }
    onVinScanned(validation.cleanVin);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-charcoal-900 border border-charcoal-750 rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between p-4 border-b border-charcoal-800">
          <div className="flex items-center gap-2">
            <ScanLine className="w-5 h-5 text-brand-cyan" />
            <h3 className="font-bold text-white text-base">VIN Barcode Scanner</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-charcoal-800 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Viewfinder Video Frame */}
        <div className="relative aspect-video bg-charcoal-950 flex items-center justify-center overflow-hidden">
          <video ref={videoRef} playsInline autoPlay muted className="w-full h-full object-cover" />

          {/* Barcode Targeting Reticle */}
          <div className="absolute inset-8 border-2 border-brand-cyan/80 rounded-xl pointer-events-none flex items-center justify-center">
            <div className="w-full h-0.5 bg-brand-cyan shadow-[0_0_8px_#06B6D4] animate-pulse" />
          </div>

          <div className="absolute bottom-3 text-center px-4">
            <span className="text-[11px] bg-black/70 backdrop-blur-sm text-slate-200 px-3 py-1 rounded-full border border-white/10">
              Align door jamb or windshield VIN barcode
            </span>
          </div>
        </div>

        {/* Manual correction fallback */}
        <div className="p-4 border-t border-charcoal-800">
          <form onSubmit={handleManualSubmit} className="space-y-3">
            <label className="block text-xs text-slate-300 font-medium">
              Or Type / Paste Scanned VIN:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="1HGCR2F83HA000000"
                maxLength={17}
                value={manualVin}
                onChange={(e) => {
                  setManualVin(e.target.value.toUpperCase());
                  setErrorMessage(null);
                }}
                className="flex-1 bg-charcoal-950 border border-charcoal-700 rounded-xl px-3 py-2 text-xs font-mono tracking-widest text-white uppercase focus:outline-none focus:border-brand-cyan"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-brand-cyan hover:bg-cyan-400 text-charcoal-950 font-bold text-xs rounded-xl active:scale-95 transition-all flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" />
                Done
              </button>
            </div>
            {errorMessage && (
              <p className="text-[11px] text-hud-red flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                {errorMessage}
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};
