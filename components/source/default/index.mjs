const {
  URL,
  JSON: { parse: parseJSON },
} = globalThis;

const { search: __search } = new URL(import.meta.url);

import { decode as decodeVlq } from "vlq";
const { InternalAppmapError, ExternalAppmapError } = await import(
  `../../error/index.mjs${__search}`
);
const { toDirectoryUrl, toAbsoluteUrl } = await import(
  `../../url/index.mjs${__search}`
);
const { logInfo, logError } = await import(`../../log/index.mjs${__search}`);
const { makeLocation } = await import(`../../location/index.mjs${__search}`);
const { validateSourceMap } = await import(
  `../../validate/index.mjs${__search}`
);

export const extractSourceMapUrl = ({ url: base, content }) => {
  const parts = /\/\/[#@] sourceMappingURL=(.*)[\r\n]*$/u.exec(content);
  if (parts === null) {
    return null;
  } else {
    return toAbsoluteUrl(parts[1], base);
  }
};

export const createMirrorSourceMap = (file) => ({
  type: "mirror",
  source: file,
});

const parseSourceMap = (content, url) => {
  try {
    return parseJSON(content);
  } catch (error) {
    logError("Invalid JSON from source map at %j >> %O", url, error);
    throw new ExternalAppmapError("Source map is not valid JSON");
  }
};

const parseGroupArray = (groups) => {
  let source_index = 0;
  let source_line = 0;
  let source_column = 0;
  return groups.split(";").map((group) => {
    if (group === "") {
      return [];
    } else {
      let generated_column = 0;
      return group.split(",").map((segment) => {
        const fields = decodeVlq(segment);
        /* c8 ignore start */ if (fields.length === 1) {
          return [(generated_column += fields[0])];
        } /* c8 ignore stop */ else {
          return [
            (generated_column += fields[0]),
            (source_index += fields[1]),
            (source_line += fields[2]),
            (source_column += fields[3]),
          ];
        }
      });
    }
  });
};

export const createSourceMap = ({ url: base, content }) => {
  const payload = parseSourceMap(content, base);
  validateSourceMap(payload);
  const {
    sourceRoot: root,
    sources: relatives,
    contents,
    mappings,
  } = {
    sourceRoot: null,
    contents: null,
    ...payload,
  };
  const root_base =
    root === null || root === ""
      ? base
      : toDirectoryUrl(toAbsoluteUrl(root, base));
  return {
    type: "normal",
    base,
    sources: relatives
      .map((relative) => toAbsoluteUrl(relative, root_base))
      .map(
        contents === null
          ? (url) => ({ url, content: null })
          : (url, index) => ({
              url,
              content: index < contents.length ? contents[index] : null,
            }),
      ),
    lines: parseGroupArray(mappings),
  };
};

export const mapSource = (mapping, line, column) => {
  if (mapping.type === "mirror") {
    return makeLocation(mapping.source.url, { line, column });
  } else if (mapping.type === "normal") {
    if (line <= mapping.lines.length) {
      for (const fields of mapping.lines[line - 1]) {
        if (fields[0] === column && fields.length >= 4) {
          if (fields[1] < mapping.sources.length) {
            return makeLocation(mapping.sources[fields[1]].url, {
              line: fields[2] + 1,
              column: fields[3],
            });
          } else {
            logInfo(
              "Source map out of range at file %j, line %j, and column %j",
              mapping.base,
              line,
              column,
            );
            return null;
          }
        }
      }
      logInfo(
        "Missing source map segment for file %j at line %j and column %j",
        mapping.base,
        line,
        column,
      );
      return null;
    } else {
      logInfo(
        "Missing source map group for file %j and line %j",
        mapping.base,
        line,
      );
      return null;
    }
  } /* c8 ignore start */ else {
    throw new InternalAppmapError("invalid mapping type");
  } /* c8 ignore stop */
};

export const getSources = (mapping) => {
  if (mapping.type === "mirror") {
    return [mapping.source];
  } else if (mapping.type === "normal") {
    return mapping.sources;
  } /* c8 ignore start */ else {
    throw new InternalAppmapError("invalid mapping type");
  } /* c8 ignore stop */
};
