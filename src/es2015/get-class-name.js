const APPMAP_GLOBAL_GET_CLASS_NAME = (() => {
  const global_Reflect_getOwnPropertyDescriptor = Reflect.getOwnPropertyDescriptor;
  const global_Reflect_getPrototypeOf = Reflect.getPrototypeOf;
  return (value) => {
    if (typeof value === "object" || typeof value === "function") {
      let object = value;
      while (object !== null) {
        const descriptor1 = global_Reflect_getOwnPropertyDescriptor(object, "constructor");
        if (descriptor1) {
          if (global_Reflect_getOwnPropertyDescriptor(descriptor1, "value")) {
            const constructor = descriptor1.value;
            const descriptor2 = global_Reflect_getOwnPropertyDescriptor(constructor, "name");
            if (descriptor2) {
              if (global_Reflect_getOwnPropertyDescriptor(descriptor2, "value")) {
                const name = descriptor2.value;
                if (typeof name === "string") {
                  return `${name}`;
                }
              }
            }
          }
          return "unknown";
        }
        object = global_Reflect_getPrototypeOf(object);
      }
      return "null-class";
    }
    return `${typeof value}-class`;
  };
})();
