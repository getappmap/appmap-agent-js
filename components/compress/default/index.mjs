export const START = "TR?";
export const STOP = "TR!";
export const ERROR = "ERR";
export const SOURCE = "SRC";
export const BEGIN_REQUEST_AMEND = "RQ.";

export const SESSION_ASSIGNMENT = "SE!";

export const GROUP_DEFINITION = "GR?";
export const GROUP_ASSIGNMENT = "GR!";

export const BEGIN_BUNDLE_EVENT = "BD>";
export const END_BUNDLE_EVENT = "BD<";

export const BEFORE_JUMP_EVENT = "JP?";
export const AFTER_JUMP_EVENT = "JP!";

export const BEGIN_APPLY_EVENT = "APP";
export const END_RETURN_EVENT = "RET";
export const END_THROW_EVENT = "TRW";

export const BEFORE_AWAIT_EVENT = "AWT";
export const BEFORE_YIELD_EVENT = "YLD";
export const AFTER_RESOLVE_EVENT = "RES";
export const AFTER_REJECT_EVENT = "REJ";

export const BEGIN_REQUEST_EVENT = "RQ>";
export const END_RESPONSE_EVENT = "RS<";
export const BEFORE_REQUEST_EVENT = "RQ?";
export const AFTER_RESPONSE_EVENT = "RS!";

export const BEFORE_QUERY_EVENT = "QRY";
export const AFTER_ANSWER_EVENT = "ASW";

const BUNDLE_PAYLOAD = { type: "bundle" };
const JUMP_PAYLOAD = { type: "jump" };

/////////////
// deflate //
/////////////

const event_head_mapping = {
  __proto__: null,
  begin: {
    __proto__: null,
    bundle: BEGIN_BUNDLE_EVENT,
    apply: BEGIN_APPLY_EVENT,
    request: BEGIN_REQUEST_EVENT,
  },
  end: {
    __proto__: null,
    bundle: END_BUNDLE_EVENT,
    return: END_RETURN_EVENT,
    throw: END_THROW_EVENT,
    response: END_RESPONSE_EVENT,
  },
  before: {
    __proto__: null,
    jump: BEFORE_JUMP_EVENT,
    await: BEFORE_AWAIT_EVENT,
    yield: BEFORE_YIELD_EVENT,
    request: BEFORE_REQUEST_EVENT,
    query: BEFORE_QUERY_EVENT,
  },
  after: {
    __proto__: null,
    jump: AFTER_JUMP_EVENT,
    resolve: AFTER_RESOLVE_EVENT,
    reject: AFTER_REJECT_EVENT,
    response: AFTER_RESPONSE_EVENT,
    answer: AFTER_ANSWER_EVENT,
  },
};

const event_deflater_mapping = {
  __proto__: null,
  bundle: (head, tab, time, {}) => [head, tab, time],
  jump: (head, tab, time, {}) => [head, tab, time],
  apply: (
    head,
    tab,
    time,
    { function: function_, this: this_, arguments: arguments_ },
  ) => [head, tab, time, function_, this_, arguments_],
  return: (head, tab, time, { function: function_, result }) => [
    head,
    tab,
    time,
    function_,
    result,
  ],
  throw: (head, tab, time, { function: function_, error }) => [
    head,
    tab,
    time,
    function_,
    error,
  ],
  await: (head, tab, time, { promise }) => [head, tab, time, promise],
  yield: (head, tab, time, { iterator }) => [head, tab, time, iterator],
  resolve: (head, tab, time, { result }) => [head, tab, time, result],
  reject: (head, tab, time, { error }) => [head, tab, time, error],
  request: (
    head,
    tab,
    time,
    { protocol, method, url, route, headers, body },
  ) => [head, tab, time, protocol, method, url, route, headers, body],
  response: (head, tab, time, { status, message, headers, body }) => [
    head,
    tab,
    time,
    status,
    message,
    headers,
    body,
  ],
  query: (head, tab, time, { database, version, sql, parameters }) => [
    head,
    tab,
    time,
    database,
    version,
    sql,
    parameters,
  ],
  answer: (head, tab, time, {}) => [head, tab, time],
};

