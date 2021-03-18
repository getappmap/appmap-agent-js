
const APPMAP_GLOBAL_SERIALIZE = ((() => {
  const globalString = String;
  const globalJSONStringify = JSON.stringify;
  const globalReflectApply = Reflect.apply;
  const globalObjectPrototypeToString = Object.prototype.toString;
  return (value) => {
    if (value === APPMAP_GLOBAL_EMPTY_MARKER) {
      return "empty"
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
    if (value === void 0) {
      return "undefined";
    }
    if (typeof value === "number") {
      return globalString(value);
    }
    if (typeof value === "bigint") {
      return `${globalString(value)}n`;
    }
    if (typeof value === "string") {
      return globalJSONStringify(value);
    }
    return globalReflectApply(globalObjectPrototypeToString, value, []);
  };
}) ());
