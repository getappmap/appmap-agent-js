import "./error.mjs";
import Loader from "./loader.mjs";

import { configuration } from "./configuration.mjs";

const {
  process: { version },
} = globalThis;
export const { getFormat, transformSource, load } = Loader(
  version,
  configuration.hooks.esm,
);
