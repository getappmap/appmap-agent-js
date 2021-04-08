import { getDefaultConfig } from './config.mjs';
import { makeDispatch } from "./dispatch.mjs";
import { makeChannel } from "./util/inline.mjs";

export default (env) => makeChannel(makeDispatch(getDefaultConfig()));
