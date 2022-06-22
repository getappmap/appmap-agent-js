import { assert } from "../../__fixture__.mjs";
import Engine from "./index.mjs";
const { getEngine } = Engine({});
assert(getEngine().startsWith("node@"));
