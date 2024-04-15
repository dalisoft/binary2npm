import { maps, prepare } from '../prepare.js';

maps.arch = {
  x86: undefined,
  x64: 'x64',
  arm64: 'arm64'
};
maps.vendor = {};
maps.os.win32 = 'win32';

await prepare({
  remote: 'github',
  author: 'oxc-project',
  repository: 'oxc',
  remoteToken: process.env.GITHUB_TOKEN,
  binary: 'oxlint',
  orders: ['binary', 'os', 'arch']
});
