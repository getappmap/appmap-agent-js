const { URL } = globalThis;

const { search: __search } = new URL(import.meta.url);

import { createServer } from "http";
const { createRecorder, generateRequestAsync } = await import(
  `../../recorder-cli/index.mjs${__search}`
);
const { generateRespond } = await import(`../../http/index.mjs${__search}`);

export const main = (process, configuration) => {
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
};
