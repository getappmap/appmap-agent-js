import { assertEqual, assertNotEqual } from "../../__fixture__.mjs";
import UUID from "./index.mjs";

const { getUUID } = UUID({});
assertEqual(typeof getUUID(), "string");
assertEqual(getUUID().length, 8);
assertNotEqual(getUUID(), getUUID());
