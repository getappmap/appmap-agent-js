import { assertDeepEqual } from "../../../__fixture__.mjs";
import {
  digestParameterPrimitive,
  digestExceptionSerial,
  digestParameterSerial,
  digestPayload,
} from "./payload.mjs";

const { undefined } = globalThis;

///////////////////////////
// digestParameterSerial //
///////////////////////////

assertDeepEqual(
  digestParameterSerial("name", {
    type: "symbol",
    print: "print",
    index: 123,
  }),
  {
    name: "name",
    object_id: 123,
    class: "symbol",
    value: "print",
  },
);

assertDeepEqual(
  digestParameterSerial("name", {
    type: "object",
    print: "print",
    index: 123,
    constructor: "constructor",
    specific: null,
  }),
  {
    name: "name",
    object_id: 123,
    class: "constructor",
    value: "print",
  },
);

assertDeepEqual(
  digestParameterSerial("name", {
    type: "object",
    print: "print",
    index: 123,
    constructor: "constructor",
    specific: {
      type: "array",
      length: 456,
    },
  }),
  {
    name: "name",
    object_id: 123,
    class: "constructor",
    value: "print",
    size: 456,
  },
);

assertDeepEqual(
  digestParameterSerial("name", {
    type: "object",
    print: "print",
    index: 123,
    constructor: "constructor",
    specific: {
      type: "hash",
      length: 456,
      properties: {
        name: "class",
      },
    },
  }),
  {
    name: "name",
    object_id: 123,
    class: "constructor",
    value: "print",
    size: 456,
    properties: [{ name: "name", class: "class" }],
  },
);

assertDeepEqual(
  digestParameterSerial("name", {
    type: "object",
    print: "print",
    index: 123,
    constructor: "constructor",
    specific: {
      type: "error",
      message: "message",
      stack: "stack",
    },
  }),
  {
    name: "name",
    object_id: 123,
    class: "constructor",
    value: "print",
  },
);

//////////////////////////////
// digestParameterPrimitive //
//////////////////////////////

assertDeepEqual(digestParameterPrimitive("name", "primitive"), {
  name: "name",
  object_id: undefined,
  class: "string",
  value: "primitive",
});

///////////////////////////
// digestExceptionSerial //
///////////////////////////

assertDeepEqual(
  digestExceptionSerial({
    type: "object",
    print: "print",
    index: 123,
    constructor: "constructor",
    specific: { type: "error", stack: "stack", message: "message" },
  }),
  {
    object_id: 123,
    class: "constructor",
    message: "message",
    path: "stack",
    lineno: undefined,
  },
);

assertDeepEqual(
  digestExceptionSerial({
    type: "object",
    print: "print",
    index: 123,
    constructor: "constructor",
    specific: null,
  }),
  {
    object_id: 123,
    class: "constructor",
    message: "print",
    path: undefined,
    lineno: undefined,
  },
);

assertDeepEqual(
  digestExceptionSerial({
    type: "symbol",
    print: "print",
    index: 123,
  }),
  {
    object_id: 123,
    class: "symbol",
    message: "print",
    path: undefined,
    lineno: undefined,
  },
);

assertDeepEqual(
  digestExceptionSerial({
    type: "string",
    print: "print",
  }),
  {
    object_id: 0,
    class: "string",
    message: "print",
    path: undefined,
    lineno: undefined,
  },
);

///////////////////
// digestPayload //
///////////////////

// apply >> routing //
assertDeepEqual(
  digestPayload(
    {
      type: "apply",
      function: "foobar",
      this: { type: "string", print: "print-this" },
      arguments: [{ type: "string", print: "print-arg" }],
    },
    {
      parameters: ["x"],
      link: null,
    },
  ),
  {
    parameters: [
      {
        class: "string",
        name: "x",
        object_id: undefined,
        value: "print-arg",
      },
    ],
    receiver: {
      class: "string",
      name: "this",
      object_id: undefined,
      value: "print-this",
    },
  },
);

