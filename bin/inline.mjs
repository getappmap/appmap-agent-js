import minimist from 'minimist';
import main from '../lib/server/inline-main.mjs';

main(minimist(process.argv.slice(2)));
