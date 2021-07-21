const global_String = String;
const global_undefined = undefined;
const global_JSON_stringify = JSON.stringify;
const global_Reflect_apply = Reflect.apply;
const global_Object_prototype_toString = Object.prototype.toString;

export const print = (any) => {
  if (typeof any === "string") {
    return global_JSON_stringify(any);
  }
  if (
    typeof any === "boolean" ||
    typeof any === "bigint" ||
    typeof any === "number" ||
    typeof any === "symbol" ||
    any === null ||
    any === global_undefined
  ) {
    return global_String(any);
  }
  return global_Reflect_apply(global_Object_prototype_toString, any, []);
};
