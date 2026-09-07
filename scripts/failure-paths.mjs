import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { chromium } from "playwright";

const server = spawn(
  process.execPath,
  ["scripts/serve.mjs", "--root", "dist", "--port", "0"],
  { stdio: ["ignore", "pipe", "inherit"] },
);
let browser;
try {
  const [output] = await once(server.stdout, "data");
  const origin = output.toString().match(/http:\/\/127\.0\.0\.1:\d+/)?.[0];
  assert.ok(origin);
  browser = await chromium.launch();
  for (const lang of ["en", "ar"]) {
    const page = await browser.newPage({
      viewport: { width: 375, height: 812 },
      reducedMotion: "reduce",
    });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "clipboard", {
        value: {
          writeText: async () => {
            throw new DOMException("Denied", "NotAllowedError");
          },
        },
      });
      delete window.speechSynthesis;
    });
    await page.route("**/assets/audio/narration.json", (route) =>
      route.fulfill({ status: 503, body: "Unavailable" }),
    );
    await page.goto(`${origin}/${lang}/`);
    await page.locator("[data-copy]").first().click();
    await page.waitForFunction(() =>
      document.querySelector(".copy-toast")?.textContent.trim(),
    );
    const toast = await page.locator(".copy-toast").textContent();
    assert.match(toast, lang === "en" ? /copy/i : /النسخ/);
    await page.locator(".audio-play-btn").first().click();
    await page.waitForFunction(() =>
      /unavailable|غير متاح/.test(
        document.querySelector(".audio-live-status")?.textContent,
      ),
    );
    assert.ok(
      await page
        .locator(".global-audio-player")
        .evaluate((player) => player.hidden),
    );

    await page.route("**/assets/case-haj-arafa-*.webp", (route) =>
      route.abort(),
    );
    await page.route("https://amahdy59.github.io/**", (route) => route.abort());
    await page.goto(`${origin}/${lang}/case-studies/haj-arafa/`);
    await page.waitForSelector(".image-fallback");
    assert.equal(
      await page.locator(".case-study-image").getAttribute("tabindex"),
      null,
    );
    await page.locator("[data-toggle-embed]").click();
    assert.ok(await page.locator(".embed-help").isVisible());
    assert.ok(
      await page.locator('.live-embed-bar a[target="_blank"]').isVisible(),
    );
    assert.deepEqual(errors, []);
    await page.close();
    console.log(
      `Passed ${lang}: denied clipboard, unavailable narration, missing image and blocked preview`,
    );
  }

  const page = await browser.newPage();
  let pendingRoute;
  const requested = new Promise((resolve) => {
    page.route("**/assets/audio/narration.json", (route) => {
      pendingRoute = route;
      resolve();
    });
  });
  await page.addInitScript(() => {
    window.__speechStarts = 0;
    window.speechSynthesis.speak = () => window.__speechStarts++;
  });
  await page.goto(`${origin}/en/`);
  await page.locator(".audio-play-btn").first().click();
  await requested;
  await page.locator("[data-audio-stop]").click();
  await pendingRoute.fulfill({ contentType: "application/json", body: "{}" });
  await page.waitForTimeout(300);
  assert.equal(
    await page.evaluate(() => window.__speechStarts),
    0,
    "Closing pending narration must prevent late playback",
  );
  assert.ok(
    await page
      .locator(".global-audio-player")
      .evaluate((player) => player.hidden),
  );
  await page.close();
  console.log("Passed pending narration cancellation");
} finally {
  await browser?.close();
  server.kill();
}
