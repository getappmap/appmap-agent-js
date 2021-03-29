//
// import minimist from 'minimist';
// import { src, lib } from './ordering.mjs';
//
// const cook = (path, raw) => {
//   if (!raw) {
//     spawnSync(`npx prettier --write ${path}`);
//     spawnSync(`npx eslint ${path}`);
//   }
// };
//
// const test = (instrumenter, batch, target, unit) => {
//   spawnSync(`node ${unit}`);
//   if (batch) {
//     spawnSync(
//       `npx ${instrumenter} --reporter=text-summary --check-coverage --branches 100 --functions 100 --lines 100 --statements 100 --include ${target} node ${unit}`,
//     );
//   } else {
//     spawnSync(
//       `npx ${instrumenter} --reporter=html --report-dir=coverage --include ${target} node ${unit}`,
//     );
//     spawnSync(`open coverage/index.html`);
//   }
// };
//
// const run = (target, raw, batch) => {
//   process.stdout.write(`${Chalk.bgMagenta(target)}${'\n'}`);
//   cook(target, raw);
//   if (target.startsWith('lib/') && target.endsWith('.mjs')) {
//     const unit = `test/unit/${target}`;
//     cook(unit, raw);
//     test('c8', batch, target, unit);
//   }
//   if (target.startsWith('src/') && target.endsWith('.js')) {
//     const unit = `test/unit/${target.substring(0, target.length - 3)}.mjs`;
//     cook(unit, raw);
//     test('nyc --hook-run-in-this-context', batch, target, unit);
//   }
// };
//
// const main = (argv) => {
//   let predicate = (target) => true;
//   if (argv.target !== null) {
//     predicate = (target) =>
//   }
//   lib.forEach((target) => {
//     const path1 = `lib/${target}{.mjs}`;
//     const path2 = `test/unit/lib/${target}{.mjs}`;
//     if (!argv.raw) {
//       cook(path1);
//       cook(path2);
//     }
//     test('c8', true, path1, path2);
//   });
//   src.forEach((target) => {
//     const path1 = `src/${target}{.js}`;
//     const path2 = `test/unit/src/${target}{.mjs}`;
//     if (!argv.raw) {
//       cook(path1);
//       cook(path2);
//     }
//     test('nyc --hook-run-in-this-context', true, path1, path2);
//   });
// };
//
// main({
//   target: null,
//   raw: false,
//   ...minimist(process.argv.slice(2)),
// });
