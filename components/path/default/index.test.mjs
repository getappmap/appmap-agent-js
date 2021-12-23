import { assertEqual } from "../../__fixture__.mjs";
import { buildTestDependenciesAsync } from "../../build.mjs";
import OperatingSystem from "os";

let platform = null;
OperatingSystem.platform = () => platform;

const { default: Path } = await import("./index.mjs");

const testAsync = async (root, sep) => {
  const {
    normalizePath,
    toRelativePath,
    toAbsolutePath,
    getFilename,
    getDirectory,
    getBasename,
    getExtension,
    joinPath,
  } = Path(await buildTestDependenciesAsync(import.meta.url));
  // normalizePath //
  assertEqual(normalizePath(`${root}foo`), `${root}foo`);
  assertEqual(normalizePath(`foo`), `foo`);
  assertEqual(normalizePath(`foo${sep}`), `foo`);
  assertEqual(normalizePath(`..${sep}foo`), `..${sep}foo`);
  assertEqual(normalizePath(`.${sep}foo`), `foo`);
  assertEqual(
    normalizePath(`${root}foo${sep}bar${sep}..${sep}qux`),
    `${root}foo${sep}qux`,
  );
  // toRelativePath //
  assertEqual(toRelativePath(`${root}foo`, `${root}foo${sep}bar`), `bar`);
  assertEqual(toRelativePath(`${root}foo${sep}`, `${root}foo${sep}bar`), `bar`);
  assertEqual(toRelativePath(`${root}foo`, `${root}foo${sep}bar${sep}`), `bar`);
  assertEqual(
    toRelativePath(
      `${root}foo${sep}bar${sep}..${sep}bar${sep}..`,
      `${root}foo${sep}bar${sep}qux`,
    ),
    `bar${sep}qux`,
  );
  assertEqual(
    toRelativePath(`${root}foo${sep}bar`, `${root}foo${sep}bar${sep}qux${sep}`),
    `qux`,
  );
  assertEqual(toRelativePath(`${root}foo${sep}..${sep}foo`, `${root}foo`), `.`);
  assertEqual(
    toRelativePath(`${root}foo${sep}bar1`, `${root}foo${sep}bar2${sep}qux`),
    `..${sep}bar2${sep}qux`,
  );
  assertEqual(
    toRelativePath(`${root}foo${sep}bar`, `${root}qux`),
    `..${sep}..${sep}qux`,
  );
  // toAbsolutePath //
  assertEqual(toAbsolutePath(`${root}foo`, `${root}bar`), `${root}bar`);
  assertEqual(toAbsolutePath(`${root}foo`, `bar`), `${root}foo${sep}bar`);
  // getFilename //
  assertEqual(getFilename(`${root}foo${sep}bar`), `bar`);
  assertEqual(getFilename(`${root}`), ``);
  // getBasename //
  assertEqual(getBasename(`${root}foo${sep}bar.qux`), `bar`);
  assertEqual(getBasename(`${root}foo${sep}bar`), `bar`);
  assertEqual(getBasename(`${root}foo${sep}.bar`), ``);
  // getExtension //
  assertEqual(getExtension(`${root}foo${sep}bar.qux`), `qux`);
  assertEqual(getExtension(`${root}foo${sep}bar`), ``);
  assertEqual(getExtension(`${root}foo${sep}.bar`), `bar`);
  // getDirectory //
  assertEqual(getDirectory(`${root}foo${sep}bar`), `${root}foo`);
  assertEqual(getDirectory(`${root}`), `${root}`);
  // joinPath //
  assertEqual(joinPath(`foo${sep}bar`, "qux"), `foo${sep}bar${sep}qux`);
};

platform = "darwin";
await testAsync("/", "/");

platform = "win32";
await testAsync("C:\\", "\\");
