import JSZip from 'jszip';
import { VehicleCaptureSession } from '@/types/capture';
import { Vehicle } from '@/types/vehicle';

export interface ExportManifest {
  version: '1.0';
  generatedAt: string;
  sessionId: string;
  dealershipId: string;
  vehicle: {
    vin?: string;
    year?: number;
    make?: string;
    model?: string;
    trim?: string;
    bodyStyle: string;
    stockNumber?: string;
  };
  heroShotCode: string;
  totalPhotos: number;
  photos: {
    order: number;
    filename: string;
    shotCode: string;
    shotName: string;
    isHero: boolean;
    capturedAt: string;
    quality: {
      blurScore: number;
      exposure: string;
      tiltDegrees: number;
    };
  }[];
}

/**
 * Helper to convert data URL or Blob to ArrayBuffer
 */
async function dataUrlToArrayBuffer(dataUrl: string): Promise<ArrayBuffer> {
  if (dataUrl.startsWith('data:')) {
    const base64Index = dataUrl.indexOf(';base64,');
    if (base64Index !== -1) {
      const base64 = dataUrl.slice(base64Index + 8);
      const binaryStr = atob(base64);
      const len = binaryStr.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
      return bytes.buffer;
    }
  }
  const res = await fetch(dataUrl);
  return res.arrayBuffer();
}

/**
 * Generates an ordered ZIP archive with standardized dealership filenames and manifest.
 */
export async function generateSessionZip(
  session: VehicleCaptureSession,
  vehicle: Partial<Vehicle> = {}
): Promise<Blob> {
  const zip = new JSZip();

  // Sort shots by sequenceOrder
  const sortedShots = [...session.shots].sort((a, b) => a.sequenceOrder - b.sequenceOrder);
  const heroShot = sortedShots.find((s) => s.isHero) || sortedShots[0];

  const manifestPhotos: ExportManifest['photos'] = [];
  const csvRows: string[] = [
    'Order,Filename,ShotCode,ShotName,IsHero,CapturedAt,BlurScore,Exposure,TiltDegrees',
  ];

  for (let i = 0; i < sortedShots.length; i++) {
    const shot = sortedShots[i];
    const sequenceNumber = String(i + 1).padStart(2, '0');
    const filename = `${sequenceNumber}_${shot.shotCode}.jpg`;

    try {
      const buffer = await dataUrlToArrayBuffer(shot.imageDataUrl);
      zip.file(filename, buffer);

      manifestPhotos.push({
        order: i + 1,
        filename,
        shotCode: shot.shotCode,
        shotName: shot.shotName,
        isHero: shot.isHero,
        capturedAt: shot.capturedAt,
        quality: {
          blurScore: shot.quality.blurScore,
          exposure: shot.quality.exposure,
          tiltDegrees: shot.quality.tiltDegrees,
        },
      });

      csvRows.push(
        [
          i + 1,
          filename,
          shot.shotCode,
          `"${shot.shotName}"`,
          shot.isHero,
          shot.capturedAt,
          shot.quality.blurScore,
          shot.quality.exposure,
          shot.quality.tiltDegrees,
        ].join(',')
      );
    } catch (err) {
      console.error(`Failed to pack shot ${filename} into zip:`, err);
    }
  }

  // Construct manifest.json
  const manifest: ExportManifest = {
    version: '1.0',
    generatedAt: new Date().toISOString(),
    sessionId: session.id,
    dealershipId: session.dealershipId,
    vehicle: {
      vin: vehicle.vin,
      year: vehicle.year,
      make: vehicle.make,
      model: vehicle.model,
      trim: vehicle.trim,
      bodyStyle: vehicle.bodyStyle || 'sedan',
      stockNumber: vehicle.stockNumber,
    },
    heroShotCode: heroShot?.shotCode || 'FRONT_3Q_DRIVER',
    totalPhotos: manifestPhotos.length,
    photos: manifestPhotos,
  };

  zip.file('manifest.json', JSON.stringify(manifest, null, 2));
  zip.file('manifest.csv', csvRows.join('\n'));

  // Add README instruction file inside zip
  const readme = [
    '# Smart Capture Gallery Export',
    `VIN: ${vehicle.vin || 'N/A'}`,
    `Vehicle: ${[vehicle.year, vehicle.make, vehicle.model, vehicle.trim].filter(Boolean).join(' ')}`,
    `Total Images: ${manifestPhotos.length}`,
    `Hero Photo: ${heroShot ? `01_${heroShot.shotCode}.jpg` : 'None'}`,
    '',
    'Exported with standardized dealership sequence filenames for DMS inventory upload.',
  ].join('\n');
  zip.file('README.txt', readme);

  return zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });
}

/**
 * Initiates browser file download
 */
export function triggerFileDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
