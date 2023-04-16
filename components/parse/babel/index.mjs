import BabelParser from "@babel/parser";
import { InternalAppmapError } from "../../error/index.mjs";
import { getLastUrlExtension, getUrlExtensionArray } from "../../url/index.mjs";
import { assert, coalesce } from "../../util/index.mjs";
import { logWarning, logError } from "../../log/index.mjs";

const { parse: parseBabel } = BabelParser;

// const getPredecessorComment = (code, index, comments) => {
//   index -= 1;
//   while (index > 0) {
//     if (comments.has(index)) {
//       return comments.get(index);
//     }
//     if (!/^\p{Zs}$/u.test(code[index])) {
//       break;
//     }
//     index -= 1;
//   }
//   return null;
// };

export const printComment = ({ type, value }) => {
  if (type === "CommentBlock") {
    return `/*${value}*/`;
  } else if (type === "CommentLine") {
    return `//${value}`;
  } /* c8 ignore start */ else {
    throw new InternalAppmapError("invalid comment type");
  } /* c8 ignore stop */
};

export const getLeadingCommentArray = (node) =>
  coalesce(node, "leadingComments", []);

const trimStartString = (string) => string.trimStart();

const extractLineLabel = (line) => {
  assert(line.startsWith("@label "), "invalid label line", InternalAppmapError);
  const maybe_tokens = line.substring("@label".length).match(/\s+\S+/gu);
  return maybe_tokens === null ? [] : maybe_tokens.map(trimStartString);
};

export const extractCommentLabelArray = ({ value: text }) => {
  const maybe_lines = text.match(/@label .*/gu);
  return maybe_lines === null ? [] : maybe_lines.flatMap(extractLineLabel);
};

const resolveSource = (source, { url }) => {
  if (source === null) {
    const extension = getLastUrlExtension(url);
    if (extension === ".cjs" || extension === ".cts" || extension === ".node") {
      return "script";
    } else if (extension === ".mjs" || extension === ".mts") {
      return "module";
    } else {
      return "unambiguous";
    }
  } else {
    return source;
  }
};

const resolvePluginArray = (plugins, { url, content }) => {
  if (plugins === null) {
    const extensions = getUrlExtensionArray(url);
    const plugins = [];
    if (extensions.includes(".jsx")) {
      plugins.push(["jsx", {}]);
    }
    if (
      extensions.includes(".ts") ||
      extensions.includes(".mts") ||
      extensions.includes(".cts")
    ) {
      plugins.push(["typescript", {}]);
    }
    if (
      extensions.includes(".tsx") ||
      extensions.includes(".mtsx") ||
      extensions.includes(".ctsx")
    ) {
      plugins.push(["jsx", {}], ["typescript", {}]);
    }
    if (
      extensions.includes(".flow") ||
      /^[ \t\n]*\/(\/[ \t]*|\*[ \t\n]*)@flow/u.test(content)
    ) {
      plugins.push(["flow", {}]);
    }
    return plugins;
  } else {
    return plugins;
  }
};

const parseSafe = ({ url, content }, options) => {
  try {
    return parseBabel(content, options);
  } catch (error) {
    logError("Unrecoverable parsing error at file %j >> %O", url, error);
    const { sourceType: source_type } = options;
    return {
      errors: [],
      program: {
        type: "Program",
        body: [],
        sourceType: source_type === "unambiguous" ? "script" : source_type,
        loc: {
          start: { line: 0, column: 0 },
          end: { line: 0, column: 0 },
          filename: url,
        },
      },
    };
  }
};

export const parseEstree = (file, { source, plugins }) => {
  const { url } = file;
  const { errors, program: node } = parseSafe(file, {
    sourceFilename: url,
    sourceType: resolveSource(source, file),
    plugins: [
      ["estree", { classFeatures: true }],
      ...resolvePluginArray(plugins, file),
    ],
    errorRecovery: true,
    attachComment: true,
  });
  for (const error of errors) {
    logWarning("Recoverable parsing error at file %j >> %O", url, error);
  }
  return node;
};
