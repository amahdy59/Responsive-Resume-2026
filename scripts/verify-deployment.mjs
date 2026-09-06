import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { chromium } from "playwright";

const origin = "https://creativemahdy.space";
const repository = "amahdy59/Responsive-Resume-2026";
const argument = process.argv.slice(2).find((value) => !value.startsWith("--"));
const commit =
  argument ||
  process.env.GITHUB_SHA ||
  execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
assert.match(commit, /^[a-f0-9]{7,40}$/i);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const matches = (sha) => typeof sha === "string" && sha.startsWith(commit);

async function get(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    signal: AbortSignal.timeout(20000),
  });
  assert.ok(response.ok, `${url}: HTTP ${response.status}`);
  return response;
}

// A healthy old site is not proof that this release deployed successfully.
if (!process.argv.includes("--live-only")) {
  const headers = { Accept: "application/vnd.github+json" };
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;
  let completed = false;
  for (let attempt = 0; attempt < 60; attempt++) {
    const data = await (
      await get(
        `https://api.github.com/repos/${repository}/actions/workflows/deploy.yml/runs?head_sha=${commit}&per_page=10`,
        { headers },
      )
    ).json();
    const run = data.workflow_runs.find(
      (item) => matches(item.head_sha) && item.event !== "pull_request",
    );
    if (run?.status === "completed") {
      assert.equal(
        run.conclusion,
        "success",
        `Deployment failed: ${run.html_url}`,
      );
      console.log(`Workflow passed: ${run.html_url}`);
      completed = true;
      break;
    }
    if (attempt % 3 === 0)
      console.log(`Waiting for deployment of ${commit.slice(0, 7)}...`);
    await sleep(20000);
  }
  assert.ok(
    completed,
    "Timed out waiting for the exact deployment workflow; release remains unverified.",
  );
}

let released = false;
for (let attempt = 0; attempt < 30; attempt++) {
  try {
    const release = await (
      await get(`${origin}/release.json?verify=${Date.now()}`, {
        cache: "no-store",
      })
    ).json();
    if (matches(release.commit)) {
      released = true;
      break;
    }
  } catch (error) {
    if (attempt === 29) throw error;
  }
  if (attempt % 3 === 0)
    console.log("Waiting for the expected release to reach production...");
  await sleep(10000);
}
assert.ok(released, `Production is not serving commit ${commit}`);

const slugs = [
  "haj-arafa",
  "cairo-airport",
  "hr-tool",
  "azkar-app",
  "lego-explorer",
];
for (const path of [
  "/",
  "/sitemap.xml",
  "/robots.txt",
  ...slugs.map((slug) => `/project-${slug}.html`),
  ...["en", "ar"].flatMap((lang) => [
    `/${lang}/`,
    ...slugs.map((slug) => `/${lang}/case-studies/${slug}/`),
  ]),
]) {
  const response = await get(`${origin}${path}`);
  assert.ok((await response.text()).length > 20, `Empty route: ${path}`);
  console.log(`Live route passed: ${path}`);
}

const browser = await chromium.launch({ headless: true });
try {
  for (const language of ["en", "ar"]) {
    const page = await browser.newPage({
      viewport: { width: 375, height: 812 },
      reducedMotion: "reduce",
    });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(`${origin}/${language}/`, { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
    assert.equal(await page.locator("html").getAttribute("lang"), language);
    assert.equal(
      await page.locator("html").getAttribute("dir"),
      language === "ar" ? "rtl" : "ltr",
    );
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      true,
      "Mobile overflow",
    );
    await page.locator(".theme-toggle").click();
    assert.equal(await page.locator("html").getAttribute("data-theme"), "dark");
    await page.locator(".resume-download-menu > summary").click();
    for (const extension of ["pdf", "docx"]) {
      const link = page.locator(
        `.resume-download-options a[href$=".${extension}"]`,
      );
      const url = await link.evaluate((element) => element.href);
      const response = await get(url);
      const bytes = new Uint8Array(await response.arrayBuffer());
      assert.ok(bytes.length > 1000, `Empty ${extension} download`);
      assert.equal(
        String.fromCharCode(...bytes.slice(0, extension === "pdf" ? 4 : 2)),
        extension === "pdf" ? "%PDF" : "PK",
      );
    }
    await page.keyboard.press("Escape");
    assert.equal(
      await page
        .locator(".resume-download-menu")
        .evaluate((element) => element.open),
      false,
    );
    const audio = await page.evaluate(async (lang) => {
      const manifest = await (
        await fetch("/assets/audio/narration.json")
      ).json();
      const response = await fetch(manifest[`${lang}/resume-employment`].url, {
        headers: { Range: "bytes=0-1023" },
        signal: AbortSignal.timeout(20000),
      });
      const result = {
        ok: response.ok,
        type: response.headers.get("content-type"),
        size: (await response.arrayBuffer()).byteLength,
      };
      return result;
    }, language);
    assert.ok(
      audio.ok && audio.type?.startsWith("audio/") && audio.size > 0,
      "Narration failed real-origin CORS/media check",
    );
    assert.deepEqual(errors, [], "Production JavaScript errors");
    await page.close();
    console.log(
      `Live ${language}: mobile layout, theme, downloads, keyboard menu, and narration passed`,
    );
  }
} finally {
  await browser.close();
}
console.log(`Production verified at commit ${commit}.`);
