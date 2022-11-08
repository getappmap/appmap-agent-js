import { assertEqual } from "../../../__fixture__.mjs";
import { makeRegExpCache, compileTestRegExpCache } from "./regexp.mjs?env=test";

assertEqual(compileTestRegExpCache(makeRegExpCache("^fo+$"))("foo"), true);

assertEqual(compileTestRegExpCache(makeRegExpCache("^fo+$"))("bar"), false);
