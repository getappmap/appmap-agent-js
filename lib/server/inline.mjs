import { logger } from './logger.mjs';
import { getInitialConfiguration } from './configuration/index.mjs';
import { makeDispatching } from './dispatching.mjs';

export const makeChannel = (data, path) => {
  const { dispatch, dispatchAsync } = makeDispatching(
    getInitialConfiguration().extendWithData(data, path).unwrap(),
  );
  return {
    request: (data) => {
      logger.debug('inline request (synchronous): %j', data);
      return dispatch(data).unwrap();
    },
    requestAsync: async (data) => {
      logger.debug('inline request (asynchronous): %j', data);
      return (await dispatchAsync(data)).unwrap();
    },
  };
};
