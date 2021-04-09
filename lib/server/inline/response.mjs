import logger from '../logger.mjs';

export const makeChannel = (dispatcher) => ({
  requestSync: (json1) => {
    logger.info('inline sync request: %j', json1);
    const json2 = dispatcher.dispatch(json1);
    logger.info('inline sync response success: %j', json2);
    return json2;
  },
  requestAsync: (json1, pending) => {
    logger.info('inline async request: %j', json1);
    let json2;
    try {
      json2 = dispatcher.dispatch(json1);
    } catch (error) {
      logger.info('inline async request failure: %s', error.stack);
      if (pending !== null) {
        pending.reject(error);
      }
    }
    if (json2 !== undefined) {
      logger.info('inline sync response success: %j', json2);
      if (pending !== null) {
        pending.resolve(json2);
      }
    }
  },
});
