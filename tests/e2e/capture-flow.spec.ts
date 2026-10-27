import { test, expect, Page } from '@playwright/test';
import JSZip from 'jszip';
import { readFile } from 'node:fs/promises';
async function denyCamera(page: Page) {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: () => Promise.reject(new DOMException('Denied', 'NotAllowedError')),
        enumerateDevices: () => Promise.resolve([]),
      },
    });
  });
}
async function start(page: Page, body = 'sedan', preset = 'template-ddrive-20') {
  await page.goto('/');
  await page.getByRole('button', { name: 'New Photo Session' }).click();
  await page.getByPlaceholder('e.g. SC-1042').fill('PILOT-001');
  await page.locator('select').first().selectOption(body);
  await page.getByLabel('Photography checklist').selectOption(preset);
  await page.getByRole('button', { name: 'Start Guided Capture Session' }).click();
  await expect(page.getByTestId('camera-studio')).toBeVisible();
}
async function sample(page: Page) {
  await page.getByRole('button', { name: 'Use sample-photo mode' }).click();
  await expect(page.getByText(/SAMPLE MODE/)).toBeVisible();
  await page.waitForFunction(() => {
    const i = document.querySelector('image');
    return !!i;
  });
}
async function take(page: Page) {
  await page.getByRole('button', { name: 'Capture sample photo' }).click();
  await page.getByRole('button', { name: 'Keep Photo' }).click();
}
async function records(page: Page) {
  return page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const r = indexedDB.open('smart-capture-db');
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
    const tx = db.transaction(['sessions', 'media'], 'readonly');
    const sessions = await new Promise<import('../../src/types/capture').VehicleCaptureSession[]>(
      (r) => {
        const req = tx.objectStore('sessions').getAll();
        req.onsuccess = () => r(req.result);
      }
    );
    const media = await new Promise<number>((r) => {
      const req = tx.objectStore('media').count();
      req.onsuccess = () => r(req.result);
    });
    db.close();
    return { sessions, media };
  });
}

