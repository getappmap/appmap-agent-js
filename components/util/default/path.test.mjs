import { strict as Assert } from "assert";
import {
  toRelativePath,
  toAbsolutePath,
  getFilename,
  getDirectory,
} from "./path.mjs";

const { equal: assertEqual } = Assert;

// toRelativePath //
assertEqual(toRelativePath("/foo", "/foo/bar"), "bar");
assertEqual(toRelativePath("/foo/", "/foo/bar"), "bar");
assertEqual(toRelativePath("/foo", "/foo/bar/"), "bar");
assertEqual(toRelativePath("/foo/bar/../bar/..", "/foo/bar/qux"), "bar/qux");
assertEqual(toRelativePath("/foo/bar", "/foo/bar/qux/"), "qux");
assertEqual(toRelativePath("/foo", "/foo"), ".");
assertEqual(toRelativePath("/foo/bar1", "/foo/bar2/qux"), "../bar2/qux");

// toAbsolutePath //
assertEqual(toAbsolutePath("/foo", "/bar"), "/bar");
assertEqual(toAbsolutePath("/foo", "bar"), "/foo/bar");

// getFilename //
assertEqual(getFilename("/foo/bar"), "bar");
assertEqual(getFilename("/"), "");

// getDirectory //
assertEqual(getDirectory("/foo/bar"), "/foo");
assertEqual(getDirectory("/"), "");