const deflater_mapping = {
  __proto__: null,
  group: ({ group, child, description }) => [
    GROUP_DEFINITION,
    group,
    child,
    description,
  ],
  source: ({ url, content }) => [SOURCE, url, content],
  error: ({ error }) => [ERROR, error],
  start: ({ track, configuration }) => [START, track, configuration],
  stop: ({ track, termination }) => [STOP, track, termination],
  amend: ({
    tab,
    payload: { protocol, method, url, route, headers, body },
  }) => [BEGIN_REQUEST_AMEND, tab, protocol, method, url, route, headers, body],
  event: ({ site, time, tab, payload }) => {
    const { type } = payload;
    return event_deflater_mapping[type](
      event_head_mapping[site][type],
      tab,
      time,
      payload,
    );
  },
};

export const deflate = (messages) => {
  let last_session = null;
  let last_group = null;
  const lines = [];
  for (const message of messages) {
    const { type } = message;
    if (
      type === "error" ||
      type === "event" ||
      type === "group" ||
      type === "amend"
    ) {
      const { session: new_session } = message;
      if (new_session !== last_session) {
        lines.push([SESSION_ASSIGNMENT, new_session]);
        last_session = new_session;
      }
    }
    if (type === "event") {
      const { group: new_group } = message;
      if (new_group !== last_group) {
        lines.push([GROUP_ASSIGNMENT, new_group]);
        last_group = new_group;
      }
    }
    lines.push(deflater_mapping[type](message));
  }
  return lines;
};

/////////////
// inflate //
/////////////

