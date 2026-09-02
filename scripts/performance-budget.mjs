import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { chromium } from "playwright";

const port = 4191;
const baseUrl = `http://127.0.0.1:${port}`;
const server = spawn(
  process.execPath,
  ["scripts/serve.mjs", "--root", "dist", "--port", String(port)],
  { stdio: "ignore" },
);
for (let attempt = 0; attempt < 30; attempt += 1) {
  try {
    if ((await fetch(baseUrl)).ok) break;
  } catch {}
  await new Promise((done) => setTimeout(done, 200));
}
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 800 },
  });
  const devtools = await page.context().newCDPSession(page);
  let transferredBytes = 0;
  await devtools.send("Network.enable");
  devtools.on("Network.loadingFinished", ({ encodedDataLength }) => {
    transferredBytes += encodedDataLength;
  });
  await page.addInitScript(() => {
    window.__quality = { cls: 0, lcp: 0 };
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries())
        window.__quality.lcp = entry.startTime;
    }).observe({ type: "largest-contentful-paint", buffered: true });
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries())
        if (!entry.hadRecentInput) window.__quality.cls += entry.value;
    }).observe({ type: "layout-shift", buffered: true });
  });
  await page.goto(`${baseUrl}/en/`, { waitUntil: "load" });
  await page.waitForTimeout(500);
  const metrics = await page.evaluate(() => ({ ...window.__quality }));
  assert.ok(
    metrics.lcp <= 2500,
    `LCP ${metrics.lcp.toFixed(0)}ms exceeds 2500ms`,
  );
  assert.ok(metrics.cls <= 0.1, `CLS ${metrics.cls.toFixed(3)} exceeds 0.1`);
  assert.ok(
    transferredBytes <= 1_500_000,
    `Transferred ${(transferredBytes / 1024).toFixed(0)}KB exceeds 1500KB`,
  );
  console.log(
    `Performance budgets passed: LCP ${metrics.lcp.toFixed(0)}ms, CLS ${metrics.cls.toFixed(3)}, ${(transferredBytes / 1024).toFixed(0)}KB transferred.`,
  );
} finally {
  await browser.close();
  server.kill();
}