test('full premium sample checklist persists, resumes and exports 20 ordered images', async ({
  page,
  browserName,
}, info) => {
  test.setTimeout(120000);
  await denyCamera(page);
  await start(page);
  await expect(page.getByLabel('Capture vehicle photo')).toBeDisabled();
  await sample(page);
  await page.screenshot({ path: info.outputPath('camera-portrait.png') });
  const bounds = await page.locator('.viewfinder').boundingBox();
  if (!bounds) throw new Error('Camera viewfinder is missing.');
  await expect(page).toHaveScreenshot('camera-reference.png', {
    clip: {
      x: Math.round(bounds.x),
      y: Math.round(bounds.y),
      width: Math.round(bounds.width),
      height: Math.round(bounds.height),
    },
    animations: 'disabled',
    maxDiffPixelRatio: 0.04,
  });
  await take(page);
  await expect(page.getByText(/SHOT 2 OF 20/i)).toBeVisible();
  await page.getByLabel('Pause and review gallery').click();
  await expect(page.getByText('Capture Progress')).toBeVisible();
  await page.screenshot({ path: info.outputPath('gallery-partial.png'), fullPage: true });
  await page.reload();
  await page.locator('.session-row').filter({ hasText: 'PILOT-001' }).click();
  await page.getByRole('button', { name: 'Resume next missing shot' }).click();
  await expect(page.getByText(/SHOT 2 OF 20/i)).toBeVisible();
  await sample(page);
  for (let i = 1; i < 20; i++) {
    await take(page);
    await expect(page.getByRole('button', { name: 'Capture sample photo' })).toBeEnabled();
  }
  await page.getByRole('button', { name: 'Review checklist' }).click();
  await expect(page.getByText('All required shots saved')).toBeVisible();
  const data = await records(page);
  expect(data.sessions[0].shots).toHaveLength(20);
  expect(data.media).toBe(20);
  expect(data.sessions[0].status).toBe('completed');
  expect(data.sessions[0].templateSnapshot?.shots).toHaveLength(20);
  expect(
    data.sessions[0].shots.every((s) => s.source === 'sample' && s.imageId && s.imageDataUrl === '')
  ).toBe(true);
  await page.screenshot({ path: info.outputPath('gallery-complete.png'), fullPage: true });
  await page.getByRole('button', { name: 'Move FRONT_3Q_DRIVER later', exact: true }).click();
  await page.getByRole('button', { name: 'Export gallery', exact: true }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download ZIP Package' }).click();
  const download = await downloadPromise;
  let zipBytes: Buffer;
  const failure = await download.failure();
  if (failure === 'canceled' && process.platform === 'win32' && browserName === 'chromium') {
    info.annotations.push({
      type: 'environment-limit',
      description:
        'Windows sandbox cancels even minimal Chromium Blob downloads. Download event verified; archive bytes checked directly. Actual filesystem download still required on a physical Chrome device.',
    });
    const base64 = await page.evaluate(async () => {
      const modulePath = '/src/services/export/zipExporter.ts',
        storagePath = '/src/services/storage/indexedDb.ts';
      const { generateSessionZip } = await import(modulePath),
        { getSession, getAllSessions } = await import(storagePath);
      const sessions = await getAllSessions();
      const full = await getSession(sessions[0].id);
      const bytes = new Uint8Array(await (await generateSessionZip(full)).arrayBuffer());
      let text = '';
      for (let i = 0; i < bytes.length; i += 16384)
        text += String.fromCharCode(...bytes.subarray(i, i + 16384));
      return btoa(text);
    });
    zipBytes = Buffer.from(base64, 'base64');
  } else {
    expect(failure).toBeNull();
    zipBytes = await readFile((await download.path())!);
  }
  const zip = await JSZip.loadAsync(zipBytes);
  const manifest = JSON.parse(await zip.file('manifest.json')!.async('text'));
  expect(manifest.totalPhotos).toBe(20);
  expect(manifest.photos[0].shotCode).toBe('STRAIGHT_FRONT');
  expect(manifest.containsSampleMedia).toBe(true);
  expect(manifest.missingRequired).toHaveLength(0);
  expect(zip.file('02_FRONT_3Q_DRIVER.jpg')).toBeTruthy();
  expect((await zip.file('01_STRAIGHT_FRONT.jpg')!.async('uint8array')).length).toBeGreaterThan(
    5000
  );
});

test('reference settings calibrate, persist and remain usable in landscape', async ({
  page,
}, info) => {
  await denyCamera(page);
  await start(page, 'truck', 'template-wholesale-8');
  await sample(page);
  await page.getByLabel('Reference and camera settings').click();
  await page.getByLabel('Position X', { exact: true }).fill('0.12');
  await page.getByLabel('Reference scale', { exact: true }).fill('1.1');
  await page.getByRole('button', { name: 'Save reference calibration' }).click();
  await expect(page.getByText('Calibration saved on this device.')).toBeVisible();
  await page.getByRole('button', { name: 'Close controls' }).click();
  await expect(page.getByTestId('reference-overlay')).toHaveAttribute(
    'style',
    /translate\(12%(?:,\s*0%)?\) scale\(1.1\)/
  );
  await page.setViewportSize({ width: 844, height: 390 });
  await expect(page.getByLabel('Capture sample photo')).toBeInViewport();
  await page.screenshot({ path: info.outputPath('camera-landscape.png') });
  await page.getByLabel('Pause and review gallery').click();
  await page.getByRole('button', { name: 'Resume next missing shot' }).click();
  await sample(page);
  await expect(page.getByTestId('reference-overlay')).toHaveAttribute('style', /scale\(1.1\)/);
});

test('storage rejection retains review and never advances the checklist', async ({ page }) => {
  await denyCamera(page);
  await start(page);
  await sample(page);
  await page.getByLabel('Capture sample photo').click();
  await page.evaluate(() => {
    const original = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (value: unknown, key?: IDBValidKey) {
      if (this.name === 'sessions') throw new DOMException('Full', 'QuotaExceededError');
      return key === undefined ? original.call(this, value) : original.call(this, value, key);
    };
  });
  await page.getByRole('button', { name: 'Keep Photo' }).click();
  await expect(page.getByRole('alert')).toContainText('Photo was not saved');
  await expect(page.getByText(/SHOT 1 OF 20/i)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Keep Photo' })).toBeEnabled();
  const r = await records(page);
  expect(r.sessions[0].shots).toHaveLength(0);
  expect(r.media).toBe(0);
});

test('retake and hero assignment preserve identity and image history', async ({ page }) => {
  await denyCamera(page);
  await start(page, 'suv');
  await sample(page);
  await take(page);
  await expect(page.getByText(/SHOT 2 OF 20/i)).toBeVisible();
  await page.getByLabel('Previous shot').click();
  await take(page);
  await expect(page.getByText(/SHOT 2 OF 20/i)).toBeVisible();
  await take(page);
  await expect(page.getByText(/SHOT 3 OF 20/i)).toBeVisible();
  await page.getByLabel('Pause and review gallery').click();
  const r = await records(page);
  expect(r.sessions[0].shots).toHaveLength(2);
  expect(r.sessions[0].shots[0].retakeCount).toBe(1);
  expect(r.sessions[0].shots[0].previousImageId).toBeTruthy();
  await page
    .locator('.photo-card')
    .nth(1)
    .getByRole('button', { name: 'Hero', exact: true })
    .click();
  await expect(
    page.locator('.photo-card').nth(1).getByRole('button', { name: 'Hero', exact: true })
  ).toHaveAttribute('aria-pressed', 'true');
  await page.locator('.photo-tile').first().click();
  await expect(page.getByText('Before / after retake comparison')).toBeVisible();
});

test('real fake-device camera honors ratios and never saves reference artwork', async ({
  page,
  browserName,
}) => {
  test.skip(
    browserName !== 'chromium',
    'Real camera stream emulation supported in Chromium projects only.'
  );
  await start(page);
  await expect(page.getByLabel('Capture vehicle photo')).toBeEnabled();
  await page.getByLabel('Reference and camera settings').click();
  await page.getByLabel('Output ratio').selectOption('1:1');
  await page.getByRole('button', { name: 'Close controls' }).click();
  await page.getByLabel('Capture vehicle photo').click();
  await page.getByRole('button', { name: 'Keep Photo' }).click();
  await expect(page.getByText(/SHOT 2 OF 20/i)).toBeVisible();
  const data = await records(page);
  const shot = data.sessions[0].shots[0];
  expect(shot.source).toBe('camera');
  expect(shot.quality.width).toBe(shot.quality.height);
  expect(shot.metadata?.outputCrop.width).toBe(shot.metadata?.outputCrop.height);
  expect(shot.metadata?.referenceAssetId).toContain('sedan');
});

test('approved references isolate, persist and select for their exact shot', async ({ page }) => {
  await denyCamera(page);
  await start(page);
  await sample(page);
  await page.getByLabel('Reference and camera settings').click();
  await page.getByLabel('Upload approved reference').setInputFiles('public/references/sedan.png');
  await expect(page.getByAltText('Trace reference boundary')).toBeVisible();
  await page.getByRole('button', { name: 'Save isolated reference' }).click();
  await expect(page.getByText('Approved reference saved.')).toBeVisible();
  await page.getByRole('button', { name: 'Close controls' }).click();
  await expect(page.getByText('Dealership approved reference')).toBeVisible();
  await page.getByLabel('Pause and review gallery').click();
  await page.getByRole('button', { name: 'Resume next missing shot' }).click();
  await sample(page);
  await expect(page.getByText('Dealership approved reference')).toBeVisible();
});

test('photo edits retain an independent original and export both files', async ({ page }) => {
  await denyCamera(page);
  await start(page);
  await sample(page);
  await take(page);
  await expect(page.getByText(/SHOT 2 OF 20/i)).toBeVisible();
  await page.getByLabel('Pause and review gallery').click();
  await page.locator('.photo-tile').first().click();
  await page.getByRole('button', { name: 'Adjust photo' }).click();
  await page.getByRole('slider', { name: 'brightness' }).fill('1.1');
  await page.getByRole('button', { name: 'Save derivative' }).click();
  await expect(page.getByRole('button', { name: 'Adjust photo' })).toBeVisible();
  const details = await page.evaluate(async () => {
    const storagePath = '/src/services/storage/indexedDb.ts',
      exportPath = '/src/services/export/zipExporter.ts';
    const { getAllSessions, getSession, getPhotoBlob } = await import(storagePath),
      { generateSessionZip } = await import(exportPath);
    const [s] = await getAllSessions();
    const full = await getSession(s.id),
      shot = full.shots[0];
    const original = await getPhotoBlob(shot, true),
      edited = await getPhotoBlob(shot);
    return {
      edits: shot.edits,
      originalSize: original.size,
      editedSize: edited.size,
      zipSize: (await generateSessionZip(full)).size,
    };
  });
  expect(details.edits.brightness).toBe(1.1);
  expect(details.originalSize).toBeGreaterThan(5000);
  expect(details.editedSize).toBeGreaterThan(5000);
  expect(details.zipSize).toBeGreaterThan(details.originalSize + details.editedSize);
});

test('saved template settings affect new sessions and snapshots survive later changes', async ({
  page,
}) => {
  await denyCamera(page);
  await page.goto('/');
  await page.getByRole('button', { name: 'Dealership Templates' }).click();
  await page.getByLabel('Template aspect ratio').selectOption('16:9');
  await page.getByRole('button', { name: 'Required', exact: true }).first().click();
  await page.getByRole('button', { name: 'Save templates', exact: true }).click();
  await expect(page.getByText(/Templates saved/)).toBeVisible();
  await page.getByRole('button', { name: 'Smart Capture home', exact: false }).click();
  await start(page);
  const r = await records(page);
  expect(r.sessions[0].templateSnapshot?.aspectRatio).toBe('16:9');
  expect(r.sessions[0].templateSnapshot?.shots[0].isRequired).toBe(false);
  await page.getByLabel('Pause and review gallery').click();
  await page.getByRole('button', { name: '← Sessions' }).click();
  await page.getByRole('button', { name: 'Dealership Templates' }).click();
  await page.getByRole('button', { name: 'Optional', exact: true }).first().click();
  await page.getByRole('button', { name: 'Save templates', exact: true }).click();
  await expect(page.getByText(/Templates saved/)).toBeVisible();
  const after = await records(page);
  expect(after.sessions[0].templateSnapshot?.shots[0].isRequired).toBe(false);
});

test('reference uploads reject active content even with a forged PNG type', async ({ page }) => {
  await denyCamera(page);
  await start(page);
  await sample(page);
  await page.getByLabel('Reference and camera settings').click();
  await page.getByLabel('Upload approved reference').setInputFiles({
    name: 'forged.png',
    mimeType: 'image/png',
    buffer: Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg"><script>window.uploadExecuted=true</script></svg>'
    ),
  });
  await expect(page.getByText(/Upload a real PNG/)).toBeVisible();
  await expect(page.getByAltText('Trace reference boundary')).toHaveCount(0);
});
