import { assertThrow } from "../../__fixture__.mjs";
import { validateAppmap } from "./index.mjs";

assertThrow(
  () => validateAppmap({ verson: "1.2.3" }),
  /^InternalAppmapError: Invalid appmap$/u,
);
