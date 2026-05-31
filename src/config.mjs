// Shared config: load .env (no dependency) and build the S3 client.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { S3Client } from '@aws-sdk/client-s3';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

// Minimal .env loader. Reads <repo>/.env if present. Does NOT override env vars
// that are already set in the real environment.
export function loadEnv() {
  let txt;
  try { txt = readFileSync(join(ROOT, '.env'), 'utf8'); } catch { return; }
  for (const raw of txt.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
  }
}

export function getConfig() {
  loadEnv();
  const { S3_ENDPOINT, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_BUCKET, S3_REGION } = process.env;
  const missing = Object.entries({ S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_BUCKET })
    .filter(([, v]) => !v)
    .map(([k]) => k);
  if (missing.length) {
    throw new Error(`Missing required env vars: ${missing.join(', ')}. Copy .env.example to .env and fill it in.`);
  }
  const client = new S3Client({
    region: S3_REGION || 'auto',
    endpoint: S3_ENDPOINT || undefined,
    credentials: { accessKeyId: S3_ACCESS_KEY_ID, secretAccessKey: S3_SECRET_ACCESS_KEY },
  });
  return { client, bucket: S3_BUCKET };
}
