// import { createServer } from "http2";
// import { logError } from "../../../util/index.mjs";
//
// const global_Promise = Promise;
// const global_JSON_parse = JSON.parse;
//
// /* c8 ignore start */
// const onSessionError = (error) => {
//   logError("http2 session error >> %e", error);
// };
// const onSessionFrameError = (type, code, id) => {
//   logError("http2 session frame error >> %j", { type, code, id });
// };
// const onStreamError = (error) => {
//   logError("http2 stream error >> %e", error);
// };
// const onStreamFrameError = (type, code, id) => {
//   logError("http2 stream frame error >> %j", { type, code, id });
// };
// /* c8 ignore stop */
//
// export default ({ backend: { open } }, { port }) => ({
//   openAsync: () =>
//     new global_Promise((resolve, reject) => {
//       const server = createServer();
//       server.on("error", reject);
//       const sessions = new Set();
//       server.on("session", (session) => {
//         const { receive, close } = open();
//         sessions.add(session);
//         session.on("close", () => {
//           sessions.delete(sessions);
//           close();
//         });
//         session.on("error", onSessionError);
//         session.on("frameError", onSessionFrameError);
//         session.on("stream", (stream) => {
//           let parts = [];
//           stream.setEncoding("utf8");
//           stream.on("error", onStreamError);
//           stream.on("frameError", onStreamFrameError);
//           stream.on("data", (data) => {
//             parts.push(data);
//           });
//           stream.on("end", () => {
//             receive(global_JSON_parse(parts.join("")));
//             stream.respond({ ":status": 200 });
//             stream.end();
//           });
//         });
//       });
//       server.on("listening", () => {
//         resolve({
//           server,
//           life: new global_Promise((resolve, reject) => {
//             server.on("error", (error) => {
//               server.close();
//               for (const session of sessions) {
//                 session.destroy();
//               }
//               reject(error);
//             });
//             server.on("close", resolve);
//           }),
//           close: () => {
//             server.close();
//             for (const session of sessions) {
//               session.close();
//             }
//           },
//         });
//       });
//       server.listen(port);
//     }),
// });
