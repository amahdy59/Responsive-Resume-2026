import { readdir, readFile } from "node:fs/promises";
import { parseHTML } from "linkedom";
import { expandCaseHeader } from "./case-template.mjs";

// Opt-in network check: authentication/bot blocks are not evidence of dead links.
const links = new Set();
for (const file of (await readdir(".")).filter((name) =>
  name.endsWith(".html"),
)) {
  const { document } = parseHTML(
    expandCaseHeader(await readFile(file, "utf8")),
  );
  for (const link of document.querySelectorAll("a[href]")) {
    if (link.getAttribute("href").startsWith("https://"))
      links.add(link.getAttribute("href"));
  }
}
const results = [];
const queue = [...links];
await Promise.all(
  Array.from({ length: 3 }, async () => {
    while (queue.length) {
      const url = queue.shift();
      try {
        const response = await fetch(url, {
          method: "HEAD",
          signal: AbortSignal.timeout(10000),
        });
        const status = response.ok
          ? "reachable"
          : [404, 410].includes(response.status)
            ? "broken"
            : "manual-check";
        results.push({ url, status, http: response.status });
      } catch {
        results.push({ url, status: "manual-check", http: "network/timeout" });
      }
    }
  }),
);
for (const result of results)
  console.log(`${result.status}: ${result.http} ${result.url}`);
if (results.some((result) => result.status === "broken")) process.exitCode = 1;
console.log(
  "HTTP success does not verify destination content; manual-check results are inconclusive, not passed.",
);
