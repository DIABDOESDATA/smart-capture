import { describe, it, expect } from 'vitest';
import { generateSessionZip } from '@/services/export/zipExporter';
import { VehicleCaptureSession } from '@/types/capture';
import JSZip from 'jszip';

describe('ZIP Exporter & Manifest Engine', () => {
  it('generates an ordered ZIP archive with standard filenames and JSON/CSV manifests', async () => {
    // 1x1 valid sample JPEG data URL
    const mockDataUrl =
      'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';

    const mockSession: VehicleCaptureSession = {
      id: 'sess-test-01',
      dealershipId: 'dealership-ddrive-01',
      vehicleId: 'veh-01',
      templateId: 'template-ddrive-20',
      employeeId: 'emp-01',
      employeeName: 'Lot Specialist',
      status: 'completed',
      startedAt: new Date().toISOString(),
      syncPendingCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      shots: [
        {
          shotId: 's1',
          shotCode: 'FRONT_3Q_DRIVER',
          shotName: 'Front Driver-Side 3/4 (Hero)',
          sequenceOrder: 1,
          imageDataUrl: mockDataUrl,
          capturedAt: new Date().toISOString(),
          isHero: true,
          retakeCount: 0,
          quality: {
            blurScore: 120,
            isBlurry: false,
            exposure: 'normal',
            meanLuminance: 128,
            tiltDegrees: 0.5,
            isLevel: true,
            width: 1920,
            height: 1080,
            warnings: [],
          },
          syncStatus: 'local',
        },
        {
          shotId: 's2',
          shotCode: 'STRAIGHT_FRONT',
          shotName: 'Straight Front',
          sequenceOrder: 2,
          imageDataUrl: mockDataUrl,
          capturedAt: new Date().toISOString(),
          isHero: false,
          retakeCount: 0,
          quality: {
            blurScore: 110,
            isBlurry: false,
            exposure: 'normal',
            meanLuminance: 120,
            tiltDegrees: 0.0,
            isLevel: true,
            width: 1920,
            height: 1080,
            warnings: [],
          },
          syncStatus: 'local',
        },
      ],
    };

    const mockVehicle = {
      vin: '1HGCR2F83HA000000',
      year: 2023,
      make: 'Honda',
      model: 'Accord',
      bodyStyle: 'sedan' as const,
      stockNumber: 'DD-9842',
    };

    const zipBlob = await generateSessionZip(mockSession, mockVehicle);
    expect(zipBlob).toBeDefined();
    expect(zipBlob.size).toBeGreaterThan(0);

    // Unpack with JSZip to verify contents
    const zip = await JSZip.loadAsync(zipBlob);
    expect(zip.file('01_FRONT_3Q_DRIVER.jpg')).toBeDefined();
    expect(zip.file('02_STRAIGHT_FRONT.jpg')).toBeDefined();
    expect(zip.file('manifest.json')).toBeDefined();
    expect(zip.file('manifest.csv')).toBeDefined();
    expect(zip.file('README.txt')).toBeDefined();

    // Verify manifest.json structure
    const manifestJsonText = await zip.file('manifest.json')?.async('text');
    const manifest = JSON.parse(manifestJsonText || '{}');
    expect(manifest.version).toBe('2.0');
    expect(manifest.vehicle.vin).toBe('1HGCR2F83HA000000');
    expect(manifest.heroShotCode).toBe('FRONT_3Q_DRIVER');
    expect(manifest.totalPhotos).toBe(2);
    expect(manifest.photos[0].filename).toBe('01_FRONT_3Q_DRIVER.jpg');

    // Verify CSV
    const csvText = await zip.file('manifest.csv')?.async('text');
    expect(csvText).toContain('01_FRONT_3Q_DRIVER.jpg');
    expect(csvText).toContain('02_STRAIGHT_FRONT.jpg');
  });
});
