
const APPMAP_GLOBAL_SEND = ((() => {
  return (message) => {
    if (message.type === "engine") {
      APPMAP.setEngine(message.name, message.version);
    }
    if (message.type === "event") {
      APPMAP.registerEvent(message.data);
    }
    if (json.type === "exit") {
      APPMAP.archive();
    }
  };
}) ());
