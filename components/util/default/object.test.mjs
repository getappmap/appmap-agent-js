import {
  assertEqual,
  assertFail,
  assertDeepEqual,
} from "../../__fixture__.mjs";
import {
  hasOwnProperty,
  getOwnPropertyValue,
  coalesce,
  coalesceCaseInsensitive,
  mapMaybe,
  mapMaybeAsync,
  assignProperty,
  generateGet,
} from "./object.mjs";

// mapMaybe //

assertEqual(
  mapMaybe(null, () => assertFail()),
  null,
);

assertEqual(
  mapMaybe("foo", (x) => x + x),
  "foofoo",
);

// mapMaybeAsync //

assertEqual(await mapMaybeAsync(null, async () => assertFail()), null);

assertEqual(await mapMaybeAsync("foo", async (x) => x + x), "foofoo");

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

// generateGet //

assertEqual(generateGet("key")({ key: "value" }), "value");
