import { assertEqual, assertNotEqual } from "../../__fixture__.mjs";
import { getUUID } from "./index.mjs?env=test";

assertEqual(typeof getUUID(), "string");
assertEqual(getUUID().length, 8);
assertNotEqual(getUUID(), getUUID());
