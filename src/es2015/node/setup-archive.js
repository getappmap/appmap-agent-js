/* global APPMAP_GLOBAL_SEND, APPMAP_GLOBAL_SERIALIZE */

{
  const global_Error = Error;

  let archived = false;

  const archive = (data) => {
    if (!archived) {
      archived = true;
      APPMAP_GLOBAL_SEND({
        type: 'archive',
        data,
      });
    }
  };

  process.on('exit', (code, origin) => {
    archive({
      type: 'exit',
      code,
      origin,
    });
  });

  process.on('uncaughtException', (error, origin) => {
    archive({
      type: 'exception',
      error: APPMAP_GLOBAL_SERIALIZE(error),
      origin,
    });
  });

  process.on('SIGINT', () => {
    archive({
      type: 'SIGINT',
    });
  });

  process.on('SIGTERM', () => {
    archive({
      type: 'SIGTERM',
    });
  });
}
