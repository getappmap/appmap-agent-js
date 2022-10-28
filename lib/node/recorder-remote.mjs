const {
  process,
  process: { version },
} = globalThis;

import "./error.mjs";
import Loader from "./loader.mjs";
import { configuration, params } from "./configuration.mjs";

export const { getFormat, transformSource, load } = Loader(
  version,
  configuration.hooks.esm,
);

const { main } = await import(
  `../../components/recorder-remote/index.mjs?${params.toString()}`
);

main(process, configuration);
