
import {consumeStreamAsync} from "./stream.mjs";

const createStreamPipe = (produce, consume) => ({
  type: "stream",
  produce,
  consume,
});

const createPromisePipe = (produce, consume) => ({
  type: "promise",
  produce,
  consume,
});

const mapStatePipe = ({type, produce, consume}, transform) => ({
  type,
  produce,
  consume: (state, event) => {
    consume(transform(state), event);
  },
});

const mapEventPipe = ({type, produce, consume}, transform) => ({
  type,
  produce,
  consume: (state, event) => {
    consume(state, transform(event));
  },
});

const runPipeAsync = ({type, produce, consume}, state) => {
  const handle = (event) => { consume(state, event); };
  if (type === "promise") {
    return produce.then(handle);
  }
  if (type === "stream") {
    return consumeStreamAsync(produce, handle);
  }
  return _Promise.reject(new _Error("invalid pipe type"));
};
