import * as FileSystem from 'fs';
import { strict as Assert } from 'assert';
import { getInitialConfiguration } from '../../../../../lib/server/configuration/index.mjs';

////////////////////
// extendWithFile //
////////////////////

Assert.match(
  getInitialConfiguration().extendWithFile('tmp/test/foo.bar', process.cwd()).fromLeft(),
  /^invalid extension/,
);

try {
  FileSystem.unlinkSync('tmp/test/foo.json');
} catch (error) {
  Assert.equal(error.code, "ENOENT");
}

Assert.match(
  getInitialConfiguration().extendWithFile('tmp/test/foo.json', process.cwd()).fromLeft(),
  /^failed to read/,
);

FileSystem.writeFileSync('tmp/test/foo.json', 'bar', 'utf8');
Assert.match(
  getInitialConfiguration().extendWithFile('tmp/test/foo.json').fromLeft(),
  /^failed to parse/,
);

FileSystem.writeFileSync('tmp/test/foo.json', JSON.stringify({extends:"foo.json"}), 'utf8');
Assert.match(
  getInitialConfiguration().extendWithFile('tmp/test/foo.json').fromLeft(),
  /^detected loop/,
);

////////////////////
// extendWithData //
////////////////////

Assert.equal(
  getInitialConfiguration().extendWithData({'app-name':'foo'}, '/base').fromRight().data['app-name'],
  "foo"
);

///////////////
// isEnabled //
///////////////

Assert.equal(
  getInitialConfiguration().extendWithData({main:'main.js'}, '/base').fromRight().isEnabled(),
  false
);

Assert.equal(
  getInitialConfiguration().extendWithData({
    enabled: true,
    main:'main.js'
  }, '/base').fromRight().isEnabled(),
  true
);
////////////////////////
// getInstrumentation //
////////////////////////

Assert.deepEqual(
  getInitialConfiguration().extendWithData({
    exclude: ["foo"],
    packages:[
      {
        exclude: ["bar"],
        path:'qux.js', shallow:true, enabled:true
      }]
    }, '/base').fromRight().getInstrumentation('/base/qux.js'),
  {
    enabled: true,
    shallow: true,
    exclude: ["bar", "foo"]
  }
);

///////////////////
// getOutputPath //
///////////////////

Assert.equal(
  getInitialConfiguration().extendWithData({
    output: {"directory-path": 'foo', "file-name":'bar'},
  }, '/base').fromRight().getOutputPath(),
  '/base/foo/bar'
);

Assert.equal(
  getInitialConfiguration().extendWithData({
    output: {"directory-path": 'foo'},
    main: 'bar/qux',
  }, '/base').fromRight().getOutputPath(),
  '/base/foo/-base-bar-qux'
);

Assert.equal(
  getInitialConfiguration().extendWithData({
    output: {"directory-path": 'foo'},
    "map-name": 'bar/qux',
  }, '/base').fromRight().getOutputPath(),
  '/base/foo/bar-qux'
);

/////////////////
// getMetaData //
/////////////////


Assert.equal(
  typeof getInitialConfiguration().getMetaData(),
  "object"
);

Assert.equal(
  getInitialConfiguration().getMetaData().language.engine,
  null
);

Assert.equal(
  getInitialConfiguration().extendWithData({
    engine: "foo@bar"
  }, "/").fromRight().getMetaData().language.engine,
  "foo@bar"
);

////////////
// Others //
////////////

Assert.equal(
  getInitialConfiguration().getBasePath(),
  "/"
);

Assert.equal(
  getInitialConfiguration().getEscapePrefix(),
  "APPMAP"
);

Assert.equal(
  getInitialConfiguration().getLanguageVersion(),
  "2020"
);

Assert.equal(
  getInitialConfiguration().isClassMapPruned(),
  false
);

Assert.equal(
  getInitialConfiguration().isEventPruned(),
  false
);
