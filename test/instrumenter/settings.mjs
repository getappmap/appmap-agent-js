import * as Assert from 'assert';
import * as Logger from '../../lib/instrumenter/logger.mjs';
import Settings from '../../lib/instrumenter/settings.mjs';

Logger.reloadGlobalLevel('DEBUG');

const AssertStrict = Assert.strict;

const settings = new Settings({
  APPMAP: 'tRuE',
  APPMAP_CONFIG: 'test/data/config/appmap.yml',
  APPMAP_OUTPUT_DIR: 'appmap/output/dir/',
});

console.log('foo', settings);
AssertStrict.equal(settings.getOutputDir(), 'appmap/output/dir/');
AssertStrict.equal(settings.getAppName(), 'appname');
AssertStrict.equal(settings.isExcluded('package', 'Class'), true);
AssertStrict.equal(settings.isExcluded('package', 'Foo'), false);
AssertStrict.equal(settings.getInstrumentationDepth('package1'), Infinity);
AssertStrict.equal(settings.getInstrumentationDepth('bar'), 0);
