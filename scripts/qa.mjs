import { chromium } from 'playwright-core';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const baseUrl = process.env.QA_URL || 'http://127.0.0.1:4173';
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const outputDirectory = resolve('qa/screenshots');

await mkdir(outputDirectory, { recursive: true });

const browser = await chromium.launch({
  executablePath: edgePath,
  headless: true,
  args: ['--enable-webgl', '--ignore-gpu-blocklist', '--use-angle=swiftshader'],
});

const report = { baseUrl, runs: [] };

async function runViewport({ name, viewport, reducedMotion = 'no-preference' }) {
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: 1,
    colorScheme: 'dark',
    reducedMotion,
  });
  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => pageErrors.push(error.message));

  const response = await page.goto(baseUrl, { waitUntil: 'networkidle' });
  await page.waitForSelector('main');
  await page.waitForTimeout(1800);

  const reducedClass = await page.evaluate(() => document.documentElement.classList.contains('reduced-motion'));
  const canvasCount = await page.locator('.webgl-layer canvas').count();
  const webgl = await page.evaluate(() => {
    const canvas = document.querySelector('.webgl-layer canvas');
    if (!canvas) return { active: false, renderer: null, size: null };
    const context = canvas.getContext('webgl2') || canvas.getContext('webgl');
    return {
      active: Boolean(context && canvas.width > 0 && canvas.height > 0),
      renderer: context ? context.getParameter(context.RENDERER) : null,
      size: [canvas.width, canvas.height],
    };
  });

  await page.screenshot({ path: resolve(outputDirectory, `${name}-hero.png`), fullPage: false });

  if (reducedMotion === 'no-preference') {
    await page.evaluate(() => {
      const section = document.querySelector('#cinematic');
      window.scrollTo({ top: section.offsetTop + (section.offsetHeight - window.innerHeight) * 0.62, behavior: 'instant' });
    });
    await page.waitForTimeout(700);

    const transformedActVisible = await page.locator('.act-two-overlay').evaluate((element) => {
      const style = getComputedStyle(element);
      return Number(style.opacity) > 0.35;
    });

    await page.locator('#resultados').scrollIntoViewIfNeeded();
    await page.waitForTimeout(850);
    await page.locator('.comparison-viewport input').fill('73');
    const comparisonPosition = await page.locator('.comparison-module').evaluate((element) => getComputedStyle(element).getPropertyValue('--compare-position').trim());
    await page.screenshot({ path: resolve(outputDirectory, `${name}-results.png`), fullPage: false });

    await page.locator('#servicos').scrollIntoViewIfNeeded();
    await page.waitForTimeout(650);
    await page.locator('.service-index button').nth(5).click();
    const selectedService = await page.locator('.service-focus h3').textContent();
    await page.locator('.header-cta').click();
    const dialogOpen = await page.locator('.pending-dialog').evaluate((dialog) => dialog.open);
    await page.locator('.dialog-close').click();

    report.runs.push({
      name,
      viewport,
      status: response?.status(),
      canvasCount,
      webgl,
      transformedActVisible,
      comparisonPosition,
      selectedService,
      dialogOpen,
      consoleErrors,
      pageErrors,
    });
  } else {
    report.runs.push({
      name,
      viewport,
      status: response?.status(),
      canvasCount,
      webgl,
      reducedClass,
      consoleErrors,
      pageErrors,
    });
  }

  await context.close();
}

try {
  await runViewport({ name: 'desktop', viewport: { width: 1440, height: 960 } });
  await runViewport({ name: 'mobile', viewport: { width: 390, height: 844 } });
  await runViewport({ name: 'reduced-motion', viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' });
} finally {
  await browser.close();
}

await writeFile(resolve('qa/report.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');

const failures = report.runs.filter((run) => (
  run.status !== 200
  || run.consoleErrors.length > 0
  || run.pageErrors.length > 0
  || !run.webgl.active
  || (run.name === 'reduced-motion' && !run.reducedClass)
  || (run.name !== 'reduced-motion' && (!run.transformedActVisible || run.comparisonPosition !== '73%' || run.selectedService?.trim() !== 'Faróis' || !run.dialogOpen))
));

console.log(JSON.stringify(report, null, 2));

if (failures.length > 0) process.exitCode = 1;
