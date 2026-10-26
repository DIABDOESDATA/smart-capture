/* global process, console, setTimeout, fetch, navigator */
import { chromium, webkit } from '@playwright/test';
import { spawn } from 'node:child_process';
import { mkdir, writeFile, access } from 'node:fs/promises';
const url = process.env.OFFLINE_TEST_URL || 'http://localhost:4175';
let server;
const results = [];
try {
  if (!process.env.OFFLINE_TEST_URL) {
    await access('dist/index.html');
    server = spawn(
      process.execPath,
      [
        'node_modules/vite/bin/vite.js',
        'preview',
        '--host',
        '0.0.0.0',
        '--port',
        '4175',
        '--strictPort',
      ],
      { stdio: 'ignore', windowsHide: true }
    );
    let ready = false;
    for (let i = 0; i < 80; i++) {
      try {
        if ((await fetch(url)).ok) {
          ready = true;
          break;
        }
      } catch {
        /* starting */
      }
      await new Promise((r) => setTimeout(r, 250));
    }
    if (!ready) throw new Error('Production preview did not start. Run npm run build first.');
  }
  for (const [name, engine] of [
    ['chromium', chromium],
    ['webkit', webkit],
  ]) {
    const browser = await engine.launch();
    try {
      const context = await browser.newContext({ acceptDownloads: true });
      const page = await context.newPage({ viewport: { width: 390, height: 844 } });
      page.setDefaultTimeout(15000);
      const errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await page.addInitScript(() =>
        Object.defineProperty(navigator, 'mediaDevices', {
          configurable: true,
          value: {
            getUserMedia: () => Promise.reject(new Error('Test camera denial')),
            enumerateDevices: () => Promise.resolve([]),
          },
        })
      );
      await page.goto(url);
      await page.evaluate(() =>
        Promise.race([
          navigator.serviceWorker.ready,
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Offline shell failed to activate')), 15000)
          ),
        ])
      );
      await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
      await page.getByRole('button', { name: 'New Photo Session' }).click();
      await page.getByPlaceholder('e.g. DD-8472').fill('OFFLINE-CHECK');
      await page.getByRole('button', { name: 'Start Guided Capture Session' }).click();
      await page.getByRole('button', { name: 'Use sample-photo mode' }).click();
      await page.getByLabel('Capture sample photo').click();
      await page.getByRole('button', { name: 'Keep Photo' }).click();
      await page.getByText(/SHOT 2 OF 20/i).waitFor();
      await page.getByLabel('Pause and review gallery').click();
      await context.setOffline(true);
      await page.reload();
      await page.getByRole('button', { name: /OFFLINE-CHECK/ }).click();
      await page.getByText('1 / 20 saved').waitFor();
      const thumbnail = page.locator('.photo-tile img').first();
      await thumbnail.evaluate((img) => img.decode());
      await page.getByRole('button', { name: 'Export gallery', exact: true }).click();
      const downloading = page.waitForEvent('download');
      await page.getByRole('button', { name: 'Download ZIP Package' }).click();
      const download = await downloading;
      const failure = await download.failure();
      if (
        failure &&
        !(process.platform === 'win32' && name === 'chromium' && failure === 'canceled')
      )
        throw new Error(`Offline export download failed: ${failure}`);
      if (errors.length) throw new Error(errors.join('\n'));
      results.push({
        engine: name,
        offlineReload: true,
        photoDecoded: true,
        exportTriggered: true,
        downloadFailure: failure,
        pageErrors: errors,
      });
    } finally {
      await browser.close();
    }
  }
} catch (e) {
  results.push({ error: String(e) });
  process.exitCode = 1;
} finally {
  server?.kill();
  await mkdir('test-results', { recursive: true });
  await writeFile('test-results/offline-report.json', JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));
}
