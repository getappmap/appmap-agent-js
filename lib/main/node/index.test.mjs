/* eslint-env node */

// import { strict as Assert } from "assert";
import { EventEmitter } from "events";
import { tmpdir } from "os";
import { readFile, writeFile, mkdir } from "fs/promises";
import { buildTestAsync } from "../../../build/index.mjs";
import Main from "./index.mjs";

Error.stackTraceLimit = Infinity;

// const { equal: assertEqual, deepEqual: assertDeepEqual } = Assert;

const testAsync = async () => {
  const dependencies = await buildTestAsync(import.meta, { client: "inline" });
  const { main } = Main(dependencies);
  const emitter = new EventEmitter();
  const directory = `${tmpdir()}/${Math.random().toString(36).substring(2)}`;
  await mkdir(directory);
  emitter.cwd = () => directory;
  emitter.env = { APPMAP_MAP: "foo", APPMAP_ENABLED: true };
  await writeFile(
    `${directory}/.appmap.yml`,
    [
      "output:",
      "  postfix: postfix",
      "  directory: '.'",
      "  filename: filename",
      "hooks:",
      "  esm: false",
      "  cjs: false",
    ].join("\n"),
    "utf8",
  );
  emitter.argv = ["node", `${directory}/main.mjs`];
  const { promise } = main(emitter);
  setTimeout(() => {
    emitter.emit("exit", 0);
  });
  console.log(await promise);
  console.log(await readFile(`${directory}/filename.postfix.yml`, "utf8"));
};

testAsync();
