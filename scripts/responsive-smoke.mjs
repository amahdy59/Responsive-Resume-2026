import assert from "node:assert/strict";
import { createReadStream, existsSync } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import AxeBuilder from "@axe-core/playwright";
import { chromium } from "playwright";

const root = resolve(fileURLToPath(new URL("../dist", import.meta.url)));
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
  ".xml": "application/xml; charset=utf-8",
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

const scenarios = [
  { language: "en", width: 320, height: 700 },
  { language: "ar", width: 320, height: 700 },
  { language: "en", width: 375, height: 812 },
  { language: "ar", width: 375, height: 812 },
  { language: "en", width: 768, height: 1024 },
  { language: "ar", width: 768, height: 1024 },
  { language: "en", width: 1280, height: 800 },
  { language: "ar", width: 1440, height: 900 },
  { language: "en", width: 1920, height: 1080 },
];

let browser;

try {
  console.log(`▶ In-process preview server listening at: ${baseUrl}`);

  const healthRes = await fetch(`${baseUrl}/?smoke=1`);
  console.log(`▶ Initial HTTP health probe status: ${healthRes.status}`);
  assert.equal(healthRes.status, 200);

  console.log("▶ Launching headless Chromium browser...");
  browser = await chromium.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
    ],
  });
  console.log("✅ Chromium browser ready. Running viewport scenarios...");

  for (const scenario of scenarios) {
    try {
      const context = await browser.newContext({
        viewport: { width: scenario.width, height: scenario.height },
      });
      await context.route(
        /https:\/\/(fonts\.googleapis\.com|fonts\.gstatic\.com)\/.*/,
        (route) =>
          route.fulfill({ body: "", contentType: "text/css", status: 200 }),
      );
      const page = await context.newPage();
      page.setDefaultNavigationTimeout(10000);
      page.setDefaultTimeout(10000);
      const runtimeErrors = [];

      page.on("console", (message) => {
        if (message.type() === "error") runtimeErrors.push(message.text());
      });
      page.on("pageerror", (error) => runtimeErrors.push(error.message));

      const response = await page.goto(baseUrl, {
        waitUntil: "domcontentloaded",
      });
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
        const panelName = (panel) =>
          panel.querySelector("h2")?.textContent?.trim();
        const buttons = [...document.querySelectorAll("button")];
        const buttonNames = buttons
          .map((button) => button.getAttribute("aria-label"))
          .filter(Boolean);
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
          buttonsAreNamed: buttons.every((button) =>
            Boolean(
              button.getAttribute("aria-label") || button.textContent.trim(),
            ),
          ),
          clientWidth: document.documentElement.clientWidth,
          direction: document.documentElement.dir,
          domSectionOrder: panels.map(panelName),
          heading: document.querySelector("h1")?.textContent?.trim(),
          innerWidth: window.innerWidth,
          language: document.documentElement.lang,
          audioControllerReady: Boolean(window.AntigravityAudio),
          interactiveSkillCount: document.querySelectorAll(
            '.pills [data-skill-filter], .pills [tabindex="0"]',
          ).length,
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
          contactTexts: [...document.querySelectorAll(".contact-list a")].map(
            (link) => link.childNodes[0]?.textContent.trim(),
          ),
          entityLinks: [...document.querySelectorAll(".li-entity-link")].map(
            (link) => link.href,
          ),
          externalIconCount: document.querySelectorAll(
            ".project-btn-secondary .external-icon",
          ).length,
          externalLinkCount: document.querySelectorAll(".project-btn-secondary")
            .length,
          resumeActionCount: document.querySelectorAll(".resume-action").length,
          sectionLinks: [...document.querySelectorAll(".section-nav a")].map(
            (link) => ({
              targetExists: Boolean(
                document.querySelector(new URL(link.href).hash),
              ),
              text: link.textContent.trim(),
            }),
          ),
          sectionNavPosition: getComputedStyle(
            document.querySelector(".section-nav"),
          ).position,
          sectionNavFits:
            document.querySelector(".section-nav").scrollWidth <=
            document.querySelector(".section-nav").clientWidth,
          skipTargetTabIndex: skipTarget?.tabIndex,
          toolbarRole: document
            .querySelector(".controls-group")
            ?.getAttribute("role"),
          footerExists: Boolean(document.querySelector(".resume-footer")),
          projectThumbnailCount: document.querySelectorAll(
            '.project-thumbnail[src$=".webp"]',
          ).length,
          visualSectionOrder: panels
            .toSorted(
              (a, b) =>
                a.getBoundingClientRect().top - b.getBoundingClientRect().top,
            )
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
      assert.equal(state.buttonsAreNamed, true);
      assert.equal(new Set(state.buttonNames).size, state.buttonNames.length);
      assert.equal(state.skipTargetTabIndex, -1);
      assert.equal(state.sectionLinks.length, 6);
      assert.ok(
        state.sectionLinks.every(
          ({ targetExists, text }) => targetExists && text,
        ),
      );
      assert.equal(state.sectionNavPosition, "sticky");
      assert.equal(state.toolbarRole, "group");
      assert.equal(state.footerExists, true);
      assert.equal(state.projectThumbnailCount, 5);
      assert.equal(state.audioControllerReady, true);
      assert.equal(state.interactiveSkillCount, 0);
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

      if (scenario.width <= 880) {
        assert.deepEqual(state.visualSectionOrder, state.domSectionOrder);
        assert.deepEqual(
          state.domSectionOrder,
          scenario.language === "ar"
            ? [
                "المشاريع",
                "الخبرات المهنية",
                "نبذة عني",
                "المهارات",
                "التعليم",
                "الشهادات المهنية",
              ]
            : [
                "Projects",
                "Employment",
                "About Me",
                "Skills",
                "Education",
                "Certifications",
              ],
        );
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
          window.Audio = class {
            pause() {}
            play() {
              return Promise.resolve();
            }
            set currentTime(_value) {}
          };
        });
        const audioButton = page.locator(".audio-play-btn").first();
        await audioButton.click();
        assert.equal(await audioButton.getAttribute("aria-pressed"), "true");
        await page.locator("body").press("Escape");
        assert.equal(await audioButton.getAttribute("aria-pressed"), "false");

        await page.evaluate(() => {
          window.print = () => {
            window.__printCalled = true;
          };
          document.querySelector("[data-print-resume]").click();
        });
        assert.equal(await page.evaluate(() => window.__printCalled), true);

        const themeBeforeShortcut = await page
          .locator("html")
          .getAttribute("data-theme");
        await page.locator("body").press("t");
        assert.equal(
          await page.locator("html").getAttribute("data-theme"),
          themeBeforeShortcut,
        );

        await page.locator('.section-nav a[href="#projects"]').click();
        assert.equal(
          await page
            .locator("#projects")
            .evaluate((panel) => getComputedStyle(panel).animationName),
          "targetPanel",
        );

        const firstProject = page.locator(".featured article").first();
        await firstProject.locator("a").first().focus();
        await page.waitForTimeout(60);
        assert.notEqual(
          await firstProject.evaluate(
            (article) => getComputedStyle(article).transform,
          ),
          "none",
        );

        const firstEntity = page.locator(".li-entity-link").first();
        await firstEntity.hover();
        await page.waitForTimeout(60);
        assert.notEqual(
          await firstEntity
            .locator(".li-company-logo")
            .evaluate((logo) => getComputedStyle(logo).transform),
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
        const tooltip = await page
          .locator(".lang-toggle")
          .evaluate((button) => {
            const style = getComputedStyle(button, "::before");
            return { left: style.left, right: style.right };
          });
        const outsideEdge =
          scenario.language === "ar" ? tooltip.left : tooltip.right;
        assert.notEqual(
          outsideEdge,
          "auto",
          "Tablet tooltip should open away from the portrait",
        );
      }

      await context.close();
      console.log(
        `Passed ${scenario.language} at ${scenario.width}x${scenario.height}`,
      );
    } catch (err) {
      console.error(
        `::error::Failed scenario ${scenario.language} at ${scenario.width}x${scenario.height}: ${err.message}`,
      );
      console.error(
        `❌ FAILED scenario: ${scenario.language} at ${scenario.width}x${scenario.height}`,
      );
      console.error(err);
      throw err;
    }
  }

  for (const language of ["en", "ar"]) {
    const context = await browser.newContext({
      javaScriptEnabled: false,
      locale: language === "ar" ? "ar-EG" : "en-US",
      viewport: { width: 1280, height: 800 },
    });
    const page = await context.newPage();
    const response = await page.goto(`${baseUrl}/${language}/`, {
      waitUntil: "load",
    });
    assert.equal(response?.status(), 200);
    assert.equal(await page.locator("html").getAttribute("lang"), language);
    assert.equal(
      await page.locator("html").getAttribute("dir"),
      language === "ar" ? "rtl" : "ltr",
    );
    assert.ok(await page.locator("h1").textContent());
    assert.equal(
      await page
        .locator('link[rel="stylesheet"]')
        .first()
        .evaluate((link) => Boolean(link.sheet)),
      true,
      `/${language}/ must load its generated stylesheet`,
    );
    assert.equal(
      await page.locator('link[rel="alternate"][hreflang="en"]').count(),
      1,
    );
    assert.equal(
      await page.locator('link[rel="alternate"][hreflang="ar"]').count(),
      1,
    );
    assert.equal(
      await page.locator('link[rel="alternate"][hreflang="x-default"]').count(),
      1,
    );
    assert.equal(
      await page.locator('meta[http-equiv="Content-Security-Policy"]').count(),
      1,
    );
    await context.close();
    console.log(`Passed static no-JavaScript route /${language}/`);
  }

  {
    const context = await browser.newContext({
      reducedMotion: "reduce",
      viewport: { width: 1280, height: 800 },
    });
    await context.addInitScript(() => {
      localStorage.setItem("resume-lang", "ar");
      localStorage.setItem("resume-theme", "dark");
      localStorage.setItem("resume-contrast", "high");
    });
    const page = await context.newPage();
    await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
    const preferences = await page.locator("html").evaluate((root) => ({
      contrast: root.dataset.contrast,
      direction: root.dir,
      language: root.lang,
      reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
      theme: root.dataset.theme,
    }));
    assert.deepEqual(preferences, {
      contrast: "high",
      direction: "rtl",
      language: "ar",
      reducedMotion: true,
      theme: "dark",
    });
    const accessibility = await new AxeBuilder({ page }).analyze();
    assert.deepEqual(accessibility.violations, []);
    await context.close();
    console.log("Passed persisted preferences and reduced motion");
  }

  {
    const context = await browser.newContext({
      forcedColors: "active",
      viewport: { width: 1280, height: 800 },
    });
    const page = await context.newPage();
    await page.goto(`${baseUrl}/en/`, { waitUntil: "domcontentloaded" });
    assert.equal(
      await page.evaluate(() => matchMedia("(forced-colors: active)").matches),
      true,
    );
    const accessibility = await new AxeBuilder({ page })
      .disableRules(["color-contrast"])
      .analyze();
    assert.deepEqual(accessibility.violations, []);
    await context.close();
    console.log("Passed OS forced-colors mode");
  }

  const caseStudyFiles = [
    "project-haj-arafa.html",
    "project-cairo-airport.html",
    "project-hr-tool.html",
    "project-azkar-app.html",
    "project-lego-explorer.html",
  ];

  for (const file of caseStudyFiles) {
    try {
      const context = await browser.newContext({
        viewport: { width: 375, height: 812 },
      });
      await context.route(
        /https:\/\/(fonts\.googleapis\.com|fonts\.gstatic\.com)\/.*/,
        (route) =>
          route.fulfill({ body: "", contentType: "text/css", status: 200 }),
      );
      const page = await context.newPage();
      page.setDefaultNavigationTimeout(10000);
      page.setDefaultTimeout(10000);
      const runtimeErrors = [];
      page.on("console", (message) => {
        if (message.type() === "error") runtimeErrors.push(message.text());
      });
      page.on("pageerror", (error) => runtimeErrors.push(error.message));

      await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
      await page.evaluate(() => localStorage.setItem("resume-lang", "ar"));
      const response = await page.goto(`${baseUrl}/${file}`, {
        waitUntil: "domcontentloaded",
      });
      assert.equal(response?.status(), 200);

      const state = await page.evaluate(() => ({
        brokenImages: [...document.images].filter(
          (image) => !image.complete || image.naturalWidth === 0,
        ).length,
        canonical: document.querySelector('link[rel="canonical"]')?.href,
        clientWidth: document.documentElement.clientWidth,
        direction: document.documentElement.dir,
        heading: document.querySelector("h1")?.textContent?.trim(),
        language: document.documentElement.lang,
        languageNotice: document
          .querySelector(".case-language-note")
          ?.textContent.trim(),
        paginationLinks: document.querySelectorAll(".case-study-pagination a")
          .length,
        resumeHref: document
          .querySelector(".case-study-nav a")
          ?.getAttribute("href"),
        scrollWidth: document.documentElement.scrollWidth,
        title: document.title,
        description: document.querySelector('meta[name="description"]')
          ?.content,
        projectKey: document.body.dataset.projectKey,
        schemaTypes: (() => {
          try {
            const schema = JSON.parse(
              document.querySelector("#person-schema")?.textContent || "[]",
            );
            return (Array.isArray(schema) ? schema : [schema]).map(
              (entry) => entry["@type"],
            );
          } catch {
            return ["invalid"];
          }
        })(),
        previewControls: document
          .querySelector("[data-toggle-embed]")
          ?.getAttribute("aria-controls"),
        previewHidden: document.querySelector("#live-embed-viewer")?.hidden,
        selectedDevices: document.querySelectorAll(
          '[data-set-device][aria-pressed="true"]',
        ).length,
        sandbox: document
          .querySelector(".live-embed-iframe")
          ?.getAttribute("sandbox"),
        provenanceItems: document.querySelectorAll(".provenance-grid > div")
          .length,
        projectLearning: document
          .querySelector(
            '.case-learning, .provenance-grid [data-translate$="_learning"], [data-translate*="learning"]',
          )
          ?.textContent?.trim(),
      }));

      assert.equal(state.language, "ar");
      assert.equal(state.direction, "rtl");
      assert.ok(state.heading);
      assert.equal(state.brokenImages, 0);
      assert.ok(
        state.scrollWidth <= state.clientWidth,
        `Case study ${file} has horizontal overflow: scrollWidth=${state.scrollWidth}px clientWidth=${state.clientWidth}px`,
      );
      assert.equal(state.paginationLinks, 2);
      assert.equal(state.resumeHref, "index.html#projects");
      assert.ok(state.canonical?.endsWith(file));
      assert.notEqual(
        state.title,
        "Ahmed Mahdy | UX Designer & Data Visualizer",
      );
      assert.ok(state.title.includes(state.heading));
      assert.ok(!state.description.includes("السيرة الذاتية"));
      assert.match(state.projectKey, /^cs_/);
      assert.deepEqual(state.schemaTypes, [
        "Person",
        "CreativeWork",
        "BreadcrumbList",
      ]);
      assert.equal(state.previewControls, "live-embed-viewer");
      assert.equal(state.previewHidden, true);
      assert.equal(state.selectedDevices, 1);
      assert.ok(state.sandbox?.includes("allow-scripts"));
      assert.equal(state.provenanceItems, 4);
      assert.ok(state.projectLearning);
      assert.deepEqual(runtimeErrors, []);

      const caseImage = page.locator(".case-study-image").first();
      await caseImage.click();
      assert.equal(
        await page.locator("#image-lightbox").evaluate((dialog) => dialog.open),
        true,
      );
      await page.keyboard.press("Tab");
      assert.equal(
        await page.evaluate(() =>
          Boolean(document.activeElement?.closest("#image-lightbox")),
        ),
        true,
      );
      await page.keyboard.press("Escape");
      assert.equal(
        await page.locator("#image-lightbox").evaluate((dialog) => dialog.open),
        false,
      );

      for (const selector of [
        ".lang-toggle",
        ".theme-toggle",
        ".contrast-toggle",
      ]) {
        await page.locator(selector).first().click();
        await page.waitForTimeout(250);
        const accessibility = await new AxeBuilder({ page }).analyze();
        assert.deepEqual(
          accessibility.violations.map(({ id, impact }) => ({ id, impact })),
          [],
        );
      }

      await page.emulateMedia({ media: "print" });
      assert.equal(
        await page
          .locator(".case-study-section")
          .first()
          .evaluate((section) => getComputedStyle(section).opacity),
        "1",
      );

      await context.close();
      console.log(`Passed case study ${file}`);
    } catch (err) {
      console.error(`::error::Failed case study ${file}: ${err.message}`);
      console.error(`❌ FAILED case study: ${file}`);
      console.error(err);
      throw err;
    }
  }
} catch (error) {
  console.error(
    `::error::FATAL Smoke test failure: ${error.stack || error.message || error}`,
  );
  console.error("FATAL Smoke test failure:", error);
  process.exitCode = 1;
} finally {
  await browser?.close();
  server.close();
}
