import { constant, returnSecond } from "../../util/index.mjs";

const { Promise, undefined } = globalThis;

export const minifyReceptorConfiguration = constant({});

export const openReceptorAsync = constant(Promise.resolve(undefined));

export const adaptReceptorConfiguration = returnSecond;

export const closeReceptorAsync = constant(Promise.resolve(undefined));
