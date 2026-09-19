// Run after build with --env-file=.env.local. --generate creates and uploads missing tracks.
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { AwsClient } from "aws4fetch";

const root = fileURLToPath(new URL("../", import.meta.url));
const output = resolve(root, "assets/audio/narration.json");
const cache = resolve(root, "artifacts/audio-cache");
const localAudioDir = resolve(root, "assets/audio");
const transcriptsFile = resolve(root, "data/narration-transcripts.json");

const generate = process.argv.includes("--generate");
const local = process.argv.includes("--local");
const only = process.argv.find((arg) => arg.startsWith("--only="))?.slice(7);

// Read transcripts from data/narration-transcripts.json
const curatedTranscripts = existsSync(transcriptsFile)
  ? JSON.parse(readFileSync(transcriptsFile, "utf8"))
  : {};

// Environment fallback parsing
const env = { ...process.env };
for (const envFile of ["env.local", ".env.local"]) {
  const p = resolve(root, envFile);
  if (existsSync(p)) {
    for (const line of readFileSync(p, "utf8").split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const [k, ...v] = trimmed.split("=");
      if (k && !(k.trim() in env)) env[k.trim()] = v.join("=").trim();
    }
  }
}

const model = "eleven_multilingual_v2";
const voices = {
  en: env.ELEVENLABS_VOICE_EN || "JBFqnCBsd6RMkjVDRZzb", // George
  ar: env.ELEVENLABS_VOICE_AR || "xvhpbk8otnNHtT3fjCpr", // Omar
};

const settings = {
  en: {
    stability: 0.58,
    similarity_boost: 0.8,
    style: 0.15,
    use_speaker_boost: true,
    speed: 0.98,
  },
  ar: {
    stability: 0.58,
    similarity_boost: 0.8,
    style: 0.12,
    use_speaker_boost: true,
    speed: 0.96,
  },
};

const manifest = existsSync(output)
  ? JSON.parse(await readFile(output, "utf8"))
  : {};

const tasks = [];
for (const [id, localized] of Object.entries(curatedTranscripts)) {
  if (only && only !== id) continue;
  for (const lang of ["en", "ar"]) {
    const text = localized[lang];
    if (!text) continue;
    const voiceSettings = settings[lang];
    const hash = createHash("sha256")
      .update(
        JSON.stringify({
          text,
          voice: voices[lang],
          model,
          settings: voiceSettings,
        }),
      )
      .digest("hex")
      .slice(0, 16);

    tasks.push({
      id,
      lang,
      text,
      voice: voices[lang],
      voiceSettings,
      hash,
      key: `portfolio/narration/${lang}/${id}-${hash}.mp3`,
    });
  }
}

console.log(
  `Narration: ${tasks.length} tracks, ${tasks.reduce((sum, task) => sum + task.text.length, 0)} characters. ${generate ? "Generating missing tracks." : "Dry run; pass --generate to create and upload."}`,
);

if (!generate) process.exit(0);

const apiKey =
  env.ELEVENLABS_API_KEY ||
  env.Elevenlabs_API_key ||
  env.VITE_ELEVENLABS_API_KEY;
const r2AccessKey =
  env.R2_ACCESS_KEY_ID || env.INTERACTIVE_RESUME_R2_ACCESS_KEY_ID;
const r2SecretKey =
  env.R2_SECRET_ACCESS_KEY || env.INTERACTIVE_RESUME_R2_SECRET_ACCESS_KEY;
const r2Bucket =
  env.R2_BUCKET ||
  env.INTERACTIVE_RESUME_R2_BUCKET_NAME ||
  "interactive-resume";
const accountId = env.R2_ACCOUNT_ID || env.CLOUDFLARE_ACCOUNT_ID;
const configuredEndpoint =
  env.R2_ENDPOINT ||
  (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : undefined);
const publicBaseUrl =
  env.VITE_ASSET_BASE_URL ||
  "https://pub-0e85a9758556488098db7ca057ac5d1e.r2.dev";

if (!apiKey) throw new Error("Missing ElevenLabs API Key");
if (!local && (!r2AccessKey || !r2SecretKey || !configuredEndpoint)) {
  throw new Error("Missing Cloudflare R2 credentials");
}

const publicBase = new URL(publicBaseUrl);
if (
  publicBase.protocol !== "https:" ||
  publicBase.username ||
  publicBase.password ||
  publicBase.search
) {
  throw new Error(
    "Use an HTTPS public asset base without credentials or query parameters.",
  );
}

const client = new AwsClient({
  accessKeyId: r2AccessKey,
  secretAccessKey: r2SecretKey,
  service: "s3",
  region: "auto",
  retries: 2,
});

const endpoint = new URL(configuredEndpoint);
const bucketUrl = `${endpoint.href.replace(/\/$/, "")}/${r2Bucket}`;

await mkdir(cache, { recursive: true });
await mkdir(localAudioDir, { recursive: true });
await mkdir(resolve(localAudioDir, "en"), { recursive: true });
await mkdir(resolve(localAudioDir, "ar"), { recursive: true });

for (const task of tasks) {
  const entryKey = `${task.lang}/${task.id}`;
  const current = manifest[entryKey];
  const expectedUrl = local
    ? `/assets/audio/${task.lang}-${task.id}-${task.hash}.mp3`
    : `${publicBase.href.replace(/\/$/, "")}/${task.key}`;

  const localFileName = `${task.lang}-${task.id}-${task.hash}.mp3`;
  const localPathFlat = resolve(localAudioDir, localFileName);
  const localPathNested = resolve(
    localAudioDir,
    task.lang,
    `${task.id}-${task.hash}.mp3`,
  );

  if (
    current?.hash === task.hash &&
    current?.url === expectedUrl &&
    existsSync(localPathFlat)
  ) {
    console.log(`Unchanged ${entryKey}`);
    continue;
  }

  const localCachePath = resolve(cache, `${task.hash}.mp3`);
  let audio;
  if (existsSync(localCachePath)) {
    audio = await readFile(localCachePath);
  } else {
    console.log(`Synthesizing ${entryKey} with ElevenLabs...`);
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${task.voice}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: task.text,
          model_id: model,
          voice_settings: task.voiceSettings,
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
    await writeFile(localCachePath, audio);
  }

  // Always save local copy
  await writeFile(localPathFlat, audio);
  await writeFile(localPathNested, audio);

  let url;
  if (local) {
    url = `/assets/audio/${localFileName}`;
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
    if (!probe.ok || !probe.headers.get("content-type")?.includes("audio")) {
      throw new Error(`Public audio verification failed: HTTP ${probe.status}`);
    }
    await probe.body?.cancel();
  }

  const record = {
    url,
    localUrl: `/assets/audio/${localFileName}`,
    text: task.text,
    hash: task.hash,
    voice: task.voice,
    model,
    bytes: audio.length,
  };

  manifest[entryKey] = record;
  if (task.id === "wa-zaker-intro") {
    manifest[`${task.lang}/azkar-app-intro`] = record;
  }

  await writeFile(output, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`Verified ${entryKey}: ${audio.length} bytes`);
}
