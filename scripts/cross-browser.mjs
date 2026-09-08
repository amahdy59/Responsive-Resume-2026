import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { chromium, firefox, webkit } from "playwright";

const server = spawn(
  process.execPath,
  ["scripts/serve.mjs", "--root", "dist", "--port", "0"],
  { stdio: ["ignore", "pipe", "inherit"] },
);
try {
  const [output] = await once(server.stdout, "data");
  const origin = output.toString().match(/http:\/\/127\.0\.0\.1:\d+/)?.[0];
  assert.ok(origin, "Preview server did not report its URL");
  for (const engine of [chromium, firefox, webkit]) {
    const browser = await engine.launch();
    try {
      for (const language of ["en", "ar"]) {
        for (const storage of ["blocked", "invalid"]) {
          const context = await browser.newContext({
            viewport: { width: 375, height: 812 },
            reducedMotion: "reduce",
            colorScheme: "light",
          });
          await context.addInitScript((mode) => {
            if (mode === "blocked") {
              Object.defineProperty(window, "localStorage", {
                get() {
                  throw new DOMException("Storage disabled", "SecurityError");
                },
              });
            } else {
              for (const key of [
                "resume-lang",
                "resume-theme",
                "resume-contrast",
              ])
                localStorage.setItem(key, "invalid");
            }
          }, storage);
          const page = await context.newPage();
          // WebKit upgrades loopback HTTP too. Only remove this HTTPS-only
          // directive from local HTML; keep every other production CSP rule.
          await page.route(`${origin}/**`, async (route) => {
            if (
              route.request().resourceType() !== "document" ||
              !/\/$|\.html$/.test(new URL(route.request().url()).pathname)
            )
              return route.continue();
            const response = await route.fetch();
            await route.fulfill({
              response,
              body: (await response.text()).replaceAll(
                "; upgrade-insecure-requests",
                "",
              ),
            });
          });
          const errors = [];
          page.on("pageerror", (error) => errors.push(error.message));
          for (const path of [
            `/${language}/`,
            `/${language}/case-studies/haj-arafa/`,
          ]) {
            await page.goto(`${origin}${path}`, { waitUntil: "load" });
            await page.evaluate(() => document.fonts.ready);
            assert.deepEqual(
              errors,
              [],
              `${engine.name()} ${path}: initialization errors`,
            );
            assert.equal(
              await page.locator("html").getAttribute("lang"),
              language,
            );
            assert.equal(
              await page.locator("html").getAttribute("data-theme"),
              "light",
            );
            assert.equal(
              await page.locator("html").getAttribute("data-contrast"),
              "normal",
            );
            for (const selector of [".theme-toggle", ".contrast-toggle"]) {
              const toggle = page.locator(selector).first();
              await toggle.focus();
              await page.keyboard.press("Space");
              assert.equal(await toggle.getAttribute("aria-checked"), "true");
            }
            for (const width of [320, 768, 1280]) {
              await page.setViewportSize({ width, height: 900 });
              assert.ok(
                await page.evaluate(
                  () => document.documentElement.scrollWidth <= innerWidth,
                ),
                `${engine.name()} ${path} overflow at ${width}`,
              );
              assert.ok(
                await page.locator(".pagination-card").evaluateAll((cards) =>
                  cards.every((card) => {
                    const r = card.getBoundingClientRect();
                    return r.left >= -1 && r.right <= innerWidth + 1;
                  }),
                ),
                "Pagination must not be clipped",
              );
            }
            if (path.includes("case-studies")) {
              await page.locator(".case-study-image").focus();
              await page.keyboard.press("Enter");
              assert.ok(
                await page
                  .locator("#image-lightbox")
                  .evaluate((dialog) => dialog.open),
              );
              await page.keyboard.press("Escape");
              assert.ok(
                await page
                  .locator(".case-study-image")
                  .evaluate((image) => image === document.activeElement),
              );
            } else {
              await page.locator(".resume-download-menu summary").focus();
              await page.keyboard.press("Enter");
              assert.ok(
                await page
                  .locator(".resume-download-menu")
                  .evaluate((menu) => menu.open),
              );
              const downloadLink = page
                .locator(".resume-download-options a[download]")
                .first();
              if (
                (engine === webkit || engine === firefox) &&
                process.platform === "win32"
              ) {
                // Windows WebKit and Firefox do not reliably emit download events in this harness.
                // Verify the document; physical browser download UX stays manual.
                const response = await context.request.get(
                  await downloadLink.evaluate((link) => link.href),
                );
                assert.ok(response.ok());
                assert.equal(
                  (await response.body()).subarray(0, 5).toString(),
                  "%PDF-",
                );
              } else {
                const downloadEvent = page.waitForEvent("download");
                await downloadLink.click();
                const download = await downloadEvent;
                assert.equal(await download.failure(), null);
              }
              await page.keyboard.press("Escape");
            }
          }
          const other = language === "en" ? "ar" : "en";
          await page.locator(`.language-option[lang="${other}"] input`).focus();
          await page.keyboard.press("Space");
          await page.waitForURL((url) =>
            url.pathname.startsWith(`/${other}/case-studies/haj-arafa/`),
          );
          assert.equal(await page.locator("html").getAttribute("lang"), other);
          assert.deepEqual(errors, []);
          await context.close();
          console.log(
            `Passed ${engine.name()}: ${language}, ${storage} storage, responsive controls, downloads and dialog`,
          );
        }
      }
    } finally {
      await browser.close();
    }
  }
} finally {
  server.kill();
}
