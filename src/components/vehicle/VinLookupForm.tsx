import React, { useState, useEffect, useRef } from 'react';
import { Search, CheckCircle2, AlertCircle, Car, Loader2, Sparkles, RefreshCw } from 'lucide-react';
import { BodyStyle, Vehicle } from '@/types/vehicle';
import { validateVin } from '@/services/vin/vinValidator';
import { decodeVinWithNhtsa } from '@/services/vin/nhtsaDecoder';
interface VinLookupFormProps {
  dealershipId: string;
  scannedVin?: string;
  templates?: import('@/types/template').CaptureTemplate[];
  onVehicleSelected: (vehicle: Vehicle) => Promise<void> | void;
  onOpenVinScanner: () => void;
}
const BODY_STYLE_OPTIONS: { label: string; value: BodyStyle }[] = [
  { label: 'Sedan (4-Door)', value: 'sedan' },
  { label: 'SUV / Crossover', value: 'suv' },
  { label: 'Pickup Truck', value: 'truck' },
  { label: 'Coupe (2-Door)', value: 'coupe' },
  { label: 'Hatchback', value: 'hatchback' },
  { label: 'Wagon', value: 'wagon' },
  { label: 'Convertible', value: 'convertible' },
  { label: 'Van / Minivan', value: 'van' },
  { label: 'Classic Car', value: 'classic' },
  { label: 'Other', value: 'other' },
];
export const VinLookupForm: React.FC<VinLookupFormProps> = ({
  dealershipId,
  onVehicleSelected,
  onOpenVinScanner,
  scannedVin,
  templates = [],
}) => {
  const decodeRequest = useRef(0),
    startLock = useRef(false);
  const [starting, setStarting] = useState(false),
    [thirdRow, setThirdRow] = useState(false),
    [sunroof, setSunroof] = useState(false);
  const [rearSeats, setRearSeats] = useState(true);
  const [templateId, setTemplateId] = useState('template-ddrive-20');
  const [startError, setStartError] = useState('');
  useEffect(() => {
    if (scannedVin) {
      decodeRequest.current++;
      setVinInput(scannedVin);
      setYear(undefined);
      setMake('');
      setModel('');
      setTrim('');
      setHasDecoded(false);
      setIsLoading(false);
    }
  }, [scannedVin]);
  const [vinInput, setVinInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [suggestedCorrection, setSuggestedCorrection] = useState<string | null>(null);
  // Decoded or manual fields
  const [year, setYear] = useState<number | undefined>(undefined);
  const [make, setMake] = useState<string>('');
  const [model, setModel] = useState<string>('');
  const [trim, setTrim] = useState<string>('');
  const [bodyStyle, setBodyStyle] = useState<BodyStyle>('sedan');
  const [stockNumber, setStockNumber] = useState<string>('');
  const [hasDecoded, setHasDecoded] = useState(false);
  const handleDecode = async (vinToDecode: string = vinInput) => {
    const validation = validateVin(vinToDecode);
    setValidationErrors(validation.errors);
    setSuggestedCorrection(validation.suggestedCorrection || null);
    if (!validation.isValid) return;
    const request = ++decodeRequest.current;
    setIsLoading(true);
    try {
      const decoded = await decodeVinWithNhtsa(validation.cleanVin);
      if (request !== decodeRequest.current) return;
      setYear(decoded.year);
      setMake(decoded.make || '');
      setModel(decoded.model || '');
      setTrim(decoded.trim || '');
      if (decoded.errorCode && decoded.errorCode !== '0')
        setValidationErrors([decoded.errorText || 'Decode incomplete. Confirm fields manually.']);
      if (decoded.suggestedBodyStyle) setBodyStyle(decoded.suggestedBodyStyle);
      setHasDecoded(!decoded.errorCode || decoded.errorCode === '0');
    } catch (err) {
      if (request === decodeRequest.current)
        setValidationErrors([
          err instanceof Error
            ? err.message
            : 'Vehicle lookup is unavailable. Enter the details below to continue.',
        ]);
    } finally {
      if (request === decodeRequest.current) setIsLoading(false);
    }
  };
  const applyCorrection = (correctedVin: string) => {
    setVinInput(correctedVin);
    handleDecode(correctedVin);
  };
  const handleProceed = (e: React.FormEvent) => {
    e.preventDefault();
    if (startLock.current || isLoading) return;
    if (vinInput && !validateVin(vinInput).isValid) {
      setValidationErrors(validateVin(vinInput).errors);
      return;
    }
    const vehicle: Vehicle = {
      id: crypto.randomUUID(),
      dealershipId,
      vin: vinInput.trim().toUpperCase() || undefined,
      year,
      make: make.trim() || undefined,
      model: model.trim() || undefined,
      trim: trim.trim() || undefined,
      bodyStyle,
      features: { rearSeats, thirdRow, sunroof },
      stockNumber: stockNumber.trim() || undefined,
      templateId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    startLock.current = true;
    setStarting(true);
    setStartError('');
    Promise.resolve()
      .then(() => onVehicleSelected(vehicle))
      .catch((e) => setStartError(e instanceof Error ? e.message : 'Unable to save session.'))
      .finally(() => {
        startLock.current = false;
        setStarting(false);
      });
  };
  return (
    <div className="vehicle-form">
      <div className="form-heading">
        <div>
          <h2 className="text-lg font-bold text-white tracking-wide">Vehicle Identification</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Scan a barcode or enter details. VIN is optional for a manual session.
          </p>
        </div>
        <button type="button" onClick={onOpenVinScanner} className="secondary">
          <Car className="w-4 h-4" />
          Scan Camera
        </button>
      </div>
      <form onSubmit={handleProceed} className="mt-5 space-y-4">
        {/* VIN Input with Search / Decode button */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            17-Digit Vehicle Identification Number (VIN)
          </label>
          <div className="vin-entry-row">
            <input
              type="text"
              maxLength={17}
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
              aria-label="Vehicle VIN"
              placeholder="e.g. 1HGCR2F83HA000000"
              value={vinInput}
              onChange={(e) => {
                const val = e.target.value.toUpperCase();
                decodeRequest.current++;
                setIsLoading(false);
                setHasDecoded(false);
                setYear(undefined);
                setMake('');
                setModel('');
                setTrim('');
                setVinInput(val);
              }}
              className="w-full bg-charcoal-950 border border-charcoal-700 rounded-xl px-4 py-3 text-sm font-mono tracking-widest text-white placeholder:text-slate-600 focus:outline-none focus:border-brand-cyan uppercase"
            />
            <button
              type="button"
              disabled={isLoading || !vinInput}
              onClick={() => handleDecode()}
              className="absolute right-2 px-3 py-1.5 rounded-lg bg-brand-cyan/20 text-brand-cyan hover:bg-brand-cyan/30 text-xs font-semibold flex items-center gap-1 disabled:opacity-30 transition-all"
            >
              {isLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Search className="w-3.5 h-3.5" />
              )}
              Decode
            </button>
          </div>
          <p className="form-note">
            Decode uses NHTSA when online. You can enter vehicle details below at any time.
          </p>
          {/* Suggested OCR character correction */}
          {suggestedCorrection && (
            <div className="mt-2 p-2.5 rounded-xl bg-charcoal-800 border border-brand-amber/40 flex items-center justify-between text-xs">
              <span className="text-slate-300">
                Possible OCR confusion detected with standard VIN format.
              </span>
              <button
                type="button"
                onClick={() => applyCorrection(suggestedCorrection)}
                className="font-bold text-brand-amber hover:underline flex items-center gap-1 ml-2"
              >
                <RefreshCw className="w-3 h-3" />
                Use {suggestedCorrection}
              </button>
            </div>
          )}
          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="mt-2 space-y-1">
              {validationErrors.map((err, i) => (
                <p key={i} className="text-[11px] text-hud-red flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  {err}
                </p>
              ))}
            </div>
          )}
        </div>
        {/* Decoded Vehicle Fields */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Year</label>
            <input
              type="number"
              aria-label="Vehicle year"
              placeholder="Year"
              min={1886}
              max={new Date().getFullYear() + 2}
              value={year || ''}
              onChange={(e) => setYear(parseInt(e.target.value, 10) || undefined)}
              className="w-full bg-charcoal-950 border border-charcoal-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-cyan"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Make</label>
            <input
              type="text"
              aria-label="Vehicle make"
              placeholder="e.g. BMW"
              value={make}
              onChange={(e) => setMake(e.target.value)}
              className="w-full bg-charcoal-950 border border-charcoal-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-cyan"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Model</label>
            <input
              type="text"
              aria-label="Vehicle model"
              placeholder="e.g. 330i xDrive"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full bg-charcoal-950 border border-charcoal-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-cyan"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Stock #</label>
            <input
              type="text"
              aria-label="Stock number"
              placeholder="e.g. SC-1042"
              value={stockNumber}
              onChange={(e) => setStockNumber(e.target.value)}
              className="w-full bg-charcoal-950 border border-charcoal-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-cyan font-mono"
            />
          </div>
        </div>
        {/* Body Style Selection & Override */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Body style · chooses your reference
            </label>
            {hasDecoded && (
              <span className="text-[10px] text-brand-cyan font-mono flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> NHTSA Inferred
              </span>
            )}
          </div>
          <select
            aria-label="Vehicle body classification"
            value={bodyStyle}
            onChange={(e) => setBodyStyle(e.target.value as BodyStyle)}
            className="w-full bg-charcoal-950 border border-charcoal-700 rounded-xl px-3 py-2.5 text-sm font-medium text-white focus:outline-none focus:border-brand-cyan"
          >
            {BODY_STYLE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <label className="block text-sm">
          Photography checklist
          <select
            aria-label="Photography checklist"
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value)}
          >
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
        {startError && <p role="alert">{startError}</p>}
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={rearSeats}
            onChange={(e) => setRearSeats(e.target.checked)}
          />
          Vehicle has rear seats
        </label>
        {(bodyStyle === 'suv' || bodyStyle === 'van') && (
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={thirdRow}
              onChange={(e) => setThirdRow(e.target.checked)}
            />
            Third-row seating fitted
          </label>
        )}
        <label className="checkbox-row">
          <input type="checkbox" checked={sunroof} onChange={(e) => setSunroof(e.target.checked)} />
          Sunroof / panoramic roof fitted
        </label>
        {/* Start Guided Capture Button */}
        <div className="pt-3">
          <button type="submit" disabled={starting || isLoading} className="primary w-full">
            <CheckCircle2 className="w-4 h-4" />
            {starting ? 'Preparing your camera…' : 'Start Guided Capture Session'}
          </button>
        </div>
      </form>
    </div>
  );
};
