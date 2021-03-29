/* global APPMAP_GLOBAL_EMPTY_MARKER */

const APPMAP_GLOBAL_SERIALIZE = (() => {
  const global_undefined = undefined;
  const global_String = String;
  const global_JSON_stringify = JSON.stringify;
  const global_Reflect_apply = Reflect.apply;
  const global_Object_prototype_toString = Object.prototype.toString;
  return (value) => {
    if (value === APPMAP_GLOBAL_EMPTY_MARKER) {
      return "empty";
    }
    if (value === null) {
      return "null";
    }
    if (value === true) {
      return "true";
    }
    if (value === false) {
      return "false";
    }
    if (value === global_undefined) {
      return "undefined";
    }
    if (typeof value === "number") {
      return global_String(value);
    }
    if (typeof value === "bigint") {
      return `${global_String(value)}n`;
    }
    if (typeof value === "string") {
      return global_JSON_stringify(value);
    }
    return global_Reflect_apply(global_Object_prototype_toString, value, []);
  };
})();
