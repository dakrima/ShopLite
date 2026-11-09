const { defineConfig } = require('@playwright/test');
const { existsSync } = require('node:fs');
const chromeMac = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const ejecutable = process.env.CHROME_EJECUTABLE || (!process.env.CI && existsSync(chromeMac) ? chromeMac : undefined);

module.exports = defineConfig({
  testDir: './pruebas',
  testMatch: '**/*.spec.cjs',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  workers: 2,
  timeout: 45000,
  expect: { timeout: 5000 },
  outputDir: 'test-results/artefactos',
  reporter: [['list'], ['json', { outputFile: 'test-results/resultados.json' }]],
  use: {
    browserName: 'chromium',
    offline: true,
    trace: 'retain-on-failure',
    launchOptions: ejecutable ? { executablePath: ejecutable } : {}
  },
  projects: [
    { name: 'escritorio', use: { viewport: { width: 1440, height: 1000 } } },
    { name: 'movil', use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } }
  ]
});
