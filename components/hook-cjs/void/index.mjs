import { ExternalAppmapError } from "../../error/index.mjs";
import { logErrorWhen } from "../../log/index.mjs";
import { assert, noop } from "../../util/index.mjs";

export const unhook = noop;

export const hook = (_agent, { hooks: { cjs } }) => {
  assert(
    !logErrorWhen(cjs, "No support for recording common-js modules"),
    "No support for recording common-js modules",
    ExternalAppmapError,
  );
};
