# claude-session-archiver

Automatically back up your **Claude Code** session transcripts to your own
S3-compatible storage (Cloudflare R2, AWS S3, MinIO, Backblaze B2, …) the moment
each session ends — no manual export, no cron, no "I forgot to save it".

It installs a single `SessionEnd` hook. When a session ends, the hook uploads
that session's transcript to a bucket **you** control, keyed by date so a daily
agent (or you) can pull "everything since yesterday" with one prefix.

```
Claude Code session ends
        │  (SessionEnd hook, cross-platform Node)
        ▼
  read transcript ──► PUT to s3://<your-bucket>/sessions/<date>/<user>/<project>/<session-id>.jsonl
```

Event-driven on purpose: the upload runs *when a session ends*, i.e. when your
machine is on — so there's nothing to schedule and no "the cron didn't run
because the laptop was asleep" problem. The upload is fired detached, so it
never slows down exiting a session.

## Requirements

- [Node.js](https://nodejs.org) 18+ (`node --version`)
- Claude Code
- A private bucket on any S3-compatible provider + an access key / secret

## Setup

```bash
git clone https://github.com/filiptrivan/claude-session-archiver
cd claude-session-archiver
npm install

cp .env.example .env      # Windows: copy .env.example .env
# edit .env — fill in your endpoint, key, secret, bucket

node scripts/install.mjs  # registers the SessionEnd hook in ~/.claude/settings.json
```

Then **restart Claude Code** (hooks load at startup). That's it — from now on
every session you finish is archived.

### Getting credentials

- **Cloudflare R2:** R2 → *Create bucket*, then *Manage R2 API Tokens* → create a
  token scoped to that bucket. Copy the **Access Key ID** and **Secret Access
  Key**. Endpoint is `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`.
- **AWS S3:** create a bucket + an IAM user/key with `s3:PutObject` on it. Leave
  `S3_ENDPOINT` blank and set `S3_REGION` to the bucket's region.

## Verify it works

End a Claude Code session, then list what's in the bucket:

```bash
node src/list.mjs sessions/
```

You should see `sessions/<today>/<you>/<project>/<session-id>.jsonl`.

## Reading sessions back

`src/list.mjs [prefix]` lists keys + sizes. To grab a day's worth, list under a
date prefix (`sessions/2026-05-31/`) and download those keys with your S3 tool
of choice (`aws s3 cp`, `rclone`, the AWS SDK, …). This is the hook a scheduled
"review my sessions" agent would use.

## SECURITY — read this

**Session transcripts can contain secrets** (API keys you pasted, `.env`
contents, tokens) **and personal/customer data.** You are uploading them
somewhere. Therefore:

- Use a **private** bucket. Never make the session bucket public.
- Scope the token to **only** that bucket; don't reuse a broad/production key.
- Treat the `.env` as a secret — it's git-ignored here; keep it that way.
- If you share this archive with teammates, everyone with read access can see
  everything in those transcripts. Decide accordingly.

This tool does not redact anything. If you need redaction, do it before the
transcripts leave your machine.

## Uninstall

```bash
node scripts/uninstall.mjs   # removes the hook from ~/.claude/settings.json
```

## How it works

- `src/hook.mjs` — the `SessionEnd` hook. Claude Code pipes a JSON payload
  (`transcript_path`, `session_id`, …) on stdin; the hook builds the object key
  and spawns the uploader detached.
- `src/upload.mjs` — uploads one file to the bucket (AWS SDK v3, S3 API).
- `src/list.mjs` — lists keys under a prefix.
- `src/config.mjs` — loads `.env` and constructs the S3 client.
- `scripts/install.mjs` / `uninstall.mjs` — add/remove the hook in
  `~/.claude/settings.json` (with a backup).

Works on Windows, macOS, and Linux — the hook command is just `node <path>`.

## License

MIT © Filip Trivan
