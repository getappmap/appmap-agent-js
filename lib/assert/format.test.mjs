import { strict as Assert } from "assert";
import { format } from "./format.mjs";

Assert.equal(format("%%", []), "%");

Assert.equal(format("%s", ["foo"]), "foo");

Assert.equal(format("%j", [[123]]), "[123]");

Assert.equal(format("%o", [() => {}]), "[object Function]");

Assert.equal(format("%e", [new Error("foo")]), "foo");
