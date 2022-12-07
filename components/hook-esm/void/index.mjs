import { ExternalAppmapError } from "../../error/index.mjs";
import { logErrorWhen } from "../../log/index.mjs";
import { assert, noop } from "../../util/index.mjs";

export const unhook = noop;

export const hook = (_agent, { hooks: { esm } }) => {
  assert(
    !logErrorWhen(esm, "No support for recording native modules"),
    "No support for recording native modules",
    ExternalAppmapError,
  );
};
