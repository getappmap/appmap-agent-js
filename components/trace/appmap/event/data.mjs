const _URL = URL;
const _URLSearchParams = URLSearchParams;
const _String = String;
const _undefined = undefined;

const { entries: toEntries } = Object;
const { from: arrayFrom } = Array;

export default (dependencies) => {
  const {
    util: { assert, coalesceCaseInsensitive, zip, mapMaybe },
  } = dependencies;

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

  const compileCallData = (data, options) => {
    const { type } = data;
    if (type === "apply") {
      const { this: _this, arguments: _arguments } = data;
      const { link, parameters } = options;
      return {
        ...link,
        // TODO: It would make more sense to allow receiver to be null.
        // receiver: mapMaybe(this, compileParameterSerialThis),
        receiver:
          _this === null
            ? compileParameterPrimitive("this", _undefined)
            : compileParameterSerialThis(_this),
        parameters: zip(parameters, _arguments).map(
          compileParameterSerialTuple,
        ),
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
        message: toEntries(parameters).map(compileParameterSerialTuple),
      };
    }
    if (type === "server") {
      const { protocol, method, url, headers, route } = data;
      const { pathname, search } = parseURL(url, headers);
      return {
        http_server_request: {
          protocol,
          request_method: method,
          path_info: pathname,
          normalized_path_info: route,
          headers,
        },
        message: [
          ...(route === null
            ? []
            : zip(route.split("/"), pathname.split("/")).filter(isFirstColon)),
          ...compileSearchMessage(search),
        ].map(compileParameterPrimitiveTuple),
      };
    }
    if (type === "client") {
      const { method, url, headers } = data;
      const { origin, pathname, search } = parseURL(url, headers);
      return {
        http_client_request: {
          request_method: method,
          url: `${origin}${pathname}`,
          headers,
        },
        message: compileSearchMessage(search).map(
          compileParameterPrimitiveTuple,
        ),
      };
    }
    /* c8 ignore start */
    assert(false, "invalid call event type");
    /* c8 ignore stop */
  };

  const compileReturnData = (data, options) => {
    const { type } = data;
    if (type === "apply") {
      const { result, error } = data;
      return {
        return_value: mapMaybe(result, compileParameterSerialReturn),
        exceptions: error === null ? null : [compileExceptionSerial(error)],
      };
    } else if (type === "query") {
      return {};
    } else {
      assert(
        type === "server" || type === "client",
        "invalid return event type",
      );
      const { status, headers, body } = data;
      return {
        [`http_${type}_response`]: {
          status_code: status,
          headers,
          return_value: mapMaybe(body, compileParameterSerialReturn),
        },
      };
    }
  };

  const compileParameterPrimitive = (name, primitive) => ({
    name,
    class: typeof primitive,
    object_id: null,
    value: _String(primitive),
  });

  const compileParameterPrimitiveTuple = ([name, primitive]) =>
    compileParameterPrimitive(name, primitive);

  const compileSpecific = (specific) => {
    if (specific === null) {
      return null;
    } else if (specific.type === "array") {
      return { size: specific.length };
    } else if (specific.type === "hash") {
      return { size: specific.length, properties: specific.properties };
    } else {
      return null;
    }
  };

  const compileParameterSerial = (name, serial) => {
    if (serial.type === "object" || serial.type === "function") {
      return {
        name,
        class: serial.constructor,
        object_id: serial.index,
        value: serial.print,
        ...compileSpecific(serial.specific),
      };
    } else {
      return {
        name,
        class: serial.type,
        object_id: serial.type === "symbol" ? serial.index : null,
        value: serial.print,
      };
    }
  };

  const compileParameterSerialReturn = (serial) =>
    compileParameterSerial("return", serial);

  const compileParameterSerialThis = (serial) =>
    compileParameterSerial("this", serial);

  const compileParameterSerialTuple = ([name, serial]) =>
    compileParameterSerial(name, serial);

  const extractErrorSpecific = (specific) =>
    specific !== null && specific.type === "error"
      ? specific
      : { message: null, stack: null };

  const compileExceptionSerial = (serial) => {
    if (serial.type === "object" || serial.type === "function") {
      const { message, stack } = extractErrorSpecific(serial.specific);
      return {
        class: serial.constructor,
        message,
        object_id: serial.index,
        // TODO: extract path from stack
        path: stack,
        // TODO: extract line number from stack
        lineno: null,
      };
    } else {
      return {
        class: serial.type,
        message: null,
        object_id: serial.type === "symbol" ? serial.index : null,
        path: null,
        lineno: null,
      };
    }
  };

  return {
    compileParameterPrimitive, // export for testing
    compileParameterSerial, // export for testing
    compileExceptionSerial, // export for testing
    compileCallData,
    compileReturnData,
  };
};
