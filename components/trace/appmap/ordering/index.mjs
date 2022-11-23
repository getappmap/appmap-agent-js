// Beware, event ordering is by far the most difficult code to understand.
// The ordering is mode in three passes:
// 1) Rearrenge the event trace into an array of trees which each represent a top-level callstack.
// 2) Resolve groups by inserting top-level trees where the asynchronous resource was registered.
// 3) Resolve jumps by moving the tree framed by after events next to their corresponding before event.

const { URL } = globalThis;
const { search: __search } = new URL(import.meta.url);

import { groupStack } from "./group.mjs";
import { stackify } from "./stack.mjs";
import { jumpify } from "./jump.mjs";

export const orderEventArray = (events) =>
  jumpify(groupStack(stackify(events)));
