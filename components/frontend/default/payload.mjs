import { toString, toInteger } from "./convert.mjs";

const { isArray, from: toArray } = Array;
const { fromEntries, entries: toEntries } = Object;

export default (dependencies) => {
  const {
    util: { constant },
    serialization: { serialize },
  } = dependencies;

  const hasStringKey = ([key]) => typeof key === "string";

  const printValue = ([key, value]) => [key, toString(value)];

  const formatHeaders = (headers) =>
    fromEntries(toEntries(headers).filter(hasStringKey).map(printValue));

  return {
    getJumpPayload: constant({ type: "jump" }),
    getBundlePayload: constant({ type: "bundle" }),
    formatApplyPayload: ({ serialization }, _function, _this, _arguments) => ({
      type: "apply",
      function: _function,
      this: serialize(serialization, _this),
      arguments: _arguments.map((argument) =>
        serialize(serialization, argument),
      ),
    }),
    formatReturnPayload: ({ serialization }, _function, result) => ({
      type: "return",
      function: _function,
      result: serialize(serialization, result),
    }),
    formatThrowPayload: ({ serialization }, _function, error) => ({
      type: "throw",
      function: _function,
      error: serialize(serialization, error),
    }),
    formatAwaitPayload: ({ serialization }, promise) => ({
      type: "await",
      promise: serialize(serialization, promise),
    }),
    formatResolvePayload: ({ serialization }, result) => ({
      type: "resolve",
      result: serialize(serialization, result),
    }),
    formatRejectPayload: ({ serialization }, error) => ({
      type: "reject",
      error: serialize(serialization, error),
    }),
    formatYieldPayload: ({ serialization }, iterator) => ({
      type: "yield",
      iterator: serialize(serialization, iterator),
    }),
    getResumePayload: constant({ type: "resume" }),
    formatRequestPayload: (
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
      headers: formatHeaders(headers),
      body: serialize(serialization, body),
    }),
    formatResponsePayload: (
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
      status: toInteger(status),
      headers: formatHeaders(headers),
      body: serialize(serialization, body),
    }),
    formatQueryPayload: (
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
    }),
    getAnswerPayload: constant({ type: "answer" }),
    formatGroupPayload: ({}, group, description) => ({
      type: "group",
      group,
      description,
    }),
    formatUngroupPayload: ({}, group) => ({
      type: "ungroup",
      group,
    }),
  };
};
