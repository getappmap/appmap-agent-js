import { spawn } from "child_process";
import { rm as rmAsync } from "fs/promises";
import { fileURLToPath } from "url";
import Mysql from "mysql";
import {
  getFreshTemporaryURL,
  assertEqual,
  assertDeepEqual,
} from "../../__fixture__.mjs";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";

const {
  Reflect: {getOwnPropertyDescriptor},
  process,
  Promise,
  String,
  setTimeout,
  URL,
  undefined,
} = globalThis;

// TODO investigate why this fails on travis.

if (getOwnPropertyDescriptor(process.env, "TRAVIS") !== undefined) {
  process.exit(0);
}

const { default: HookMysql } = await import("./mysql.mjs");

const promiseTermination = (child) =>
  new Promise((resolve, reject) => {
    child.on("exit", (status, signal) => resolve({ status, signal }));
    child.on("error", reject);
  });

const port = 3306;
const url = getFreshTemporaryURL();

const proceedAsync = async () => {
  const dependencies = await buildTestDependenciesAsync(import.meta.url);
  const { testHookAsync } = await buildTestComponentAsync("hook-fixture");
  const component = HookMysql(dependencies);
  assertDeepEqual(
    await testHookAsync(
      component,
      { configuration: { hooks: { mysql: false } } },
      async () => {},
    ),
    [],
  );
  assertDeepEqual(
    await testHookAsync(
      component,
      { configuration: { hooks: { mysql: true } } },
      async () => {
        const connection = Mysql.createConnection({
          host: "localhost",
          port,
          user: "root",
        });
        try {
          await new Promise((resolve, reject) => {
            try {
              connection.on("error", reject);
              connection.connect();
              connection.query(
                "SELECT ? * ? AS solution;",
                [2, 3],
                function (error, results) {
                  try {
                    if (error) {
                      throw error;
                    }
                    assertEqual(results[0].solution, 6);
                    resolve();
                  } catch (error) {
                    reject(error);
                  }
                },
              );
            } catch (error) {
              reject(error);
            }
          });
        } finally {
          connection.destroy();
        }
      },
    ),
    [
      {
        type: "event",
        site: "begin",
        tab: 1,
        group: 0,
        time: 0,
        payload: {
          type: "bundle",
        },
      },
      {
        type: "event",
        site: "before",
        tab: 2,
        group: 0,
        time: 0,
        payload: {
          type: "query",
          database: "mysql",
          version: null,
          sql: "SELECT ? * ? AS solution;",
          parameters: [
            { type: "number", print: "2" },
            { type: "number", print: "3" },
          ],
        },
      },
      {
        type: "event",
        site: "after",
        tab: 2,
        group: 0,
        time: 0,
        payload: {
          type: "answer",
        },
      },
      {
        type: "event",
        site: "end",
        tab: 1,
        group: 0,
        time: 0,
        payload: {
          type: "bundle",
        },
      },
    ],
  );
};

if (getOwnPropertyDescriptor(process.env, "TRAVIS") !== undefined) {
  await proceedAsync();
} else {
  assertDeepEqual(
    await promiseTermination(
      spawn(
        "/usr/local/mysql/bin/mysqld",
        [
          "--initialize-insecure",
          "--default-authentication-plugin=mysql_native_password",
          "--datadir",
          fileURLToPath(url),
        ],
        { stdio: "inherit" },
      ),
    ),
    { signal: null, status: 0 },
  );
  const child = spawn(
    "/usr/local/mysql/bin/mysqld",
    ["--port", String(port), "--datadir", fileURLToPath(url)],
    { stdio: "inherit" },
  );
  const termination = promiseTermination(child);
  while (
    /* eslint-disable no-constant-condition */ true /* eslint-enable no-constant-condition */
  ) {
    await new Promise((resolve) => {
      setTimeout(resolve, 1000);
    });
    const { status, signal } = await promiseTermination(
      spawn(
        "/usr/local/mysql/bin/mysqladmin",
        [
          "--host",
          "localhost",
          "--port",
          String(port),
          "--user",
          "root",
          "status",
        ],
        { stdio: "inherit" },
      ),
    );
    assertEqual(signal, null);
    if (status === 0) {
      break;
    }
  }
  try {
    await proceedAsync();
  } finally {
    // SIGKILL will leave stuff in /tmp which prevent next mysqld to run
    child.kill("SIGTERM");
    await termination;
    await rmAsync(new URL(url), { recursive: true });
  }
}
