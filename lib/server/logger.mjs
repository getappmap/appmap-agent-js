
import {debuglog} from "util";

const logger = {error:null, warning:null, info:null};

export const reload = () => {
  logger.error = debuglog("appmap-error", (log) => { logger.error = log });
  logger.warning = debuglog("appmap-warning", (log) => { logger.warning = log });
  logger.info = debuglog("appmap-info", (log) => { logger.info = log });
};

export default logger;
