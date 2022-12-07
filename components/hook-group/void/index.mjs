import { ExternalAppmapError } from "../../error/index.mjs";
import { logErrorWhen } from "../../log/index.mjs";
import { assert, noop } from "../../util/index.mjs";

export const unhook = noop;

export const hook = (_agent, { ordering }) => {
  assert(
    !logErrorWhen(
      ordering !== "chronological",
      "No support for events re-ordering, got: %j",
      ordering,
    ),
    "No support for events re-ordering",
    ExternalAppmapError,
  );
};
