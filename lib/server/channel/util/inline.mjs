
import logger from "../../logger.mjs";

export const makeChannel = (dispatcher) => ({
  requestSync: (data) => {
    logger.info();
    const result = dispatch()
  };
  requestAsync: (data, pending) => {
    if (pending === null) {
      if (dispatch(data) !== null) {

      }
    }
  }
});
