import { strict as Assert } from "assert";
import {
  validateRequest,
  validateConfiguration,
} from "../../../../lib/server/validate.mjs";

validateRequest({ name: "foo" }).fromLeft();

Assert.deepEqual(
  validateConfiguration({ cwd: "/", "app-name": "foo" }).fromRight(),
  {
    cwd: "/",
    "app-name": "foo",
  },
);
