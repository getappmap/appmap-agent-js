const { getOwnPropertyDescriptor, defineProperty, isExtensible, apply } =
  Reflect;
const _undefined = undefined;

export default (dependencies) => {
  const {
    expect: { expect },
  } = dependencies;
  const spyEmitter = (emitter, whitelist, firstListener, lastListener) => {
    expect(
      getOwnPropertyDescriptor(emitter, "emit") === _undefined,
      "cannot spy emitter because it has 'emit' as own property",
    );
    const { emit: _emit } = emitter;
    expect(
      typeof _emit === "function",
      "cannot spy emitter because it lacks an 'emit' method",
    );
    expect(
      isExtensible(emitter),
      "cannot spy emitter because it is not extensible",
    );
    defineProperty(emitter, "emit", {
      __proto__: null,
      writable: true,
      configurable: true,
      enumerable: false,
      value: function emit(name, ...args) {
        expect(
          typeof name === "string",
          "expected a string as first arguments",
        );
        if (!whitelist.test(name)) {
          return apply(_emit, this, arguments);
        }
        const link = {};
        firstListener(this, name, args, link);
        try {
          return apply(_emit, this, arguments);
        } finally {
          lastListener(this, name, args, link);
        }
      },
    });
  };
  const spyFlattenEmitterList = (
    emitters,
    whitelist,
    firstListener,
    lastListener,
  ) => {
    let depth = 0;
    const firstListenerWrapper = (...args) => {
      if (depth === 0) {
        firstListener(...args);
      }
      depth += 1;
    };
    const lastListenerWrapper = (...args) => {
      depth -= 1;
      if (depth === 0) {
        lastListener(...args);
      }
    };
    for (const emitter of emitters) {
      spyEmitter(emitter, whitelist, firstListenerWrapper, lastListenerWrapper);
    }
  };
  return { spyEmitter, spyFlattenEmitterList };
};

// export const spyEmitter = (emitter, whitelist, firstListener, lastListener) => {
//   const isBaseListener = (listener) =>
//     listener !== firstListener && listener !== lastListener;
//   emitter.on("newListener", (name) => {
//     if (
//       name !== "removeListener" &&
//       name !== "newListener" &&
//       whitelist.test(name)
//     ) {
//       let listeners = coalesce(emitter._events, name, _undefined);
//       if (listeners === _undefined) {
//         emitter._eventsCount += 1;
//         listeners = [];
//       } /* c8 ignore start */ else if (typeof listeners === "function") {
//         listeners = [listeners];
//       } /* c8 ignore stop */
//       listeners = listeners.filter(isBaseListener);
//       emitter._events[name] = {
//         __proto__: null,
//         push: (listener) => {
//           emitter._events[name] = [
//             firstListener,
//             ...listeners,
//             listener,
//             lastListener,
//           ];
//         },
//         unshift: (listener) => {
//           emitter._events[name] = [
//             firstListener,
//             listener,
//             ...listeners,
//             lastListener,
//           ];
//         },
//       };
//     }
//   });
// };

// export const spyEmitter = (emitter, whitelist, first, last) => {
//   let running = false;
//   const handleChange = (name) => {
//     if (
//       !running &&
//       name !== "removeListener" &&
//       name !== "newListener" &&
//       (
//         ((() => { debugger; }) ()),
//         whitelist.test(name)
//       )
//     ) {
//       _queueMicrotask(() => {
//         debugger;
//         running = true;
//         emitter.removeListener(name, first);
//         emitter.removeListener(name, last);
//         emitter.prependListener(name, first);
//         emitter.addListener(name, last);
//         running = false;
//       });
//     }
//   };
//   emitter.addListener("removeListener", handleChange);
//   emitter.addListener("newListener", handleChange);
// };
