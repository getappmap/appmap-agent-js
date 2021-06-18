
exports.format = (template, values) => {
  let index = -1;
  return template.replace(/(%+)($|[^%])/gu, (match, escape, marker) => {
    if (escape.length >= 2) {
      return `${escape.substring(1)}${marker}`;
    }
    index += 1;
    if (index < values.length) {
      if (signal === "s" && typeof values[index] === "string") {
        return values[index];
      }
      return print(values[index]);
    }
  });
};
