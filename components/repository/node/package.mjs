const {
  URL,
  JSON: { parse: parseJSON },
} = globalThis;
const { search: __search } = new URL(import.meta.url);

import { readFileSync as readFile } from "node:fs";

const { mapMaybe } = await import(`../../util/index.mjs${__search}`);
const { logWarning } = await import(`../../log/index.mjs${__search}`);

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
