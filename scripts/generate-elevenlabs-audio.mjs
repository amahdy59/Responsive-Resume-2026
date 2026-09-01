/**
 * ElevenLabs Batch Audio Generator
 * Extracts all data-audio-id elements from the project's HTML files and generates MP3s.
 * 
 * Usage:
 *   node scripts/generate-elevenlabs-audio.mjs --key=YOUR_ELEVENLABS_API_KEY
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const audioDir = path.resolve(rootDir, 'assets/audio');

if (!fs.existsSync(audioDir)) {
  fs.mkdirSync(audioDir, { recursive: true });
}

// Parse command line arguments
const args = process.argv.slice(2);
const keyArg = args.find(a => a.startsWith('--key='));
const apiKey = keyArg ? keyArg.split('=')[1] : process.env.ELEVENLABS_API_KEY;
const voiceId = '21m00Tcm4TlvDq8ikWAM'; // Rachel - Clear, accessible narrative voice

const htmlFiles = [
  'index.html',
  'project-cairo-airport.html',
  'project-haj-arafa.html',
  'project-hr-tool.html',
  'project-lego-explorer.html',
  'project-sales-dashboard.html'
];

const manifest = [];

for (const file of htmlFiles) {
  const filePath = path.resolve(rootDir, file);
  if (!fs.existsSync(filePath)) continue;
  const content = fs.readFileSync(filePath, 'utf8');

  const regex = /data-audio-id="([^"]+)"/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const audioId = match[1];
    manifest.push({
      file,
      audioId,
      outputFile: `assets/audio/${audioId}.mp3`
    });
  }
}

fs.writeFileSync(path.resolve(audioDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
console.log(`Generated audio manifest with ${manifest.length} entries at assets/audio/manifest.json`);

if (!apiKey) {
  console.log('ℹ️ No ElevenLabs API key provided. Web Speech API fallback will handle live narration.');
  console.log('To generate offline MP3s in batch, run: node scripts/generate-elevenlabs-audio.mjs --key=YOUR_KEY');
  process.exit(0);
}

console.log(`Starting ElevenLabs audio batch generation using voice ID: ${voiceId}...`);
