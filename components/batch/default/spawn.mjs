import { InternalAppmapError } from "../../error/index.mjs";
import { spawn } from "../../spawn/node/index.mjs";

const { setTimeout, Promise, undefined } = globalThis;

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

export const spawnAsync = ({ exec, argv, options }, children) =>
  new Promise((resolve, reject) => {
    const child = spawn(exec, argv, options);
    child.on("error", (error) => {
      children.delete(child);
      reject(error);
    });
    child.on("close", (status, signal) => {
      children.delete(child);
      resolve({ status, signal });
    });
    children.add(child);
  });
