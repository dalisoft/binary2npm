# binary2npm

Prepare execution script for linking binaries from other tools/languages

Currently supports only **GitHub API**

## Installation

```sh
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
import { prepare } from "binary2npm";

await prepare({
  remote: "github",
  author: "MyGitHubUser",
  repository: "my-repo",
  remoteToken: process.env.GITHUB_TOKEN, // To avoid Github API limiting
  binary: "my-binary",
});
```

## License

Apache-2.0
