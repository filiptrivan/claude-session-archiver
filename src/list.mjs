// list.mjs — list object keys (and sizes) under a prefix.
// Usage: node src/list.mjs [prefix]
//   e.g. node src/list.mjs sessions/2026-05-31/
// Handy for the "daily reader" agent to find what is new under a date prefix.
import { ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getConfig } from './config.mjs';

const prefix = process.argv[2] ?? '';
const { client, bucket } = getConfig();

let token, n = 0;
do {
  const r = await client.send(new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix, ContinuationToken: token }));
  for (const o of r.Contents ?? []) { console.log(`${o.Key}\t${o.Size}`); n++; }
  token = r.IsTruncated ? r.NextContinuationToken : undefined;
} while (token);
console.error(`${n} object(s) under "${prefix}"`);
