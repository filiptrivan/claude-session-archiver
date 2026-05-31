// install.mjs — register the SessionEnd hook in ~/.claude/settings.json.
// Cross-platform. Idempotent. Backs up settings.json before editing.
import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import os from 'node:os';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
const hookPath = join(REPO, 'src', 'hook.mjs');
const settingsDir = join(os.homedir(), '.claude');
const settingsPath = join(settingsDir, 'settings.json');

const command = `node "${hookPath}"`;

if (!existsSync(settingsDir)) mkdirSync(settingsDir, { recursive: true });

let settings = {};
if (existsSync(settingsPath)) {
  try {
    settings = JSON.parse(readFileSync(settingsPath, 'utf8'));
  } catch {
    console.error(`Could not parse ${settingsPath} as JSON — aborting so it isn't clobbered.`);
    process.exit(1);
  }
  copyFileSync(settingsPath, settingsPath + '.bak');
}

settings.hooks ??= {};
settings.hooks.SessionEnd ??= [];

const already = settings.hooks.SessionEnd.some((group) =>
  (group.hooks ?? []).some((h) => typeof h.command === 'string' && h.command.includes('hook.mjs'))
);

if (already) {
  console.log('An archiver SessionEnd hook (hook.mjs) is already registered — nothing to do.');
} else {
  settings.hooks.SessionEnd.push({ hooks: [{ type: 'command', command }] });
  writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n');
  console.log(`Registered SessionEnd hook in ${settingsPath}`);
  console.log(`  command: ${command}`);
  if (existsSync(settingsPath + '.bak')) console.log(`  backup : ${settingsPath}.bak`);
}

console.log('\nNext: make sure you ran `npm install` and filled in .env, then RESTART Claude Code.');
