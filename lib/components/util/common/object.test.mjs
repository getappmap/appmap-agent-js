import { strict as Assert } from "assert";
import { hasOwnProperty, coalesce } from "./object.mjs";

Assert.equal(hasOwnProperty({ foo: "bar" }, "foo"), true);

Assert.equal(hasOwnProperty({ __proto__: { foo: "bar" } }, "foo"), false);

Assert.equal(coalesce({ foo: "bar" }, "foo", "qux"), "bar");

Assert.equal(coalesce(null, "foo", "qux"), "qux");
