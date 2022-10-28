import {
  writeFile as writeFileAsync,
  readFile as readFileAsync,
} from "fs/promises";
import { strict as Assert } from "assert";
import { join as joinPath } from "path";
import { runAsync } from "./__fixture__.mjs";

const { JSON } = globalThis;

const { deepEqual: assertDeepEqual } = Assert;

await runAsync(
  null,
  {
    recorder: "process",
    packages: { glob: "*" },
    command: "node main.mjs",
    ordering: "chronological",
    appmap_file: "basename",
    hooks: {
      esm: false,
      cjs: false,
      apply: false,
      http: true,
    },
  },
  async (repository) => {
    await writeFileAsync(
      joinPath(repository, "main.mjs"),
      `
        import Http from "http";
        const server = Http.createServer();
        server.on("request", function onServerRequest (request, response) {
          request.on("data", function onServerRequestData () {});
          request.on("end", function onServerRequestEnd () {
            response.removeHeader("date");
            response.writeHead(200, "ok");
            response.end();
          });
        });
        server.on("listening", function onServerListening () {
          const {port} = server.address();
          const request = Http.request("http://localhost:" + String(port));
          request.setHeader("connection", "close");
          request.end();
          request.on("response", function onClientResponse (response) {
            response.on("data", function onClientResponseData () {});
            response.on("end", function onClientResponseEnd () {
              server.close();
            });
          });
        });
        server.listen(8888);
      `,
      "utf8",
    );
  },
  async (directory) => {
    const appmap = JSON.parse(
      await readFileAsync(
        joinPath(directory, "tmp", "appmap", "process", "basename.appmap.json"),
        "utf8",
      ),
    );
    let { events } = appmap;
    /* eslint-disable no-unused-vars */
    events = events.map(({ elapsed, ...event }) => event);
    /* eslint-enable no-unused-vars */
    assertDeepEqual(events, [
      {
        id: 1,
        event: "call",
        thread_id: 0,
        http_client_request: {
          request_method: "GET",
          url: "http://localhost:8888/",
          headers: {
            host: "localhost:8888",
          },
        },
        message: [],
      },
      {
        id: 2,
        event: "return",
        thread_id: 0,
        parent_id: 1,
        http_client_response: {
          status_code: 200,
          headers: {
            connection: "close",
            "transfer-encoding": "chunked",
          },
          return_value: null,
        },
      },
      {
        id: 3,
        event: "call",
        thread_id: 0,
        http_server_request: {
          protocol: "HTTP/1.1",
          request_method: "GET",
          path_info: "/",
          normalized_path_info: null,
          headers: {
            host: "localhost:8888",
            connection: "close",
          },
        },
        message: [],
      },
      {
        id: 4,
        event: "return",
        thread_id: 0,
        parent_id: 3,
        http_server_response: {
          status_code: 200,
          headers: {},
          return_value: null,
        },
      },
    ]);
  },
);
