const { URL } = globalThis;

const { search: __search } = new URL(import.meta.url);

import Treeify from "treeify";
import AjvErrorTree from "ajv-error-tree";
import {
  validateSerial as validateAjvSerial,
  validatePayload as validateAjvPayload,
  validateExternalConfiguration as validateAjvExternalConfiguration,
  validateInternalConfiguration as validateAjvInternalConfiguration,
  validateMessage as validateAjvMessage,
  validateSourceMap as validateAjvSourceMap,
} from "../../../dist/schema.mjs";
const { InternalAppmapError, ExternalAppmapError } = await import(
  `../../error/index.mjs${__search}`
);
const { logError } = await import(`../../log/index.mjs${__search}`);
const { assert, coalesce } = await import(`../../util/index.mjs${__search}`);

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
