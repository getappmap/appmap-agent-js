import Metadata from "./metadata.mjs";
import Classmap from "./classmap/index.mjs";
import Event from "./event/index.mjs";
import Ordering from "./ordering/index.mjs";

const { Error, Set } = globalThis;

const VERSION = "1.8.0";

export default (dependencies) => {
  const {
    util: { hasOwnProperty },
    log: { logDebug },
    "validate-appmap": { validateAppmap },
    configuration: { extendConfiguration },
  } = dependencies;
  const { compileMetadata } = Metadata(dependencies);
  const { createClassmap, addClassmapSource, compileClassmap } =
    Classmap(dependencies);
  const { orderEventArray } = Ordering(dependencies);
  const { digestEventTrace } = Event(dependencies);
  return {
    compileTrace: (configuration, messages) => {
      logDebug(
        "Trace:\n  configuration = %j\n  messages = %j",
        configuration,
        messages,
      );
      const sources = [];
      const errors = [];
      const events = [];
      let status = 0;
      for (const message of messages) {
        const { type } = message;
        if (type === "start") {
          configuration = extendConfiguration(
            configuration,
            message.configuration,
            message.url,
          );
        } else if (type === "stop") {
          status = message.status;
        } else if (type === "error") {
          errors.push(message);
        } else if (type === "event") {
          events.push(message);
        } else if (type === "source") {
          sources.push(message);
        } else if (type === "amend") {
          for (let index = events.length - 1; index >= 0; index -= 1) {
            const event = events[index];
            if (event.tab === message.tab && event.site === message.site) {
              events[index] = { ...event, payload: message.payload };
              break;
            }
          }
        } /* c8 ignore start */ else {
          throw new Error("invalid message type");
        } /* c8 ignore stop */
      }
      const classmap = createClassmap(configuration);
      for (const source of sources) {
        addClassmapSource(classmap, source);
      }
      const routes = new Set();
      for (const event of events) {
        if (hasOwnProperty(event.payload, "function")) {
          routes.add(event.payload.function);
        }
      }
      const appmap = {
        version: VERSION,
        metadata: compileMetadata(configuration, errors, status),
        classMap: compileClassmap(classmap, routes),
        events: digestEventTrace(orderEventArray(events), classmap),
      };
      validateAppmap(appmap);
      return {
        head: configuration,
        body: appmap,
      };
    },
  };
};
