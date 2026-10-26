import { referenceGeometry } from '@/services/references/geometry';
import { DEFAULT_OVERLAY } from '@/components/camera/overlays/defaultSettings';
import { describe, it, expect, vi } from 'vitest';
import { coverCrop, captureFrame, screenRoll } from '@/services/camera/geometry';
import { alignment } from '@/services/camera/detector';
import { CameraController } from '@/services/camera/controller';
import { DEFAULT_STANDARD } from '@/services/standards';
import { referenceAsset, compositionGuide } from '@/services/references/assets';
import {
  getDefaultTemplates,
  MASTER_24_SHOT_SEQUENCE,
} from '@/services/templates/defaultTemplates';
import { adaptTemplate } from '@/services/templates/repository';
import { missingRequired, nextMissing, replaceShot } from '@/services/capture/sequence';
import { buildManifest, generateSessionZip } from '@/services/export/zipExporter';
import { barcodeVin, acceptedBarcode } from '@/services/vin/barcode';
import { DDriveAdapter } from '@/services/integrations/ddriveAdapter';
import { editGeometry, DEFAULT_EDITS } from '@/services/camera/photoEdits';
import { analyzeImageQuality } from '@/services/camera/qualityEngine';
import { CapturedShot, VehicleCaptureSession } from '@/types/capture';
import { BodyStyle } from '@/types/vehicle';
const quality = {
  blurScore: 100,
  isBlurry: false,
  exposure: 'normal' as const,
  meanLuminance: 128,
  tiltDegrees: null,
  isLevel: null,
  width: 1600,
  height: 1200,
  warnings: [],
};
const shot: CapturedShot = {
  shotId: 'photo-1',
  shotCode: 'FRONT_3Q_DRIVER',
  shotName: 'Hero',
  sequenceOrder: 1,
  imageDataUrl: 'data:image/jpeg;base64,aGk=',
  capturedAt: '2026-10-25T12:00:00Z',
  isHero: true,
  retakeCount: 0,
  quality,
  syncStatus: 'local',
  source: 'sample',
};
const template = getDefaultTemplates()[0];
const session: VehicleCaptureSession = {
  id: 'session-1',
  dealershipId: 'dealer',
  vehicleId: 'vehicle-1',
  templateId: template.id,
  templateSnapshot: template,
  employeeId: 'local',
  employeeName: 'Local',
  status: 'paused',
  startedAt: '2026-10-25T12:00:00Z',
  shots: [shot],
  syncPendingCount: 0,
  createdAt: '2026-10-25T12:00:00Z',
  updatedAt: '2026-10-25T12:00:00Z',
};
describe('Preview and saved-image geometry', () => {
  it.each([
    ['4:3', 1440, 1080, 240, 0],
    ['16:9', 1920, 1080, 0, 0],
    ['1:1', 1080, 1080, 420, 0],
  ] as const)('center crops 1920x1080 into %s without upscaling', (r, w, h, x, y) =>
    expect(coverCrop(1920, 1080, r)).toEqual({ x, y, width: w, height: h })
  );
  it('handles portrait video and rejects zero frames', () => {
    expect(coverCrop(1080, 1920, '4:3')).toEqual({ x: 0, y: 555, width: 1080, height: 810 });
    expect(() => coverCrop(0, 0, '4:3')).toThrow();
  });
  it('draws only the camera source with the exact cover-crop rectangle', () => {
    const source = document.createElement('canvas'),
      spy = vi.spyOn(HTMLCanvasElement.prototype, 'getContext');
    const { canvas, crop } = captureFrame(source, 1920, 1080, '4:3');
    const ctx = spy.mock.results.at(-1)?.value;
    expect(canvas.width).toBe(1440);
    expect(crop.x).toBe(240);
    expect(ctx.canvas).toBe(canvas);
    spy.mockRestore();
  });
  it('uses null when orientation is absent or phone is flat', () => {
    expect(screenRoll(null, 0, 0)).toBeNull();
    expect(screenRoll(0, 0, 0)).toBeNull();
    expect(screenRoll(90, 0, 0)).toBeCloseTo(0);
    expect(screenRoll(0, 90, 90)).toBeCloseTo(0);
  });
  it('does not mark an absent horizon sensor LEVEL', () => {
    const c = document.createElement('canvas');
    c.width = 1600;
    c.height = 1200;
    expect(analyzeImageQuality(c, null).isLevel).toBeNull();
  });
  it('preserves resolution on rotation and crops without upscaling', () => {
    expect(editGeometry(1600, 1200, { ...DEFAULT_EDITS, rotate: 90 })).toEqual({
      width: 1200,
      height: 1600,
    });
    const s = editGeometry(1600, 1200, { ...DEFAULT_EDITS, straighten: 5 });
    expect(s.width).toBeLessThan(1600);
    expect(s.height).toBeLessThan(1200);
  });
});
describe('Camera lifecycle', () => {
  it('stops a late stream after unmount or switching', async () => {
    let resolve!: (v: MediaStream) => void;
    const stop = vi.fn();
    navigator.mediaDevices.getUserMedia = vi.fn(
      () =>
        new Promise<MediaStream>((r) => {
          resolve = r;
        })
    );
    const c = new CameraController();
    const pending = c.start();
    c.stop();
    resolve({ getTracks: () => [{ stop }] } as unknown as MediaStream);
    expect(await pending).toBeNull();
    expect(stop).toHaveBeenCalledOnce();
  });
  it('propagates permission denial instead of manufacturing an image', async () => {
    navigator.mediaDevices.getUserMedia = vi
      .fn()
      .mockRejectedValue(new DOMException('Denied', 'NotAllowedError'));
    await expect(new CameraController().start()).rejects.toThrow('Denied');
  });
});
describe('References, composition and sequence', () => {
  it.each([
    'sedan',
    'suv',
    'truck',
    'coupe',
    'convertible',
    'hatchback',
    'wagon',
    'van',
    'classic',
    'other',
  ] as BodyStyle[])('%s has raster guides for all eight exterior views', (body) => {
    for (const s of template.shots.filter((s) => s.category === 'exterior')) {
      const asset = referenceAsset(body, s.code);
      expect(asset?.url).toMatch(/\.png$/);
      expect(asset?.rect[2]).toBeGreaterThan(0);
    }
  });
  it('has meaningful landmarks for every non-exterior shot', () => {
    for (const s of MASTER_24_SHOT_SEQUENCE.filter((s) => s.category !== 'exterior'))
      expect(compositionGuide(s, 'truck').landmarks.length).toBeGreaterThanOrEqual(3);
    expect(referenceAsset('sedan', 'ENGINE_BAY')).toBeNull();
  });
  it('adapts pickup and convertible without mutating base or making empty rear-seat slots', () => {
    expect(
      adaptTemplate(template, 'truck').shots.find((s) => s.code === 'TRUNK_CARGO')?.name
    ).toMatch(/Bed/);
    expect(template.shots.find((s) => s.code === 'TRUNK_CARGO')?.name).not.toMatch(/Bed/);
    expect(
      adaptTemplate(template, 'truck', { rearSeats: false }).shots.some(
        (s) => s.code === 'REAR_SEATS'
      )
    ).toBe(false);
  });
  it('requires every required shot and resumes the first missing', () => {
    expect(missingRequired(template, [shot]).length).toBeGreaterThan(0);
    expect(nextMissing(template, [shot])).toBe(1);
  });
  it('retakes keep shot identity/order and retain the preceding original', () => {
    const s = replaceShot(
      { ...session, shots: [{ ...shot, imageId: 'old-image', sequenceOrder: 5 }] },
      { ...shot, shotId: 'retry-id' }
    );
    expect(s.shots).toHaveLength(1);
    expect(s.shots[0]).toMatchObject({
      shotId: shot.shotId,
      sequenceOrder: 5,
      retakeCount: 1,
      previousImageId: 'old-image',
    });
  });
});
describe('Measured alignment and manual fallback', () => {
  it('returns no score at low confidence', () =>
    expect(
      alignment(
        { box: { x: 0.1, y: 0.2, width: 0.8, height: 0.5 }, confidence: 0.3, label: 'car' },
        DEFAULT_STANDARD,
        null
      ).score
    ).toBeUndefined());
  it('scores a centered box and guides size correction', () => {
    const d = {
      box: { x: 0.11, y: 0.28, width: 0.78, height: 0.5 },
      confidence: 0.9,
      label: 'car',
    };
    expect(alignment(d, DEFAULT_STANDARD, null).score).toBe(100);
    expect(
      alignment({ ...d, box: { x: 0.3, y: 0.28, width: 0.4, height: 0.5 } }, DEFAULT_STANDARD, null)
        .guidance
    ).toMatch(/closer/);
  });
});
describe('Barcode, sync and export integrity', () => {
  it('extracts barcode sentinels without silently correcting invalid characters', () => {
    expect(barcodeVin('*1HGCM82633A004352*')).toBe('1HGCM82633A004352');
    expect(acceptedBarcode('1HGCM82633A004352')).toBeTruthy();
    expect(barcodeVin('IHGCM82633A004352')).toBeNull();
  });
  it('never reports D Drive success and never calls its endpoint', async () => {
    const spy = vi.spyOn(globalThis, 'fetch');
    const r = await new DDriveAdapter('anything', 'https://example.com').syncSession(session, {});
    expect(r.success).toBe(false);
    expect(r.uploadedPhotoCount).toBe(0);
    expect(r.syncedAt).toBeUndefined();
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
  it('exports source, ordered hero, missing shots, real hotspots and no fictitious 3D', () => {
    const m = buildManifest({
      ...session,
      shots: [
        { ...shot, isHero: false, sequenceOrder: 2 },
        { ...shot, shotId: 'dashboard', shotCode: 'STEERING_DASHBOARD', sequenceOrder: 1 },
      ],
    });
    expect(m.photos[0].shotId).toBe('dashboard');
    expect(m.schemaVersion).toBe(2);
    expect(m.containsSampleMedia).toBe(true);
    expect(m.missingRequired?.length).toBeGreaterThan(0);
    expect(m.hotspots[0].targetPhotoIds).toContain('dashboard');
    expect(m.orbitSequence.suitableForSmooth360).toBe(false);
    expect(m.photos[0].quality.tiltDegrees).toBeNull();
  });
  it('fails the whole export on unreadable photo', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Unreadable'));
    await expect(
      generateSessionZip({ ...session, shots: [{ ...shot, imageDataUrl: 'blob:missing' }] })
    ).rejects.toThrow();
    spy.mockRestore();
  });
});

describe('Reference-to-camera coordinate consistency', () => {
  it.each(['4:3', '16:9', '1:1'] as const)(
    'uses the exact visible raster bounds as the detection target at %s',
    (ratio) => {
      const asset = referenceAsset('truck', 'STRAIGHT_FRONT');
      const g = referenceGeometry(asset, ratio, DEFAULT_STANDARD, {
        ...DEFAULT_OVERLAY,
        x: 0.1,
        scale: 1.2,
      });
      expect(g.target.coverage).toBeCloseTo((g.width / 1000) * 1.2);
      expect(g.target.centerX).toBeCloseTo(0.6);
      expect(g.target.centerY).toBeCloseTo(0.536);
      expect(g.h).toBeLessThanOrEqual(g.height * 0.62);
    }
  );
  it('adds only fitted features and preserves the 20-shot preset', () => {
    const base = getDefaultTemplates()[0],
      adapted = adaptTemplate(base, 'suv', { thirdRow: true, sunroof: true });
    expect(base.shots).toHaveLength(20);
    expect(adapted.shots.some((s) => s.code === 'THIRD_ROW')).toBe(true);
    expect(adapted.shots.some((s) => s.code === 'ROOF_SUNROOF')).toBe(true);
  });
});
