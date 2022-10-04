import Mocha from "mocha";

export { transformSource, load } from "./__common__.mjs";
import { params } from "./__common__.mjs";

const { validateMocha } = await import(
  `../../components/validate-mocha/index.mjs?${params.toString()}`
);

validateMocha(Mocha);
