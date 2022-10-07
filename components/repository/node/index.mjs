const {
  URL,
  JSON: { parse: parseJSON },
} = globalThis;
const { search: __search } = new URL(import.meta.url);

import { createRequire } from "module";
import { readFileSync } from "fs";
import { pathToFileURL } from "url";
const { extractGitInformation } = await import(`./git.mjs${__search}`);
const { expectSuccess, expect } = await import(
  `../../expect/index.mjs${__search}`
);
const { appendURLSegment } = await import(`../../url/index.mjs${__search}`);
const { logWarning } = await import(`../../log/index.mjs${__search}`);

const hasPackageJSON = (url) => {
  try {
    readFileSync(new URL(appendURLSegment(url, "package.json")), "utf8");
    return true;
  } catch (error) {
    const { code } = { code: null, ...error };
    expect(
      code === "ENOENT",
      "failed to attempt reading package.json >> %O",
      error,
    );
    return false;
  }
};

const createPackage = (url) => {
  let content;
  try {
    content = readFileSync(
      new URL(appendURLSegment(url, "package.json")),
      "utf8",
    );
  } catch (error) {
    logWarning("Cannot read package.json file at %j >> %O", url, error);
    return null;
  }
  let json;
  try {
    json = parseJSON(content);
  } catch (error) {
    logWarning("Failed to parse package.json file at %j >> %O", url, error);
    return null;
  }
  const { name, version, homepage } = {
    name: null,
    version: null,
    homepage: null,
    ...json,
  };
  if (typeof name !== "string") {
    logWarning("Invalid name property in package.json file at %j", url);
    return null;
  }
  if (typeof version !== "string") {
    logWarning("Invalid version property in package.json file at %j", url);
    return null;
  }
  return {
    name,
    version,
    homepage: typeof homepage === "string" ? homepage : null,
  };
};

export const extractRepositoryHistory = extractGitInformation;

export const extractRepositoryPackage = createPackage;

export const extractRepositoryDependency = (home, segments) => {
  const { resolve } = createRequire(
    new URL(appendURLSegment(home, "dummy.js")),
  );
  let url = pathToFileURL(
    expectSuccess(
      () => resolve(segments.join("/")),
      "could not resolve %j from %j >> %O",
      segments,
      home,
    ),
  );
  url = appendURLSegment(url, "..");
  while (!hasPackageJSON(url)) {
    const parent_url = appendURLSegment(url, "..");
    expect(
      parent_url !== url,
      "failed to find package.json file from module %j in repository %j",
      segments,
      home,
    );
    url = parent_url;
  }
  return {
    directory: url,
    package: createPackage(url),
  };
};
