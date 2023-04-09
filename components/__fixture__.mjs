import { strict as Assert } from "node:assert";

const {
  undefined,
  Error,
  Infinity,
  JSON: { stringify: stringifyJSON },
  Array: { isArray },
  Reflect: { ownKeys },
} = globalThis;

Error.stackTraceLimit = Infinity;

export const {
  ok: assert,
  match: assertMatch,
  fail: assertFail,
  deepEqual: assertDeepEqual,
  equal: assertEqual,
  throws: assertThrow,
  rejects: assertReject,
  notEqual: assertNotEqual,
} = Assert;

const matchJSON = (json, pattern, path) => {
  if (isArray(pattern)) {
    assertEqual(isArray(json), true, path);
    assertEqual(pattern.length <= json.length, true, path);
    for (let index = 0; index < pattern.length; index += 1) {
      matchJSON(json[index], pattern[index], `${path}/${index}`);
    }
  } else if (typeof pattern === "object" && pattern !== null) {
    assertEqual(typeof json, "object", path);
    assertNotEqual(json, null, path);
    for (const key of ownKeys(pattern)) {
      matchJSON(json[key], pattern[key], `${path}/${key}`);
    }
  } else {
    assertEqual(
      json === null ||
        typeof json === "boolean" ||
        typeof json === "number" ||
        typeof json === "string",
      true,
      path,
    );
    if (pattern !== undefined) {
      assertEqual(json, pattern, path);
    }
  }
};

export const assertMatchJSON = (json, pattern) => {
  try {
    matchJSON(json, pattern, "");
  } catch ({ message }) {
    throw new Error(
      stringifyJSON(
        {
          message,
          actual: json,
          expected: pattern,
        },
        null,
        2,
      ),
    );
  }
};
