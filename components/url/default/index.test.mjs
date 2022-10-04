import { assertEqual } from "../../__fixture__.mjs";
import { platform as getPlatform } from "os";
import {
  pathifyURL,
  urlifyPath,
  removeLastURLSegment,
  appendURLSegment,
  appendURLSegmentArray,
  getLastURLSegment,
} from "./index.mjs?env=test";

// removeLastURLSegment //
assertEqual(
  removeLastURLSegment("http://host/directory/filename"),
  "http://host/directory",
);

// pathifyURL //
assertEqual(pathifyURL("http://host1/foo/bar", "http://host2/qux"), null);
assertEqual(
  pathifyURL("http://localhost/foo/bar/q%75x", "http://localhost/foo", true),
  "./bar/qux",
);
assertEqual(
  pathifyURL("http://localhost/foo//bar/qux/", "http://localhost//foo", false),
  "bar/qux",
);
assertEqual(
  pathifyURL("http://localhost/foo/bar", "http://localhost/foo/bar"),
  ".",
);
assertEqual(
  pathifyURL("http://localhost/foo/bar/qux", "http://localhost//foo/bar/buz"),
  "../qux",
);

// pathifyURL UNC //
// assertEqual(
//   pathifyURL("file:////host/shared/foo/bar/qux", "file:////host/shared/foo"),
//   "bar/qux",
// );
// assertEqual(
//   pathifyURL(
//     "file:////host1/shared/foo/bar/qux",
//     "file:////host2/shared/foo",
//   ),
//   null,
// );
// assertEqual(
//   pathifyURL(
//     "file:////host/shared1/foo/bar/qux",
//     "file:////host/shared2/foo",
//   ),
//   null,
// );

// pathifyURL Windows Drive //
assertEqual(pathifyURL("file:///C:/foo/bar/qux", "file:///C:/foo"), "bar/qux");
assertEqual(pathifyURL("file:///C:/foo/bar/qux", "file:////D:/foo"), null);

// appendURLSegment //
assertEqual(
  appendURLSegment("http://localhost/foo", "bar"),
  "http://localhost/foo/bar",
);
assertEqual(
  appendURLSegment("http://localhost/foo/", "bar"),
  "http://localhost/foo/bar",
);
assertEqual(
  appendURLSegment("http://localhost/foo", "bar qux"),
  "http://localhost/foo/bar%20qux",
);
assertEqual(
  appendURLSegment("http://localhost/foo", "."),
  "http://localhost/foo/",
);
assertEqual(
  appendURLSegment("http://localhost/foo/bar", ".."),
  "http://localhost/foo/",
);

// appendURLSegmentArray
assertEqual(
  appendURLSegmentArray("http://localhost/foo", ["bar", "qux"]),
  "http://localhost/foo/bar/qux",
);

// getLastURLSegment
assertEqual(getLastURLSegment("http://localhost/foo/bar%20qux"), "bar qux");

if (getPlatform() === "win32") {
  assertEqual(
    urlifyPath("foo\\bar", "file://host/qux"),
    "file://host/qux/foo/bar",
  );
  assertEqual(urlifyPath("C:\\foo\\bar", "file:///qux"), "file:///C:/foo/bar");
  // https://github.com/nodejs/node/issues/41371
  // assertEqual(
  //   urlifyPath("C:\\foo\\bar", "file://host/qux"),
  //   "file://host/C:/foo/bar",
  // );
} else {
  // urlifyPath //
  assertEqual(
    urlifyPath("foo/bar", "http://localhost/qux"),
    "http://localhost/qux/foo/bar",
  );
  assertEqual(
    urlifyPath("/foo/bar", "http://localhost/qux"),
    "http://localhost/foo/bar",
  );
  assertEqual(
    urlifyPath("/foo bar", "http://localhost/"),
    "http://localhost/foo%20bar",
  );
}
