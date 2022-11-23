const { URL } = globalThis;

const { search: __search } = new URL(import.meta.url);

import { ExternalAppmapError } from "../../error/index.mjs";
import { logErrorWhen } from "../../log/index.mjs";
import { assert, noop } from "../../util/index.mjs";

export const unhook = noop;

export const hook = (_agent, { hooks: { mysql, pg, sqlite3 } }) => {
  assert(
    !logErrorWhen(
      mysql || pg || sqlite3,
      "No support for recording sql queries",
    ),
    "No support for recording sql queries",
    ExternalAppmapError,
  );
};
