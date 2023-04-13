import { spawn } from "node:child_process";
import { Buffer } from "node:buffer";
import { cwd } from "node:process";
import { convertFileUrlToPath } from "../../path/index.mjs";
import { logDebug } from "../../log/index.mjs";
import { toAbsoluteUrl } from "../../url/index.mjs";

const { setTimeout, Promise, undefined, Error } = globalThis;

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
          reject(new Error("Could not kill all spawn child processes in time"));
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
    logDebug("Spawn %j %j %j", exec, argv, options);
    const child = spawn(exec, argv, {
      ...options,
      cwd:
        "cwd" in options
          ? convertFileUrlToPath(toAbsoluteUrl(".", options.cwd))
          : cwd(),
    });
    const stdout =
      options.stdio === "pipe" ? bufferReadable(child.stdout) : null;
    const stderr =
      options.stdio === "pipe" ? bufferReadable(child.stderr) : null;
    child.on("error", (error) => {
      logDebug("Spawn failure %j %j >> %O", exec, argv, error);
      children.delete(child);
      reject(error);
    });
    child.on("close", (status, signal) => {
      logDebug(
        "Spawn success %j %j: signal = %j status = %j ",
        exec,
        argv,
        signal,
        status,
      );
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
