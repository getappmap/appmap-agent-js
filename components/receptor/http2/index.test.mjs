// import { strict as Assert } from "assert";
// import { connect } from "http2";
// import component from "./index.mjs";
//
// const testAsync = async () => {
//   // happy path //
//   {
//     const trace = [];
//     const { life, close, server } = await component(
//       {
//         backend: {
//           open: () => ({
//             close: () => {
//               close();
//             },
//             receive: (data) => {
//               trace.push(data);
//             },
//           }),
//         },
//       },
//       { port: 0 },
//     ).openAsync();
//     const { port } = server.address();
//     const authority = `http://localhost:${String(port)}`;
//     connect(authority);
//     const session = connect(authority);
//     const request = session.request({ ":method": "POST", ":path": "/" });
//     request.end("123", "utf8");
//     request.on("response", ({ ":status": status }) => {
//       Assert.equal(status, 200);
//       request.on("data", () => {
//         Assert.fail();
//       });
//       request.on("end", close);
//     });
//     await life;
//     Assert.deepEqual(trace, [123]);
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
//             receive: (data) => {
//               Assert.fail();
//             },
//           }),
//         },
//       },
//       { port: 0 },
//     ).openAsync();
//     server.on("session", (session) => {
//       server.emit("error", new Error("BOUM"));
//     });
//     const { port } = server.address();
//     const authority = `http://localhost:${String(port)}`;
//     connect(authority);
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
