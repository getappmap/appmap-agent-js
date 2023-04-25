import { assert, createCounter, incrementCounter } from "../../util/index.mjs";
import {
  instrument as instrumentInner,
  extractMissingUrlArray as extractMissingUrlArrayInner,
} from "../../instrumentation/index.mjs";
import {
  createSerialization,
  serialize as serializeInner,
  getSerializationEmptyValue as getSerializationEmptyValueInner,
} from "../../serialization/index.mjs";
import { InternalAppmapError } from "../../error/index.mjs";

const {
  Array: { isArray, from: toArray },
  Object: { fromEntries, entries: toEntries },
} = globalThis;

const serialize = (serialization, enabled, value) => {
  enabled.value = false;
  try {
    return serializeInner(serialization, value);
  } finally {
    enabled.value = true;
  }
};

export const createFrontend = (configuration) => {
  const { session } = configuration;
  assert(session !== null, "missing session", InternalAppmapError);
  return {
    enabled: { value: true },
    buffer: [],
    counter: createCounter(0),
    session,
    serialization: createSerialization(configuration),
    configuration,
  };
};

export const flush = ({ buffer }) => buffer.splice(0, buffer.length);

export const getFreshTab = ({ counter }) => incrementCounter(counter);

export const getSession = ({ session }) => session;

export const getSerializationEmptyValue = ({ serialization }) =>
  getSerializationEmptyValueInner(serialization);

export const extractMissingUrlArray = ({ configuration }, url, cache) =>
  extractMissingUrlArrayInner(url, cache, configuration);

export const instrument = ({ enabled, buffer, configuration }, url, cache) => {
  if (enabled.value) {
    const { sources, content: instrumented_content } = instrumentInner(
      url,
      cache,
      configuration,
    );
    for (const { url, content } of sources) {
      buffer.push({
        type: "source",
        url,
        content,
      });
    }
    return instrumented_content;
  } else {
    return cache.get(url);
  }
};

export const recordError = (
  { enabled, buffer, session, serialization },
  error,
) => {
  if (enabled.value) {
    buffer.push({
      type: "error",
      session,
      error: serialize(serialization, enabled, error),
    });
  }
};

export const recordStartTrack = ({ enabled, buffer }, track, configuration) => {
  if (enabled.value) {
    buffer.push({
      type: "start",
      track,
      configuration,
    });
  }
};

export const recordStopTrack = ({ enabled, buffer }, track, termination) => {
  if (enabled.value) {
    buffer.push({
      type: "stop",
      track,
      termination,
    });
  }
};

export const recordGroup = (
  { enabled, buffer, session },
  group,
  child,
  description,
) => {
  if (enabled.value) {
    buffer.push({
      type: "group",
      session,
      group,
      child,
      description,
    });
  }
};

// jump && bundle //

const JUMP_PAYLOAD = { type: "jump" };

const BUNDLE_PAYLOAD = { type: "bundle" };

const compileRecordEmpty =
  (type, site, payload) =>
  ({ enabled, buffer, session }, tab, group, time) => {
    if (enabled.value) {
      buffer.push({
        type,
        session,
        site,
        tab,
        time,
        group,
        payload,
      });
    }
  };

export const recordBeforeJumpEvent = compileRecordEmpty(
  "event",
  "before",
  JUMP_PAYLOAD,
);

export const recordAfterJumpEvent = compileRecordEmpty(
  "event",
  "after",
  JUMP_PAYLOAD,
);

export const recordBeginBundleEvent = compileRecordEmpty(
  "event",
  "begin",
  BUNDLE_PAYLOAD,
);

export const recordEndBundleEvent = compileRecordEmpty(
  "event",
  "end",
  BUNDLE_PAYLOAD,
);

// function //

export const recordBeginApplyEvent = (
  { enabled, buffer, session, serialization },
  tab,
  group,
  time,
  function_,
  this_,
  arguments_,
) => {
  if (enabled.value) {
    buffer.push({
      type: "event",
      session,
      site: "begin",
      tab,
      time,
      group,
      payload: {
        type: "apply",
        function: function_,
        this: serialize(serialization, enabled, this_),
        arguments: arguments_.map((argument) =>
          serialize(serialization, enabled, argument),
        ),
      },
    });
  }
};

export const recordEndReturnEvent = (
  { enabled, buffer, session, serialization },
  tab,
  group,
  time,
  function_,
  result,
) => {
  if (enabled.value) {
    buffer.push({
      type: "event",
      session,
      site: "end",
      tab,
      time,
      group,
      payload: {
        type: "return",
        function: function_,
        result: serialize(serialization, enabled, result),
      },
    });
  }
};

