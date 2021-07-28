import { createRequire } from "module";
import { readFileSync } from "fs";
import Git from "./git.mjs";

const { parse } = JSON;

export default (dependencies) => {
  const {
    assert: { assertSuccess, assert },
  } = dependencies;
  const { extractGitInformation } = Git(dependencies);
  const createPackage = (path) => {
    const { name, version } = assertSuccess(
      () =>
        parse(
          assertSuccess(
            () => readFileSync(`${path}/package.json`, "utf8"),
            "failed to read 'package.json' file >> %e",
          ),
        ),
      "failed to parse 'package.json' file >> %e",
    );
    return { name, version };
  };
  return {
    extractRepositoryHistory: extractGitInformation,
    extractRepositoryPackage: createPackage,
    extractRepositoryDependencyPackage: (path1, name) => {
      const { resolve } = createRequire(path1);
      const path2 = assertSuccess(
        () => resolve(name),
        "could resolve %j from %j >> %e",
        name,
        path1,
      );
      const index = path2.indexOf(`/${name}/`);
      assert(
        index !== -1,
        "could not find %j in %j which come from %j",
        name,
        path2,
        path1,
      );
      return createPackage(`${path2.substring(0, index)}/${name}`);
    },
  };
};
