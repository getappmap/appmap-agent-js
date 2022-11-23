const {
  URL,
  JSON: { parse: parseJSON },
} = globalThis;

import { readFileSync as readFile } from "node:fs";

import { mapMaybe } from "../../util/index.mjs";
import { logWarning } from "../../log/index.mjs";

//////////////////////////////
// extractRepositoryPackage //
//////////////////////////////

const readPackage = (url) => {
  try {
    return {
      url,
      content: readFile(new URL("package.json", url), "utf8"),
    };
  } catch (error) {
    logWarning("Cannot read package.json file at %j >> %O", url, error);
    return null;
  }
};

const parsePackage = ({ url, content }) => {
  try {
    return {
      url,
      data: parseJSON(content),
    };
  } catch (error) {
    logWarning("Cannot parse package.json file at %j >> %O", url, error);
    return null;
  }
};

const summarizePackage = ({ url, data }) => {
  const { name, version, homepage } = {
    name: null,
    version: null,
    homepage: null,
    ...data,
  };
  if (typeof name !== "string") {
    logWarning(
      "Invalid type for name property in package.json file at %j, got: %j",
      url,
      name,
    );
    return null;
  } else if (typeof version !== "string") {
    logWarning(
      "Invalid type for version property in package.json file at %j, got %j",
      url,
      version,
    );
    return null;
  } else {
    return {
      name,
      version,
      homepage: typeof homepage === "string" ? homepage : null,
    };
  }
};

export const extractRepositoryPackage = (url) =>
  mapMaybe(mapMaybe(readPackage(url), parsePackage), summarizePackage);
