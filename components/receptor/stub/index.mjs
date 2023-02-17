import { constant } from "../../util/index.mjs";

const { Promise, undefined } = globalThis;

export const openReceptorAsync = constant(Promise.resolve(undefined));

export const getReceptorTracePort = constant(0);

export const getReceptorTrackPort = constant(0);

export const closeReceptorAsync = constant(Promise.resolve(undefined));
