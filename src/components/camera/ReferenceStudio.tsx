import { useEffect, useRef, useState } from 'react';
import { BodyStyle } from '@/types/vehicle';
import { ShotAngle } from '@/types/template';
import { saveApprovedReference } from '@/services/references/custom';
export function ReferenceStudio({
  dealer,
  body,
  shot,
  onSaved,
}: {
  dealer: string;
  body: BodyStyle;
  shot: ShotAngle;
  onSaved: () => void;
}) {
  const [file, setFile] = useState<File | null>(null),
    [url, setUrl] = useState(''),
    [points, setPoints] = useState<[number, number][]>([]),
    [message, setMessage] = useState('');
  const image = useRef<HTMLImageElement>(null);
  useEffect(() => {
    if (!file) return;
    const u = URL.createObjectURL(file);
    setUrl(u);
    setPoints([]);
    return () => URL.revokeObjectURL(u);
  }, [file]);
  return (
    <section className="reference-studio">
      <h3>Dealership reference studio</h3>
      <p>
        Use a dealership-owned or licensed photo. Trace the vehicle or interior region by tapping
        around its edge, then save. A transparent PNG can be saved without tracing.
      </p>
      <input
        aria-label="Upload approved reference"
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />
      {url && (
        <>
          <div
            className="relative"
            onClick={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              setPoints((p) => [
                ...p,
                [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height],
              ]);
            }}
          >
            <img ref={image} src={url} alt="Trace reference boundary" className="w-full" />
            <svg
              className="absolute inset-0 w-full h-full"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <polygon
                points={points.map((p) => `${p[0] * 100},${p[1] * 100}`).join(' ')}
                fill="#ffffff22"
                stroke="white"
                strokeWidth="0.5"
              />
            </svg>
          </div>
          <p>
            {points.length} boundary points. Saved for {body} / {shot} on this device.
          </p>
          <button onClick={() => setPoints((p) => p.slice(0, -1))}>Undo point</button>
          <button
            disabled={points.length < 3 && file?.type !== 'image/png'}
            onClick={async () => {
              try {
                const img = image.current;
                if (!img || !file) return;
                if (img.naturalWidth * img.naturalHeight > 24000000)
                  throw new Error('Choose a reference below 24 megapixels.');
                const c = document.createElement('canvas');
                c.width = img.naturalWidth;
                c.height = img.naturalHeight;
                const ctx = c.getContext('2d');
                if (!ctx) throw new Error('Canvas unavailable.');
                if (points.length >= 3) {
                  ctx.beginPath();
                  points.forEach(([x, y], i) =>
                    i
                      ? ctx.lineTo(x * c.width, y * c.height)
                      : ctx.moveTo(x * c.width, y * c.height)
                  );
                  ctx.closePath();
                  ctx.clip();
                }
                ctx.drawImage(img, 0, 0);
                const blob = await new Promise<Blob>((r, j) =>
                  c.toBlob((b) => (b ? r(b) : j(new Error('Isolation failed.'))), 'image/png')
                );
                await saveApprovedReference({
                  id: crypto.randomUUID(),
                  dealershipId: dealer,
                  body,
                  shot,
                  original: file,
                  cutout: blob,
                  width: c.width,
                  height: c.height,
                  approvedAt: new Date().toISOString(),
                  label: file.name,
                });
                setMessage('Approved reference saved.');
                onSaved();
              } catch (e) {
                setMessage(e instanceof Error ? e.message : 'Reference save failed.');
              }
            }}
          >
            Save isolated reference
          </button>
        </>
      )}
      <p role="status">{message}</p>
    </section>
  );
}
