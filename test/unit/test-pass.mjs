import { fork } from "child_process";
const child = fork(process.env.TURTLE_TEST, [], { stdio: "inherit" });
child.on("close", (code, signal) => {
  process.stdout.write(`${JSON.stringify({ code, signal })}${"\n"}`);
});
