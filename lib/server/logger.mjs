import * as Util from 'util';

// I'm not about the debuglog api because modifying process.env.NODE_DEBUG has no effect.
// Why not directly provide the optimize logging function then?
// https://github.com/nodejs/node/blob/master/lib/internal/util/debuglog.js

const logger = {
  error: Util.debuglog('appmap-error', (log) => {
    logger.error = log;
  }),
  warning: Util.debuglog('appmap-warning', (log) => {
    logger.warning = log;
  }),
  info: Util.debuglog('appmap-info', (log) => {
    logger.info = log;
  })
};

export default logger;
