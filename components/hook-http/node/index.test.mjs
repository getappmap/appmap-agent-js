import { assertDeepEqual, assertEqual } from "../../__fixture__.mjs";
import { Buffer } from "buffer";
import { Writable, Readable } from "stream";
import { buildTestDependenciesAsync } from "../../build.mjs";
import HookHttp from "./index.mjs";

const dependencies = await buildTestDependenciesAsync(import.meta.url);
const {
  parseContentType,
  parseJSONSafe,
  decodeSafe,
  spyReadable,
  spyWritable,
} = HookHttp(dependencies);

//////////////////////
// parseContentType //
//////////////////////

assertDeepEqual(parseContentType("type/subtype; param=value"), {
  type: "type",
  subtype: "subtype",
  parameters: {
    param: "value",
  },
});

assertDeepEqual(parseContentType("type/subtype; invalid"), {
  type: "type",
  subtype: "subtype",
  parameters: {},
});

assertDeepEqual(parseContentType("invalid; param=value"), {
  type: "text",
  subtype: "plain",
  parameters: {
    param: "value",
  },
});

///////////////////
// parseJSONSafe //
///////////////////

assertEqual(parseJSONSafe("123", 456), 123);

assertEqual(parseJSONSafe("invalid", 456), 456);

////////////////
// decodeSafe //
////////////////

assertEqual(decodeSafe(Buffer.from("foo", "utf8"), "utf8", "bar"), "foo");

assertEqual(decodeSafe(Buffer.from("foo", "utf8"), "invalid", "bar"), "bar");

/////////////////
// spyReadable //
/////////////////

{
  const readable = new Readable({
    read: (_size) => {},
  });
  let leak = null;
  spyReadable(readable, (buffer) => {
    leak = buffer;
  });
  readable.push("foo", "utf8");
  readable.push(Buffer.from("bar", "utf8"));
  readable.push(null);
  assertEqual(leak.toString("utf8"), "foobar");
}

/////////////////
// spyWritable //
/////////////////

{
  const writable = new Writable({
    construct: (callback) => {
      callback();
    },
    write: (_chunk, _encoding, callback) => {
      callback();
    },
    destroy: () => {},
  });
  let leak = null;
  spyWritable(writable, (buffer) => {
    leak = buffer;
  });
  writable.write("foo", "utf8");
  writable.end(Buffer.from("bar", "utf8"));
  assertEqual(leak.toString("utf8"), "foobar");
}
