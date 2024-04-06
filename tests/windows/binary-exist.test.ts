import { expect, test, mock, beforeAll } from "bun:test";

mock.module("os", () => ({
  platform: () => "win32",
}));
mock.module("process", () => ({
  arch: "x64",
}));

test("windows binary exists", async () => {
  const { prepare } = await import("../../prepare");

  const return_code = await prepare({
    remote: "github",
    author: "dprint",
    repository: "dprint",
    remoteToken: process.env.GITHUB_TOKEN,
    binary: "dprint",
    useVersion: false,
  });
  expect(return_code).toBe(true);

  //
});
