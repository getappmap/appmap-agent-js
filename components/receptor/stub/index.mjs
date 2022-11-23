const { Promise, undefined, URL } = globalThis;

const { search: __search } = new URL(import.meta.url);

import { constant, returnSecond } from "../../util/index.mjs";

export const minifyReceptorConfiguration = constant({});

export const openReceptorAsync = constant(Promise.resolve(undefined));

export const adaptReceptorConfiguration = returnSecond;

export const closeReceptorAsync = constant(Promise.resolve(undefined));
