const { URL } = globalThis;

const { search: __search } = new URL(import.meta.url);

import BabelParser from "@babel/parser";
const { InternalAppmapError } = await import(
  `../../../error/index.mjs${__search}`
);
const { getUrlExtension } = await import(`../../../url/index.mjs${__search}`);
const { assert, coalesce } = await import(`../../../util/index.mjs${__search}`);
const { logWarning, logError } = await import(
  `../../../log/index.mjs${__search}`
);

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

export const parseEstree = (url, content) => {
  const extension = getUrlExtension(url);
  let source_type = "unambiguous";
  if (extension === ".cjs" || extension === ".node") {
    source_type = "script";
  } else if (extension === ".mjs") {
    source_type = "module";
  }
  let plugins = [];
  if (extension === ".ts" || extension === ".tsx") {
    plugins = ["typescript"];
  } else if (/^[ \t\n]*\/(\/[ \t]*|\*[ \t\n]*)@flow/u.test(content)) {
    plugins = ["flow"];
  }
  plugins.push("estree", "jsx");
  let result;
  try {
    result = parseBabel(content, {
      plugins,
      sourceFilename: url,
      sourceType: source_type,
      errorRecovery: true,
      attachComment: true,
    });
  } catch (error) {
    logError("Unrecoverable parsing error at file %j >> %O", url, error);
    return { type: "Program", body: [], sourceType: "script" };
  }
  const { errors, program: node } = result;
  for (const error of errors) {
    logWarning("Recoverable parsing error at file %j >> %O", url, error);
  }
  return node;
};
