import { strict as Assert } from 'assert';
import { home } from '../../../lib/home.js';

Assert.equal(home, process.cwd());
