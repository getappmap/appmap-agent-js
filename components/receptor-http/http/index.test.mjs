import { assertDeepEqual } from "../../__fixture__.mjs";
import { Socket } from "net";
import NetSocketMessaging from "net-socket-messaging";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";
import Receptor from "./index.mjs";

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
  createConfiguration("/root"),
  {
    recorder: "remote",
  },
  null,
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
      JSON.stringify(
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
      JSON.stringify(
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
    { status: 123, errors: [] },
    {
      body: {
        configuration: { ...configuration, recorder: "remote", name: "name" },
        sources: [],
        events: [],
        termination: { status: 123, errors: [] },
      },
    },
  );
  await assertRequestAsync("GET", "/_appmap/track1", null, {
    body: { enabled: false },
  });
  await assertRequestAsync(
    "DELETE",
    "/session/track1",
    { status: 123, errors: [] },
    { code: 404, message: "Missing Track" },
  );
  socket.write(
    createMessage(
      JSON.stringify(["start", "track2", { path: null, data: {} }]),
    ),
  );
  await new Promise((resolve) => {
    socket.on("close", resolve);
    socket.end();
  });
  await assertRequestAsync(
    "DELETE",
    "/session/track2",
    { status: 123, errors: [] },
    {
      body: {
        configuration: {
          ...configuration,
          recorder: "remote",
        },
        sources: [],
        events: [],
        termination: {
          status: 1,
          errors: [
            { name: "AppmapError", message: "disconnection", stack: "" },
          ],
        },
      },
    },
  );
  await closeReceptorAsync(receptor);
}
