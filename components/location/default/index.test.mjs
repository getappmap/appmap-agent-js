import { assertDeepEqual } from "../../__fixture__.mjs";
import { stringifyLocation, parseLocation } from "./index.mjs";

const location = { url: "protocol://host/path", line: 123, column: 456 };

assertDeepEqual(parseLocation(stringifyLocation(location)), location);
