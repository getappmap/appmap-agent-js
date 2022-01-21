import { spawnStrictAsync } from "../../spawn.mjs";
import { join as joinPath } from "path";
import { tmpdir as getTmpdir, platform as getPlatform } from "os";
import {
  rmdir as rmdirAsync,
  readFile as readFileAsync,
  writeFile as writeFileAsync,
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
await spawnStrictAsync(
  "git",
  ["checkout", "211b6fd21e45c3771e6f894d7e92d74d8b906006"],
  { stdio: "inherit", cwd: directory },
);
const npm = getPlatform() === "win32" ? "npm.cmd" : "npm";
await spawnStrictAsync(npm, ["pack", "--pack-destination", directory], {
  stdio: "inherit",
});
{
  const json = JSON.parse(
    await readFileAsync(joinPath(directory, "package.json"), "utf8"),
  );
  json.devDependencies[
    "@appland/appmap-agent-js"
  ] = `file:${await getPackNameAsync()}`;
  await writeFileAsync(
    joinPath(directory, "package.json"),
    JSON.stringify(json, null, 2),
    "utf8",
  );
}
await spawnStrictAsync(npm, ["install"], {
  stdio: "inherit",
  cwd: directory,
});
await spawnStrictAsync(npm, ["run", "build"], {
  stdio: "inherit",
  cwd: directory,
});
await spawnStrictAsync("node", ["appmap/install-config.js"], {
  stdio: "inherit",
  cwd: directory,
});
await spawnStrictAsync("node", ["appmap/install-script.js"], {
  stdio: "inherit",
  cwd: directory,
});
// TODO investigate why this fails on travis.
if (Reflect.getOwnPropertyDescriptor(process.env, "TRAVIS") === undefined) {
  await spawnStrictAsync(npm, ["run", "appmap-start"], {
    stdio: "inherit",
    cwd: directory,
    timeout: 10000,
    killSignal: "SIGINT",
  });
  const filenames = await readdirAsync(joinPath(directory, "tmp", "appmap"));
  stdout.write(
    `Generated complete appmap: ${JSON.stringify(filenames)}${"\n"}`,
  );
  assertEqual(filenames.length, 1);
}
{
  await spawnStrictAsync(npm, ["run", "appmap-test"], {
    stdio: "inherit",
    cwd: directory,
  });
  const filenames = await readdirAsync(
    joinPath(directory, "tmp", "appmap", "mocha"),
  );
  stdout.write(`Generated mocha appmaps: ${JSON.stringify(filenames)}${"\n"}`);
  assertEqual(filenames.length, 14);
}
await rmdirAsync(directory, { recursive: true });
