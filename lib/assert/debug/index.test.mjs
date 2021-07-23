import { strict as Assert } from "assert";
import { buildAsync } from "../../../build/index.mjs";
import _Assert from "./index.mjs";

const { equal: assertEqual } = Assert;

const mainAsync = async () => {
  const { assert, assertSuccess, assertSuccessAsync } = _Assert(
    await buildAsync({
      violation: "error",
    }),
  );
  assertEqual(assert(true, "%s", "foo"), undefined);
  assertEqual(
    assertSuccess(() => 123, "%e"),
    123,
  );
  await assertSuccessAsync(Promise.resolve(123), "%e");
};

mainAsync();
