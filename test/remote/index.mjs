// Travis is taking too long for these timer to works.
// I'm disabling this test for now.
// It might be worthwhile to synchronize between node processes to avoid timers.
if (Reflect.getOwnPropertyDescriptor(process.env, "TRAVIS") !== undefined) {
  process.exit(0);
}

import { writeFile } from "fs/promises";
import { tmpdir } from "os";
import { request as createRequest } from "http";
import { strict as Assert } from "assert";
import { runAsync } from "../__fixture__.mjs";

const {
  deepEqual: assertDeepEqual,
  // equal: assertEqual
} = Assert;

const { stdout } = process;

export const requestAsync = (host, port, method, path, body) =>
  new Promise((resolve, reject) => {
    const content =
      body === null ? "" : Buffer.from(JSON.stringify(body), "utf8");
    const request = createRequest({
      host: "localhost",
      socketPath: port,
      method,
      path,
      headers:
        body === null
          ? {}
          : {
              "content-type": "application/json; charset=UTF-8",
              "content-length": content.length,
            },
    });
    request.on("error", reject);
    request.end(content);
    request.on("response", (response) => {
      response.on("error", reject);
      const buffers = [];
      response.on("data", (buffer) => {
        buffers.push(buffer);
      });
      response.on("end", () => {
        const content = Buffer.concat(buffers);
        resolve({
          code: response.statusCode,
          body: content.length === 0 ? null : JSON.parse(content),
        });
      });
    });
  });

export const forkAsync = async (host, port) => {
  await new Promise((resolve) => {
    setTimeout(resolve, 3000);
  });
  assertDeepEqual(
    await requestAsync(host, port, "POST", "/_appmap/record", {
      path: null,
      data: { name: "name2" },
    }),
    { code: 200, body: null },
  );
  assertDeepEqual(
    await requestAsync(host, port, "GET", "/_appmap/record", null),
    { code: 200, body: { enabled: true } },
  );
  await new Promise((resolve) => {
    setTimeout(resolve, 3000);
  });
  const {
    code,
    body: {
      metadata: { name, test_status, exception },
    },
  } = await requestAsync(host, port, "DELETE", "/_appmap/record", {
    status: 1,
    errors: [
      {
        name: "Foo",
        message: "Bar",
        stack: "Qux",
      },
    ],
  });
  assertDeepEqual(
    { code, name, test_status, exception },
    {
      code: 200,
      name: "name2",
      test_status: "failed",
      exception: { class: "Foo", message: "Bar" },
    },
  );
};

const testAsync = async (port_key, port, main) => {
  await runAsync(
    null,
    {
      mode: "remote",
      packages: { glob: "*" },
      [port_key]: port,
      log: "info",
      name: "name1",
      hooks: {
        esm: true,
        cjs: true,
        apply: true,
        http: false,
      },
      ordering: "causal",
      scenario: "scenario",
      scenarios: {
        scenario: ["node", "./main.mjs"],
      },
    },
    async (repository) => {
      await writeFile(`${repository}/main.mjs`, main, "utf8");
      forkAsync("localhost", port).catch((error) => {
        stdout.write(`Fork Caught: ${error.message}${"\n"}`);
        throw error;
      });
    },
    async (directory) => {},
  );
};

stdout.write("\ntrack-port\n");

await testAsync(
  "track-port",
  `${tmpdir()}/${Math.random().toString(36).substring(2)}`,
  `
    const interval = setInterval(function heartbeat () {}, 100);
    setTimeout(() => {
      clearInterval(interval);
    }, 9000);
  `,
);

stdout.write("\nintercept-track-port\n");

{
  const port = `${tmpdir()}/${Math.random().toString(36).substring(2)}`;
  await testAsync(
    "intercept-track-port",
    port,
    `
      import {createServer} from "http";
      const server = createServer();
      server.unref();
      server.listen(${JSON.stringify(port)});
      const interval = setInterval(function heartbeat () {}, 100);
      setTimeout(() => {
        clearInterval(interval);
      }, 6000);
    `,
  );
}
