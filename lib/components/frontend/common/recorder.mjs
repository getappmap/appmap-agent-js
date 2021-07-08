
export const create = ({recordBeforeEvent, recordAfterEvent}, {serialize, serializeError}) => ({
  recordBeforeApplyEvent: (_function, _this, _arguments) => recordBeforeEvent(
    "apply",
    {
      function: _function,
      this: serialize(_this),
      arguments: _arguments.map((serialize))
    }
  ),
  recordAfterApplyEvent: (id, error, result) => recordAfterEvent(
    id,
    {
      error: serializeError(error),
      result: serialize(result)
    }
  ),
  recordBeforeQueryEvent: (database, sql, parameters) => recordBeforeEvent(
    "query",
    {
      database,
      sql,
      parameters
    }
  ),
  recordAfterQueryEvent: (id) => recordAfterEvent(
    id,
    null
  ),
  recordBeforeRequestEvent: (method, url, headers) => recordBeforeEvent(
    "request",
    {
      method,
      url,
      headers,
    }
  ),
  recordAfterRequestEvent: (id, status, message, headers) => recordAfterEvent(
    id,
    {
      status,
      message,
      headers
    }
  ),
  recordBeforeRequestEvent: (method, url, headers, route) => recordBeforeEvent(
    "response",
    {
      method,
      url,
      headers,
      route,
    }
  ),
  recordAfterRequestEvent: (id, status, message, headers) => recordAfterEvent(
    id,
    {
      status,
      message,
      headers
    }
  ),
});
