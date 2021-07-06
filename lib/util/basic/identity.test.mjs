import { strict as Assert } from "assert";
import { identity } from "./identity.mjs";

Assert.equal(identity(123), 123);
