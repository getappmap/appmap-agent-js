import { tmpdir as getTmpDir, platform as getPlatform } from "os";
import { join as joinPath } from "path";
import {
  rm as rmAsync,
  mkdir as mkdirAsync,
  symlink as symlinkAsync,
  writeFile as writeFileAsync,
  realpath as realpathAsync,
} from "fs/promises";
import YAML from "yaml";
import { spawnStrictAsync } from "../../spawn.mjs";

const { cwd } = process;
const { stringify: stringifyYAML } = YAML;
const { stringify: stringifyJSON } = JSON;

const runAsyncInner = async (_package, config, beforeAsync, afterAsync) => {
  const directory = joinPath(
    await realpathAsync(getTmpDir()),
    Math.random().toString(36).substring(2),
  );
  await mkdirAsync(directory);
  await mkdirAsync(joinPath(directory, "node_modules"));
  await writeFileAsync(
    joinPath(directory, "package.json"),
    stringifyJSON({
      name: "package",
      version: "1.2.3",
      ..._package,
    }),
  );
  await beforeAsync(directory);
  await mkdirAsync(joinPath(directory, "node_modules", "@appland"));
  await symlinkAsync(
    cwd(),
    joinPath(directory, "node_modules", "@appland", "appmap-agent-js"),
    "dir",
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
  await spawnStrictAsync("node", [joinPath(cwd(), "bin", "bin.mjs")], {
    cwd: directory,
    stdio: "inherit",
  });
  await afterAsync(directory);
  await rmAsync(directory, { recursive: true });
};

export const runAsync =
  getPlatform() === "win32"
    ? runAsyncInner
    : async (_package, config, beforeAsync, afterAsync) => {
        process.stdout.write("NET...\n");
        await runAsyncInner(
          _package,
          { ...config, socket: "net" },
          beforeAsync,
          afterAsync,
        );
        process.stdout.write("UNIX...\n");
        await runAsyncInner(
          _package,
          { ...config, socket: "unix" },
          beforeAsync,
          afterAsync,
        );
      };
