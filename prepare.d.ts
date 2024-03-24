export function prepare({
  remote,
  author,
  repository,
  remoteToken = process.env.REMOTE_TOKEN,
  binary,
  usePackageJson,
}: {
  remote: "github";
  author: string;
  repository: string;
  remoteToken: string;
  binary: string;
  usePackageJson?: boolean;
}): Promise<boolean>;
