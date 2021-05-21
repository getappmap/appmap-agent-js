import {spawnSync} from '../spawn-sync.mjs';

for (let name of ["normal", "mocha"]) {
  process.stdout.write(`${"\n"}${name}...${"\n"}`);
  spawnSync('node', [`test/integration/${name}.mjs`], null);
}
