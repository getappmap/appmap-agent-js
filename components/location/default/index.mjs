const _String = String;
const { parseInt } = Number;

export default (dependencies) => {
  const {
    util: { assert },
    log: { logGuardWarning },
  } = dependencies;
  return {
    makeLocation: (url, line, column) => ({ url, line, column }),
    stringifyLocation: ({ url, line, column }) => {
      logGuardWarning(
        url.includes("#"),
        "Location file url should not already contain a hash segment, got: %j",
        url,
      );
      return `${url}#${_String(line)}-${_String(column)}`;
    },
    parseLocation: (location) => {
      const parts = /^([^#]+)#([0-9]+)-([0-9]+)$/u.exec(location);
      assert(parts !== null, "invalid location url format");
      const [, url, line_string, column_string] = parts;
      return {
        url,
        line: parseInt(line_string),
        column: parseInt(column_string),
      };
    },
    getLocationFileURL: ({ url }) => url,
    incrementLocationColumn: ({ url, line, column }) => ({
      url,
      line,
      column: column + 1,
    }),
  };
};
