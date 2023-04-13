import { assertEqual, assertNotEqual } from "../../__fixture__.mjs";
import { digest } from "./index.mjs";

assertEqual(typeof digest("foo"), "string");

assertEqual(digest("foo"), digest("foo"));

assertNotEqual(digest("foo"), digest("bar"));
