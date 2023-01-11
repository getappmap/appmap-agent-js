import Ajv from "ajv";
import { parse as parseYAML } from "yaml";
import { logFailure } from "./log.mjs";
import { hasOwn, matchJSON } from "./util.mjs";

const {
  URL,
  RegExp,
  Error,
  JSON: { parse: parseJSON, stringify: stringifyJSON },
} = globalThis;

const removeCarriageReturn = (string) => string.replace(/\r/u, "");

const parsers = {
  text: removeCarriageReturn,
  json: parseJSON,
  yaml: parseYAML,
};

const matchers = {
  regexp: (actual, expect) => {
    while (expect.endsWith("\n")) {
      expect = expect.substring(0, expect.length - 1);
    }
    return new RegExp(expect, "u").test(actual);
  },
  schema: (actual, expect) => {
    const ajv = new Ajv({ verbose: true });
    const validate = ajv.compile(expect);
    if (validate(actual)) {
      return true;
    } else {
      logFailure(`Schema mismatch ${stringifyJSON(validate.errors, null, 2)}`);
      return false;
    }
  },
  subset: (actual, expect) => {
    const maybe_mismatch = matchJSON(expect, actual, "");
    if (maybe_mismatch === null) {
      return true;
    } else {
      logFailure(`Subset mismatch ${maybe_mismatch}`);
      return false;
    }
  },
};

const segmentizeUrl = (url) => new URL(url).pathname.split(".");

const getMatchMethod = (url) => {
  const segments = segmentizeUrl(url);
  if (segments.length < 3) {
    throw new Error("Could not extract match method");
  } else {
    return segments[segments.length - 2];
  }
};

const parseFile = ({ url, content }) => {
  const segments = segmentizeUrl(url);
  const type = segments[segments.length - 1];
  if (hasOwn(parsers, type)) {
    return parsers[type](content);
  } else {
    throw new Error("Invalid file type");
  }
};

export const match = (actual, expect) => {
  const method = getMatchMethod(expect.url);
  if (hasOwn(matchers, method)) {
    return matchers[method](parseFile(actual), parseFile(expect));
  } else {
    throw new Error("Invalid match method");
  }
};
