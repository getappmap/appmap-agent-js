// import { strict as Assert } from "assert";
// import { request } from "http";
// import component from "./index.mjs";
//
// const testAsync = async () => {
//   // happy path //
//   {
//     const { life, close, server } = await component(
//       {
//         backend: {
//           initialize: () => ({
//             close: () => {},
//             send: (data) => {
//               Assert.equal(data, 123);
//               close();
//             },
//           }),
//         },
//       },
//       { port: 0 },
//     ).initializeAsync();
//     const { port } = server.address();
//     const req = request({
//       method: "POST",
//       port,
//     });
//     req.end(JSON.stringify({ head: "foo", body: 123 }), "utf8");
//     req.on("response", (res) => {
//       Assert.equal(res.statusCode, 200);
//       res.on("data", () => {
//         Assert.fail();
//       });
//       res.on("end", () => {});
//     });
//     await life;
//   }
//   // unhappy path (unix-domain socket) //
//   {
//     let resolve;
//     const promise = new Promise((_resolve) => {
//       resolve = _resolve;
//     });
//     const { life, server } = await component(
//       {
//         backend: {
//           open: () => ({
//             close: () => {
//               resolve();
//             },
//             send: (data) => {
//               Assert.equal(data, 123);
//               server.emit("error", new Error("BOUM"));
//             },
//           }),
//         },
//       },
//       { port: 0 },
//     ).initializeAsync();
//     const { port } = server.address();
//     const req = request({
//       method: "POST",
//       port,
//     });
//     req.end(JSON.stringify({ head: "foo", body: 123 }), "utf8");
//     req.on("error", () => {});
//     try {
//       await life;
//       Assert.fail();
//     } catch (error) {
//       Assert.equal(error.message, "BOUM");
//     }
//     await promise;
//   }
// };
//
// testAsync().catch((error) => {
//   throw error;
// });
