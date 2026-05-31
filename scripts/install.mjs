// install.mjs — register the SessionEnd hook in ~/.claude/settings.json.
// Cross-platform. Idempotent. Backs up settings.json before editing.
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { SETTINGS_PATH, readSettings, writeSettings, isArchiverHook } from './settings.mjs';

const hookPath = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'hook.mjs');
const command = `node "${hookPath}"`;

const settings = readSettings();
settings.hooks ??= {};
settings.hooks.SessionEnd ??= [];

const already = settings.hooks.SessionEnd.some((group) => (group.hooks ?? []).some(isArchiverHook));

if (already) {
  console.log('An archiver SessionEnd hook is already registered — nothing to do.');
} else {
  settings.hooks.SessionEnd.push({ hooks: [{ type: 'command', command }] });
  writeSettings(settings);
  console.log(`Registered SessionEnd hook in ${SETTINGS_PATH}`);
  console.log(`  command: ${command}`);
  console.log(`  backup : ${SETTINGS_PATH}.bak (if it existed)`);
}

console.log('\nNext: make sure you ran `npm install` and filled in .env, then RESTART Claude Code.');
