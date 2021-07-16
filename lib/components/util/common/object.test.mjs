import { strict as Assert } from "assert";
import { hasOwnProperty } from "./object.mjs";

Assert.deepEqual(hasOwnProperty({ foo: "bar" }, "foo"), true);

Assert.deepEqual(hasOwnProperty({ __proto__: { foo: "bar" } }, "foo"), false);
