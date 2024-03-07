import os from "node:os";
import { spawn } from "node:child_process";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createWriteStream } from "node:fs";
import { unlink } from "node:fs/promises";
import { Readable } from "node:stream";

// Root constants
const __dirname = dirname(fileURLToPath(import.meta.url));

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

const release = await fetch(FETCH_REPO_URL, {
  headers: {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    "X-GitHub-Api-Version": "2022-11-28",
  },
}).then((res) => res.json());

if (!release) {
  throw new Error("Project has no releases");
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
const { body: stream } = await fetch(URL);
await new Promise((resolve, reject) => {
  const tar = spawn("tar", ["-xzvf", "-"], { stdio: "pipe" });

  tar.stdout.pipe(createWriteStream(localURL, { autoClose: true }));

  Readable.fromWeb(stream)
    .pipe(tar.stdin)
    .on("finish", resolve)
    .on("error", reject);
}).catch((err) => {
  throw err;
});
await process.exit(0);
