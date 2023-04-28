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
import {
  inflate,
  START,
  STOP,
  ERROR,
  SOURCE,
  BEGIN_REQUEST_AMEND,
  SESSION_ASSIGNMENT,
  GROUP_DEFINITION,
  GROUP_ASSIGNMENT,
  BEGIN_BUNDLE_EVENT,
  END_BUNDLE_EVENT,
  BEFORE_JUMP_EVENT,
  AFTER_JUMP_EVENT,
  BEGIN_APPLY_EVENT,
  END_RETURN_EVENT,
  END_THROW_EVENT,
  BEFORE_AWAIT_EVENT,
  BEFORE_YIELD_EVENT,
  AFTER_RESOLVE_EVENT,
  AFTER_REJECT_EVENT,
  BEGIN_REQUEST_EVENT,
  END_RESPONSE_EVENT,
  BEFORE_REQUEST_EVENT,
  AFTER_RESPONSE_EVENT,
  BEFORE_QUERY_EVENT,
  AFTER_ANSWER_EVENT,
} from "../../compress/index.mjs";
import { InternalAppmapError } from "../../error/index.mjs";

const {
  Array: { isArray, from: toArray },
  Object: { fromEntries, entries: toEntries },
  JSON: { stringify: stringifyJSON },
} = globalThis;

const serialize = (serialization, enabled, value) => {
  enabled.value = false;
  try {
    return serializeInner(serialization, value);
  } finally {
    enabled.value = true;
  }
};

const updateGroup = (buffer, old_group, new_group) => {
  if (old_group.value !== new_group) {
    buffer.push([GROUP_ASSIGNMENT, new_group]);
    old_group.value = new_group;
  }
};

const initializeBuffer = (buffer, session, { value: group }) => {
  buffer.push([SESSION_ASSIGNMENT, session], [GROUP_ASSIGNMENT, group]);
};

export const createFrontend = (configuration) => {
  const { session } = configuration;
  assert(session !== null, "missing session", InternalAppmapError);
  const buffer = [];
  initializeBuffer(buffer, session, { value: 0 });
  return {
    enabled: { value: true },
    buffer,
    counter: createCounter(0),
    session,
    old_group: { value: 0 },
    serialization: createSerialization(configuration),
    configuration,
  };
};

export const flushContent = ({ buffer, session, old_group }) => {
  if (buffer.length === 2) {
    return null;
  } else {
    const content = stringifyJSON(buffer);
    buffer.length = 0;
    initializeBuffer(buffer, session, old_group);
    return content;
  }
};

/* c8 ignore start */
export const flushMessageArray = ({ buffer, session, old_group }) => {
  if (buffer.length === 2) {
    return [];
  } else {
    const messages = inflate(buffer);
    buffer.length = 0;
    initializeBuffer(buffer, session, old_group);
    return messages;
  }
};
/* c8 ignore stop */

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
      buffer.push([SOURCE, url, content]);
    }
    return instrumented_content;
  } else {
    return cache.get(url);
  }
};

export const recordError = ({ enabled, buffer, serialization }, error) => {
  if (enabled.value) {
    buffer.push([ERROR, serialize(serialization, enabled, error)]);
  }
};

export const recordStartTrack = ({ enabled, buffer }, track, configuration) => {
  if (enabled.value) {
    buffer.push([START, track, configuration]);
  }
};

export const recordStopTrack = ({ enabled, buffer }, track, termination) => {
  if (enabled.value) {
    buffer.push([STOP, track, termination]);
  }
};

export const recordGroup = ({ enabled, buffer }, group, child, description) => {
  if (enabled.value) {
    buffer.push([GROUP_DEFINITION, group, child, description]);
  }
};

// jump && bundle //

const compileRecordEmpty =
  (head) =>
  ({ enabled, buffer, old_group }, tab, group, time) => {
    if (enabled.value) {
      updateGroup(buffer, old_group, group);
      buffer.push([head, tab, time]);
    }
  };

export const recordBeforeJumpEvent = compileRecordEmpty(BEFORE_JUMP_EVENT);

export const recordAfterJumpEvent = compileRecordEmpty(AFTER_JUMP_EVENT);

export const recordBeginBundleEvent = compileRecordEmpty(BEGIN_BUNDLE_EVENT);

export const recordEndBundleEvent = compileRecordEmpty(END_BUNDLE_EVENT);

// function //

export const recordBeginApplyEvent = (
  { enabled, buffer, serialization, old_group },
  tab,
  group,
  time,
  function_,
  this_,
  arguments_,
) => {
  if (enabled.value) {
    updateGroup(buffer, old_group, group);
    buffer.push([
      BEGIN_APPLY_EVENT,
      tab,
      time,
      function_,
      serialize(serialization, enabled, this_),
      arguments_.map((argument) => serialize(serialization, enabled, argument)),
    ]);
  }
};

