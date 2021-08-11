// import * as Path from 'path';
import { tmpdir } from "os";
import {
  mkdir,
  symlink,
  writeFile,
  realpath,
  readdir,
  readFile,
} from "fs/promises";
import YAML from "yaml";
import { validate } from "@appland/appmap-validate";
import { spawnAsync } from "../spawn.mjs";

const { cwd } = process;
const { fromEntries } = Object;
const { stringify: stringifyYAML } = YAML;
const { stringify: stringifyJSON, parse: parseJSON } = JSON;

export const setupAsync = async (
  name,
  version,
  config,
  beforeAsync,
  afterAsync,
) => {
  const directory = `${await realpath(tmpdir())}/${Math.random()
    .toString(36)
    .substring(2)}`;
  await mkdir(directory);
  await mkdir(`${directory}/node_modules`);
  await mkdir(`${directory}/node_modules/@appland`);
  await symlink(cwd(), `${directory}/node_modules/@appland/appmap-agent-js`);
  await writeFile(
    `${directory}/package.json`,
    stringifyJSON({ name, version }),
  );
  await writeFile(`${directory}/configuration.yml`, stringifyYAML(config));
  await mkdir(`${directory}/tmp`);
  await mkdir(`${directory}/tmp/appmap`);
  await beforeAsync(directory);
  await spawnAsync(
    "node",
    [
      `${cwd()}/bin/batch.mjs`,
      "--repository",
      directory,
      "--configuration",
      `${directory}/configuration.yml`,
    ],
    {
      // cwd does not matters because we don't have any relative path
      stdio: "inherit",
    },
  );
  const appmaps = [];
  for (let filename of await readdir(`${directory}/tmp/appmap`)) {
    const appmap = parseJSON(
      await readFile(`${directory}/tmp/appmap/${filename}`),
    );
    validate({ data: appmap });
    // try {
    //   validate({ data: appmap });
    // } catch (error) {
    //   console.log(stringifyJSON(appmap, null, 2));
    //   throw error;
    // }
    appmaps.push([filename, appmap]);
  }
  await afterAsync(fromEntries(appmaps));
  await spawnAsync("/bin/sh", ["rm", "-rf", directory], {});
};
