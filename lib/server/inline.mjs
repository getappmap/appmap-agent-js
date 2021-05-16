import { logger } from './logger.mjs';
import { getInitialConfiguration } from './configuration/index.mjs';
import { Dispatching } from './dispatching.mjs';

const unwrap = (either) => either.unwrap();

export const makeChannel = (data, path) => {
  const dispatching = new Dispatching(
    getInitialConfiguration().extendWithData(data, path).unwrap(),
  );
  return {
    request: (data) => {
      logger.debug('inline request (synchronous): %j', data);
      return dispatching.dispatch(data).unwrap();
    },
    requestAsync: (data) => {
      logger.debug('inline request (asynchronous): %j', data);
      return dispatching.dispatchAsync(data).then(unwrap);
    },
  };
};
