import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { VehicleCaptureSession, CapturedShot } from '@/types/capture';
import { Vehicle } from '@/types/vehicle';
import { Dealership } from '@/types/dealership';
interface MediaRecord {
  id: string;
  sessionId: string;
  original: Blob | ArrayBuffer;
  thumbnail: Blob | ArrayBuffer;
  derivative?: Blob | ArrayBuffer;
}
function asBlob(value: Blob | ArrayBuffer): Blob {
  return value instanceof Blob ? value : new Blob([value], { type: 'image/jpeg' });
}
interface SmartCaptureDB extends DBSchema {
  sessions: {
    key: string;
    value: VehicleCaptureSession;
    indexes: { 'by-dealership': string; 'by-vehicle': string; 'by-status': string };
  };
  vehicles: { key: string; value: Vehicle; indexes: { 'by-dealership': string; 'by-vin': string } };
  dealerships: { key: string; value: Dealership };
  media: { key: string; value: MediaRecord; indexes: { 'by-session': string } };
  settings: { key: string; value: unknown };
  uploadQueue: {
    key: string;
    value: {
      id: string;
      sessionId: string;
      shotId: string;
      blobData: Blob;
      fileName: string;
      retryCount: number;
      lastAttemptAt?: string;
      error?: string;
    };
    indexes: { 'by-session': string };
  };
}
let dbPromise: Promise<IDBPDatabase<SmartCaptureDB>> | null = null;
export function getDb() {
  if (!dbPromise)
    dbPromise = openDB<SmartCaptureDB>('smart-capture-db', 2, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          const s = db.createObjectStore('sessions', { keyPath: 'id' });
          s.createIndex('by-dealership', 'dealershipId');
          s.createIndex('by-vehicle', 'vehicleId');
          s.createIndex('by-status', 'status');
          const v = db.createObjectStore('vehicles', { keyPath: 'id' });
          v.createIndex('by-dealership', 'dealershipId');
          v.createIndex('by-vin', 'vin');
          db.createObjectStore('dealerships', { keyPath: 'id' });
          db.createObjectStore('uploadQueue', { keyPath: 'id' }).createIndex(
            'by-session',
            'sessionId'
          );
        }
        if (oldVersion < 2) {
          db.createObjectStore('media', { keyPath: 'id' }).createIndex('by-session', 'sessionId');
          db.createObjectStore('settings');
        }
      },
      blocking() {
        void dbPromise?.then((db) => db.close());
        dbPromise = null;
      },
    }).catch((e) => {
      dbPromise = null;
      throw e;
    });
  return dbPromise;
}
export async function makeThumbnail(blob: Blob): Promise<Blob> {
  // Tests/headless environments may lack a decoder; production browsers use a 320px thumbnail.
  if (typeof Image === 'undefined' || !Image.prototype.decode) return blob;
  const url = URL.createObjectURL(blob);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const c = document.createElement('canvas');
    c.width = 320;
    c.height = Math.max(1, Math.round((320 * image.height) / image.width));
    const ctx = c.getContext('2d');
    if (!ctx) return blob;
    ctx.drawImage(image, 0, 0, c.width, c.height);
    return await new Promise((resolve) => c.toBlob((b) => resolve(b || blob), 'image/jpeg', 0.7));
  } finally {
    URL.revokeObjectURL(url);
  }
}
export async function saveSession(session: VehicleCaptureSession): Promise<void> {
  const media: MediaRecord[] = [];
  const shots: CapturedShot[] = [];
  for (const shot of session.shots) {
    let imageId = shot.imageId;
    if (shot.rawBlob || (!imageId && shot.imageDataUrl.startsWith('data:'))) {
      const original = shot.rawBlob || (await (await fetch(shot.imageDataUrl)).blob());
      imageId = crypto.randomUUID();
      media.push({
        id: imageId,
        sessionId: session.id,
        original,
        thumbnail: await makeThumbnail(original),
      });
      // Assign the durable key after commit only (below).
    }
    shots.push({
      ...shot,
      imageId,
      source: shot.source || 'legacy_unknown',
      imageDataUrl: imageId ? '' : shot.imageDataUrl,
      thumbnailUrl: undefined,
      rawBlob: undefined,
    });
  }
  const db = await getDb();
  const commit = async (records: MediaRecord[]) => {
    const tx = db.transaction(['sessions', 'media'], 'readwrite');
    try {
      for (const item of records) await tx.objectStore('media').put(item);
      await tx.objectStore('sessions').put({ ...session, schemaVersion: 2, shots });
      await tx.done;
    } catch (error) {
      try {
        tx.abort();
      } catch {
        /* already aborted */
      }
      await tx.done.catch(() => {});
      throw error;
    }
  };
  try {
    await commit(media);
  } catch (error) {
    // Some WebKit ports cannot persist Blob backing files. Retry identical bytes atomically.
    if (media.length && error instanceof Error && /Blob|File data|DataClone/i.test(error.message))
      await commit(
        await Promise.all(
          media.map(async (m) => ({
            ...m,
            original: await asBlob(m.original).arrayBuffer(),
            thumbnail: await asBlob(m.thumbnail).arrayBuffer(),
          }))
        )
      );
    else throw error;
  }
  session.shots.forEach((s, i) => {
    s.imageId = shots[i].imageId;
    s.rawBlob = undefined;
  });
}
async function hydrate(session: VehicleCaptureSession, thumbnails: boolean) {
  const db = await getDb();
  return {
    ...session,
    shots: await Promise.all(
      session.shots.map(async (s) => {
        if (!s.imageId) return { ...s, source: s.source || ('legacy_unknown' as const) };
        const m = await db.get('media', s.imageId);
        if (!m)
          throw new Error('A saved image is missing. Keep this session and restore from export.');
        const thumbnailUrl = URL.createObjectURL(asBlob(m.thumbnail));
        return {
          ...s,
          thumbnailUrl,
          imageDataUrl: thumbnails
            ? thumbnailUrl
            : URL.createObjectURL(asBlob(m.derivative || m.original)),
        };
      })
    ),
  };
}
export function releaseSession(session: VehicleCaptureSession) {
  session.shots.forEach((s) => {
    [s.imageDataUrl, s.thumbnailUrl].forEach((u) => {
      if (u?.startsWith('blob:')) URL.revokeObjectURL(u);
    });
  });
}
export async function getSession(id: string) {
  const s = await (await getDb()).get('sessions', id);
  return s ? hydrate(s, false) : undefined;
}
export async function getAllSessions(dealershipId?: string) {
  const db = await getDb();
  const sessions = dealershipId
    ? await db.getAllFromIndex('sessions', 'by-dealership', dealershipId)
    : await db.getAll('sessions');
  // Lazy, atomic v1 migration retains the original record if conversion fails.
  for (const s of sessions)
    if (s.shots.some((p) => !p.imageId && p.imageDataUrl.startsWith('data:'))) await saveSession(s);
  return Promise.all(sessions.map((s) => hydrate(s, true)));
}
export async function getPhotoBlob(shot: CapturedShot, original = false) {
  if (shot.imageId) {
    const m = await (await getDb()).get('media', shot.imageId);
    if (!m) throw new Error('Photo not found in local storage.');
    return asBlob(original ? m.original : m.derivative || m.original);
  }
  if (!shot.imageDataUrl) throw new Error('Photo data is unavailable.');
  const r = await fetch(shot.imageDataUrl);
  if (!r.ok) throw new Error('Photo could not be read.');
  return r.blob();
}
export async function getMediaBlob(id: string) {
  const m = await (await getDb()).get('media', id);
  if (!m) throw new Error('Previous photo is unavailable.');
  return asBlob(m.original);
}
async function writeEdit(shot: CapturedShot, blob: Blob | undefined, edits: CapturedShot['edits']) {
  if (!shot.imageId) throw new Error('Original must be saved first.');
  const db = await getDb(),
    m = await db.get('media', shot.imageId);
  if (!m) throw new Error('Original missing.');
  const original = asBlob(m.original),
    thumbnail = await (await makeThumbnail(blob || original)).arrayBuffer(),
    derivative = blob ? await blob.arrayBuffer() : undefined;
  const tx = db.transaction(['media', 'sessions'], 'readwrite');
  try {
    const session = await tx.objectStore('sessions').get(m.sessionId);
    if (!session) throw new Error('Session missing.');
    await tx.objectStore('media').put({ ...m, thumbnail, derivative });
    await tx.objectStore('sessions').put({
      ...session,
      shots: session.shots.map((s) => (s.shotId === shot.shotId ? { ...s, edits } : s)),
    });
    await tx.done;
  } catch (error) {
    try {
      tx.abort();
    } catch {
      /* already aborted */
    }
    await tx.done.catch(() => {});
    throw error;
  }
}
export async function saveDerivative(
  shot: CapturedShot,
  blob: Blob,
  edits?: CapturedShot['edits']
) {
  await writeEdit(shot, blob, edits);
}
export async function clearDerivative(shot: CapturedShot) {
  await writeEdit(shot, undefined, undefined);
}
export async function deleteSession(id: string) {
  const db = await getDb();
  const tx = db.transaction(['sessions', 'media', 'uploadQueue'], 'readwrite');
  for (const store of ['media', 'uploadQueue'] as const) {
    const keys = await tx.objectStore(store).index('by-session').getAllKeys(id);
    for (const k of keys) await tx.objectStore(store).delete(k);
  }
  await tx.objectStore('sessions').delete(id);
  await tx.done;
}
export async function saveVehicle(v: Vehicle) {
  await (await getDb()).put('vehicles', v);
}
export async function getVehicle(id: string) {
  return (await getDb()).get('vehicles', id);
}
export async function getAllVehicles(id: string) {
  return (await getDb()).getAllFromIndex('vehicles', 'by-dealership', id);
}
export async function saveDealership(d: Dealership) {
  await (await getDb()).put('dealerships', d);
}
export async function getDealership(id: string) {
  return (await getDb()).get('dealerships', id);
}
export async function getAllDealerships() {
  return (await getDb()).getAll('dealerships');
}
export async function getSetting<T>(key: string): Promise<T | undefined> {
  return (await getDb()).get('settings', key) as Promise<T | undefined>;
}
export async function putSetting<T>(key: string, value: T) {
  await (await getDb()).put('settings', value, key);
}
export async function enqueueShotUpload(sessionId: string, shot: CapturedShot, blob: Blob) {
  await (
    await getDb()
  ).put('uploadQueue', {
    id: `${sessionId}_${shot.shotCode}`,
    sessionId,
    shotId: shot.shotId,
    blobData: blob,
    fileName: `${shot.shotCode}.jpg`,
    retryCount: 0,
  });
}
export async function getPendingUploadCount() {
  return (await getDb()).count('uploadQueue');
}
export async function getUploadQueueForSession(id: string) {
  return (await getDb()).getAllFromIndex('uploadQueue', 'by-session', id);
}
export function storageError(e: unknown) {
  return e instanceof DOMException && e.name === 'QuotaExceededError'
    ? 'Device storage is full. Photo was not saved. Export existing sessions to free space, then retry.'
    : `Local save failed. Keep this screen open and retry. ${e instanceof Error ? e.message : ''}`;
}
