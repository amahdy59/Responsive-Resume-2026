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
      page.setDefaultNavigationTimeout(30000);
      page.setDefaultTimeout(30000);
      const runtimeErrors = [];

      page.on("console", (message) => {
        if (message.type() === "error") runtimeErrors.push(message.text());
      });
      page.on("pageerror", (error) => runtimeErrors.push(error.message));

      const response = await page.goto(`${baseUrl}/`, {
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
          fontFamilies: [
            ...new Set(
              [...document.querySelectorAll("body, body *")]
                .filter((element) => element.getClientRects().length)
                .map((element) => getComputedStyle(element).fontFamily),
            ),
          ],
          contactDescriptions:
            document.querySelectorAll(".contact-desc").length,
          contactIcons: document.querySelectorAll(".contact-list .contact-icon")
            .length,
          exposedEmail: document.querySelector(".contact-label[lang='en']")
            ?.textContent,
          innerWidth: window.innerWidth,
          language: document.documentElement.lang,
          audioControllerReady: Boolean(window.AntigravityAudio),
          interactiveSkillCount: document.querySelectorAll(
            '.pills [data-skill-filter], .pills [tabindex="0"]',
          ).length,
          overflowingElements: [...document.querySelectorAll("body *")]
            .filter(
              (element) =>
                !element.closest(".section-nav") &&
                !element.closest(".footer-sections"),
            )
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
          heroContactLinks: document.querySelectorAll(".contact-list a").length,
          heroContactMeetTarget: [
            ...document.querySelectorAll(".contact-list li"),
          ].every((li) => li.getBoundingClientRect().height >= 44),
          heroCtaTarget: (() => {
            const cta = document.querySelector(".hero-cta");
            if (!cta) return null;
            const box = cta.getBoundingClientRect();
            return {
              hash: new URL(cta.href).hash,
              visible: box.width > 0 && box.height >= 40,
            };
          })(),
          projectFilterCount: document.querySelectorAll(".project-filter-pill")
            .length,
          projectThumbnailCount:
            document.querySelectorAll(".project-thumbnail").length,
          projectTitleLinks: [
            ...document.querySelectorAll("#projects article h3 > a"),
          ].map((a) => new URL(a.href).pathname),
          projectThumbnailLinks: document.querySelectorAll(
            "#projects a.project-thumbnail-link > .project-thumbnail",
          ).length,
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
      // Repeated actions (for example print) may share the same accessible name.
      assert.equal(state.skipTargetTabIndex, -1);
      assert.equal(state.sectionLinks.length, 4);
      assert.ok(
        state.sectionLinks.every(
          ({ targetExists, text }) => targetExists && text,
        ),
      );
      assert.equal(state.sectionNavPosition, "sticky");
      assert.equal(state.toolbarRole, "group");
      assert.equal(state.footerExists, false);
      assert.equal(state.projectThumbnailCount, 5);
      assert.equal(state.audioControllerReady, true);
      assert.equal(state.interactiveSkillCount, 0);
      assert.equal(state.contactDescriptions, 0);
      assert.equal(state.contactIcons, 3);
      assert.equal(state.exposedEmail, undefined);
      if (scenario.language === "ar") {
        assert.deepEqual(state.fontFamilies, ['"Cairo Variable", sans-serif']);
      }
      assert.equal(state.resumeActionCount, 0);
      assert.ok(
        state.heroContactLinks >= 3,
        "Contact list must have at least 3 links",
      );
      assert.equal(state.heroContactMeetTarget, true);
      assert.equal(state.projectFilterCount, 0);
      assert.deepEqual(
        state.heroCtaTarget,
        { hash: "#projects", visible: true },
        "Hero must expose a visible primary CTA pointing at #projects",
      );
      assert.equal(
        state.projectTitleLinks.length,
        5,
        "Every project title must link to its case study",
      );
      assert.ok(
        state.projectTitleLinks.every((path) =>
          /\/project-[a-z-]+\.html$/.test(path),
        ),
        `Project titles must link to case-study pages: ${state.projectTitleLinks.join(", ")}`,
      );
      assert.equal(
        state.projectThumbnailLinks,
        5,
        "Every project thumbnail must link to its case study",
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
                "الشهادات المهنية",
                "التعليم",
              ]
            : [
                "Projects",
                "Employment",
                "About Me",
                "Skills",
                "Certifications",
                "Education",
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
            constructor(src) {
              window.__narrationSource = src;
              this.paused = true;
            }
            pause() {
              this.paused = true;
            }
            play() {
              this.paused = false;
              return Promise.resolve();
            }
            set currentTime(_value) {}
          };
        });
        const audioButton = page.locator(".audio-play-btn").first();
        await audioButton.click();
        assert.equal(await audioButton.getAttribute("aria-pressed"), "true");
        assert.equal(
          await page
            .locator(".global-audio-player")
            .evaluate((player) => player.hidden),
          false,
        );
        assert.equal(
          await page.locator("[data-audio-speed] option").count(),
          5,
        );
        assert.equal(
          await page.locator(".audio-player-artwork svg").count(),
          1,
        );
        assert.ok(
          (await page.locator(".audio-player-controls svg").count()) >= 6,
        );
        await page.waitForFunction(() => Boolean(window.__narrationSource));
        assert.match(
          await page.evaluate(() => window.__narrationSource),
          /(?:\/assets\/audio\/en-resume-employment-|\/portfolio\/narration\/en\/resume-employment-)[a-f0-9]+\.mp3$/,
        );
        await page.locator("body").press("Escape");
        assert.equal(await audioButton.getAttribute("aria-pressed"), "false");
        assert.equal(
          await page
            .locator(".global-audio-player")
            .evaluate((player) => player.hidden),
          true,
        );

        await page.evaluate(() => {
          window.print = () => {
            window.__printCalled = true;
          };
          document.querySelector("[data-print-resume]").click();
        });
        assert.equal(await page.evaluate(() => window.__printCalled), true);

        await page.emulateMedia({ media: "print" });
        const printHeroState = await page.evaluate(() => ({
          contactListDisplay: getComputedStyle(
            document.querySelector(".contact-list"),
          ).display,
          emailLinkDisplay: getComputedStyle(
            document.querySelector('.contact-list a[href^="mailto:"]'),
          ).display,
          controlsDisplay: getComputedStyle(
            document.querySelector(".controls-group"),
          ).display,
          printContactDisplay: getComputedStyle(
            document.querySelector(".print-contact"),
          ).display,
          avatarDisplay: getComputedStyle(
            document.querySelector(".avatar-wrap"),
          ).display,
          projectImageDisplay: getComputedStyle(
            document.querySelector(".project-thumbnail-link"),
          ).display,
          resumeCardDisplay: getComputedStyle(
            document.querySelector(".resume-card"),
          ).display,
          printResumeDisplay: getComputedStyle(
            document.querySelector(".print-resume-document"),
          ).display,
        }));
        assert.notEqual(printHeroState.contactListDisplay, "none");
        assert.notEqual(printHeroState.emailLinkDisplay, "none");
        assert.equal(printHeroState.controlsDisplay, "none");
        assert.equal(printHeroState.printContactDisplay, "flex");
        assert.equal(printHeroState.avatarDisplay, "none");
        assert.equal(printHeroState.projectImageDisplay, "none");
        assert.equal(printHeroState.resumeCardDisplay, "none");
        assert.equal(printHeroState.printResumeDisplay, "block");
        await page.emulateMedia({ media: "screen" });

        assert.equal(
          await page
            .locator(".skills-panel .pills > [role='listitem']")
            .count(),
          await page.locator(".skills-panel .skill-item-icon").count(),
        );
        assert.equal(
          await page.locator(".compact-list > li").count(),
          await page.locator(".compact-list .cert-item-icon").count(),
        );

        await page.evaluate(() =>
          window.scrollTo(0, document.body.scrollHeight),
        );
        await page.waitForFunction(
          () => !document.querySelector(".back-to-top-fab").hidden,
        );
        await page.locator(".back-to-top-fab").click();
        await page.waitForFunction(() => window.scrollY < 5);
        assert.equal(
          await page.evaluate(() => document.activeElement?.id),
          "main-content",
        );

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
        assert.equal(
          await firstProject.evaluate(
            (article) => getComputedStyle(article).transform,
          ),
          "none",
        );

        const firstEntity = page.locator(".li-entity-link").first();
        await firstEntity.hover();
        await page.waitForTimeout(60);
        assert.equal(
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
          assert.equal(
            await toggle.locator(".control-state").textContent(),
            after.pressed === "true" ? "On" : "Off",
          );
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

  for (const theme of ["light", "dark"]) {
    for (const contrast of ["normal", "high"]) {
      const context = await browser.newContext({
        viewport: { width: 375, height: 812 },
      });
      await context.addInitScript(
        ({ theme, contrast }) => {
          localStorage.setItem("resume-theme", theme);
          localStorage.setItem("resume-contrast", contrast);
        },
        { theme, contrast },
      );
      const page = await context.newPage();
      await page.goto(`${baseUrl}/en/`, { waitUntil: "domcontentloaded" });
      const ratios = await page.locator(".hero-btn-work").evaluate((button) => {
        const style = getComputedStyle(button);
        const rootStyle = getComputedStyle(document.documentElement);
        const computedColor = (color) => {
          const probe = document.createElement("span");
          probe.style.color = color;
          document.body.append(probe);
          const computed = getComputedStyle(probe).color;
          probe.remove();
          return computed;
        };
        const luminance = (color) => {
          const rgb = computedColor(color)
            .match(/[\d.]+/g)
            .slice(0, 3)
            .map(Number)
            .map((value) => {
              const channel = value / 255;
              return channel <= 0.04045
                ? channel / 12.92
                : ((channel + 0.055) / 1.055) ** 2.4;
            });
          return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
        };
        const ratio = (foreground, background) => {
          const values = [luminance(foreground), luminance(background)].sort(
            (a, b) => a - b,
          );
          return (values[1] + 0.05) / (values[0] + 0.05);
        };
        const panel = rootStyle.getPropertyValue("--panel").trim();
        return {
          action: ratio(style.color, style.backgroundColor),
          body: ratio(rootStyle.getPropertyValue("--text").trim(), panel),
          link: ratio(rootStyle.getPropertyValue("--blue").trim(), panel),
          muted: ratio(rootStyle.getPropertyValue("--muted").trim(), panel),
        };
      });
      for (const [role, ratio] of Object.entries(ratios)) {
        assert.ok(
          ratio >= 7,
          `${role} contrast in ${theme}/${contrast}: ${ratio}`,
        );
      }
      const accessibility = await new AxeBuilder({ page }).analyze();
      assert.deepEqual(
        accessibility.violations.map(({ id, nodes }) => ({
          id,
          targets: nodes.map(({ target }) => target),
        })),
        [],
      );
      await context.close();
      console.log(`Passed ${theme}/${contrast} contrast and accessibility`);
    }
  }

  const caseStudyFiles = [
    "project-haj-arafa.html",
    "project-cairo-airport.html",
    "project-hr-tool.html",
    "project-azkar-app.html",
    "project-lego-explorer.html",
  ];

  for (const language of ["en", "ar"]) {
    const context = await browser.newContext({
      viewport: { width: 320, height: 700 },
    });
    const page = await context.newPage();
    await page.goto(`${baseUrl}/${language}/case-studies/haj-arafa/`, {
      waitUntil: "domcontentloaded",
    });
    const clippedControls = await page
      .locator(".case-study-nav")
      .evaluate((nav) =>
        [...nav.querySelectorAll("button, a")]
          .filter((control) => {
            const rect = control.getBoundingClientRect();
            return (
              rect.width > 0 &&
              (rect.left < 0 ||
                rect.right > document.documentElement.clientWidth ||
                rect.width < 44 ||
                rect.height < 44)
            );
          })
          .map((control) => control.className),
      );
    assert.deepEqual(
      clippedControls,
      [],
      `${language} mobile case-study controls must fit and meet 44px targets`,
    );
    assert.equal(await page.locator("details[open]").count(), 4);
    await context.close();
  }

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
      page.setDefaultNavigationTimeout(30000);
      page.setDefaultTimeout(30000);
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
        repeatedDisclosureItems: document.querySelectorAll(
          '[data-translate^="cs_provenance_ownership"], [data-translate^="cs_provenance_background"], [data-translate^="cs_provenance_ai"]',
        ).length,
        jumpMenuVisible:
          getComputedStyle(document.querySelector(".case-section-jump"))
            .display !== "none",
        jumpMenuOptions: document.querySelectorAll(".case-section-jump option")
          .length,
        tradeoffs: document.querySelectorAll(".case-tradeoff").length,
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
      assert.ok(state.provenanceItems >= 1);
      assert.equal(state.repeatedDisclosureItems, 0);
      assert.equal(state.jumpMenuVisible, true);
      assert.equal(state.jumpMenuOptions, 6);
      assert.equal(state.tradeoffs, 1);
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
          .locator(".case-accordion")
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
