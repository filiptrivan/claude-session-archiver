// uninstall.mjs — remove the archiver's SessionEnd hook from ~/.claude/settings.json.
import { readFileSync, writeFileSync, existsSync, copyFileSync } from 'node:fs';
import { join } from 'node:path';
import os from 'node:os';

const settingsPath = join(os.homedir(), '.claude', 'settings.json');
if (!existsSync(settingsPath)) { console.log('No settings.json found — nothing to remove.'); process.exit(0); }

let settings;
try { settings = JSON.parse(readFileSync(settingsPath, 'utf8')); }
catch { console.error(`Could not parse ${settingsPath} — aborting.`); process.exit(1); }

const before = JSON.stringify(settings.hooks?.SessionEnd ?? []);
if (settings.hooks?.SessionEnd) {
  settings.hooks.SessionEnd = settings.hooks.SessionEnd
    .map((group) => ({ ...group, hooks: (group.hooks ?? []).filter((h) => !(typeof h.command === 'string' && h.command.includes('hook.mjs'))) }))
    .filter((group) => (group.hooks ?? []).length > 0);
  if (settings.hooks.SessionEnd.length === 0) delete settings.hooks.SessionEnd;
}

if (JSON.stringify(settings.hooks?.SessionEnd ?? []) === before) {
  console.log('No archiver hook found — nothing to remove.');
} else {
  copyFileSync(settingsPath, settingsPath + '.bak');
  writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n');
  console.log(`Removed archiver SessionEnd hook from ${settingsPath} (backup at ${settingsPath}.bak).`);
}
