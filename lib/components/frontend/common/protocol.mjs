
export const createProtocol = (session, {instrumenter, serializer}) => {
  const serialize = (value) => serializer.serialize(value);
  return {

    recordBeforeApply: (_function, _this, _arguments) => session.recordBefore(
      "apply",
      {
        function: _function,
        this: serializer.serialize(_this),
        arguments: _arguments.map((serialize))
      }
    ),
    recordAfterApply: (id, error, result) => session.recordAfter(
      id,
      {
        error: serializer.serializeError(error),
        result: serializer.serialize(result)
      }
    ),
    recordBeforeQuery: (common, sql, parameters) => session.recordBefore(
      "query",
      {
        common,
        sql,
        parameters
      }
    ),
    recordAfterQuery: (id) => session.recordAfter(
      id,
      null
    ),
    recordBeforeRequest: (method, url, headers) => session.recordBefore(
      "request",
      {
        method,
        url,
        headers,
      }
    ),
    recordAfterRequest: (id, status, message, headers) => session.recordAfter(
      id,
      {
        status,
        message,
        headers
      }
    ),
    recordBeforeRequest: (method, url, headers, route) => session.recordBefore(
      "response",
      {
        method,
        url,
        headers,
        route,
      }
    ),
    recordAfterRequest: (id, status, message, headers) => session.recordAfter(
      id,
      {
        status,
        message,
        headers
      }
    ),
  };
};
