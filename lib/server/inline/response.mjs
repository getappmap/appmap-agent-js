import logger from '../../logger.mjs';

export const makeChannel = (dispatcher) => ({
  requestSync: (json1) => {
    logger.info();
    const json2 = dispatcher.dispatch(json1);
    logger.info();
  },
  requestAsync: (json1, pending) => {
    logger.info();
    if (pending === null) {
      const json2 = dispatcher.dispatch(json1);
      if (json1 !== null) {
        throw new Error(``);
      }
    } else {
      let json2;
      try {
        json2 = dispatcher.dispatch(json1);
      } catch (error) {
        pending.reject(error);
      }
      logger.info(json2);
      pending.resolve(json2);
    }
  },
});
