import { assertThrow, makeAbsolutePath } from "../../__fixture__.mjs";
import { buildTestDependenciesAsync } from "../../build.mjs";
import Repository from "./index.mjs";

const { extractRepositoryHistory } = Repository(
  await buildTestDependenciesAsync(import.meta.url),
);
assertThrow(
  () => extractRepositoryHistory(makeAbsolutePath("foo")),
  /^AssertionError: cannot extract/,
);
