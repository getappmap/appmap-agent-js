import { lstat as lstatAsync, mkdir as mkdirAsync } from "fs/promises";
import { writeFileSync } from "fs";
import { createServer } from "net";
import NetSocketMessaging from "net-socket-messaging";

const { patch: patchSocket } = NetSocketMessaging;

const {
  JSON: { parse: parseJSON, stringify: stringifyJSON },
  URL,
  String,
  Set,
} = globalThis;

export default (dependencies) => {
  const {
    "configuration-accessor": { extendConfigurationPort },
    path: { makeSegment },
    url: { appendURLSegment },
    util: { assert },
    log: { logDebug, logInfo, logError },
    expect: { expect },
    service: { openServiceAsync, closeServiceAsync, getServicePort },
    backend: {
      createBackend,
      sendBackend,
      getBackendTrackIterator,
      getBackendTraceIterator,
      takeBackendTrace,
    },
  } = dependencies;
  const isDirectoryAsync = async (directory) => {
    try {
      return (await lstatAsync(new URL(directory))).isDirectory();
    } catch (error) {
      const { code } = error;
      expect(
        code === "ENOENT",
        "cannot read directory status %j >> %O",
        directory,
        error,
      );
      return null;
    }
  };
  const createDirectoryAsync = async (directory) => {
    const is_directory = await isDirectoryAsync(directory);
    if (is_directory === null) {
      const parent_directory = appendURLSegment(directory, "..");
      expect(
        parent_directory !== directory,
        "could not find any existing directory in the hiearchy of the storage directory",
      );
      await createDirectoryAsync(parent_directory);
      await mkdirAsync(new URL(directory));
    } else {
      expect(
        is_directory,
        "cannot create directory %j because it is a file",
        directory,
      );
    }
  };
  const store = (
    urls,
    directory,
    { head: { appmap_file: basename, "map-name": map_name }, body: trace },
  ) => {
    if (basename === null) {
      basename = map_name === null ? "anonymous" : map_name;
    }
    basename = basename.replace(/[\t\n ]/gu, "");
    let url = appendURLSegment(
      directory,
      makeSegment(`${basename}.appmap.json`, "-"),
    );
    let counter = 0;
    while (urls.has(url)) {
      counter += 1;
      url = appendURLSegment(
        directory,
        makeSegment(`${basename}-${String(counter)}.appmap.json`, "-"),
      );
    }
    urls.add(url);
    writeFileSync(new URL(url), stringifyJSON(trace, null, 2), "utf8");
    logInfo("Trace written at: %s", url);
  };
  return {
    minifyReceptorConfiguration: ({
      recorder,
      "trace-port": trace_port,
      appmap_dir,
    }) => ({
      recorder,
      "trace-port": trace_port,
      appmap_dir,
    }),
    openReceptorAsync: async ({
      recorder,
      "trace-port": trace_port,
      appmap_dir: directory,
    }) => {
      assert(
        recorder === "mocha" || recorder === "process",
        "invalid recorder for receptor-file",
      );
      const recorder_directory = appendURLSegment(directory, recorder);
      await createDirectoryAsync(recorder_directory);
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
                "File receptor expected process/mocha recorder but got: ",
                recorder,
              );
              socket.destroy();
            } else {
              const backend = createBackend(configuration);
              socket.on("close", () => {
                for (const key of getBackendTrackIterator(backend)) {
                  sendBackend(backend, {
                    type: "error",
                    name: "AppmapError",
                    message: "disconnection",
                    stack: "",
                  });
                  sendBackend(backend, {
                    type: "stop",
                    track: key,
                    status: 1,
                  });
                }
                for (const key of getBackendTraceIterator(backend)) {
                  store(
                    urls,
                    recorder_directory,
                    takeBackendTrace(backend, key),
                  );
                }
              });
              socket.on("message", (content) => {
                if (sendBackend(backend, parseJSON(content))) {
                  for (const key of getBackendTraceIterator(backend)) {
                    store(
                      urls,
                      recorder_directory,
                      takeBackendTrace(backend, key),
                    );
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
    },
    adaptReceptorConfiguration: (service, configuration) =>
      extendConfigurationPort(configuration, {
        "trace-port": getServicePort(service),
        "track-port": configuration["track-port"],
      }),
    closeReceptorAsync: closeServiceAsync,
  };
};