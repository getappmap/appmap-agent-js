/* global APPMAP_GLOBAL_APPMAP_OBJECT */

const APPMAP_GLOBAL_SEND = (type, data) => {
  if (type === 'engine') {
    APPMAP_GLOBAL_APPMAP_OBJECT.setEngine(data.name, data.version);
    return true;
  }
  if (type === 'event') {
    APPMAP_GLOBAL_APPMAP_OBJECT.addEvent(data);
    return true;
  }
  if (type === 'archive') {
    APPMAP_GLOBAL_APPMAP_OBJECT.archive(data);
    return true;
  }
  return false;
};
