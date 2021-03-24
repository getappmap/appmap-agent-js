/* global APPMAP_GLOBAL_SEND */

// var UAParserJS = require('ua-parser-js');

APPMAP_GLOBAL_SEND({
  type: 'engine',
  name: window.navigator.userAgent,
});
