'use strict';

const assert = require('assert').strict;

const git = require('./git.js');

assert.deepEqual(git.isGitRepository(), true);

assert.deepEqual(get.getRepositoryURL(), '');
