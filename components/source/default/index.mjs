const {
  URL,
  JSON: { parse: parseJSON },
} = globalThis;

const { search: __search } = new URL(import.meta.url);

import { decode as decodeVLQ } from "vlq";
const { InternalAppmapError, ExternalAppmapError } = await import(
  `../../error/index.mjs${__search}`
);
const { toAbsoluteUrl } = await import(`../../url/index.mjs${__search}`);
const { logInfo, logError } = await import(`../../log/index.mjs${__search}`);
const { identity } = await import(`../../util/index.mjs${__search}`);
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

export const createSourceMap = ({ url: base, content }) => {
  const payload = parseSourceMap(content, base);
  validateSourceMap(payload);
  const {
    sourceRoot: head,
    sources: urls,
    contents,
    mappings,
  } = {
    sourceRoot: null,
    contents: null,
    ...payload,
  };
  return {
    type: "normal",
    base,
    sources: urls
      .map(head === null ? identity : (body) => `${head}${body}`)
      .map((relative) => toAbsoluteUrl(relative, base))
      .map(
        contents === null
          ? (url) => ({ url, content: null })
          : (url, index) => ({
              url,
              content: index < contents.length ? contents[index] : null,
            }),
      ),
    groups: mappings.split(";"),
  };
};

export const mapSource = (mapping, line, column) => {
  if (mapping.type === "mirror") {
    return { url: mapping.source.url, line, column };
  } else if (mapping.type === "normal") {
    if (line <= mapping.groups.length) {
      let group = mapping.groups[line - 1];
      if (typeof group === "string") {
        group = group.split(",").map(decodeVLQ);
        mapping.groups[line - 1] = group;
      }
      const { length } = group;
      let source_index = 0;
      let gen_column = 0;
      let src_line = 0;
      let src_column = 0;
      if (length > 0) {
        let index = 0;
        do {
          const segment = group[index];
          gen_column += segment[0];
          if (segment.length >= 4) {
            source_index += segment[1];
            src_line += segment[2];
            src_column += segment[3];
          }
          index += 1;
        } while (index < length && gen_column < column);
      }
      if (gen_column === column) {
        if (source_index >= 0 && source_index < mapping.sources.length) {
          return {
            url: mapping.sources[source_index].url,
            line: src_line + 1,
            column: src_column,
          };
        } else {
          logInfo(
            "Source map out of range %j at file %j, line %j, and column %j",
            source_index,
            mapping.base,
            line,
            column,
          );
          return null;
        }
      } else {
        logInfo(
          "Missing source map segment at file %j, line %j, and column %j",
          mapping.base,
          line,
          column,
        );
        return null;
      }
    } else {
      logInfo(
        "Missing source map group at file %j and line %j",
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
