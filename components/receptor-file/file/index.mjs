import { lstat, mkdir } from "fs/promises";
import { writeFileSync } from "fs";
import { createServer } from "net";
import { patch } from "net-socket-messaging";

const { parse: parseJSON, stringify: stringifyJSON } = JSON;
const _String = String;
const _Set = Set;

export default (dependencies) => {
  const {
    "configuration-accessor": { resolveConfigurationPort },
    util: { assert, getDirectory },
    log: { logInfo, logError },
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
      return (await lstat(directory)).isDirectory();
    } catch (error) {
      const { code } = error;
      expect(
        code === "ENOENT",
        "cannot read directory status %j >> %e",
        directory,
        error,
      );
      return null;
    }
  };
  const createDirectoryAsync = async (directory) => {
    expect(
      directory !== "",
      "could not find any existing directory in the hiearchy of the storage directory",
    );
    const status = await isDirectoryAsync(directory);
    expect(
      status !== false,
      "cannot create directory %j because it is a file",
      directory,
    );
    if (status === null) {
      await createDirectoryAsync(getDirectory(directory));
      await mkdir(directory);
    }
  };
  const store = (
    paths,
    directory,
    {
      head: {
        output: { basename, extension },
        name,
      },
      body: trace,
    },
  ) => {
    if (basename === null) {
      basename = name === null ? "anonymous" : name;
    }
    let path = `${directory}/${basename}${extension}`;
    let counter = 0;
    while (paths.has(path)) {
      counter += 1;
      path = `${directory}/${basename}-${_String(counter)}${extension}`;
    }
    paths.add(path);
    writeFileSync(path, stringifyJSON(trace), "utf8");
    logInfo("Trace written at: %s", path);
  };
  const disconnection = {
    status: 1,
    errors: [
      {
        name: "AppmapError",
        message: "disconnection",
        stack: "",
      },
    ],
  };
  return {
    minifyReceptorConfiguration: ({
      recorder,
      "trace-port": trace_port,
      output: { directory },
    }) => ({
      recorder,
      "trace-port": trace_port,
      output: { directory },
    }),
    openReceptorAsync: async ({
      recorder,
      "trace-port": trace_port,
      output: { directory },
    }) => {
      assert(
        recorder === "mocha" || recorder === "process",
        "invalid recorder for receptor-file",
      );
      await createDirectoryAsync(directory);
      const server = createServer();
      const paths = new _Set();
      server.on("connection", (socket) => {
        patch(socket);
        socket.on("message", (session) => {
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
                  sendBackend(backend, ["stop", key, disconnection]);
                }
                for (const key of getBackendTraceIterator(backend)) {
                  store(paths, directory, takeBackendTrace(backend, key));
                }
              });
              socket.on("message", (content) => {
                if (sendBackend(backend, parseJSON(content))) {
                  for (const key of getBackendTraceIterator(backend)) {
                    store(paths, directory, takeBackendTrace(backend, key));
                  }
                }
              });
            }
          });
        });
      });
      const trace_service = await openServiceAsync(server, trace_port);
      logInfo("Trace port: %j", getServicePort(trace_service));
      return trace_service;
    },
    adaptReceptorConfiguration: (service, configuration) =>
      resolveConfigurationPort(
        configuration,
        getServicePort(service),
        configuration["track-port"],
      ),
    closeReceptorAsync: closeServiceAsync,
  };
};
