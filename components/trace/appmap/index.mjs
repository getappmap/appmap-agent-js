import {
  InternalAppmapError,
  ExternalAppmapError,
} from "../../error/index.mjs";
import {
  logError,
  logDebug,
  logDebugWhen,
  logInfo,
  logInfoWhen,
} from "../../log/index.mjs";
import { validateAppmap } from "../../validate-appmap/index.mjs";
import { parseLocation } from "../../location/index.mjs";
import {
  createCodebase,
  exportClassmap,
  lookupClosureLocation,
} from "./codebase/index.mjs";
import { compileMetadata } from "./metadata.mjs";
import { digestEventTrace } from "./event/index.mjs";
import { orderEventArray } from "./ordering/index.mjs";
import { getOutputUrl } from "./output.mjs";

const {
  Map,
  Array: { from: toArray },
  String,
  Math: { round },
  RangeError,
} = globalThis;

const VERSION = "1.8.0";

const TOTAL_EVENT_THRESHOLD = 1e6;

const GROUP_EVENT_THRESHOLD = 5e5;

const APPLY_EVENT_THRESHOLD = 1e5;

const STACKOVERFLOW_MESSAGE = `\
We could not process your appmap because it has too many events (that are deeply nested). \
The preferred method to solve this issue is to reduce the size of the appmap. \
Alternatively, you could try to increase the callstack size of this node process:
\`\`\`
> node --stack-size=5000 node_modules/bin/appmap-agent-js -- npm run test
\`\`\`
NB: Unfortunately, \`--stack-size'\` cannot be set via the \`NODE_OPTIONS\` environment variable.\
`;

const TOO_MANY_GROUP_EVENT_MESSAGE = `\
Many recorded events were related to tracking asynchronous resources. \
This impacts the performance of the javascript agent and may cause memory issues. \
It is possible to no longer record them by adding \`ordering: chronological\` to the appmap.yml file. \
This would speed up the execution of the agent but would make it unable to track the origin of callbacks. \
Note that async/await structure will still be preserved.\
`;

const TOO_MANY_APPLY_EVENT_MESSAGE = `\
Many function applications were recorded. \
The appmap framework works best with smaller appmaps. \
Beside reducing the scope of the recording (eg: smaller test cases or shorter remote recording) the configuration file can be tweaked to exclude functions from recording. \
Let's say we recorded this function many times:
  \`\`\`js
  /* util.js */
  // @label appmap-exclude
  export const isNull = (any) => any === null;
  \`\`\`
  There are many ways to exclude it:
  \`\`\`yaml
  # appmap.yml #
  # global function exclusion #
  exclude:
    - name: isNull
    - qualified-name: util.isNull
    - some-label: appmap-exclude
  packages:
    # file-scoped function exclusion #
    - glob: util.js
      exclude:
        - name: isNull
    # file exclusion #
    - glob: util.js
      enabled: false
  \`\`\`
`;

const countApplyEvent = (count, { payload: { type } }) =>
  type === "apply" ? count + 1 : count;

const countGroupEvent = (count, { payload: { type } }) =>
  type === "group" ? count + 1 : count;

const printLocation = ({ url, position: { line, column } }) =>
  `${url}:${String(line)}:${String(column)}`;

const printCount = (count, total) =>
  `${String(count)} [${String(round((100 * count) / total))}%]`;

const chartEvent = (events) => {
  const counters = new Map();
  for (const { payload } of events) {
    const { type } = payload;
    counters.set(type, (counters.has(type) ? counters.get(type) : 0) + 1);
  }
  return counters;
};

const printEventCount = (name, count, total) =>
  `  - ${name}: ${printCount(count, total)}\n`;

const printEventDistribution = (events) => {
  const counters = chartEvent(events);
  const { length: total } = events;
  return toArray(counters.keys())
    .sort((key1, key2) => counters.get(key2) - counters.get(key1))
    .map((key) => printEventCount(key, counters.get(key), total))
    .join("");
};

const chartApplyEvent = (events) => {
  const counters = new Map();
  for (const { payload } of events) {
    if (payload.type === "apply") {
      const { function: location } = payload;
      counters.set(
        location,
        (counters.has(location) ? counters.get(location) : 0) + 1,
      );
    }
  }
  return counters;
};

