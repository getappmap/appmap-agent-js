import { strict as Assert } from "assert";
import {
  initializeStream,
  terminateStream,
  pushStream,
  consumeStreamAsync,
} from "./stream.mjs";
import { setTimeout } from "timers";

const { deepEqual: assertDeepEqual, fail, equal: assertEqual } = Assert;

const mainAsync = async () => {
  {
    const stream = initializeStream();
    pushStream(stream, "foo");
    setTimeout(() => {
      pushStream(stream, "bar");
      terminateStream(stream);
    });
    const buffer = [];
    await consumeStreamAsync(stream, (element) => {
      buffer.push(element);
    });
    assertDeepEqual(buffer, ["foo", "bar"]);
  }
  {
    const stream = initializeStream();
    terminateStream(stream, new Error("foo"));
    try {
      await consumeStreamAsync(stream, () => {
        fail();
      });
      fail();
    } catch ({ message }) {
      assertEqual(message, "foo");
    }
  }
};

mainAsync();
