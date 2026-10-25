import React, { useState } from 'react';
import { Search, CheckCircle2, AlertCircle, Car, Loader2, Sparkles, RefreshCw } from 'lucide-react';
import { BodyStyle, Vehicle } from '@/types/vehicle';
import { validateVin } from '@/services/vin/vinValidator';
import { decodeVinWithNhtsa } from '@/services/vin/nhtsaDecoder';

interface VinLookupFormProps {
  dealershipId: string;
  onVehicleSelected: (vehicle: Vehicle) => void;
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
}) => {
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

    if (!validation.cleanVin) return;

    setIsLoading(true);
    try {
      const decoded = await decodeVinWithNhtsa(validation.cleanVin);
      if (decoded.year) setYear(decoded.year);
      if (decoded.make) setMake(decoded.make);
      if (decoded.model) setModel(decoded.model);
      if (decoded.trim) setTrim(decoded.trim);
      if (decoded.suggestedBodyStyle) setBodyStyle(decoded.suggestedBodyStyle);

      if (!stockNumber) {
        setStockNumber(`STK-${validation.cleanVin.slice(-6)}`);
      }
      setHasDecoded(true);
    } catch (err) {
      console.error('NHTSA decode failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const applyCorrection = (correctedVin: string) => {
    setVinInput(correctedVin);
    handleDecode(correctedVin);
  };

  const handleProceed = (e: React.FormEvent) => {
    e.preventDefault();
    const vehicle: Vehicle = {
      id: `veh-${Date.now()}`,
      dealershipId,
      vin: vinInput.trim().toUpperCase() || undefined,
      year: year || 2024,
      make: make.trim() || 'Vehicle',
      model: model.trim() || 'Inventory',
      trim: trim.trim() || undefined,
      bodyStyle,
      stockNumber: stockNumber.trim() || `STK-${Date.now().toString().slice(-4)}`,
      templateId: `template-${bodyStyle}-default`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onVehicleSelected(vehicle);
  };

  return (
    <div className="bg-charcoal-900 border border-charcoal-800 rounded-3xl p-6 shadow-xl max-w-lg mx-auto">
      <div className="flex items-center justify-between pb-4 border-b border-charcoal-800">
        <div>
          <h2 className="text-lg font-bold text-white tracking-wide">Vehicle Identification</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Scan VIN plate or enter vehicle specifications to assign guided template.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenVinScanner}
          className="p-2.5 rounded-2xl bg-charcoal-800 hover:bg-charcoal-700 text-brand-cyan border border-charcoal-700 active:scale-95 transition-all flex items-center gap-1.5 text-xs font-semibold"
        >
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
          <div className="relative flex items-center">
            <input
              type="text"
              maxLength={17}
              placeholder="e.g. 1HGCR2F83HA000000"
              value={vinInput}
              onChange={(e) => {
                const val = e.target.value.toUpperCase();
                setVinInput(val);
                if (val.length === 17) {
                  handleDecode(val);
                }
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
              placeholder="2023"
              value={year || ''}
              onChange={(e) => setYear(parseInt(e.target.value, 10) || undefined)}
              className="w-full bg-charcoal-950 border border-charcoal-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-cyan"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Make</label>
            <input
              type="text"
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
              placeholder="e.g. DD-8472"
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
              Vehicle Body Classification (Selects Guided Camera Silhouette)
            </label>
            {hasDecoded && (
              <span className="text-[10px] text-brand-cyan font-mono flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> NHTSA Inferred
              </span>
            )}
          </div>
          <select
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

        {/* Start Guided Capture Button */}
        <div className="pt-3">
          <button
            type="submit"
            className="w-full py-3.5 px-4 rounded-2xl bg-brand-cyan hover:bg-cyan-400 text-charcoal-950 font-bold text-sm tracking-wide shadow-glow-cyan active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            Start Guided Capture Session
          </button>
        </div>
      </form>
    </div>
  );
};
