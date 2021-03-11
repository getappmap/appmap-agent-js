'use strict';

var UAParserJS = require('ua-parser-js');

var engine =
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
