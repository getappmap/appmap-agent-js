import { spawnStrictAsync } from "../../spawn.mjs";
import { join as joinPath } from "path";
import { tmpdir as getTmpdir } from "os";
import {
  readFile as readFileAsync,
  readdir as readdirAsync,
} from "fs/promises";
import { strict as Assert } from "assert";

const { stdout } = process;

const { equal: assertEqual } = Assert;

const getPackNameAsync = async () => {
  const { name, version } = JSON.parse(
    await readFileAsync("package.json", "utf8"),
  );
  return `${name.replace("/", "-").replace("@", "")}-${version}.tgz`;
};

const directory = joinPath(
  getTmpdir(),
  Math.random().toString(36).substring(2),
);
await spawnStrictAsync(
  "git",
  ["clone", "https://github.com/land-of-apps/appmap-agent-js-demo", directory],
  { stdio: "inherit" },
);
await spawnStrictAsync("npm", ["pack", "--pack-destination", directory], {
  stdio: "inherit",
});
await spawnStrictAsync("npm", ["install"], {
  stdio: "inherit",
  cwd: directory,
});
await spawnStrictAsync("npm", ["install", await getPackNameAsync()], {
  stdio: "inherit",
  cwd: directory,
});
await spawnStrictAsync("npm", ["run", "build"], {
  stdio: "inherit",
  cwd: directory,
});
{
  await spawnStrictAsync("npm", ["run", "appmap-start"], {
    stdio: "inherit",
    cwd: directory,
    timeout: 5000,
    killSignal: "SIGINT",
  });
  const filenames = await readdirAsync(joinPath(directory, "tmp", "appmap"));
  stdout.write(
    `Generated complete appmap: ${JSON.stringify(filenames)}${"\n"}`,
  );
  assertEqual(filenames.length, 1);
}
{
  await spawnStrictAsync("npm", ["run", "appmap-mocha"], {
    stdio: "inherit",
    cwd: directory,
  });
  const filenames = await readdirAsync(
    joinPath(directory, "tmp", "appmap", "mocha"),
  );
  stdout.write(`Generated mocha appmaps: ${JSON.stringify(filenames)}${"\n"}`);
  assertEqual(filenames.length, 14);
}