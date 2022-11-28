import { assertEqual } from "../../__fixture__.mjs";
import { isPrefixArray } from "./util.mjs";

assertEqual(isPrefixArray([1, 2, 3], [1, 2]), false);

assertEqual(isPrefixArray([1, 2, 3], [1, 2, 3]), true);

assertEqual(isPrefixArray([1, 2, 3], [1, 2, 3, 4]), true);

assertEqual(isPrefixArray([1, "foo", 3], [1, 2, 3, 4]), false);
