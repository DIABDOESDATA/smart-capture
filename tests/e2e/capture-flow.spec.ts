import { test, expect } from '@playwright/test';

test.describe('Smart Capture End-to-End Guided Photography Workflow', () => {
  test('completes full dealership vehicle capture journey from VIN to ZIP export', async ({
    page,
  }) => {
    // 1. Visit App
    await page.goto('/');

    // Verify Brand Title and Dashboard
    await expect(page.getByText('SMART CAPTURE')).toBeVisible();
    await expect(page.getByText('Ready to photograph inventory?')).toBeVisible();

    // 2. Start New Session
    const newSessionBtn = page.getByRole('button', { name: /New Photo Session/i }).first();
    await newSessionBtn.click();

    // Verify Vehicle Identification View
    await expect(page.getByRole('heading', { name: 'Vehicle Identification' })).toBeVisible();

    // 3. Enter VIN
    const vinInput = page.getByPlaceholder(/e.g. 1HGCR2F83HA000000/i);
    await vinInput.fill('1HGCR2F85HA000000');

    // Tap Decode Button
    const decodeBtn = page.getByRole('button', { name: /Decode/i });
    await decodeBtn.click();

    // Verify Body Classification Selection
    const bodySelect = page.locator('select');
    await expect(bodySelect).toBeVisible();

    // Select Sedan
    await bodySelect.selectOption('sedan');

    // 4. Start Guided Capture
    const startCaptureBtn = page.getByRole('button', {
      name: /Start Guided Capture Session/i,
    });
    await startCaptureBtn.click();

    // 5. Verify Camera Viewfinder & HUD
    await expect(page.getByText(/Shot 1 of/i)).toBeVisible();
    await expect(page.getByText(/Front Driver-Side 3\/4/i)).toBeVisible();

    // 6. Capture Shot #1 via Shutter
    const shutterBtn = page.getByLabel('Capture vehicle photo');
    await expect(shutterBtn).toBeVisible();
    await shutterBtn.click();

    // Verify Review Mode (Keep Photo or Retake)
    const keepBtn = page.getByRole('button', { name: /Keep Photo/i });
    await expect(keepBtn).toBeVisible();
    await keepBtn.click();

    // Advance to Shot #2
    await expect(page.getByText(/Shot 2 of/i)).toBeVisible();

    // Capture Shot #2
    await shutterBtn.click();
    await keepBtn.click();

    // 7. Finish Session
    const finishBtn = page.getByRole('button', { name: /Finish/i });
    if (await finishBtn.isVisible()) {
      await finishBtn.click();
    } else {
      // Close camera to gallery
      const closeCameraBtn = page.locator('button:has(svg.lucide-x)').first();
      await closeCameraBtn.click();
    }

    // 8. Verify Session Gallery
    await expect(page.getByText(/Capture Progress/i)).toBeVisible();
    await expect(page.getByText(/Export & Sync/i)).toBeVisible();

    // 9. Open Export Modal
    const exportBtn = page.getByRole('button', { name: /Export & Sync/i });
    await exportBtn.click();

    await expect(page.getByText('Export Vehicle Gallery')).toBeVisible();
    await expect(page.getByText('Standardized Dealership ZIP Package')).toBeVisible();
    await expect(page.getByRole('button', { name: /Download ZIP Package/i })).toBeVisible();
  });
});
