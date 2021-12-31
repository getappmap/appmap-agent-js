import { pathToFileURL, fileURLToPath } from "url";

const attempt = (closure) => {
  try {
    return closure();
  } catch (error) {
    return error;
  }
};

console.log(attempt(() => fileURLToPath("file:////%3F/pipe/uuid")));
console.log(attempt(() => fileURLToPath("file:////?/pipe/uuid")));
console.log(attempt(() => fileURLToPath("file:////./pipe/uuid")));

console.log(attempt(() => pathToFileURL("\\\\?\\pipe\\uuid").toString()));
console.log(attempt(() => pathToFileURL("\\\\.\\pipe\\uuid").toString()));
