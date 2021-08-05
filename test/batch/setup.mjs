// import * as Path from 'path';
import * as FileSystem from 'fs';
import {tmpdir} from "os";
import {mkdir, symlink, writeFile, realpath} from "fs/promises";
import { strict as Assert } from 'assert';
import YAML from "yaml";
import {spawnAsync} from "../spawn.mjs";

const {stringify:stringifyYAML} = YAML;
const {stringify:stringifyJSON} = JSON;

export const setupAsync = async (name, version, config, beforeAsync, afterAsync) => {
  const directory = `${await realpath(tmpdir())}/${Math.random().toString(36).substring(2)}`;
  await mkdir(directory);
  await mkdir(`${directory}/node_modules`);
  await mkdir(`${directory}/node_modules/@appland`);
  await symlink(process.cwd(), `${directory}/node_modules/@appland/appmap-agent-js`);
  await writeFile(`${directory}/package.json`, stringifyJSON({name, version}));
  await writeFile(`${directory}/configuration.yml`, stringifyYAML(config));
  await beforeAsync(directory);
  await spawnAsync(
    "node",
    [
      `${process.cwd()}/bin/batch.mjs`,
      "--repository",
      directory,
      "--configuration",
      `${directory}/configuration.yml`,
    ],
    {
      // cwd does not matters because we don't have any relative path
      stdio: "inherit",
    }
  );
  await afterAsync(directory);
  // await spawnAsync("/bin/sh", ["rm", "-rf", directory], {});
};
