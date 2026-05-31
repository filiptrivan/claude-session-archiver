// uninstall.mjs — remove the archiver's SessionEnd hook from ~/.claude/settings.json.
import { readSettings, writeSettings, SETTINGS_PATH, isArchiverHook } from './settings.mjs';

const settings = readSettings();
const groups = settings.hooks?.SessionEnd;

let removed = 0;
if (groups) {
  settings.hooks.SessionEnd = groups
    .map((group) => ({
      ...group,
      hooks: (group.hooks ?? []).filter((h) => {
        const drop = isArchiverHook(h);
        if (drop) removed++;
        return !drop;
      }),
    }))
    .filter((group) => (group.hooks ?? []).length > 0);
  if (settings.hooks.SessionEnd.length === 0) delete settings.hooks.SessionEnd;
}

if (removed === 0) {
  console.log('No archiver hook found — nothing to remove.');
} else {
  writeSettings(settings);
  console.log(`Removed ${removed} archiver SessionEnd hook(s) from ${SETTINGS_PATH} (backup at ${SETTINGS_PATH}.bak).`);
}
