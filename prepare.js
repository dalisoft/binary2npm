import os from "node:os";
import { spawn } from "node:child_process";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createWriteStream } from "node:fs";
import { unlink } from "node:fs/promises";
import { Readable } from "node:stream";
import { finished } from "node:stream/promises";

// Root constants
const __dirname = dirname(fileURLToPath(import.meta.url));
const { GITHUB_TOKEN } = process.env;

// Mapping constants
const archMap = {
  arm64: "aarch64",
  x64: "x86_64",
};
const vendorMap = {
  darwin: "apple",
  win32: "pc",
  linux: "unknown",
};
const osMap = {
  darwin: "darwin",
  win32: "windows-msvc",
  linux: "linux",
};

// Project constants
const FETCH_REPO = "KeisukeYamashita/commitlint-rs";
const FETCH_REPO_URL = `https://api.github.com/repos/KeisukeYamashita/commitlint-rs/releases/latest`;

let release = await fetch(FETCH_REPO_URL, {
  headers: {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    ...(GITHUB_TOKEN ? { Authorization: `Bearer ${GITHUB_TOKEN}` } : {}),
  },
});

if (!release.ok || release.status !== 200) {
  if (!GITHUB_TOKEN) {
    console.error({
      status: release.status,
      body: "Authorization failed. Provide `GITHUB_TOKEN` environment variable",
      error: (await release.json()).message,
    });
  } else {
    console.error({
      status: release.status,
      body: (await release.json()).message,
    });
  }
  process.exit(1);
} else {
  release = await release.json();
}

if (!release) {
  console.error({
    status: 404,
    body: "Project has no releases",
  });
  process.exit(1);
}

// Prepare constants
const suffix = `${archMap[process.arch]}-${vendorMap[os.platform()]}-${
  osMap[os.platform()]
}`;
const { tag_name, assets } = release;
const assetFileName = `commitlint-${tag_name}-${suffix}.tar.gz`;
const URL = `https://github.com/${FETCH_REPO}/releases/download/${tag_name}/${assetFileName}`;
const localURL = `${__dirname}/commitlint`;

// Preparing
await unlink(localURL).catch(() => {});

// Processing
const response = await fetch(URL);
const { body: stream, status, ok } = response;

if (!ok || status !== 200) {
  console.error({
    status,
    body: await response.text(),
  });
  process.exit(1);
}

const spawnTar = spawn("tar", ["-xzvf", "-"], {
  shell: true,
  detached: true,
});
spawnTar.stdout.pipe(createWriteStream(localURL, { autoClose: true }));

await finished(Readable.fromWeb(stream).pipe(spawnTar.stdin));

console.error({
  status,
  body: "Done",
});
