export const createEmitterStream = (emitter, name, options) => {
  const { resolutions, rejections } = {
    resolutions: [],
    rejections: [],
    ...options,
  };
  return {
    type: "emitter",
    emitter,
    name,
    resolutions,
    rejections,
  };
};

export const createStartStream = (start, args) => ({
  type: "start",
  args,
  start,
});

export const filterStream = (argument, guard) => ({
  type: "filter",
  argument,
  guard,
});

export const mapStream = (argument, transform) => ({
  type: "map",
  argument,
  transform,
});

export const combineStream = (left, right) => ({
  type: "combine",
  left,
  right,
});

const generateControlEmitterStream =
  (method) =>
  (
    { emitter, name, resolutions, rejections },
    { listen, listenResolution, listenRejection },
  ) => {
    emitter[method](name, listen);
    for (let name of resolutions) {
      emitter[method](name, listenResolution);
    }
    for (let name of rejections) {
      emitter[method](name, listenRejection);
    }
  };

const startEmitterStream = generateControlEmitterStream("addListener");
const stopEmitterStream = generateControlEmitterStream("removeListener");

// State -> Stream Event -> (Event -> State -> ())
export const consumeStreamAsync = (stream, state, consume) => {
  const { type } = stream;
  if (type === "map") {
    const { argument, transform } = stream;
    return consumeStreamAsync(argument, state, (state, event) => {
      consume(state, transform(event));
    });
  }
  if (type === "filter") {
    const { argument, guard } = stream;
    return consumeStreamAsync(argument, state, (state, event) => {
      if (guard(event)) {
        consume(state, event);
      }
    });
  }
  if (type === "concat") {
    const { left, right } = stream;
    return Promise.all([
      consumeStreamAsync(left, state, combine),
      consumeStreamAsync(right, state, combine),
    ]);
  }
  if (type === "emitter") {
    return new Promise((resolve, reject) => {
      const listeners = {
        listen: (event) => {
          consume(state, event);
        },
        listenResolution: (result) => {
          stopEmitterStream(stream, listeners);
          resolve(result);
        },
        listenRejection: (error) => {
          stopEmitterStream(stream, listeners);
          reject(error);
        },
      };
      startEmitterStream(stream, listeners);
    });
  }
  if (type === "hook") {
  }

  if (type === "start") {
    const { names, start } = stream;
    if (names.length === 0) {
      return start(() => {
        consume(state, null);
      });
    }
    if (names.length === 1) {
      const [name1] = names;
      return start((arg1) => {
        consume(state, { [name1]: arg1 });
      });
    }
    if (names.length === 2) {
      const [name1, name2] = names;
      return start((arg1, arg2) => {
        consume(state, { [name1]: arg1, [name2]: arg2 });
      });
    }
  }
  return Promise.reject(new _Error("invalid stream type"));
};

// export const filterStream = (stream, guard) => ({
//   type: "filter",
//   stream,
//   guard,
// });
//
// export const filterStream = (stream)

// export const initializeEmitterStream = (emitter, name) => {
//   const stream = {type:"emitter", buffer:[]};
//   emitter.on(name, (event) => {
//     pushStream(stream, event);
//   });
//   return {emitter, stream};
// };
//
// export const terminateStream = (stream) => {
//   const {type} = stream;
//   if (type === "emitter") {
//     const {emitter, name, listener} = stream;
//     emitter.removeListener(name, listener);
//   }
//   stream.buffer = [];
// };

// export const initializeStream = () => ({
//   termination: createExposedPromise(),
//   buffer: [],
//   consume: null,
// });
//
// export const terminateStream = (
//   { termination: { resolve, reject } },
//   error = null,
// ) => {
//   if (error === null) {
//     resolve();
//   } else {
//     reject(error);
//   }
// };

// export const pushStream = ({ buffer, consume }, element) => {
//   if (consume !== null) {
//     consume(element);
//   } else {
//     assert(buffer !== null, "cannot push elements on a terminated stream");
//     buffer.push(element);
//   }
// };

// export const consumeStreamAsync = async (stream, each) => {
//   const {
//     buffer,
//     termination: { promise },
//   } = stream;
//   assert(buffer !== null, "cannot consume a stream more than once");
//   stream.buffer = null;
//   stream.consume = each;
//   for (const element of buffer) {
//     each(element);
//   }
//   try {
//     await promise;
//   } finally {
//     stream.consume = null;
//   }
// };
