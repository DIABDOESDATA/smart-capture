import { useEffect, useRef, useState } from 'react';
import { barcodeVin } from '@/services/vin/barcode';
import { validateVin } from '@/services/vin/vinValidator';
interface Props {
  isOpen: boolean;
  onClose: () => void;
  onVinScanned: (vin: string) => void;
}
export function VinScannerModal({ isOpen, onClose, onVinScanned }: Props) {
  const video = useRef<HTMLVideoElement>(null);
  const [candidate, setCandidate] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    let stream: MediaStream | undefined;
    let stop: (() => void) | undefined;
    (async () => {
      try {
        const { BrowserMultiFormatReader } = await import('@zxing/browser');
        const { BarcodeFormat, DecodeHintType } = await import('@zxing/library');
        if (!active) return;
        const hints = new Map();
        hints.set(DecodeHintType.POSSIBLE_FORMATS, [
          BarcodeFormat.CODE_39,
          BarcodeFormat.CODE_128,
          BarcodeFormat.PDF_417,
        ]);
        hints.set(DecodeHintType.TRY_HARDER, true);
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 } },
        });
        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        const reader = new BrowserMultiFormatReader(hints, { delayBetweenScanAttempts: 250 });
        const controls = await reader.decodeFromStream(stream, video.current!, (result) => {
          if (!active || !result) return;
          const vin = barcodeVin(result.getText());
          if (vin) {
            setCandidate(vin);
            setError(validateVin(vin).errors.join(' '));
          }
        });
        stop = () => controls.stop();
        if (!active) stop();
      } catch (e) {
        if (active)
          setError(
            `Scanner unavailable. Enter VIN manually. ${e instanceof Error ? e.message : ''}`
          );
      }
    })();
    return () => {
      active = false;
      stop?.();
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [isOpen]);
  if (!isOpen) return null;
  return (
    <div className="modal-backdrop">
      <section
        className="panel modal"
        role="dialog"
        aria-modal="true"
        aria-label="VIN Barcode Scanner"
      >
        <header>
          <h2>VIN Barcode Scanner</h2>
          <button onClick={onClose} aria-label="Close scanner">
            ×
          </button>
        </header>
        <video
          ref={video}
          muted
          autoPlay
          playsInline
          className="w-full aspect-video object-cover"
        />
        <p>Scan Code 39, Code 128 or PDF417. Confirm the recognized VIN before using it.</p>
        <label>
          Recognized or manual VIN
          <input
            aria-label="Scanned VIN"
            value={candidate}
            maxLength={17}
            onChange={(e) => {
              setCandidate(e.target.value.toUpperCase());
              setError('');
            }}
          />
        </label>
        {error && <p role="alert">{error}</p>}
        <button
          className="primary"
          onClick={() => {
            const v = validateVin(candidate);
            if (!v.isValid) {
              setError(v.errors.join(' '));
              return;
            }
            onVinScanned(v.cleanVin);
            onClose();
          }}
        >
          Use VIN
        </button>
      </section>
    </div>
  );
}
