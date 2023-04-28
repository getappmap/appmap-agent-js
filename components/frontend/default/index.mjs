import { assert, createCounter, incrementCounter } from "../../util/index.mjs";
import {
  instrument as instrumentInner,
  extractMissingUrlArray as extractMissingUrlArrayInner,
} from "../../instrumentation/index.mjs";
import {
  createSerialization,
  serialize,
  getSerializationEmptyValue as getSerializationEmptyValueInner,
} from "../../serialization/index.mjs";
import { InternalAppmapError } from "../../error/index.mjs";

const {
  Array: { isArray, from: toArray },
  Object: { fromEntries, entries: toEntries },
} = globalThis;

export const createFrontend = (configuration) => {
  const { session } = configuration;
  assert(session !== null, "missing session", InternalAppmapError);
  return {
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

export const instrument = ({ buffer, configuration }, url, cache) => {
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
};

export const recordError = ({ buffer, session, serialization }, error) => {
  buffer.push({
    type: "error",
    session,
    error: serialize(serialization, error),
  });
};

export const recordStartTrack = ({ buffer }, track, configuration) => {
  buffer.push({
    type: "start",
    track,
    configuration,
  });
};

export const recordStopTrack = ({ buffer }, track, termination) => {
  buffer.push({
    type: "stop",
    track,
    termination,
  });
};

export const recordGroup = ({ buffer, session }, group, child, description) => {
  buffer.push({
    type: "group",
    session,
    group,
    child,
    description,
  });
};

// jump && bundle //

const JUMP_PAYLOAD = { type: "jump" };

const BUNDLE_PAYLOAD = { type: "bundle" };

const compileRecordEmpty =
  (type, site, payload) =>
  ({ buffer, session }, tab, group, time) => {
    buffer.push({
      type,
      session,
      site,
      tab,
      time,
      group,
      payload,
    });
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
  { buffer, session, serialization },
  tab,
  group,
  time,
  function_,
  this_,
  arguments_,
) => {
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
      this: serialize(serialization, this_),
      arguments: arguments_.map((argument) =>
        serialize(serialization, argument),
      ),
    },
  });
};

export const recordEndReturnEvent = (
  { buffer, session, serialization },
  tab,
  group,
  time,
  function_,
  result,
) => {
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
      result: serialize(serialization, result),
    },
  });
};

export const recordEndThrowEvent = (
  { buffer, session, serialization },
  tab,
  group,
  time,
  function_,
  error,
) => {
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
      error: serialize(serialization, error),
    },
  });
};

// promise && iterator //

export const recordBeforeAwaitEvent = (
  { buffer, session, serialization },
  tab,
  group,
  time,
  promise,
) => {
  buffer.push({
    type: "event",
    session,
    site: "before",
    tab,
    time,
    group,
    payload: {
      type: "await",
      promise: serialize(serialization, promise),
    },
  });
};

export const recordBeforeYieldEvent = (
  { buffer, session, serialization },
  tab,
  group,
  time,
  iterator,
) => {
  buffer.push({
    type: "event",
    session,
    site: "before",
    tab,
    time,
    group,
    payload: {
      type: "yield",
      iterator: serialize(serialization, iterator),
    },
  });
};

export const recordAfterResolveEvent = (
  { buffer, session, serialization },
  tab,
  group,
  time,
  result,
) => {
  buffer.push({
    type: "event",
    session,
    site: "after",
    tab,
    time,
    group,
    payload: {
      type: "resolve",
      result: serialize(serialization, result),
    },
  });
};

export const recordAfterRejectEvent = (
  { buffer, session, serialization },
  tab,
  group,
  time,
  error,
) => {
  buffer.push({
    type: "event",
    session,
    site: "after",
    tab,
    time,
    group,
    payload: {
      type: "reject",
      error: serialize(serialization, error),
    },
  });
};

// client && server //

const compileRecordRequest =
  (type, site, side) =>
  (
    { buffer, session, serialization },
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
        body: serialize(serialization, body),
      },
    });
  };

const compileRecordResponse =
  (type, site, side) =>
  (
    { buffer, session, serialization },
    tab,
    group,
    time,
    status,
    message,
    headers,
    body,
  ) => {
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
        body: serialize(serialization, body),
      },
    });
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
  { buffer, session, serialization },
  tab,
  protocol,
  method,
  url,
  route,
  headers,
  body,
) => {
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
      body: serialize(serialization, body),
    },
  });
};

export const recordEndResponseEvent = compileRecordResponse(
  "event",
  "end",
  "server",
);

// database //

export const recordBeforeQueryEvent = (
  { buffer, session, serialization },
  tab,
  group,
  time,
  database,
  version,
  sql,
  parameters,
) => {
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
        ? parameters.map((parameter) => serialize(serialization, parameter))
        : fromEntries(
            toArray(toEntries(parameters)).map(([name, parameter]) => [
              name,
              serialize(serialization, parameter),
            ]),
          ),
    },
  });
};

export const recordAfterAnswerEvent = compileRecordEmpty("event", "after", {
  type: "answer",
});
