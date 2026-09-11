import { execFileSync } from "node:child_process";
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
import { expandCaseHeader } from "./scripts/case-template.mjs";

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
const commonPrefixStyles = [
  "tokens.css",
  "base.css",
  "animations.css",
  "components.css",
];
const commonSuffixStyles = [
  "responsive.css",
  "accessibility-modes.css",
  "print.css",
];
const homeStyleOrder = [
  ...commonPrefixStyles,
  "home.css",
  ...commonSuffixStyles,
];
const caseStyleOrder = [
  ...commonPrefixStyles,
  "case-study.css",
  ...commonSuffixStyles,
];
const styleBundleOrder = [
  ...commonPrefixStyles,
  "home.css",
  "case-study.css",
  ...commonSuffixStyles,
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

async function readTranslations() {
  return {
    ar: JSON.parse(
      await readFile(join(root, "data", "locales", "ar.json"), "utf8"),
    ),
    en: JSON.parse(
      await readFile(join(root, "data", "locales", "en.json"), "utf8"),
    ),
  };
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
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self'; font-src 'self'; img-src 'self' data: https:; media-src 'self' https://pub-0e85a9758556488098db7ca057ac5d1e.r2.dev; frame-src https://wa-zaker.com https://amahdy59.github.io https://mavenshowcase.com; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self' mailto:; upgrade-insecure-requests";
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
  document.querySelectorAll(".language-option-input").forEach((input) => {
    input.toggleAttribute("checked", input.value === language);
  });

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

  let ogLocale = document.querySelector('meta[property="og:locale"]');
  if (!ogLocale) {
    ogLocale = document.createElement("meta");
    ogLocale.setAttribute("property", "og:locale");
    document.head.append(ogLocale);
  }
  ogLocale.setAttribute("content", language === "ar" ? "ar_EG" : "en_US");

  let ogAltLocale = document.querySelector(
    'meta[property="og:locale:alternate"]',
  );
  if (!ogAltLocale) {
    ogAltLocale = document.createElement("meta");
    ogAltLocale.setAttribute("property", "og:locale:alternate");
    document.head.append(ogAltLocale);
  }
  ogAltLocale.setAttribute("content", language === "ar" ? "en_US" : "ar_EG");

  const canonicalUrl = `${productionUrl}/${language}${page.localizedPath}`;
  const jsonLdScript = document.querySelector(
    'script[type="application/ld+json"]',
  );
  if (jsonLdScript) {
    try {
      const data = JSON.parse(jsonLdScript.textContent);
      const updateEntity = (item) => {
        if (!item || typeof item !== "object") return;
        if (item["@type"] === "Person") {
          item.url = `${productionUrl}/${language}/`;
          if (language === "ar") {
            item.name = "أحمد مهدي";
            item.jobTitle = "مصمم تجربة مستخدم ومحلل بصري للبيانات";
            if (Array.isArray(item.knowsAbout)) {
              item.knowsAbout = [
                "تصميم تجربة المستخدم (UX Design)",
                "تمثيل البيانات بصرياً (Data Visualization)",
                "تحليل البيانات (Data Analytics)",
                "باور بي آي (Power BI)",
                "تابلو (Tableau)",
                "مايكروسوفت إكسل (Microsoft Excel)",
                "إس كيو إل (SQL)",
                "بايثون (Python)",
              ];
            }
          }
        } else if (item["@type"] === "CreativeWork") {
          item.url = canonicalUrl;
          if (language === "ar") {
            item.name = projectTitle || item.name;
            item.headline = projectTitle || item.headline;
            item.description = description || item.description;
            if (item.author) {
              item.author.name = "أحمد مهدي";
              item.author.url = `${productionUrl}/ar/`;
            }
          }
        } else if (
          item["@type"] === "BreadcrumbList" &&
          Array.isArray(item.itemListElement)
        ) {
          for (const crumb of item.itemListElement) {
            if (crumb.position === 1) {
              crumb.item = `${productionUrl}/${language}/`;
              if (language === "ar") crumb.name = "الرئيسية";
            } else if (crumb.position === 2) {
              crumb.item = `${productionUrl}/${language}/#projects`;
              if (language === "ar") crumb.name = "المشاريع";
            } else if (crumb.position === 3) {
              crumb.item = canonicalUrl;
              if (language === "ar" && projectTitle) {
                crumb.name = projectTitle;
              }
            }
          }
        }
      };

      if (Array.isArray(data)) {
        data.forEach(updateEntity);
      } else {
        updateEntity(data);
      }
      jsonLdScript.textContent = JSON.stringify(data, null, 2);
    } catch {
      // Ignore JSON parse errors
    }
  }

  if (language === "ar") {
    document.querySelectorAll("[data-counter-target]").forEach((el) => {
      const target = Number.parseInt(
        el.getAttribute("data-counter-target") || "0",
        10,
      );
      if (!Number.isNaN(target)) {
        el.textContent = "٠";
      }
    });
  }
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

function minifyCss(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n");
}

function minifyJs(source) {
  return source
    .replace(/^\s*\/\/.*$/gm, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trimEnd())
    .filter(Boolean)
    .join("\n");
}

function rewriteAssetReferences(
  document,
  mapping,
  bundleNames,
  targetStyleBundle = "styles.css",
) {
  // Discover the active font early to reduce layout movement during font swap.
  const fonts =
    document.documentElement.lang === "ar"
      ? ["noto-sans-arabic-arabic"]
      : ["inter-latin"];
  const anchor = document.head.querySelector(
    'link[rel="preload"], link[rel="stylesheet"], script',
  );
  for (const font of fonts) {
    const preload = document.createElement("link");
    preload.rel = "preload";
    preload.setAttribute("as", "font");
    preload.type = "font/woff2";
    preload.setAttribute("crossorigin", "anonymous");
    preload.href = `assets/fonts/${font}-wght-normal.woff2`;
    if (anchor) {
      anchor.before(preload);
    } else {
      document.head.append(preload);
    }
  }
  document.querySelectorAll("[src], [href]").forEach((node) => {
    for (const attribute of ["src", "href"]) {
      const value = node.getAttribute(attribute);
      if (!value) continue;
      if (value === "styles.css" && bundleNames.has(targetStyleBundle)) {
        node.setAttribute(attribute, bundleNames.get(targetStyleBundle));
      } else if (mapping.has(value)) {
        node.setAttribute(attribute, mapping.get(value));
      } else if (bundleNames.has(value)) {
        node.setAttribute(attribute, bundleNames.get(value));
      }
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
  [
    "@fontsource-variable/noto-sans-arabic",
    "noto-sans-arabic-arabic-wght-normal.woff2",
  ],
  [
    "@fontsource-variable/noto-sans-arabic",
    "noto-sans-arabic-latin-wght-normal.woff2",
  ],
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
let scriptSource = (await readFile(join(root, "script.js"), "utf8")).replaceAll(
  "\r\n",
  "\n",
);
const translations = await readTranslations();
scriptSource = scriptSource.replace(
  'import { translations } from "./data/translations.js";',
  `const translations = ${JSON.stringify(translations)};`,
);

const stylesHomeBundle = (
  await Promise.all(
    homeStyleOrder.map((file) => readFile(join(root, "styles", file), "utf8")),
  )
).join("\n");

const stylesCaseBundle = (
  await Promise.all(
    caseStyleOrder.map((file) => readFile(join(root, "styles", file), "utf8")),
  )
).join("\n");

const stylesBundle = (
  await Promise.all(
    styleBundleOrder.map((file) =>
      readFile(join(root, "styles", file), "utf8"),
    ),
  )
).join("\n");

const bundleSources = new Map([
  ["styles.css", minifyCss(stylesBundle)],
  ["styles-home.css", minifyCss(stylesHomeBundle)],
  ["styles-case.css", minifyCss(stylesCaseBundle)],
  ["fonts.css", minifyCss(await readFile(join(root, "fonts.css"), "utf8"))],
  ["script.js", minifyJs(scriptSource)],
  [
    "audio-player.js",
    minifyJs(await readFile(join(root, "audio-player.js"), "utf8")),
  ],
  [
    "preference-bootstrap.js",
    minifyJs(await readFile(join(root, "preference-bootstrap.js"), "utf8")),
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
  const source = expandCaseHeader(
    await readFile(join(root, page.file), "utf8"),
  );
  const { document: legacyDocument } = parseHTML(source);
  legacyDocument.body.dataset.staticPath = page.localizedPath;
  if (page.key) {
    legacyDocument.body.dataset.staticLocale = "en";
    applyTranslations(legacyDocument, translations.en);
  }
  const legacyPath = page.file === "index.html" ? "/" : `/${page.file}`;
  ensureAlternateLinks(legacyDocument, page.localizedPath, legacyPath);
  addSecurityMetadata(legacyDocument);
  let legacyOgLocale = legacyDocument.querySelector(
    'meta[property="og:locale"]',
  );
  if (!legacyOgLocale) {
    legacyOgLocale = legacyDocument.createElement("meta");
    legacyOgLocale.setAttribute("property", "og:locale");
    legacyDocument.head.append(legacyOgLocale);
  }
  legacyOgLocale.setAttribute("content", "en_US");
  let legacyOgAltLocale = legacyDocument.querySelector(
    'meta[property="og:locale:alternate"]',
  );
  if (!legacyOgAltLocale) {
    legacyOgAltLocale = legacyDocument.createElement("meta");
    legacyOgAltLocale.setAttribute("property", "og:locale:alternate");
    legacyDocument.head.append(legacyOgAltLocale);
  }
  const targetStyleBundle =
    page.file === "index.html" ? "styles-home.css" : "styles-case.css";
  rewriteAssetReferences(
    legacyDocument,
    assetMapping,
    bundleNames,
    targetStyleBundle,
  );
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
    rewriteAssetReferences(
      document,
      assetMapping,
      bundleNames,
      targetStyleBundle,
    );
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
await writeFile(
  join(dist, "release.json"),
  `${JSON.stringify({
    commit:
      process.env.GITHUB_SHA ||
      execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(),
  })}\n`,
);
console.log(
  `Static portfolio built with ${bundleNames.size} fingerprinted bundles, ${assetMapping.size} fingerprinted assets, and ${urls.length} indexed URLs.`,
);
