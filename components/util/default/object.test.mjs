import { assertEqual, assertDeepEqual } from "../../__fixture__.mjs";
import {
  hasOwnProperty,
  getOwnProperty,
  setOwnProperty,
  coalesce,
  coalesceCaseInsensitive,
  assignProperty,
  generateGet,
} from "./object.mjs";

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

// getOwnProperty //

assertEqual(getOwnProperty({ key: "value" }, "key", "default"), "value");

assertEqual(getOwnProperty({ key: "value" }, "missing", "default"), "default");

// setOwnProperty //

{
  const obj = {
    __proto__: {
      set key(value) {},
      get key() {
        return "VALUE";
      },
    },
  };
  assertEqual(setOwnProperty(obj, "key", "value"), undefined);
  assertEqual(getOwnProperty(obj, "key", "default"), "value");
}

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
