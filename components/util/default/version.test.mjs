import { strict as Assert } from "assert";
import { matchVersion } from "./version.mjs";

const { equal: assertEqual } = Assert;

assertEqual(matchVersion("1.2.3", "1.2.3"), true);
assertEqual(matchVersion("1.3.2", "1.2.3"), true);
assertEqual(matchVersion("1.2.3", "1.3.2"), false);
assertEqual(matchVersion("1.2.3", "1.2"), true);
assertEqual(matchVersion("1.2", "1.2.3"), false);
