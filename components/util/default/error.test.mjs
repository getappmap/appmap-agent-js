import { assert } from "../../__fixture__.mjs";
import { isFileNotFound } from "./error.mjs";

const { Error } = globalThis;

const enoent = new Error("ENOENT");
enoent.code = "ENOENT";

const unknown = new Error("UNKNOWN");
unknown.code = "UNKNOWN";

assert(isFileNotFound(enoent));
assert(isFileNotFound(unknown));
assert(!isFileNotFound(new Error("test")));
assert(!isFileNotFound("test"));
