import { decode as decodeVlq } from "vlq";
import { toAbsoluteUrl, toDirectoryUrl } from "../../url/index.mjs";
import { validateSourceMap } from "../../validate/index.mjs";
import { logWarning } from "../../log/index.mjs";

const {
  JSON: { parse: parseJSON },
} = globalThis;

export const extractSourcemapUrl = ({ url, content }) => {
  const parts = /\/\/[#@] sourceMappingURL=(.*)[\s]*$/u.exec(content);
  if (parts === null) {
    return null;
  } else {
    return toAbsoluteUrl(parts[1], url);
  }
};

const parseSourcemapJson = ({ url, content }) => {
  try {
    return parseJSON(content);
  } catch (error) {
    logWarning("Could not parse source map at %j >> %O", url, error);
    return null;
  }
};

const isSourcemapValid = ({ url, data }) => {
  try {
    validateSourceMap(data);
    return true;
  } catch (error) {
    logWarning("Invalid source map at %j >> %O", url, error);
    return false;
  }
};

export const parseSourcemap = (file, base) => {
  const { url } = file;
  const data = parseSourcemapJson(file);
  if (data === null || !isSourcemapValid({ url, data })) {
    return null;
  } else {
    const {
      sourceRoot: root,
      sources: relatives,
      sourcesContent: contents,
      mappings: payload,
    } = {
      sourceRoot: null,
      sourcesContent: null,
      ...data,
    };
    if (!url.startsWith("data:")) {
      base = url;
    }
    if (root !== null && root !== "") {
      base = toDirectoryUrl(toAbsoluteUrl(root, url));
    }
    return {
      sources: relatives.map((relative, index) => ({
        url: toAbsoluteUrl(relative, base),
        content:
          contents === null || index >= contents.length
            ? null
            : contents[index],
      })),
      payload,
    };
  }
};

export const compileSourcemap = (payload) => {
  let source_index = 0;
  let source_line = 0;
  let source_column = 0;
  return payload.split(";").map((group) => {
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

export const mapPosition = (mapping, { line, column }) => {
  if (line > 0 && line <= mapping.length) {
    for (const fields of mapping[line - 1]) {
      if (fields[0] === column && fields.length >= 4) {
        const [, source_index, mapped_line, mapped_column] = fields;
        return {
          index: source_index,
          position: {
            line: mapped_line + 1,
            column: mapped_column,
          },
        };
      }
    }
    return null;
  } else {
    return null;
  }
};
