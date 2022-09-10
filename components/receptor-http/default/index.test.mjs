import { assertDeepEqual } from "../../__fixture__.mjs";
import { Socket } from "net";
import NetSocketMessaging from "net-socket-messaging";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";
import Receptor from "./index.mjs";

const {
  Promise,
  JSON: {stringify: stringifyJSON},
  setTimeout,
} = globalThis;

const { createMessage } = NetSocketMessaging;

const { requestAsync } = await buildTestComponentAsync("http");

const { createConfiguration, extendConfiguration } =
  await buildTestComponentAsync("configuration");

const {
  openReceptorAsync,
  adaptReceptorConfiguration,
  minifyReceptorConfiguration,
  closeReceptorAsync,
} = Receptor(await buildTestDependenciesAsync(import.meta.url));

const configuration = extendConfiguration(
  createConfiguration("file:///home"),
  {
    recorder: "remote",
  },
  "file:///base",
);
const receptor = await openReceptorAsync(
  minifyReceptorConfiguration(configuration),
);

const assertRequestAsync = async (method, path, body, response) => {
  assertDeepEqual(
    await requestAsync(
      "localhost",
      adaptReceptorConfiguration(receptor, configuration)["track-port"],
      method,
      path,
      body,
    ),
    {
      code: 200,
      message: "OK",
      body: null,
      ...response,
    },
  );
};

await assertRequestAsync("GET", "/invalid-path", null, {
  code: 400,
  message: "Bad Request",
});
await assertRequestAsync("GET", "/missing-session/track", null, {
  code: 404,
  message: "Missing Session",
});
await assertRequestAsync("GET", "/_appmap/track", null, {
  code: 404,
  message: "No Active Session",
});

{
  const socket = new Socket();
  await new Promise((resolve) => {
    socket.on("connect", resolve);
    socket.connect(
      adaptReceptorConfiguration(receptor, configuration)["trace-port"],
    );
  });
  socket.write(createMessage("session"));
  socket.write(
    createMessage(
      stringifyJSON(
        extendConfiguration(configuration, { recorder: "process" }, null),
      ),
    ),
  );
  await new Promise((resolve) => {
    socket.on("close", resolve);
  });
}

{
  const socket = new Socket();
  await new Promise((resolve) => {
    socket.on("connect", resolve);
    socket.connect(
      adaptReceptorConfiguration(receptor, configuration)["trace-port"],
    );
  });
  socket.write(createMessage("session"));
  socket.write(
    createMessage(
      stringifyJSON(
        extendConfiguration(configuration, { recorder: "remote" }, null),
      ),
    ),
  );
  await new Promise((resolve) => {
    setTimeout(resolve, 100);
  });
  await assertRequestAsync(
    "POST",
    "/session/track1",
    { path: null, data: { name: "name" } },
    {},
  );
  await assertRequestAsync(
    "POST",
    "/session/track1",
    { path: null, data: {} },
    { code: 409, message: "Duplicate Track" },
  );
  await assertRequestAsync("GET", "/_appmap/track1", null, {
    body: { enabled: true },
  });
  await assertRequestAsync(
    "DELETE",
    "/session/track1",
    { status: 123 },
    {
      body: [
        {
          type: "start",
          track: "track1",
          configuration: {
            name: "name",
          },
          url: null,
        },
        {
          type: "stop",
          track: "track1",
          status: 123,
        },
      ],
    },
  );
  await assertRequestAsync("GET", "/_appmap/track1", null, {
    body: { enabled: false },
  });
  await assertRequestAsync(
    "DELETE",
    "/session/track1",
    { status: 123 },
    { code: 404, message: "Missing Track" },
  );
  socket.write(
    createMessage(
      stringifyJSON({
        type: "start",
        track: "track2",
        configuration: {},
        url: null,
      }),
    ),
  );
  await new Promise((resolve) => {
    socket.on("close", resolve);
    socket.end();
  });
  await assertRequestAsync(
    "DELETE",
    "/session/track2",
    { status: 123 },
    {
      body: [
        {
          type: "start",
          track: "track2",
          configuration: {},
          url: null,
        },
        {
          type: "error",
          name: "AppmapError",
          message: "disconnection",
          stack: "",
        },
        {
          type: "stop",
          track: "track2",
          status: 1,
        },
      ],
    },
  );
  await closeReceptorAsync(receptor);
}
