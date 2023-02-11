import { assertEqual, assertNotEqual } from "../../__fixture__.mjs";
import { hashStringArray } from "./index.mjs";

assertEqual(typeof hashStringArray(["foo", "bar"]), "string");

assertEqual(hashStringArray(["foo", "bar"]), hashStringArray(["foo", "bar"]));

assertNotEqual(
  hashStringArray(["foo", "bar"]),
  hashStringArray(["FOO", "BAR"]),
);

assertNotEqual(hashStringArray(["foobar"]), hashStringArray(["foo", "bar"]));

assertNotEqual(hashStringArray(["foo\0bar"]), hashStringArray(["foo", "bar"]));

assertNotEqual(
  hashStringArray(["3|foo3|bar"]),
  hashStringArray(["foo", "bar"]),
);
