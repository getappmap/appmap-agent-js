/* global APPMAP_GLOBAL_GET_IDENTITY, APPMAP_GLOBAL_SERIALIZE */

const APPMAP_GLOBAL_SERIALIZE_PARAMETER = ((() => {
  const global_Error = Error;
  // const global_Reflect_apply = Reflect.apply;
  // const global_Array_prototype_split = Array.prototype.split;
  return (value) => {
    if (value instanceof global_Error) {
      // const stack = value.stack;
      // const lines = global_Reflect_apply(global_Array_prototype_split, stack, ["\n"]);
      // if (lines.length > 1 && lines[]) {
      // 
      // }
      return {
        class: "TODO",
        message: error.message,
        object_id: APPMAP_GLOBAL_GET_IDENTITY(value),
        path: error.stack
        lineno: null
      };
    }
    return {
      class: "TODO",
      message: null,
      object_id: APPMAP_GLOBAL_GET_IDENTITY(value),
      path: null,
      lineno: null
    };
  };
}) ());
