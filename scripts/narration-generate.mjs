// Run after build with --env-file=.env.local. --generate creates and uploads missing tracks.
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { AwsClient } from "aws4fetch";
import { parseHTML } from "linkedom";

const root = fileURLToPath(new URL("../", import.meta.url));
const output = resolve(root, "assets/audio/narration.json");
const cache = resolve(root, "artifacts/audio-cache");
const generate = process.argv.includes("--generate");
const local = process.argv.includes("--local");
const only = process.argv.find((arg) => arg.startsWith("--only="))?.slice(7);
const model = "eleven_multilingual_v2";
const voices = {
  en: process.env.ELEVENLABS_VOICE_EN || "onwK4e9ZLuTAKqWW03F9",
  ar: process.env.ELEVENLABS_VOICE_AR || "UXEyt6rtmFO9w5hBhzq9",
};
const settings = {
  stability: 0.65,
  similarity_boost: 0.75,
  style: 0,
  use_speaker_boost: true,
  speed: 0.95,
};
const manifest = existsSync(output)
  ? JSON.parse(await readFile(output, "utf8"))
  : {};
const tasks = [];
for (const lang of ["en", "ar"]) {
  for (const path of [
    "",
    ...[
      "haj-arafa",
      "cairo-airport",
      "hr-tool",
      "azkar-app",
      "lego-explorer",
    ].map((slug) => `case-studies/${slug}/`),
  ]) {
    const { document } = parseHTML(
      await readFile(resolve(root, `dist/${lang}/${path}index.html`), "utf8"),
    );
    for (const button of document.querySelectorAll("[data-audio-id]")) {
      const id = button.dataset.audioId;
      if (only && only !== id) continue;
      const container = button.classList.contains("case-listen-btn")
        ? document.querySelector(".case-study-card")
        : button.closest(".panel");
      const clone = container.cloneNode(true);
      clone
        .querySelectorAll(
          "button, nav, svg, figure, iframe, dialog, script, style, .sr-only, .section-num, .case-cta-wrapper, .live-embed-viewer, .case-study-pagination",
        )
        .forEach((node) => node.remove());
      clone
        .querySelectorAll("h1,h2,h3,h4,p,li,summary,span,strong,div")
        .forEach((node) => node.appendChild(document.createTextNode(" ")));
      const text = clone.textContent.replace(/\s+/g, " ").trim();
      if (!text || text.length > 10000)
        throw new Error(
          `Invalid transcript length for ${lang}/${id}: ${text.length}`,
        );
      const hash = createHash("sha256")
        .update(JSON.stringify({ text, voice: voices[lang], model, settings }))
        .digest("hex")
        .slice(0, 16);
      tasks.push({
        id,
        lang,
        text,
        hash,
        key: `portfolio/narration/${lang}/${id}-${hash}.mp3`,
      });
    }
  }
}
console.log(
  `Narration: ${tasks.length} tracks, ${tasks.reduce((sum, task) => sum + task.text.length, 0)} characters. ${generate ? "Generating missing tracks." : "Dry run; pass --generate to create and upload."}`,
);
if (!generate) process.exit(0);
for (const key of [
  "ELEVENLABS_API_KEY",
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET",
  "VITE_ASSET_BASE_URL",
]) {
  if (!process.env[key]) throw new Error(`Missing ${key}`);
}
const publicBase = new URL(process.env.VITE_ASSET_BASE_URL);
if (
  publicBase.protocol !== "https:" ||
  publicBase.username ||
  publicBase.password ||
  publicBase.search
)
  throw new Error(
    "Use an HTTPS public asset base without credentials or query parameters.",
  );
const client = new AwsClient({
  accessKeyId: process.env.R2_ACCESS_KEY_ID,
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  service: "s3",
  region: "auto",
  retries: 2,
});
const configuredEndpoint =
  process.env.R2_ENDPOINT ||
  process.env["Use_jurisdiction-specific_endpoints_for_S3_clients"];
const endpoint = new URL(
  configuredEndpoint ||
    `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
);
if (
  endpoint.protocol !== "https:" ||
  endpoint.username ||
  endpoint.password ||
  endpoint.search
)
  throw new Error("Use a credential-free HTTPS R2 endpoint.");
const bucketUrl = `${endpoint.href.replace(/\/$/, "")}/${process.env.R2_BUCKET}`;
await mkdir(cache, { recursive: true });
await mkdir(resolve(root, "assets/audio"), { recursive: true });
for (const task of tasks) {
  const entryKey = `${task.lang}/${task.id}`;
  const expectedUrl = local
    ? `/assets/audio/${task.lang}-${task.id}-${task.hash}.mp3`
    : `${publicBase.href.replace(/\/$/, "")}/${task.key}`;
  if (
    manifest[entryKey]?.hash === task.hash &&
    manifest[entryKey]?.url === expectedUrl
  ) {
    console.log(`Unchanged ${entryKey}`);
    continue;
  }
  const localPath = resolve(cache, `${task.hash}.mp3`);
  let audio;
  if (existsSync(localPath)) audio = await readFile(localPath);
  else {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voices[task.lang]}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          "xi-api-key": process.env.ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: task.text,
          model_id: model,
          voice_settings: settings,
        }),
        signal: AbortSignal.timeout(180000),
      },
    );
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        `ElevenLabs ${response.status} for ${entryKey}: ${error.detail?.status || "request_failed"}`,
      );
    }
    audio = Buffer.from(await response.arrayBuffer());
    if (audio.length < 1000) throw new Error(`Empty audio for ${entryKey}`);
    await writeFile(localPath, audio);
  }
  let url;
  if (local) {
    const relative = `assets/audio/${task.lang}-${task.id}-${task.hash}.mp3`;
    await writeFile(resolve(root, relative), audio);
    url = `/${relative}`;
  } else {
    const upload = await client.fetch(`${bucketUrl}/${task.key}`, {
      method: "PUT",
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
      body: audio,
    });
    if (!upload.ok) {
      const body = await upload.text();
      const code = body.match(/<Code>([^<]+)<\/Code>/)?.[1];
      throw new Error(
        `R2 upload failed: HTTP ${upload.status}${code ? ` ${code}` : ""}`,
      );
    }
    url = expectedUrl;
    const probe = await fetch(url, { headers: { Range: "bytes=0-1023" } });
    if (!probe.ok || !probe.headers.get("content-type")?.includes("audio"))
      throw new Error(`Public audio verification failed: HTTP ${probe.status}`);
    await probe.body?.cancel();
  }
  manifest[entryKey] = {
    url,
    text: task.text,
    hash: task.hash,
    voice: voices[task.lang],
    model,
    bytes: audio.length,
  };
  await writeFile(output, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`Verified ${entryKey}: ${audio.length} bytes`);
}
