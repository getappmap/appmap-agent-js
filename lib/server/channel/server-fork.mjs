
export default (child, handle) => {
  child.on("message", (json) => {
    if (Reflect.getOwnPropertyDescriptor(json.head) === undefined) {
      logger.error("Missing id field");
    } else if (Reflect.getOwnPropertyDescriptor(json.body) === undefined) {
      logger.error("Missing input field");
    } else if (json.head === null) {
      let error = null;
      let body = null;
      try {
        body = handle(json.body);
      } catch (error) {
        logger.error(``);
        error = error.message
      }
      if (json.head === null) {
        if (error !== null && body !== null) {
          logger.error("Expected handler to return null, got: %j", body);
        }
      } else {
        child.send({
          head: json.head,
          error,
          body
        });
      }
    }
  });
};
