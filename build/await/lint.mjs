import Eslint from "eslint";

const {Error} = globalThis;

const { ESLint } = Eslint;

const getMessage = ({ message }) => message;

const generateLintFileAsync = (parser) => {
  const eslint = new ESLint({
    overrideConfig: { parser },
  });
  return async ({ path, content }) => {
    const [result] = await eslint.lintText(content, {
      filePath: path,
      warnIgnored: true,
    });
    if (result.errorCount > 0) {
      throw new Error(result.messages.map(getMessage).join("\n"));
    }
    return { path, content };
  };
};

export const lintEspreeFileAsync = generateLintFileAsync("espree");

export const lintBabelFileAsync = generateLintFileAsync("@babel/eslint-parser");
