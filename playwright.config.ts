import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests',
  use: {
    baseURL: 'http://127.0.0.1:5173'
  },
  webServer: [
    {
      command: 'npm run dev:server',
      port: 4000,
      reuseExistingServer: !process.env.CI,
      env: {
        SUPPORT_QUEUE_FILE: 'data/e2e-support-queue.json'
      }
    },
    {
      command: 'npm run dev -- --host --port 5173',
      port: 5173,
      reuseExistingServer: !process.env.CI,
      env: {
        VITE_SUPPORT_API_URL: 'http://127.0.0.1:4000/support'
      }
    }
  ]
});
