import { createReadStream, existsSync } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize, resolve } from "node:path";

const args = process.argv.slice(2);
const rootArgIndex = args.indexOf("--root");
const portArgIndex = args.indexOf("--port");

const root = resolve(
  process.cwd(),
  rootArgIndex >= 0 && args[rootArgIndex + 1] ? args[rootArgIndex + 1] : ".",
);
const port = Number(portArgIndex >= 0 ? args[portArgIndex + 1] : 4173);

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
};

function getSafePath(urlPath) {
  const cleanPath = normalize(decodeURIComponent(urlPath.split("?")[0]));
  const requestedPath = cleanPath === "/" ? "index.html" : cleanPath.replace(/^[/\\]+/, "");
  const resolvedPath = resolve(root, requestedPath);

  if (!resolvedPath.startsWith(root)) {
    return null;
  }

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
    response.writeHead(301, { location: `${request.url?.replace(/\/?$/, "/") || "/"}index.html` });
    response.end();
    return;
  }

  const extension = extname(filePath).toLowerCase();
  response.writeHead(200, {
    "cache-control": "no-cache",
    "content-type": mimeTypes[extension] || "application/octet-stream",
  });

  createReadStream(filePath).pipe(response);
});

server.listen(port, () => {
  console.log(`Serving ${join(root)} at http://127.0.0.1:${port}`);
});
