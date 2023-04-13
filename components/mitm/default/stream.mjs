import { Buffer } from "node:buffer";
const { concat: concatBufferArray } = Buffer;

export const bufferReadable = (readable, callback) => {
  const buffers = [];
  readable.on("data", (buffer) => {
    buffers.push(buffer);
  });
  readable.on("end", () => {
    callback(concatBufferArray(buffers));
  });
};
