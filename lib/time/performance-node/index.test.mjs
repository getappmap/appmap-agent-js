import { strict as Assert } from "assert";
import Time from "./index.mjs";

const { equal: assertEqual } = Assert;

const mainAsync = async () => {
  const { now } = Time({});
  assertEqual(typeof now(), "number");
};

mainAsync();
