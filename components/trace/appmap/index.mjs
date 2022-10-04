const { URL, Error, Set } = globalThis;

const { search: __search } = new URL(import.meta.url);

const { hasOwnProperty } = await import(`../../util/index.mjs${__search}`);
const { logDebug } = await import(`../../log/index.mjs${__search}`);
const { validateAppmap } = await import(
  `../../validate-appmap/index.mjs${__search}`
);
const { extendConfiguration } = await import(
  `../../configuration/index.mjs${__search}`
);
const { compileMetadata } = await import(`./metadata.mjs${__search}`);
const { createClassmap, addClassmapSource, compileClassmap } = await import(
  `./classmap/index.mjs${__search}`
);
const { digestEventTrace } = await import(`./event/index.mjs${__search}`);
const { orderEventArray } = await import(`./ordering/index.mjs${__search}`);

const VERSION = "1.8.0";

export const compileTrace = (configuration, messages) => {
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
    } else if (type === "group") {
      events.push(
        {
          type: "event",
          site: "begin",
          tab: 0,
          group: message.group,
          time: 0,
          payload: {
            type: "group",
            group: message.child,
            description: message.description,
          },
        },
        {
          type: "event",
          site: "end",
          tab: 0,
          group: message.group,
          time: 0,
          payload: {
            type: "ungroup",
            group: message.child,
          },
        },
      );
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
};
