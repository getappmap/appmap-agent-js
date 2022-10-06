const {
  process,
  process: { version },
} = globalThis;

import Loader from "./loader.mjs";
import { configuration, params } from "./configuration.mjs";

export const { transformSource, load } = Loader(
  version,
  configuration.hooks.esm,
);

const { main } = await import(
  `../../components/recorder-process/index.mjs?${params.toString()}`
);

main(process, configuration);
