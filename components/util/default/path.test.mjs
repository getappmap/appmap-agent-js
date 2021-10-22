import { strict as Assert } from "assert";
import {
  normalizePath,
  toRelativePath,
  toAbsolutePath,
  getFilename,
  getDirectory,
  getBasename,
  getExtension,
} from "./path.mjs";

const { equal: assertEqual } = Assert;

// normalizePath //
assertEqual(normalizePath("/foo"), "/foo");
assertEqual(normalizePath("foo"), "foo");
assertEqual(normalizePath("foo/"), "foo");
assertEqual(normalizePath("../foo"), "../foo");
assertEqual(normalizePath("./foo"), "foo");
assertEqual(normalizePath("/foo/bar/../qux"), "/foo/qux");

// toRelativePath //
assertEqual(toRelativePath("/foo", "/foo/bar"), "bar");
assertEqual(toRelativePath("/foo/", "/foo/bar"), "bar");
assertEqual(toRelativePath("/foo", "/foo/bar/"), "bar");
assertEqual(toRelativePath("/foo/bar/../bar/..", "/foo/bar/qux"), "bar/qux");
assertEqual(toRelativePath("/foo/bar", "/foo/bar/qux/"), "qux");
assertEqual(toRelativePath("/foo/../foo", "/foo"), ".");
assertEqual(toRelativePath("/foo/bar1", "/foo/bar2/qux"), "../bar2/qux");

// toAbsolutePath //
assertEqual(toAbsolutePath("/foo", "/bar"), "/bar");
assertEqual(toAbsolutePath("/foo", "bar"), "/foo/bar");

// getFilename //
assertEqual(getFilename("/foo/bar"), "bar");
assertEqual(getFilename("/"), "");

// getBasename //
assertEqual(getBasename("/foo/bar.qux"), "bar");
assertEqual(getBasename("/foo/bar"), "bar");
assertEqual(getBasename("/foo/.bar"), "");

// getExtension //
assertEqual(getExtension("/foo/bar.qux"), "qux");
assertEqual(getExtension("/foo/bar"), "");
assertEqual(getExtension("/foo/.bar"), "bar");

// getDirectory //
assertEqual(getDirectory("/foo/bar"), "/foo");
assertEqual(getDirectory("/"), "");
