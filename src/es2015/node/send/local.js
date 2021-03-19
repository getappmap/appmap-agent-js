/* global APPMAP_GLOBAL_APPMAP_OBJECT */

const APPMAP_GLOBAL_SEND = (message) => {
  if (message.type === 'engine') {
    APPMAP_GLOBAL_APPMAP_OBJECT.setEngine(message.name, message.version);
  }
  if (message.type === 'event') {
    APPMAP_GLOBAL_APPMAP_OBJECT.addEvent(message.data);
  }
  if (message.type === 'archive') {
    APPMAP_GLOBAL_APPMAP_OBJECT.archive(message.data);
  }
};
