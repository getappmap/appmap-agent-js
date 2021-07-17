import { strict as Assert } from "assert";
import { hasOwnProperty, fetch } from "./object.mjs";

Assert.equal(hasOwnProperty({ foo: "bar" }, "foo"), true);

Assert.equal(hasOwnProperty({ __proto__: { foo: "bar" } }, "foo"), false);

Assert.equal(fetch({ foo: "bar" }, "foo", "qux"), "bar");

Assert.equal(fetch(null, "foo", "qux"), "qux");
