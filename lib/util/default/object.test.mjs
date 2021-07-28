import { strict as Assert } from "assert";
import { buildTestAsync } from "../../../build/index.mjs";
import Object from "./object.mjs";

const { equal: assertEqual, fail: assertFail } = Assert;

const testAsync = async () => {
  const { hasOwnProperty, coalesce, mapMaybe } = await Object(
    await buildTestAsync(import.meta),
  );

  // mapMaybe //

  assertEqual(
    mapMaybe(null, () => assertFail()),
    null,
  );

  assertEqual(
    mapMaybe("foo", (x) => x + x),
    "foofoo",
  );

  // hasOwnProperty //

  assertEqual(hasOwnProperty({ foo: "bar" }, "foo"), true);

  assertEqual(hasOwnProperty({ __proto__: { foo: "bar" } }, "foo"), false);

  // coalesce //

  assertEqual(coalesce({ foo: "bar" }, "foo", "qux"), "bar");

  assertEqual(coalesce(null, "foo", "qux"), "qux");
};

testAsync();
