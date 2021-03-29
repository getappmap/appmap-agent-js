/* global APPMAP_GLOBAL_SEND, APPMAP_GLOBAL_SERIALIZE */

{
  const global_Error = Error;

  let archived = false;

  const archive = (data) => {
    if (!archived) {
      archived = true;
      APPMAP_GLOBAL_SEND("archive", data);
    }
  };

  process.on("exit", (code, origin) => {
    archive({
      type: "exit",
      code,
      origin,
    });
  });

  /* istanbul ignore next */
  process.on("uncaughtException", (error, origin) => {
    archive({
      type: "exception",
      error: APPMAP_GLOBAL_SERIALIZE(error),
      origin,
    });
    throw error;
  });

  process.on("SIGINT", () => {
    archive({
      type: "SIGINT",
    });
  });

  process.on("SIGTERM", () => {
    archive({
      type: "SIGTERM",
    });
  });
}
