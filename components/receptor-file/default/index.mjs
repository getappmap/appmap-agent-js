const {
  URL,
  JSON: { parse: parseJSON, stringify: stringifyJSON },
  encodeURIComponent,
  String,
  Set,
} = globalThis;

import { mkdir as mkdirAsync } from "fs/promises";
import { writeFileSync as writeFile, readFileSync as readFile } from "fs";
import { createServer } from "net";
import NetSocketMessaging from "net-socket-messaging";
import { toAbsoluteUrl } from "../../url/index.mjs";
import { extendConfigurationPort } from "../../configuration-accessor/index.mjs";
import { sanitizePathFilename } from "../../path/index.mjs";
import { InternalAppmapError } from "../../error/index.mjs";
import { assert } from "../../util/index.mjs";
import { logDebug, logWarning, logInfo, logError } from "../../log/index.mjs";
import {
  openServiceAsync,
  closeServiceAsync,
  getServicePort,
} from "../../service/index.mjs";
import {
  createBackend,
  sendBackend,
  getBackendTraceIterator,
  takeBackendTrace,
} from "../../backend/index.mjs";

const { patch: patchSocket } = NetSocketMessaging;

const store = (
  urls,
  base,
  { head: { appmap_file: basename, "map-name": map_name }, body: trace },
) => {
  if (basename === null) {
    basename = map_name === null ? "anonymous" : map_name;
  }
  basename = basename.replace(/\s+/gu, "-");
  let url = toAbsoluteUrl(
    encodeURIComponent(sanitizePathFilename(`${basename}.appmap.json`)),
    base,
  );
  let counter = 0;
  while (urls.has(url)) {
    counter += 1;
    url = toAbsoluteUrl(
      encodeURIComponent(
        sanitizePathFilename(`${basename}-${String(counter)}.appmap.json`),
      ),
      base,
    );
  }
  urls.add(url);
  writeFile(new URL(url), stringifyJSON(trace, null, 2), "utf8");
  logInfo("Trace written at: %s", url);
};

export const minifyReceptorConfiguration = ({
  recorder,
  "trace-port": trace_port,
  appmap_dir,
}) => ({
  recorder,
  "trace-port": trace_port,
  appmap_dir,
});

export const openReceptorAsync = async ({
  recorder,
  "trace-port": trace_port,
  appmap_dir: directory,
}) => {
  assert(
    recorder === "mocha" || recorder === "process",
    "invalid recorder for receptor-file",
    InternalAppmapError,
  );
  const base = toAbsoluteUrl(`${recorder}/`, directory);
  await mkdirAsync(new URL(base), { recursive: true });
  const server = createServer();
  const urls = new Set();
  server.on("connection", (socket) => {
    patchSocket(socket);
    socket.on("message", (_session) => {
      socket.removeAllListeners("message");
      socket.on("message", (content) => {
        socket.removeAllListeners("message");
        const configuration = parseJSON(content);
        const { recorder } = configuration;
        if (recorder !== "process" && recorder !== "mocha") {
          logError(
            "File receptor expected process/mocha recorder but got: %j",
            recorder,
          );
          socket.destroy();
        } else {
          const backend = createBackend(configuration);
          socket.on("close", () => {
            sendBackend(backend, {
              type: "stop",
              track: null,
              termination: {
                type: "disconnect",
              },
            });
            for (const key of getBackendTraceIterator(backend)) {
              store(urls, base, takeBackendTrace(backend, key));
            }
          });
          socket.on("message", (content) => {
            const message = parseJSON(content);
            if (message.type === "source" && message.content === null) {
              try {
                message.content = readFile(new URL(message.url), "utf8");
              } catch (error) {
                logWarning(
                  "Could not load source file %j >> %O",
                  message.url,
                  error,
                );
              }
            }
            sendBackend(backend, message);
            if (message.type === "stop") {
              for (const key of getBackendTraceIterator(backend)) {
                store(urls, base, takeBackendTrace(backend, key));
              }
            }
          });
        }
      });
    });
  });
  const trace_service = await openServiceAsync(server, trace_port);
  logDebug("Trace port: %j", getServicePort(trace_service));
  return trace_service;
};

export const adaptReceptorConfiguration = (service, configuration) =>
  extendConfigurationPort(configuration, {
    "trace-port": getServicePort(service),
    "track-port": configuration["track-port"],
  });

export const closeReceptorAsync = closeServiceAsync;
