const { Error, URL } = globalThis;

const { search: __search } = new URL(import.meta.url);

import BabelParser from "@babel/parser";
const { toAbsoluteUrl, getUrlExtension } = await import(
  `../../../url/index.mjs${__search}`
);
const { coalesce } = await import(`../../../util/index.mjs${__search}`);
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

const printComment = ({ type, value }) => {
  if (type === "CommentBlock") {
    return `/*${value}*/`;
  } else if (type === "CommentLine") {
    return `//${value}`;
  } /* c8 ignore start */ else {
    throw new Error("invalid comment type");
  } /* c8 ignore stop */
};

export const getLeadingCommentArray = (node) =>
  coalesce(node, "leadingComments", []).map(printComment);

export const parse = (relative, content) => {
  const extension = getUrlExtension(toAbsoluteUrl(relative, "protocol://host"));
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
      sourceType: source_type,
      errorRecovery: true,
      attachComment: true,
    });
  } catch (error) {
    logError("Unrecoverable parsing error at file %j >> %O", relative, error);
    return { type: "Program", body: [], sourceType: "script" };
  }
  const { errors, program: node } = result;
  for (const error of errors) {
    logWarning("Recoverable parsing error at file %j >> %O", relative, error);
  }
  return node;
};
