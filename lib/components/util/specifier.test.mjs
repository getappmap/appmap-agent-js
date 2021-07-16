import { strict as Assert } from "assert";
import {
  convertSpecifierToRegExp,
  makePathSpecifier,
  makeDistSpecifier,
  makeGlobSpecifier,
  makeRegExpSpecifier,
} from "./specifier.mjs";

//////////
// path //
//////////

Assert.equal(
  convertSpecifierToRegExp(makePathSpecifier("filename")).test("filename"),
  true,
);

for (const recursive of [true, false]) {
  Assert.equal(
    convertSpecifierToRegExp(
      makePathSpecifier("directory1", { recursive }),
    ).test("directory1/directory2/filename"),
    recursive,
  );
}

//////////
// dist //
//////////

for (const recursive of [true, false]) {
  Assert.equal(
    convertSpecifierToRegExp(
      makeDistSpecifier("package/lib", { recursive }),
    ).test("node_modules/package/lib/directory/filename"),
    recursive,
  );
}

for (const external of [true, false]) {
  Assert.equal(
    convertSpecifierToRegExp(
      makeDistSpecifier("package/lib", { external }),
    ).test("../node_modules/package/lib/filename"),
    external,
  );
}

//////////
// glob //
//////////

Assert.equal(
  convertSpecifierToRegExp(makeGlobSpecifier("*.mjs")).test(
    "directory/filename.mjs",
  ),
  false,
);

Assert.equal(
  convertSpecifierToRegExp(makeGlobSpecifier("**/*.mjs")).test(
    "directory/filename.mjs",
  ),
  true,
);

//////////////
// patttern //
//////////////

Assert.equal(
  convertSpecifierToRegExp(makeRegExpSpecifier("^fo+$", { flags: "i" })).test(
    "Foo",
  ),
  true,
);

Assert.equal(
  convertSpecifierToRegExp(makeRegExpSpecifier("^fo+$")).test("Foo"),
  false,
);
