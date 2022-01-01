
import { tmpdir } from "os";
import { join as joinPath } from "path";
import { mkdir as mkdirAsync, symlink as symlinkAsync, writeFile as writeFileAsync, realpath as realpathAsync } from "fs/promises";
import YAML from "yaml";
import { spawnAsync } from "./spawn.mjs";

const { cwd } = process;
const { stringify: stringifyYAML } = YAML;
const { stringify: stringifyJSON } = JSON;

export const runAsync = async (_package, config, beforeAsync, afterAsync) => {
  const directory = joinPath(
    await realpathAsync(tmpdir()),
    Math.random().toString(36).substring(2),
  );
  await mkdirAsync(directory);
  await mkdirAsync(joinPath(directory, "node_modules"));
  await mkdirAsync(joinPath(directory, "node_modules", ".bin"));
  await mkdirAsync(joinPath(directory, "node_modules", "@appland"));
  await symlinkAsync(
    cwd(),
    joinPath(directory, "node_modules", "@appland", "appmap-agent-js"),
    "dir",
  );
  await writeFileAsync(
    joinPath(directory, "package.json"),
    stringifyJSON({
      name: "package",
      version: "1.2.3",
      ..._package,
    }),
  );
  await writeFileAsync(
    joinPath(directory, "appmap.yml"),
    stringifyYAML({
      validate: {
        message: true,
        appmap: true,
      },
      ...config,
    }),
  );
  await beforeAsync(directory);
  await spawnAsync("node", [joinPath(cwd(), "bin", "bin.mjs")], {
    cwd: directory,
    stdio: "inherit",
  });
  await afterAsync(directory);
  await spawnAsync("/bin/sh", ["rm", "-rf", directory], {});
};
