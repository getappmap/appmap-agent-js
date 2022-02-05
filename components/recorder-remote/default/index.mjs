import { createServer } from "http";

export default (dependencies) => {
  const {
    "recorder-cli": { createRecorder, generateRequestAsync },
    http: { generateRespond },
  } = dependencies;
  return {
    main: (process, configuration) => {
      const recorder = createRecorder(process, configuration);
      if (recorder !== null) {
        const { "frontend-track-port": port } = configuration;
        if (port !== null) {
          const server = createServer();
          server.unref();
          server.on("request", generateRespond(generateRequestAsync(recorder)));
          server.listen(port);
        }
      }
    },
  };
};
