import JSZip from 'jszip';
import { VehicleCaptureSession } from '@/types/capture';
import { Vehicle } from '@/types/vehicle';
import { getPhotoBlob } from '@/services/storage/indexedDb';
import { EXTERIOR_ANGLES } from '@/services/references/assets';
import { missingRequired } from '@/services/capture/sequence';
export interface HotspotAssociation {
  id: string;
  targetShotCodes: string[];
  targetPhotoIds: string[];
}
async function bytes(blob: Blob): Promise<ArrayBuffer> {
  if (blob.arrayBuffer) return blob.arrayBuffer();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(blob);
  });
}
const csvCell = (v: unknown) =>
  `"${String(v ?? '')
    .replace(/"/g, '""')
    .replace(/^[=+@-]/, "'$&")}"`;
export function buildManifest(session: VehicleCaptureSession, vehicle: Partial<Vehicle> = {}) {
  const shots = [...session.shots].sort((a, b) => a.sequenceOrder - b.sequenceOrder);
  const hero = shots.find((s) => s.isHero);
  const hotspots: HotspotAssociation[] = [
    ['driver-door', ['DRIVER_COCKPIT', 'FRONT_SEATS']],
    ['dashboard', ['STEERING_DASHBOARD', 'INSTRUMENT_CLUSTER', 'INFOTAINMENT_CONSOLE']],
    ['hood', ['ENGINE_BAY']],
    ['trunk', ['TRUNK_CARGO']],
  ]
    .map(([id, codes]) => ({
      id: id as string,
      targetShotCodes: (codes as string[]).filter((c) => shots.some((s) => s.shotCode === c)),
      targetPhotoIds: shots
        .filter((s) => (codes as string[]).includes(s.shotCode))
        .map((s) => s.shotId),
    }))
    .filter((h) => h.targetPhotoIds.length > 0);
  return {
    version: '2.0',
    schemaVersion: 2,
    generatedAt: new Date().toISOString(),
    sessionId: session.id,
    dealershipId: session.dealershipId,
    vehicleId: session.vehicleId,
    vehicle: { ...vehicle },
    heroShotCode: hero?.shotCode || null,
    totalPhotos: shots.length,
    status: session.status,
    containsSampleMedia: shots.some((s) => s.source === 'sample'),
    containsUnverifiedLegacyMedia: shots.some((s) => !s.source || s.source === 'legacy_unknown'),
    missingRequired: session.templateSnapshot
      ? missingRequired(session.templateSnapshot, shots).map((s) => s.code)
      : null,
    template: session.templateSnapshot,
    photographyStandard: session.standardSnapshot,
    hotspots,
    orbitSequence: { mode: 'checklist', suitableForSmooth360: false },
    photos: shots.map((s, i) => ({
      order: i + 1,
      filename: `${String(i + 1).padStart(2, '0')}_${s.shotCode}.jpg`,
      shotId: s.shotId,
      shotCode: s.shotCode,
      shotName: s.shotName,
      source: s.source || 'legacy_unknown',
      isHero: s.isHero,
      capturedAt: s.capturedAt,
      retakeCount: s.retakeCount,
      quality: s.quality,
      category: s.metadata?.category,
      exteriorViewingAngle: s.metadata?.exteriorViewingAngle,
      exteriorTargetAngle: s.metadata?.exteriorTargetAngle ?? EXTERIOR_ANGLES[s.shotCode],
      ...s.metadata,
      edits: s.edits,
      originalFilename: s.edits ? `originals/${s.shotId}.jpg` : undefined,
    })),
  };
}
export async function generateSessionZip(
  session: VehicleCaptureSession,
  vehicle: Partial<Vehicle> = {}
): Promise<Blob> {
  if (!session.shots.length) throw new Error('Capture at least one photo before exporting.');
  const zip = new JSZip(),
    manifest = buildManifest(session, vehicle),
    shots = [...session.shots].sort((a, b) => a.sequenceOrder - b.sequenceOrder);
  const rows = [
    [
      'Order',
      'Filename',
      'ShotCode',
      'ShotName',
      'IsHero',
      'CapturedAt',
      'Source',
      'BlurScore',
      'Exposure',
      'TiltDegrees',
    ]
      .map(csvCell)
      .join(','),
  ];
  for (let i = 0; i < shots.length; i++) {
    const s = shots[i],
      p = manifest.photos[i];
    // Fail closed: a missing photo must not produce a seemingly complete package.
    const blob = await getPhotoBlob(s);
    zip.file(p.filename, await bytes(blob));
    if (s.edits) zip.file(`originals/${s.shotId}.jpg`, await bytes(await getPhotoBlob(s, true)));
    rows.push(
      [
        p.order,
        p.filename,
        s.shotCode,
        s.shotName,
        s.isHero,
        s.capturedAt,
        s.source || 'legacy_unknown',
        s.quality.blurScore,
        s.quality.exposure,
        s.quality.tiltDegrees,
      ]
        .map(csvCell)
        .join(',')
    );
  }
  zip.file('manifest.json', JSON.stringify(manifest, null, 2));
  zip.file('manifest.csv', rows.join('\r\n'));
  zip.file(
    'README.txt',
    `Smart Capture V2 standalone export\nVIN: ${vehicle.vin || 'Unknown'}\n${manifest.containsSampleMedia ? 'WARNING: CONTAINS SAMPLE IMAGES. NOT REAL VEHICLE PHOTOGRAPHY.\n' : ''}No cloud sync performed. Checklist images do not form a smooth 360 spin. Original files are retained for adjusted photos.\nHero: ${manifest.photos.find((p) => p.isHero)?.filename || 'Not selected'}`
  );
  return zip.generateAsync({ type: 'blob', compression: 'STORE' });
}
export function triggerFileDownload(blob: Blob, filename: string) {
  const u = URL.createObjectURL(blob),
    a = document.createElement('a');
  a.href = u;
  a.download = filename.replace(/[<>:"/\\|?*]/g, '_');
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(u), 30000);
}
