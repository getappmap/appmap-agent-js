import * as Path from 'path';
import minimatch from 'minimatch';
import { assert } from '../assert.mjs';
import { resolvePath } from './cwd.mjs';

const options = {
  nocomment: true,
};

export const lookupGroupArray = (groups, path, placeholder) => {
  assert(Path.isAbsolute(path), 'expected an absolute path, got: %o', path);
  for (let index = 0; index < groups.length; index += 1) {
    const { glob, base, data } = groups[index];
    if (minimatch(Path.relative(base, path), glob, options)) {
      return data;
    }
  }
  return placeholder;
};

export const makeGroupArray = (specifier, data) => {
  const base = resolvePath('.');
  if (typeof specifier === 'string') {
    specifier = { glob: specifier };
  }
  specifier = {
    glob: null,
    path: null,
    dist: null,
    ...specifier,
  };
  const globs = [];
  if (specifier.glob !== null) {
    globs.push(specifier.glob);
  }
  if (specifier.path !== null) {
    let { path } = specifier;
    if (typeof path === 'string') {
      path = { name: specifier.path };
    }
    path = {
      name: undefined,
      deep: false,
      ...path,
    };
    let glob = path.name;
    if (!/\.[a-zA-Z0-9]+$/u.test(path.name)) {
      if (!glob.endsWith('/')) {
        glob = `${glob}/`;
      }
      if (path.deep) {
        glob = `${glob}**/`;
      }
      glob = `${glob}/*`;
    }
    globs.push(glob);
  }
  if (specifier.dist !== null) {
    let { dist } = specifier;
    if (typeof dist === 'string') {
      dist = { name: dist };
    }
    dist = {
      name: undefined,
      deep: false,
      external: false,
      ...dist,
    };
    let glob = `node_module/${dist.name}`;
    if (dist.nested) {
      glob = `**/${glob}`;
    }
    if (dist.deep) {
      glob = `${glob}/**`;
    }
    glob = `${glob}/*`;
    if (dist.external) {
      const depth = base.split('/').length - 1;
      for (let index = 0; index <= depth; index += 1) {
        globs.push(`${'../'.repeat(index)}${glob}`);
      }
    } else {
      globs.push(glob);
    }
  }
  return globs.map((glob) => ({
    glob,
    base,
    data,
  }));
};
