import { assertEqual } from "../../__fixture__.mjs";

import {
  toAbsoluteUrl,
  toRelativeUrl,
  toDirectoryUrl,
  getUrlFilename,
  getUrlBasename,
  getUrlExtension,
  getLastUrlExtension,
} from "./index.mjs";

////////////////////
// getUrlFilename //
////////////////////

assertEqual(getUrlFilename("protocol://host/directory/#hash"), null);

assertEqual(getUrlFilename("protocol://host#hash"), null);

assertEqual(
  getUrlFilename("protocol://host/directory/filename#hash"),
  "filename",
);

////////////////////
// getUrlBasename //
////////////////////

assertEqual(getUrlBasename("protocol://host/directory/#hash"), null);

assertEqual(
  getUrlBasename("protocol://host/directory/filename#hash"),
  "filename",
);

assertEqual(
  getUrlBasename("protocol://host/directory/basename.extension#hash"),
  "basename",
);

/////////////////////
// getUrlExtension //
/////////////////////

assertEqual(getUrlExtension("protocol://host/directory/#hash"), null);

assertEqual(getUrlExtension("protocol://host/directory/filename#hash"), null);

assertEqual(
  getUrlExtension(
    "protocol://host/directory/basename.extension1.extension2#hash",
  ),
  ".extension1.extension2",
);

/////////////////////////
// getLastUrlExtension //
/////////////////////////

assertEqual(getLastUrlExtension("protocol://host/directory/#hash"), null);

assertEqual(
  getLastUrlExtension("protocol://host/directory/filename#hash"),
  null,
);

assertEqual(
  getLastUrlExtension(
    "protocol://host/directory/basename.extension1.extension2#hash",
  ),
  ".extension2",
);

////////////////////
// toDirectoryUrl //
////////////////////

assertEqual(
  toDirectoryUrl("protocol://host/directory/#hash"),
  "protocol://host/directory/#hash",
);

assertEqual(
  toDirectoryUrl("protocol://host/directory#hash"),
  "protocol://host/directory/#hash",
);

/////////////////////////////
// toRelativeUrl >> special //
/////////////////////////////

assertEqual(
  toRelativeUrl(
    "protocol1://host/directory/filename#hash",
    "protocol2://host/directory/filename#hash",
  ),
  null,
);

assertEqual(
  toRelativeUrl(
    "protocol://host1/directory/filename#hash",
    "protocol://host2/directory/filename#hash",
  ),
  null,
);

assertEqual(
  toRelativeUrl(
    "file://host/v:/directory/filename#hash",
    "file://host/w:/directory/filename#hash",
  ),
  null,
);

assertEqual(
  toRelativeUrl(
    "file://host/W:/DIRECTORY/FILENAME#HASH",
    "file://host/w:/directory/#hash",
  ),
  "filename#HASH",
);

assertEqual(
  toRelativeUrl("file://host/directory/filename#hash", "file://host/#hash"),
  "directory/filename#hash",
);

assertEqual(
  toRelativeUrl(
    "protocol://host/directory /filename1 #hash1",
    "PROTOCOL://HOST/directory%20/filename2%20#hash2",
  ),
  "filename1%20#hash1",
);

///////////////////
// toAbsoluteUrl //
///////////////////

assertEqual(
  toAbsoluteUrl("w:/directory1/filename1", "file:///v:/directory2/filename2"),
  "file:///w:/directory1/filename1",
);

assertEqual(
  toAbsoluteUrl("w://directory1/filename1", "file:///v:/directory2/filename2"),
  "w://directory1/filename1",
);

assertEqual(
  toAbsoluteUrl("ww:/directory1/filename1", "file:///v:/directory2/filename2"),
  "ww:/directory1/filename1",
);

///////////////////////////
// toRelativeUrl >> basic //
///////////////////////////

const test = (url, base, relative, alternative_url = url) => {
  assertEqual(toRelativeUrl(url, base), relative);
  assertEqual(toAbsoluteUrl(relative, base), alternative_url);
};

// common directory //

test(
  "protocol://host/directory/filename1#hash1",
  "protocol://host/directory/filename2#hash2",
  "filename1#hash1",
);

test(
  "protocol://host/directory/#hash1",
  "protocol://host/directory/filename#hash2",
  ".#hash1",
);

test(
  "protocol://host/directory#hash1",
  "protocol://host/directory/filename#hash2",
  ".#hash1",
  "protocol://host/directory/#hash1",
);

// child //

test(
  "protocol://host/directory1/directory2/filename1#hash1",
  "protocol://host/directory1/filename2#hash2",
  "directory2/filename1#hash1",
);

test(
  "protocol://host/directory1/directory2/#hash1",
  "protocol://host/directory1/filename#hash2",
  "directory2/#hash1",
);

test(
  "protocol://host/directory1/directory2#hash1",
  "protocol://host/directory1/filename#hash2",
  "directory2#hash1",
);

// parent //

test(
  "protocol://host/directory1/filename1#hash1",
  "protocol://host/directory1/directory2/filename2#hash2",
  "../filename1#hash1",
);

test(
  "protocol://host/directory1/#hash1",
  "protocol://host/directory1/directory2/filename#hash2",
  "../#hash1",
);

test(
  "protocol://host/directory1#hash1",
  "protocol://host/directory1/directory2/filename#hash2",
  "..#hash1",
  "protocol://host/directory1/#hash1",
);

// sibling //

test(
  "protocol://host/directory1/directory2/filename1#hash1",
  "protocol://host/directory1/directory3/filename2#hash2",
  "../directory2/filename1#hash1",
);

test(
  "protocol://host/directory1/directory2/#hash1",
  "protocol://host/directory1/directory3/filename#hash2",
  "../directory2/#hash1",
);

test(
  "protocol://host/directory1/directory2#hash1",
  "protocol://host/directory1/directory3/filename#hash2",
  "../directory2#hash1",
);
