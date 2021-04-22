import logger from './logger.mjs';
import { getDefaultConfig } from './config.mjs';
import Dispatcher from './dispatcher.mjs';

export const makeChannel = () => {
  const dispatcher = new Dispatcher(getDefaultConfig());
  return {
    requestSync: (json1) => {
      logger.info('inline sync request: %j', json1);
      const json2 = dispatcher.dispatch(json1);
      logger.info('inline sync response: %j', json2);
      return json2;
    },
    requestAsync: (json1, pending) => {
      logger.info('inline async request: %j', json1);
      let json2;
      try {
        json2 = dispatcher.dispatch(json1);
      } catch (error) {
        logger.error('inline async failure response: %s', error.stack);
        if (pending !== null) {
          pending.reject(error);
        }
        return null;
      }
      if (pending !== null) {
        logger.info('inline async success response: %j', json2);
        pending.resolve(json2);
        return null;
      }
      if (json2 !== null) {
        logger.error(
          'inline async request expected a null result and got: %j',
          json2,
        );
        return null;
      }
      logger.info('inline async success response (not transmitted): null');
      return null;
    },
  };
};
