import { check, checkSuccess, checkDeadcode } from "./check.mjs";

export class AppmapInternalError extends Error {}

export const assert (boolean, template, ...values) = {
  check(AppmapInternalError);

export const assertSuccess = checkSuccess(AppmapInternalError);

export const assertDeadcode = checkDeadcode(AppmapInternalError);
