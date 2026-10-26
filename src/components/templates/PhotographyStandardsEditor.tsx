import { useEffect, useState } from 'react';
import { PhotographyStandard } from '@/types/capture';
import { DEFAULT_STANDARD } from '@/services/standards';
import { getSetting, putSetting } from '@/services/storage/indexedDb';
export function PhotographyStandardsEditor({ dealer }: { dealer: string }) {
  const [s, setS] = useState<PhotographyStandard>(DEFAULT_STANDARD),
    [message, setMessage] = useState(''),
    [loaded, setLoaded] = useState(false),
    [loadAttempt, setLoadAttempt] = useState(0);
  useEffect(() => {
    let live = true;
    setLoaded(false);
    setMessage('');
    void getSetting<PhotographyStandard>(`standard:${dealer}`)
      .then((v) => {
        if (!live) return;
        setS(v || DEFAULT_STANDARD);
        setLoaded(true);
      })
      .catch(() => {
        if (live) setMessage('Photography standard could not be loaded.');
      });
    return () => {
      live = false;
    };
  }, [dealer, loadAttempt]);
  return (
    <details className="panel">
      <summary>Dealership photography standard</summary>
      <p>
        Standards apply to new sessions. Existing sessions retain their saved standard. Exterior
        hero: front driver-side three-quarter, wheels visible, full bumper margins, level horizon.
      </p>
      <fieldset disabled={!loaded}>
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
      </fieldset>
      {!loaded && message && (
        <button onClick={() => setLoadAttempt((n) => n + 1)}>Retry loading standard</button>
      )}
      <p role="status">{message || (!loaded ? 'Loading saved standard…' : '')}</p>
    </details>
  );
}
