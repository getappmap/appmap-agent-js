const { isArray } = Array;
const { ownKeys } = Reflect;
const _undefined = undefined;

export default (dependencies) => {
  const {
    expect: { expect },
    agent: {
      getSerializationEmptyValue,
      recordBeginBundle,
      recordBeginApply,
      recordBeginServer,
      recordBeforeJump,
      recordBeforeClient,
      recordBeforeQuery,
      recordEndBundle,
      recordEndApply,
      recordEndServer,
      recordAfterJump,
      recordAfterClient,
      recordAfterQuery,
    },
  } = dependencies;
  const expectType = (location, object, key, type) => {
    expect(
      typeof object[key] === type,
      "%s.%s should be a %s, got: %j",
      location,
      key,
      type,
      object,
    );
  };
  const expectNonNull = (location, object, key) => {
    expect(
      object[key] !== null,
      "%s.%s should be non null, got: %j",
      location,
      key,
      object,
    );
  };
  const expectArray = (location, object, key) => {
    expect(
      isArray(object[key]),
      "%s.%s should be an array, got: %j",
      location,
      key,
      object,
    );
  };
  const expectHeaders = (location, object, key) => {
    expectNonNull(location, object, key);
    expectType(location, object, key, "object");
    const next_location = `${location}.${key}`;
    const next_object = object[key];
    for (const next_key of ownKeys(next_object)) {
      expectType(next_location, next_object, next_key, "string");
    }
  };
  const sanitizeNull = (empty, data) => null;
  const generateSanitizeRequest = (location) => (empty, data) => {
    data = {
      protocol: "HTTP/1.1",
      method: "GET",
      url: "/",
      headers: {},
      route: null,
      ...data,
    };
    expectType(location, data, "protocol", "string");
    expectType(location, data, "method", "string");
    expectType(location, data, "url", "string");
    expectHeaders(location, data, "headers");
    if (data.route !== null) {
      expectType(location, data, "route", "string");
    }
    return data;
  };
  const generateSanitizeResponse = (location) => (empty, data) => {
    data = {
      status: 200,
      message: "OK",
      headers: {},
      ...data,
    };
    expectType(location, data, "status", "number");
    expectType(location, data, "message", "string");
    expectHeaders(location, data, "headers");
    return data;
  };
  const generateRecord =
    (enter, sanitizeEnter, leave, sanitizeLeave) => (agent, data) => {
      const empty = getSerializationEmptyValue(agent);
      let index = enter(agent, sanitizeEnter(empty, data));
      return (data) => {
        expect(index !== null, "event has already been closed");
        leave(agent, index, sanitizeLeave(empty, data));
        index = null;
      };
    };
  return {
    recordBeginBundle: generateRecord(
      recordBeginBundle,
      sanitizeNull,
      recordEndBundle,
      sanitizeNull,
    ),
    recordApply: generateRecord(
      recordBeginApply,
      (empty, data) => {
        data = {
          this: _undefined,
          arguments: [],
          ...data,
          function: null,
        };
        expectArray("BeginApplyEvent", data, "arguments");
        return data;
      },
      recordEndApply,
      (empty, data) => {
        data = {
          error: empty,
          result: empty,
          ...data,
        };
        expect(
          (data.error === empty) !== (data.result === empty),
          "EndApplyEvent should either contain 'error' for failure or 'result' for success, got: %j",
          data,
        );
        return data;
      },
    ),
    recordServerRequest: generateRecord(
      recordBeginServer,
      generateSanitizeRequest("BeginResponseEvent"),
      recordEndServer,
      generateSanitizeResponse("EndResponseEvent"),
    ),
    recordBeforeJump: generateRecord(
      recordBeforeJump,
      sanitizeNull,
      recordAfterJump,
      sanitizeNull,
    ),
    recordQuery: generateRecord(
      recordBeforeQuery,
      (empty, data) => {
        data = {
          database: "unknown",
          version: "unknown",
          sql: "unknown",
          parameters: [],
          ...data,
        };
        expectNonNull("BeforeQueryEvent", data, "parameters");
        expectType("BeforeQueryEvent", data, "parameters", "object");
        return data;
      },
      recordAfterQuery,
      (empty, data) => {
        data = {
          error: empty,
          ...data,
        };
        return data;
      },
    ),
    recordClientRequest: generateRecord(
      recordBeforeClient,
      generateSanitizeRequest("BeforeRequestEvent"),
      recordAfterClient,
      generateSanitizeResponse("AfterRequestEvent"),
    ),
  };
};
