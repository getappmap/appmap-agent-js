import { assertDeepEqual, makeAbsolutePath } from "../../../__fixture__.mjs";
import { buildTestDependenciesAsync } from "../../../build.mjs";
import Data from "./data.mjs";

const dependencies = await buildTestDependenciesAsync(import.meta.url);
const {
  compileCallData,
  compileReturnData,
  compileParameterPrimitive,
  compileExceptionSerial,
  compileParameterSerial,
} = Data(dependencies);

////////////
// serial //
////////////

// compileParameterSerial //

assertDeepEqual(
  compileParameterSerial("name", {
    type: "string",
    truncated: true,
    print: "print",
  }),
  {
    name: "name",
    object_id: null,
    class: "string",
    value: "print ...",
  },
);

assertDeepEqual(
  compileParameterSerial("name", {
    index: 123,
    constructor: "constructor",
    type: "object",
    print: "print",
  }),
  {
    name: "name",
    object_id: 123,
    class: "constructor",
    value: "print",
  },
);

// compileParameterPrimitive //

assertDeepEqual(compileParameterPrimitive("name", "primitive"), {
  name: "name",
  object_id: null,
  class: "string",
  value: "primitive",
});

// compileExceptionSerial //

assertDeepEqual(
  compileExceptionSerial({
    index: 123,
    constructor: "constructor",
    truncated: false,
    print: "print",
    specific: { type: "error", stack: "stack", message: "message" },
  }),
  {
    object_id: 123,
    class: "constructor",
    message: "message",
    path: "stack",
    lineno: null,
  },
);

assertDeepEqual(
  compileExceptionSerial({
    type: "string",
    print: "print",
  }),
  {
    object_id: null,
    class: "string",
    message: null,
    path: null,
    lineno: null,
  },
);

/////////////////////
// compileCallData //
/////////////////////

// apply >> routing //
assertDeepEqual(
  compileCallData(
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
        object_id: null,
        value: "print-arg",
      },
    ],
    receiver: {
      class: "string",
      name: "this",
      object_id: null,
      value: "print-this",
    },
  },
);

// apply >> missing receiver //
assertDeepEqual(
  compileCallData(
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
      object_id: null,
      value: "undefined",
    },
  },
);

// response >> message //
assertDeepEqual(
  compileCallData({
    type: "response",
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
      authorization: null,
      mime_type: null,
      headers: {},
    },
    message: [
      {
        name: ":info",
        object_id: null,
        class: "string",
        value: "info",
      },
      {
        name: "search",
        object_id: null,
        class: "string",
        value: "param",
      },
    ],
  },
);

// response >> headers //
assertDeepEqual(
  compileCallData({
    type: "response",
    method: "GET",
    protocol: "HTTP/1.1",
    url: makeAbsolutePath("path"),
    route: null,
    headers: {
      AUTHORIZATION: "authorization",
      "CONTENT-TYPE": "content-type",
    },
  }),
  {
    http_server_request: {
      request_method: "GET",
      path_info: makeAbsolutePath("path"),
      normalized_path_info: null,
      protocol: "HTTP/1.1",
      authorization: "authorization",
      mime_type: "content-type",
      headers: {
        AUTHORIZATION: "authorization",
        "CONTENT-TYPE": "content-type",
      },
    },
    message: [],
  },
);

/////////////////////
// compileCallData //
/////////////////////

// query //
assertDeepEqual(
  compileCallData({
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
      explain_sql: null,
    },
    message: [
      {
        name: "0",
        object_id: null,
        class: "string",
        value: "print",
      },
    ],
  },
);

// request >> message //
assertDeepEqual(
  compileCallData({
    type: "request",
    method: "GET",
    protocol: "HTTP/1.1",
    url: "http://host:8080/path?search=param#hash",
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
        object_id: null,
        class: "string",
        value: "param",
      },
    ],
  },
);

// request >> headers //
assertDeepEqual(
  compileCallData({
    type: "request",
    method: "GET",
    protocol: "HTTP/1.1",
    url: makeAbsolutePath("path"),
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

/////////////////////
// compileCallData //
/////////////////////

// apply >> success //
assertDeepEqual(
  compileReturnData(
    {
      type: "apply",
      error: null,
      result: { type: "string", print: "print" },
    },
    null,
  ),
  {
    exceptions: null,
    return_value: {
      class: "string",
      name: "return",
      object_id: null,
      value: "print",
    },
  },
);

// apply >> failure //
assertDeepEqual(
  compileReturnData(
    {
      type: "apply",
      error: {
        index: 123,
        constructor: "constructor",
        print: "print",
        specific: { type: "error", message: "message", stack: "stack" },
      },
      result: null,
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
        lineno: null,
      },
    ],
    return_value: null,
  },
);

// response //
assertDeepEqual(
  compileReturnData(
    {
      type: "response",
      status: 200,
      headers: { "CONTENT-TYPE": "content-type" },
    },
    null,
  ),
  {
    http_server_response: {
      status_code: 200,
      mime_type: "content-type",
    },
  },
);

/////////////////////
// compileCallData //
/////////////////////

// query //
assertDeepEqual(
  compileReturnData(
    {
      type: "query",
    },
    null,
  ),
  {},
);

// request //
assertDeepEqual(
  compileReturnData(
    {
      type: "request",
      status: 200,
      headers: { "CONTENT-TYPE": "content-type" },
    },
    null,
  ),
  {
    http_client_response: {
      status_code: 200,
      mime_type: "content-type",
      headers: { "CONTENT-TYPE": "content-type" },
    },
  },
);
