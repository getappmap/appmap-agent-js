const APPMAP_GLOBAL_GET_IDENTITY = (() => {
  const global_Reflect_apply = Reflect.apply;
  const global_WeakMap_prototype_has = WeakMap.prototype.has;
  const global_WeakMap_prototype_get = WeakMap.prototype.get;
  const global_WeakMap_prototype_set = WeakMap.prototype.set;
  let counter = 0;
  const registery1 = { __proto__: null };
  const registery2 = new WeakMap();
  return (value) => {
    if (typeof value === "symbol") {
      if (!(value in registery1)) {
        counter += 1;
        registery1[value] = counter;
      }
      return registery1[value];
    }
    if (
      (typeof value === "object" && value !== null) ||
      typeof value === "function"
    ) {
      if (
        !global_Reflect_apply(global_WeakMap_prototype_has, registery2, [value])
      ) {
        counter += 1;
        global_Reflect_apply(global_WeakMap_prototype_set, registery2, [
          value,
          counter,
        ]);
      }
      return global_Reflect_apply(global_WeakMap_prototype_get, registery2, [
        value,
      ]);
    }
    return null;
  };
})();
