
import {noop} from "../../../util/index.mjs";

class Client {
  constructor ({backend}, options) {
    this.backend = backend;
    this.terminated = false;
  }
  async requestAsync (json) {
    return this.backend.respond(json);
  }
  request (json) {
    return this.backend.respond(json);
  }
  send (json) {
    this.backend.receive(json);
  }
  close () {
    this.backend = null;
  }
}

export default (dependency, configuration) => new Client(dependency, configuration);

// export default  ({backend}, options) => {
//   return {
//     requestAsync: (json) => {
//       backend();
//     },
//     send: () => {
//
//     },
//     terminate: () => {}
//     run: (json, discarded) server
//     runAsync: (json)server
//     terminate:
//   }
// };
