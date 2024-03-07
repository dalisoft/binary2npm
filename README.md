# commitlint-rs-npm

Lint commit messages with conventional commit messages

> **npm** integration for [commitlint-rs](https://github.com/KeisukeYamashita/commitlint-rs) without any overhead so using full power of `commitlint-rs` CLI performance and feature

## Documentations

Look at [official documentation](https://keisukeyamashita.github.io/commitlint-rs)

## Installation

```sh
npm install -g commitlint-rs-npm
# or
yarn install commitlint-rs-npm
# or
bun add commitlint-rs-npm
```

## Limitations

Currently supports only **Linux** and **macOS** systems, no **Windows** support yet due of `tar` command is unavailable on **Windows** yet

## Environment variables

| Name           | Description                                                                                     | Required |
| -------------- | ----------------------------------------------------------------------------------------------- | -------- |
| `GITHUB_TOKEN` | For [GitHub API](https://docs.github.com/rest/overview/resources-in-the-rest-api#rate-limiting) | Yes      |

## Usage

See [Documentations](#documentations), requires [Environment variables](#environment-variables)

## License

Apache-2.0
