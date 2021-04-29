import logger from './logger.mjs';
import { getDefaultConfiguration } from './configuration.mjs';
import Dispatcher from './dispatcher.mjs';

export const makeChannel = () => {
  const dispatcher = new Dispatcher(getDefaultConfiguration());
  return {
    requestSync: (json1) => {
      logger.debug('inline sync request: %j', json1);
      const json2 = dispatcher.dispatch(json1);
      logger.debug('inline sync response: %j', json2);
      return json2;
    },
    requestAsync: (json1, pending) => {
      logger.debug('inline async request: %j', json1);
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
        logger.debug('inline async success response: %j', json2);
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
      logger.debug('inline async success response (not transmitted): null');
      return null;
    },
  };
};
