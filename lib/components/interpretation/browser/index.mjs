
const global_document = document;

const runScript = (script) => {
  const element = global_document.createElement("script");
  element.type = "text/javascript";
  element.text = script;
  global_document.body.appendChild(element);
};

export default = (dependencies, options) => () => ({runScript});
