import React from 'react';
import { Eye, EyeOff, Grid, Compass, Palette, Sliders, ZoomIn, ZoomOut } from 'lucide-react';

export interface OverlaySettings {
  isVisible: boolean;
  opacity: number; // 0.1 to 0.9
  color: string;
  showHorizon: boolean;
  showGrid: boolean;
  scale: number; // 0.8 to 1.2
}

interface OverlayControlsProps {
  settings: OverlaySettings;
  onChange: (settings: OverlaySettings) => void;
  isOpen: boolean;
  onClose: () => void;
}

const COLOR_PRESETS = [
  { name: 'Cyan', value: '#06B6D4' },
  { name: 'Green', value: '#22C55E' },
  { name: 'Amber', value: '#F59E0B' },
  { name: 'White', value: '#FFFFFF' },
];

export const OverlayControls: React.FC<OverlayControlsProps> = ({
  settings,
  onChange,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-x-4 bottom-24 z-40 bg-charcoal-900/95 backdrop-blur-md border border-charcoal-700 rounded-2xl p-4 shadow-2xl text-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-200">
      <div className="flex items-center justify-between pb-3 border-b border-charcoal-800">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-brand-cyan" />
          <span className="font-semibold text-sm tracking-wide">HUD Overlay Controls</span>
        </div>
        <button
          onClick={onClose}
          className="text-xs px-2.5 py-1 rounded-lg bg-charcoal-800 hover:bg-charcoal-700 text-slate-300 active:scale-95 transition-all"
        >
          Done
        </button>
      </div>

      <div className="space-y-4 pt-3">
        {/* Visibility & Grid & Horizon Toggles */}
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => onChange({ ...settings, isVisible: !settings.isVisible })}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
              settings.isVisible
                ? 'bg-brand-cyan/20 border-brand-cyan text-brand-cyan'
                : 'bg-charcoal-800 border-charcoal-700 text-slate-400'
            }`}
          >
            {settings.isVisible ? (
              <Eye className="w-3.5 h-3.5" />
            ) : (
              <EyeOff className="w-3.5 h-3.5" />
            )}
            Outline
          </button>

          <button
            type="button"
            onClick={() => onChange({ ...settings, showHorizon: !settings.showHorizon })}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
              settings.showHorizon
                ? 'bg-brand-amber/20 border-brand-amber text-brand-amber'
                : 'bg-charcoal-800 border-charcoal-700 text-slate-400'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            Horizon
          </button>

          <button
            type="button"
            onClick={() => onChange({ ...settings, showGrid: !settings.showGrid })}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
              settings.showGrid
                ? 'bg-hud-green/20 border-hud-green text-hud-green'
                : 'bg-charcoal-800 border-charcoal-700 text-slate-400'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            3x3 Grid
          </button>
        </div>

        {/* Opacity Slider */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-slate-300">
            <span>Guide Opacity</span>
            <span className="font-mono text-brand-cyan">{Math.round(settings.opacity * 100)}%</span>
          </div>
          <input
            type="range"
            min="0.1"
            max="0.9"
            step="0.05"
            value={settings.opacity}
            onChange={(e) => onChange({ ...settings, opacity: parseFloat(e.target.value) })}
            className="w-full accent-brand-cyan bg-charcoal-800 rounded-lg h-2 cursor-pointer"
          />
        </div>

        {/* Scale / Zoom Guide Slider */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs text-slate-300">
            <span className="flex items-center gap-1">
              <ZoomIn className="w-3 h-3 text-slate-400" /> Guide Framing Scale
            </span>
            <span className="font-mono text-brand-cyan">{Math.round(settings.scale * 100)}%</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onChange({ ...settings, scale: Math.max(0.8, settings.scale - 0.05) })}
              className="p-1.5 rounded-lg bg-charcoal-800 text-slate-300 hover:text-white"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <input
              type="range"
              min="0.8"
              max="1.2"
              step="0.02"
              value={settings.scale}
              onChange={(e) => onChange({ ...settings, scale: parseFloat(e.target.value) })}
              className="flex-1 accent-brand-cyan bg-charcoal-800 rounded-lg h-2 cursor-pointer"
            />
            <button
              type="button"
              onClick={() => onChange({ ...settings, scale: Math.min(1.2, settings.scale + 0.05) })}
              className="p-1.5 rounded-lg bg-charcoal-800 text-slate-300 hover:text-white"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Color Presets */}
        <div className="space-y-1.5">
          <span className="text-xs text-slate-300 flex items-center gap-1">
            <Palette className="w-3 h-3 text-slate-400" /> Outline Color
          </span>
          <div className="flex gap-2">
            {COLOR_PRESETS.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => onChange({ ...settings, color: preset.value })}
                className={`flex-1 py-1.5 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                  settings.color === preset.value
                    ? 'border-white bg-charcoal-800 ring-2 ring-white/20'
                    : 'border-charcoal-700 bg-charcoal-850 opacity-70 hover:opacity-100'
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block"
                  style={{ backgroundColor: preset.value }}
                />
                {preset.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
