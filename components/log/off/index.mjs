import { levelLog } from "../level.mjs";

export default (dependencies) => {
  const { "log-inner": log } = dependencies;
  return levelLog(log, "logOff");
};
