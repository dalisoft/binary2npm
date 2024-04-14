import { prepare } from '../prepare.js';

await prepare({
  remote: 'github',
  author: 'KeisukeYamashita',
  repository: 'commitlint-rs',
  remoteToken: process.env.GITHUB_TOKEN,
  binary: 'commitlint'
});
