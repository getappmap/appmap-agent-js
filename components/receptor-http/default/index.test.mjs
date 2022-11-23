import { Socket } from "net";
import { writeFileSync as writeFile } from "fs";
import NetSocketMessaging from "net-socket-messaging";
import { assertDeepEqual } from "../../__fixture__.mjs";
import { getUuid } from "../../uuid/random/index.mjs";
import { getTmpUrl } from "../../path/index.mjs";
import { toAbsoluteUrl } from "../../url/index.mjs";
import {
  createConfiguration,
  extendConfiguration,
} from "../../configuration/index.mjs";
import { requestAsync } from "../../http/index.mjs";
import {
  openReceptorAsync,
  adaptReceptorConfiguration,
  minifyReceptorConfiguration,
  closeReceptorAsync,
} from "./index.mjs";

const {
  URL,
  Promise,
  JSON: { stringify: stringifyJSON },
  setTimeout,
} = globalThis;

const { createMessage } = NetSocketMessaging;

const configuration = extendConfiguration(
  createConfiguration("protocol://host/home/"),
  {
    recorder: "remote",
  },
  "protocol://host/base/",
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
  await assertRequestAsync("DELETE", "/session/track1", null, {
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
        termination: {
          type: "manual",
        },
      },
    ],
  });
  await assertRequestAsync("GET", "/_appmap/track1", null, {
    body: { enabled: false },
  });
  await assertRequestAsync("DELETE", "/session/track1", null, {
    code: 404,
    message: "Missing Track",
  });
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
  const url = toAbsoluteUrl(getUuid(), getTmpUrl());
  writeFile(new URL(url), "content", "utf8");
  socket.write(
    createMessage(
      stringifyJSON({
        type: "source",
        url: "protocol://host/",
        content: null,
        shallow: false,
        inline: false,
        exclude: [],
      }),
    ),
  );
  socket.write(
    createMessage(
      stringifyJSON({
        type: "source",
        url,
        content: null,
        shallow: false,
        inline: false,
        exclude: [],
      }),
    ),
  );
  await new Promise((resolve) => {
    socket.on("close", resolve);
    socket.end();
  });
  await assertRequestAsync("DELETE", "/session/track2", null, {
    body: [
      {
        type: "start",
        track: "track2",
        configuration: {},
        url: null,
      },
      {
        type: "source",
        url: "protocol://host/",
        content: null,
        shallow: false,
        inline: false,
        exclude: [],
      },
      {
        type: "source",
        url,
        content: "content",
        shallow: false,
        inline: false,
        exclude: [],
      },
      {
        type: "stop",
        track: null,
        termination: {
          type: "disconnect",
        },
      },
    ],
  });
  await closeReceptorAsync(receptor);
}
