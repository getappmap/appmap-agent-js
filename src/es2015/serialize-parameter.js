/* global APPMAP_GLOBAL_GET_IDENTITY, APPMAP_GLOBAL_SERIALIZE, APPMAP_GLOBAL_GET_CLASS_NAME */
/* eslint camelcase: ["error", {allow: ["object_id"]}] */

const APPMAP_GLOBAL_SERIALIZE_PARAMETER = (value, name) => ({
  name,
  object_id: APPMAP_GLOBAL_GET_IDENTITY(value),
  class: APPMAP_GLOBAL_GET_CLASS_NAME(value),
  value: APPMAP_GLOBAL_SERIALIZE(value),
});
