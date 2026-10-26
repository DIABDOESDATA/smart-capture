/* global process, console, document, Image, navigator */
import { chromium } from '@playwright/test';
import { writeFile, mkdir } from 'node:fs/promises';
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.goto(process.env.BENCHMARK_URL || 'http://localhost:5173');
  const result = await page.evaluate(async () => {
    const modulePath = '/src/services/camera/detector.ts',
      assetsPath = '/src/services/references/assets.ts';
    const { CocoVehicleDetector } = await import(modulePath),
      { referenceAsset } = await import(assetsPath);
    const detector = new CocoVehicleDetector();
    await detector.load();
    try {
      const cases = [];
      for (const body of ['sedan', 'suv', 'truck']) {
        const a = referenceAsset(body, 'FRONT_3Q_DRIVER'),
          img = new Image();
        img.src = a.url;
        await img.decode();
        const canvas = document.createElement('canvas');
        canvas.width = 320;
        canvas.height = 240;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#999';
        ctx.fillRect(0, 0, 320, 240);
        ctx.drawImage(img, ...a.rect, 35, 38, 250, 155);
        const predictions = [];
        for (let i = 0; i < 5; i++) predictions.push(await detector.detect(canvas));
        cases.push({ body, predictions });
      }
      const blank = document.createElement('canvas');
      blank.width = 320;
      blank.height = 240;
      return {
        benchmark: detector.benchmark,
        cases,
        noVehicle: await detector.detect(blank),
        userAgent: navigator.userAgent,
      };
    } finally {
      detector.dispose();
    }
  });
  await mkdir('test-results', { recursive: true });
  await writeFile('test-results/detector-benchmark.json', JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result.benchmark, null, 2));
} finally {
  await browser.close();
}