const inflaters = {
  __proto__: null,
  // not event //
  [START]: (_session, _group, [_head, track, configuration]) => ({
    type: "start",
    track,
    configuration,
  }),
  [STOP]: (_session, _group, [_head, track, termination]) => ({
    type: "stop",
    track,
    termination,
  }),
  [SOURCE]: (_session, _group, [_head, url, content]) => ({
    type: "source",
    url,
    content,
  }),
  [ERROR]: (session, _group, [_head, error]) => ({
    type: "error",
    session,
    error,
  }),
  [GROUP_DEFINITION]: (
    session,
    _group,
    [_head, group, child, description],
  ) => ({
    type: "group",
    session,
    group,
    child,
    description,
  }),
  [BEGIN_REQUEST_AMEND]: (
    session,
    _group,
    [_head, tab, protocol, method, url, route, headers, body],
  ) => ({
    type: "amend",
    site: "begin",
    session,
    tab,
    payload: {
      type: "request",
      side: "server",
      protocol,
      method,
      url,
      route,
      headers,
      body,
    },
  }),
  // bundle //
  [BEGIN_BUNDLE_EVENT]: (session, group, [_head, tab, time]) => ({
    type: "event",
    site: "begin",
    session,
    group,
    tab,
    time,
    payload: BUNDLE_PAYLOAD,
  }),
  [END_BUNDLE_EVENT]: (session, group, [_head, tab, time]) => ({
    type: "event",
    site: "end",
    session,
    group,
    tab,
    time,
    payload: BUNDLE_PAYLOAD,
  }),
  // jump //
  [BEFORE_JUMP_EVENT]: (session, group, [_head, tab, time]) => ({
    type: "event",
    site: "before",
    session,
    group,
    tab,
    time,
    payload: JUMP_PAYLOAD,
  }),
  [AFTER_JUMP_EVENT]: (session, group, [_head, tab, time]) => ({
    type: "event",
    site: "after",
    session,
    group,
    tab,
    time,
    payload: JUMP_PAYLOAD,
  }),
  // apply //
  [BEGIN_APPLY_EVENT]: (
    session,
    group,
    [_head, tab, time, function_, this_, arguments_],
  ) => ({
    type: "event",
    site: "begin",
    session,
    group,
    tab,
    time,
    payload: {
      type: "apply",
      function: function_,
      this: this_,
      arguments: arguments_,
    },
  }),
  [END_RETURN_EVENT]: (
    session,
    group,
    [_head, tab, time, function_, result],
  ) => ({
    type: "event",
    site: "end",
    session,
    group,
    tab,
    time,
    payload: {
      type: "return",
      function: function_,
      result,
    },
  }),
  [END_THROW_EVENT]: (
    session,
    group,
    [_head, tab, time, function_, error],
  ) => ({
    type: "event",
    site: "end",
    session,
    group,
    tab,
    time,
    payload: {
      type: "throw",
      function: function_,
      error,
    },
  }),
  // await/yield //
  [BEFORE_AWAIT_EVENT]: (session, group, [_head, tab, time, promise]) => ({
    type: "event",
    site: "before",
    session,
    group,
    tab,
    time,
    payload: {
      type: "await",
      promise,
    },
  }),
  [BEFORE_YIELD_EVENT]: (session, group, [_head, tab, time, iterator]) => ({
    type: "event",
    site: "before",
    session,
    group,
    tab,
    time,
    payload: {
      type: "yield",
      iterator,
    },
  }),
  [AFTER_RESOLVE_EVENT]: (session, group, [_head, tab, time, result]) => ({
    type: "event",
    site: "after",
    session,
    group,
    tab,
    time,
    payload: {
      type: "resolve",
      result,
    },
  }),
  [AFTER_REJECT_EVENT]: (session, group, [_head, tab, time, error]) => ({
    type: "event",
    site: "after",
    session,
    group,
    tab,
    time,
    payload: {
      type: "reject",
      error,
    },
  }),
  // http-server //
  [BEGIN_REQUEST_EVENT]: (
    session,
    group,
    [_head, tab, time, protocol, method, url, route, headers, body],
  ) => ({
    type: "event",
    site: "begin",
    session,
    group,
    tab,
    time,
    payload: {
      type: "request",
      side: "server",
      protocol,
      method,
      url,
      route,
      headers,
      body,
    },
  }),
  [END_RESPONSE_EVENT]: (
    session,
    group,
    [_head, tab, time, status, message, headers, body],
  ) => ({
    type: "event",
    site: "end",
    session,
    group,
    tab,
    time,
    payload: {
      type: "response",
      side: "server",
      status,
      message,
      headers,
      body,
    },
  }),
  // http-client //
  [BEFORE_REQUEST_EVENT]: (
    session,
    group,
    [_head, tab, time, protocol, method, url, route, headers, body],
  ) => ({
    type: "event",
    site: "before",
    session,
    group,
    tab,
    time,
    payload: {
      type: "request",
      side: "client",
      protocol,
      method,
      url,
      route,
      headers,
      body,
    },
  }),
  [AFTER_RESPONSE_EVENT]: (
    session,
    group,
    [_head, tab, time, status, message, headers, body],
  ) => ({
    type: "event",
    site: "after",
    session,
    group,
    tab,
    time,
    payload: {
      type: "response",
      side: "client",
      status,
      message,
      headers,
      body,
    },
  }),
  // query //
  [BEFORE_QUERY_EVENT]: (
    session,
    group,
    [_head, tab, time, database, version, sql, parameters],
  ) => ({
    type: "event",
    site: "before",
    session,
    group,
    tab,
    time,
    payload: {
      type: "query",
      database,
      version,
      sql,
      parameters,
    },
  }),
  [AFTER_ANSWER_EVENT]: (session, group, [_head, tab, time]) => ({
    type: "event",
    site: "after",
    session,
    group,
    tab,
    time,
    payload: { type: "answer" },
  }),
};

export const inflate = (lines) => {
  let group = null;
  let session = null;
  const messages = [];
  for (const tokens of lines) {
    const head = tokens[0];
    if (head === SESSION_ASSIGNMENT) {
      session = tokens[1];
    } else if (head === GROUP_ASSIGNMENT) {
      group = tokens[1];
    } else {
      messages.push(inflaters[head](session, group, tokens));
    }
  }
  return messages;
};
