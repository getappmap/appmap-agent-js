/* eslint-env node */
import { assertDeepEqual } from "../../__fixture__.mjs";
import { extractRepositoryDependency } from "./index.mjs?env=test";

assertDeepEqual(extractRepositoryDependency("file:///home", ["foo", "bar"]), {
  directory: "file:///home/node_modules/foo/bar",
  package: {
    name: "foo/bar",
    version: "0.0.0",
    homepage: null,
  },
});
