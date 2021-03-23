import minimist from 'minimist';
import main from '../lib/main.mjs';

process.stdout.write(main(minimist(process.argv.slice(2))));
