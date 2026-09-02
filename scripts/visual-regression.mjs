import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import pixelmatch from "pixelmatch";
import { chromium } from "playwright";
import { PNG } from "pngjs";

const port = 4190;
const baseUrl = `http://127.0.0.1:${port}`;
const baselineDir = resolve("tests", "visual-baselines");
const evidenceDir = resolve("artifacts", "visual");
const update = process.env.UPDATE_VISUALS === "1";
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
await mkdir(baselineDir, { recursive: true });
await mkdir(evidenceDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  const scenarios = [
    { name: "home-en-mobile", path: "/en/", width: 375, height: 812 },
    { name: "home-ar-desktop", path: "/ar/", width: 1440, height: 900 },
    {
      name: "case-en-tablet",
      path: "/en/case-studies/haj-arafa/",
      width: 768,
      height: 1024,
    },
  ];
  for (const scenario of scenarios) {
    const page = await browser.newPage({
      viewport: { width: scenario.width, height: scenario.height },
      reducedMotion: "reduce",
    });
    await page.goto(`${baseUrl}${scenario.path}`, { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
    const actualPath = resolve(evidenceDir, `${scenario.name}.png`);
    const baselinePath = resolve(baselineDir, `${scenario.name}.png`);
    await page.screenshot({
      path: actualPath,
      fullPage: true,
      animations: "disabled",
    });
    if (update || !existsSync(baselinePath)) {
      await writeFile(baselinePath, await readFile(actualPath));
      console.log(`Updated ${scenario.name}`);
    } else {
      const actual = PNG.sync.read(await readFile(actualPath));
      const baseline = PNG.sync.read(await readFile(baselinePath));
      assert.equal(
        actual.width,
        baseline.width,
        `${scenario.name} width changed`,
      );
      assert.equal(
        actual.height,
        baseline.height,
        `${scenario.name} height changed`,
      );
      const different = pixelmatch(
        actual.data,
        baseline.data,
        null,
        actual.width,
        actual.height,
        { threshold: 0.3 },
      );
      const ratio = different / (actual.width * actual.height);
      assert.ok(
        ratio <= 0.04,
        `${scenario.name} visual difference ${(ratio * 100).toFixed(2)}% exceeds 4%`,
      );
      console.log(`Passed ${scenario.name}`);
    }
    await page.close();
  }
} finally {
  await browser.close();
  server.kill();
}