// apply >> missing receiver //
assertDeepEqual(
  digestPayload(
    {
      type: "apply",
      function: "foobar",
      this: null,
      arguments: [],
    },
    {
      parameters: [],
      link: null,
    },
  ),
  {
    parameters: [],
    receiver: {
      class: "undefined",
      name: "this",
      object_id: undefined,
      value: "undefined",
    },
  },
);

// return //
assertDeepEqual(
  digestPayload(
    {
      type: "return",
      result: { type: "string", print: "print" },
    },
    null,
  ),
  {
    exceptions: undefined,
    return_value: {
      class: "string",
      name: "return",
      object_id: undefined,
      value: "print",
    },
  },
);

// throw //
assertDeepEqual(
  digestPayload(
    {
      type: "throw",
      error: {
        type: "object",
        print: "print",
        index: 123,
        constructor: "constructor",
        specific: { type: "error", message: "message", stack: "stack" },
      },
    },
    null,
  ),
  {
    exceptions: [
      {
        object_id: 123,
        class: "constructor",
        message: "message",
        path: "stack",
        lineno: undefined,
      },
    ],
    return_value: undefined,
  },
);

// request >> client >> message //
assertDeepEqual(
  digestPayload({
    type: "request",
    side: "client",
    method: "GET",
    protocol: "HTTP/1.1",
    url: "http://host:8080/path?search=param#hash",
    route: null,
    headers: {},
  }),
  {
    http_client_request: {
      request_method: "GET",
      url: "http://host:8080/path",
      headers: {},
    },
    message: [
      {
        name: "search",
        object_id: undefined,
        class: "string",
        value: "param",
      },
    ],
  },
);

// request >> client >> headers //
assertDeepEqual(
  digestPayload({
    type: "request",
    side: "client",
    method: "GET",
    protocol: "HTTP/1.1",
    url: "/path",
    route: null,
    headers: { HOST: "host:8080" },
  }),
  {
    http_client_request: {
      request_method: "GET",
      url: "http://host:8080/path",
      headers: { HOST: "host:8080" },
    },
    message: [],
  },
);

// request >> server >> message //
assertDeepEqual(
  digestPayload({
    type: "request",
    side: "server",
    method: "GET",
    protocol: "HTTP/1.1",
    url: "http://host:8080/path/info?search=param#hash",
    route: "/path/:info",
    headers: {},
  }),
  {
    http_server_request: {
      request_method: "GET",
      path_info: "/path/info",
      normalized_path_info: "/path/:info",
      protocol: "HTTP/1.1",
      headers: {},
    },
    message: [
      {
        name: ":info",
        object_id: undefined,
        class: "string",
        value: "info",
      },
      {
        name: "search",
        object_id: undefined,
        class: "string",
        value: "param",
      },
    ],
  },
);

// request >> server >> no message //
assertDeepEqual(
  digestPayload({
    type: "request",
    side: "server",
    method: "GET",
    protocol: "HTTP/1.1",
    url: "/path",
    route: null,
    headers: {},
  }),
  {
    http_server_request: {
      request_method: "GET",
      path_info: "/path",
      normalized_path_info: null,
      protocol: "HTTP/1.1",
      headers: {},
    },
    message: [],
  },
);

// response //
assertDeepEqual(
  digestPayload(
    {
      type: "response",
      side: "client",
      status: 200,
      headers: { "CONTENT-TYPE": "content-type" },
      body: {
        type: "string",
        print: "print",
      },
    },
    null,
  ),
  {
    http_client_response: {
      status_code: 200,
      headers: { "CONTENT-TYPE": "content-type" },
      return_value: {
        class: "string",
        name: "return",
        object_id: undefined,
        value: "print",
      },
    },
  },
);

// query //
assertDeepEqual(
  digestPayload({
    type: "query",
    database: "database",
    version: "version",
    sql: "sql",
    parameters: [{ type: "string", print: "print" }],
  }),
  {
    sql_query: {
      database_type: "database",
      server_version: "version",
      sql: "sql",
      explain_sql: undefined,
    },
    message: [
      {
        name: "0",
        object_id: undefined,
        class: "string",
        value: "print",
      },
    ],
  },
);

// answer //
assertDeepEqual(
  digestPayload(
    {
      type: "answer",
    },
    null,
  ),
  {},
);
