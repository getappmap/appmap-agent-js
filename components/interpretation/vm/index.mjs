import { runInThisContext } from "vm";

export default (dependencies) => {
  return {
    runScript: (content, url) => runInThisContext(content, { filename: url }),
  };
};
