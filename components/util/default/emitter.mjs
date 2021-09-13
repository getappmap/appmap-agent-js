import { coalesce } from "./object.mjs";

const _undefined = undefined;

export const spyEmitter = (emitter, whitelist, firstListener, lastListener) => {
  const isBaseListener = (listener) =>
    listener !== firstListener && listener !== lastListener;
  emitter.on("newListener", (name) => {
    if (
      name !== "removeListener" &&
      name !== "newListener" &&
      whitelist.test(name)
    ) {
      let listeners = coalesce(emitter._events, name, _undefined);
      if (listeners === _undefined) {
        emitter._eventsCount += 1;
        listeners = [];
      } /* c8 ignore start */ else if (typeof listeners === "function") {
        listeners = [listeners];
      } /* c8 ignore stop */
      listeners = listeners.filter(isBaseListener);
      emitter._events[name] = {
        __proto__: null,
        push: (listener) => {
          emitter._events[name] = [
            firstListener,
            ...listeners,
            listener,
            lastListener,
          ];
        },
        unshift: (listener) => {
          emitter._events[name] = [
            firstListener,
            listener,
            ...listeners,
            lastListener,
          ];
        },
      };
    }
  });
};

//
//   if (
//     !running &&
//     name !== "removeListener" &&
//     name !== "newListener" &&
//     (
//       ((() => { debugger; }) ()),
//       whitelist.test(name)
//     )
//   ) {
//     _queueMicrotask(() => {
//       debugger;
//       running = true;
//       emitter.removeListener(name, first);
//       emitter.removeListener(name, last);
//       emitter.prependListener(name, first);
//       emitter.addListener(name, last);
//       running = false;
//     });
//   }
// };
// };
//
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
