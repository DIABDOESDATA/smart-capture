import 'fake-indexeddb/auto';
import { openDB } from 'idb';
import { describe, it, expect, vi } from 'vitest';
import { getDb, saveSession, getSession, getAllSessions } from '@/services/storage/indexedDb';

import { loadTemplates, persistTemplates } from '@/services/templates/repository';
import { getDefaultTemplates } from '@/services/templates/defaultTemplates';
import { VehicleCaptureSession } from '@/types/capture';
vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');
const original = 'data:image/jpeg;base64,aGVsbG8=';
const s: VehicleCaptureSession = {
  id: 'migration-session',
  dealershipId: 'dealer',
  vehicleId: 'vehicle',
  templateId: 'template-ddrive-20',
  employeeId: 'local',
  employeeName: 'Local',
  status: 'paused',
  startedAt: 'now',
  createdAt: 'now',
  updatedAt: 'now',
  syncPendingCount: 0,
  shots: [
    {
      shotId: 'a',
      shotCode: 'FRONT_3Q_DRIVER',
      shotName: 'Hero',
      sequenceOrder: 1,
      imageDataUrl: original,
      capturedAt: 'now',
      isHero: true,
      retakeCount: 0,
      syncStatus: 'local',
      quality: {
        width: 1600,
        height: 1200,
        blurScore: 120,
        isBlurry: false,
        meanLuminance: 128,
        exposure: 'normal',
        tiltDegrees: null,
        isLevel: null,
        warnings: [],
      },
    },
  ],
};
describe('Migration-safe local persistence', () => {
  it('upgrades an actual v1 database and migrates data URLs to separate Blob records', async () => {
    const old = await openDB('smart-capture-db', 1, {
      upgrade(db) {
        const sessions = db.createObjectStore('sessions', { keyPath: 'id' });
        sessions.createIndex('by-dealership', 'dealershipId');
        sessions.createIndex('by-vehicle', 'vehicleId');
        sessions.createIndex('by-status', 'status');
        const vehicles = db.createObjectStore('vehicles', { keyPath: 'id' });
        vehicles.createIndex('by-dealership', 'dealershipId');
        vehicles.createIndex('by-vin', 'vin');
        db.createObjectStore('dealerships', { keyPath: 'id' });
        db.createObjectStore('uploadQueue', { keyPath: 'id' }).createIndex(
          'by-session',
          'sessionId'
        );
      },
    });
    await old.put('sessions', s);
    old.close();
    const loaded = await getAllSessions('dealer');
    expect(loaded).toHaveLength(1);
    const db = await getDb();
    expect(db.version).toBe(2);
    const metadata = await db.get('sessions', s.id);
    expect(metadata?.shots[0].imageDataUrl).toBe('');
    expect(metadata?.shots[0].source).toBe('legacy_unknown');
    expect(await db.count('media')).toBe(1);
    expect((await getSession(s.id))?.vehicleId).toBe('vehicle');
  });
  it('does not duplicate media when metadata saves retry', async () => {
    const session = (await getSession(s.id))!;
    await saveSession(session);
    await saveSession(session);
    expect(await (await getDb()).count('media')).toBe(1);
  });
  it('rolls back media and session together if session write fails', async () => {
    const db = await getDb(),
      before = await db.count('media');
    const failure = structuredClone(s);
    failure.id = 'failed-session';
    const put = vi.spyOn(IDBObjectStore.prototype, 'put');
    put.mockImplementation(function (this: IDBObjectStore, value: unknown, key?: IDBValidKey) {
      if (this.name === 'sessions') throw new DOMException('Full', 'QuotaExceededError');
      return originalPut.call(this, value, key);
    });
    await expect(saveSession(failure)).rejects.toThrow();
    put.mockRestore();
    expect(await db.count('media')).toBe(before);
    expect(await db.get('sessions', 'failed-session')).toBeUndefined();
  });
  it('persists required/hero settings for new sessions without rewriting snapshots', async () => {
    const templates = getDefaultTemplates('dealer');
    templates[0].shots[0].isRequired = false;
    await persistTemplates('dealer', templates);
    expect((await loadTemplates('dealer'))[0].shots[0].isRequired).toBe(false);
    expect((await getSession(s.id))?.shots[0].isHero).toBe(true);
  });
});
const originalPut = IDBObjectStore.prototype.put;
