/* eslint-env node */

import { strict as Assert } from "assert";
import { EventEmitter } from "events";
import { pathToFileURL } from "url";
import { tmpdir } from "os";
import { readFile, writeFile, mkdir } from "fs/promises";
import { buildTestAsync } from "../../../src/build.mjs";
import Main from "./index.mjs";

const _eval = eval;

const { equal: assertEqual, deepEqual: assertDeepEqual } = Assert;

const testAsync = async () => {
  const dependencies = await buildTestAsync(
    { ...import.meta, deps: ["configuration"] },
    {
      client: "inline",
      "hook-module": "node",
    },
  );
  const {
    configuration: { createConfiguration, extendConfiguration },
  } = dependencies;
  const { mainAsync } = Main(dependencies);
  const directory = `${tmpdir()}/${Math.random().toString(36).substring(2)}`;
  await mkdir(directory);
  {
    const promise = await mainAsync({
      cwd: () => directory,
      argv: ["node", "/main.mjs"],
      env: {
        APPMAP_CONFIGURATION: JSON.stringify(
          extendConfiguration(
            createConfiguration("/"),
            { enabled: false },
            "/",
          ),
        ),
      },
    });
    assertEqual(await promise, null);
  }
  {
    global.APPMAP_TRANSFORM_SOURCE = null;
    const emitter = new EventEmitter();
    emitter.cwd = () => "/";
    emitter.env = {
      APPMAP_REPOSITORY_DIRECTORY: directory,
      APPMAP_CONFIGURATION_PATH: `${directory}/configuration-filename.yml`,
    };
    await writeFile(
      `${directory}/configuration-filename.yml`,
      [
        "enabled: true",
        "packages:",
        "  - regexp: ^",
        "pruning: false",
        "output:",
        "  indent: 2",
        "  postfix: '.postfix'",
        "  directory: '.'",
        "  filename: output-filename",
      ].join("\n"),
      "utf8",
    );
    emitter.argv = ["node", "/main.mjs"];
    const promise = mainAsync(emitter);
    assertEqual(
      _eval(
        global.APPMAP_TRANSFORM_SOURCE(
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
      await readFile(`${directory}/output-filename.postfix.json`, "utf8"),
    );
    assertEqual(status, "failed");
    assertDeepEqual(exception, { class: "TypeError", message: "BOUM" });
    assertDeepEqual(classmap, [
      { type: "package", name: "filename.mjs", children: [] },
    ]);
  }
};

testAsync();
