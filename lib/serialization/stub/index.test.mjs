import { strict as Assert } from "assert";
import { buildAsync } from "../../../build/index.mjs";
import Serialization from "./index.mjs";

const { equal: assertEqual } = Assert;

const testAsync = async () => {
  const { createSerialization, serialize, getSerializationEmptyValue } =
    Serialization(await buildAsync({ violation: "error", assert: "debug" }));
  const serialization = createSerialization({});
  const empty = getSerializationEmptyValue(serialization);
  assertEqual(serialize(serialization, empty), null);
  assertEqual(serialize(serialization, 123), "123");
};

testAsync();
