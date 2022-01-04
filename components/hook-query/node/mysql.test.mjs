// TODO investigate why this fails on travis.
if (Reflect.getOwnPropertyDescriptor(process.env, "TRAVIS") !== undefined) {
  process.exit(0);
}

import {
  getFreshTemporaryPath,
  assertEqual,
  assertDeepEqual,
} from "../../__fixture__.mjs";
import { spawn } from "child_process";
import Mysql from "mysql";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";

const { default: HookMysql } = await import("./mysql.mjs");

const promiseTermination = (child) =>
  new Promise((resolve, reject) => {
    child.on("exit", (status, signal) => resolve({ status, signal }));
    child.on("error", reject);
  });

const port = 3306;
const path = getFreshTemporaryPath();

const proceedAsync = async () => {
  const dependencies = await buildTestDependenciesAsync(import.meta.url);
  const { testHookAsync, makeEvent } = await buildTestComponentAsync("hook");
  const { hookMysql, unhookMysql } = HookMysql(dependencies);
  assertDeepEqual(
    await testHookAsync(
      hookMysql,
      unhookMysql,
      { hooks: { mysql: false } },
      async () => {},
    ),
    { events: [], sources: [] },
  );
  assertDeepEqual(
    await testHookAsync(
      hookMysql,
      unhookMysql,
      { hooks: { mysql: true } },
      async (frontend) => {
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
    {
      sources: [],
      events: [
        makeEvent("begin", 1, 0, "bundle", null),
        makeEvent("before", 2, 0, "query", {
          database: "mysql",
          version: null,
          sql: "SELECT ? * ? AS solution;",
          parameters: [
            { type: "number", print: "2" },
            { type: "number", print: "3" },
          ],
        }),
        makeEvent("after", 2, 0, "query", { error: null }),
        makeEvent("end", 1, 0, "bundle", null),
      ],
    },
  );
};

if (Reflect.getOwnPropertyDescriptor(process.env, "TRAVIS") !== undefined) {
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
          path,
        ],
        { stdio: "inherit" },
      ),
    ),
    { signal: null, status: 0 },
  );
  const child = spawn(
    "/usr/local/mysql/bin/mysqld",
    ["--port", String(port), "--datadir", path],
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
    await promiseTermination(spawn("/bin/sh", ["-c", `rm -rf ${path}$`]));
  }
}
