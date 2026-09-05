import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseHTML } from "linkedom";

const root = process.cwd();
const html = readFileSync(resolve(root, "index.html"), "utf8");
const caseStudyFiles = [
  "project-haj-arafa.html",
  "project-cairo-airport.html",
  "project-hr-tool.html",
  "project-azkar-app.html",
  "project-lego-explorer.html",
];
const htmlDocuments = [
  { file: "index.html", source: html },
  ...caseStudyFiles.map((file) => ({
    file,
    source: readFileSync(resolve(root, file), "utf8"),
  })),
];
const script = readFileSync(resolve(root, "script.js"), "utf8");
const readme = readFileSync(resolve(root, "README.md"), "utf8");
const projects = JSON.parse(
  readFileSync(resolve(root, "data", "projects.json"), "utf8"),
);

const translationKeyPattern = /\b(ar|en):\s*\{([\s\S]*?)\n\s*\}/g;
const dictionaryKeyPattern = /\b([a-zA-Z0-9_]+)\s*:/g;
const htmlTextKeyPattern = /data-translate="([^"]+)"/g;
const htmlAttrKeyPattern = /data-translate-attr-key="([^"]+)"/g;
const blankLinkPattern = /<a\b[^>]*target="_blank"[^>]*rel="([^"]*)"[^>]*>/g;

function uniqueMatches(source, pattern) {
  return [
    ...new Set([...source.matchAll(pattern)].map((match) => match[1])),
  ].sort();
}

function getDictionaryKeys(language) {
  const match = [...script.matchAll(translationKeyPattern)].find(
    (item) => item[1] === language,
  );

  if (!match) {
    throw new Error(`Missing translation dictionary for "${language}"`);
  }

  return [
    ...new Set(
      [...match[2].matchAll(dictionaryKeyPattern)].map((item) => item[1]),
    ),
  ].sort();
}

function readTranslations() {
  const start = script.indexOf("const translations = ");
  const end = script.indexOf("\n};\n\n/**", start);
  if (start < 0 || end < 0) throw new Error("Unable to read translations.");
  return Function(
    `"use strict"; return (${script.slice(start + "const translations = ".length, end + 2)});`,
  )();
}

const allHtmlSource = htmlDocuments.map(({ source }) => source).join("\n");
const htmlKeys = [
  ...uniqueMatches(allHtmlSource, htmlTextKeyPattern),
  ...uniqueMatches(allHtmlSource, htmlAttrKeyPattern),
].sort();

const errors = [];
const warnings = [];
const translations = readTranslations();

