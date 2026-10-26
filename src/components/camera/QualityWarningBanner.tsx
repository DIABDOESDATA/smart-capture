import React from 'react';
import { AlertTriangle, RefreshCw, CheckCircle2 } from 'lucide-react';
import { QualityMetric } from '@/types/capture';
interface QualityWarningBannerProps {
  quality: QualityMetric;
  onRetake: () => void;
  onKeepAnyway: () => void;
}
export const QualityWarningBanner: React.FC<QualityWarningBannerProps> = ({
  quality,
  onRetake,
  onKeepAnyway,
}) => {
  if (quality.warnings.length === 0) return null;
  return (
    <div className="absolute inset-x-4 top-20 z-50 bg-charcoal-900/95 backdrop-blur-md border border-brand-amber/60 rounded-2xl p-4 shadow-2xl text-slate-100 animate-in fade-in slide-in-from-top-4 duration-200">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-xl bg-brand-amber/20 text-brand-amber shrink-0 mt-0.5">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-brand-amber">Photo Quality Advisory</h4>
          <ul className="mt-1 space-y-1">
            {quality.warnings.map((warn, i) => (
              <li key={i} className="text-xs text-slate-300 flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-brand-amber shrink-0" />
                {warn}
              </li>
            ))}
          </ul>
          <p className="text-[11px] text-slate-400 mt-2">
            Inspect sharpness, exposure and visible vehicle condition before keeping this
            photograph.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={onRetake}
              className="flex-1 py-2 px-3 rounded-xl bg-brand-amber hover:bg-brand-amberHover text-charcoal-950 font-semibold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retake Shot
            </button>
            <button
              type="button"
              onClick={onKeepAnyway}
              className="py-2 px-3 rounded-xl bg-charcoal-800 hover:bg-charcoal-700 text-slate-300 font-medium text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-hud-green" />
              Keep Anyway
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
