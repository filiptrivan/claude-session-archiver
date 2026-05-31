// settings.mjs — shared helpers for safely reading/writing the Claude Code
// user settings file (~/.claude/settings.json). Used by install + uninstall so
// they agree on the path, the backup/write cycle, and what "our hook" is.
import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync } from 'node:fs';
import { join } from 'node:path';
import os from 'node:os';

export const SETTINGS_DIR = join(os.homedir(), '.claude');
export const SETTINGS_PATH = join(SETTINGS_DIR, 'settings.json');

// Substring identifying this tool's hook command — single source of truth for
// both "is it already installed?" and "which hook do we remove?".
export const HOOK_MARKER = 'hook.mjs';
export const isArchiverHook = (h) => typeof h?.command === 'string' && h.command.includes(HOOK_MARKER);

// Read + parse settings.json. Returns {} if absent. Aborts (exit 1) if present
// but unparseable, so we never clobber a file we can't understand.
export function readSettings() {
  if (!existsSync(SETTINGS_PATH)) return {};
  try {
    return JSON.parse(readFileSync(SETTINGS_PATH, 'utf8'));
  } catch {
    console.error(`Could not parse ${SETTINGS_PATH} as JSON — aborting so it isn't clobbered.`);
    process.exit(1);
  }
}

// Back up the existing file (.bak) then write the new settings.
export function writeSettings(settings) {
  if (!existsSync(SETTINGS_DIR)) mkdirSync(SETTINGS_DIR, { recursive: true });
  if (existsSync(SETTINGS_PATH)) copyFileSync(SETTINGS_PATH, SETTINGS_PATH + '.bak');
  writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2) + '\n');
}
