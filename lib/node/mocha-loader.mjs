const {
  process: { version },
} = globalThis;

import Mocha from "mocha";
import Loader from "./loader.mjs";

import { params, configuration } from "./configuration.mjs";
export const { transformSource, load } = Loader(
  version,
  configuration.hooks.esm,
);

const { validateMocha } = await import(
  `../../components/validate-mocha/index.mjs?${params.toString()}`
);

validateMocha(Mocha);
