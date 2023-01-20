import { InternalAppmapError } from "../../error/index.mjs";
import { spawn } from "../../spawn/node/index.mjs";
import { Buffer } from "node:buffer";

const { setTimeout, Promise, undefined } = globalThis;

const { concat: concatBuffer } = Buffer;

const compileSig = (signal) => (child) => {
  child.kill(signal);
};

const sigint = compileSig("SIGINT");

const sigkill = compileSig("SIGKILL");

export const killAllAsync = (children) =>
  new Promise((resolve, reject) => {
    children.forEach(sigint);
    setTimeout(() => {
      children.forEach(sigkill);
      setTimeout(() => {
        /* c8 ignore start */ if (children.size !== 0) {
          reject(
            new InternalAppmapError(
              "Could not kill all spawn child processes in time",
            ),
          );
        } /* c8 ignore stop */ else {
          resolve(undefined);
        }
      }, 1000);
    }, 1000);
  });

const bufferReadable = (readable) => {
  const buffers = [];
  readable.on("data", (buffer) => {
    buffers.push(buffer);
  });
  return buffers;
};

export const spawnAsync = ({ exec, argv, options }, children) =>
  new Promise((resolve, reject) => {
    const child = spawn(exec, argv, options);
    const stdout =
      options.stdio === "pipe" ? bufferReadable(child.stdout) : null;
    const stderr =
      options.stdio === "pipe" ? bufferReadable(child.stderr) : null;
    child.on("error", (error) => {
      children.delete(child);
      reject(error);
    });
    child.on("close", (status, signal) => {
      children.delete(child);
      resolve({
        status,
        signal,
        stdout:
          stdout === null
            ? null
            : concatBuffer(stdout).toString(options.encoding),
        stderr:
          stderr === null
            ? null
            : concatBuffer(stderr).toString(options.encoding),
      });
    });
    children.add(child);
  });
