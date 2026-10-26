import { useEffect, useState } from 'react';
import { PhotographyStandard } from '@/types/capture';
import { DEFAULT_STANDARD } from '@/services/standards';
import { getSetting, putSetting } from '@/services/storage/indexedDb';
export function PhotographyStandardsEditor({ dealer }: { dealer: string }) {
  const [s, setS] = useState<PhotographyStandard>(DEFAULT_STANDARD),
    [message, setMessage] = useState('');
  useEffect(() => {
    void getSetting<PhotographyStandard>(`standard:${dealer}`).then((v) => {
      if (v) setS(v);
    });
  }, [dealer]);
  return (
    <details className="panel">
      <summary>Dealership photography standard</summary>
      <p>
        Standards apply to new sessions. Existing sessions retain their saved standard. Exterior
        hero: front driver-side three-quarter, wheels visible, full bumper margins, level horizon.
      </p>
      <label>
        Preferred ratio
        <select
          value={s.aspectRatio}
          onChange={(e) =>
            setS({ ...s, aspectRatio: e.target.value as PhotographyStandard['aspectRatio'] })
          }
        >
          {['4:3', '16:9', '1:1'].map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>
      </label>
      {(
        [
          'coverage',
          'centerX',
          'centerY',
          'groundY',
          'centerTolerance',
          'coverageTolerance',
          'maxTilt',
          'minWidth',
          'minHeight',
        ] as const
      ).map((k) => (
        <label key={k}>
          {k}
          <input
            type="number"
            step={k === 'maxTilt' || k.startsWith('min') ? 1 : 0.01}
            min={k.startsWith('min') ? 320 : 0.01}
            max={k.startsWith('min') ? 8000 : k === 'maxTilt' ? 15 : 1}
            value={s[k]}
            onChange={(e) => setS({ ...s, [k]: Number(e.target.value) })}
          />
        </label>
      ))}
      <label>
        Camera height guidance
        <textarea
          value={s.cameraHeightGuidance}
          onChange={(e) => setS({ ...s, cameraHeightGuidance: e.target.value })}
        />
      </label>
      <label>
        Lighting guidance
        <textarea
          value={s.lightingGuidance}
          onChange={(e) => setS({ ...s, lightingGuidance: e.target.value })}
        />
      </label>
      <button
        onClick={async () => {
          try {
            if (!Number.isFinite(s.coverage) || s.coverage <= 0 || s.coverage > 1)
              throw new Error('Coverage must be between 0 and 1.');
            await putSetting(`standard:${dealer}`, s);
            setMessage('Photography standard saved.');
          } catch (e) {
            setMessage(e instanceof Error ? e.message : 'Could not save standard.');
          }
        }}
      >
        Save dealership standard
      </button>
      <p role="status">{message}</p>
    </details>
  );
}
