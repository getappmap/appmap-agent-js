/* globals URL, URLSearchParams */
const _URL = URL;
const _URLSearchParams = URLSearchParams;
const _String = String;
import Classmap from "../classmap.mjs";

const { entries: toEntries } = Object;
const { from: arrayFrom } = Array;

export default (dependencies) => {
  const {
    util: { assert, coalesceCaseInsensitive, zip },
  } = dependencies;
  const { getClassmapClosure } = Classmap(dependencies);

  const parseURL = (url, headers) =>
    new _URL(
      url[0] === "/"
        ? `http://${coalesceCaseInsensitive(
            headers,
            "host",
            "localhost",
          )}${url}`
        : url,
    );

  // const placeholder = {
  //   link: {
  //     defined_class: "MANUFACTURED_APPMAP_CLASS",
  //     lineno: 0,
  //     method_id: "MANUFACTURED_APPMAP_METHOD",
  //     static: false,
  //     path: "MANUFACTURED_APPMAP_FILE.js",
  //   },
  //   parameters: [],
  // };

  const isFirstColon = ([string]) => string.startsWith(":");

  const compileSearchMessage = (search) =>
    arrayFrom(new _URLSearchParams(search).entries());

  const compileCallData = (data, classmap) => {
    const { type } = data;
    if (type === "apply") {
      const { function: route, this: _this, arguments: _arguments } = data;
      const { link, parameters } = getClassmapClosure(classmap, route);
      // route === null ? placeholder : getClassmapClosure(classmap, route);
      return {
        ...link,
        receiver: compileParameterSerial(["this", _this]),
        parameters: zip(parameters, _arguments).map(compileParameterSerial),
      };
    }
    if (type === "response") {
      const { protocol, method, url, headers, route } = data;
      const { pathname, search } = parseURL(url, headers);
      return {
        http_server_request: {
          headers,
          authorization: coalesceCaseInsensitive(
            headers,
            "authorization",
            null,
          ),
          mime_type: coalesceCaseInsensitive(headers, "content-type", null),
          request_method: method,
          path_info: pathname,
          normalized_path_info: route,
          protocol,
        },
        message: [
          ...(route === null
            ? []
            : zip(route.split("/"), pathname.split("/")).filter(isFirstColon)),
          ...compileSearchMessage(search),
        ].map(compileParameterPrimitive),
      };
    }
    if (type === "query") {
      const { database, version, sql, parameters } = data;
      return {
        sql_query: {
          database_type: database,
          server_version: version,
          sql,
          explain_sql: null,
        },
        message: toEntries(parameters).map(compileParameterSerial),
      };
    }
    if (type === "request") {
      const { method, url, headers } = data;
      const { origin, pathname, search } = parseURL(url, headers);
      return {
        http_client_request: {
          request_method: method,
          url: `${origin}${pathname}`,
          headers,
        },
        message: compileSearchMessage(search).map(compileParameterPrimitive),
      };
    }
    /* c8 ignore start */
    assert(false, "invalid call event type");
    /* c8 ignore stop */
  };

  const compileReturnData = (data, classmap) => {
    const { type } = data;
    if (type === "apply") {
      const { result, error } = data;
      return {
        return_value:
          result === null ? null : compileParameterSerial(["return", result]),
        exceptions: error === null ? null : [compileExceptionSerial(error)],
      };
    }
    if (type === "response") {
      const { status, headers } = data;
      return {
        http_server_response: {
          status_code: status,
          mime_type: coalesceCaseInsensitive(headers, "content-type", null),
        },
      };
    }
    if (type === "query") {
      return {};
    }
    if (type === "request") {
      const { status, headers } = data;
      return {
        http_client_response: {
          status_code: status,
          mime_type: coalesceCaseInsensitive(headers, "content-type", null),
          headers,
        },
      };
    }
    /* c8 ignore start */
    assert(false, "invalid return event type");
    /* c8 ignore stop */
  };

  const compileParameterPrimitive = ([name, primitive]) => ({
    name,
    class: typeof primitive,
    object_id: null,
    value: _String(primitive),
  });

  const compileParameterSerial = ([name, serial]) => {
    const {
      type,
      constructor: _constructor,
      index,
      truncated,
      print,
    } = {
      type: null,
      constructor: null,
      index: null,
      truncated: false,
      print: null,
      ...serial,
    };
    return {
      name,
      class: _constructor === null ? type : _constructor,
      object_id: index,
      value: truncated ? `${print} ...` : print,
    };
  };

  const compileExceptionSerial = (serial) => {
    const {
      type,
      constructor: _constructor,
      index,
      specific,
    } = {
      type: null,
      constructor: null,
      index: null,
      specific: null,
      ...serial,
    };
    let stack = null;
    let message = null;
    if (specific !== null) {
      const { type } = specific;
      if (type === "error") {
        ({ stack, message } = specific);
      }
    }
    return {
      class: _constructor === null ? type : _constructor,
      message,
      object_id: index,
      // TODO: extract path from stack
      path: stack,
      // TODO: extract line number from stack
      lineno: null,
    };
  };

  return {
    compileParameterPrimitive, // export for testing
    compileParameterSerial, // export for testing
    compileExceptionSerial, // export for testing
    compileCallData,
    compileReturnData,
  };
};
