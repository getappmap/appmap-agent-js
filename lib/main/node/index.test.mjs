/* eslint-env node */

import { strict as Assert } from "assert";
import { EventEmitter } from "events";
import { pathToFileURL } from "url";
import { tmpdir } from "os";
import { readFile, writeFile, mkdir } from "fs/promises";
import { buildTestAsync } from "../../../build/index.mjs";
import Main from "./index.mjs";

const _eval = eval;

const { equal: assertEqual, deepEqual: assertDeepEqual } = Assert;

const testAsync = async () => {
  const dependencies = await buildTestAsync(import.meta, {
    client: "inline",
    "hook-module": "node",
  });
  const { main } = Main(dependencies);
  const directory = `${tmpdir()}/${Math.random().toString(36).substring(2)}`;
  await mkdir(directory);
  {
    await writeFile(`${directory}/.appmap.yml`, "enabled: false", "utf8");
    const { promise, transformSource } = main({
      cwd: () => directory,
      argv: ["node", "/main.mjs"],
      env: {},
    });
    assertEqual(
      transformSource(
        "123;",
        { format: "module", url: pathToFileURL(`${directory}/main.mjs`) },
        (x) => x,
      ),
      "123;",
    );
    assertEqual(await promise, null);
  }
  {
    const emitter = new EventEmitter();
    emitter.cwd = () => directory;
    emitter.env = { APPMAP_MAP: "foo" };
    await writeFile(
      `${directory}/.appmap.yml`,
      [
        "enabled: true",
        "packages:",
        "  - regexp: ^",
        "pruning: false",
        "output:",
        "  indent: 2",
        "  postfix: '.postfix'",
        "  directory: '.'",
        "  filename: filename",
      ].join("\n"),
      "utf8",
    );
    emitter.argv = ["node", "/main.mjs"];
    const { promise, transformSource } = main(emitter);
    assertEqual(
      _eval(
        transformSource(
          "123;",
          { format: "module", url: pathToFileURL(`${directory}/filename.mjs`) },
          (x) => x,
        ),
      ),
      123,
    );
    setTimeout(() => {
      emitter.emit("uncaughtExceptionMonitor", new TypeError("BOUM"));
    });
    setTimeout(() => {
      emitter.emit("exit", 123);
    });
    await promise;
    const {
      metadata: { test_status: status, exception },
      classMap: classmap,
    } = JSON.parse(
      await readFile(`${directory}/filename.postfix.json`, "utf8"),
    );
    assertEqual(status, "failed");
    assertDeepEqual(exception, { class: "TypeError", message: "BOUM" });
    assertDeepEqual(classmap, [
      { type: "class", name: "filename.mjs", children: [] },
    ]);
  }
};

testAsync();
