import { spawn } from 'node:child_process';
import { createWriteStream } from 'node:fs';
import { chmod, readFile, stat, unlink, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { arch as platformArch, platform as platformOs } from 'node:process';
import { finished } from 'node:stream/promises';

const __dirname = dirname(process.argv[1]);

const noop = () => {};
export const maps = {
  arch: {
    arm64: 'aarch64',
    x86: 'x86_64',
    x64: 'x86_64'
  },
  vendor: {
    darwin: 'apple',
    win32: 'pc',
    linux: 'unknown'
  },
  os: {
    darwin: 'darwin',
    win32: 'windows-msvc',
    linux: 'linux'
  }
};

// This is valid extensions for GitHub release assets
const validExtensions = ['tar.gz', 'zip'];

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
  usePackageJson = false,
  orders = ['binary', 'version', 'arch', 'vendor', 'os'],
  stableOnly = true,
  tagPrefix = 'v'
}) => {
  const FETCH_REPO = `${author}/${repository}`;
  let FETCH_REPO_URL;
  let FETCH_REPO_FALLBACK_URL;
  let FETCH_REPO_OPTIONS;

  switch (remote) {
    case 'github': {
      if (usePackageJson) {
        const { default: pkg } = await import(`${__dirname}/package.json`, {
          assert: { type: 'json' }
        });
        FETCH_REPO_URL = `https://api.github.com/repos/${FETCH_REPO}/releases/tags/${tagPrefix}${pkg.version}`;
        FETCH_REPO_FALLBACK_URL = `https://api.github.com/repos/${FETCH_REPO}/releases/tags/${pkg.version}`;
      } else {
        FETCH_REPO_URL = `https://api.github.com/repos/${FETCH_REPO}/releases`;
      }
      FETCH_REPO_OPTIONS = {
        headers: {
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          ...(remoteToken ? { Authorization: `Bearer ${remoteToken}` } : {})
        }
      };
      break;
    }
    default: {
      throw new Error('Invalid remote');
    }
  }

  let release = await fetch(FETCH_REPO_URL, FETCH_REPO_OPTIONS);

  // Fallback URL for some projects which uses without `v` prefix
  if (!release.ok && release.status === 404) {
    release = await fetch(FETCH_REPO_FALLBACK_URL, FETCH_REPO_OPTIONS);
  }

  if (!release.ok || release.status !== 200) {
    if (!remoteToken) {
      console.error({
        status: release.status,
        body: 'Authorization failed. Provide `REMOTE_TOKEN` environment variable',
        error: (await release.json()).message
      });
    } else {
      console.error({
        status: release.status,
        body: (await release.json()).message
      });
    }
    process.exit(1);
    return false;
  } else if (usePackageJson) {
    release = await release.json();
  } else {
    const releases = await release.json();
    [release] = stableOnly
      ? releases.filter(({ prerelease }) => prerelease !== stableOnly)
      : releases;
  }

  if (!release) {
    console.error({
      status: 404,
      body: 'Project has no releases'
    });
    process.exit(1);
    return false;
  }

  // Prepare constants
  const arch = maps.arch[platformArch];
  const vendor = maps.vendor[platformOs];
  const _os = maps.os[platformOs];
  const { assets, tag_name } = release;
  const version = tag_name.startsWith(tagPrefix)
    ? tag_name.slice(tagPrefix.length)
    : tag_name;
  let extension;

  const mapOrder = {
    binary,
    version,
    vendor,
    os: _os,
    arch
  };

  const asset = release.assets.find(({ name }) => {
    let assetName = name?.trim();

    for (const order of orders) {
      const content = mapOrder[order];

      if (!content) {
        continue;
      }

      if (!assetName.includes(content)) {
        return false;
      }

      assetName = assetName.slice(assetName.indexOf(content) + content.length);
    }

    // Currently does not support installer
    if (assetName.includes('install')) {
      return false;
    }

    // Trim for additional checks
    assetName = assetName?.trim();

    if (assetName && !validExtensions.includes(assetName.slice(1))) {
      return false;
    }

    extension = assetName;
    return true;
  });

  if (!asset) {
    console.error({
      status: 'error',
      body: 'Asset not found'
    });
    process.exit(1);
    return false;
  }

  // Preparing
  const suffix = vendor === 'pc' ? '.exe' : '';
  const localURL = `${__dirname}/${binary}`;
  await Promise.all([
    unlink(localURL + suffix).catch(noop),
    unlink(localURL + extension).catch(noop)
  ]);

  // Processing
  const response = await fetch(asset.browser_download_url, FETCH_REPO_OPTIONS);
  const { status, ok } = response;

  if (!ok || status !== 200) {
    console.error({
      status,
      body: await response.text()
    });
    process.exit(1);
    return false;
  }

  await writeFile(
    localURL + extension,
    Buffer.from(await response.arrayBuffer())
  );

  if (extension) {
    await finished(
      spawn(`tar -xzvf ${localURL + extension} ${binary}${suffix}`, {
        shell: true,
        detached: true,
        cwd: __dirname
      }).stdout
    );
    await unlink(localURL + extension).catch(noop);
  }
  if (platformOs !== 'win32') {
    await chmod(localURL + suffix, '755');
  }

  // If exists `.exe` binary
  if (
    vendor === 'pc' &&
    (await stat(`${__dirname}/${binary}${suffix}`).catch(() => false))
  ) {
    const pkg = await readFile(`${__dirname}/package.json`, {
      encoding: 'utf-8'
    });
    writeFile(
      `${__dirname}/package.json`,
      pkg.replace(`: "${binary}"`, `: "${binary}${suffix}"`)
    );
  }

  return true;
};
