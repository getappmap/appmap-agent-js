import { runInThisContext } from "vm";

export default (_dependencies) => ({
  runScript: (content, url) => runInThisContext(content, { filename: url }),
});
