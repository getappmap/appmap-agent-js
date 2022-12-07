import {
  reportError,
  InternalAppmapError,
  ExternalAppmapError,
} from "./index.mjs";

reportError(new InternalAppmapError("foo"));

reportError(new ExternalAppmapError("bar"));

reportError("qux");