export const recordEndThrowEvent = (
  { enabled, buffer, session, serialization },
  tab,
  group,
  time,
  function_,
  error,
) => {
  if (enabled.value) {
    buffer.push({
      type: "event",
      session,
      site: "end",
      tab,
      time,
      group,
      payload: {
        type: "throw",
        function: function_,
        error: serialize(serialization, enabled, error),
      },
    });
  }
};

// promise && iterator //

export const recordBeforeAwaitEvent = (
  { enabled, buffer, session, serialization },
  tab,
  group,
  time,
  promise,
) => {
  if (enabled.value) {
    buffer.push({
      type: "event",
      session,
      site: "before",
      tab,
      time,
      group,
      payload: {
        type: "await",
        promise: serialize(serialization, enabled, promise),
      },
    });
  }
};

export const recordBeforeYieldEvent = (
  { enabled, buffer, session, serialization },
  tab,
  group,
  time,
  iterator,
) => {
  if (enabled.value) {
    buffer.push({
      type: "event",
      session,
      site: "before",
      tab,
      time,
      group,
      payload: {
        type: "yield",
        iterator: serialize(serialization, enabled, iterator),
      },
    });
  }
};

export const recordAfterResolveEvent = (
  { enabled, buffer, session, serialization },
  tab,
  group,
  time,
  result,
) => {
  if (enabled.value) {
    buffer.push({
      type: "event",
      session,
      site: "after",
      tab,
      time,
      group,
      payload: {
        type: "resolve",
        result: serialize(serialization, enabled, result),
      },
    });
  }
};

export const recordAfterRejectEvent = (
  { enabled, buffer, session, serialization },
  tab,
  group,
  time,
  error,
) => {
  if (enabled.value) {
    buffer.push({
      type: "event",
      session,
      site: "after",
      tab,
      time,
      group,
      payload: {
        type: "reject",
        error: serialize(serialization, enabled, error),
      },
    });
  }
};

// client && server //

const compileRecordRequest =
  (type, site, side) =>
  (
    { enabled, buffer, session, serialization },
    tab,
    group,
    time,
    protocol,
    method,
    url,
    route,
    headers,
    body,
  ) => {
    if (enabled.value) {
      buffer.push({
        type,
        session,
        site,
        tab,
        time,
        group,
        payload: {
          type: "request",
          side,
          protocol,
          method,
          url,
          route,
          headers,
          body: serialize(serialization, enabled, body),
        },
      });
    }
  };

const compileRecordResponse =
  (type, site, side) =>
  (
    { enabled, buffer, session, serialization },
    tab,
    group,
    time,
    status,
    message,
    headers,
    body,
  ) => {
    if (enabled.value) {
      buffer.push({
        type,
        session,
        site,
        tab,
        time,
        group,
        payload: {
          type: "response",
          side,
          status,
          message,
          headers,
          body: serialize(serialization, enabled, body),
        },
      });
    }
  };

export const recordBeforeRequestEvent = compileRecordRequest(
  "event",
  "before",
  "client",
);

export const recordAfterResponseEvent = compileRecordResponse(
  "event",
  "after",
  "client",
);

export const recordBeginRequestEvent = compileRecordRequest(
  "event",
  "begin",
  "server",
);

export const recordBeginRequestAmend = (
  { enabled, buffer, session, serialization },
  tab,
  protocol,
  method,
  url,
  route,
  headers,
  body,
) => {
  if (enabled.value) {
    buffer.push({
      type: "amend",
      session,
      site: "begin",
      tab,
      payload: {
        type: "request",
        side: "server",
        protocol,
        method,
        url,
        route,
        headers,
        body: serialize(serialization, enabled, body),
      },
    });
  }
};

export const recordEndResponseEvent = compileRecordResponse(
  "event",
  "end",
  "server",
);

// database //

export const recordBeforeQueryEvent = (
  { enabled, buffer, session, serialization },
  tab,
  group,
  time,
  database,
  version,
  sql,
  parameters,
) => {
  if (enabled.value) {
    buffer.push({
      type: "event",
      session,
      site: "before",
      tab,
      time,
      group,
      payload: {
        type: "query",
        database,
        version,
        sql,
        parameters: isArray(parameters)
          ? parameters.map((parameter) =>
              serialize(serialization, enabled, parameter),
            )
          : fromEntries(
              toArray(toEntries(parameters)).map(([name, parameter]) => [
                name,
                serialize(serialization, enabled, parameter),
              ]),
            ),
      },
    });
  }
};

export const recordAfterAnswerEvent = compileRecordEmpty("event", "after", {
  type: "answer",
});
