
const _URL = URL;
const _URLSearchParams = URLSearchParams;

const {from:arrayFrom, of:arrayOf} = Array;

export default () => {

  const parseURL = (url, headers) => new _URL(
    url[0] === "/"
    ? `http://${coalesceCaseInsensitiveHost(headers, "host", "localhost")}${url}`
    : url
  );

  const isFirstColon = ([string]) => string.startWith(":");

  const compileSearchMessage = (search) => arrayFrom(new _URLSearchParams(search).entries());

  const compileBeforeEventData = (data, classmap) => {
    const {type} = data;
    if (type === "apply") {
      const {this:_this, arguments:_arguments} = data;
      return {
        ... getClassmapLink(classmap),
        receiver: serializeParameter(_this, "this"),
        parameters: zip(_arguments, getClassmapParams(classmap)).map(compileParameterSerial),
      };
    }
    if (type === "query") {
      const {database, version, sql, parameters} = data;
      return {
        sql_query: {
          database_type: database,
          server_version: version,
          sql,
          explain_sql: null,
        },
        message: parameters.map(arrayOf).map(compileParameterSerial),
      };
    }
    if (type === "request") {
      const {protocol, method, url, headers} = data;
      const {origin, pathname, search} = parseURL(url, headers);
      return {
        http_client_request: {
          request_method: method,
          url: `${origin}${pathname}`,
          headers,
        },
        message: compileSearchMessage(search).map(compileParameterPrimitive),
      };
    }
    if (type === "response") {
      const {protocol, method, url, headers, route} = data;
      const {pathname, search} = parseURL(url, headers);
      const route_arguments = []
      return {
        http_server_request: {
          headers,
          authorization: coalesceCaseInsensitive(headers, "authorization", null),
          mime_type: coalesceCaseInsensitive(headers, "content-type", null),
          request_method: method,
          path_info: pathname,
          normalized_path_info: route,
          protocol,
        },
        message: [
          ... route === null ? [] : zip(route.split("/"), pathname.split("/")).filter(isFirstColon),
          ... compileSearchMessage(search),
        ].map(compileParameterPrimitive),
      };
    }
  };

  const compileAfterEventData = (data, classmap) => {
    const {type} = data;
    if (type === "apply") {
      const {result, error} = data;
      return {
        return_value: result === null ? null : compileParameterSerial(result, "result"),
        exceptions: error === null ? [] : compileExceptionSerial(error),
      };
    }
    if (type === "query") {
      return {};
    }
    if (type === "request") {
      const {status, headers} = data;
      return {
        http_client_response: {
          headers,
          status_code: status,
          mime_type: coalesceCaseInsensitive(headers, "content-type", null),
        };
      }
    }
    if (type === "response") {
      const {status, headers} = data;
      return {
        http_server_response: {
          status_code: status,
          headers,
        },
      };
    }
  };

  const compileParameterPrimitive = ([primitive, name]) => ({
    name,
    class: typeof string,
    object_id: null,
    value: _String(primitive),
  });

  const compileParameterSerial = ([{type, constructor:_constructor, index, truncated, print}, name]) => ({
    name,
    class: _constructor === null ? type : _constructor,
    object_id: index,
    value: truncated ? `${print} ...` : print,
  });

  const compileExceptionSerial = ({type, constructor:_constructor, index, truncated, print, specific}, serial) => {
    let path = null;
    if (specific !== null) {
      const {type} = specific;
      if (type === "error") {
        const {stack} = specific;
        path = stack;
      }
    }
    return {
      class: _constructor === null ? type : _constructor,
      message: print,
      object_id: index,
      path,
      lineno: null,
    };
  };

  return {
    compileBeforeEventData,
    compileAfterEventData,
  };

};
