const { URL } = globalThis;

import Treeify from "treeify";
import AjvErrorTree from "ajv-error-tree";
import { home } from "../../home/index.mjs";
import {
  InternalAppmapError,
  ExternalAppmapError,
} from "../../error/index.mjs";
import { logError } from "../../log/index.mjs";
import { assert, coalesce } from "../../util/index.mjs";

const {
  validateSerial: validateAjvSerial,
  validatePayload: validateAjvPayload,
  validateExternalConfiguration: validateAjvExternalConfiguration,
  validateInternalConfiguration: validateAjvInternalConfiguration,
  validateMessage: validateAjvMessage,
  validateSourceMap: validateAjvSourceMap,
} = await import(new URL("dist/schema.mjs", home));

const { asTree } = Treeify;

const generateValidate = (validateAjv, name, AppmapError) => (json) => {
  if (!validateAjv(json)) {
    const { errors } = validateAjv;
    const { length } = errors;
    assert(length > 0, "unexpected empty error array", InternalAppmapError);
    const tree1 = AjvErrorTree.structureAJVErrorArray(errors);
    const tree2 = AjvErrorTree.summarizeAJVErrorTree(tree1);
    logError(
      "invalid %s\n%s\n  Parameters = %j\n  Input = %j",
      name,
      typeof tree2 === "string" ? tree2 : asTree(tree2, true),
      errors.map((error) => coalesce(error, "params", null)),
      json,
    );
    throw new AppmapError("Failed to validate data against JSON schema");
  }
};

export const validateSerial = generateValidate(
  validateAjvSerial,
  "serial",
  InternalAppmapError,
);

export const validateMessage = generateValidate(
  validateAjvMessage,
  "message",
  InternalAppmapError,
);

export const validatePayload = generateValidate(
  validateAjvPayload,
  "payload",
  InternalAppmapError,
);

export const validateExternalConfiguration = generateValidate(
  validateAjvExternalConfiguration,
  "user-defined configuration",
  ExternalAppmapError,
);

export const validateInternalConfiguration = generateValidate(
  validateAjvInternalConfiguration,
  "internal configuration",
  InternalAppmapError,
);

export const validateSourceMap = generateValidate(
  validateAjvSourceMap,
  "source-map",
  ExternalAppmapError,
);