for (const project of projects) {
  const caseSource = htmlDocuments.find(
    ({ file }) => file === project.file,
  )?.source;
  if (!caseSource) {
    errors.push(`Canonical project ${project.id} references a missing page.`);
    continue;
  }

  const homeDocument = parseHTML(html).document;
  const caseDocument = parseHTML(caseSource).document;
  const homeTitle = homeDocument.querySelector(
    `[data-translate="${project.homeTitleKey}"]`,
  );
  const caseTitles = [
    ...caseDocument.querySelectorAll(
      `[data-translate="${project.caseTitleKey}"]`,
    ),
  ];
  const homeCard = homeTitle?.closest("article");

  for (const language of ["en", "ar"]) {
    for (const key of [project.homeTitleKey, project.caseTitleKey]) {
      if (translations[language][key] !== project.title[language]) {
        errors.push(
          `${language} translation ${key} must match canonical title "${project.title[language]}".`,
        );
      }
    }
    const platformKey = `${project.caseTitleKey.replace(/_title$/, "")}_platform`;
    if (translations[language][platformKey] !== project.platform[language]) {
      errors.push(
        `${language} translation ${platformKey} must match canonical platform "${project.platform[language]}".`,
      );
    }
  }

  if (homeTitle?.textContent.trim() !== project.title.en) {
    errors.push(`${project.id} homepage fallback title is not canonical.`);
  }
  if (
    caseTitles.length === 0 ||
    caseTitles.some((node) => node.textContent.trim() !== project.title.en)
  ) {
    errors.push(`${project.id} case-study fallback titles are not canonical.`);
  }
  for (const { file, source } of htmlDocuments) {
    const references = parseHTML(source).document.querySelectorAll(
      `[data-translate="${project.caseTitleKey}"]`,
    );
    if (
      [...references].some(
        (node) => node.textContent.trim() !== project.title.en,
      )
    ) {
      errors.push(`${file} contains a stale ${project.id} title reference.`);
    }
  }
  if (caseDocument.title !== `${project.title.en} | Ahmed Mahdy Portfolio`) {
    errors.push(`${project.id} document title is not canonical.`);
  }
  for (const selector of [
    'meta[property="og:title"]',
    'meta[property="twitter:title"]',
  ]) {
    if (
      !caseDocument
        .querySelector(selector)
        ?.content.startsWith(project.title.en)
    ) {
      errors.push(`${project.id} ${selector} is not canonical.`);
    }
  }
  if (homeTitle?.closest("a")?.getAttribute("href") !== project.caseStudyUrl) {
    errors.push(`${project.id} homepage case-study URL has drifted.`);
  }
  if (homeCard?.querySelector(".project-live-link")?.href !== project.liveUrl) {
    errors.push(`${project.id} homepage live URL has drifted.`);
  }
  if (caseDocument.querySelector(".case-live-cta")?.href !== project.liveUrl) {
    errors.push(`${project.id} case-study live URL has drifted.`);
  }
  for (const node of caseDocument.querySelectorAll(
    '.device-btn[target="_blank"], .live-embed-iframe',
  )) {
    const liveUrl = node.getAttribute("href") || node.getAttribute("data-src");
    if (liveUrl !== project.liveUrl) {
      errors.push(`${project.id} preview URL has drifted.`);
    }
  }

  try {
    const schemas = JSON.parse(
      caseDocument.querySelector("#person-schema")?.textContent || "[]",
    );
    const entries = Array.isArray(schemas) ? schemas : [schemas];
    const creativeWork = entries.find(
      (entry) => entry["@type"] === "CreativeWork",
    );
    const breadcrumb = entries.find(
      (entry) => entry["@type"] === "BreadcrumbList",
    );
    const breadcrumbTitle = breadcrumb?.itemListElement?.at(-1)?.name;
    if (
      creativeWork?.name !== project.title.en ||
      creativeWork?.headline !== project.title.en ||
      breadcrumbTitle !== project.title.en
    ) {
      errors.push(`${project.id} structured data is not canonical.`);
    }
  } catch {
    errors.push(`${project.id} structured data is invalid JSON.`);
  }

  for (const term of project.forbiddenTerms || []) {
    const homeSummary = homeCard?.querySelector("p")?.textContent || "";
    const localizedSummary =
      translations.en[project.homeTitleKey.replace(/_title$/, "_desc")];
    if (
      homeSummary.includes(term) ||
      localizedSummary?.includes(term) ||
      caseSource.includes(term)
    ) {
      errors.push(
        `${project.id} still contains the conflicting term "${term}".`,
      );
    }
  }
}

for (const language of ["ar", "en"]) {
  const dictionaryKeys = getDictionaryKeys(language);
  const missingKeys = htmlKeys.filter((key) => !dictionaryKeys.includes(key));

  if (missingKeys.length > 0) {
    errors.push(
      `${language} dictionary is missing keys: ${missingKeys.join(", ")}`,
    );
  }
}

if (readme.includes("file:///")) {
  errors.push("README.md still contains local file:/// links.");
}

for (const { file, source } of htmlDocuments) {
  for (const match of source.matchAll(blankLinkPattern)) {
    const relValue = match[1];

    if (!relValue.includes("noopener") || !relValue.includes("noreferrer")) {
      errors.push(
        `${file} has an external link without rel="noopener noreferrer": ${match[0]}`,
      );
    }
  }

  const ids = [...source.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
  if (duplicateIds.length > 0) {
    errors.push(
      `${file} has duplicate IDs: ${[...new Set(duplicateIds)].join(", ")}`,
    );
  }

  if (source.includes("placehold.co")) {
    errors.push(`${file} still uses a placeholder image.`);
  }

  for (const match of source.matchAll(
    /\b(?:href|src)="((?:project-[^"]+\.html)|(?:assets\/[^"]+))"/g,
  )) {
    if (!existsSync(resolve(root, match[1]))) {
      errors.push(`${file} references missing local resource: ${match[1]}`);
    }
  }

  for (const match of source.matchAll(/\bsrcset="([^"]+)"/g)) {
    for (const candidate of match[1].split(",")) {
      const resource = candidate.trim().split(/\s+/)[0];
      if (
        resource.startsWith("assets/") &&
        !existsSync(resolve(root, resource))
      ) {
        errors.push(`${file} references missing responsive image: ${resource}`);
      }
    }
  }
}

if (htmlDocuments.some(({ source }) => source.includes('rel="manifest"'))) {
  errors.push("HTML still references a removed web app manifest.");
}

