// import * as Path from 'path';
import { tmpdir } from "os";
import { join as joinPath } from "path";
import { mkdir, symlink, writeFile, realpath } from "fs/promises";
import YAML from "yaml";
import { spawnAsync } from "./spawn.mjs";

const { cwd } = process;
const { stringify: stringifyYAML } = YAML;
const { stringify: stringifyJSON } = JSON;

export const runAsync = async (_package, config, beforeAsync, afterAsync) => {
  const directory = joinPath(
    await realpath(tmpdir()),
    Math.random().toString(36).substring(2),
  );
  await mkdir(directory);
  await mkdir(joinPath(directory, "node_modules"));
  await mkdir(joinPath(directory, "node_modules", ".bin"));
  await mkdir(joinPath(directory, "node_modules", "@appland"));
  await symlink(
    cwd(),
    joinPath(directory, "node_modules", "@appland", "appmap-agent-js"),
  );
  await writeFile(
    joinPath(directory, "package.json"),
    stringifyJSON({
      name: "package",
      version: "1.2.3",
      ..._package,
    }),
  );
  await writeFile(
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
