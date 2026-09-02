import assert from "node:assert/strict";
import { createReadStream, existsSync } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, normalize, resolve } from "node:path";
import { chromium } from "playwright";

const root = resolve(process.cwd(), "dist");
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
    response.writeHead(301, {
      location: `${request.url?.replace(/\/?$/, "/") || "/"}index.html`,
    });
    response.end();
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
  server.close();
}
