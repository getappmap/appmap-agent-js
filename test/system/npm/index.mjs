import { spawnStrictAsync } from "../../spawn.mjs";
import { join as joinPath } from "path";
import { tmpdir as getTmpdir, platform as getPlatform } from "os";
import {
  rm as rmAsync,
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
const npm = getPlatform() === "win32" ? "npm.cmd" : "npm";
const npx = getPlatform() === "win32" ? "npx.cmd" : "npx";
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
// TODO investigate why this fails on travis.
// I tried to increase the timeout to 10000 without success.
if (Reflect.getOwnPropertyDescriptor(process.env, "TRAVIS") === undefined) {
  await spawnStrictAsync(
    npx,
    ["appmap-agent-js", "--recorder=process", "--", "node", "bin/bin.js", "0", ":memory:"],
    {
      stdio: "inherit",
      cwd: directory,
      timeout: 10000,
      killSignal: "SIGINT",
    },
  );
  const filenames = await readdirAsync(joinPath(directory, "tmp", "appmap"));
  stdout.write(
    `Generated complete appmap: ${JSON.stringify(filenames)}${"\n"}`,
  );
  assertEqual(filenames.length, 1);
}
{
  // TODO revert to npm, ["run", "appmap-test"] once the agent launch commands via shell
  await spawnStrictAsync(
    npx,
    [
      "appmap-agent-js",
      "--recorder=mocha",
      "--",
      npx,
      "mocha",
      "-r",
      "ts-node/register",
      "'test/*.ts'",
    ],
    {
      stdio: "inherit",
      cwd: directory,
    },
  );
  const filenames = await readdirAsync(
    joinPath(directory, "tmp", "appmap", "mocha"),
  );
  stdout.write(`Generated mocha appmaps: ${JSON.stringify(filenames)}${"\n"}`);
  assertEqual(filenames.length, 14);
}
await rmAsync(directory, { recursive: true });
