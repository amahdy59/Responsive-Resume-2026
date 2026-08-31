import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { chromium } from "playwright";

const baseUrl = "http://127.0.0.1:4174";
const server = spawn(
  process.execPath,
  ["scripts/serve.mjs", "--root", "dist", "--port", "4174"],
  { stdio: "ignore" },
);

async function waitForServer() {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      const response = await fetch(baseUrl);
      if (response.ok) return;
    } catch {
      // The server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error(`Timed out waiting for ${baseUrl}`);
}

const scenarios = [
  { language: "en", width: 375, height: 812 },
  { language: "ar", width: 375, height: 812 },
  { language: "en", width: 768, height: 1024 },
  { language: "ar", width: 768, height: 1024 },
];

let browser;

try {
  await waitForServer();
  browser = await chromium.launch({ headless: true });

  for (const scenario of scenarios) {
    const context = await browser.newContext({
      viewport: { width: scenario.width, height: scenario.height },
    });
    const page = await context.newPage();
    const runtimeErrors = [];

    page.on("console", (message) => {
      if (message.type() === "error") runtimeErrors.push(message.text());
    });
    page.on("pageerror", (error) => runtimeErrors.push(error.message));

    const response = await page.goto(baseUrl, { waitUntil: "networkidle" });
    assert.equal(response?.status(), 200);

    if (scenario.language === "ar") {
      await page.getByLabel("Switch to Arabic", { exact: true }).click();
    }

    await page.evaluate(() => document.fonts.ready);

    const state = await page.evaluate(() => ({
      brokenImages: [...document.images].filter(
        (image) => !image.complete || image.naturalWidth === 0,
      ).length,
      clientWidth: document.documentElement.clientWidth,
      direction: document.documentElement.dir,
      heading: document.querySelector("h1")?.textContent?.trim(),
      language: document.documentElement.lang,
      scrollWidth: document.documentElement.scrollWidth,
    }));

    assert.equal(state.language, scenario.language);
    assert.equal(state.direction, scenario.language === "ar" ? "rtl" : "ltr");
    assert.ok(state.heading, "The resume heading should be visible");
    assert.equal(state.brokenImages, 0);
    assert.ok(
      state.scrollWidth <= state.clientWidth,
      `Horizontal overflow at ${scenario.width}px in ${scenario.language}`,
    );
    assert.deepEqual(runtimeErrors, []);

    if (scenario.width === 768) {
      await page.locator(".lang-toggle").focus();
      const tooltip = await page.locator(".lang-toggle").evaluate((button) => {
        const style = getComputedStyle(button, "::before");
        return { left: style.left, right: style.right };
      });
      const outsideEdge = scenario.language === "ar" ? tooltip.left : tooltip.right;
      assert.notEqual(outsideEdge, "auto", "Tablet tooltip should open away from the portrait");
    }

    await context.close();
    console.log(`Passed ${scenario.language} at ${scenario.width}x${scenario.height}`);
  }
} finally {
  await browser?.close();
  server.kill();
}
