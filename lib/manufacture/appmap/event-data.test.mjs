import { strict as Assert } from "assert";
import { buildTestAsync } from "../../../build/index.mjs";
import Classmap from "./classmap.mjs";
import EventData from "./event-data.mjs";

Error.stackTraceLimit = Infinity;

const {
  deepEqual: assertDeepEqual,
  throws: assertThrows,
  // equal: assertEqual,
} = Assert;

const testAsync = async () => {
  const dependencies = await buildTestAsync({
    ...import.meta,
    deps: ["configuration"],
  });
  const {
    configuration: { createConfiguration, extendConfiguration },
  } = dependencies;
  const { createClassmap, addClassmapFile } = Classmap(dependencies);
  const {
    compileBeforeEventData,
    compileAfterEventData,
    compileParameterPrimitive,
    compileExceptionSerial,
    compileParameterSerial,
  } = EventData(dependencies);
  const default_serial = {
    type: null,
    index: null,
    constructor: null,
    truncated: false,
    print: null,
    specific: null,
  };
  const configuration = extendConfiguration(createConfiguration("/cwd"), {
    "function-name-placeholder": "$",
  });
  const classmap = createClassmap(configuration);
  addClassmapFile(classmap, {
    index: 123,
    path: "/cwd/filename.js",
    type: "script",
    code: "function f (x) {}",
  });

  ////////////
  // serial //
  ////////////

  // compileParameterSerial //

  assertDeepEqual(
    compileParameterSerial([
      "name",
      { ...default_serial, type: "string", truncated: true, print: "print" },
    ]),
    {
      name: "name",
      object_id: null,
      class: "string",
      value: "print ...",
    },
  );

  assertDeepEqual(
    compileParameterSerial([
      "name",
      {
        ...default_serial,
        index: 123,
        constructor: "constructor",
        type: "object",
        print: "print",
      },
    ]),
    {
      name: "name",
      object_id: 123,
      class: "constructor",
      value: "print",
    },
  );

  // compileParameterPrimitive //

  assertDeepEqual(compileParameterPrimitive(["name", "primitive"]), {
    name: "name",
    object_id: null,
    class: "string",
    value: "primitive",
  });

  // compileExceptionSerial //

  assertDeepEqual(
    compileExceptionSerial({
      ...default_serial,
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
      ...default_serial,
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

  ////////////////////////
  // compileBeforeEvent //
  ////////////////////////

  // invalid //
  assertThrows(
    () => compileBeforeEventData({ type: "invalid" }),
    /^AppmapError: invalid \(before\) event type/,
  );

  // apply //
  assertDeepEqual(
    compileBeforeEventData(
      {
        type: "apply",
        function: "123/body/0",
        this: { ...default_serial, type: "string", print: "this-print" },
        arguments: [{ ...default_serial, type: "string", print: "arg-print" }],
      },
      classmap,
    ),
    {
      defined_class: "$",
      lineno: 1,
      method_id: "f",
      static: false,
      path: "filename.js",
      parameters: [
        {
          class: "string",
          name: "x",
          object_id: null,
          value: "arg-print",
        },
      ],
      receiver: {
        class: "string",
        name: "this",
        object_id: null,
        value: "this-print",
      },
    },
  );

  // query //
  assertDeepEqual(
    compileBeforeEventData({
      type: "query",
      database: "database",
      version: "version",
      sql: "sql",
      parameters: [{ ...default_serial, type: "string", print: "print" }],
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
          name: 0,
          object_id: null,
          class: "string",
          value: "print",
        },
      ],
    },
  );

  // request >> message //
  assertDeepEqual(
    compileBeforeEventData({
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
    compileBeforeEventData({
      type: "request",
      method: "GET",
      protocol: "HTTP/1.1",
      url: "/path",
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

  // response >> message //
  assertDeepEqual(
    compileBeforeEventData({
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
    compileBeforeEventData({
      type: "response",
      method: "GET",
      protocol: "HTTP/1.1",
      url: "/path",
      route: null,
      headers: {
        AUTHORIZATION: "authorization",
        "CONTENT-TYPE": "content-type",
      },
    }),
    {
      http_server_request: {
        request_method: "GET",
        path_info: "/path",
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

  ///////////////////////
  // compileAfterEvent //
  ///////////////////////

  // invalid //
  assertThrows(
    () => compileAfterEventData({ type: "invalid" }),
    /^AppmapError: invalid \(after\) event type/,
  );

  // apply >> success //
  assertDeepEqual(
    compileAfterEventData(
      {
        type: "apply",
        error: null,
        result: { ...default_serial, type: "string", print: "print" },
      },
      classmap,
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
    compileAfterEventData(
      {
        type: "apply",
        error: {
          ...default_serial,
          index: 123,
          constructor: "constructor",
          print: "print",
          specific: { type: "error", message: "message", stack: "stack" },
        },
        result: null,
      },
      classmap,
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
  // query //
  assertDeepEqual(
    compileAfterEventData(
      {
        type: "query",
      },
      classmap,
    ),
    {},
  );
  // request //
  assertDeepEqual(
    compileAfterEventData(
      {
        type: "request",
        status: 200,
        headers: { "CONTENT-TYPE": "content-type" },
      },
      classmap,
    ),
    {
      http_client_response: {
        status_code: 200,
        mime_type: "content-type",
        headers: { "CONTENT-TYPE": "content-type" },
      },
    },
  );
  // response //
  assertDeepEqual(
    compileAfterEventData(
      {
        type: "response",
        status: 200,
        headers: { "CONTENT-TYPE": "content-type" },
      },
      classmap,
    ),
    {
      http_server_response: {
        status_code: 200,
        mime_type: "content-type",
      },
    },
  );
};

testAsync();
