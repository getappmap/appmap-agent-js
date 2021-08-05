import { strict as Assert } from "assert";
import { spawn } from "child_process";
import { tmpdir } from "os";
import Mysql from "mysql";
import { buildTestAsync } from "../../../src/build.mjs";
import HookMysql from "./mysql.mjs";

const { equal: assertEqual, deepEqual: assertDeepEqual } = Assert;

const promiseTermination = (child) =>
  new Promise((resolve, reject) => {
    child.on("exit", (status, signal) => resolve({ status, signal }));
    child.on("error", reject);
  });

const port = 3307;
const path = `${tmpdir}/${Math.random().toString(36).substring(2)}`;

const proceedAsync = async () => {
  const dependencies = await buildTestAsync({
    ...import.meta,
    deps: ["hook"],
  });
  const {
    hook: { testHookAsync },
  } = dependencies;
  const { hookMysql, unhookMysql } = HookMysql(dependencies);
  assertDeepEqual(
    await testHookAsync(
      hookMysql,
      unhookMysql,
      { conf: { hooks: { mysql: false } } },
      async () => {},
    ),
    [],
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
    [
      {
        type: "send",
        data: {
          type: "event",
          data: {
            type: "before",
            index: 1,
            data: {
              type: "query",
              database: "mysql",
              version: null,
              sql: "SELECT ? * ? AS solution;",
              parameters: [
                { type: "number", print: "2" },
                { type: "number", print: "3" },
              ],
            },
            group: 0,
            time: 0,
          },
        },
      },
      {
        type: "send",
        data: {
          type: "event",
          data: {
            type: "after",
            index: 1,
            data: {
              type: "query",
              error: { type: "null", print: "null" },
            },
            group: 0,
            time: 0,
          },
        },
      },
    ],
  );
};

const testAsync = async () => {
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
      try {
        await termination;
        // assertDeepEqual(await termination, { signal: null, status: 0 });
      } finally {
        assertDeepEqual(
          await promiseTermination(spawn("/bin/sh", ["-c", `rm -rf ${path}$`])),
          {
            signal: null,
            status: 0,
          },
        );
      }
    }
  }
};

testAsync();
