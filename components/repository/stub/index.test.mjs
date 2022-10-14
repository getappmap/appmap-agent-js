/* eslint-env node */
import { assertDeepEqual } from "../../__fixture__.mjs";
import { extractRepositoryDependency } from "./index.mjs?env=test";

assertDeepEqual(
  extractRepositoryDependency("file:///w:/home/", "./foo/bar.mjs"),
  {
    directory: "file:///w:/home/",
    package: {
      name: "./foo/bar.mjs",
      version: "0.0.0",
      homepage: null,
    },
  },
);