if (/serviceWorker\.register|event\.key\.toLowerCase\(\)/.test(script)) {
  errors.push(
    "Removed PWA registration or global character shortcuts were reintroduced.",
  );
}

if (
  htmlDocuments.some(({ source }) => /assets\/case-[^"]+\.jpg/.test(source))
) {
  errors.push("A case study still references a superseded JPEG asset.");
}

if (!html.includes('<script src="audio-player.js"></script>')) {
  errors.push("Homepage audio controls exist without loading audio-player.js.");
}

if (
  html.includes("data-skill-filter") ||
  /role="listitem"[^>]*tabindex/.test(html)
) {
  errors.push(
    "Informational skill chips must not behave as keyboard controls.",
  );
}

if (
  html.includes("project-toggle") ||
  script.includes("project-toggle") ||
  script.includes("initCollapsibleProjectCards")
) {
  errors.push(
    "Project cards must expose their essential content without collapse controls.",
  );
}

if (
  html.includes("project-filter-pill") ||
  script.includes("initProjectFilters")
) {
  errors.push(
    "The small project set must remain directly scannable without filters.",
  );
}

if ((html.match(/class="project-thumbnail"/g) || []).length !== 5) {
  errors.push("Projects section must contain exactly 5 project thumbnails.");
}

if ((html.match(/class="contact-icon contact-icon-/g) || []).length !== 3) {
  errors.push("The hero must present email, LinkedIn, and Dribbble uniformly.");
}

if (/class="contact-label"[^>]*>[^<]*@/.test(html)) {
  errors.push(
    "The full email address must not be exposed as visible hero text.",
  );
}

for (const { file, source } of htmlDocuments.filter(
  ({ file }) => file !== "index.html",
)) {
  if (!/data-project-key="cs_[^"]+"/.test(source)) {
    errors.push(
      `${file} is missing its project-specific localization metadata key.`,
    );
  }
  if (!/data-toggle-embed[^>]*aria-controls="live-embed-viewer"/.test(source)) {
    errors.push(`${file} preview toggle is missing aria-controls.`);
  }
  if (!/class="live-embed-iframe"[^>]*sandbox=/.test(source)) {
    errors.push(`${file} live preview iframe is not sandboxed.`);
  }
}

if (
  /WCAG 2\.2 AAA|Analytics show high daily retention|Reduced average request turnaround from 3 days|reducing HR ticket turnaround by 60%|maximize user conversion and engagement|45m Early Warning|<4h Request Turnaround|Real-time interactive operational dashboard/.test(
    allHtmlSource + script,
  )
) {
  errors.push(
    "Unsupported accessibility or outcome claims remain in published content.",
  );
}

for (const assetPath of [
  resolve(root, "assets", "ahmed-mahdy.webp"),
  resolve(root, "assets", "ahmed-mahdy.png"),
  resolve(root, "assets", "og-card.png"),
  resolve(root, "assets", "og-haj-arafa.png"),
  resolve(root, "assets", "og-cairo-airport.png"),
  resolve(root, "assets", "og-hr-tool.png"),
  resolve(root, "assets", "og-azkar-app.png"),
  resolve(root, "assets", "og-lego-explorer.png"),
  resolve(root, "assets", "case-cairo-airport.webp"),
  resolve(root, "assets", "case-haj-arafa.webp"),
  resolve(root, "assets", "case-hr-tool.webp"),
  resolve(root, "assets", "case-azkar-app.webp"),
  resolve(root, "assets", "case-lego-explorer.webp"),
  resolve(root, "assets", "favicon.svg"),
]) {
  if (!existsSync(assetPath)) {
    errors.push(`Missing required asset: ${assetPath}`);
  }
}

if (!html.includes('rel="canonical" href="https://creativemahdy.space/"')) {
  warnings.push(
    "Canonical URL is missing or has changed from the expected production URL.",
  );
}

if (errors.length > 0) {
  console.error("Validation failed:\n");
  for (const error of errors) {
    console.error(`- ${error}`);
  }

  if (warnings.length > 0) {
    console.error("\nWarnings:\n");
    for (const warning of warnings) {
      console.error(`- ${warning}`);
    }
  }

  process.exit(1);
}

console.log(
  "Validation passed: all assets, translation dictionaries, and case study links verified.",
);

if (warnings.length > 0) {
  console.log("\nWarnings:");
  for (const warning of warnings) {
    console.log(`- ${warning}`);
  }
}
