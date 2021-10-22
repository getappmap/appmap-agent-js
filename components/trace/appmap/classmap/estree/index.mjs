import Parse from "./parse.mjs";
import Visit from "./visit.mjs";

export default (dependencies) => {
  const { visit } = Visit(dependencies);
  const { parse, getLeadingCommentArray } = Parse(dependencies);
  return {
    extractEstreeEntityArray: (path, content, naming) => {
      return visit(parse(path, content), {
        naming,
        getLeadingCommentArray,
      });
    },
  };
};
