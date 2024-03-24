import { spawn } from "node:child_process";
import { createWriteStream } from "node:fs";
import { unlink } from "node:fs/promises";
import os from "node:os";
import { dirname } from "node:path";
import { Readable } from "node:stream";
import { finished } from "node:stream/promises";

const __dirname = dirname(process.argv[1]);

const noop = () => {};
export const maps = {
  // Mapping constants
  arch: {
    arm64: "aarch64",
    x86: "x86_64",
    x64: "x86_64",
  },
  vendor: {
    darwin: "apple",
    win32: "pc",
    linux: "unknown",
  },
  os: {
    darwin: "darwin",
    win32: "windows-msvc",
    linux: "linux",
  },
};

/**
 *
 * @param options Prepare options
 * @param options.remote Remote hosting (e.g. `github`)
 * @returns
 */
export const prepare = async ({
  remote,
  author,
  repository,
  remoteToken = process.env.REMOTE_TOKEN,
  binary,
  usePackageJson,
}) => {
  const FETCH_REPO = `${author}/${repository}`;
  let FETCH_REPO_URL;
  let FETCH_REPO_OPTIONS;

  switch (remote) {
    case "github": {
      if (usePackageJson) {
        const { default: pkg } = await import(`${__dirname}/package.json`, {
          assert: { type: "json" },
        });
        FETCH_REPO_URL = `https://api.github.com/repos/${FETCH_REPO}/releases/tags/v${pkg.version}`;
      } else {
        FETCH_REPO_URL = `https://api.github.com/repos/${FETCH_REPO}/releases`;
      }
      FETCH_REPO_OPTIONS = {
        headers: {
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
          ...(remoteToken ? { Authorization: `Bearer ${remoteToken}` } : {}),
        },
      };
      break;
    }
    default: {
      throw new Error("Invalid remote");
      return false;
    }
  }

  let release = await fetch(FETCH_REPO_URL, FETCH_REPO_OPTIONS);
  if (!release.ok || release.status !== 200) {
    if (!remoteToken) {
      console.error({
        status: release.status,
        body: "Authorization failed. Provide `REMOTE_TOKEN` environment variable",
        error: (await release.json()).message,
      });
    } else {
      console.error({
        status: release.status,
        body: (await release.json()).message,
      });
    }
    process.exit(1);
    return false;
  } else if (usePackageJson) {
    release = await release.json();
  } else {
    [release] = await release.json();
  }

  if (!release) {
    console.error({
      status: 404,
      body: "Project has no releases",
    });
    process.exit(1);
    return false;
  }

  // Prepare constants
  const arch = maps.arch[process.arch];
  const vendor = maps.vendor[os.platform()];
  const _os = maps.os[os.platform()];
  const { assets, tag_name } = release;
  const version = tag_name.slice(1);
  let extension;

  const asset = release.assets.find(({ name }) => {
    let assetName = name;

    if (!(assetName.includes(binary) && assetName.includes(version))) {
      return false;
    } else {
      assetName = assetName.slice(assetName.indexOf(version) + version.length);
    }

    if (!assetName.includes(arch)) {
      return false;
    } else {
      assetName = assetName.slice(assetName.indexOf(arch) + arch.length);
    }

    if (assetName.length > 12) {
      if (!assetName.includes(vendor)) {
        return false;
      } else {
        assetName = assetName.slice(assetName.indexOf(vendor) + vendor.length);
      }
      if (!assetName.includes(_os)) {
        return false;
      } else {
        assetName = assetName.slice(assetName.indexOf(_os) + _os.length);
      }
    } else if (assetName.length > 8) {
      if (!assetName.includes(_os)) {
        return false;
      } else {
        assetName = assetName.slice(assetName.indexOf(_os) + _os.length);
      }
    }

    extension = assetName;
    return true;
  });

  // Preparing
  const localURL = `${__dirname}/${binary}`;
  await Promise.all([
    unlink(localURL).catch(noop),
    unlink(localURL + extension).catch(noop),
  ]);

  // Processing
  const response = await fetch(asset.browser_download_url);
  const { body: bodyStream, status, ok } = response;

  if (!ok || status !== 200) {
    console.error({
      status,
      body: await response.text(),
    });
    process.exit(1);
    return false;
  }

  await finished(
    Readable.fromWeb(bodyStream).pipe(createWriteStream(localURL + extension)),
  );

  const runCommand = `tar -xzvf ${localURL + extension} ${binary}`;
  const spawnCommand =
    vendor === "pc" ? `cmd.exe /c '${runCommand}'` : runCommand;

  await finished(
    spawn(spawnCommand, {
      shell: true,
      detached: true,
      cwd: __dirname,
    }).stdout,
  );
  await unlink(localURL + extension).catch(noop);

  return true;
};
