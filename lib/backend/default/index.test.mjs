import { strict as Assert } from "assert";
import { readFile } from "fs/promises";
import { tmpdir } from "os";
import { buildTestAsync } from "../../../src/build.mjs";
import Backend from "./index.mjs";

const { deepEqual: assertDeepEqual, throws: assertThrows } = Assert;

const testAsync = async () => {
  const dependencies = await buildTestAsync({
    ...import.meta,
    deps: ["configuration"],
  });
  const {
    configuration: { createConfiguration, extendConfiguration },
  } = dependencies;
  const { openBackend, sendBackend, closeBackend } = Backend(dependencies);

  const filename = Math.random().toString(36).substring(2);
  const configuration = extendConfiguration(
    createConfiguration("/cwd"),
    {
      pruning: false,
      output: {
        directory: tmpdir(),
        postfix: ".postfix",
      },
    },
    "/cwd",
  );

  {
    const backend = openBackend();
    sendBackend(backend, { type: "initialize", data: configuration });
    sendBackend(backend, {
      type: "send",
      data: {
        type: "track",
        data: { type: "start", index: 123, options: { output: { filename } } },
      },
    });
    assertThrows(
      () => sendBackend(backend, { type: "invalid" }),
      /^AppmapError: invalid message type/,
    );
    sendBackend(backend, {
      type: "terminate",
      data: {
        errors: [{ name: "error-name", message: "error-message" }],
        status: 1,
      },
    });

    closeBackend(backend);
    const {
      metadata: { exception: error },
      ...rest
    } = JSON.parse(
      await readFile(`${tmpdir()}/${filename}.postfix.json`, "utf8"),
    );
    assertDeepEqual(error, { class: "error-name", message: "error-message" });
    assertDeepEqual(rest, { version: "1.6.0", classMap: [], events: [] });
  }

  {
    const backend = openBackend();
    sendBackend(backend, { type: "initialize", data: configuration });
    closeBackend(backend);
  }
};

testAsync();
