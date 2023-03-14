import { strict as Assert } from "node:assert";
const { equal: assertEqual } = Assert;
const defaultParameter = (x = 123) => x;
assertEqual(defaultParameter(), 123);
