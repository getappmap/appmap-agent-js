import { strict as Assert } from "assert";
import { buildTestAsync } from "../../../build/index.mjs";
import Object from "./object.mjs";

const { equal: assertEqual, fail: assertFail } = Assert;

const testAsync = async () => {
  const {
    hasOwnProperty,
    getOwnPropertyValue,
    coalesce,
    coalesceCaseInsensitive,
    mapMaybe,
  } = await Object(await buildTestAsync(import.meta));

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

  assertEqual(hasOwnProperty({ key: "bar" }, "key"), true);

  assertEqual(hasOwnProperty({ __proto__: { key: "bar" } }, "key"), false);

  // getOwnPropertyValue //

  assertEqual(getOwnPropertyValue({ key: "value" }, "key", "default"), "value");

  assertEqual(
    getOwnPropertyValue({ key: "value" }, "missing", "default"),
    "default",
  );

  assertEqual(
    getOwnPropertyValue(
      {
        get key() {
          return "value";
        },
      },
      "key",
      "default",
    ),
    "default",
  );

  // coalesce //

  assertEqual(coalesce({ key: "value" }, "key", "default"), "value");

  assertEqual(coalesce(null, "key", "default"), "default");

  // coalesceCaseInsensitive

  assertEqual(
    coalesceCaseInsensitive({ Key: "value" }, "key", "default"),
    "value",
  );

  assertEqual(
    coalesceCaseInsensitive({ Key: "value" }, "missing", "default"),
    "default",
  );
};

testAsync();
