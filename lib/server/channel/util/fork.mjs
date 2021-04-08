
import logger from "../logger.mjs";

const onChildError = (error) => {
  logger.error("Child error: %s", error.stack);
};

export const registerChild = (child, dispatcher) => {
  child.on("error", onChildError);
  child.on("message", (json) => {
    logger.info("fork request %j", json);
    if (Reflect.getOwnPropertyDescriptor(json, "index") === undefined) {
      logger.error("Missing index field on %j", json);
    } else if (Reflect.getOwnPropertyDescriptor(json, "query") === undefined) {
      logger.error("Missing query field on %j", json);
    } else {
      let success = null;
      let failure = null;
      try {
        success = dispatcher.dispatch(json.query);
      } catch (error) {
        logger.error(`Error while handling %j\n%s`, json, error.stack);
        failure = error.message
      }
      if (json.index === null) {
        if (success !== null) {
          logger.error("Expected dispatcher to return null, got: %j", success);
        }
      } else {
        logger.info("fork response: {index:%j, success:%j, failure: %j}", json.index, success, failure);
        child.send({
          index: json.index,
          success,
          failure
        });
      }
    }
  });
};
