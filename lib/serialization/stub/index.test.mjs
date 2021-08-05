import { strict as Assert } from "assert";
import { buildTestAsync } from "../../../src/build.mjs";
import Serialization from "./index.mjs";

const { equal: assertEqual } = Assert;

const testAsync = async () => {
  const { createSerialization, serialize, getSerializationEmptyValue } =
    Serialization(await buildTestAsync(import.meta));
  const serialization = createSerialization({});
  const empty = getSerializationEmptyValue(serialization);
  assertEqual(serialize(serialization, empty), null);
  assertEqual(serialize(serialization, 123), "123");
};

testAsync();
