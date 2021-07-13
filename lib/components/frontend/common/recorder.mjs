
export const createRecorder = ({recordBefore, recordAfter}, {serialize, serializeError}) => ({
  recordBeforeApply: (_function, _this, _arguments) => recordBefore(
    "apply",
    {
      function: _function,
      this: serialize(_this),
      arguments: _arguments.map((serialize))
    }
  ),
  recordAfterApply: (id, error, result) => recordAfter(
    id,
    {
      error: serializeError(error),
      result: serialize(result)
    }
  ),
  recordBeforeQuery: (database, sql, parameters) => recordBefore(
    "query",
    {
      database,
      sql,
      parameters
    }
  ),
  recordAfterQuery: (id) => recordAfter(
    id,
    null
  ),
  recordBeforeRequest: (method, url, headers) => recordBefore(
    "request",
    {
      method,
      url,
      headers,
    }
  ),
  recordAfterRequest: (id, status, message, headers) => recordAfter(
    id,
    {
      status,
      message,
      headers
    }
  ),
  recordBeforeRequest: (method, url, headers, route) => recordBefore(
    "response",
    {
      method,
      url,
      headers,
      route,
    }
  ),
  recordAfterRequest: (id, status, message, headers) => recordAfter(
    id,
    {
      status,
      message,
      headers
    }
  ),
});
