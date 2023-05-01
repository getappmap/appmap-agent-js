const { Map, Set } = globalThis;

export const createEventTarget = () => new Map();

export const addEventListener = (target, name, listener) => {
  if (target.has(name)) {
    const listeners = target.get(name);
    if (typeof listeners === "function") {
      target.set(name, new Set([listeners, listener]));
    } else {
      listeners.add(listener);
    }
  } else {
    target.set(name, listener);
  }
};

export const removeEventListener = (target, name, listener) => {
  if (target.has(name)) {
    const listeners = target.get(name);
    if (typeof listeners === "function") {
      if (listeners === listener) {
        target.delete(name);
      }
    } else {
      listeners.delete(listener);
      if (listeners.size === 1) {
        target.set(name, listeners.values().next().value);
      }
    }
  }
};

export const dispatchEvent = (target, name, event) => {
  if (target.has(name)) {
    const listeners = target.get(name);
    if (typeof listeners === "function") {
      listeners(event);
    } else {
      for (const listener of listeners) {
        listener(event);
      }
    }
  }
};
