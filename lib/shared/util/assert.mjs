
import {check, checkSuccess, checkDeadcode} = from "./check.js";

export class AppmapInternalError extends Error {}

export const assert = check(AppmapInternalError)

export const assertSuccess = checkSuccess(AppmapInternalError);

export const assertDeadcode = checkDeadcode(AppmapInternalError);
