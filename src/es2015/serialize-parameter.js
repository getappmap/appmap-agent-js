/* global APPMAP_GLOBAL_GET_IDENTITY, APPMAP_GLOBAL_SERIALIZE */
/* eslint camelcase: ["error", {allow: ["object_id"]}] */

const APPMAP_GLOBAL_SERIALIZED_PARAMETER = (value, name) => ({
  name,
  object_id: APPMAP_GLOBAL_GET_IDENTITY(value),
  class: 'TODO',
  value: APPMAP_GLOBAL_SERIALIZE(value),
});
