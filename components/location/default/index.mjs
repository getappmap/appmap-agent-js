const { parse: parseJSON, stringify: stringifyJSON } = JSON;

export default (_dependencies) => {
  return {
    makeLocation: (url, line, column) => ({ url, line, column }),
    stringifyLocation: stringifyJSON,
    parseLocation: parseJSON,
    getLocationFileURL: ({ url }) => url,
    incrementLocationColumn: ({ url, line, column }) => ({
      url,
      line,
      column: column + 1,
    }),
  };
};
