import { levelLog } from "../level.mjs";

export default (dependencies) => {
  const { "log-inner": logs } = dependencies;
  return levelLog(logs, "Warning");
};
