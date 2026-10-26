import { DEFAULT_OVERLAY } from './defaultSettings';
import { useState } from 'react';
export interface OverlaySettings {
  isVisible: boolean;
  opacity: number;
  color: string;
  showHorizon: boolean;
  showGrid: boolean;
  scale: number;
  x?: number;
  y?: number;
  mirror?: boolean;
  anchors?: boolean;
  mode?: 'ghost' | 'edge';
  emphasis?: number;
  highVisibility?: boolean;
}
interface Props {
  settings: OverlaySettings;
  onChange: (s: OverlaySettings) => void;
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => Promise<void>;
  children?: React.ReactNode;
}
export function OverlayControls({
  settings: s,
  onChange,
  isOpen,
  onClose,
  onSave,
  children,
}: Props) {
  const [message, setMessage] = useState('');
  if (!isOpen) return null;
  const change = (p: Partial<OverlaySettings>) => onChange({ ...s, ...p });
  return (
    <div className="controls-sheet panel" role="dialog" aria-label="Reference controls">
      <header>
        <h2>HUD Overlay Controls</h2>
        <button aria-label="Close controls" onClick={onClose}>
          ×
        </button>
      </header>
      <div className="toggle-row">
        {(
          [
            ['Outline / reference', 'isVisible'],
            ['Horizon', 'showHorizon'],
            ['Grid', 'showGrid'],
            ['Anchors', 'anchors'],
            ['Mirror', 'mirror'],
            ['High visibility', 'highVisibility'],
          ] as const
        ).map(([label, key]) => (
          <button key={key} aria-pressed={!!s[key]} onClick={() => change({ [key]: !s[key] })}>
            {label}
          </button>
        ))}
      </div>
      <label>
        Display
        <select
          aria-label="Reference display"
          value={s.mode || 'ghost'}
          onChange={(e) => change({ mode: e.target.value as 'ghost' | 'edge' })}
        >
          <option value="ghost">Neutral ghost</option>
          <option value="edge">Edge only</option>
        </select>
      </label>
      {(
        [
          { label: 'Opacity', key: 'opacity', min: 0.05, max: 0.85, step: 0.05 },
          { label: 'Reference scale', key: 'scale', min: 0.5, max: 1.5, step: 0.01 },
          { label: 'Position X', key: 'x', min: -0.3, max: 0.3, step: 0.01 },
          { label: 'Position Y', key: 'y', min: -0.3, max: 0.3, step: 0.01 },
          { label: 'Outline emphasis', key: 'emphasis', min: 0.5, max: 4, step: 0.5 },
        ] as const
      ).map((c) => (
        <label key={c.key}>
          {c.label}
          <output>{Number(s[c.key] ?? 0).toFixed(2)}</output>
          <input
            type="range"
            aria-label={c.label}
            min={c.min}
            max={c.max}
            step={c.step}
            value={Number(s[c.key] ?? 0)}
            onChange={(e) => change({ [c.key]: Number(e.target.value) })}
          />
        </label>
      ))}
      <div className="toggle-row">
        <button onClick={() => onChange({ ...DEFAULT_OVERLAY })}>Reset to standard</button>
        {onSave && (
          <button
            onClick={async () => {
              try {
                await onSave();
                setMessage('Calibration saved on this device.');
              } catch {
                setMessage('Calibration could not be saved.');
              }
            }}
          >
            Save reference calibration
          </button>
        )}
      </div>
      <p role="status">{message}</p>
      {children}
    </div>
  );
}