const printApplyEventCount = (location, count, total, codebase) => {
  const maybe = lookupClosureLocation(codebase, location);
  const lines = [];
  lines.push(`  - ${printLocation(location)} >> ${printCount(count, total)}`);
  /* c8 ignore start */
  if (maybe === null) {
    lines.push(
      "    We could not find any information associated to this function...",
    );
  } else {
    const { excluded } = maybe;
    if (excluded) {
      lines.push(
        "    This function was excluded but postmortem so it was still recorded.",
        "    To no longer record this function use: `postmortem-function-exclusion: false`.",
      );
    } else {
      const { labels, name, parent, static: static_ } = maybe;
      lines.push(
        "    This function can be excluded with the following criteria:",
        `      - name: ${name}`,
        `      - qualified-name: ${parent}${static_ ? "#" : "."}${name}`,
      );
      if (labels.length > 0) {
        lines.push(`      - labels: ${labels.join(", ")}`);
      }
    }
    lines.push("");
  }
  /* c8 ignore stop */
  return lines.join("\n");
};

const printApplyEventDistribution = (events, codebase) => {
  const counters = chartApplyEvent(events);
  const total = events.reduce(countApplyEvent, 0);
  return toArray(counters.keys())
    .sort((key1, key2) => counters.get(key2) - counters.get(key1))
    .slice(0, 7)
    .map((key) =>
      printApplyEventCount(
        parseLocation(key),
        counters.get(key),
        total,
        codebase,
      ),
    )
    .join("");
};

export const compileTrace = (configuration, files, messages, termination) => {
  logDebug("Trace: %j", { configuration, files, messages, termination });
  const errors = [];
  const events = [];
  for (const message of messages) {
    const { type } = message;
    if (type === "error") {
      errors.push(message.error);
    } else if (type === "event") {
      events.push(message);
    } else if (type === "group") {
      events.push(
        {
          type: "event",
          session: message.session,
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
          session: message.session,
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
    } else if (type === "amend") {
      for (let index = events.length - 1; index >= 0; index -= 1) {
        const event = events[index];
        if (
          event.session === message.session &&
          event.tab === message.tab &&
          event.site === message.site
        ) {
          events[index] = { ...event, payload: message.payload };
          break;
        }
      }
    } /* c8 ignore start */ else {
      throw new InternalAppmapError("invalid core message type");
    } /* c8 ignore stop */
  }
  const url = getOutputUrl(configuration);
  const codebase = createCodebase(files, configuration);
  const total_count = events.length;
  const apply_count = events.reduce(countApplyEvent, 0);
  const group_count = events.reduce(countGroupEvent, 0);
  logInfo("AppMap %s", url);
  logInfoWhen(
    total_count > TOTAL_EVENT_THRESHOLD,
    "This appmap is very large (%j events), we will try our best to process it...",
    total_count,
  );
  logInfoWhen(
    total_count > TOTAL_EVENT_THRESHOLD,
    "Event distribution:\n%f",
    () => printEventDistribution(events),
  );
  logDebugWhen(
    total_count <= TOTAL_EVENT_THRESHOLD,
    "Event distribution:\n%f",
    () => printEventDistribution(events),
  );
  logInfoWhen(
    group_count > GROUP_EVENT_THRESHOLD,
    TOO_MANY_GROUP_EVENT_MESSAGE,
  );
  logInfoWhen(
    apply_count > APPLY_EVENT_THRESHOLD,
    TOO_MANY_APPLY_EVENT_MESSAGE,
  );
  logInfoWhen(
    apply_count > APPLY_EVENT_THRESHOLD,
    "Most frequently applied functions:\n%f",
    () => printApplyEventDistribution(events, codebase),
  );
  logDebugWhen(
    apply_count <= APPLY_EVENT_THRESHOLD,
    "Most frequently applied functions:\n%f",
    () => printApplyEventDistribution(events, codebase),
  );
  let digested_events = null;
  /* c8 ignore start */
  try {
    digested_events = digestEventTrace(orderEventArray(events), codebase);
  } catch (error) {
    if (error instanceof RangeError) {
      logError("Stack overflow error >> %O", error);
      logError(STACKOVERFLOW_MESSAGE);
      throw new ExternalAppmapError(
        "Stack overflow error during appmap processing",
      );
    } else {
      throw error;
    }
  }
  /* c8 ignore stop */
  const appmap = {
    version: VERSION,
    metadata: compileMetadata(configuration, errors, termination),
    classMap: exportClassmap(codebase),
    events: digested_events,
  };
  if (configuration.validate.appmap) {
    validateAppmap(appmap);
  }
  return {
    url: getOutputUrl(configuration),
    content: appmap,
  };
};
