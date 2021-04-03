import { debuglog } from 'util';

// I'm not about the debuglog api because modifying process.env.NODE_DEBUG has no effect.
// Why not directly provide the optimize logging function then?
// https://github.com/nodejs/node/blob/master/lib/internal/util/debuglog.js

const logger = {
  error: debuglog('appmap-error', (log) => {
    logger.error = log;
  }),
  warning: debuglog('appmap-warning', (log) => {
    logger.warning = log;
  }),
  info: debuglog('appmap-info', (log) => {
    logger.info = log;
  })
};

export default logger;
