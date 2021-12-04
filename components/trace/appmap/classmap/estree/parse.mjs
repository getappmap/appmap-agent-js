import BabelParser from "@babel/parser";

const { parse: parseBabel } = BabelParser;

export default (dependencies) => {
  const {
    util: { assert, coalesce },
    expect: { expectSuccess },
    log: { logWarning },
  } = dependencies;

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
    }
    if (type === "CommentLine") {
      return `//${value}`;
    }
    /* c8 ignore start */
    assert(false, "invalid comment type");
    /* c8 ignore stop */
  };

  return {
    getLeadingCommentArray: (node) =>
      coalesce(node, "leadingComments", []).map(printComment),
    parse: (path, content) => {
      let source_type = "unambiguous";
      if (path.endsWith(".cjs") || path.endsWith(".node")) {
        source_type = "script";
      } else if (path.endsWith(".mjs")) {
        source_type = "module";
      }
      let plugins = [];
      if (path.endsWith(".ts") || path.endsWith(".tsx")) {
        plugins = ["typescript"];
      } else if (/^[ \t\n]*\/(\/[ \t]*|\*[ \t\n]*)@flow/.test(content)) {
        plugins = ["flow"];
      }
      plugins.push("estree", "jsx");
      const { errors, program: node } = expectSuccess(
        () =>
          parseBabel(content, {
            plugins,
            sourceType: source_type,
            errorRecovery: true,
            attachComment: true,
          }),
        "Unrecoverable parsing error at file %j >> %e",
        path,
      );
      for (const error of errors) {
        logWarning("Recoverable parsing error at file %j >> %e", path, error);
      }
      return node;
    },
  };
};
