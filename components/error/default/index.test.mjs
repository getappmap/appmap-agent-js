import {
  reportError,
  InternalAppmapError,
  ExternalAppmapError,
} from "./index.mjs?env=test";

reportError(new InternalAppmapError("foo"));

reportError(new ExternalAppmapError("bar"));

reportError("qux");
