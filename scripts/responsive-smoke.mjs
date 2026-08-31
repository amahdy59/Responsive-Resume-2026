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
  assert.equal((await fetch(`${baseUrl}/?smoke=1`)).status, 200);
  browser = await chromium.launch({ headless: true });

  for (const scenario of scenarios) {
    const context = await browser.newContext({
      viewport: { width: scenario.width, height: scenario.height },
    });
    await context.route(/https:\/\/fonts\.googleapis\.com\//, (route) =>
      route.fulfill({ body: "", contentType: "text/css", status: 200 }),
    );
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
        ambientAnimationName: getComputedStyle(
          document.querySelector(".ambient-particles"),
        ).animationName,
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
          .filter((element) => !element.closest(".section-nav"))
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
        contactTexts: [...document.querySelectorAll(".contact-list a")].map((link) =>
          link.childNodes[0]?.textContent.trim(),
        ),
        entityLinks: [...document.querySelectorAll(".li-entity-link")].map((link) => link.href),
        externalIconCount: document.querySelectorAll('a[target="_blank"] .external-icon').length,
        externalLinkCount: document.querySelectorAll('a[target="_blank"]').length,
        printButtonInToolbar: Boolean(
          document.querySelector(".controls-group > .print-button"),
        ),
        resumeActionCount: document.querySelectorAll(".resume-action").length,
        sectionLinks: [...document.querySelectorAll(".section-nav a")].map((link) => ({
          targetExists: Boolean(document.querySelector(new URL(link.href).hash)),
          text: link.textContent.trim(),
        })),
        sectionNavPosition: getComputedStyle(document.querySelector(".section-nav")).position,
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
    assert.deepEqual(state.overflowingElements, []);
    assert.deepEqual(runtimeErrors, []);
    assert.equal(new Set(state.buttonNames).size, state.buttonNames.length);
    assert.equal(state.skipTargetTabIndex, -1);
    assert.equal(state.sectionLinks.length, 6);
    assert.ok(state.sectionLinks.every(({ targetExists, text }) => targetExists && text));
    assert.equal(state.sectionNavPosition, "sticky");
    assert.equal(state.printButtonInToolbar, true);
    assert.equal(state.resumeActionCount, 0);
    assert.equal(state.externalIconCount, state.externalLinkCount);
    assert.deepEqual(state.entityLinks, [
      "https://advansys-is.com/",
      "https://www.se.com/eg/en/",
      "https://iti.gov.eg/iti/home",
      "https://www.menofia.edu.eg/",
    ]);
    assert.deepEqual(
      state.contactTexts.slice(1),
      scenario.language === "ar"
        ? ["لينكد إن", "معرض دريبل"]
        : ["LinkedIn profile", "Dribbble portfolio"],
    );

    if (scenario.width <= 375) {
      assert.deepEqual(state.visualSectionOrder, state.domSectionOrder);
    }

    if (scenario.width <= 560) {
      assert.equal(state.ambientAnimationName, "none");
    }

    const accessibility = await new AxeBuilder({ page }).analyze();
    assert.deepEqual(
      accessibility.violations.map(({ id, impact }) => ({ id, impact })),
      [],
    );

    if (scenario.language === "en" && scenario.width === 320) {
      await page.evaluate(() => {
        window.print = () => {
          window.__printCalled = true;
        };
        document.querySelector(".print-button").click();
      });
      assert.equal(await page.evaluate(() => window.__printCalled), true);

      await page.locator('.section-nav a[href="#projects"]').click();
      assert.equal(
        await page.locator("#projects").evaluate((panel) => getComputedStyle(panel).animationName),
        "targetPanel",
      );

      const firstProject = page.locator(".featured article").first();
      await firstProject.locator("a").first().focus();
      assert.notEqual(await firstProject.evaluate((article) => getComputedStyle(article).transform), "none");

      const firstEntity = page.locator(".li-entity-link").first();
      await firstEntity.hover();
      assert.notEqual(
        await firstEntity.locator(".li-company-logo").evaluate((logo) => getComputedStyle(logo).transform),
        "none",
      );

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
