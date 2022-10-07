const {
  Array: { isArray, from: toArray },
  Object: { fromEntries, entries: toEntries },
  URL,
} = globalThis;

const { search: __search } = new URL(import.meta.url);

const { constant } = await import(`../../util/index.mjs${__search}`);
const { serialize } = await import(`../../serialization/index.mjs${__search}`);

export const getJumpPayload = constant({ type: "jump" });

export const getBundlePayload = constant({ type: "bundle" });

export const formatApplyPayload = (
  { serialization },
  _function,
  _this,
  _arguments,
) => ({
  type: "apply",
  function: _function,
  this: serialize(serialization, _this),
  arguments: _arguments.map((argument) => serialize(serialization, argument)),
});

export const formatReturnPayload = ({ serialization }, _function, result) => ({
  type: "return",
  function: _function,
  result: serialize(serialization, result),
});

export const formatThrowPayload = ({ serialization }, _function, error) => ({
  type: "throw",
  function: _function,
  error: serialize(serialization, error),
});

export const formatAwaitPayload = ({ serialization }, promise) => ({
  type: "await",
  promise: serialize(serialization, promise),
});

export const formatResolvePayload = ({ serialization }, result) => ({
  type: "resolve",
  result: serialize(serialization, result),
});

export const formatRejectPayload = ({ serialization }, error) => ({
  type: "reject",
  error: serialize(serialization, error),
});

export const formatYieldPayload = ({ serialization }, iterator) => ({
  type: "yield",
  iterator: serialize(serialization, iterator),
});

export const getResumePayload = constant({ type: "resume" });

export const formatRequestPayload = (
  { serialization },
  side,
  protocol,
  method,
  url,
  route,
  headers,
  body,
) => ({
  type: "request",
  side,
  protocol,
  method,
  url,
  route,
  headers,
  body: serialize(serialization, body),
});

export const formatResponsePayload = (
  { serialization },
  side,
  status,
  message,
  headers,
  body,
) => ({
  type: "response",
  side,
  status,
  message,
  headers,
  body: serialize(serialization, body),
});

export const formatQueryPayload = (
  { serialization },
  database,
  version,
  sql,
  parameters,
) => ({
  type: "query",
  database,
  version,
  sql,
  parameters: isArray(parameters)
    ? parameters.map((parameter) => serialize(serialization, parameter))
    : fromEntries(
        toArray(toEntries(parameters)).map(([name, parameter]) => [
          name,
          serialize(serialization, parameter),
        ]),
      ),
});

export const getAnswerPayload = constant({ type: "answer" });

export const formatGroupPayload = ({}, group, description) => ({
  type: "group",
  group,
  description,
});

export const formatUngroupPayload = ({}, group) => ({
  type: "ungroup",
  group,
});
