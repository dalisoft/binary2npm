import {
  afterEach,
  beforeEach,
  describe,
  expect,
  mock,
  spyOn,
  test
} from 'bun:test';
import fs from 'node:fs';
import fsPromise from 'node:fs/promises';
import path from 'node:path';
import { prepare } from '../prepare';

await describe('windows', async () => {
  mock.module('process', () => ({
    arch: 'x64',
    platform: 'win32'
  }));

  const processExit = spyOn(process, 'exit').mockImplementation((code) => {});

  beforeEach(async () => {
    await fsPromise.writeFile(
      path.resolve(import.meta.dirname, 'package.json'),
      JSON.stringify({
        bin: {
          dprint: 'dprint'
        }
      }),
      null,
      2
    );
  });
  afterEach(async () => {
    await Promise.all([
      fsPromise
        .unlink(path.resolve(import.meta.dirname, 'dprint.exe'))
        .catch(() => {}),
      fsPromise
        .unlink(path.resolve(import.meta.dirname, 'package.json'))
        .catch(() => {})
    ]);
  });

  await test('windows binary exists', async () => {
    const return_code = await prepare({
      remote: 'github',
      author: 'dprint',
      repository: 'dprint',
      remoteToken: process.env.GITHUB_TOKEN,
      binary: 'dprint',
      orders: ['binary', 'arch', 'vendor', 'os']
    });
    expect(return_code).toBe(true);

    expect(fs.existsSync(path.resolve(import.meta.dirname, 'dprint.exe'))).toBe(
      true
    );
    expect(
      JSON.parse(
        await fsPromise.readFile(
          path.resolve(import.meta.dirname, 'package.json')
        )
      ).bin.dprint
    ).toBe('dprint.exe');
  });

  await test('windows binary does not exists', async () => {
    const return_code = await prepare({
      remote: 'github',
      author: 'dprint',
      repository: 'dprint',
      remoteToken: process.env.GITHUB_TOKEN,
      binary: 'dprint__404',
      orders: ['binary', 'arch', 'vendor', 'os']
    });
    expect(return_code).toBe(false);
    expect(processExit).toHaveBeenCalledWith(1);

    expect(
      fs.existsSync(path.resolve(import.meta.dirname, 'dprint__404.exe'))
    ).toBe(false);
  });
});

await describe('macos', async () => {
  mock.module('process', () => ({
    arch: process.arch,
    platform: 'darwin'
  }));

  const processExit = spyOn(process, 'exit').mockImplementation((code) => {});

  beforeEach(async () => {
    await fsPromise.writeFile(
      path.resolve(import.meta.dirname, 'package.json'),
      JSON.stringify({
        bin: {
          dprint: 'dprint'
        }
      }),
      null,
      2
    );
  });
  afterEach(async () => {
    await Promise.all([
      fsPromise
        .unlink(path.resolve(import.meta.dirname, 'dprint'))
        .catch(() => {}),
      fsPromise
        .unlink(path.resolve(import.meta.dirname, 'package.json'))
        .catch(() => {})
    ]);
  });

  await test('macos binary exists', async () => {
    const return_code = await prepare({
      remote: 'github',
      author: 'dprint',
      repository: 'dprint',
      remoteToken: process.env.GITHUB_TOKEN,
      binary: 'dprint',
      orders: ['binary', 'arch', 'vendor', 'os']
    });
    expect(return_code).toBe(true);

    await new Promise(process.nextTick);

    expect(fs.existsSync(path.resolve(import.meta.dirname, 'dprint'))).toBe(
      true
    );
    expect(
      JSON.parse(
        await fsPromise.readFile(
          path.resolve(import.meta.dirname, 'package.json')
        )
      ).bin.dprint
    ).toBe('dprint');
  });

  await test('macos binary does not exists', async () => {
    const return_code = await prepare({
      remote: 'github',
      author: 'dprint',
      repository: 'dprint',
      remoteToken: process.env.GITHUB_TOKEN,
      binary: 'dprint__404',
      orders: ['binary', 'arch', 'vendor', 'os']
    });
    expect(return_code).toBe(false);
    expect(processExit).toHaveBeenCalledWith(1);

    expect(
      fs.existsSync(path.resolve(import.meta.dirname, 'dprint__404'))
    ).toBe(false);
  });
});
