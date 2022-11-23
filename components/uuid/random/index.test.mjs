import { assertEqual, assertNotEqual } from "../../__fixture__.mjs";
import { getUuid } from "./index.mjs";

assertEqual(typeof getUuid(), "string");
assertEqual(getUuid().length, 8);
assertNotEqual(getUuid(), getUuid());
