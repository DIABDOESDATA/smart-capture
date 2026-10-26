import { test, expect, Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function startSample(page: Page) {
  await page.addInitScript(() =>
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: () => Promise.reject(new DOMException('Test denial', 'NotAllowedError')),
        enumerateDevices: async () => [],
      },
    })
  );
  await page.goto('/');
  await page.getByRole('button', { name: 'New Photo Session' }).click();
  await page.getByLabel('Stock number').fill('RELEASE-001');
  await page.getByRole('button', { name: 'Start Guided Capture Session' }).click();
  await page.getByRole('button', { name: 'Use sample-photo mode' }).click();
}
test('studio home, install guide and vehicle setup are accessible and fit the viewport', async ({
  page,
}, info) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Every time.');
  await page.screenshot({ path: info.outputPath('release-home.png'), fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const home = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(home.violations).toEqual([]);
  await page.getByRole('button', { name: 'Studio settings' }).click();
  const dialog = page.getByRole('dialog', { name: 'Studio settings' });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('Add to Home');
  await page.screenshot({ path: info.outputPath('release-settings.png') });
  const settings = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(settings.violations).toEqual([]);
  await page.getByLabel('Studio name', { exact: true }).fill('Northline Motors');
  await page.getByRole('button', { name: 'Save studio name' }).click();
  await expect(page.getByRole('status')).toContainText('Studio name saved');
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Smart Capture home' })).toContainText(
    'Northline Motors'
  );
  await page.getByRole('button', { name: 'New Photo Session' }).click();
  await page.screenshot({ path: info.outputPath('release-vehicle-form.png'), fullPage: true });
  const form = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(form.violations).toEqual([]);
  const input = await page.getByLabel('Vehicle VIN').boundingBox(),
    decode = await page.getByRole('button', { name: 'Decode', exact: true }).boundingBox();
  expect(input && decode && input.x + input.width <= decode.x).toBeTruthy();
});
test('unsaved photo guard retains the frame and saves before exiting', async ({ page }, info) => {
  await startSample(page);
  await page.getByRole('button', { name: 'Capture sample photo' }).click();
  await page.getByLabel('Pause and review gallery').click();
  await expect(page.getByRole('dialog', { name: 'Keep this photograph?' })).toBeVisible();
  await page.getByRole('button', { name: 'Continue reviewing' }).click();
  await expect(page.getByAltText('Captured Preview')).toBeVisible();
  await page.getByLabel('Pause and review gallery').click();
  await page.getByRole('button', { name: 'Keep and review gallery' }).click();
  await expect(page.getByRole('heading', { name: '1 / 20 saved', exact: true })).toBeVisible();
  await page.screenshot({ path: info.outputPath('release-gallery.png'), fullPage: true });
  const gallery = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(gallery.violations).toEqual([]);
  await page.reload();
  await page.locator('.session-row').filter({ hasText: 'RELEASE-001' }).click();
  await expect(page.getByRole('heading', { name: '1 / 20 saved', exact: true })).toBeVisible();
});
test('camera ratios remain visible in portrait and landscape', async ({ page }, info) => {
  await startSample(page);
  for (const size of [
    { width: 390, height: 844 },
    { width: 844, height: 390 },
  ]) {
    await page.setViewportSize(size);
    for (const ratio of ['4:3', '16:9', '1:1']) {
      await page.getByLabel('Reference and camera settings').click();
      await page.getByLabel('Output ratio').selectOption(ratio);
      await page.getByRole('button', { name: 'Close controls' }).click();
      const frame = await page.locator('.viewfinder').boundingBox();
      const shutter = await page.getByLabel('Capture sample photo').boundingBox();
      expect(
        frame &&
          frame.width > 100 &&
          frame.height > 100 &&
          frame.y >= 0 &&
          frame.y + frame.height <= size.height
      ).toBeTruthy();
      expect(
        shutter &&
          shutter.y + shutter.height <= size.height &&
          shutter.x + shutter.width <= size.width
      ).toBeTruthy();
      const [w, h] = ratio.split(':').map(Number);
      expect(frame!.width / frame!.height).toBeCloseTo(w / h, 1);
    }
    await page.screenshot({ path: info.outputPath(`release-camera-${size.width}.png`) });
  }
});
test('deletion requires confirmation and cancel preserves the session', async ({ page }) => {
  await startSample(page);
  await page.getByLabel('Pause and review gallery').click();
  await page.getByRole('button', { name: '← Sessions' }).click();
  await page.getByRole('button', { name: 'Delete RELEASE-001 session' }).click();
  await page.getByRole('button', { name: 'Keep session' }).click();
  await expect(page.locator('.session-row').filter({ hasText: 'RELEASE-001' })).toBeVisible();
  await page.getByLabel('Search sessions').fill('does-not-exist');
  await expect(page.getByText('No sessions match your search.')).toBeVisible();
  await page.getByRole('button', { name: 'Clear filters' }).click();
  await expect(page.locator('.session-row').filter({ hasText: 'RELEASE-001' })).toBeVisible();
});
