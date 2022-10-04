import { assertDeepEqual, assertThrow } from "../../../__fixture__.mjs";
import {
  compileExclusionList,
  matchExclusionList,
} from "./exclusion-list.mjs?env=test";

assertThrow(() => {
  matchExclusionList(compileExclusionList([]), { type: "function" }, null);
});

assertDeepEqual(
  matchExclusionList(
    compileExclusionList([
      {
        combinator: "or",
        "every-label": true,
        "some-label": true,
        name: true,
        "qualified-name": true,
        excluded: true,
        recursive: false,
      },
    ]),
    { type: "function", name: "foo" },
    null,
  ),
  {
    excluded: true,
    recursive: false,
  },
);
