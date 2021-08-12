import { writeFile, symlink } from "fs/promises";
import { strict as Assert } from "assert";
import { setupAsync } from "./setup.mjs";

const { cwd } = process;
const { deepEqual: assertDeepEqual } = Assert;

export default async (protocol) => {
  await setupAsync(
    "app",
    "1.2.3",
    {
      enabled: true,
      name: "name",
      protocol,
      "function-name-placeholder": "$",
      packages: [{ glob: "*" }],
      hooks: {
        esm: false,
        cjs: false,
        apply: false,
        http: true,
      },
      output: { filename: "filename" },
      validate: {
        message: true,
        appmap: true,
      },
    },
    ["node", "./main.mjs"],
    async (repository) => {
      await symlink(
        `${cwd()}/node_modules/sqlite3`,
        `${repository}/node_modules/sqlite3`,
      );
      await writeFile(
        `${repository}/main.mjs`,
        `
          import Http from "http";
          const server = Http.createServer();
          server.on("request", (request, response) => {
            request.on("data", () => {});
            request.on("end", () => {
              response.removeHeader("date");
              response.writeHead(200, "ok");
              response.end();
            });
          });
          server.on("listening", () => {
            const {port} = server.address();
            const request = Http.get("http://localhost:" + String(port));
            request.on("response", (response) => {
              response.on("data", () => {});
              response.on("end", () => {
                server.close();
              });
            });
          });
          server.listen(8888);
        `,
        "utf8",
      );
    },
    async (appmaps) => {
      const { "filename.appmap.json": appmap } = appmaps;
      let { events } = appmap;
      /* eslint-disable no-unused-vars */
      events = events.map(({ elapsed, ...event }) => event);
      /* eslint-enable no-unused-vars */
      assertDeepEqual(events, [
        {
          id: 2,
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
          id: 4,
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
          id: 5,
          event: "return",
          thread_id: 0,
          parent_id: 4,
          http_server_response: {
            status_code: 200,
            mime_type: null,
          },
        },
        {
          id: 3,
          event: "return",
          thread_id: 0,
          parent_id: 2,
          http_client_response: {
            status_code: 200,
            mime_type: null,
            headers: {
              connection: "close",
              "transfer-encoding": "chunked",
            },
          },
        },
      ]);
    },
  );
};
