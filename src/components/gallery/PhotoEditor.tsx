import { useEffect, useState } from 'react';
import { CapturedShot } from '@/types/capture';
import { getPhotoBlob, saveDerivative, clearDerivative } from '@/services/storage/indexedDb';
import { DEFAULT_EDITS, renderEdits } from '@/services/camera/photoEdits';
export function PhotoEditor({
  shot,
  onSaved,
  onCancel,
}: {
  shot: CapturedShot;
  onSaved: (s: CapturedShot) => Promise<void>;
  onCancel: () => void;
}) {
  const [edits, setEdits] = useState(shot.edits || DEFAULT_EDITS),
    [original, setOriginal] = useState(''),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    let alive = true,
      u = '';
    void getPhotoBlob(shot, true).then((b) => {
      if (alive) {
        u = URL.createObjectURL(b);
        setOriginal(u);
      }
    });
    return () => {
      alive = false;
      if (u) URL.revokeObjectURL(u);
    };
  }, [shot]);
  return (
    <section className="panel photo-editor">
      <h2>Adjust photograph</h2>
      <p>
        Original retained. Center crop, straighten and light adjustments only. Inspect condition and
        color before saving.
      </p>
      <div className="editor-preview">
        <img
          src={original}
          alt="Adjustment preview"
          style={{
            transform: `rotate(${edits.rotate + edits.straighten}deg) scale(${1 / (1 - edits.crop)})`,
            filter: `brightness(${edits.brightness}) contrast(${edits.contrast})`,
          }}
        />
      </div>
      <button onClick={() => setEdits({ ...edits, rotate: (edits.rotate + 90) % 360 })}>
        Rotate 90°
      </button>
      {(
        [
          { key: 'straighten', min: -10, max: 10, step: 0.25 },
          { key: 'crop', min: 0, max: 0.4, step: 0.01 },
          { key: 'brightness', min: 0.7, max: 1.3, step: 0.01 },
          { key: 'contrast', min: 0.7, max: 1.3, step: 0.01 },
        ] as const
      ).map((k) => (
        <label key={k.key}>
          {k.key}: {edits[k.key]}
          <input
            aria-label={k.key}
            type="range"
            min={k.min}
            max={k.max}
            step={k.step}
            value={edits[k.key]}
            onChange={(e) => setEdits({ ...edits, [k.key]: Number(e.target.value) })}
          />
        </label>
      ))}
      <div className="toggle-row">
        <button disabled={busy} onClick={onCancel}>
          Cancel
        </button>
        <button
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await clearDerivative(shot);
              await onSaved({ ...shot, edits: undefined });
            } catch (e) {
              setError(String(e));
            } finally {
              setBusy(false);
            }
          }}
        >
          Restore original
        </button>
        <button
          className="primary"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await saveDerivative(
                shot,
                await renderEdits(await getPhotoBlob(shot, true), edits),
                edits
              );
              await onSaved({ ...shot, edits });
            } catch (e) {
              setError(String(e));
            } finally {
              setBusy(false);
            }
          }}
        >
          Save derivative
        </button>
      </div>
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
