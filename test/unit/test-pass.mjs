import { fork } from "child_process";

const {
  process: { stdout, env },
  JSON,
} = globalThis;

const child = fork(env.TURTLE_TEST, [], { stdio: "inherit" });
child.on("close", (code, signal) => {
  stdout.write(`${JSON.stringify({ code, signal })}${"\n"}`);
});
