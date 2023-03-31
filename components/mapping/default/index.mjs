import { decode as decodeVlq } from "vlq";
import {
  InternalAppmapError,
  ExternalAppmapError,
} from "../../error/index.mjs";
import { toDirectoryUrl, toAbsoluteUrl } from "../../url/index.mjs";
import { logDebug, logWarning, logError } from "../../log/index.mjs";
import { digest } from "../../hash/index.mjs";
import { validateSourceMap } from "../../validate/index.mjs";

const {
  undefined,
  JSON: { parse: parseJSON },
} = globalThis;

const hashSource = ({ url, content }) => ({
  url,
  content,
  hash: content === null ? null : digest(content),
});

const unhashSource = ({ url, content }) => ({ url, content });

export const extractMappingUrl = ({ url, content }) => {
  const parts = /\/\/[#@] sourceMappingURL=(.*)[\s]*$/u.exec(content);
  if (parts === null) {
    return null;
  } else {
    return toAbsoluteUrl(parts[1], url);
  }
};

export const createMirrorMapping = (source) => ({
  type: "mirror",
  source: hashSource(source),
});

const parseSourceMap = ({ url, content }) => {
  if (typeof content === "string") {
    try {
      return parseJSON(content);
    } catch (error) {
      logError("Invalid JSON from source map at %j >> %O", url, error);
      throw new ExternalAppmapError("Source map is not valid JSON");
    }
  } else {
    return content;
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

export const createMapping = (file) => {
  const payload = parseSourceMap(file);
  const { url: base } = file;
  validateSourceMap(payload);
  const {
    sourceRoot: root,
    sources: relatives,
    sourcesContent: contents,
    mappings,
  } = {
    sourceRoot: null,
    sourcesContent: null,
    ...payload,
  };
  const root_base =
    // Ideally, payload is json and `sourceRoot` should never
    // be `undefined`. But I had the case where the already
    // parsed content had `undefined` for `sourceRoot`.
    // This happened when `jest` compiled `jsx` with `babel`.
    root === null || root === undefined || root === ""
      ? base
      : toDirectoryUrl(toAbsoluteUrl(root, base));
  return {
    type: "normal",
    base,
    sources: relatives.map((relative, index) =>
      hashSource({
        url: toAbsoluteUrl(relative, root_base),
        content:
          contents === null ||
          contents === undefined ||
          index >= contents.length
            ? null
            : contents[index],
      }),
    ),
    lines: parseGroupArray(mappings),
  };
};

export const mapSource = (mapping, line, column) => {
  if (mapping.type === "mirror") {
    return {
      url: mapping.source.url,
      hash: mapping.source.hash,
      line,
      column,
    };
  } else if (mapping.type === "normal") {
    if (line <= mapping.lines.length) {
      for (const fields of mapping.lines[line - 1]) {
        if (fields[0] === column && fields.length >= 4) {
          const [, source_index, mapped_line, mapped_column] = fields;
          if (source_index < mapping.sources.length) {
            const { url, hash } = mapping.sources[source_index];
            return {
              url,
              hash,
              line: mapped_line + 1,
              column: mapped_column,
            };
          } else {
            logWarning(
              "Source map out of range at file %j, line %j, and column %j",
              mapping.base,
              line,
              column,
            );
            return null;
          }
        }
      }
      // This is fine: functions in generated files may not have an associated
      // function in the sources -- eg: module wrapper && fake async functions.
      logDebug(
        "Missing source map segment for file %j at line %j and column %j",
        mapping.base,
        line,
        column,
      );
      return null;
    } else {
      // This is fine: functions in generated files may not have an associated
      // function in the sources -- eg: module wrapper && fake async functions.
      logDebug(
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

export const getMappingSourceArray = (mapping) => {
  if (mapping.type === "mirror") {
    return [unhashSource(mapping.source)];
  } else if (mapping.type === "normal") {
    return mapping.sources.map(unhashSource);
  } /* c8 ignore start */ else {
    throw new InternalAppmapError("invalid mapping type");
  } /* c8 ignore stop */
};

export const updateMappingSource = (mapping, new_source) => {
  if (mapping.type === "mirror") {
    if (mapping.source.url === new_source.url) {
      mapping.source = hashSource(new_source);
    }
  } else if (mapping.type === "normal") {
    const { sources } = mapping;
    const { length } = sources;
    for (let index = 0; index < length; index += 1) {
      const source = sources[index];
      if (source.url === new_source.url) {
        sources[index] = hashSource(new_source);
      }
    }
  } /* c8 ignore start */ else {
    throw new InternalAppmapError("invalid mapping type");
  } /* c8 ignore stop */
};
