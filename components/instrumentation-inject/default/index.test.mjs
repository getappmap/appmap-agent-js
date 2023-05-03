import { assertReject, assertDeepEqual } from "../../__fixture__.mjs";
import { createConfiguration } from "../../configuration/index.mjs";
import { instrumentInject, instrumentInjectAsync } from "./index.mjs";

const { Error } = globalThis;

for (const instrumentAsync of [
  async (...args) => await instrumentInject(...args),
  instrumentInjectAsync,
]) {
  assertDeepEqual(
    await instrumentAsync(
      "protocol://host/home/script.js",
      "123;",
      createConfiguration("protocol://host/home/"),
      () => {
        throw new Error("message");
      },
    ),
    { sources: [], content: "123;", url: "protocol://host/home/script.js" },
  );
  assertReject(
    instrumentAsync(
      "protocol://host/home/script.js",
      null,
      createConfiguration("protocol://host/home/"),
      () => null,
    ),
    /^ExternalAppmapError: missing main content$/u,
  );
  assertReject(
    instrumentAsync(
      "protocol://host/home/script.js",
      null,
      createConfiguration("protocol://host/home/"),
      () => {
        throw new Error("message");
      },
    ),
    /^ExternalAppmapError: missing main content$/u,
  );
}
