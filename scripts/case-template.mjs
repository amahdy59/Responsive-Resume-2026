import { readFileSync } from "node:fs";

const projects = JSON.parse(
  readFileSync(new URL("../data/projects.json", import.meta.url), "utf8"),
);
const template = readFileSync(
  new URL("../templates/case-header.html", import.meta.url),
  "utf8",
).trim();
const escapeHtml = (text) =>
  text
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

/** Expand shared markup before localization, validation or asset fingerprinting. */
export function expandCaseHeader(source) {
  return source.replace(/<!-- case-header:([a-z0-9-]+) -->/g, (_, id) => {
    const project = projects.find((item) => item.id === id);
    if (!project) throw new Error(`Unknown case-study header: ${id}`);
    return template
      .replaceAll("{{titleKey}}", escapeHtml(project.caseTitleKey))
      .replaceAll("{{title}}", escapeHtml(project.title.en));
  });
}
