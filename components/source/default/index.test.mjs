import {
  assertEqual,
  assertDeepEqual,
  assertThrow,
} from "../../__fixture__.mjs";
import { stringifyLocation } from "../../location/index.mjs";
import {
  createSource,
  resetSourceUrl,
  getSourceUrl,
  getSourceContent,
  isSourceEmpty,
  hashSource,
  parseSource,
  makeSourceLocation,
  fromSourceMessage,
  toSourceMessage,
} from "./index.mjs";

{
  const source = createSource("protocol://host/esm.mjs", "export foo = 123;");
  assertDeepEqual(fromSourceMessage(toSourceMessage(source)), source);
  assertEqual(isSourceEmpty(source), false);
  assertEqual(getSourceUrl(source), "protocol://host/esm.mjs");
  assertEqual(getSourceContent(source), "export foo = 123;");
  assertEqual(hashSource(source), hashSource(source));
  // Reference comparison to enforce caching for parsing
  assertEqual(parseSource(source), parseSource(source));
  assertEqual(
    typeof stringifyLocation(makeSourceLocation(source, 123, 456)),
    "string",
  );
}

assertEqual(
  getSourceUrl(
    resetSourceUrl(
      createSource("protocol1://host1/path1", null),
      "protocol2://host2/path2",
    ),
  ),
  "protocol2://host2/path2",
);

{
  const source = createSource("protocol://host/empty.mjs", null);
  assertDeepEqual(fromSourceMessage(toSourceMessage(source)), source);
  assertEqual(isSourceEmpty(source), true);
  assertEqual(getSourceUrl(source), "protocol://host/empty.mjs");
  assertThrow(() => getSourceContent(source), /^InternalAppmapError:/u);
  assertThrow(() => hashSource(source), /^InternalAppmapError:/u);
  assertThrow(() => parseSource(source), /^InternalAppmapError:/u);
  assertEqual(
    typeof stringifyLocation(makeSourceLocation(source, 123, 456)),
    "string",
  );
}
