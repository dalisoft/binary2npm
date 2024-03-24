export function prepare({
  remote,
  author,
  repository,
  remoteToken = process.env.REMOTE_TOKEN,
  binary,
}: {
  remote: "github";
  author: string;
  repository: string;
  remoteToken: string;
  binary: string;
}): Promise<boolean>;
