// import { assert } from "./assert.mjs";
// import { Left, Right } from './either.mjs';
// import { getInitialConfiguration } from './configuration/index.mjs';
// import { Dispatching } from './dispatching.mjs';
// import { getProtocol } from './protocol/index.mjs';
//

export const main = () => {};

// export const createServerAsync = (createServer, port) =>
//   new Promise((resolve, reject) => {
//     const server = createServer();
//     server.on('error', (error) => {
//       resolve(new Left(`failed to listen to port ${port} >> ${error.message}`));
//     });
//     server.on('listening', () => {
//       resolve(new Right(server));
//     });
//     server.listen(port);
//   });
//
// export const closeServerAsync = (server) =>
//   new Promise((resolve, reject) => {
//     server.on('error', reject);
//     server.on('close', resolve);
//     server.close();
//   });
//
// export const main = async (process, options) => {
//   let successAsync = (code) => Promise.resolve(new Right(code));
//   let failureAsync = (message) => Promise.resolve(new Left(message));
//   let either = getInitialConfiguration().extendWithData(
//     {
//       extend: 'appmap.yml',
//       ...options,
//     },
//     process.cwd(),
//   );
//   either = await either.bindAsync(async (configuration) => {
//     const protocol = configuration.getProtocol();
//     if (protocol === 'inline') {
//       return new Right(null);
//     }
//     const { createServer, attach } = getProtocol(protocol);
//     return (
//       await createServerAsync(createServer, configuration.getPort())
//     ).mapRight((server) => {
//       configuration = configuration
//         .extendWithData(
//           {
//             port: server.address().port,
//           },
//           '/',
//         )
//         .fromRight();
//       const dispatching = new Dispatching(configuration);
//       attach(server, dispatching);
//       successAsync = async (code) => {
//         await closeServerAsync(server);
//         return (await dispatching.terminateAsync()).either((message) => {
//           process.stderr.write(message);
//           process.stderr.write("\n");
//           process.exitCode = 1;
//         }, () => code);
//       };
//       failureAsync = async (message) => {
//         await closeServerAsync(server);
//         process.stderr.write(message);
//         process.stderr.write("\n");
//         process.exitCode = 1;
//         return 1;
//       };
//       return configuration;
//     });
//   });
//   either = await either.bindAsync(
//     (configuration) =>
//       new Promise((resolve, reject) => {
//         const iterator = configuration.getChilderen()[Symbol.iterator]();
//         let concurent = configuration.getConcurrency();
//         let code = 0;
//         let childeren = new Set();
//         const failure = (message) => {
//           assert(childeren !== null, "multiple resolutions");
//           for (let child of childeren) {
//             child.removeAllListeners("exit");
//             child.removeAllListeners("error");
//             child.kill("SIGKILL");
//           }
//           childeren = null;
//           resolve(new Left(message));
//         }
//         const success = (data) => {
//           assert(childeren !== null, "multiple resolutions");
//           childeren = null;
//           resolve(new Right(data));
//         }
//         const step = () => {
//           const { done, value } = iterator.next();
//           if (done) {
//             if (childeren.size === 0) {
//               success(code);
//             }
//           } else {
//             configuration.spawnChild(value).either(
//               failure,
//               (child) => {
//                 childeren.add(child);
//                 let stderr = null;
//                 let stdout = null;
//                 if (child.stdout !== null) {
//                   stdout = '';
//                   child.stdout.on('data', (data) => {
//                     stdout += data;
//                   });
//                 }
//                 if (child.stderr !== null) {
//                   stderr = '';
//                   child.stderr.on('data', (data) => {
//                     stderr += data;
//                   });
//                 }
//                 child.on('error', (error) => {
//                   failure(error.message);
//                 });
//                 child.on('exit', (status, signal) => {
//                   childeren.delete(child);
//                   process.stdout.write([this.spawnargs].join(' '));
//                   if (signal !== null) {
//                     code = 1;
//                     process.stdout.write(` killed with ${signal}${'\n'}`);
//                   } else {
//                     if (status !== 0) {
//                       code = 1;
//                     }
//                     process.stdout.write(` exit with ${String(status)}${'\n'}`);
//                   }
//                   if (this.stdout !== null && this.stdout !== '') {
//                     process.stdout.write('stdout:\n');
//                     process.stdout.write(stdout);
//                     process.stdout.write('\n');
//                   }
//                   if (stderr !== null && stderr !== '') {
//                     process.stdout.write('stderr:\n');
//                     process.stdout.write(stderr);
//                     process.stdout.write('\n');
//                   }
//                   step();
//                 });
//               },
//             );
//           }
//         };
//         for (let index = 0; index < concurent; index += 1) {
//           step();
//         }
//       }),
//   );
//   return await either.either(failureAsync, successAsync);
// };
