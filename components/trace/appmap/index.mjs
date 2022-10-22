const {
  URL,
  Error,
  Set,
  Map,
  Array: { from: toArray },
  String,
  Math: { round },
  RangeError,
} = globalThis;

const { search: __search } = new URL(import.meta.url);

const { hasOwnProperty } = await import(`../../util/index.mjs${__search}`);
const { logDebug, logInfo } = await import(`../../log/index.mjs${__search}`);
const { expect } = await import(`../../expect/index.mjs${__search}`);
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

const summary_template = `\
Received %j raw events.

Event Distribution:
%f

Most frequently applied functions:
%f
`;

const stackoverflow_template = `\
We cannot process your appmap because it has too many (nested) events.\
There is three ways to solve this issue:

  * You could tweak the \`appmap.yml\` configuration file to record fewer events:
    \`\`\`yaml
    # disable asynchronous jump recording
    ordering: chronological
    # exclude anonymous functions
    anonymous-name-separator: '-'
    exclude:
      - name: '-'
    # exclude functions in dependencies
    packages:
      - glob: 'node_modules/**/*'
        enabled: false
    \`\`\`
  * You could reduce the scope of the recording.\
    For instance, by splitting test files or reducing the time span of remote recording.
  * You could increase the callstack size of this node process.\
    This can be done via the node \`--stack-size\` cli option.
    \`\`\`
    > node --stack-size=5000 node_modules/bin/appmap-agent-js -- npm run test
    \`\`\`
    NB: Unfortunately, \`--stack-size\` cannot be set via the \`NODE_OPTIONS\` environment variable.

${summary_template}`;

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
  const printEventDistribution = () => {
    const counters = new Map();
    for (const { payload } of events) {
      const { type } = payload;
      counters.set(type, (counters.has(type) ? counters.get(type) : 0) + 1);
    }
    const { length: total } = events;
    return toArray(counters.keys())
      .map(
        (key) =>
          `  - ${key}: ${String(counters.get(key))} [${String(
            round((100 * counters.get(key)) / total),
          )}%]`,
      )
      .join("\n");
  };
  const printApplyDistribution = () => {
    const counters = new Map();
    let total = 0;
    for (const { payload } of events) {
      if (payload.type === "apply") {
        total += 1;
        const { function: location } = payload;
        counters.set(
          location,
          (counters.has(location) ? counters.get(location) : 0) + 1,
        );
      }
    }
    return toArray(counters.keys())
      .sort((key1, key2) => counters.get(key1) - counters.get(key2))
      .slice(0, 20)
      .map(
        (key) =>
          `  - ${key}: ${String(counters.get(key))} [${String(
            round((100 * counters.get(key)) / total),
          )}%]`,
      )
      .join("\n");
  };
  let digested_events = null;
  /* c8 ignore start */
  try {
    digested_events = digestEventTrace(orderEventArray(events), classmap);
  } catch (error) {
    expect(
      !(error instanceof RangeError),
      stackoverflow_template,
      events.length,
      printEventDistribution,
      printApplyDistribution,
    );
    throw error;
  }
  /* c8 ignore stop */
  const appmap = {
    version: VERSION,
    metadata: compileMetadata(configuration, errors, status),
    classMap: compileClassmap(classmap, routes),
    events: digested_events,
  };
  validateAppmap(appmap);
  logInfo(
    summary_template,
    events.length,
    printEventDistribution,
    printApplyDistribution,
  );
  return {
    head: configuration,
    body: appmap,
  };
};
