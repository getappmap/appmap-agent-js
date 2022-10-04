const {
  Error,
  URL,
  URLSearchParams,
  String,
  undefined,
  Object: { entries: toEntries },
  Array: { from: arrayFrom },
} = globalThis;

const { search: __search } = new URL(import.meta.url);

const {
  assert,
  coalesceCaseInsensitive,
  zip,
  hasOwnProperty,
  mapMaybe,
  recoverMaybe,
} = await import(`../../../util/index.mjs${__search}`);

const parseURL = (url, headers) =>
  new URL(
    url[0] === "/"
      ? `http://${coalesceCaseInsensitive(headers, "host", "localhost")}${url}`
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

const digestSearchMessage = (search) =>
  arrayFrom(new URLSearchParams(search).entries());

// export for testing
export const digestParameterPrimitive = (name, primitive) => ({
  name,
  class: typeof primitive,
  object_id: null,
  value: String(primitive),
});

const digestParameterPrimitiveTuple = ([name, primitive]) =>
  digestParameterPrimitive(name, primitive);

const digestSpecificHashEntry = ([key, value]) => ({
  name: key,
  class: value,
});

const digestSpecific = (specific) => {
  if (specific === null) {
    return null;
  } else if (specific.type === "array") {
    return { size: specific.length };
  } else if (specific.type === "hash") {
    return {
      size: specific.length,
      properties: toEntries(specific.properties).map(digestSpecificHashEntry),
    };
  } else {
    return null;
  }
};

// export for testing
export const digestParameterSerial = (name, serial) => {
  if (serial.type === "object" || serial.type === "function") {
    return {
      name,
      class: serial.constructor,
      object_id: serial.index,
      value: serial.print,
      ...digestSpecific(serial.specific),
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

const digestParameterSerialReturn = (serial) =>
  digestParameterSerial("return", serial);

const digestParameterSerialTuple = ([name, serial]) =>
  digestParameterSerial(name, serial);

const extractErrorSpecific = (specific) =>
  specific !== null && specific.type === "error"
    ? specific
    : { message: null, stack: null };

// export for testing
export const digestExceptionSerial = (serial) => {
  if (serial.type === "object" || serial.type === "function") {
    const { message, stack } = extractErrorSpecific(serial.specific);
    return {
      class: serial.constructor,
      message: recoverMaybe(message, serial.print),
      object_id: serial.index,
      // TODO: extract path from stack
      path: stack,
      // TODO: extract line number from stack
      lineno: null,
    };
  } else {
    return {
      class: serial.type,
      message: serial.print,
      object_id: serial.type === "symbol" ? serial.index : 0,
      path: null,
      lineno: null,
    };
  }
};

const digesters = {
  // function //
  apply: ({ this: _this, arguments: _arguments }, { link, parameters }) => ({
    ...link,
    // TODO: It would make more sense to allow receiver to be null.
    // receiver: mapMaybe(this, digestParameterSerialThis),
    receiver:
      _this === null
        ? digestParameterPrimitive("this", undefined)
        : digestParameterSerial("this", _this),
    parameters: zip(parameters, _arguments).map(digestParameterSerialTuple),
  }),
  return: ({ result }, _options) => ({
    return_value: digestParameterSerial("return", result),
    exceptions: null,
  }),
  throw: ({ error }, _options) => ({
    return_value: null,
    exceptions: [digestExceptionSerial(error)],
  }),
  // http //
  request: ({ side, protocol, method, url, headers, route }, _options) => {
    const { origin, pathname, search } = parseURL(url, headers);
    if (side === "server") {
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
          ...digestSearchMessage(search),
        ].map(digestParameterPrimitiveTuple),
      };
    } else if (side === "client") {
      return {
        http_client_request: {
          request_method: method,
          url: `${origin}${pathname}`,
          headers,
        },
        message: digestSearchMessage(search).map(digestParameterPrimitiveTuple),
      };
    } /* c8 ignore start */ else {
      throw new Error("invalid request side");
    } /* c8 ignore stop */
  },
  response: ({ side, status, headers, body }, _options) => ({
    [`http_${side}_response`]: {
      status_code: status,
      headers,
      return_value: mapMaybe(body, digestParameterSerialReturn),
    },
  }),
  // sql //
  query: ({ database, version, sql, parameters }, _options) => ({
    sql_query: {
      database_type: database,
      server_version: version,
      sql,
      explain_sql: null,
    },
    message: toEntries(parameters).map(digestParameterSerialTuple),
  }),
  answer: ({}, _options) => ({}),
};

export const digestPayload = (payload, options) => {
  const { type } = payload;
  assert(hasOwnProperty(digesters, type), "cannot digest payload");
  return digesters[type](payload, options);
};
