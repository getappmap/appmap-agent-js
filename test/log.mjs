import { stdout } from "node:process";
import Chalk from "chalk";

const { blue: chalkBlue, red: chalkRed, green: chalkGreen } = Chalk;

const compileLog = (transform) => (message) => {
  stdout.write(transform(`${message}\n`));
};

export const logTitle = compileLog(chalkBlue);
export const logFailure = compileLog(chalkRed);
export const logSuccess = compileLog(chalkGreen);