export const recordEndReturnEvent = (
  { enabled, buffer, serialization, old_group },
  tab,
  group,
  time,
  function_,
  result,
) => {
  if (enabled.value) {
    updateGroup(buffer, old_group, group);
    buffer.push([
      END_RETURN_EVENT,
      tab,
      time,
      function_,
      serialize(serialization, enabled, result),
    ]);
  }
};

export const recordEndThrowEvent = (
  { enabled, buffer, serialization, old_group },
  tab,
  group,
  time,
  function_,
  error,
) => {
  if (enabled.value) {
    updateGroup(buffer, old_group, group);
    buffer.push([
      END_THROW_EVENT,
      tab,
      time,
      function_,
      serialize(serialization, enabled, error),
    ]);
  }
};

// promise && iterator //

export const recordBeforeAwaitEvent = (
  { enabled, buffer, serialization, old_group },
  tab,
  group,
  time,
  promise,
) => {
  if (enabled.value) {
    updateGroup(buffer, old_group, group);
    buffer.push([
      BEFORE_AWAIT_EVENT,
      tab,
      time,
      serialize(serialization, enabled, promise),
    ]);
  }
};

export const recordBeforeYieldEvent = (
  { enabled, buffer, serialization, old_group },
  tab,
  group,
  time,
  iterator,
) => {
  if (enabled.value) {
    updateGroup(buffer, old_group, group);
    buffer.push([
      BEFORE_YIELD_EVENT,
      tab,
      time,
      serialize(serialization, enabled, iterator),
    ]);
  }
};

export const recordAfterResolveEvent = (
  { enabled, buffer, serialization, old_group },
  tab,
  group,
  time,
  result,
) => {
  if (enabled.value) {
    updateGroup(buffer, old_group, group);
    buffer.push([
      AFTER_RESOLVE_EVENT,
      tab,
      time,
      serialize(serialization, enabled, result),
    ]);
  }
};

export const recordAfterRejectEvent = (
  { enabled, buffer, serialization, old_group },
  tab,
  group,
  time,
  error,
) => {
  if (enabled.value) {
    updateGroup(buffer, old_group, group);
    buffer.push([
      AFTER_REJECT_EVENT,
      tab,
      time,
      serialize(serialization, enabled, error),
    ]);
  }
};

// client && server //

const compileRecordRequest =
  (head) =>
  (
    { enabled, buffer, serialization, old_group },
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
      updateGroup(buffer, old_group, group);
      buffer.push([
        head,
        tab,
        time,
        protocol,
        method,
        url,
        route,
        headers,
        serialize(serialization, enabled, body),
      ]);
    }
  };

const compileRecordResponse =
  (head) =>
  (
    { enabled, buffer, serialization, old_group },
    tab,
    group,
    time,
    status,
    message,
    headers,
    body,
  ) => {
    if (enabled.value) {
      updateGroup(buffer, old_group, group);
      buffer.push([
        head,
        tab,
        time,
        status,
        message,
        headers,
        serialize(serialization, enabled, body),
      ]);
    }
  };

export const recordBeforeRequestEvent =
  compileRecordRequest(BEFORE_REQUEST_EVENT);

export const recordAfterResponseEvent =
  compileRecordResponse(AFTER_RESPONSE_EVENT);

export const recordBeginRequestEvent =
  compileRecordRequest(BEGIN_REQUEST_EVENT);

export const recordBeginRequestAmend = (
  { enabled, buffer, serialization },
  tab,
  protocol,
  method,
  url,
  route,
  headers,
  body,
) => {
  if (enabled.value) {
    buffer.push([
      BEGIN_REQUEST_AMEND,
      tab,
      protocol,
      method,
      url,
      route,
      headers,
      serialize(serialization, enabled, body),
    ]);
  }
};

export const recordEndResponseEvent = compileRecordResponse(END_RESPONSE_EVENT);

// database //

export const recordBeforeQueryEvent = (
  { enabled, buffer, serialization, old_group },
  tab,
  group,
  time,
  database,
  version,
  sql,
  parameters,
) => {
  if (enabled.value) {
    updateGroup(buffer, old_group, group);
    buffer.push([
      BEFORE_QUERY_EVENT,
      tab,
      time,
      database,
      version,
      sql,
      isArray(parameters)
        ? parameters.map((parameter) =>
            serialize(serialization, enabled, parameter),
          )
        : fromEntries(
            toArray(toEntries(parameters)).map(([name, parameter]) => [
              name,
              serialize(serialization, enabled, parameter),
            ]),
          ),
    ]);
  }
};

export const recordAfterAnswerEvent = compileRecordEmpty(AFTER_ANSWER_EVENT);
