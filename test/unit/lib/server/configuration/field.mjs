
import * as Path from "path";
import { strict as Assert } from 'assert';
import { extendField, makeInitialFieldObject } from '../../../../../lib/server/configuration/field.mjs';

const extend = (name, value) => {
  const fields = makeInitialFieldObject();
  extendField(fields, name, value);
  return fields[name];
};

// main //

Assert.deepEqual(
  extend("main", "foo.js"),
  {path:Path.resolve("foo.js")}
);

// base //

Assert.equal(
  extend("base", "foo").path,
  Path.resolve("foo")
);

// language //

Assert.deepEqual(
  extend("language", "foo@bar"),
  {
    name: "foo",
    version: "bar"
  }
);

Assert.deepEqual(
  extend("language", "foo"),
  {
    name: "foo",
    version: null
  }
);

Assert.deepEqual(
  extend("language", "foo@bar@qux"),
  {
    name: "foo",
    version: "bar@qux"
  }
);

Assert.deepEqual(
  extend("language", {name:"foo", version:"bar"}),
  {
    name: "foo",
    version: "bar"
  }
);

// recorder //

Assert.deepEqual(
  extend("recorder", "foo"),
  {name:"foo"}
);

// recording //

Assert.deepEqual(
  extend("recording", "foo.bar"),
  {
    "defined-class": "foo",
    "method-id": "bar"
  }
);

// frameworks //

Assert.deepEqual(
  extend("frameworks", ["foo@bar"]),
  [{
    name: "foo",
    version: "bar"
  }]
);

// output //

Assert.deepEqual(
  extend("output", "foo"),
  {
    directory: Path.resolve("foo"),
    filename: null
  }
);

Assert.deepEqual(
  extend("output", {filename:"foo"}),
  {
    directory: Path.resolve("tmp", "appmap"),
    filename: "foo"
  }
);

// identity //

Assert.equal(
  extend("app-name", "foo"),
  "foo"
);

// enabled //

Assert.deepEqual(
  extend("enabled", true),
  [
    {glob: "**/*", base:"/", data:{enabled:true}},
  ]
);

Assert.deepEqual(
  extend("enabled", "*.js"),
  [
    {glob: "*.js", base:process.cwd(), data:{enabled:true}},
  ]
);

Assert.deepEqual(
  extend("enabled", {glob:"*.js", enabled:false}),
  [
    {glob: "*.js", base:process.cwd(), data:{enabled:false}},
  ]
);

// packages //

Assert.deepEqual(
  extend("packages", ["*.js"]),
  [
    {glob: "*.js", base:process.cwd(), data:{shallow:false, enabled:true, exclude:[]}},
  ]
);
