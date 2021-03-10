'use strict';

const assert = require('assert').strict;

const git = require('./git.js');

assert.deepEqual(git.isRepository(), true);

assert.deepEqual(
  git.getRepositoryURL(),
  'https://github.com/applandinc/appmap-agent-js'
);

assert.deepEqual(git.getBranchName(), 'main');

assert.ok(typeof git.getCommitHash() === 'string');
