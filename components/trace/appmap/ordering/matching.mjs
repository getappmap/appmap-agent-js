import { InternalAppmapError } from "../../../error/index.mjs";

const payloads = {
  jump: {
    type: "jump",
  },
  bundle: {
    type: "bundle",
  },
  apply: {
    type: "apply",
    function: null,
    this: {
      type: "string",
      print: "APPMAP-APPLY",
    },
    arguments: [],
  },
  return: {
    type: "return",
    function: null,
    result: {
      type: "string",
      print: "APPMAP-RETURN",
    },
  },
  throw: {
    type: "throw",
    function: null,
    error: {
      type: "string",
      print: "APPMAP-THROW",
    },
  },
  request: {
    side: null,
    type: "request",
    protocol: "HTTP/1.1",
    method: "GET",
    path: "/APPMAP/REQUEST",
    route: null,
    headers: {},
    body: null,
  },
  response: {
    side: null,
    type: "response",
    status: 200,
    message: "APPMAP-RESPONSE",
    route: null,
    headers: {},
    body: null,
  },
  query: {
    type: "query",
    database: "",
    version: null,
    sql: "SELECT * FROM APPMAP-QUERY;",
  },
  answer: {
    type: "answer",
    error: null,
  },
  yield: {
    type: "yield",
    function: null,
    delegate: false,
    iterator: {
      type: "string",
      print: "APPMAP-YIELD",
    },
  },
  await: {
    type: "await",
    function: null,
    promise: {
      type: "string",
      print: "APPMAP-AWAIT",
    },
  },
  resolve: {
    type: "resolve",
    function: null,
    result: {
      type: "APPMAP-RESOLVE",
    },
  },
  reject: {
    type: "reject",
    function: null,
    error: {
      type: "APPMAP-REJECT",
    },
  },
  group: {
    type: "group",
    group: null,
    description: "MISSING",
  },
  ungroup: {
    type: "ungroup",
    group: null,
  },
};

const matching = [
  ["begin/bundle", "end/bundle", []],
  ["begin/apply", "end/return", ["function"]],
  ["begin/apply", "end/throw", ["function"]],
  ["begin/request", "end/response", ["side"]],
  ["begin/group", "end/ungroup", ["group"]],
  ["before/await", "after/resolve", ["function"]],
  ["before/await", "after/reject", ["function"]],
  ["before/yield", "after/resolve", ["function"]],
  ["before/yield", "after/reject", ["function"]],
  ["before/jump", "after/jump", []],
  ["before/request", "after/response", ["side"]],
  ["before/query", "after/answer", []],
];

const makeMatchingKey = ({ site, payload: { type } }) => `${site}/${type}`;

const makeMatch = (key, copying) => {
  const [site, type] = key.split("/");
  return { site, type, copying };
};

const lookupMatch = (event) => {
  const key = makeMatchingKey(event);
  for (const match of matching) {
    if (match[0] === key) {
      return makeMatch(match[1], match[2]);
    } else if (match[1] === key) {
      return makeMatch(match[0], match[2]);
    }
  }
  throw new InternalAppmapError(
    "invalid combination of event site and event payload type",
  );
};

export const manufactureMatchingEvent = (event) => {
  const { site, type, copying } = lookupMatch(event);
  const payload = { ...payloads[type] };
  for (const field of copying) {
    payload[field] = event.payload[field];
  }
  return {
    type: "event",
    session: event.session,
    site,
    tab: event.tab,
    time: event.time,
    group: event.group,
    payload,
  };
};

export const isMatchingEvent = (event1, event2) => {
  const key1 = makeMatchingKey(event1);
  const key2 = makeMatchingKey(event2);
  for (const match of matching) {
    if (match[0] === key1 && match[1] === key2) {
      for (const field of match[2]) {
        if (event1.payload[field] !== event2.payload[field]) {
          return false;
        }
      }
      return event1.session === event2.session && event1.tab === event2.tab;
    }
  }
  return false;
};
