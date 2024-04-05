# binary2npm

Prepare execution script for linking binaries from other tools/languages

Currently supports only **GitHub API**

## Installation

```sh
npm install binary2npm
# or
yarn install binary2npm
# or
bun add binary2npm
```

## Environment variables

| Name           | Description                                                                                     | Required |
| -------------- | ----------------------------------------------------------------------------------------------- | -------- |
| `GITHUB_TOKEN` | For [GitHub API](https://docs.github.com/rest/overview/resources-in-the-rest-api#rate-limiting) | Yes      |

## Usage

See [example](./examples/run.js)

```ts
// prepare.js
import { prepare } from "binary2npm";

await prepare({
  remote: "github",
  author: "MyGitHubUser",
  repository: "my-repo",
  remoteToken: process.env.GITHUB_TOKEN, // To avoid Github API limiting
  binary: "my-binary",
});
```

then add `prepare.js` as hook into your project

## Used for CLIs

This project was made for first entry but then improved and added support for other ways as well as **Windows** support added

- [commitlint-rs-npm](https://github.com/dalisoft/commitlint-rs-npm)
- [commitlint-go-npm](https://github.com/dalisoft/commitlint-go-npm)
- [jsona-rs-npm](https://github.com/dalisoft/jsona-rs-npm)
- [dprint-rs-npm](https://github.com/dalisoft/dprint-rs-npm)
- [biome-rs-npm](https://github.com/dalisoft/biome-rs-npm)

## License

Apache-2.0
