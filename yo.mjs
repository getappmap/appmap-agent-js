// import {createServer} from "net";

import {writeSync} from "fs";
import {createHook} from "async_hooks";

const hook = createHook({
  init: (arg0, arg1, arg2) => {
    writeSync(1, `${JSON.stringify([arg0, arg1, arg2])}${"\n"}`);
  }
});

hook.enable();

writeSync(1, "foo\n");
setTimeout(() => { writeSync(1, "bar\n") });
writeSync(1, "qux\n");

// const server = createServer();
// server.listen(8000);
// server.on("connection", (socket) => {
//   socket.on("data", (data) => {
//     process.stdout.write(data);
//   });
// });

// console.log(this);
//
// {
//   const aggregateFooBar = (options) => {
//     let result = "";
//     if (options.foo) {
//       result += "foo";
//     }
//     if (options.bar) {
//       result += "bar";
//     }
//     return result;
//   };
//   console.assert(aggregateFooBar({foo:true, bar:false}), "foo");
// }
// // Forbidden Environment Mutation //
// {
//   const createIncrement = () => {
//     let value = 0;
//     return  () => value += 1;
//   };
//   const increment = createIncrement();
//   console.assert(increment(), 1);
//   console.assert(increment(), 2);
// }
