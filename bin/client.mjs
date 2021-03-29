import Util from 'util';
import minimist from 'minimist';
import main from '../lib/main.mjs';

process.stdout.write(Util.inspect(main(minimist(process.argv.slice(2)))));
process.stdout.write('\n');
