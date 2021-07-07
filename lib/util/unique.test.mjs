import { strict as Assert } from "assert";
import { getUniqueIdentifier } from "./unique.mjs";

Assert.equal(typeof getUniqueIdentifier(), "string");
Assert.equal(getUniqueIdentifier().length, 8);
Assert.notEqual(getUniqueIdentifier(), getUniqueIdentifier());
