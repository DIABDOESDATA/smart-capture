import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { VehicleCaptureSession, CapturedShot } from '@/types/capture';
import { Vehicle } from '@/types/vehicle';
import { Dealership } from '@/types/dealership';

interface SmartCaptureDB extends DBSchema {
  sessions: {
    key: string;
    value: VehicleCaptureSession;
    indexes: { 'by-dealership': string; 'by-vehicle': string; 'by-status': string };
  };
  vehicles: {
    key: string;
    value: Vehicle;
    indexes: { 'by-dealership': string; 'by-vin': string };
  };
  dealerships: {
    key: string;
    value: Dealership;
  };
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

const DB_NAME = 'smart-capture-db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<SmartCaptureDB>> | null = null;

function getDb(): Promise<IDBPDatabase<SmartCaptureDB>> {
  if (!dbPromise) {
    dbPromise = openDB<SmartCaptureDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Sessions Store
        const sessionStore = db.createObjectStore('sessions', { keyPath: 'id' });
        sessionStore.createIndex('by-dealership', 'dealershipId');
        sessionStore.createIndex('by-vehicle', 'vehicleId');
        sessionStore.createIndex('by-status', 'status');

        // Vehicles Store
        const vehicleStore = db.createObjectStore('vehicles', { keyPath: 'id' });
        vehicleStore.createIndex('by-dealership', 'dealershipId');
        vehicleStore.createIndex('by-vin', 'vin');

        // Dealerships Store
        db.createObjectStore('dealerships', { keyPath: 'id' });

        // Upload Queue Store
        const queueStore = db.createObjectStore('uploadQueue', { keyPath: 'id' });
        queueStore.createIndex('by-session', 'sessionId');
      },
    });
  }
  return dbPromise;
}

// Session Operations
export async function saveSession(session: VehicleCaptureSession): Promise<void> {
  const db = await getDb();
  await db.put('sessions', session);
}

export async function getSession(id: string): Promise<VehicleCaptureSession | undefined> {
  const db = await getDb();
  return db.get('sessions', id);
}

export async function getAllSessions(dealershipId?: string): Promise<VehicleCaptureSession[]> {
  const db = await getDb();
  if (dealershipId) {
    return db.getAllFromIndex('sessions', 'by-dealership', dealershipId);
  }
  return db.getAll('sessions');
}

export async function deleteSession(id: string): Promise<void> {
  const db = await getDb();
  await db.delete('sessions', id);
}

// Vehicle Operations
export async function saveVehicle(vehicle: Vehicle): Promise<void> {
  const db = await getDb();
  await db.put('vehicles', vehicle);
}

export async function getVehicle(id: string): Promise<Vehicle | undefined> {
  const db = await getDb();
  return db.get('vehicles', id);
}

export async function getAllVehicles(dealershipId: string): Promise<Vehicle[]> {
  const db = await getDb();
  return db.getAllFromIndex('vehicles', 'by-dealership', dealershipId);
}

// Dealership Operations
export async function saveDealership(dealership: Dealership): Promise<void> {
  const db = await getDb();
  await db.put('dealerships', dealership);
}

export async function getDealership(id: string): Promise<Dealership | undefined> {
  const db = await getDb();
  return db.get('dealerships', id);
}

export async function getAllDealerships(): Promise<Dealership[]> {
  const db = await getDb();
  return db.getAll('dealerships');
}

// Upload Queue Operations
export async function enqueueShotUpload(
  sessionId: string,
  shot: CapturedShot,
  blob: Blob
): Promise<void> {
  const db = await getDb();
  await db.put('uploadQueue', {
    id: `${sessionId}_${shot.shotId}`,
    sessionId,
    shotId: shot.shotId,
    blobData: blob,
    fileName: `${String(shot.sequenceOrder).padStart(2, '0')}_${shot.shotCode}.jpg`,
    retryCount: 0,
  });
}

export async function getPendingUploadCount(): Promise<number> {
  const db = await getDb();
  return db.count('uploadQueue');
}

export async function getUploadQueueForSession(sessionId: string) {
  const db = await getDb();
  return db.getAllFromIndex('uploadQueue', 'by-session', sessionId);
}
