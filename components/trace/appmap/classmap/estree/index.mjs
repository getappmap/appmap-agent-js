import Parse from "./parse.mjs";
import Visit from "./visit.mjs";

export default (dependencies) => {
  const { visit } = Visit(dependencies);
  const { parse, getLeadingComment } = Parse(dependencies);
  return {
    extractEstreeClassmap: (content, context) => {
      const { path } = context;
      return visit(parse(path, content), {
        ...context,
        getLeadingComment,
      });
    },
  };
};
