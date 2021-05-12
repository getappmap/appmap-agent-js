import logger from './logger.mjs';
import { getInitialConfiguration } from './configuration/index.mjs';
import Dispatcher from './dispatcher.mjs';

const convertLeft = (message) => {
  logger.debug('inline request failure: %j', message);
  throw new Error(message);
};

const convertRight = (data) => {
  logger.debug('inline request success: %j', data);
  return data;
};

const convertEither = (either) => either.either(convertLeft, convertRight);

export const makeChannel = (data, path) => {
  const {dispatch, dispatchAsync} = new Dispatcher(convertEither(getInitialConfiguration().extendWithData(data, path)));
  return {
    request: (data) => {
      logger.debug('inline request (synchronous): %j', data);
      return dispatch(data).either(convertLeft, convertRight);
    },
    requestAsync: (data) => {
      logger.debug('inline request (asynchronous): %j', data);
      return dispatchAsync(data).then(convertEither);
    }
  };
};
