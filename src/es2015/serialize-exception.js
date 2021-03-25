/* global APPMAP_GLOBAL_EMPTY_MARKER, APPMAP_GLOBAL_GET_IDENTITY, APPMAP_GLOBAL_SERIALIZE, APPMAP_GLOBAL_GET_CLASS_NAME */
/* eslint camelcase: ["error", {allow: ["object_id", "^global_"]}] */

const APPMAP_GLOBAL_SERIALIZE_EXCEPTION = (() => {
  const global_Error = Error;
  // const global_Reflect_apply = Reflect.apply;
  // const global_Array_prototype_split = Array.prototype.split;
  return (value) => {
    if (value === APPMAP_GLOBAL_EMPTY_MARKER) {
      return [];
    }
    if (value instanceof global_Error) {
      // const stack = value.stack;
      // const lines = global_Reflect_apply(global_Array_prototype_split, stack, ["\n"]);
      return [
        {
          class: APPMAP_GLOBAL_GET_CLASS_NAME(value),
          message: value.message,
          object_id: APPMAP_GLOBAL_GET_IDENTITY(value),
          path: value.stack,
          lineno: null,
        },
      ];
    }
    return [
      {
        class: APPMAP_GLOBAL_GET_CLASS_NAME(value),
        message: null,
        object_id: APPMAP_GLOBAL_GET_IDENTITY(value),
        path: null,
        lineno: null,
      },
    ];
  };
})();
