import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import AxeBuilder from "@axe-core/playwright";
import { chromium } from "playwright";

const server = spawn(
  process.execPath,
  ["scripts/serve.mjs", "--root", "dist", "--port", "0"],
  { stdio: ["ignore", "pipe", "inherit"] },
);

const baseUrl = await new Promise((resolve, reject) => {
  let output = "";

  server.stdout.setEncoding("utf8");
  server.stdout.on("data", (chunk) => {
    output += chunk;
    const match = output.match(/http:\/\/127\.0\.0\.1:\d+/);
    if (match) resolve(match[0]);
  });
  server.once("error", reject);
  server.once("exit", (code) => {
    reject(new Error(`Preview server exited before starting (code ${code})`));
  });
});

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
  { language: "en", width: 320, height: 700 },
  { language: "ar", width: 320, height: 700 },
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

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(200);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.evaluate(() => document.fonts.ready);

    const state = await page.evaluate(() => {
      const panels = [...document.querySelectorAll(".content-grid .panel")];
      const panelName = (panel) => panel.querySelector("h2")?.textContent?.trim();
      const buttonNames = [...document.querySelectorAll("button")].map((button) =>
        button.getAttribute("aria-label"),
      );
      const skipLink = document.querySelector(".skip-link");
      const skipTarget = skipLink
        ? document.querySelector(new URL(skipLink.href).hash)
        : null;

      return {
        brokenImages: [...document.images].filter(
          (image) => !image.complete || image.naturalWidth === 0,
        ).length,
        buttonNames,
        clientWidth: document.documentElement.clientWidth,
        direction: document.documentElement.dir,
        domSectionOrder: panels.map(panelName),
        heading: document.querySelector("h1")?.textContent?.trim(),
        innerWidth: window.innerWidth,
        language: document.documentElement.lang,
        overflowingElements: [...document.querySelectorAll("body *")]
          .map((element) => {
            const rect = element.getBoundingClientRect();
            return {
              className: element.className,
              left: Math.round(rect.left),
              right: Math.round(rect.right),
              tagName: element.tagName,
            };
          })
          .filter(({ left, right }) => left < 0 || right > window.innerWidth)
          .slice(0, 8),
        scrollWidth: document.documentElement.scrollWidth,
        skipTargetTabIndex: skipTarget?.tabIndex,
        visualSectionOrder: panels
          .toSorted((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top)
          .map(panelName),
      };
    });

    assert.equal(state.language, scenario.language);
    assert.equal(state.direction, scenario.language === "ar" ? "rtl" : "ltr");
    assert.ok(state.heading, "The resume heading should be visible");
    assert.equal(state.brokenImages, 0);
    assert.ok(
      state.scrollWidth <= state.clientWidth,
      `Horizontal overflow at ${scenario.width}px in ${scenario.language}: ${state.scrollWidth}px scroll / ${state.clientWidth}px client / ${state.innerWidth}px viewport; ${JSON.stringify(state.overflowingElements)}`,
    );
    assert.deepEqual(runtimeErrors, []);
    assert.equal(new Set(state.buttonNames).size, state.buttonNames.length);
    assert.equal(state.skipTargetTabIndex, -1);

    if (scenario.width <= 375) {
      assert.deepEqual(state.visualSectionOrder, state.domSectionOrder);
    }

    const accessibility = await new AxeBuilder({ page }).analyze();
    assert.deepEqual(
      accessibility.violations.map(({ id, impact }) => ({ id, impact })),
      [],
    );

    if (scenario.language === "en" && scenario.width === 320) {
      for (const selector of [".theme-toggle", ".contrast-toggle"]) {
        const toggle = page.locator(selector);
        const before = {
          label: await toggle.getAttribute("aria-label"),
          pressed: await toggle.getAttribute("aria-pressed"),
        };
        await toggle.click();
        const after = {
          label: await toggle.getAttribute("aria-label"),
          pressed: await toggle.getAttribute("aria-pressed"),
        };
        assert.equal(after.label, before.label);
        assert.notEqual(after.pressed, before.pressed);
        await toggle.click();
      }
    }

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
