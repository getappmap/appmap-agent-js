/* global APPMAP_GLOBAL_GET_CLASS_NAME */

import { strict as Assert } from 'assert';
import { load } from '../__fixture__.mjs';

load('src/es2015/get-class-name.js');

Assert.equal(APPMAP_GLOBAL_GET_CLASS_NAME({}), 'TODO');
