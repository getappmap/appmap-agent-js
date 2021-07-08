import { strict as Assert } from "assert";
import { convertSpecifierToRegExp } from "./specifier.mjs";

//////////
// path //
//////////

Assert.equal(
  convertSpecifierToRegExp({
    path: "filename",
  }).test("filename"),
  true,
);

for (const recursive of [true, false]) {
  Assert.equal(
    convertSpecifierToRegExp({
      path: "directory1",
      recursive,
    }).test("directory1/directory2/filename"),
    recursive,
  );
}

//////////
// dist //
//////////

for (const recursive of [true, false]) {
  Assert.equal(
    convertSpecifierToRegExp({
      dist: "package/lib",
      external: false,
      recursive,
    }).test("node_modules/package/lib/directory/filename"),
    recursive,
  );
}

for (const external of [true, false]) {
  Assert.equal(
    convertSpecifierToRegExp({
      dist: "package/lib",
      external,
      recursive: false,
    }).test("../node_modules/package/lib/filename"),
    external,
  );
}

//////////
// glob //
//////////

Assert.equal(
  convertSpecifierToRegExp({
    glob: "*.mjs",
  }).test("directory/filename.mjs"),
  false,
);

Assert.equal(
  convertSpecifierToRegExp({
    glob: "**/*.mjs",
  }).test("directory/filename.mjs"),
  true,
);

//////////////
// patttern //
//////////////

Assert.equal(
  convertSpecifierToRegExp({
    pattern: "^[^o]*$",
  }).test("foo"),
  false,
);

Assert.equal(
  convertSpecifierToRegExp({
    pattern: "^[^o]*$",
  }).test("bar"),
  true,
);
