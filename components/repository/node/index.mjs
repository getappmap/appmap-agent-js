import { createRequire } from "module";
import { readFileSync, readdirSync } from "fs";
import { pathToFileURL } from "url";
import Git from "./git.mjs";

const _URL = URL;
const { parse } = JSON;

export default (dependencies) => {
  const {
    expect: { expectSuccess, expect },
    url: { appendURLSegment },
    log: { logWarning },
  } = dependencies;
  const { extractGitInformation } = Git(dependencies);
  const hasPackageJSON = (url) => {
    try {
      readFileSync(new _URL(appendURLSegment(url, "package.json")), "utf8");
      return true;
    } catch (error) {
      const { code } = { code: null, ...error };
      expect(
        code === "ENOENT",
        "failed to attempt reading package.json >> %e",
        error,
      );
      return false;
    }
  };
  const createPackage = (url) => {
    if (
      !expectSuccess(
        () => readdirSync(new _URL(url)),
        "could not read repository directory %j >> %e",
        url,
      ).includes("package.json")
    ) {
      logWarning(
        "No 'package.json' file found at repository directory %s",
        url,
      );
      return null;
    }
    const { name, version, homepage } = {
      name: null,
      version: null,
      homepage: null,
      ...expectSuccess(
        () =>
          parse(
            expectSuccess(
              () =>
                readFileSync(
                  new _URL(appendURLSegment(url, "package.json")),
                  "utf8",
                ),
              "could not read 'package.json' file from %j >> %e",
              url,
            ),
          ),
        "could not parse 'package.json' file from %j >> %e",
        url,
      ),
    };
    expect(
      name !== null,
      "missing name property in 'package.json' file from %j",
      url,
    );
    expect(
      version !== null,
      "missing version property in 'package.json' file from %j",
      url,
    );
    return { name, version, homepage };
  };
  return {
    extractRepositoryHistory: extractGitInformation,
    extractRepositoryPackage: createPackage,
    extractRepositoryDependency: (home, name) => {
      const { resolve } = createRequire(
        new _URL(appendURLSegment(home, "dummy.js")),
      );
      let url = pathToFileURL(
        expectSuccess(
          () => resolve(name),
          "could not resolve %j from %j >> %e",
          name,
          home,
        ),
      );
      url = appendURLSegment(url, "..");
      while (!hasPackageJSON(url)) {
        const parent_url = appendURLSegment(url, "..");
        expect(
          parent_url !== url,
          "failed to find package.json file from module %j in repository %j",
          name,
          home,
        );
        url = parent_url;
      }
      return {
        directory: url,
        package: createPackage(url),
      };
    },
  };
};
