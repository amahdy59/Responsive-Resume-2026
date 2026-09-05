import assert from "node:assert/strict";
import { createReadStream, existsSync } from "node:fs";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import pixelmatch from "pixelmatch";
import { chromium } from "playwright";
import { PNG } from "pngjs";

const root = resolve(fileURLToPath(new URL("../dist", import.meta.url)));
const baselineDir = resolve("tests", "visual-baselines");
const evidenceDir = resolve("artifacts", "visual");
const update =
  process.env.UPDATE_VISUALS === "1" || process.argv.includes("--update");

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
};

function getSafePath(urlPath) {
  const decodedPath = decodeURIComponent(urlPath.split("?")[0]);
  const cleanPath = normalize(decodedPath);
  const requestedPath =
    decodedPath === "/" ? "index.html" : cleanPath.replace(/^[/\\]+/, "");
  const resolvedPath = resolve(root, requestedPath);
  if (!resolvedPath.startsWith(root)) return null;
  return resolvedPath;
}

const server = createServer(async (request, response) => {
  const filePath = getSafePath(request.url || "/");
  if (!filePath || !existsSync(filePath)) {
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }
  const fileStat = await stat(filePath);
  if (fileStat.isDirectory()) {
    const indexPath = resolve(filePath, "index.html");
    if (existsSync(indexPath)) {
      response.writeHead(200, {
        "cache-control": "no-cache",
        "content-type": mimeTypes[".html"],
      });
      createReadStream(indexPath).pipe(response);
      return;
    }
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }
  const extension = extname(filePath).toLowerCase();
  response.writeHead(200, {
    "cache-control": "no-cache",
    "content-type": mimeTypes[extension] || "application/octet-stream",
  });
  createReadStream(filePath).pipe(response);
});

const baseUrl = await new Promise((res, rej) => {
  server.listen(0, "127.0.0.1", () => {
    const address = server.address();
    const port = typeof address === "object" && address ? address.port : 0;
    res(`http://127.0.0.1:${port}`);
  });
  server.on("error", rej);
});

const isCI = Boolean(process.env.CI || process.env.GITHUB_ACTIONS);

await mkdir(baselineDir, { recursive: true });
await mkdir(evidenceDir, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
});
try {
  const scenarios = [
    { name: "home-en-mobile", path: "/en/", width: 375, height: 812 },
    { name: "home-ar-desktop", path: "/ar/", width: 1440, height: 900 },
    {
      name: "home-en-dark",
      path: "/en/",
      width: 1280,
      height: 800,
      preferences: { theme: "dark" },
    },
    {
      name: "home-ar-high-contrast",
      path: "/ar/",
      width: 375,
      height: 812,
      preferences: { contrast: "high" },
    },
    {
      name: "case-en-tablet",
      path: "/en/case-studies/haj-arafa/",
      width: 768,
      height: 1024,
    },
  ];
  for (const scenario of scenarios) {
    const context = await browser.newContext({
      viewport: { width: scenario.width, height: scenario.height },
      reducedMotion: "reduce",
    });
    await context.route(
      /https:\/\/(fonts\.googleapis\.com|fonts\.gstatic\.com)\/.*/,
      (route) =>
        route.fulfill({ body: "", contentType: "text/css", status: 200 }),
    );
    const page = await context.newPage();
    page.setDefaultNavigationTimeout(60000);
    if (scenario.preferences) {
      await page.addInitScript((preferences) => {
        if (preferences.theme)
          localStorage.setItem("resume-theme", preferences.theme);
        if (preferences.contrast)
          localStorage.setItem("resume-contrast", preferences.contrast);
      }, scenario.preferences);
    }
    await page.goto(`${baseUrl}${scenario.path}`, {
      waitUntil: "domcontentloaded",
    });
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
      const heightDiff = Math.abs(actual.height - baseline.height);
      const maxAllowedHeightDiff =
        Math.max(actual.height, baseline.height) * (isCI ? 0.15 : 0.05);
      assert.ok(
        heightDiff <= maxAllowedHeightDiff,
        `${scenario.name} height changed significantly: ${actual.height} vs ${baseline.height}`,
      );

      const compareHeight = Math.min(actual.height, baseline.height);
      const compareWidth = actual.width;
      const actualCropped = new PNG({
        width: compareWidth,
        height: compareHeight,
      });
      const baselineCropped = new PNG({
        width: compareWidth,
        height: compareHeight,
      });
      PNG.bitblt(
        actual,
        actualCropped,
        0,
        0,
        compareWidth,
        compareHeight,
        0,
        0,
      );
      PNG.bitblt(
        baseline,
        baselineCropped,
        0,
        0,
        compareWidth,
        compareHeight,
        0,
        0,
      );

      const different = pixelmatch(
        actualCropped.data,
        baselineCropped.data,
        null,
        compareWidth,
        compareHeight,
        { threshold: 0.3 },
      );
      const ratio = different / (compareWidth * compareHeight);
      const maxAllowedRatio = isCI ? 0.2 : 0.05;
      assert.ok(
        ratio <= maxAllowedRatio,
        `${scenario.name} visual difference ${(ratio * 100).toFixed(2)}% exceeds ${(maxAllowedRatio * 100).toFixed(0)}%`,
      );
      console.log(`Passed ${scenario.name}`);
    }
    await context.close();
  }
} finally {
  await browser.close();
  server.close();
}
