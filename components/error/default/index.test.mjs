import {
  reportError,
  InternalAppmapError,
  ExternalAppmapError,
} from "./index.mjs";

const { Error } = globalThis;

reportError(new InternalAppmapError("foo"));

reportError(new ExternalAppmapError("bar"));

reportError(new ExternalAppmapError("bar", new Error("test")));

reportError("qux");
