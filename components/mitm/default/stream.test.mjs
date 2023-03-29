import { Readable } from "node:stream";
import { Buffer } from "node:buffer";
import { assertEqual } from "../../__fixture__.mjs";
import { bufferReadable } from "./stream.mjs";

const { Promise, setTimeout } = globalThis;

const { from: toBuffer } = Buffer;

let done = false;

const readable = new Readable({
  read() {
    if (!done) {
      done = true;
      setTimeout(() => {
        this.push(toBuffer("foo", "utf8"));
        setTimeout(() => {
          this.push(toBuffer("bar", "utf8"));
          setTimeout(() => {
            this.push(null);
          }, 0);
        }, 0);
      }, 0);
    }
  },
});

assertEqual(
  (
    await new Promise((resolve) => {
      bufferReadable(readable, resolve);
    })
  ).toString("utf8"),
  "foobar",
);
