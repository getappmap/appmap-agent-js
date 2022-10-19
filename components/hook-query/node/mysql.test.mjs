import { spawn } from "child_process";
import { platform as getPlatform } from "node:os";
import { rm as rmAsync } from "fs/promises";
import Mysql from "mysql";
import { assertEqual, assertDeepEqual } from "../../__fixture__.mjs";
import { getUuid } from "../../uuid/random/index.mjs?env=test";
import { toAbsoluteUrl } from "../../url/index.mjs?env=test";
import { getTmpUrl, convertFileUrlToPath } from "../../path/index.mjs?env=test";
import { testHookAsync } from "../../hook-fixture/index.mjs?env=test";
import * as HookMysql from "./mysql.mjs?env=test";

const {
  Reflect: { getOwnPropertyDescriptor },
  process,
  Promise,
  String,
  setTimeout,
  URL,
  undefined,
} = globalThis;

const promiseTermination = (child) =>
  new Promise((resolve, reject) => {
    child.on("exit", (status, signal) => resolve({ status, signal }));
    child.on("error", reject);
  });

const auth = {
  host: "localhost",
  port: 3306,
  user: "root",
  password: "",
};

const proceedAsync = async () => {
  assertDeepEqual(
    await testHookAsync(
      HookMysql,
      { configuration: { hooks: { mysql: false } } },
      async () => {},
    ),
    [],
  );
  assertDeepEqual(
    await testHookAsync(
      HookMysql,
      { configuration: { hooks: { mysql: true } } },
      async () => {
        const connection = Mysql.createConnection(auth);
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
  // TODO: Investigate why it fails on travis/windows
  // > ECONNREFUSED 127.0.0.1:3306
  if (getPlatform() !== "win32") {
    await proceedAsync();
  }
} else if (getPlatform() !== "win32") {
  const url = toAbsoluteUrl(getUuid(), getTmpUrl());
  assertDeepEqual(
    await promiseTermination(
      spawn(
        "/usr/local/mysql/bin/mysqld",
        [
          "--initialize-insecure",
          "--default-authentication-plugin=mysql_native_password",
          "--datadir",
          convertFileUrlToPath(url),
        ],
        { stdio: "inherit" },
      ),
    ),
    { signal: null, status: 0 },
  );
  const child = spawn(
    "/usr/local/mysql/bin/mysqld",
    ["--port", String(auth.port), "--datadir", convertFileUrlToPath(url)],
    { stdio: "inherit" },
  );
  const termination = promiseTermination(child);
  let status = 1,
    signal = null;
  while (status !== 0) {
    await new Promise((resolve) => {
      setTimeout(resolve, 1000);
    });
    ({ status, signal } = await promiseTermination(
      spawn(
        "/usr/local/mysql/bin/mysqladmin",
        [
          "--host",
          "localhost",
          "--port",
          String(auth.port),
          "--user",
          auth.user,
          "status",
        ],
        { stdio: "inherit" },
      ),
    ));
    assertEqual(signal, null);
  }
  try {
    await proceedAsync();
  } finally {
    // SIGKILL leaves stuff in /tmp which prevent next mysqld to run
    child.kill("SIGTERM");
    await termination;
    await rmAsync(new URL(url), { recursive: true });
  }
}
