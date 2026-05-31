// upload.mjs — upload one file to the configured S3-compatible bucket.
// Usage: node src/upload.mjs <localFilePath> <destKey>
import { readFile, appendFile } from 'node:fs/promises';
import { join } from 'node:path';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getConfig, ROOT } from './config.mjs';

const logErr = async (msg) => { try { await appendFile(join(ROOT, 'archiver.log'), msg + '\n'); } catch {} };

const [, , localPath, destKey] = process.argv;
if (!localPath || !destKey) {
  console.error('usage: node src/upload.mjs <localFilePath> <destKey>');
  process.exit(2);
}

try {
  const { client, bucket } = getConfig();
  const body = await readFile(localPath);
  await client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: destKey,
    Body: body,
    ContentType: 'application/x-ndjson',
  }));
  console.log(`uploaded ${destKey} (${body.length} bytes) -> ${bucket}`);
} catch (err) {
  await logErr(`${new Date().toISOString()} FAIL ${destKey} ${err?.name}: ${err?.message}`);
  console.error(err?.message ?? err);
  process.exit(1);
}
