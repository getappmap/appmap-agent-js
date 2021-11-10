import { writeFile, readFile } from "fs/promises";
import { strict as Assert } from "assert";
import { runAsync } from "../__fixture__.mjs";

const { deepEqual: assertDeepEqual } = Assert;

await runAsync(
  null,
  {
    recorder: "process",
    packages: { glob: "*" },
    command: "node ./main.mjs",
    ordering: "chronological",
    output: {
      basename: "basename",
    },
    hooks: {
      esm: false,
      cjs: false,
      apply: false,
      http: true,
    },
  },
  async (repository) => {
    await writeFile(
      `${repository}/main.mjs`,
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
          const request = Http.get("http://localhost:" + String(port));
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
      await readFile(`${directory}/tmp/appmap/basename.appmap.json`, "utf8"),
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
          mime_type: null,
          headers: {
            connection: "close",
            "transfer-encoding": "chunked",
          },
        },
      },
      {
        id: 3,
        event: "call",
        thread_id: 0,
        http_server_request: {
          headers: {
            host: "localhost:8888",
            connection: "close",
          },
          authorization: null,
          mime_type: null,
          request_method: "GET",
          path_info: "/",
          normalized_path_info: null,
          protocol: "HTTP/1.1",
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
          mime_type: null,
        },
      },
    ]);
  },
);
