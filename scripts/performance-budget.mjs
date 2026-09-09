import assert from "node:assert/strict";
import { createReadStream, existsSync } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, normalize, resolve } from "node:path";
import { gzipSync } from "node:zlib";
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
  // Match GitHub Pages compression while retaining cold loads and throttling.
  if ([".html", ".css", ".js", ".json", ".svg"].includes(extension)) {
    const body = gzipSync(await readFile(filePath));
    response.writeHead(200, {
      "cache-control": "no-cache",
      "content-type": mimeTypes[extension] || "application/octet-stream",
      "content-encoding": "gzip",
      "content-length": body.length,
    });
    response.end(body);
    return;
  }
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

const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
});
try {
  const scenarios = [
    { path: "/en/", mobile: false },
    ...["en", "ar"].flatMap((lang) => [
      { path: `/${lang}/`, mobile: true },
      { path: `/${lang}/case-studies/cairo-airport/`, mobile: true },
    ]),
  ];
  for (const scenario of scenarios) {
    const samples = [];
    for (let run = 0; run < 3; run++) {
      const page = await browser.newPage({
        viewport: scenario.mobile
          ? { width: 375, height: 812 }
          : { width: 1280, height: 800 },
      });
      page.setDefaultNavigationTimeout(30000);
      page.setDefaultTimeout(30000);
      const devtools = await page.context().newCDPSession(page);
      let transferredBytes = 0;
      await devtools.send("Network.enable");
      if (scenario.mobile) {
        await devtools.send("Emulation.setCPUThrottlingRate", { rate: 4 });
        await devtools.send("Network.emulateNetworkConditions", {
          offline: false,
          latency: 150,
          downloadThroughput: 1_600_000 / 8,
          uploadThroughput: 750_000 / 8,
        });
      }
      devtools.on("Network.loadingFinished", ({ encodedDataLength }) => {
        transferredBytes += encodedDataLength;
      });
      await page.addInitScript(() => {
        window.__quality = { cls: 0, lcp: 0, interaction: 0 };
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.interactionId)
              window.__quality.interaction = Math.max(
                window.__quality.interaction,
                entry.duration,
              );
          }
        }).observe({ type: "event", buffered: true, durationThreshold: 16 });
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries())
            window.__quality.lcp = entry.startTime;
        }).observe({ type: "largest-contentful-paint", buffered: true });
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries())
            if (!entry.hadRecentInput) window.__quality.cls += entry.value;
        }).observe({ type: "layout-shift", buffered: true });
      });
      await page.goto(`${baseUrl}${scenario.path}`, { waitUntil: "load" });
      const fontPreload = page.locator('link[rel="preload"][as="font"]');
      assert.equal(await fontPreload.count(), 1);
      assert.ok(
        await fontPreload.evaluateAll((links) =>
          links.every(
            (link) => link.getAttribute("crossorigin") === "anonymous",
          ),
        ),
      );
      assert.match(
        await fontPreload.first().getAttribute("href"),
        scenario.path.startsWith("/ar/")
          ? /noto-sans-arabic-arabic-wght-normal\.[a-f0-9]+\.woff2$/
          : /inter-latin-wght-normal\.[a-f0-9]+\.woff2$/,
      );
      await page.waitForTimeout(1000);
      await page.locator(".theme-toggle").first().click();
      await page.locator(".contrast-toggle").first().click();
      await page.waitForTimeout(250);
      const metrics = await page.evaluate(() => ({ ...window.__quality }));
      samples.push({ ...metrics, transferredBytes });
      await page.close();
    }
    const median = (key) =>
      samples.map((sample) => sample[key]).sort((a, b) => a - b)[1];
    const metrics = {
      lcp: median("lcp"),
      cls: median("cls"),
      interaction: median("interaction"),
    };
    const transferredBytes = median("transferredBytes");
    console.log(
      `${scenario.path} ${scenario.mobile ? "4x CPU / 1.6Mbps / 150ms" : "desktop"}, median of 3: LCP ${metrics.lcp.toFixed(0)}ms, CLS ${metrics.cls.toFixed(3)}, ${(transferredBytes / 1024).toFixed(0)}KB, tested interaction ${metrics.interaction}ms (lab sample, not field INP).`,
    );
    assert.ok(
      metrics.lcp <= 3500,
      `LCP ${metrics.lcp.toFixed(0)}ms exceeds 3500ms`,
    );
    assert.ok(metrics.cls <= 0.1, `CLS ${metrics.cls.toFixed(3)} exceeds 0.1`);
    assert.ok(
      metrics.interaction <= 500,
      `Lab interaction ${metrics.interaction}ms exceeds 500ms`,
    );
    assert.ok(
      transferredBytes <= 1_500_000,
      `Transferred ${(transferredBytes / 1024).toFixed(0)}KB exceeds 1500KB`,
    );
  }
  console.log(
    "Performance budgets passed. Field Core Web Vitals require real-user data.",
  );
} finally {
  await browser.close();
  server.closeAllConnections?.();
  server.close();
  process.exit(process.exitCode || 0);
}
