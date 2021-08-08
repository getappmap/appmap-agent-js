import { strict as Assert } from "assert";
import { buildDependenciesAsync } from "../../build.mjs";
import Object from "./object.mjs";

const {
  equal: assertEqual,
  fail: assertFail,
  deepEqual: assertDeepEqual,
} = Assert;

const testAsync = async () => {
  const {
    hasOwnProperty,
    getOwnPropertyValue,
    coalesce,
    coalesceCaseInsensitive,
    mapMaybe,
    assignProperty,
  } = await Object(await buildDependenciesAsync(import.meta.url, "test"));

  // mapMaybe //

  assertEqual(
    mapMaybe(null, () => assertFail()),
    null,
  );

  assertEqual(
    mapMaybe("foo", (x) => x + x),
    "foofoo",
  );

  // assignProperty //
  {
    const object = { __proto__: null };
    assertEqual(
      assignProperty({ object, key: "key", value: "value" }),
      undefined,
    );
    assertDeepEqual(object, { __proto__: null, key: "value" });
  }

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
