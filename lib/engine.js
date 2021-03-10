'use strict';

const UAParserJS = require('ua-parser-js');

const engine =
  typeof process !== undefined
    ? {
        name: 'v8',
        version: process.versions.v8,
      }
    : typeof navigator !== undefined
    ? new UAParserJS().getEngine(window.navigator.userAgent)
    : {
        name: 'unknow',
        version: 'unknow',
      };

exports.getName = () => engine.name;

exports.getVersion = () => engine.version;
