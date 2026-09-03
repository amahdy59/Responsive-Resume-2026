import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import {
  copyFile,
  mkdir,
  readdir,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { dirname, join, parse } from "node:path";
import { fileURLToPath } from "node:url";
import { parseHTML } from "linkedom";

const root = dirname(fileURLToPath(import.meta.url));
const dist = join(root, "dist");
const productionUrl = "https://creativemahdy.space";
const caseStudies = [
  { file: "project-haj-arafa.html", key: "cs_haj", slug: "haj-arafa" },
  {
    file: "project-cairo-airport.html",
    key: "cs_cairo",
    slug: "cairo-airport",
  },
  { file: "project-hr-tool.html", key: "cs_hr", slug: "hr-tool" },
  { file: "project-azkar-app.html", key: "cs_azkar", slug: "azkar-app" },
  { file: "project-lego-explorer.html", key: "cs_lego", slug: "lego-explorer" },
];
const requiredPaths = [
  "index.html",
  "styles",
  "fonts.css",
  "script.js",
  "audio-player.js",
  "preference-bootstrap.js",
  "assets",
];
// Cascade-dependent load order for the styles/ source partials: tokens before
// anything that reads them, base/animations/components before the two
// page-domain files, then the cross-cutting override layers (responsive,
// accessibility modes, print) last. Concatenated 1:1 into the single
// fingerprinted styles.css bundle below — this list is the only place that
// order is decided.
const styleBundleOrder = [
  "tokens.css",
  "base.css",
  "animations.css",
  "components.css",
  "home.css",
  "case-study.css",
  "responsive.css",
  "accessibility-modes.css",
  "print.css",
];
const hash = (value) =>
  createHash("sha256").update(value).digest("hex").slice(0, 10);

async function copyDirectory(source, destination) {
  await mkdir(destination, { recursive: true });
  for (const entry of await readdir(source, { withFileTypes: true })) {
    if (entry.name === "screenshots") continue;
    const sourcePath = join(source, entry.name);
    const destinationPath = join(destination, entry.name);
    if (entry.isDirectory()) await copyDirectory(sourcePath, destinationPath);
    else await copyFile(sourcePath, destinationPath);
  }
}

async function fingerprintDirectory(source, destination, webPrefix, mapping) {
  for (const entry of await readdir(source, { withFileTypes: true })) {
    const sourcePath = join(source, entry.name);
    const nestedPrefix = `${webPrefix}/${entry.name}`;
    if (entry.isDirectory()) {
      await fingerprintDirectory(
        sourcePath,
        join(destination, entry.name),
        nestedPrefix,
        mapping,
      );
      continue;
    }
    const contents = await readFile(sourcePath);
    const parsed = parse(entry.name);
    const fingerprintedName = `${parsed.name}.${hash(contents)}${parsed.ext}`;
    await mkdir(destination, { recursive: true });
    await writeFile(join(destination, fingerprintedName), contents);
    mapping.set(nestedPrefix, `${webPrefix}/${fingerprintedName}`);
  }
}

function readTranslations(scriptSource) {
  const start = scriptSource.indexOf("const translations = ");
  const end = scriptSource.indexOf("\n};\n\n/**", start);
  if (start < 0 || end < 0)
    throw new Error("Unable to locate translation dictionaries.");
  const objectLiteral = scriptSource.slice(
    start + "const translations = ".length,
    end + 2,
  );
  return Function(`"use strict"; return (${objectLiteral});`)();
}

function ensureAlternateLinks(document, localizedPath, legacyPath) {
  document
    .querySelectorAll('link[rel="alternate"][hreflang]')
    .forEach((node) => node.remove());
  const pairs = [
    ["en", `${productionUrl}/en${localizedPath}`],
    ["ar", `${productionUrl}/ar${localizedPath}`],
    ["x-default", `${productionUrl}${legacyPath}`],
  ];
  for (const [language, href] of pairs) {
    const link = document.createElement("link");
    link.rel = "alternate";
    link.hreflang = language;
    link.href = href;
    document.head.append(link);
  }
}

function addSecurityMetadata(document) {
  if (!document.querySelector('meta[http-equiv="Content-Security-Policy"]')) {
    const csp = document.createElement("meta");
    csp.setAttribute("http-equiv", "Content-Security-Policy");
    csp.content =
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self'; font-src 'self'; img-src 'self' data: https:; media-src 'self'; frame-src https://amahdy59.github.io https://mavenshowcase.com; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self' mailto:; upgrade-insecure-requests";
    document.head.prepend(csp);
  }
  if (!document.querySelector('meta[name="referrer"]')) {
    const referrer = document.createElement("meta");
    referrer.name = "referrer";
    referrer.content = "strict-origin-when-cross-origin";
    document.head.append(referrer);
  }
}

function replaceTextPreservingChildren(node, value) {
  const textNode = [...node.childNodes].find((child) => child.nodeType === 3);
  if (textNode && node.children.length) textNode.textContent = `${value} `;
  else node.textContent = value;
}

function applyTranslations(document, dictionary) {
  document.querySelectorAll("[data-translate]").forEach((node) => {
    const value = dictionary[node.dataset.translate];
    if (value) replaceTextPreservingChildren(node, value);
  });
  document.querySelectorAll("[data-translate-attr]").forEach((node) => {
    const value = dictionary[node.dataset.translateAttrKey];
    if (value) node.setAttribute(node.dataset.translateAttr, value);
  });
}

function localizeDocument(document, language, translations, page) {
  const dictionary = translations[language];
  document.documentElement.lang = language;
  document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
  document.body.dataset.staticLocale = language;
  document.body.dataset.staticPath = page.localizedPath;
  applyTranslations(document, dictionary);

  const projectTitle = page.key ? dictionary[`${page.key}_title`] : "";
  const description = page.key
    ? dictionary[`${page.key}_sub`]
    : dictionary.meta_description;
  const title = page.key
    ? `${projectTitle} | ${language === "ar" ? "ملف أعمال أحمد مهدي" : "Ahmed Mahdy Portfolio"}`
    : dictionary.meta_title;
  document.title = title;
  document
    .querySelector('meta[name="description"]')
    ?.setAttribute("content", description);
  document
    .querySelector('meta[property="og:title"]')
    ?.setAttribute("content", title);
  document
    .querySelector('meta[property="og:description"]')
    ?.setAttribute("content", description);
  document
    .querySelector('meta[property="twitter:title"]')
    ?.setAttribute("content", title);
  document
    .querySelector('meta[property="twitter:description"]')
    ?.setAttribute("content", description);

  if (language === "ar" && page.key) {
    document.querySelectorAll(".audio-play-btn").forEach((button) => {
      const heading =
        button
          .closest("header, section")
          ?.querySelector("h1, h2")
          ?.textContent?.trim() || projectTitle;
      button.setAttribute("aria-label", `استمع إلى ${heading}`);
      button.title = "استمع إلى السرد";
    });
    const image = document.querySelector(".case-study-image");
    if (image) image.alt = `${projectTitle} - معاينة الواجهة`;
    const iframe = document.querySelector(".live-embed-iframe");
    if (iframe) iframe.title = `معاينة تفاعلية لمشروع ${projectTitle}`;
  }
}

function updateLocalizedLinks(document, language, pageByFile) {
  document.querySelectorAll("a[href]").forEach((link) => {
    const href = link.getAttribute("href");
    if (href === "index.html" || href === "./" || href === "/")
      link.href = `/${language}/`;
    else if (href === "index.html#projects" || href === "/#projects")
      link.href = `/${language}/#projects`;
    else {
      const [file, fragment = ""] = href.split("#");
      const target = pageByFile.get(file);
      if (target)
        link.href = `/${language}${target.localizedPath}${fragment ? `#${fragment}` : ""}`;
    }
  });
}

function rewriteAssetReferences(document, mapping, bundleNames) {
  document.querySelectorAll("[src], [href]").forEach((node) => {
    for (const attribute of ["src", "href"]) {
      const value = node.getAttribute(attribute);
      if (!value) continue;
      if (mapping.has(value)) node.setAttribute(attribute, mapping.get(value));
      else if (bundleNames.has(value))
        node.setAttribute(attribute, bundleNames.get(value));
    }
  });
  document.querySelectorAll("[srcset]").forEach((node) => {
    const rewritten = node
      .getAttribute("srcset")
      .split(",")
      .map((candidate) => {
        const [url, descriptor] = candidate.trim().split(/\s+/, 2);
        return `${mapping.get(url) || url}${descriptor ? ` ${descriptor}` : ""}`;
      })
      .join(", ");
    node.setAttribute("srcset", rewritten);
  });
}

const serialize = (document) =>
  `<!doctype html>\n${document.documentElement.outerHTML}\n`;

for (const requiredPath of requiredPaths) {
  if (!existsSync(join(root, requiredPath)))
    throw new Error(`Missing required file or folder: ${requiredPath}`);
}
await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
await copyDirectory(join(root, "assets"), join(dist, "assets"));

const fontSources = [
  ["@fontsource-variable/inter", "inter-latin-wght-normal.woff2"],
  ["@fontsource-variable/inter", "inter-latin-ext-wght-normal.woff2"],
  ["@fontsource-variable/cairo", "cairo-arabic-wght-normal.woff2"],
  ["@fontsource-variable/cairo", "cairo-latin-wght-normal.woff2"],
];
await mkdir(join(dist, "assets", "fonts"), { recursive: true });
for (const [packageName, file] of fontSources) {
  await copyFile(
    join(root, "node_modules", packageName, "files", file),
    join(dist, "assets", "fonts", file),
  );
}

const assetMapping = new Map();
await fingerprintDirectory(
  join(dist, "assets"),
  join(dist, "assets"),
  "assets",
  assetMapping,
);
const scriptSource = await readFile(join(root, "script.js"), "utf8");
const translations = readTranslations(scriptSource);
const stylesBundle = (
  await Promise.all(
    styleBundleOrder.map((file) =>
      readFile(join(root, "styles", file), "utf8"),
    ),
  )
).join("\n");
const bundleSources = new Map([
  ["styles.css", stylesBundle],
  ["fonts.css", await readFile(join(root, "fonts.css"), "utf8")],
  ["script.js", scriptSource],
  ["audio-player.js", await readFile(join(root, "audio-player.js"), "utf8")],
  [
    "preference-bootstrap.js",
    await readFile(join(root, "preference-bootstrap.js"), "utf8"),
  ],
]);
for (const [stablePath, hashedPath] of assetMapping) {
  if (stablePath.startsWith("assets/fonts/"))
    bundleSources.set(
      "fonts.css",
      bundleSources.get("fonts.css").replaceAll(stablePath, hashedPath),
    );
}
const bundleNames = new Map();
for (const [file, contents] of bundleSources) {
  const parsed = parse(file);
  const output = `${parsed.name}.${hash(contents)}${parsed.ext}`;
  bundleNames.set(file, output);
  await writeFile(join(dist, output), contents);
}

const pageByFile = new Map(
  caseStudies.map((page) => [
    page.file,
    { ...page, localizedPath: `/case-studies/${page.slug}/` },
  ]),
);
const pages = [
  { file: "index.html", localizedPath: "/" },
  ...caseStudies.map((page) => ({
    ...page,
    localizedPath: `/case-studies/${page.slug}/`,
  })),
];
for (const page of pages) {
  const source = await readFile(join(root, page.file), "utf8");
  const { document: legacyDocument } = parseHTML(source);
  if (page.key) applyTranslations(legacyDocument, translations.en);
  const legacyPath = page.file === "index.html" ? "/" : `/${page.file}`;
  ensureAlternateLinks(legacyDocument, page.localizedPath, legacyPath);
  addSecurityMetadata(legacyDocument);
  rewriteAssetReferences(legacyDocument, assetMapping, bundleNames);
  await writeFile(join(dist, page.file), serialize(legacyDocument));

  for (const language of ["en", "ar"]) {
    const { document } = parseHTML(source);
    const base = document.createElement("base");
    base.setAttribute("href", "/");
    document.head.prepend(base);
    localizeDocument(document, language, translations, page);
    updateLocalizedLinks(document, language, pageByFile);
    ensureAlternateLinks(document, page.localizedPath, legacyPath);
    addSecurityMetadata(document);
    const canonicalUrl = `${productionUrl}/${language}${page.localizedPath}`;
    document
      .querySelector('link[rel="canonical"]')
      ?.setAttribute("href", canonicalUrl);
    document
      .querySelector('meta[property="og:url"]')
      ?.setAttribute("content", canonicalUrl);
    rewriteAssetReferences(document, assetMapping, bundleNames);
    const outputDirectory =
      page.localizedPath === "/"
        ? join(dist, language)
        : join(dist, language, "case-studies", page.slug);
    await mkdir(outputDirectory, { recursive: true });
    await writeFile(join(outputDirectory, "index.html"), serialize(document));
  }
}

const urls = [
  `${productionUrl}/`,
  ...["en", "ar"].flatMap((language) => [
    `${productionUrl}/${language}/`,
    ...caseStudies.map(
      ({ slug }) => `${productionUrl}/${language}/case-studies/${slug}/`,
    ),
  ]),
];
await writeFile(
  join(dist, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((url) => `  <url><loc>${url}</loc></url>`).join("\n")}\n</urlset>\n`,
);
await writeFile(
  join(dist, "robots.txt"),
  `User-agent: *\nAllow: /\nSitemap: ${productionUrl}/sitemap.xml\n`,
);
if (existsSync(join(root, "CNAME")))
  await copyFile(join(root, "CNAME"), join(dist, "CNAME"));
console.log(
  `Static portfolio built with ${bundleNames.size} fingerprinted bundles, ${assetMapping.size} fingerprinted assets, and ${urls.length} indexed URLs.`,
);
