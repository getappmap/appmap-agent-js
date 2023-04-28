import { assertDeepEqual } from "../../__fixture__.mjs";
import { validateMessage } from "../../validate/index.mjs";
import { createConfiguration } from "../../configuration/index.mjs";
import { inflate, deflate } from "./index.mjs";

const test = (messages) => {
  messages.forEach(validateMessage);
  assertDeepEqual(inflate(deflate(messages)), messages);
};

///////////////
// not event //
///////////////

test([
  {
    type: "error",
    session: "session",
    error: {
      type: "null",
      print: "null",
    },
  },
]);

test([
  {
    type: "source",
    url: "protocol://host/source.js",
    content: "123;",
  },
]);

test([
  {
    type: "start",
    track: "track",
    configuration: createConfiguration("protocol://host/home/"),
  },
]);

test([
  {
    type: "stop",
    track: "track",
    termination: { type: "unknown" },
  },
]);

test([
  {
    type: "group",
    session: "session",
    group: 123,
    child: 456,
    description: "description",
  },
]);

test([
  {
    type: "amend",
    session: "session",
    tab: 123,
    site: "begin",
    payload: {
      type: "request",
      side: "server",
      protocol: "HTTP/1.1",
      method: "GET",
      url: "/",
      route: null,
      headers: {},
      body: {
        type: "null",
        print: "null",
      },
    },
  },
]);

// bundle //

test([
  {
    type: "event",
    session: "session",
    site: "begin",
    tab: 123,
    time: 456,
    group: 789,
    payload: { type: "bundle" },
  },
]);

test([
  {
    type: "event",
    session: "session",
    site: "end",
    tab: 123,
    time: 456,
    group: 789,
    payload: { type: "bundle" },
  },
]);

// jump //

test([
  {
    type: "event",
    session: "session",
    site: "before",
    tab: 123,
    time: 456,
    group: 789,
    payload: { type: "jump" },
  },
]);

test([
  {
    type: "event",
    session: "session",
    site: "after",
    tab: 123,
    time: 456,
    group: 789,
    payload: { type: "jump" },
  },
]);

// apply //

test([
  {
    type: "event",
    session: "session",
    site: "begin",
    tab: 123,
    time: 456,
    group: 789,
    payload: {
      type: "apply",
      function: "protocol://host/script.js:12:34",
      this: { type: "null", print: "null" },
      arguments: [{ type: "undefined", print: "undefined" }],
    },
  },
]);

test([
  {
    type: "event",
    session: "session",
    site: "end",
    tab: 123,
    time: 456,
    group: 789,
    payload: {
      type: "return",
      function: "protocol://host/script.js:12:34",
      result: { type: "null", print: "null" },
    },
  },
]);

test([
  {
    type: "event",
    session: "session",
    site: "end",
    tab: 123,
    time: 456,
    group: 789,
    payload: {
      type: "throw",
      function: "protocol://host/script.js:12:34",
      error: { type: "null", print: "null" },
    },
  },
]);

// await/yield //

test([
  {
    type: "event",
    session: "session",
    site: "before",
    tab: 123,
    time: 456,
    group: 789,
    payload: { type: "await", promise: { type: "null", print: "null" } },
  },
]);

test([
  {
    type: "event",
    session: "session",
    site: "before",
    tab: 123,
    time: 456,
    group: 789,
    payload: { type: "yield", iterator: { type: "null", print: "null" } },
  },
]);

test([
  {
    type: "event",
    session: "session",
    site: "after",
    tab: 123,
    time: 456,
    group: 789,
    payload: { type: "resolve", result: { type: "null", print: "null" } },
  },
]);

test([
  {
    type: "event",
    session: "session",
    site: "after",
    tab: 123,
    time: 456,
    group: 789,
    payload: { type: "reject", error: { type: "null", print: "null" } },
  },
]);

// http-client //

test([
  {
    type: "event",
    session: "session",
    site: "before",
    tab: 123,
    time: 456,
    group: 789,
    payload: {
      type: "request",
      side: "client",
      protocol: "HTTP/1.1",
      method: "GET",
      url: "/",
      route: null,
      headers: {},
      body: {
        type: "null",
        print: "null",
      },
    },
  },
]);

test([
  {
    type: "event",
    session: "session",
    site: "after",
    tab: 123,
    time: 456,
    group: 789,
    payload: {
      type: "response",
      side: "client",
      status: 200,
      message: "OK",
      headers: {},
      body: {
        type: "null",
        print: "null",
      },
    },
  },
]);

// http-server //

test([
  {
    type: "event",
    session: "session",
    site: "begin",
    tab: 123,
    time: 456,
    group: 789,
    payload: {
      type: "request",
      side: "server",
      protocol: "HTTP/1.1",
      method: "GET",
      url: "/",
      route: null,
      headers: {},
      body: {
        type: "null",
        print: "null",
      },
    },
  },
]);

test([
  {
    type: "event",
    session: "session",
    site: "end",
    tab: 123,
    time: 456,
    group: 789,
    payload: {
      type: "response",
      side: "server",
      status: 200,
      message: "OK",
      headers: {},
      body: {
        type: "null",
        print: "null",
      },
    },
  },
]);

// query //

test([
  {
    type: "event",
    session: "session",
    site: "before",
    tab: 123,
    time: 456,
    group: 789,
    payload: {
      type: "query",
      database: "database",
      version: "1.2.3",
      sql: "SELECT * FROM table;",
      parameters: [{ type: "null", print: "null" }],
    },
  },
]);

test([
  {
    type: "event",
    session: "session",
    site: "after",
    tab: 123,
    time: 456,
    group: 789,
    payload: {
      type: "answer",
    },
  },
]);
