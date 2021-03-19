/* global APPMAP */

const APPMAP_GLOBAL_SEND = (message) => {
  if (message.type === "engine") {
    APPMAP.setEngine(message.name, message.version);
  }
  if (message.type === "event") {
    APPMAP.registerEvent(message.data);
  }
  if (message.type === "exit") {
    APPMAP.archive();
  }
};
