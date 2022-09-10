import { runInThisContext } from "vm";

export default (_dependencies) => {
  return {
    runScript: (content, url) => runInThisContext(content, { filename: url }),
  };
};
