import { strict as Assert } from "assert";
import Engine from "./index.mjs";
const { equal: assertEqual } = Assert;
const { getEngine } = Engine({});
const { name } = getEngine();
assertEqual(name, "node");
