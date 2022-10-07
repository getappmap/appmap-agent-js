const { URL } = globalThis;
const { search: __search } = new URL(import.meta.url);

const { extractSourceMapURL, createMirrorSourceMap, createSourceMap } =
  await import(`../../source/index.mjs${__search}`);
const { readFile } = await import(`../../file/index.mjs${__search}`);
const { logDebug } = await import(`../../log/index.mjs${__search}`);

export const loadSourceMap = (file) => {
  const maybe_url = extractSourceMapURL(file);
  if (maybe_url === null) {
    return createMirrorSourceMap(file);
  } else {
    let content;
    try {
      content = readFile(maybe_url);
    } catch (error) {
      logDebug(
        "Cannot read source-map file at %j extracted from %j >> %O",
        maybe_url,
        file.url,
        error,
      );
      return createMirrorSourceMap(file);
    }
    return createSourceMap({
      url: maybe_url.startsWith("data:") ? file.url : maybe_url,
      content,
    });
  }
};
