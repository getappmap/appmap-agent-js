import {createServer} from "net";

const server = createServer();
server.listen(8000);
server.on("connection", (socket) => {
  socket.on("data", (data) => {
    process.stdout.write(data);
  });
});

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
