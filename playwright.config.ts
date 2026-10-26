import path from 'node:path';
import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E configuration for Smart Capture
 * Includes mobile-first viewports (iPhone, Android, iPad, Desktop)
 * and camera media stream mocks.
 */
export default defineConfig({
  testDir: './tests/e2e',
  snapshotPathTemplate: '{testDir}/snapshots/{projectName}/{arg}{ext}',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  failOnFlakyTests: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    acceptDownloads: true,
    launchOptions: { downloadsPath: path.resolve('test-results/downloads') },
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'Mobile-Safari-iPhone-14',
      use: {
        ...devices['iPhone 14'],
      },
    },
    {
      name: 'Mobile-Chrome-Pixel-7',
      use: {
        ...devices['Pixel 7'],
        permissions: ['camera'],
        launchOptions: {
          downloadsPath: path.resolve('test-results/downloads'),
          args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'],
        },
      },
    },
    {
      name: 'Tablet-iPad-Mini',
      use: {
        ...devices['iPad Mini'],
      },
    },
    {
      name: 'Desktop-Chrome',
      use: {
        ...devices['Desktop Chrome'],
        permissions: ['camera'],
        launchOptions: {
          downloadsPath: path.resolve('test-results/downloads'),
          args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'],
        },
      },
    },
  ],

  webServer: {
    command: 'npm run dev -- --host 0.0.0.0 --port 5173',
    port: 5173,
    reuseExistingServer: !process.env.CI,
    timeout: 60000,
  },
});
