// hook.mjs — Claude Code SessionEnd hook (cross-platform: Windows / macOS / Linux).
// Claude Code pipes the hook payload (JSON) on stdin. We read it, compute a
// date-first object key, and fire a DETACHED uploader so session teardown is
// never blocked on the network. Must never throw — archiving must not break
// the session.
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join, basename } from 'node:path';
import { existsSync } from 'node:fs';
import os from 'node:os';

const HERE = dirname(fileURLToPath(import.meta.url));

function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    setTimeout(() => resolve(data), 2000); // never hang if stdin doesn't close
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (c) => (data += c));
    process.stdin.on('end', () => resolve(data));
    process.stdin.on('error', () => resolve(data));
  });
}

try {
  const raw = await readStdin();
  if (raw.trim()) {
    const hook = JSON.parse(raw);
    const transcript = hook.transcript_path;
    const sessionId = hook.session_id || 'unknown-session';

    if (transcript && existsSync(transcript)) {
      const user = os.userInfo().username || 'unknown';
      // The transcript's parent folder is Claude Code's encoded project key —
      // globally unique, so no collisions between same-named project folders.
      const project = basename(dirname(transcript)) || 'unknown-project';
      const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
      const destKey = `sessions/${date}/${user}/${project}/${sessionId}.jsonl`;

      const child = spawn(process.execPath, [join(HERE, 'upload.mjs'), transcript, destKey], {
        detached: true,
        stdio: 'ignore',
      });
      child.unref();
    }
  }
} catch {
  // swallow — never break the session
}
process.exit(0);
