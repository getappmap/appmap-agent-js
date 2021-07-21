import { strict as Assert } from "assert";
import { home } from "./home.mjs";
const { equal: assertEqual } = Assert;
assertEqual(typeof home, "string");
