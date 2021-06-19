
const {check, checkSuccess, checkDeadcode} = require("./check.js");

export class AppmapExternalError extends Error {}

export const expect = check(AppmapExternalError);

export const expectSuccess = checkSuccess(AppmapExternalError);

export const expectDeadcode = checkDeadcode(AppmapExternalError);
