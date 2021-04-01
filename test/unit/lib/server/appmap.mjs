import { strict as Assert } from 'assert';
import * as FileSystem from 'fs';
import Appmap from '../../../../lib/server/appmap.mjs';

const OUTDIR = 'tmp/appmap';
const NAME = "metadata-name";
const LANGUAGE_VERSION = 123;

const namespace = {};
const appmap = new Appmap({name:NAME, language:{version:LANGUAGE_VERSION}}, namespace);

Assert.equal(appmap.getNamespace(), namespace);
Assert.equal(appmap.getLanguageVersion(), LANGUAGE_VERSION);
appmap.addEntity('entity1');
appmap.addEvent('event1');
appmap.addEvent('event2');
appmap.archive(OUTDIR, 'termination1');
appmap.addEntity('entity2');
appmap.addEvent('event3');
appmap.archive(OUTDIR, 'termination2');
const json = JSON.parse(
  FileSystem.readFileSync(`${OUTDIR}/${NAME}.appmap.json`, 'utf8'),
);
Assert.deepEqual(json.classMap, ['entity1']);
Assert.deepEqual(json.events, ['event1', 'event2']);
